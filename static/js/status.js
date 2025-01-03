document.addEventListener('DOMContentLoaded', function() {
    // Initialize uptime charts for each monitor
    initializeUptimeCharts();

    // Start countdown timer
    startUpdateCountdown();

    // Update monitor data every 60 seconds
    setInterval(() => {
        updateMonitors();
        startUpdateCountdown();
    }, 60000);
});

function initializeUptimeCharts() {
    const charts = {};
    document.querySelectorAll('.uptime-chart').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const monitorId = canvas.dataset.monitorId;

        charts[monitorId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array(24).fill(''),
                datasets: [{
                    data: Array(24).fill(100),
                    backgroundColor: '#28a745',
                    borderWidth: 0,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false,
                        min: 0,
                        max: 100
                    }
                },
                animation: false
            }
        });
    });
    return charts;
}

function startUpdateCountdown() {
    let countdown = 60;
    const nextUpdateElement = document.getElementById('next-update');

    // Clear any existing interval
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }

    // Update countdown every second
    window.countdownInterval = setInterval(() => {
        countdown--;
        if (nextUpdateElement) {
            nextUpdateElement.textContent = countdown;
        }
        if (countdown <= 0) {
            clearInterval(window.countdownInterval);
        }
    }, 1000);
}

function updateMonitors() {
    fetch('/api/monitors')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMonitorCards(data.data);
                updateSystemStatus(data.data);
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
    monitors.forEach(monitor => {
        const card = document.querySelector(`[data-monitor-id="${monitor.id}"]`);
        if (card) {
            // Update status badge
            const badge = card.querySelector('.status-badge');
            badge.className = `status-badge badge bg-${monitor.status_class}`;
            badge.textContent = monitor.status;

            // Update uptime percentage
            const uptimeValue = card.querySelector('.uptime-percentage .h4');
            uptimeValue.textContent = `${monitor.uptime.toFixed(2)}%`;
        }
    });
}

function updateSystemStatus(monitors) {
    const allOperational = monitors.every(monitor => monitor.status === 'Up');
    const statusIcon = document.querySelector('.status-icon');
    const statusTitle = document.querySelector('.overall-status h2');

    if (allOperational) {
        statusIcon.className = 'status-icon text-success me-3';
        statusTitle.textContent = 'All Systems Operational';
    } else {
        statusIcon.className = 'status-icon text-warning me-3';
        statusTitle.textContent = 'Partial System Outage';
    }
}

function updateLastUpdateTime() {
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
}