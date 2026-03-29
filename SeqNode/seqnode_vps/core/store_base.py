from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Iterator, Optional


@dataclass
class StoreConfig:
    backend: str = "disk"
    disk_base_path: str = ""
    s3_config: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_settings(cls, settings: Dict[str, Any]) -> "StoreConfig":
        store_cfg = settings.get("store", {})
        return cls(
            backend=store_cfg.get("backend", "disk"),
            disk_base_path=store_cfg.get("disk_base_path", settings.get("dirs", {}).get("output", "/data/output")),
            s3_config=store_cfg.get("s3", {}),
        )


@dataclass
class StoreObject:
    key: str
    size: int = 0
    content_type: str = "application/octet-stream"
    metadata: Dict[str, str] = field(default_factory=dict)
    exists: bool = False


class BaseObjectStore(ABC):

    @property
    @abstractmethod
    def backend_name(self) -> str:
        ...

    @abstractmethod
    def exists(self, key: str) -> bool:
        ...

    @abstractmethod
    def put_file(self, local_path: str, key: str, metadata: Optional[Dict[str, str]] = None) -> str:
        ...

    @abstractmethod
    def get_file(self, key: str, local_path: str) -> str:
        ...

    @abstractmethod
    def delete(self, key: str) -> bool:
        ...

    @abstractmethod
    def list_keys(self, prefix: str = "") -> Iterator[StoreObject]:
        ...

    @abstractmethod
    def get_url(self, key: str) -> str:
        ...

    def put_bytes(self, data: bytes, key: str, metadata: Optional[Dict[str, str]] = None) -> str:
        import tempfile, os
        suffix = os.path.splitext(key)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        try:
            return self.put_file(tmp_path, key, metadata)
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    def get_bytes(self, key: str) -> bytes:
        import tempfile, os
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp_path = tmp.name
        try:
            self.get_file(key, tmp_path)
            with open(tmp_path, "rb") as fh:
                return fh.read()
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    def stat(self, key: str) -> StoreObject:
        return StoreObject(key=key, exists=self.exists(key))


def build_store(config: StoreConfig) -> BaseObjectStore:
    if config.backend == "s3":
        from core.store_s3 import S3Store
        return S3Store(config.s3_config, base_prefix=config.disk_base_path)
    from core.store_disk import DiskStore
    return DiskStore(base_path=config.disk_base_path)
