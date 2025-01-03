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

        // Generate sample data for 2 months (60 days)
        const data = Array(60).fill(null).map(() => 
            Math.random() > 0.1 ? 100 : null
        );

        charts[monitorId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array(60).fill('').map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (59 - i));
                    return d;
                }),
                datasets: [{
                    data: data,
                    backgroundColor: '#3bd671',
                    borderWidth: 0,
                    barPercentage: 1,
                    categoryPercentage: 1,
                    backgroundColor: data.map(value => 
                        value === null ? '#e9ecef' : '#3bd671'
                    )
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
                            title: function(tooltipItems) {
                                const date = new Date(tooltipItems[0].label);
                                return date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                });
                            },
                            label: function(context) {
                                const value = context.raw;
                                return value === null ? 'No records' : `${value}% operational`;
                            }
                        },
                        displayColors: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 10,
                        titleFont: {
                            size: 13,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 12
                        },
                        position: 'nearest',
                        external: function(context) {
                            // Remove previous tooltip
                            const previousTooltip = document.getElementById('custom-tooltip');
                            if (previousTooltip) {
                                previousTooltip.remove();
                            }

                            // Get tooltip element
                            const tooltipEl = document.createElement('div');
                            tooltipEl.id = 'custom-tooltip';
                            tooltipEl.className = 'uptime-tooltip';

                            // Set position
                            const position = context.chart.canvas.getBoundingClientRect();
                            tooltipEl.style.left = position.left + window.pageXOffset + context.tooltip.caretX + 'px';
                            tooltipEl.style.top = position.top + window.pageYOffset - 40 + 'px';

                            // Set content
                            const titleLines = context.tooltip.title || [];
                            const bodyLines = context.tooltip.body.map(b => b.lines);

                            let innerHTML = '<div>';
                            titleLines.forEach(title => {
                                innerHTML += `<div class="tooltip-title">${title}</div>`;
                            });
                            bodyLines.forEach(body => {
                                innerHTML += `<div class="tooltip-body">${body}</div>`;
                            });
                            innerHTML += '</div>';

                            tooltipEl.innerHTML = innerHTML;

                            // Add to document
                            document.body.appendChild(tooltipEl);
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
            uptimeElement.textContent = `${monitor.uptime.toFixed(3)}%`;
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