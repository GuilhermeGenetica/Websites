"""
ws_client.py — WebSocket client with reconnect and protocol handling

Protocol (JSON messages):

  Agent → Server:
    {"type": "hello",    "token": "snagt_...", "version": "1.0.0", "info": {...}}
    {"type": "log",      "run_id": "...", "node_id": "...", "level": "info"|"error", "message": "..."}
    {"type": "status",   "run_id": "...", "node_id": "...", "status": "running"|"completed"|"failed", "exit_code": 0}
    {"type": "resource", ...snapshot dict...}
    {"type": "pong"}

  Server → Agent:
    {"type": "auth_ok",  "agent_id": "...", "hmac_secret": "hex"}
    {"type": "auth_err", "reason": "..."}
    {"type": "execute",  "run_id": "...", "node_id": "...", "command": "...",
                         "working_dir": "...", "hmac": "...", "timeout": 0}
    {"type": "cancel",   "run_id": "..."}
    {"type": "ping"}
"""

import asyncio
import json
import logging
import sys
import time
from typing import Callable

import config
import executor
import monitor
import security

logger = logging.getLogger("seqnode.ws")

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
except ImportError:
    logger.error("websockets not installed. Run: pip install websockets")
    sys.exit(1)


class AgentClient:
    def __init__(self, cfg: dict, on_status: Callable[[str], None] | None = None):
        self.cfg       = cfg
        self.on_status = on_status  # callback(status_str) for tray/GUI
        self._stop     = False
        self._ws       = None
        self._agent_id = ""
        self._active_runs: dict[str, asyncio.Task] = {}   # run_id → task

    # ── Public API ────────────────────────────────────────────────────────────

    async def run_forever(self):
        delay_min = float(self.cfg.get("reconnect_delay_min", 2))
        delay_max = float(self.cfg.get("reconnect_delay_max", 60))
        delay     = delay_min

        while not self._stop:
            try:
                self._notify("Connecting…")
                await self._connect_and_loop()
                delay = delay_min          # reset on clean disconnect
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Disconnected ({e}). Reconnecting in {delay:.0f}s…")
                self._notify(f"Reconnecting in {delay:.0f}s")
                await asyncio.sleep(delay)
                delay = min(delay * 2, delay_max)

        self._notify("Stopped")

    def stop(self):
        self._stop = True
        if self._ws:
            asyncio.ensure_future(self._ws.close())

    # ── Internal ──────────────────────────────────────────────────────────────

    async def _connect_and_loop(self):
        url   = self.cfg["server_url"]
        token = self.cfg["token"]
        ws_cfg = self.cfg

        async with websockets.connect(url, ping_interval=None) as ws:
            self._ws = ws
            logger.info(f"Connected to {url}")

            # ── Authenticate ──
            await self._send(ws, {
                "type":    "hello",
                "token":   token,
                "version": config.VERSION,
                "info":    monitor.snapshot(ws_cfg.get("workspace", "")),
            })

            msg = await asyncio.wait_for(ws.recv(), timeout=15)
            pkt = json.loads(msg)

            if pkt.get("type") == "auth_err":
                reason = pkt.get("reason", "?")
                logger.error(f"Auth rejected: {reason}")
                self._notify("Auth failed")
                raise ConnectionError(f"Auth rejected: {reason}")

            if pkt.get("type") != "auth_ok":
                logger.error(f"Unexpected auth response: {pkt}")
                return

            self._agent_id = pkt.get("agent_id", "")
            secret = pkt.get("hmac_secret", "")
            if secret:
                security.set_secret(secret)
            security.set_workspace(ws_cfg.get("workspace", ""))
            self._notify("Connected")
            logger.info(f"Authenticated as agent {self._agent_id}")

            # ── Main loop ──
            ping_interval = float(ws_cfg.get("ping_interval", 30))
            last_ping     = time.monotonic()

            while not self._stop:
                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
                except asyncio.TimeoutError:
                    # Send periodic resource snapshots
                    if time.monotonic() - last_ping >= ping_interval:
                        snap = monitor.snapshot(ws_cfg.get("workspace", ""))
                        snap["type"] = "resource"
                        await self._send(ws, snap)
                        last_ping = time.monotonic()
                    continue
                except ConnectionClosed:
                    break

                pkt = json.loads(raw)
                await self._handle(ws, pkt)

    async def _handle(self, ws, pkt: dict):
        t = pkt.get("type")

        if t == "ping":
            await self._send(ws, {"type": "pong"})

        elif t == "execute":
            await self._handle_execute(ws, pkt)

        elif t == "cancel":
            run_id = pkt.get("run_id", "")
            task = self._active_runs.get(run_id)
            if task and not task.done():
                task.cancel()
                executor.cancel_current()
            await self._send(ws, {
                "type":    "status",
                "run_id":  run_id,
                "node_id": "",
                "status":  "cancelled",
                "exit_code": -1,
            })

        elif t == "browse":
            await self._handle_browse(ws, pkt)

        elif t == "depcheck":
            await self._handle_depcheck(ws, pkt)

        elif t == "scan_plugins":
            await self._handle_scan_plugins(ws, pkt)

        elif t == "write_plugin":
            await self._handle_write_plugin(ws, pkt)

        elif t == "read_file":
            await self._handle_read_file(ws, pkt)

        elif t == "mkdir":
            await self._handle_mkdir(ws, pkt)

        elif t == "rename_file":
            await self._handle_rename_file(ws, pkt)

        elif t == "delete_file":
            await self._handle_delete_file(ws, pkt)

        elif t == "auth_ok":
            pass  # already handled above, ignore if re-sent

        else:
            logger.debug(f"Unknown packet type: {t}")

    async def _handle_execute(self, ws, pkt: dict):
        run_id   = pkt.get("run_id",  "")
        node_id  = pkt.get("node_id", "")
        command  = pkt.get("command", "")
        wdir       = pkt.get("working_dir", "") or self.cfg.get("workspace", ".")
        timeout    = int(pkt.get("timeout", 0))
        sig        = pkt.get("hmac", "")
        run_mode   = pkt.get("run_mode",   "")
        conda_env  = pkt.get("conda_env",  "")
        conda_path = pkt.get("conda_path", "")

        # ── HMAC verification ──
        payload_to_verify = {k: v for k, v in pkt.items() if k not in ("type", "hmac")}
        if sig and not security.verify(payload_to_verify, sig):
            logger.error(f"HMAC verification failed for run={run_id} node={node_id}")
            await self._send(ws, {
                "type": "status", "run_id": run_id, "node_id": node_id,
                "status": "failed", "exit_code": -2,
            })
            await self._log(ws, run_id, node_id, "error", "[agent] Security: HMAC verification failed. Command rejected.")
            return

        # ── Sandbox check ──
        ok, reason = security.command_is_safe(command, wdir)
        if not ok:
            logger.error(f"Sandbox violation: {reason}")
            await self._log(ws, run_id, node_id, "error", f"[agent] Security: {reason}")
            await self._send(ws, {
                "type": "status", "run_id": run_id, "node_id": node_id,
                "status": "failed", "exit_code": -3,
            })
            return

        # ── Execute ──
        await self._send(ws, {
            "type": "status", "run_id": run_id, "node_id": node_id, "status": "running", "exit_code": 0,
        })

        async def on_log(level: str, line: str):
            await self._log(ws, run_id, node_id, level, line)

        async def _run():
            exit_code = await executor.run_command(
                command, wdir, on_log, timeout, run_id, node_id,
                run_mode, conda_env, conda_path,
            )
            status = "completed" if exit_code == 0 else "failed"
            await self._send(ws, {
                "type": "status", "run_id": run_id, "node_id": node_id,
                "status": status, "exit_code": exit_code,
            })
            self._active_runs.pop(run_id, None)

        task = asyncio.create_task(_run())
        self._active_runs[run_id] = task

    async def _handle_depcheck(self, ws, pkt: dict):
        """
        Verify bioinformatics tool installations on THIS machine.
        Server → Agent: {"type": "depcheck", "request_id": "...", "tool_ids": [...], "user_paths": {...}}
        Agent → Server: {"type": "depcheck_result", "request_id": "...", "results": {...}, "summary": {...}}
        """
        import shutil, subprocess, os

        request_id = pkt.get("request_id", "")
        tool_ids   = pkt.get("tool_ids", [])
        user_paths = pkt.get("user_paths", {})  # per-user binary paths from settings

        def _which(name, extra_dirs=None):
            found = shutil.which(name)
            if found:
                return found
            for d in (extra_dirs or []):
                c = os.path.join(os.path.expanduser(d), name)
                if os.path.isfile(c) and os.access(c, os.X_OK):
                    return c
            return None

        def _run_version(cmd, timeout=8):
            try:
                out = subprocess.check_output(
                    cmd, shell=True, text=True, stderr=subprocess.STDOUT,
                    timeout=timeout, executable="/bin/bash"
                ).strip()
                return (out[:300] if out else "installed") or "installed"
            except Exception:
                return None

        def _detect_conda():
            for mgr in ("mamba", "conda"):
                if shutil.which(mgr):
                    return mgr
            return None

        def _conda_envs():
            mgr = _detect_conda()
            if not mgr:
                return []
            try:
                out = subprocess.check_output(
                    [mgr, "env", "list", "--json"], text=True, stderr=subprocess.DEVNULL, timeout=10
                )
                import json as _json
                data = _json.loads(out)
                return [os.path.basename(p) for p in data.get("envs", [])]
            except Exception:
                return []

        results = {}
        for tool_id in tool_ids:
            paths = user_paths.get(tool_id, {})
            extra_dirs = [v for v in [paths.get("bin_path"), paths.get("lib_path")] if v]

            # Basic binary check (tool_id as binary name)
            binary = tool_id.split("/")[-1].split(":")[0]
            binary_path = _which(binary, extra_dirs)
            binary_found = binary_path is not None
            version = _run_version(f"{binary_path or binary} --version 2>&1 | head -1") if binary_found else None

            results[tool_id] = {
                "plugin_id":    tool_id,
                "plugin_name":  tool_id,
                "status":       "ok" if binary_found else "missing",
                "binary":       binary,
                "binary_found": binary_found,
                "binary_path":  binary_path or "",
                "version":      version or "",
                "issues":       [] if binary_found else [f"'{binary}' not found in PATH"],
            }

        conda_mgr  = _detect_conda()
        total      = len(results)
        ok_count   = sum(1 for r in results.values() if r["status"] == "ok")
        missing    = total - ok_count

        await self._send(ws, {
            "type":       "depcheck_result",
            "request_id": request_id,
            "results":    results,
            "summary": {
                "total":          total,
                "ok":             ok_count,
                "partial":        0,
                "missing":        missing,
                "conda_manager":  conda_mgr or "none",
                "available_envs": _conda_envs(),
            },
        })

    async def _handle_scan_plugins(self, ws, pkt: dict):
        """
        Scan a local directory for plugin YAML files and return their contents.
        Server → Agent: {type: scan_plugins, request_id, plugins_dir}
        Agent → Server: {type: scan_plugins_result, request_id, plugins: [{filename, content}], error}
        """
        import os
        request_id  = pkt.get("request_id", "")
        plugins_dir = pkt.get("plugins_dir", "")

        result = {
            "type":       "scan_plugins_result",
            "request_id": request_id,
            "plugins":    [],
            "error":      None,
        }

        try:
            plugins_dir = os.path.expanduser(plugins_dir)
            if not os.path.isdir(plugins_dir):
                result["error"] = f"Directory not found: {plugins_dir}"
                await self._send(ws, result)
                return

            for name in sorted(os.listdir(plugins_dir)):
                if not name.lower().endswith((".yaml", ".yml")):
                    continue
                path = os.path.join(plugins_dir, name)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    result["plugins"].append({"filename": name, "content": content})
                except Exception as e:
                    logger.warning(f"scan_plugins: could not read {path}: {e}")

        except Exception as e:
            result["error"] = str(e)

        await self._send(ws, result)

    async def _handle_write_plugin(self, ws, pkt: dict):
        """
        Write (create or overwrite) a plugin YAML file on the local machine.
        Server → Agent: {type: write_plugin, request_id, plugins_dir, filename, content}
        Agent → Server: {type: write_plugin_result, request_id, success, error}
        """
        import os
        request_id  = pkt.get("request_id", "")
        plugins_dir = pkt.get("plugins_dir", "")
        filename    = pkt.get("filename",    "")
        content     = pkt.get("content",     "")

        result = {
            "type":       "write_plugin_result",
            "request_id": request_id,
            "success":    False,
            "error":      None,
        }

        try:
            plugins_dir = os.path.expanduser(plugins_dir)
            os.makedirs(plugins_dir, exist_ok=True)

            # Sanitize: strip path components to prevent directory traversal
            safe_name = os.path.basename(filename)
            if not safe_name:
                result["error"] = "Invalid filename"
                await self._send(ws, result)
                return

            path = os.path.join(plugins_dir, safe_name)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            result["success"] = True

        except Exception as e:
            result["error"] = str(e)

        await self._send(ws, result)

    async def _handle_read_file(self, ws, pkt: dict):
        """
        Read a single file from the local machine and return its content.
        Server → Agent: {type: read_file, request_id, path}
        Agent → Server: {type: read_file_result, request_id, content, error}
        """
        import os
        request_id = pkt.get("request_id", "")
        path       = pkt.get("path", "")

        result = {
            "type":       "read_file_result",
            "request_id": request_id,
            "content":    None,
            "error":      None,
        }
        try:
            path = os.path.expanduser(path)
            with open(path, "r", encoding="utf-8") as f:
                result["content"] = f.read()
        except Exception as e:
            result["error"] = str(e)

        await self._send(ws, result)

    async def _handle_mkdir(self, ws, pkt: dict):
        """
        Create a directory on the local machine.
        Server → Agent: {type: mkdir, request_id, path}
        Agent → Server: {type: mkdir_result, request_id, success, error}
        """
        import os
        request_id = pkt.get("request_id", "")
        path       = pkt.get("path", "")

        result = {
            "type":       "mkdir_result",
            "request_id": request_id,
            "success":    False,
            "error":      None,
        }
        try:
            path = os.path.expanduser(path)
            os.makedirs(path, exist_ok=True)
            result["success"] = True
        except Exception as e:
            result["error"] = str(e)

        await self._send(ws, result)

    async def _handle_rename_file(self, ws, pkt: dict):
        """
        Rename or move a file/directory on the local machine.
        Server → Agent: {type: rename_file, request_id, old_path, new_path}
        Agent → Server: {type: rename_file_result, request_id, success, error}
        """
        import os
        request_id = pkt.get("request_id", "")
        old_path   = os.path.expanduser(pkt.get("old_path", ""))
        new_path   = os.path.expanduser(pkt.get("new_path", ""))

        result = {"type": "rename_file_result", "request_id": request_id, "success": False, "error": None}
        try:
            os.rename(old_path, new_path)
            result["success"] = True
        except Exception as e:
            result["error"] = str(e)

        await self._send(ws, result)

    async def _handle_delete_file(self, ws, pkt: dict):
        """
        Delete a file or directory on the local machine.
        Server → Agent: {type: delete_file, request_id, path, recursive}
        Agent → Server: {type: delete_file_result, request_id, success, error}
        """
        import os
        import shutil
        request_id = pkt.get("request_id", "")
        path       = os.path.expanduser(pkt.get("path", ""))
        recursive  = pkt.get("recursive", False)

        result = {"type": "delete_file_result", "request_id": request_id, "success": False, "error": None}
        try:
            if os.path.isdir(path):
                if recursive:
                    shutil.rmtree(path)
                else:
                    os.rmdir(path)  # only succeeds if empty
            else:
                os.remove(path)
            result["success"] = True
        except Exception as e:
            result["error"] = str(e)

        await self._send(ws, result)

    async def _handle_browse(self, ws, pkt: dict):
        import os
        request_id    = pkt.get("request_id", "")
        path          = pkt.get("path", "")
        include_files = pkt.get("include_files", False)
        extensions    = pkt.get("extensions", "")

        # Empty path → use configured workspace or home directory
        if not path:
            path = self.cfg.get("workspace", "") or os.path.expanduser("~")

        result = {
            "type":       "browse_result",
            "request_id": request_id,
            "path":       "",
            "parent":     None,
            "entries":    [],
            "files":      [],
        }

        try:
            path = os.path.normpath(path)
            result["path"] = path

            parent = os.path.dirname(path)
            result["parent"] = parent if parent != path else None

            ext_list = [e.strip().lower() for e in extensions.split(",") if e.strip()] if extensions else []

            entries = []
            files   = []
            for name in sorted(os.listdir(path)):
                full = os.path.join(path, name)
                try:
                    if os.path.isdir(full):
                        entries.append({"name": name, "path": full})
                    elif include_files:
                        if not ext_list or any(name.lower().endswith(e) for e in ext_list):
                            files.append({"name": name, "path": full})
                except PermissionError:
                    continue

            result["entries"] = entries
            result["files"]   = files

        except Exception as e:
            result["error"] = str(e)

        await self._send(ws, result)

    async def _log(self, ws, run_id: str, node_id: str, level: str, message: str):
        await self._send(ws, {
            "type":    "log",
            "run_id":  run_id,
            "node_id": node_id,
            "level":   level,
            "message": message,
        })

    @staticmethod
    async def _send(ws, obj: dict):
        try:
            await ws.send(json.dumps(obj))
        except Exception as e:
            logger.debug(f"Send failed: {e}")

    def _notify(self, status: str):
        if self.on_status:
            try:
                self.on_status(status)
            except Exception:
                pass
        logger.info(f"[status] {status}")
