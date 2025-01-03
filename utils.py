import requests
from datetime import datetime, timedelta
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
        "custom_uptime_ranges": generate_daily_ranges(90)  # Get 90 days of data
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
        for monitor in data['monitors']:
            try:
                processed_monitor = {
                    'id': monitor.get('id'),
                    'name': monitor.get('friendly_name', 'Unnamed Monitor'),
                    'url': monitor.get('url', ''),
                    'status': get_status_text(monitor.get('status')),
                    'uptime': float(monitor.get('all_time_uptime_ratio', 0)),
                    'last_check': format_timestamp(monitor.get('last_check', 0)),
                    'status_class': get_status_class(monitor.get('status')),
                    'daily_status': get_daily_status(monitor.get('custom_uptime_ranges', ''))
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

def generate_daily_ranges(days):
    """Generate custom uptime ranges for the specified number of days"""
    ranges = []
    end_date = datetime.now()
    for i in range(days):
        start_date = end_date - timedelta(days=1)
        ranges.append(f"{int(start_date.timestamp())}-{int(end_date.timestamp())}")
        end_date = start_date
    return "_".join(ranges)

def get_daily_status(custom_ranges):
    """Convert custom uptime ranges to daily status"""
    if not custom_ranges:
        return ['down'] * 90

    daily_status = []
    for uptime in custom_ranges.split('_'):
        try:
            uptime_value = float(uptime)
            daily_status.append('up' if uptime_value >= 99.9 else 'down')
        except ValueError:
            daily_status.append('down')

    return daily_status

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