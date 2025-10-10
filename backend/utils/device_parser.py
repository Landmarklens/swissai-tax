"""
Device Parser Utility
Parses User-Agent headers to extract device, browser, and OS information
"""
from typing import Dict, Optional
from user_agents import parse
import logging

logger = logging.getLogger(__name__)


class DeviceParser:
    """Parse User-Agent strings to extract device information"""

    @staticmethod
    def parse_user_agent(user_agent_string: str) -> Dict[str, Optional[str]]:
        """
        Parse User-Agent string and return device information

        Args:
            user_agent_string: HTTP User-Agent header value

        Returns:
            Dictionary with device information:
            - device_name: e.g., "Chrome on MacOS"
            - device_type: desktop, mobile, tablet
            - browser: Chrome, Safari, Firefox, etc.
            - browser_version: Browser version
            - os: Windows, MacOS, Linux, iOS, Android
            - os_version: OS version
        """
        if not user_agent_string:
            return {
                "device_name": "Unknown Device",
                "device_type": "unknown",
                "browser": "Unknown",
                "browser_version": None,
                "os": "Unknown",
                "os_version": None,
            }

        try:
            # Parse using user-agents library
            user_agent = parse(user_agent_string)

            # Extract browser info
            browser = user_agent.browser.family
            browser_version = user_agent.browser.version_string

            # Extract OS info
            os_name = user_agent.os.family
            os_version = user_agent.os.version_string

            # Determine device type
            if user_agent.is_mobile:
                device_type = "mobile"
            elif user_agent.is_tablet:
                device_type = "tablet"
            elif user_agent.is_pc:
                device_type = "desktop"
            else:
                device_type = "other"

            # Normalize OS names
            os_name = DeviceParser._normalize_os_name(os_name)

            # Normalize browser names
            browser = DeviceParser._normalize_browser_name(browser)

            # Generate friendly device name
            device_name = f"{browser} on {os_name}"
            if device_type == "mobile":
                device_name = f"{browser} on {os_name} (Mobile)"
            elif device_type == "tablet":
                device_name = f"{browser} on {os_name} (Tablet)"

            return {
                "device_name": device_name,
                "device_type": device_type,
                "browser": browser,
                "browser_version": browser_version,
                "os": os_name,
                "os_version": os_version,
            }

        except Exception as e:
            logger.warning(f"Failed to parse user agent: {e}")
            return {
                "device_name": "Unknown Device",
                "device_type": "unknown",
                "browser": "Unknown",
                "browser_version": None,
                "os": "Unknown",
                "os_version": None,
            }

    @staticmethod
    def _normalize_os_name(os_name: str) -> str:
        """Normalize OS names for consistency"""
        os_mapping = {
            "Mac OS X": "MacOS",
            "iOS": "iOS",
            "Android": "Android",
            "Windows": "Windows",
            "Linux": "Linux",
            "Chrome OS": "ChromeOS",
            "Ubuntu": "Linux",
            "Fedora": "Linux",
        }

        for key, value in os_mapping.items():
            if key.lower() in os_name.lower():
                return value

        return os_name

    @staticmethod
    def _normalize_browser_name(browser_name: str) -> str:
        """Normalize browser names for consistency"""
        browser_mapping = {
            "Chrome": "Chrome",
            "Safari": "Safari",
            "Firefox": "Firefox",
            "Edge": "Edge",
            "Opera": "Opera",
            "Brave": "Brave",
            "Chromium": "Chromium",
            "IE": "Internet Explorer",
            "Mobile Safari": "Safari",
            "Chrome Mobile": "Chrome",
            "Firefox Mobile": "Firefox",
            "Samsung Internet": "Samsung Browser",
        }

        for key, value in browser_mapping.items():
            if key.lower() in browser_name.lower():
                return value

        return browser_name


def get_device_info_from_request(request) -> Dict[str, Optional[str]]:
    """
    Extract device information from FastAPI Request object

    Args:
        request: FastAPI Request object

    Returns:
        Dictionary with device information
    """
    user_agent = request.headers.get("user-agent", "")
    return DeviceParser.parse_user_agent(user_agent)
