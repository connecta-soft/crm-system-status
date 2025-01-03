document.addEventListener('DOMContentLoaded', function() {
    // Initialize uptime charts for each monitor
    initializeUptimeCharts();

    // Start countdown timer
    startCountdown();

    // Update monitor data every 60 seconds
    setInterval(updateMonitors, 60000);
});

function startCountdown() {
    let timeLeft = 60;
    const countdownElement = document.getElementById('countdown');

    function updateCountdown() {
        if (timeLeft > 0) {
            timeLeft--;
            countdownElement.textContent = timeLeft;
        } else {
            timeLeft = 60;
        }
    }

    setInterval(updateCountdown, 1000);
}

function initializeUptimeCharts() {
    const charts = {};
    document.querySelectorAll('.uptime-chart').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const monitorId = canvas.dataset.monitorId;

        charts[monitorId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array(180).fill(''),  // 3 months of daily data points
                datasets: [{
                    data: Array(180).fill(100),
                    backgroundColor: '#3bd671',
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
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return `Uptime: ${context.raw}%`;
                            }
                        }
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
            // Update uptime percentage
            const uptimeValue = card.querySelector('.uptime-percentage');
            uptimeValue.textContent = `${monitor.uptime.toFixed(3)}%`;
        }
    });
}

function updateSystemStatus(monitors) {
    const allOperational = monitors.every(monitor => monitor.status === 'Up');
    const statusIcon = document.querySelector('.status-icon');

    if (!allOperational) {
        statusIcon.className = 'status-icon text-warning me-3';
    }
}

function updateLastUpdateTime() {
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        lastUpdate.textContent = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
}