#!/usr/bin/env python3
"""
agent_gui.py — SeqNode Agent GUI Launcher
Cross-platform desktop app: Windows · macOS · Linux.

Uses the OS-native ttk theme (Windows: Vista/Aero, macOS: Aqua, Linux: Clam)
with a slightly-tinted gray background. Zero extra UI dependencies.

Build:
  Windows → build-windows.bat
  Linux   → bash build.sh
  macOS   → bash build.sh  (must run on a Mac)
  All CI  → .github/workflows/build-all.yml
"""

import asyncio
import logging
import platform
import queue
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from typing import Optional

import config
import monitor
import ws_client

# ── Metadata ──────────────────────────────────────────────────────────────────

APP_NAME    = "SeqNode Agent"
APP_VERSION = config.VERSION
WIN_W, WIN_H = 700, 540

# ── Platform fonts ────────────────────────────────────────────────────────────

_SYS = platform.system()
_FACE = "Segoe UI" if _SYS == "Windows" else \
        "SF Pro Text" if _SYS == "Darwin" else "Sans"
_MONO = "Consolas"  if _SYS == "Windows" else \
        "SF Mono"   if _SYS == "Darwin"  else "Monospace"

FONT_TITLE   = (_FACE, 14, "bold")
FONT_HEADING = (_FACE, 12, "bold")
FONT_LABEL   = (_FACE, 10)
FONT_VALUE   = (_FACE, 10, "bold")
FONT_MONO    = (_MONO,  9)
FONT_SMALL   = (_FACE,  9)

# ── Color palette (single, fixed — no dark mode) ──────────────────────────────
#
# Slightly-tinted silver gray: not pure white, not graphite.
# Native ttk controls (buttons, entries) use their OS colours automatically.

BG      = "#EAEAEA"   # main frame background
HDR     = "#D5D5D5"   # header bar
SEP     = "#BBBBBB"   # separator lines
TEXT    = "#1A1A1A"   # primary text
MUTED   = "#5C5C5C"   # secondary / label text
LOG_BG  = "#F7F7F7"   # log text area background
LOG_FG  = "#1A1A1A"   # log text foreground
WARN_FG = "#B45309"   # WARNING log lines
ERR_FG  = "#C0392B"   # ERROR / CRITICAL log lines
DOT_ON  = "#27AE60"   # connected indicator
DOT_OFF = "#E74C3C"   # disconnected indicator


# ── Queue logging handler ─────────────────────────────────────────────────────

class _QueueHandler(logging.Handler):
    def __init__(self, q: queue.Queue) -> None:
        super().__init__()
        self._q = q

    def emit(self, record: logging.LogRecord) -> None:
        try:
            self._q.put_nowait(self.format(record))
        except Exception:
            pass


# ── GUI ───────────────────────────────────────────────────────────────────────

