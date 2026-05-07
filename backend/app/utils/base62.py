"""
Base62 encoding for short codes.

INTUITION: We map a unique integer ID -> a 7-char string using [a-zA-Z0-9].
With 62^7 = 3.5 trillion possible codes, we never collide in practice.

Why base62 over UUIDs?
- Short (7 chars vs 36)
- URL-safe
- Sequential IDs from DB are easy to generate and shard
"""
import secrets
import string

ALPHABET = string.digits + string.ascii_letters  # 0-9, A-Z, a-z (62 chars)
BASE = len(ALPHABET)


def encode_base62(num: int) -> str:
    """Convert positive integer to base62 string. O(log n)."""
    if num == 0:
        return ALPHABET[0]
    result = []
    while num > 0:
        num, rem = divmod(num, BASE)
        result.append(ALPHABET[rem])
    return "".join(reversed(result))


def decode_base62(s: str) -> int:
    """Convert base62 string back to integer. O(n)."""
    num = 0
    for char in s:
        num = num * BASE + ALPHABET.index(char)
    return num


def generate_random_code(length: int = 7) -> str:
    """
    Cryptographically random short code — used when not deriving from DB id.
    
    Trade-off: random codes are unpredictable (good for security/enumeration),
    but require collision check against DB. Sequential IDs avoid that lookup.
    """
    return "".join(secrets.choice(ALPHABET) for _ in range(length))
