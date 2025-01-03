document.addEventListener('DOMContentLoaded', function() {
    // Update monitor data every 60 seconds
    setInterval(updateMonitors, 60000);
    // Update countdown every second
    setInterval(updateCountdown, 1000);

    let countdown = 60;
});

function updateCountdown() {
    countdown = countdown > 0 ? countdown - 1 : 60;
    const countdownElement = document.getElementById('next-update-countdown');
    if (countdownElement) {
        countdownElement.textContent = countdown;
    }
}

function updateMonitors() {
    fetch('/api/monitors')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMonitorCards(data.data);
                countdown = 60;
            } else {
                console.error('Error fetching monitor data:', data.error);
            }
        })
        .catch(error => {
            console.error('Failed to fetch monitor data:', error);
        });
}

function updateMonitorCards(monitors) {
    const container = document.getElementById('monitors-container');

    monitors.forEach(monitor => {
        const row = container.querySelector(`[data-monitor-id="${monitor.id}"]`);
        if (row) {
            // Update status dot
            const statusDot = row.querySelector('.status-dot');
            statusDot.className = `status-dot ${monitor.status === 'Up' ? 'bg-success' : 'bg-danger'}`;

            // Update uptime percentage
            const uptimeElement = row.querySelector('.uptime-percentage');
            uptimeElement.textContent = `${monitor.uptime.toFixed(3)}%`;

            // Update timeline segments
            const timeline = row.querySelector('.timeline');
            if (timeline) {
                const segments = timeline.querySelectorAll('.timeline-segment');
                segments.forEach(segment => {
                    segment.className = `timeline-segment ${monitor.status === 'Up' ? 'up' : 'down'}`;
                });
            }
        }
    });
}