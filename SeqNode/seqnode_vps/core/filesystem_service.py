import os
import stat
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("seqnode.filesystem")


def normalize_path(path: str) -> str:
    path = os.path.expanduser(path.strip())
    if not os.path.isabs(path):
        path = os.path.abspath(path)
    return os.path.normpath(path)


def path_is_safe(path: str, base: Optional[str] = None) -> bool:
    try:
        resolved = os.path.realpath(normalize_path(path))
        if base:
            base_resolved = os.path.realpath(normalize_path(base))
            return resolved.startswith(base_resolved)
        for forbidden in ["/etc/passwd", "/etc/shadow", "/proc/", "/sys/"]:
            if resolved.startswith(forbidden):
                return False
        return True
    except Exception:
        return False


def list_directory(path: str) -> Dict[str, Any]:
    path = normalize_path(path)
    if not os.path.isdir(path):
        if os.path.exists(path):
            path = os.path.dirname(path)
        else:
            path = "/"
    entries = []
    try:
        for name in sorted(os.listdir(path)):
            if name.startswith("."):
                continue
            full = os.path.join(path, name)
            if os.path.isdir(full):
                entries.append({"name": name, "path": full, "type": "dir"})
    except PermissionError:
        pass
    parent = os.path.dirname(path) if path not in ("/", "") else None
    return {"path": path, "parent": parent, "entries": entries}


def list_directory_with_files(path: str, extensions: Optional[List[str]] = None) -> Dict[str, Any]:
    path = normalize_path(path)
    if not os.path.isdir(path):
        if os.path.exists(path):
            path = os.path.dirname(path)
        else:
            path = "/"
    dirs = []
    files = []
    ext_list = [e.strip().lower() for e in extensions] if extensions else []
    try:
        for name in sorted(os.listdir(path)):
            if name.startswith("."):
                continue
            full = os.path.join(path, name)
            if os.path.isdir(full):
                dirs.append({"name": name, "path": full, "type": "dir"})
            elif os.path.isfile(full):
                if ext_list:
                    name_lower = name.lower()
                    if any(name_lower.endswith(ext) for ext in ext_list):
                        files.append({"name": name, "path": full, "type": "file", "size": os.path.getsize(full)})
                else:
                    files.append({"name": name, "path": full, "type": "file", "size": os.path.getsize(full)})
    except PermissionError:
        pass
    parent = os.path.dirname(path) if path not in ("/", "") else None
    return {"path": path, "parent": parent, "dirs": dirs, "files": files}


def path_exists(path: str) -> Dict[str, Any]:
    path = normalize_path(path)
    exists = os.path.exists(path)
    is_dir = os.path.isdir(path) if exists else False
    is_file = os.path.isfile(path) if exists else False
    return {"path": path, "exists": exists, "is_dir": is_dir, "is_file": is_file}


def path_stat(path: str) -> Dict[str, Any]:
    path = normalize_path(path)
    if not os.path.exists(path):
        return {"path": path, "exists": False}
    st = os.stat(path)
    mode = st.st_mode
    return {
        "path":        path,
        "exists":      True,
        "is_dir":      stat.S_ISDIR(mode),
        "is_file":     stat.S_ISREG(mode),
        "size_bytes":  st.st_size,
        "modified_at": st.st_mtime,
        "permissions": oct(stat.S_IMODE(mode)),
        "readable":    os.access(path, os.R_OK),
        "writable":    os.access(path, os.W_OK),
        "executable":  os.access(path, os.X_OK),
    }


def create_directory(path: str) -> Tuple[bool, Optional[str]]:
    path = normalize_path(path)
    try:
        os.makedirs(path, exist_ok=True)
        return True, None
    except Exception as e:
        return False, str(e)


def create_directories(paths: List[str]) -> Dict[str, Any]:
    created = []
    errors = []
    seen = set()
    for p in paths:
        if not p:
            continue
        normalized = normalize_path(p)
        if normalized in seen:
            continue
        seen.add(normalized)
        ok, err = create_directory(normalized)
        if ok:
            created.append(normalized)
        else:
            errors.append({"path": normalized, "error": err})
    return {"created": created, "errors": errors}