class AgentGUI:
    """Main application window."""

    def __init__(self, root: tk.Tk) -> None:
        self.root           = root
        self._running       = False
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread]        = None
        self._client: Optional[ws_client.AgentClient]  = None
        self._log_queue: queue.Queue                    = queue.Queue()
        self._token_visible = False

        self._setup_logging()
        self._build_window()
        self._apply_styles()
        self._build_ui()
        self._load_form_values()
        self._poll_logs()
        self._poll_stats()

    # ── Logging ───────────────────────────────────────────────────────────────

    def _setup_logging(self) -> None:
        handler = _QueueHandler(self._log_queue)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%H:%M:%S",
        ))
        root_log = logging.getLogger()
        root_log.setLevel(logging.INFO)
        root_log.addHandler(handler)

    # ── Window geometry ───────────────────────────────────────────────────────

    def _build_window(self) -> None:
        self.root.title(f"{APP_NAME}  v{APP_VERSION}")
        self.root.resizable(True, True)
        self.root.minsize(580, 460)
        sw, sh = self.root.winfo_screenwidth(), self.root.winfo_screenheight()
        self.root.geometry(f"{WIN_W}x{WIN_H}+{(sw - WIN_W) // 2}+{(sh - WIN_H) // 2}")
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)
        self.root.configure(bg=BG)

    # ── Style ─────────────────────────────────────────────────────────────────

    def _apply_styles(self) -> None:
        """Apply native OS theme with a slightly-tinted gray background."""
        style = ttk.Style(self.root)

        # Pick the best available native theme
        available = style.theme_names()
        for candidate in ("vista", "xpnative", "aqua", "clam", "alt", "default"):
            if candidate in available:
                style.theme_use(candidate)
                break

        # Override only background/foreground colours that don't break native
        # control rendering (buttons and entries keep their OS look)
        style.configure("TFrame",          background=BG)
        style.configure("Header.TFrame",   background=HDR)
        style.configure("Sep.TFrame",      background=SEP)

        style.configure("TLabel",          background=BG,  foreground=TEXT, font=FONT_LABEL)
        style.configure("Muted.TLabel",    background=BG,  foreground=MUTED, font=FONT_LABEL)
        style.configure("Header.TLabel",   background=HDR, foreground=TEXT, font=FONT_TITLE)
        style.configure("HMuted.TLabel",   background=HDR, foreground=MUTED, font=FONT_SMALL)
        style.configure("Heading.TLabel",  background=BG,  foreground=TEXT, font=FONT_HEADING)
        style.configure("Value.TLabel",    background=BG,  foreground=TEXT, font=FONT_VALUE)

        # Notebook tabs
        style.configure("TNotebook",       background=BG,  borderwidth=0)
        style.configure("TNotebook.Tab",   background=HDR, padding=[14, 6], font=FONT_LABEL)
        style.map("TNotebook.Tab",
                  background=[("selected", BG)],
                  foreground=[("selected", TEXT)])

        # Canvas backgrounds match their container
        self._canvas_bg_main = BG
        self._canvas_bg_hdr  = HDR

    # ── UI scaffold ───────────────────────────────────────────────────────────

    def _build_ui(self) -> None:
        # ── Header ────────────────────────────────────────────────────────────
        hdr = ttk.Frame(self.root, style="Header.TFrame", height=50)
        hdr.pack(fill="x", side="top")
        hdr.pack_propagate(False)

        ttk.Label(hdr, text=f"  {APP_NAME}", style="Header.TLabel").pack(
            side="left", pady=8)
        ttk.Label(hdr, text=f"v{APP_VERSION}", style="HMuted.TLabel").pack(
            side="left", pady=14)

        # Status pill (right of header)
        sf = ttk.Frame(hdr, style="Header.TFrame")
        sf.pack(side="right", padx=(0, 12))

        self._dot_cv = tk.Canvas(sf, width=12, height=12,
                                 highlightthickness=0, bg=HDR)
        self._dot_cv.pack(side="left", pady=2)
        self._dot = self._dot_cv.create_oval(1, 1, 11, 11,
                                              fill=DOT_OFF, outline="")

        self._lbl_status = ttk.Label(sf, text="Disconnected",
                                     style="HMuted.TLabel")
        self._lbl_status.pack(side="left", padx=(4, 0))

        # ── Notebook ──────────────────────────────────────────────────────────
        self._nb = ttk.Notebook(self.root)
        self._nb.pack(fill="both", expand=True)

        self._tab_cfg = ttk.Frame(self._nb)
        self._tab_sts = ttk.Frame(self._nb)
        self._tab_log = ttk.Frame(self._nb)

        self._nb.add(self._tab_cfg, text="  Configuration  ")
        self._nb.add(self._tab_sts, text="  Status  ")
        self._nb.add(self._tab_log, text="  Logs  ")

        self._build_tab_config()
        self._build_tab_status()
        self._build_tab_logs()

    # ── Tab: Configuration ────────────────────────────────────────────────────

    def _build_tab_config(self) -> None:
        f = self._tab_cfg
        P = 24

        ttk.Label(f, text="Connection Settings",
                  style="Heading.TLabel").pack(anchor="w", padx=P, pady=(18, 4))
        ttk.Frame(f, style="Sep.TFrame", height=1).pack(
            fill="x", padx=P, pady=(0, 10))

        self._fld_server    = self._entry_field(f, "Server URL (WebSocket)", P)
        self._fld_token     = self._entry_token(f, P)
        self._fld_workspace = self._entry_browse(f, "Workspace folder", P)
        self._fld_label     = self._entry_field(f, "Agent label (optional)", P)

        btn_row = ttk.Frame(f)
        btn_row.pack(fill="x", padx=P, pady=(14, 0))

        ttk.Button(btn_row, text="Save Configuration",
                   command=self._save_config).pack(side="left", padx=(0, 8))
        ttk.Button(btn_row, text="Restore Defaults",
                   command=self._restore_defaults).pack(side="left")

        self._lbl_cfg_info = ttk.Label(f, text="", style="Muted.TLabel")
        self._lbl_cfg_info.pack(anchor="w", padx=P, pady=(6, 0))

    def _entry_field(self, parent: ttk.Frame, label: str, px: int) -> ttk.Entry:
        ttk.Label(parent, text=label, style="Muted.TLabel").pack(
            anchor="w", padx=px, pady=(8, 0))
        e = ttk.Entry(parent, font=FONT_LABEL)
        e.pack(fill="x", padx=px, pady=(2, 0), ipady=3)
        return e

    def _entry_token(self, parent: ttk.Frame, px: int) -> ttk.Entry:
        ttk.Label(parent, text="Agent Token", style="Muted.TLabel").pack(
            anchor="w", padx=px, pady=(8, 0))
        row = ttk.Frame(parent)
        row.pack(fill="x", padx=px, pady=(2, 0))
        e = ttk.Entry(row, font=FONT_LABEL, show="●")
        e.pack(side="left", fill="x", expand=True, ipady=3)
        self._btn_eye = ttk.Button(row, text="👁", width=3,
                                    command=self._toggle_token)
        self._btn_eye.pack(side="left", padx=(4, 0))
        return e

    def _entry_browse(self, parent: ttk.Frame, label: str, px: int) -> ttk.Entry:
        ttk.Label(parent, text=label, style="Muted.TLabel").pack(
            anchor="w", padx=px, pady=(8, 0))
        row = ttk.Frame(parent)
        row.pack(fill="x", padx=px, pady=(2, 0))
        e = ttk.Entry(row, font=FONT_LABEL)
        e.pack(side="left", fill="x", expand=True, ipady=3)
        ttk.Button(row, text="Browse…",
                   command=lambda: self._browse(e)).pack(
            side="left", padx=(4, 0))
        return e

    def _toggle_token(self) -> None:
        self._token_visible = not self._token_visible
        self._fld_token.configure(show="" if self._token_visible else "●")
        self._btn_eye.configure(text="🔒" if self._token_visible else "👁")

    def _browse(self, entry: ttk.Entry) -> None:
        folder = filedialog.askdirectory(title="Select Workspace Folder")
        if folder:
            entry.delete(0, tk.END)
            entry.insert(0, folder)

    # ── Tab: Status ───────────────────────────────────────────────────────────

    def _build_tab_status(self) -> None:
        f = self._tab_sts
        P = 24

        ttk.Label(f, text="Agent Status", style="Heading.TLabel").pack(
            anchor="w", padx=P, pady=(18, 4))
        ttk.Frame(f, style="Sep.TFrame", height=1).pack(
            fill="x", padx=P, pady=(0, 14))

        # Status badge
        badge = ttk.Frame(f)
        badge.pack(anchor="w", padx=P, pady=(0, 12))

        self._big_dot_cv = tk.Canvas(badge, width=18, height=18,
                                      highlightthickness=0, bg=BG)
        self._big_dot_cv.pack(side="left")
        self._big_dot = self._big_dot_cv.create_oval(2, 2, 16, 16,
                                                      fill=DOT_OFF, outline="")
        self._lbl_big = ttk.Label(badge, text="Agent stopped",
                                   font=(_FACE, 11, "bold"),
                                   style="TLabel")
        self._lbl_big.pack(side="left", padx=8)

        # Control buttons
        ctrl = ttk.Frame(f)
        ctrl.pack(anchor="w", padx=P, pady=(0, 18))

        self._btn_start = ttk.Button(ctrl, text="▶  Start Agent",
                                      command=self._start_agent)
        self._btn_start.pack(side="left", padx=(0, 8))

        self._btn_stop = ttk.Button(ctrl, text="■  Stop Agent",
                                     command=self._stop_agent,
                                     state="disabled")
        self._btn_stop.pack(side="left")

        # System stats
        ttk.Frame(f, style="Sep.TFrame", height=1).pack(
            fill="x", padx=P, pady=(0, 8))
        ttk.Label(f, text="System Resources", style="Muted.TLabel").pack(
            anchor="w", padx=P, pady=(0, 6))

        grid = ttk.Frame(f)
        grid.pack(fill="x", padx=P)

        self._stat_vars: dict[str, tk.StringVar] = {}
        rows = [
            ("Hostname",      "hostname"),
            ("OS",            "os"),
            ("CPU usage",     "cpu_pct"),
            ("CPU cores",     "cpu_cores"),
            ("RAM available", "ram_avail_gb"),
            ("RAM total",     "ram_total_gb"),
            ("Disk free",     "disk_free_gb"),
        ]
        for i, (lbl_text, key) in enumerate(rows):
            col, row = (i % 2) * 2, i // 2
            ttk.Label(grid, text=lbl_text + ":",
                      style="Muted.TLabel").grid(
                row=row, column=col, sticky="w", padx=(0, 8), pady=2)
            var = tk.StringVar(value="—")
            self._stat_vars[key] = var
            ttk.Label(grid, textvariable=var,
                      style="Value.TLabel").grid(
                row=row, column=col + 1, sticky="w", padx=(0, 30), pady=2)

    # ── Tab: Logs ─────────────────────────────────────────────────────────────

    def _build_tab_logs(self) -> None:
        f = self._tab_log
        P = 24

        bar = ttk.Frame(f)
        bar.pack(fill="x", padx=P, pady=(14, 4))
        ttk.Label(bar, text="Live Log", style="Heading.TLabel").pack(side="left")
        ttk.Button(bar, text="Clear", command=self._clear_logs).pack(side="right")

        self._log_text = tk.Text(
            f, font=FONT_MONO, relief="flat",
            state="disabled", wrap="word",
            bg=LOG_BG, fg=LOG_FG,
            insertbackground=LOG_FG,
            highlightthickness=1,
            highlightbackground=SEP,
            bd=0, padx=6, pady=6,
        )
        self._log_text.pack(fill="both", expand=True, padx=P, pady=(0, 14))

        self._log_text.tag_config("INFO",     foreground=LOG_FG)
        self._log_text.tag_config("DEBUG",    foreground=MUTED)
        self._log_text.tag_config("WARNING",  foreground=WARN_FG)
        self._log_text.tag_config("ERROR",    foreground=ERR_FG)
        self._log_text.tag_config("CRITICAL", foreground=ERR_FG)

    # ── Config form I/O ───────────────────────────────────────────────────────

    def _load_form_values(self) -> None:
        cfg = config.load()
        for fld, key in (
            (self._fld_server,    "server_url"),
            (self._fld_token,     "token"),
            (self._fld_workspace, "workspace"),
            (self._fld_label,     "label"),
        ):
            fld.delete(0, tk.END)
            fld.insert(0, cfg.get(key, ""))

    def _save_config(self) -> None:
        server    = self._fld_server.get().strip()
        token     = self._fld_token.get().strip()
        workspace = self._fld_workspace.get().strip()
        label     = self._fld_label.get().strip()

        if not server:
            messagebox.showerror("Error", "Server URL is required.")
            return
        if not token:
            messagebox.showerror("Error", "Agent Token is required.")
            return

        cfg = config.load()
        cfg.update(server_url=server, token=token,
                   workspace=workspace or cfg["workspace"], label=label)
        config.save(cfg)

        self._lbl_cfg_info.configure(
            text=f"✔  Saved to {config.CONFIG_FILE}",
            foreground="#27AE60")
        self.root.after(4000, lambda: self._lbl_cfg_info.configure(
            text="", foreground=MUTED))

    def _restore_defaults(self) -> None:
        if not messagebox.askyesno("Restore Defaults",
                                   "Reset all fields to default values?"):
            return
        d = config.DEFAULTS
        self._fld_server.delete(0, tk.END)
        self._fld_server.insert(0, d["server_url"])
        for fld in (self._fld_token, self._fld_label):
            fld.delete(0, tk.END)
        self._fld_workspace.delete(0, tk.END)
        self._fld_workspace.insert(0, d["workspace"])

    # ── Agent lifecycle ───────────────────────────────────────────────────────

    def _start_agent(self) -> None:
        if self._running:
            return
        if not config.is_configured():
            messagebox.showwarning(
                "Not Configured",
                "Please set the Server URL and Agent Token before starting.")
            self._nb.select(0)
            return

        cfg           = config.load()
        self._client  = ws_client.AgentClient(cfg)
        self._loop    = asyncio.new_event_loop()
        self._running = True
        self._thread  = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

        self._set_connected(True)
        self._btn_start.configure(state="disabled")
        self._btn_stop.configure(state="normal")
        self._nb.select(2)
        logging.getLogger("seqnode.gui").info(
            "Agent started → %s", cfg["server_url"])

    def _run_loop(self) -> None:
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._client.run_forever())
        except Exception as exc:
            logging.getLogger("seqnode.gui").error("Agent error: %s", exc)
        finally:
            self._running = False
            self.root.after(0, self._on_agent_stopped)

    def _stop_agent(self) -> None:
        if self._running and self._loop:
            logging.getLogger("seqnode.gui").info("Stopping agent…")
            self._loop.call_soon_threadsafe(self._loop.stop)

    def _on_agent_stopped(self) -> None:
        self._running = False
        self._set_connected(False)
        self._btn_start.configure(state="normal")
        self._btn_stop.configure(state="disabled")
        logging.getLogger("seqnode.gui").info("Agent stopped.")

    def _set_connected(self, connected: bool) -> None:
        color = DOT_ON if connected else DOT_OFF
        label = "Connected"    if connected else "Disconnected"
        big   = "Agent running" if connected else "Agent stopped"
        self._dot_cv.itemconfig(self._dot, fill=color)
        self._big_dot_cv.itemconfig(self._big_dot, fill=color)
        self._lbl_status.configure(text=label)
        self._lbl_big.configure(text=big)

    # ── Periodic polling ──────────────────────────────────────────────────────

    def _poll_logs(self) -> None:
        lines: list[str] = []
        try:
            while True:
                lines.append(self._log_queue.get_nowait())
        except queue.Empty:
            pass

        if lines:
            self._log_text.configure(state="normal")
            for line in lines:
                tag = "INFO"
                for lvl in ("DEBUG", "WARNING", "ERROR", "CRITICAL"):
                    if f"[{lvl}]" in line:
                        tag = lvl
                        break
                self._log_text.insert(tk.END, line + "\n", tag)
            self._log_text.see(tk.END)
            self._log_text.configure(state="disabled")

        self.root.after(100, self._poll_logs)

    def _poll_stats(self) -> None:
        def _fetch() -> None:
            try:
                cfg  = config.load()
                snap = monitor.snapshot(cfg.get("workspace", ""))
                self.root.after(0, lambda: self._update_stats(snap))
            except Exception:
                pass
            self.root.after(5000, self._poll_stats)
        threading.Thread(target=_fetch, daemon=True).start()

    def _update_stats(self, snap: dict) -> None:
        fmts = {
            "hostname":     snap.get("hostname", "—"),
            "os":           snap.get("os", "—"),
            "cpu_pct":      f"{snap.get('cpu_pct', 0):.1f} %",
            "cpu_cores":    str(snap.get("cpu_cores", "—")),
            "ram_avail_gb": f"{snap.get('ram_avail_gb', 0):.2f} GB",
            "ram_total_gb": f"{snap.get('ram_total_gb', 0):.2f} GB",
            "disk_free_gb": f"{snap.get('disk_free_gb', 0):.2f} GB",
        }
        for key, var in self._stat_vars.items():
            var.set(fmts.get(key, "—"))

    def _clear_logs(self) -> None:
        self._log_text.configure(state="normal")
        self._log_text.delete("1.0", tk.END)
        self._log_text.configure(state="disabled")

    # ── Close ─────────────────────────────────────────────────────────────────

    def _on_close(self) -> None:
        if self._running:
            if not messagebox.askyesno("Quit",
                                       "Agent is running. Stop it and quit?"):
                return
            self._stop_agent()
        self.root.destroy()


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    if _SYS == "Windows":
        try:
            import ctypes
            ctypes.windll.user32.ShowWindow(
                ctypes.windll.kernel32.GetConsoleWindow(), 0)
        except Exception:
            pass

    root = tk.Tk()
    AgentGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
