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

    // Initialize uptime chart for 90 days if it exists
    const uptimeChart90Days = document.getElementById('uptimeChart90Days');
    if (uptimeChart90Days) {
        const ctx = uptimeChart90Days.getContext('2d');
        const isUp = document.querySelector('.live-dot').classList.contains('bg-success');

        // Calculate dates for the last 90 days
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);

        // Generate data for last 90 days
        const data = Array(90).fill(null).map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (90 - i));
            if (isUp) {
                // Set specific value for January 1st, 2025
                if (date.getMonth() === 0 && date.getDate() === 1 && date.getFullYear() === 2025) {
                    return {
                        value: 89.272,
                        date: date
                    };
                }
                return {
                    value: 100, // Set all other days to 100% for operational systems
                    date: date
                };
            } else {
                return {
                    value: 0, // 0% for down systems
                    date: date
                };
            }
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    data: data.map(d => ({ x: d.date, y: d.value })),
                    backgroundColor: isUp ?
                        data.map(d => d.value >= 95 ? '#3bd671' : '#dc3545') :
                        '#e9ecef',
                    borderWidth: 0,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9,
                    borderRadius: 4
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
                                const value = data[context.dataIndex].value;
                                return `Uptime: ${value.toFixed(3)}%`;
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
    }

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

        // Generate sample data for last 90 days
        const data = Array(90).fill(null).map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (90 - i));

            if (isUp) {
                // Set specific value for January 1st, 2025
                if (date.getMonth() === 0 && date.getDate() === 1 && date.getFullYear() === 2025) {
                    return {
                        value: 89.272,
                        date: date
                    };
                }
                return {
                    value: 100, // Set all other days to 100% for operational systems
                    date: date
                };
            } else {
                return {
                    value: 0, // 0% for down systems
                    date: date
                };
            }
        });

        charts[monitorId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    data: data.map(d => ({ x: d.date, y: d.value })), //Corrected this line
                    backgroundColor: isUp ?
                        data.map(d => d.value >= 95 ? '#3bd671' : '#dc3545') :
                        '#e9ecef',
                    borderWidth: 0,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9,
                    borderRadius: 4
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
                        position: 'nearest',
                        yAlign: 'bottom',
                        xAlign: 'center',
                        callbacks: {
                            label: function(context) {
                                const value = isUp ? data[context.dataIndex].value : 0;
                                const displayValue = value >= 95 ? 100 : value;
                                return `Uptime: ${displayValue.toFixed(3)}%`;
                            },
                            title: function(context) {
                                const date = new Date(context[0].label);
                                return date.toLocaleDateString();
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 10,
                        displayColors: false,
                        caretPadding: 15,
                        caretSize: 0
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