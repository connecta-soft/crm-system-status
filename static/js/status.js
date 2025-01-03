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

        // Calculate dates for the last 3 months
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);

        // Get November 28th date
        const nov28 = new Date(today.getFullYear(), 10, 28); // Month is 0-based, so 10 is November

        // Generate sample data for last 90 days
        const data = Array(90).fill(null).map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (90 - i));

            // Set specific value for January 1st
            if (date.getMonth() === 0 && date.getDate() === 1) {
                return {
                    value: 89.272,
                    date: date
                };
            }

            return {
                value: 95 + (Math.random() * 5), // Generate values between 95-100%
                date: date
            };
        });

        charts[monitorId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    data: data.map(d => d.value),
                    backgroundColor: function(context) {
                        const value = context.raw;
                        const date = new Date(data[context.dataIndex].date);
                        if (date < nov28) {
                            return '#e9ecef'; // Gray for dates before November 28th
                        }
                        return value < 95 ? '#dc3545' : '#3bd671'; // Red if below 95%, green otherwise
                    },
                    borderRadius: 4,
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
                        position: 'nearest',
                        yAlign: 'bottom',
                        xAlign: 'center',
                        callbacks: {
                            label: function(context) {
                                return `Uptime: ${context.raw.toFixed(3)}%`;
                            },
                            title: function(context) {
                                const date = new Date(context[0].label);
                                return date.toLocaleDateString();
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 10,
                        displayColors: false
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
    monitors.forEach((monitor, index) => {
        const card = document.querySelector(`[data-monitor-id="${monitor.id}"]`);
        if (card) {
            // Update uptime percentage
            const uptimeValue = card.querySelector('.uptime-percentage');
            uptimeValue.textContent = `${monitor.uptime.toFixed(3)}%`;

            // Update service name
            const serviceName = card.querySelector('.h5');
            serviceName.textContent = `Service ${String(index + 1).padStart(2, '0')}`;
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