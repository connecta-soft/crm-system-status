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

        // Generate sample data for 3 months (90 days)
        const data = Array(90).fill(null).map(() => null); // Initialize with no data

        charts[monitorId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array(90).fill('').map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (89 - i));
                    return d;
                }),
                datasets: [{
                    data: data,
                    borderWidth: 0,
                    barPercentage: 1,
                    categoryPercentage: 1,
                    backgroundColor: data.map(value => {
                        if (value === null) return '#e9ecef'; // No data
                        if (value < 100) return '#dc3545';    // Partial/Full downtime (red)
                        return '#3bd671';                     // Up (green)
                    })
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
                        enabled: false,
                        mode: 'index',
                        intersect: false,
                        external: function(context) {
                            const tooltip = document.getElementById('custom-tooltip');

                            if (!context.tooltip.opacity) {
                                if (tooltip) {
                                    tooltip.classList.remove('visible');
                                }
                                return;
                            }

                            const position = context.chart.canvas.getBoundingClientRect();
                            const dataPoint = context.tooltip.dataPoints[0];
                            const value = dataPoint.raw;
                            const date = new Date(dataPoint.label);

                            let tooltipEl = tooltip;
                            if (!tooltipEl) {
                                tooltipEl = document.createElement('div');
                                tooltipEl.id = 'custom-tooltip';
                                tooltipEl.className = 'uptime-tooltip';
                                document.body.appendChild(tooltipEl);
                            }

                            const formattedDate = date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            });

                            let status = 'No records';
                            if (value !== null) {
                                status = value === 100 ? '100% operational' : 
                                    `${value}% operational`;
                            }

                            tooltipEl.innerHTML = `
                                <div class="tooltip-title">${formattedDate}</div>
                                <div class="tooltip-body">${status}</div>
                            `;

                            tooltipEl.classList.add('visible');

                            // Position tooltip above the bar
                            const tooltipHeight = tooltipEl.offsetHeight;
                            tooltipEl.style.left = position.left + window.pageXOffset + context.tooltip.caretX + 'px';
                            tooltipEl.style.top = position.top + window.pageYOffset - tooltipHeight - 10 + 'px';
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
                animation: false,
                barThickness: 6,
                maxBarThickness: 6,
                minBarLength: 30
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
            // Update uptime percentage
            const uptimeElement = card.querySelector('.service-uptime');
            if (uptimeElement) {
                uptimeElement.textContent = `${monitor.uptime.toFixed(3)}%`;
            }
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