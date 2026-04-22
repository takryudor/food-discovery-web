"""Unit tests for restaurant service helpers."""

from app.services.restaurant_service import _normalize_search_text


def test_normalize_search_text_removes_vietnamese_accents() -> None:
    assert _normalize_search_text("  Phở  ") == "pho"


def test_normalize_search_text_keeps_ascii_query() -> None:
    assert _normalize_search_text("Cafe") == "cafe"
