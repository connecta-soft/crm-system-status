import requests
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def fetch_monitor_data(api_key):
    """
    Fetch monitor data from UptimeRobot API
    """
    if not api_key:
        raise ValueError("API key not configured")

    api_url = "https://api.uptimerobot.com/v2/getMonitors"
    headers = {
        "content-type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache"
    }
    payload = {
        "api_key": api_key,
        "format": "json",
        "all_time_uptime_ratio": "1",
        "response_times": "1",
        "response_times_limit": "1",
        "custom_uptime_ranges": get_last_3months_ranges()
    }

    try:
        response = requests.post(api_url, headers=headers, data=payload)
        response.raise_for_status()
        data = response.json()

        # Log the response for debugging
        logger.debug(f"API Response: {data}")

        if not data.get('monitors'):
            logger.error("No monitors found in response")
            return []

        processed_monitors = []
        for index, monitor in enumerate(data['monitors'], 1):
            try:
                processed_monitor = {
                    'id': monitor.get('id'),
                    'name': f"System {str(index).zfill(2)}",  # Format: System 01, System 02, etc.
                    'url': monitor.get('url', ''),
                    'status': get_status_text(monitor.get('status')),
                    'uptime': float(monitor.get('all_time_uptime_ratio', 0)),
                    'last_check': format_timestamp(monitor.get('last_check', 0)),
                    'status_class': get_status_class(monitor.get('status'))
                }
                processed_monitors.append(processed_monitor)
            except Exception as e:
                logger.error(f"Error processing monitor {monitor.get('id')}: {str(e)}")
                continue

        return processed_monitors
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise

def get_last_3months_ranges():
    """Generate custom uptime ranges for the last 3 months"""
    from datetime import datetime, timedelta

    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)

    # Format dates as timestamps
    start_timestamp = int(start_date.timestamp())
    end_timestamp = int(end_date.timestamp())

    return f"{start_timestamp}_{end_timestamp}"

def get_status_text(status_code):
    """Convert status code to readable text"""
    status_map = {
        0: "Paused",
        1: "Not checked yet",
        2: "Up",
        8: "Seems down",
        9: "Down"
    }
    return status_map.get(status_code, "Unknown")

def get_status_class(status_code):
    """Get Bootstrap class for status"""
    status_class_map = {
        0: "secondary",  # Paused
        1: "info",       # Not checked
        2: "success",    # Up
        8: "warning",    # Seems down
        9: "danger"      # Down
    }
    return status_class_map.get(status_code, "secondary")

def format_timestamp(timestamp):
    """Format Unix timestamp to readable date"""
    try:
        return datetime.fromtimestamp(int(timestamp)).strftime('%Y-%m-%d %H:%M:%S')
    except (ValueError, TypeError):
        return "N/A"