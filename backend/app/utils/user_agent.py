"""Parse User-Agent strings to extract device/browser/OS info."""
from user_agents import parse


def parse_user_agent(ua_string: str) -> dict:
    """Extract structured info from a UA string."""
    if not ua_string:
        return {"device_type": "unknown", "browser": "unknown", "os": "unknown"}

    ua = parse(ua_string)
    if ua.is_mobile:
        device = "mobile"
    elif ua.is_tablet:
        device = "tablet"
    elif ua.is_pc:
        device = "desktop"
    elif ua.is_bot:
        device = "bot"
    else:
        device = "unknown"

    return {
        "device_type": device,
        "browser": ua.browser.family or "unknown",
        "os": ua.os.family or "unknown",
    }
