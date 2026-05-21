"""Verify Supabase access tokens (ES256 JWKS or legacy HS256 secret)."""

from __future__ import annotations

import time

import httpx
from jose import JWTError, jwk, jwt

from app.core.config import get_settings

_JWKS_CACHE: dict | None = None
_JWKS_CACHE_AT = 0.0
_JWKS_TTL_SECONDS = 3600


def _supabase_jwks_url() -> str | None:
	settings = get_settings()
	if not settings.supabase_url:
		return None
	return f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _load_jwks() -> dict:
	global _JWKS_CACHE, _JWKS_CACHE_AT

	now = time.time()
	if _JWKS_CACHE is not None and now - _JWKS_CACHE_AT < _JWKS_TTL_SECONDS:
		return _JWKS_CACHE

	jwks_url = _supabase_jwks_url()
	if not jwks_url:
		raise JWTError("SUPABASE_URL_NOT_CONFIGURED")

	with httpx.Client(timeout=10.0) as client:
		response = client.get(jwks_url)
		response.raise_for_status()
		_JWKS_CACHE = response.json()
		_JWKS_CACHE_AT = now
		return _JWKS_CACHE


def _decode_with_jwks(token: str) -> dict:
	header = jwt.get_unverified_header(token)
	kid = header.get("kid")
	algorithm = header.get("alg")
	if not algorithm:
		raise JWTError("JWT_ALG_MISSING")

	jwks = _load_jwks()
	matching_key = None
	for key in jwks.get("keys", []):
		if kid is None or key.get("kid") == kid:
			matching_key = key
			break

	if matching_key is None:
		raise JWTError("JWK_NOT_FOUND")

	public_key = jwk.construct(matching_key)
	return jwt.decode(
		token,
		public_key,
		algorithms=[algorithm],
		audience="authenticated",
	)


def decode_supabase_access_token(token: str) -> dict:
	"""Decode and validate a Supabase Auth access token."""
	settings = get_settings()
	header = jwt.get_unverified_header(token)
	algorithm = header.get("alg", settings.supabase_jwt_algorithm)

	if algorithm in {"ES256", "RS256"}:
		return _decode_with_jwks(token)

	if not settings.supabase_jwt_secret:
		raise JWTError("SUPABASE_JWT_SECRET_NOT_CONFIGURED")

	return jwt.decode(
		token,
		settings.supabase_jwt_secret,
		algorithms=[settings.supabase_jwt_algorithm],
		audience="authenticated",
	)
