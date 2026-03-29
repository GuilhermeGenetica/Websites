from __future__ import annotations

import logging
import os
import shutil
from typing import Dict, Iterator, Optional

from core.store_base import BaseObjectStore, StoreObject

logger = logging.getLogger("seqnode.store_disk")


class DiskStore(BaseObjectStore):

    def __init__(self, base_path: str):
        self._base = os.path.abspath(base_path)
        os.makedirs(self._base, exist_ok=True)

    @property
    def backend_name(self) -> str:
        return "disk"

    def _full_path(self, key: str) -> str:
        safe_key = key.lstrip("/")
        return os.path.join(self._base, safe_key)

    def exists(self, key: str) -> bool:
        return os.path.exists(self._full_path(key))

    def put_file(self, local_path: str, key: str, metadata: Optional[Dict[str, str]] = None) -> str:
        dest = self._full_path(key)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if os.path.abspath(local_path) == dest:
            return dest
        shutil.copy2(local_path, dest)
        logger.debug(f"DiskStore: put {local_path} → {dest}")
        return dest

    def get_file(self, key: str, local_path: str) -> str:
        src = self._full_path(key)
        if not os.path.exists(src):
            raise FileNotFoundError(f"DiskStore: key not found: {key}")
        os.makedirs(os.path.dirname(os.path.abspath(local_path)), exist_ok=True)
        if os.path.abspath(src) == os.path.abspath(local_path):
            return local_path
        shutil.copy2(src, local_path)
        return local_path

    def delete(self, key: str) -> bool:
        path = self._full_path(key)
        if os.path.isfile(path):
            os.remove(path)
            return True
        if os.path.isdir(path):
            shutil.rmtree(path)
            return True
        return False

    def list_keys(self, prefix: str = "") -> Iterator[StoreObject]:
        search_root = self._full_path(prefix) if prefix else self._base
        if not os.path.exists(search_root):
            return
        for dirpath, _dirnames, filenames in os.walk(search_root):
            for fname in filenames:
                full = os.path.join(dirpath, fname)
                rel  = os.path.relpath(full, self._base)
                size = os.path.getsize(full)
                yield StoreObject(key=rel, size=size, exists=True)

    def get_url(self, key: str) -> str:
        return f"file://{self._full_path(key)}"

    def stat(self, key: str) -> StoreObject:
        path = self._full_path(key)
        if not os.path.exists(path):
            return StoreObject(key=key, exists=False)
        size = os.path.getsize(path)
        return StoreObject(key=key, size=size, exists=True)
