// Dashboard JavaScript
class ClashDashboard {
    constructor() {
        this.charts = {};
        this.data = null;
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.loadData();
        this.setupEventListeners();
        
        // Auto-refresh every 5 minutes
        setInterval(() => this.loadData(), 5 * 60 * 1000);
    }

    setupEventListeners() {
        // Theme toggle
        window.toggleTheme = () => this.toggleTheme();
        
        // Error modal
        window.closeErrorModal = () => this.closeErrorModal();
        
        // Load data
        window.loadData = () => this.loadData();
    }

    async loadData() {
        try {
            this.showLoading();
            
            // Try to load from GitHub Pages data file
            const response = await fetch('./data/logs.json');
            
            if (!response.ok) {
                // If no data file exists, use sample data
                this.data = this.getSampleData();
            } else {
                this.data = await response.json();
            }
            
            this.updateDashboard();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load dashboard data. Using sample data.');
            this.data = this.getSampleData();
            this.updateDashboard();
            this.hideLoading();
        }
    }

    getSampleData() {
        // Sample data structure for demonstration
        return {
            lastUpdated: new Date().toISOString(),
            summary: {
                totalClashes: 45,
                totalXClicks: 12,
                uniqueUsers: 3,
                uniqueProjects: 5,
                dateRange: {
                    start: '2025-06-01',
                    end: '2025-06-30'
                }
            },
            dailyStats: [
                { date: '2025-06-26', clashes: 5, xClicks: 2, users: ['User_001'], projects: ['Project_Alpha'] },
                { date: '2025-06-27', clashes: 8, xClicks: 1, users: ['User_001', 'User_002'], projects: ['Project_Alpha', 'Project_Beta'] },
                { date: '2025-06-28', clashes: 3, xClicks: 0, users: ['User_001'], projects: ['Project_Alpha'] },
                { date: '2025-06-29', clashes: 12, xClicks: 4, users: ['User_001', 'User_003'], projects: ['Project_Alpha', 'Project_Gamma'] },
                { date: '2025-06-30', clashes: 17, xClicks: 5, users: ['User_001', 'User_002', 'User_003'], projects: ['Project_Alpha', 'Project_Beta', 'Project_Gamma'] }
            ],
            userActivity: [
                { user: 'User_001', totalClashes: 25, xClicks: 8, mostActiveProject: 'Project_Alpha', lastActivity: '2025-06-30T12:02:09Z' },
                { user: 'User_002', totalClashes: 12, xClicks: 3, mostActiveProject: 'Project_Beta', lastActivity: '2025-06-30T10:15:22Z' },
                { user: 'User_003', totalClashes: 8, xClicks: 1, mostActiveProject: 'Project_Gamma', lastActivity: '2025-06-30T09:45:11Z' }
            ],
            projectStats: [
                { project: 'Project_Alpha', clashes: 20, xClicks: 7, users: ['User_001', 'User_002'], lastClash: '2025-06-30T12:02:09Z' },
                { project: 'Project_Beta', clashes: 15, xClicks: 3, users: ['User_001', 'User_002', 'User_003'], lastClash: '2025-06-30T11:30:45Z' },
                { project: 'Project_Gamma', clashes: 10, xClicks: 2, users: ['User_001', 'User_003'], lastClash: '2025-06-30T09:45:11Z' }
            ],
            recentEvents: [
                { timestamp: '2025-06-30T12:02:09Z', type: 'x_click', user: 'User_001', project: 'Project_Alpha', action: 'Dialog Close Attempt (Prevented)' },
                { timestamp: '2025-06-30T11:30:45Z', type: 'clash', user: 'User_002', project: 'Project_Beta', action: 'Clash Detected' },
                { timestamp: '2025-06-30T11:15:22Z', type: 'x_click', user: 'User_001', project: 'Project_Alpha', action: 'Dialog Close Attempt (Prevented)' },
                { timestamp: '2025-06-30T10:45:33Z', type: 'clash', user: 'User_003', project: 'Project_Gamma', action: 'Clash Detected' },
                { timestamp: '2025-06-30T09:45:11Z', type: 'clash', user: 'User_003', project: 'Project_Gamma', action: 'Clash Detected' }
            ]
        };
    }

    updateDashboard() {
        this.updateSummaryCards();
        this.updateCharts();
        this.updateTables();
        this.updateLastUpdated();
    }

    updateSummaryCards() {
        const summary = this.data.summary;
        
        document.getElementById('totalClashes').textContent = summary.totalClashes;
        document.getElementById('totalXClicks').textContent = summary.totalXClicks;
        document.getElementById('uniqueUsers').textContent = summary.uniqueUsers;
        document.getElementById('uniqueProjects').textContent = summary.uniqueProjects;
    }

    updateCharts() {
        this.createDailyActivityChart();
        this.createUserActivityChart();
        this.createProjectChart();
        this.createHourlyChart();
    }

