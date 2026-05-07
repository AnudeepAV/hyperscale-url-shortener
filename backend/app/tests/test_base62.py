"""Smoke tests — run with `pytest`."""
import pytest
from app.utils.base62 import encode_base62, decode_base62, generate_random_code


def test_base62_roundtrip():
    for n in [1, 100, 12345, 999_999_999]:
        assert decode_base62(encode_base62(n)) == n


def test_base62_zero():
    assert encode_base62(0) == "0"


def test_random_code_length():
    assert len(generate_random_code(7)) == 7
    assert len(generate_random_code(10)) == 10


def test_random_code_chars():
    code = generate_random_code(100)
    valid = set("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
    assert all(c in valid for c in code)
