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
        "custom_uptime_ratios": "1-7-30-90",
        "response_times": "1",
        "response_times_limit": "1",
        "logs": "1",
        "logs_limit": "1"
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
                # Get custom uptime ratios
                custom_ratios = monitor.get('custom_uptime_ratio', '').split('-')
                uptime_ranges = {
                    '1': float(custom_ratios[0]) if len(custom_ratios) > 0 else 0.000,
                    '7': float(custom_ratios[1]) if len(custom_ratios) > 1 else 0.000,
                    '30': float(custom_ratios[2]) if len(custom_ratios) > 2 else 0.000,
                    '90': float(custom_ratios[3]) if len(custom_ratios) > 3 else 0.000
                }

                processed_monitor = {
                    'id': monitor.get('id'),
                    'status': get_status_text(monitor.get('status')),
                    'uptime': float(monitor.get('custom_uptime_ratio', '0').split('-')[0]),
                    'last_check': format_timestamp(monitor.get('last_check', 0)),
                    'custom_uptime_ranges': uptime_ranges
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

        # Log the response for debugging
        logger.debug(f"Monitor Detail API Response: {data}")

        if data.get('stat') != 'ok' or not data.get('monitors'):
            logger.error(f"Invalid API response: {data}")
            raise ValueError(f"Invalid response from UptimeRobot API")

        monitor = data['monitors'][0]

        # Get custom uptime ratios
        custom_ratios = monitor.get('custom_uptime_ratio', '').split('-')
        uptime_ranges = {
            '1': float(custom_ratios[0]) if len(custom_ratios) > 0 and custom_ratios[0] else 0.000,
            '7': float(custom_ratios[1]) if len(custom_ratios) > 1 and custom_ratios[1] else 0.000,
            '30': float(custom_ratios[2]) if len(custom_ratios) > 2 and custom_ratios[2] else 0.000,
            '90': float(custom_ratios[3]) if len(custom_ratios) > 3 and custom_ratios[3] else 0.000
        }

        # Process response times
        response_times_data = process_response_times(monitor.get('response_times', []))

        # Process monitor data
        monitor_data = {
            'id': monitor.get('id'),
            'status': get_status_text(monitor.get('status')),
            'uptime': float(custom_ratios[0]) if custom_ratios and custom_ratios[0] else 0.000,
            'last_check': format_timestamp(monitor.get('last_check', 0)),
            'custom_uptime_ranges': uptime_ranges,
            'response_times': response_times_data
        }

        # Process events
        events = process_events(monitor.get('logs', []))

        return {
            'monitor': monitor_data,
            'events': events
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in fetch_monitor_detail: {str(e)}")
        raise

def process_response_times(response_times):
    """Process response times array"""
    if not response_times:
        return {
            'avg': 0.00,
            'min': 0.00,
            'max': 0.00,
            'data': []
        }

    times = [float(rt.get('value', 0)) for rt in response_times if rt.get('value')]

    return {
        'avg': sum(times) / len(times) if times else 0.00,
        'min': min(times) if times else 0.00,
        'max': max(times) if times else 0.00,
        'data': [{'timestamp': rt.get('datetime'), 'value': float(rt.get('value', 0))} for rt in response_times]
    }

def process_events(logs):
    """Process events and calculate durations"""
    events = []
    current_time = int(datetime.now().timestamp())

    for i, log in enumerate(logs):
        event = {
            'type': 'up' if log.get('type') == 2 else 'down',
            'title': get_event_title(log.get('type')),
            'timestamp': format_timestamp(log.get('datetime')),
            'duration': None
        }

        if event['type'] == 'down':
            down_time = log.get('datetime')
            # Look for the next 'up' event in the remaining logs
            up_time = None
            for next_log in logs[i+1:]:
                if next_log.get('type') == 2:  # Type 2 is 'Up'
                    up_time = next_log.get('datetime')
                    break

            # If no 'up' event found, use current time
            if not up_time:
                up_time = current_time

            if down_time and up_time:
                duration_minutes = (up_time - down_time) // 60
                event['duration'] = calculate_duration_text(duration_minutes)

        if log.get('reason'):
            reason = log.get('reason')
            if isinstance(reason, dict):
                event['details'] = f"{reason.get('code', '')}: {reason.get('detail', '')}"
            else:
                event['details'] = str(reason)

        events.append(event)
    return events

def get_event_title(event_type):
    """Get event title based on type"""
    event_titles = {
        1: "Down",  # Monitor Started
        2: "Running again",  # Up
        99: "Down",  # Down
        98: "Up",  # Started
    }
    return event_titles.get(event_type, "Unknown")

def calculate_duration_text(minutes):
    """Calculate human-readable duration text"""
    if minutes < 60:
        return f"{minutes} min"

    hours = minutes // 60
    remaining_minutes = minutes % 60

    if hours < 24:
        return f"{hours}h, {remaining_minutes}min"

    days = hours // 24
    remaining_hours = hours % 24

    if remaining_hours == 0:
        return f"{days} days"
    return f"{days} days, {remaining_hours}h"

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
    """Format Unix timestamp to readable date without seconds"""
    try:
        return datetime.fromtimestamp(int(timestamp)).strftime('%Y-%m-%d %H:%M')
    except (ValueError, TypeError):
        return "N/A"