// Show loading overlay before page transition
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all links
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            // Only show loading for internal links
            if (link.href && link.href.startsWith(window.location.origin)) {
                document.getElementById('loading-overlay').classList.add('active');
            }
        });
    });

    // Hide loading overlay when page is fully loaded
    window.addEventListener('load', function() {
        document.getElementById('loading-overlay').classList.remove('active');
    });

    // Start countdown immediately
    startCountdown();

    // Initialize uptime charts for each monitor
    initializeUptimeCharts();

    // Update monitor data every 60 seconds
    setInterval(updateMonitors, 60000);
});

function startCountdown() {
    let timeLeft = 60;
    const countdownElement = document.getElementById('countdown');

    if (!countdownElement) return;

    function updateCountdown() {
        if (timeLeft > 0) {
            timeLeft--;
            countdownElement.textContent = timeLeft;
        } else {
            timeLeft = 60;
        }
    }

    // Update countdown every second
    setInterval(updateCountdown, 1000);
    // Set initial value
    countdownElement.textContent = timeLeft;
}

function initializeUptimeCharts() {
    const charts = {};
    document.querySelectorAll('.uptime-chart').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const monitorId = canvas.dataset.monitorId;
        const isUp = canvas.dataset.status === 'up';

        // Calculate dates for the last 90 days
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);

        // Generate data for last 90 days
        const data = Array(90).fill(null).map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (90 - i));
            return {
                value: isUp ? (Math.random() * 5 + 95) : 0, // 95-100% for up systems, 0% for down
                date: date
            };
        });

        charts[monitorId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    data: data.map(d => ({ x: d.date, y: d.value })),
                    backgroundColor: isUp ? 
                        data.map(d => d.value >= 95 ? '#3bd671' : '#dc3545') : // Green for >=95%, red for <95%
                        '#dc3545', // Red for down systems
                    borderWidth: 0,
                    barPercentage: 1,
                    categoryPercentage: 1,
                    borderRadius: 0
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
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Uptime: ${context.raw.y.toFixed(3)}%`;
                            },
                            title: function(context) {
                                return new Date(context[0].label).toLocaleDateString();
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        display: false,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: false,
                        min: 0,
                        max: 100,
                        grid: {
                            display: false
                        }
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
            uptimeValue.classList.toggle('text-danger', monitor.uptime === 0.000);

            // Update system name
            const systemName = card.querySelector('.h5');
            systemName.textContent = `System ${String(index + 1).padStart(2, '0')}`;
        }
    });
}

function updateSystemStatus(monitors) {
    const operationalCount = monitors.filter(monitor => monitor.status === 'Up').length;
    const totalCount = monitors.length;
    const statusIcon = document.querySelector('.status-icon');
    const statusText = statusIcon.nextElementSibling.querySelector('span');

    if (operationalCount === 0) {
        // All systems down
        statusIcon.className = 'status-icon text-danger me-3';
        statusIcon.querySelector('.live-dot').className = 'live-dot bg-danger';
        statusText.className = 'text-danger';
        statusText.textContent = 'Down';
    } else if (operationalCount < totalCount) {
        // Some systems down
        statusIcon.className = 'status-icon text-warning me-3';
        statusIcon.querySelector('.live-dot').className = 'live-dot bg-warning';
        statusText.className = 'text-warning';
        statusText.textContent = 'Down';
    } else {
        // All systems operational
        statusIcon.className = 'status-icon text-success me-3';
        statusIcon.querySelector('.live-dot').className = 'live-dot bg-success';
        statusText.className = 'text-success';
        statusText.textContent = 'Operational';
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