    createDailyActivityChart() {
        const ctx = document.getElementById('dailyActivityChart').getContext('2d');
        
        if (this.charts.dailyActivity) {
            this.charts.dailyActivity.destroy();
        }

        const dailyStats = this.data.dailyStats;
        const labels = dailyStats.map(stat => new Date(stat.date).toLocaleDateString());
        const clashData = dailyStats.map(stat => stat.clashes);
        const xClickData = dailyStats.map(stat => stat.xClicks);

        this.charts.dailyActivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Clashes Detected',
                        data: clashData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'X Button Clicks',
                        data: xClickData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createUserActivityChart() {
        const ctx = document.getElementById('userActivityChart').getContext('2d');
        
        if (this.charts.userActivity) {
            this.charts.userActivity.destroy();
        }

        const userActivity = this.data.userActivity;
        const labels = userActivity.map(user => user.user);
        const clashData = userActivity.map(user => user.totalClashes);
        const xClickData = userActivity.map(user => user.xClicks);

        this.charts.userActivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Clashes',
                        data: clashData,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    },
                    {
                        label: 'X Button Clicks',
                        data: xClickData,
                        backgroundColor: '#f59e0b',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createProjectChart() {
        const ctx = document.getElementById('projectChart').getContext('2d');
        
        if (this.charts.project) {
            this.charts.project.destroy();
        }

        const projectStats = this.data.projectStats;
        const labels = projectStats.map(project => project.project);
        const data = projectStats.map(project => project.clashes);

        this.charts.project = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ],
                    borderWidth: 2,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--surface-color')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    createHourlyChart() {
        const ctx = document.getElementById('hourlyChart').getContext('2d');
        
        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        // Generate sample hourly data based on recent events
        const hourlyData = new Array(24).fill(0);
        this.data.recentEvents.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            hourlyData[hour]++;
        });

        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);

        this.charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Activity Count',
                    data: hourlyData,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateTables() {
        this.updateRecentActivityTable();
        this.updateUserStatsTable();
        this.updateProjectStatsTable();
    }

    updateRecentActivityTable() {
        const tbody = document.getElementById('recentActivityBody');
        tbody.innerHTML = '';

        this.data.recentEvents.slice(0, 10).forEach(event => {
            const row = document.createElement('tr');
            const time = new Date(event.timestamp).toLocaleString();
            const actionBadge = event.type === 'x_click' ? 
                '<span class="badge badge-warning">X-Click</span>' : 
                '<span class="badge badge-error">Clash</span>';

            row.innerHTML = `
                <td>${time}</td>
                <td>${event.user}</td>
                <td>${event.project}</td>
                <td>${actionBadge}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateUserStatsTable() {
        const tbody = document.getElementById('userStatsBody');
        tbody.innerHTML = '';

        this.data.userActivity.forEach(user => {
            const row = document.createElement('tr');
            const lastActivity = new Date(user.lastActivity).toLocaleString();

            row.innerHTML = `
                <td><strong>${user.user}</strong></td>
                <td><span class="badge badge-error">${user.totalClashes}</span></td>
                <td><span class="badge badge-warning">${user.xClicks}</span></td>
                <td>${user.mostActiveProject}</td>
                <td>${lastActivity}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateProjectStatsTable() {
        const tbody = document.getElementById('projectStatsBody');
        tbody.innerHTML = '';

        this.data.projectStats.forEach(project => {
            const row = document.createElement('tr');
            const lastClash = new Date(project.lastClash).toLocaleString();
            const userCount = project.users.length;

            row.innerHTML = `
                <td><strong>${project.project}</strong></td>
                <td><span class="badge badge-error">${project.clashes}</span></td>
                <td><span class="badge badge-warning">${project.xClicks}</span></td>
                <td><span class="badge badge-success">${userCount}</span></td>
                <td>${lastClash}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateLastUpdated() {
        const lastUpdated = new Date(this.data.lastUpdated).toLocaleString();
        document.getElementById('lastUpdated').textContent = lastUpdated;
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = this.theme === 'light' ? '🌙' : '☀️';
        }
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').style.display = 'flex';
    }

    closeErrorModal() {
        document.getElementById('errorModal').style.display = 'none';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ClashDashboard();
});

// Chart.js global configuration
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
Chart.defaults.font.size = 12;

// Responsive chart handling
window.addEventListener('resize', () => {
    if (window.dashboard && window.dashboard.charts) {
        Object.values(window.dashboard.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }
});

// Export functions for external use
window.exportData = function(format = 'json') {
    if (!window.dashboard || !window.dashboard.data) {
        alert('No data available to export');
        return;
    }

    const data = window.dashboard.data;
    let content, filename, mimeType;

    switch (format) {
        case 'json':
            content = JSON.stringify(data, null, 2);
            filename = `clash-data-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            break;
        case 'csv':
            content = convertToCSV(data.recentEvents);
            filename = `clash-events-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
            break;
        default:
            alert('Unsupported format');
            return;
    }

    downloadFile(content, filename, mimeType);
};

function convertToCSV(events) {
    const headers = ['Timestamp', 'Type', 'User', 'Project', 'Action'];
    const rows = events.map(event => [
        event.timestamp,
        event.type,
        event.user,
        event.project,
        event.action
    ]);

    return [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
