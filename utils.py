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
        "response_times_limit": "1"
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

def fetch_monitor_detail(api_key, monitor_id):
    """
    Fetch detailed monitor data including response times and events
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
        "monitors": monitor_id,
        "custom_uptime_ratios": "1-7-30-90",
        "response_times": "1",
        "response_times_limit": "100",
        "logs": "1",
        "logs_limit": "100"
    }

    try:
        response = requests.post(api_url, headers=headers, data=payload)
        response.raise_for_status()
        data = response.json()

        if not data.get('monitors') or len(data['monitors']) == 0:
            raise ValueError(f"Monitor {monitor_id} not found")

        monitor = data['monitors'][0]

        # Process monitor data
        monitor_data = {
            'id': monitor.get('id'),
            'name': monitor.get('friendly_name', 'Unnamed Monitor'),
            'url': monitor.get('url', ''),
            'status': get_status_text(monitor.get('status')),
            'uptime': float(monitor.get('all_time_uptime_ratio', 0)),
            'last_check': format_timestamp(monitor.get('last_check', 0)),
            'custom_uptime_ranges': process_uptime_ranges(monitor.get('custom_uptime_ranges', '')),
            'response_times': process_response_times(monitor.get('response_times', []))
        }

        # Process events
        events = []
        for log in monitor.get('logs', []):
            event = {
                'type': 'up' if log.get('type') == 2 else 'down',
                'title': 'Running again' if log.get('type') == 2 else 'Down',
                'timestamp': format_timestamp(log.get('datetime')),
                'duration': log.get('duration'),
                'details': log.get('reason') if log.get('reason') else None
            }
            events.append(event)

        return {
            'monitor': monitor_data,
            'events': events
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise

def process_uptime_ranges(ranges_str):
    """Process custom uptime ranges string"""
    if not ranges_str:
        return {
            '1': 100.00,
            '7': 100.00,
            '30': 100.00,
            '90': 100.00
        }

    ranges = ranges_str.split('-')
    return {
        '1': float(ranges[0]) if len(ranges) > 0 else 100.00,
        '7': float(ranges[1]) if len(ranges) > 1 else 100.00,
        '30': float(ranges[2]) if len(ranges) > 2 else 100.00,
        '90': float(ranges[3]) if len(ranges) > 3 else 100.00
    }

def process_response_times(response_times):
    """Process response times array"""
    if not response_times:
        return {
            'avg': 0,
            'min': 0,
            'max': 0,
            'data': []
        }

    times = [rt.get('value', 0) for rt in response_times]
    return {
        'avg': sum(times) / len(times) if times else 0,
        'min': min(times) if times else 0,
        'max': max(times) if times else 0,
        'data': [{'timestamp': rt.get('datetime'), 'value': rt.get('value')} for rt in response_times]
    }

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