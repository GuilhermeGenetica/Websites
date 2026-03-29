from __future__ import annotations

import logging
import os
from typing import Any, Dict, Iterator, Optional

from core.store_base import BaseObjectStore, StoreObject

logger = logging.getLogger("seqnode.store_s3")


class S3Store(BaseObjectStore):

    def __init__(self, s3_config: Dict[str, Any], base_prefix: str = ""):
        self._cfg = s3_config
        self._bucket: str = s3_config.get("bucket", "")
        self._base_prefix: str = base_prefix.strip("/")
        self._client = None

    @property
    def backend_name(self) -> str:
        return "s3"

    def _get_client(self):
        if self._client is not None:
            return self._client
        try:
            import boto3
        except ImportError:
            raise RuntimeError("boto3 is required for S3 store. Install with: pip install boto3")

        kwargs: Dict[str, Any] = {}
        if self._cfg.get("endpoint_url"):
            kwargs["endpoint_url"] = self._cfg["endpoint_url"]
        if self._cfg.get("aws_access_key_id"):
            kwargs["aws_access_key_id"]     = self._cfg["aws_access_key_id"]
            kwargs["aws_secret_access_key"] = self._cfg.get("aws_secret_access_key", "")
        region = self._cfg.get("region_name", "")
        if region:
            kwargs["region_name"] = region

        self._client = boto3.client("s3", **kwargs)
        return self._client

    def _full_key(self, key: str) -> str:
        key = key.lstrip("/")
        if self._base_prefix:
            return f"{self._base_prefix}/{key}"
        return key

    def exists(self, key: str) -> bool:
        client = self._get_client()
        full_key = self._full_key(key)
        try:
            client.head_object(Bucket=self._bucket, Key=full_key)
            return True
        except Exception:
            return False

    def put_file(self, local_path: str, key: str, metadata: Optional[Dict[str, str]] = None) -> str:
        client = self._get_client()
        full_key = self._full_key(key)
        extra: Dict[str, Any] = {}
        if metadata:
            extra["Metadata"] = metadata
        content_type = _guess_content_type(local_path)
        if content_type:
            extra["ContentType"] = content_type
        client.upload_file(local_path, self._bucket, full_key, ExtraArgs=extra if extra else None)
        logger.debug(f"S3Store: uploaded {local_path} → s3://{self._bucket}/{full_key}")
        return f"s3://{self._bucket}/{full_key}"

    def get_file(self, key: str, local_path: str) -> str:
        client = self._get_client()
        full_key = self._full_key(key)
        os.makedirs(os.path.dirname(os.path.abspath(local_path)), exist_ok=True)
        client.download_file(self._bucket, full_key, local_path)
        logger.debug(f"S3Store: downloaded s3://{self._bucket}/{full_key} → {local_path}")
        return local_path

    def delete(self, key: str) -> bool:
        client = self._get_client()
        full_key = self._full_key(key)
        try:
            client.delete_object(Bucket=self._bucket, Key=full_key)
            return True
        except Exception as exc:
            logger.warning(f"S3Store: delete failed for key '{full_key}': {exc}")
            return False

    def list_keys(self, prefix: str = "") -> Iterator[StoreObject]:
        client = self._get_client()
        full_prefix = self._full_key(prefix) if prefix else (self._base_prefix + "/" if self._base_prefix else "")
        paginator = client.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=self._bucket, Prefix=full_prefix)
        for page in pages:
            for obj in page.get("Contents", []):
                k   = obj["Key"]
                rel = k[len(self._base_prefix) + 1:] if self._base_prefix and k.startswith(self._base_prefix + "/") else k
                yield StoreObject(key=rel, size=obj.get("Size", 0), exists=True)

    def get_url(self, key: str) -> str:
        full_key = self._full_key(key)
        endpoint = self._cfg.get("endpoint_url", "")
        if endpoint:
            return f"{endpoint.rstrip('/')}/{self._bucket}/{full_key}"
        region = self._cfg.get("region_name", "us-east-1")
        return f"https://{self._bucket}.s3.{region}.amazonaws.com/{full_key}"

    def stat(self, key: str) -> StoreObject:
        client = self._get_client()
        full_key = self._full_key(key)
        try:
            resp = client.head_object(Bucket=self._bucket, Key=full_key)
            return StoreObject(
                key=key,
                size=resp.get("ContentLength", 0),
                content_type=resp.get("ContentType", "application/octet-stream"),
                metadata=resp.get("Metadata", {}),
                exists=True,
            )
        except Exception:
            return StoreObject(key=key, exists=False)

    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        client = self._get_client()
        full_key = self._full_key(key)
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": full_key},
            ExpiresIn=expires_in,
        )


def _guess_content_type(path: str) -> Optional[str]:
    _map = {
        ".bam":   "application/octet-stream",
        ".bai":   "application/octet-stream",
        ".vcf":   "text/plain",
        ".vcf.gz":"application/gzip",
        ".fastq": "text/plain",
        ".fq":    "text/plain",
        ".gz":    "application/gzip",
        ".json":  "application/json",
        ".txt":   "text/plain",
        ".tsv":   "text/tab-separated-values",
        ".csv":   "text/csv",
        ".html":  "text/html",
        ".pdf":   "application/pdf",
        ".png":   "image/png",
        ".svg":   "image/svg+xml",
    }
    lower = path.lower()
    for ext, ct in _map.items():
        if lower.endswith(ext):
            return ct
    return None
