import os
import logging
from datetime import datetime
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from utils import fetch_monitor_data, fetch_monitor_detail

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "default_secret_key")

# Get API key from environment variable
UPTIMEROBOT_API_KEY = os.environ.get("UPTIMEROBOT_API_KEY")

# Custom template filter for padding numbers
@app.template_filter('zfill')
def zfill_filter(value, width=2):
    return str(value).zfill(width)

@app.route('/')
def index():
    """Render the main status page."""
    try:
        initial_data = fetch_monitor_data(UPTIMEROBOT_API_KEY)
        return render_template('index.html', monitors=initial_data, now=datetime.now())
    except Exception as e:
        logger.error(f"Error fetching initial monitor data: {str(e)}")
        return render_template('index.html', error="Unable to fetch monitor data", now=datetime.now())

@app.route('/monitor/<monitor_id>')
def monitor_detail(monitor_id):
    """Render the detailed monitor view."""
    try:
        monitor_data = fetch_monitor_detail(UPTIMEROBOT_API_KEY, monitor_id)
        logger.debug(f"Monitor detail data: {monitor_data}")  # Add debug logging

        if not monitor_data or 'monitor' not in monitor_data:
            logger.error("No monitor data returned")
            return render_template('monitor_detail.html', error="Unable to fetch monitor details", now=datetime.now())

        return render_template('monitor_detail.html', 
                             monitor=monitor_data['monitor'],
                             events=monitor_data.get('events', []),
                             now=datetime.now())
    except Exception as e:
        logger.error(f"Error fetching monitor detail: {str(e)}")
        return render_template('monitor_detail.html', error="Unable to fetch monitor details", now=datetime.now())

@app.route('/api/monitors')
def get_monitors():
    """API endpoint to fetch monitor data."""
    try:
        monitor_data = fetch_monitor_data(UPTIMEROBOT_API_KEY)
        return jsonify({"success": True, "data": monitor_data})
    except Exception as e:
        logger.error(f"Error fetching monitor data: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/monitor/<monitor_id>')
def get_monitor_detail(monitor_id):
    """API endpoint to fetch detailed monitor data."""
    try:
        monitor_data = fetch_monitor_detail(UPTIMEROBOT_API_KEY, monitor_id)
        return jsonify({"success": True, "data": monitor_data})
    except Exception as e:
        logger.error(f"Error fetching monitor detail: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('index.html', error="Page not found", now=datetime.now()), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('index.html', error="Internal server error", now=datetime.now()), 500