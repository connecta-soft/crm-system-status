document.addEventListener('DOMContentLoaded', function() {
    // Update monitor data every 60 seconds
    setInterval(updateMonitors, 60000);
});

function updateMonitors() {
    fetch('/api/monitors')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMonitorCards(data.data);
                updateLastUpdateTime();
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
        const card = container.querySelector(`[data-monitor-id="${monitor.id}"]`);
        if (card) {
            // Update status badge
            const badge = card.querySelector('.badge');
            badge.className = `badge bg-${monitor.status_class}`;
            badge.textContent = monitor.status;

            // Update uptime
            const uptimeValue = card.querySelector('.uptime-value');
            uptimeValue.textContent = `${monitor.uptime.toFixed(2)}%`;

            // Update last check time
            const lastCheckValue = card.querySelector('.last-check-value');
            lastCheckValue.textContent = monitor.last_check;
        }
    });
}

function updateLastUpdateTime() {
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        lastUpdate.textContent = new Date().toLocaleString();
    }
}
