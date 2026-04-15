from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any


@dataclass
class _CacheItem:
	value: Any
	expires_at: float


_CACHE: dict[str, _CacheItem] = {}


def cache_get(key: str) -> Any | None:
	"""
	Cache TTL rất nhỏ chạy trong RAM (in-memory).

	- Đủ dùng cho đồ án / chạy 1 instance.
	- Nếu scale nhiều instance, nên chuyển cache sang Redis để các instance dùng chung.
	"""
	item = _CACHE.get(key)
	if not item:
		return None
	if time.time() >= item.expires_at:
		_CACHE.pop(key, None)
		return None
	return item.value


def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
	_CACHE[key] = _CacheItem(value=value, expires_at=time.time() + ttl_seconds)


def cache_clear(key: str) -> None:
	_CACHE.pop(key, None)

