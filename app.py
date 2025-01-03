import os
import logging
from flask import Flask, render_template, jsonify
from utils import fetch_monitor_data

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "default_secret_key")

# Get API key from environment variable
UPTIMEROBOT_API_KEY = os.environ.get("UPTIMEROBOT_API_KEY")

@app.route('/')
def index():
    """Render the main status page."""
    try:
        initial_data = fetch_monitor_data(UPTIMEROBOT_API_KEY)
        return render_template('index.html', monitors=initial_data)
    except Exception as e:
        logger.error(f"Error fetching initial monitor data: {str(e)}")
        return render_template('index.html', error="Unable to fetch monitor data")

@app.route('/api/monitors')
def get_monitors():
    """API endpoint to fetch monitor data."""
    try:
        monitor_data = fetch_monitor_data(UPTIMEROBOT_API_KEY)
        return jsonify({"success": True, "data": monitor_data})
    except Exception as e:
        logger.error(f"Error fetching monitor data: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('index.html', error="Page not found"), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('index.html', error="Internal server error"), 500
