// Enhanced Dashboard JavaScript for Append-Only Data System
class ClashDashboard {
    constructor() {
        this.charts = {};
        this.data = null;
        this.theme = localStorage.getItem('theme') || 'light';
        this.currentPage = 1;
        this.eventsPerPage = 50;
        this.dateFilter = this.getInitialFilter();
        this.filteredData = null;
        this.previousData = null; // 🆕 Track previous data for trend calculation
        this.init();
    }

    init() {
        this.applyTheme();
        this.loadData();
        this.setupEventListeners();
        this.setupFilters();
        this.populateProjectSelector();
        
        // Auto-refresh every 5 minutes for append-only updates
        setInterval(() => this.loadData(), 5 * 60 * 1000);
        
        // Show system status
        this.showSystemStatus();
    }

    getInitialFilter() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('filter') || 'all';
    }

    setupEventListeners() {
        window.toggleTheme = () => this.toggleTheme();
        window.closeErrorModal = () => this.closeErrorModal();
        window.loadData = () => this.loadData();
        
        // Pagination events
        window.nextPage = () => this.nextPage();
        window.prevPage = () => this.prevPage();
        window.goToPage = (page) => this.goToPage(page);
        
        // Filter events  
        window.filterByDate = (filter) => this.filterByDate(filter);
        
        // Global dashboard reference
        window.dashboard = this;
    }

    setupFilters() {
        const filterSelect = document.getElementById('dateFilter');
        if (filterSelect) {
            filterSelect.value = this.dateFilter;
        }
    }

    showSystemStatus() {
        const statusBanner = document.getElementById('systemStatus');
        const statusIcon = document.getElementById('statusIcon');
        const statusText = document.getElementById('statusText');
        
        if (statusBanner && statusIcon && statusText) {
            statusIcon.textContent = '🔄';
            statusText.textContent = 'Append-only system active - data is continuously accumulated';
            statusBanner.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusBanner.style.display = 'none';
            }, 5000);
        }
    }

    async loadData() {
        try {
            this.showLoading();
            
            // Store previous data for trend calculation
            this.previousData = this.data ? JSON.parse(JSON.stringify(this.data)) : null;
            
            // Add cache busting to ensure fresh data
            const timestamp = new Date().getTime();
            const response = await fetch(`./data/logs.json?t=${timestamp}`);
            
            if (!response.ok) {
                // If no data file exists, use sample data
                this.data = this.getSampleData();
            } else {
                this.data = await response.json();
            }
            
            // Show enhanced data statistics
            this.showEnhancedDataStatistics();
            
            // Apply current filter
            this.applyDateFilter();
            
            this.updateDashboard();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load dashboard data. Using sample data.');
            this.data = this.getSampleData();
            this.applyDateFilter();
            this.updateDashboard();
            this.hideLoading();
        }
    }

    showEnhancedDataStatistics() {
        if (!this.data) return;
        
        const stats = this.calculateDataStatistics();
        console.log('📊 Dashboard Data Statistics:', stats);
        
        // Update header subtitle with enhanced info
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) {
            const totalEvents = this.data.recentEvents ? this.data.recentEvents.length : 0;
            const dateRange = this.getDateRange();
            subtitle.textContent = `Total number of events collected| ${totalEvents.toLocaleString()} events | ${dateRange}`;
        }

        // Update footer stats with growth info
        const footerStats = document.getElementById('footerStats');
        if (footerStats && this.data.recentEvents) {
            const growth = this.calculateGrowthRate();
            footerStats.textContent = `${this.data.recentEvents.length.toLocaleString()} events | ${growth}`;
        }

        // Show data growth notice for large datasets
        this.checkDataGrowthNotice();
    }

    calculateGrowthRate() {
        if (!this.previousData || !this.data) {
            return 'Growth tracking enabled';
        }

        const currentEvents = this.data.recentEvents?.length || 0;
        const previousEvents = this.previousData.recentEvents?.length || 0;
        const growth = currentEvents - previousEvents;

        if (growth > 0) {
            return `+${growth} events since last refresh`;
        } else if (growth === 0) {
            return 'No new events';
        } else {
            return 'Data cleaned/filtered';
        }
    }
    populateProjectSelector() {
    const selector = document.getElementById('projectSelector');
    if (!selector || !this.data) return;
    
    // Clear existing options except the first one
    selector.innerHTML = '<option value="">-- Select a Project --</option>';
    
    // Get unique projects sorted by clash count
    const projects = this.data.projectStats || [];
    const sortedProjects = projects.sort((a, b) => b.clashes - a.clashes);
    
    sortedProjects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.project;
        option.textContent = `${project.project} (${project.clashes} clashes, ${project.xClicks} x-clicks)`;
        selector.appendChild(option);
    });
}

loadProjectDetails(projectName) {
    if (!projectName) {
        // Hide details if no project selected
        document.getElementById('projectStats').style.display = 'none';
        document.getElementById('projectClashesContainer').style.display = 'none';
        document.getElementById('noProjectSelected').style.display = 'block';
        return;
    }
    
    // Show loading state
    document.getElementById('noProjectSelected').style.display = 'none';
    document.getElementById('projectStats').style.display = 'block';
    document.getElementById('projectClashesContainer').style.display = 'block';
    
    // Filter events for this project
    const projectEvents = this.data.recentEvents.filter(event => 
        event.project === projectName
    );
    
    // Get project statistics
    const projectStat = this.data.projectStats.find(p => p.project === projectName);
    
    // Update statistics cards
    this.updateProjectStatistics(projectName, projectEvents, projectStat);
    
    // Update clashes table
    this.updateProjectClashesTable(projectEvents);
}

updateProjectStatistics(projectName, events, projectStat) {
    // Calculate statistics
    const clashes = events.filter(e => e.type === 'clash').length;
    const xClicks = events.filter(e => e.type === 'x_click').length;
    const users = [...new Set(events.map(e => e.user))];
    const lastEvent = events.length > 0 ? events[0] : null;
    
    // Update the cards
    document.getElementById('projectTotalClashes').textContent = clashes;
    document.getElementById('projectTotalXClicks').textContent = xClicks;
    document.getElementById('projectActiveUsers').textContent = users.length;
    
    if (lastEvent) {
        const lastDate = new Date(lastEvent.timestamp);
        document.getElementById('projectLastActivity').textContent = lastDate.toLocaleString();
    } else {
        document.getElementById('projectLastActivity').textContent = 'No activity';
    }
}

updateProjectClashesTable(events) {
    const tbody = document.getElementById('projectClashesBody');
    tbody.innerHTML = '';
    
    if (events.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No clash events found for this project
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort events by timestamp (newest first)
    const sortedEvents = events.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    sortedEvents.forEach(event => {
        const row = document.createElement('tr');
        const time = new Date(event.timestamp).toLocaleString();
        
        // Type badge
        const typeBadge = event.type === 'clash' ? 
            '<span class="badge badge-error">CLASH</span>' : 
            '<span class="badge badge-warning">X-CLICK</span>';
        
        // Format element info
        let elementDisplay = 'N/A';
        if (event.elementInfo) {
            const idMatch = event.elementInfo.match(/ID:\s*(\d+)/);
            const categoryMatch = event.elementInfo.match(/Category:\s*([^,)]+)/);
            if (idMatch || categoryMatch) {
                elementDisplay = `<strong>ID: ${idMatch ? idMatch[1] : 'N/A'}</strong><br>
                                 <small>${categoryMatch ? categoryMatch[1] : ''}</small>`;
            } else {
                elementDisplay = event.elementInfo;
            }
        } else if (event.type === 'x_click') {
            elementDisplay = '<span style="color: var(--text-secondary);">Dialog close attempt</span>';
        }
        
        // Format clashing elements
        let clashDisplay = 'N/A';
        if (event.clashingElements && event.clashingElements.length > 0) {
            const count = event.clashingElements.length;
            clashDisplay = `<strong>${count} element${count > 1 ? 's' : ''}</strong><br>`;
            // Show first element
            const firstElement = event.clashingElements[0];
            const idMatch = firstElement.match(/ID:\s*(\d+)/);
            clashDisplay += `<small>${idMatch ? 'ID: ' + idMatch[1] : firstElement.substring(0, 50)}</small>`;
            if (count > 1) {
                clashDisplay += `<br><small style="color: var(--text-secondary);">+${count - 1} more</small>`;
            }
        } else if (event.type === 'x_click') {
            clashDisplay = '-';
        }
        
        row.innerHTML = `
            <td>${time}</td>
            <td><strong>${event.user}</strong></td>
            <td>${typeBadge}</td>
            <td>${elementDisplay}</td>
            <td>${clashDisplay}</td>
        `;
        
        // Add hover effect
        row.style.cursor = 'pointer';
        row.title = 'Click for details';
        
        // Add click handler for clash events
        if (event.type === 'clash' && event.elementInfo) {
            row.onclick = () => this.showProjectClashDetails(event);
        }
        
        tbody.appendChild(row);
    });
}

showProjectClashDetails(event) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    let clashList = '';
    if (event.clashingElements && event.clashingElements.length > 0) {
        clashList = event.clashingElements.map((el, idx) => 
            `<li style="margin: 8px 0; padding: 8px; background: var(--background-color); 
                       border-radius: 4px; font-family: monospace;">${idx + 1}. ${el}</li>`
        ).join('');
    } else {
        clashList = '<li>No clashing elements recorded</li>';
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>🚨 Clash Details - ${event.project}</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <strong>Time:</strong> ${new Date(event.timestamp).toLocaleString()}
                    </div>
                    <div>
                        <strong>User:</strong> ${event.user}
                    </div>
                </div>
                
                <div style="padding: 1rem; background: var(--background-color); border-radius: 8px; margin-bottom: 1rem;">
                    <h4 style="color: var(--danger-color); margin-bottom: 0.5rem;">📍 Element That Clashed</h4>
                    <pre style="font-family: monospace; white-space: pre-wrap; margin: 0;">${event.elementInfo || 'No information available'}</pre>
                </div>
                
                <div style="padding: 1rem; background: var(--background-color); border-radius: 8px;">
                    <h4 style="color: var(--warning-color); margin-bottom: 0.5rem;">⚠️ Clashing With (${event.clashingElements?.length || 0} elements)</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${clashList}
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

    checkDataGrowthNotice() {
        const totalEvents = this.data?.recentEvents?.length || 0;
        const dayCount = this.data?.dailyStats?.length || 0;
        const growthNotice = document.getElementById('dataGrowthNotice');
        const eventCountSpan = document.getElementById('eventCount');
        const dayCountSpan = document.getElementById('dayCount');
        
        if (totalEvents > 1000 && growthNotice) {
            eventCountSpan.textContent = totalEvents.toLocaleString();
            dayCountSpan.textContent = dayCount.toLocaleString();
            growthNotice.classList.remove('hidden');
        } else if (growthNotice) {
            growthNotice.classList.add('hidden');
        }
    }

    calculateDataStatistics() {
        if (!this.data) return {};
        
        const events = this.data.recentEvents || [];
        const dailyStats = this.data.dailyStats || [];
        
        return {
            totalEvents: events.length,
            totalDays: dailyStats.length,
            totalClashes: this.data.summary?.totalClashes || 0,
            totalXClicks: this.data.summary?.totalXClicks || 0,
            uniqueUsers: this.data.summary?.uniqueUsers || 0,
            uniqueProjects: this.data.summary?.uniqueProjects || 0,
            dateRange: this.getDateRange(),
            dataSize: JSON.stringify(this.data).length,
            avgEventsPerDay: events.length > 0 && dailyStats.length > 0 ? (events.length / dailyStats.length).toFixed(1) : 0
        };
    }

    getDateRange() {
        if (!this.data?.recentEvents?.length) return 'No data';
        
        const events = this.data.recentEvents;
        const dates = events.map(e => new Date(e.timestamp)).sort();
        const start = dates[0];
        const end = dates[dates.length - 1];
        
        if (this.isSameDay(start, end)) {
            return start.toLocaleDateString();
        }
        
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()} (${daysDiff} days)`;
    }

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    filterByDate(filter) {
        this.dateFilter = filter;
        this.currentPage = 1;
        this.applyDateFilter();
        this.updateDashboard();
        
        // Update URL to remember filter
        const url = new URL(window.location);
        if (filter === 'all') {
            url.searchParams.delete('filter');
        } else {
            url.searchParams.set('filter', filter);
        }
        window.history.replaceState({}, '', url);
    }

    applyDateFilter() {
        if (!this.data) return;
        
        let cutoffDate = null;
        const now = new Date();
        
        switch (this.dateFilter) {
            case '30days':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90days':
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1year':
                cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = null;
        }
        
        // Clone original data
        this.filteredData = JSON.parse(JSON.stringify(this.data));
        
        if (cutoffDate) {
            // Filter events
            this.filteredData.recentEvents = this.data.recentEvents.filter(event => 
                new Date(event.timestamp) >= cutoffDate
            );
            
            // Filter daily stats
            this.filteredData.dailyStats = this.data.dailyStats.filter(stat => 
                new Date(stat.date) >= cutoffDate
            );
            
            // Recalculate summary for filtered data
            this.recalculateFilteredSummary();
        }
    }

    recalculateFilteredSummary() {
        if (!this.filteredData) return;
        
        const events = this.filteredData.recentEvents;
        const clashEvents = events.filter(e => e.type === 'clash');
        const xClickEvents = events.filter(e => e.type === 'x_click');
        
        const users = [...new Set(events.map(e => e.user))];
        const projects = [...new Set(events.map(e => e.project))];
        
        // Recalculate user activity for filtered period
        const userActivity = [];
        users.forEach(user => {
            const userEvents = events.filter(e => e.user === user);
            const userClashes = userEvents.filter(e => e.type === 'clash').length;
            const userXClicks = userEvents.filter(e => e.type === 'x_click').length;
            const userProjects = [...new Set(userEvents.map(e => e.project))];
            const mostActiveProject = userProjects[0] || '';
            const lastActivity = Math.max(...userEvents.map(e => new Date(e.timestamp)));
            
            userActivity.push({
                user: user,
                totalClashes: userClashes,
                xClicks: userXClicks,
                mostActiveProject: mostActiveProject,
                lastActivity: new Date(lastActivity).toISOString()
            });
        });
        
        // Recalculate project stats for filtered period
        const projectStats = [];
        projects.forEach(project => {
            const projectEvents = events.filter(e => e.project === project);
            const projectClashes = projectEvents.filter(e => e.type === 'clash').length;
            const projectXClicks = projectEvents.filter(e => e.type === 'x_click').length;
            const projectUsers = [...new Set(projectEvents.map(e => e.user))];
            const lastClash = Math.max(...projectEvents.filter(e => e.type === 'clash').map(e => new Date(e.timestamp)));
            
            projectStats.push({
                project: project,
                clashes: projectClashes,
                xClicks: projectXClicks,
                users: projectUsers,
                lastClash: isFinite(lastClash) ? new Date(lastClash).toISOString() : new Date().toISOString()
            });
        });
        
        this.filteredData.summary = {
            ...this.filteredData.summary,
            totalClashes: clashEvents.length,
            totalXClicks: xClickEvents.length,
            uniqueUsers: users.length,
            uniqueProjects: projects.length
        };
        
        this.filteredData.userActivity = userActivity;
        this.filteredData.projectStats = projectStats;
    }

    updateDashboard() {
        const dataToUse = this.filteredData || this.data;
        this.updateSummaryCards(dataToUse);
        this.updateCharts(dataToUse);
        this.updateTables(dataToUse);
        this.updateLastUpdated();
        this.updatePagination();
        this.populateProjectSelector();
    }

    updateSummaryCards(data) {
        const summary = data.summary;
        
        document.getElementById('totalClashes').textContent = summary.totalClashes.toLocaleString();
        document.getElementById('totalXClicks').textContent = summary.totalXClicks.toLocaleString();
        document.getElementById('uniqueUsers').textContent = summary.uniqueUsers.toLocaleString();
        document.getElementById('uniqueProjects').textContent = summary.uniqueProjects.toLocaleString();
        
        // Add trend indicators
        this.updateTrendIndicators(data);
        
        // Add filter indicator to card titles
        const filterIndicator = this.dateFilter === 'all' ? '' : ` (${this.getFilterLabel()})`;
        const cards = document.querySelectorAll('.card-content h3');
        if (cards.length >= 4) {
            cards[0].textContent = 'Total Clashes' + filterIndicator;
            cards[1].textContent = 'X Button Clicks' + filterIndicator;
            cards[2].textContent = 'Active Users' + filterIndicator;
            cards[3].textContent = 'Projects' + filterIndicator;
        }
    }

    updateTrendIndicators(data) {
        if (!this.previousData) return;

        const trends = this.calculateTrends(data);
        
        const clashTrend = document.getElementById('clashTrend');
        const xclickTrend = document.getElementById('xclickTrend');
        const userTrend = document.getElementById('userTrend');
        const projectTrend = document.getElementById('projectTrend');
        
        if (clashTrend) clashTrend.textContent = trends.clashes;
        if (xclickTrend) xclickTrend.textContent = trends.xClicks;
        if (userTrend) userTrend.textContent = trends.users;
        if (projectTrend) projectTrend.textContent = trends.projects;
    }

    calculateTrends(currentData) {
        if (!this.previousData) {
            return {
                clashes: 'Tracking enabled',
                xClicks: 'Tracking enabled', 
                users: 'Tracking enabled',
                projects: 'Tracking enabled'
            };
        }

        const current = currentData.summary;
        const previous = this.previousData.summary;

        const clashDiff = current.totalClashes - previous.totalClashes;
        const xClickDiff = current.totalXClicks - previous.totalXClicks;
        const userDiff = current.uniqueUsers - previous.uniqueUsers;
        const projectDiff = current.uniqueProjects - previous.uniqueProjects;

        return {
            clashes: this.formatTrend(clashDiff, 'clash'),
            xClicks: this.formatTrend(xClickDiff, 'X-click'),
            users: this.formatTrend(userDiff, 'user'),
            projects: this.formatTrend(projectDiff, 'project')
        };
    }

    formatTrend(diff, type) {
        if (diff > 0) {
            return `+${diff} since last refresh`;
        } else if (diff === 0) {
            return 'No change';
        } else {
            return `${diff} since last refresh`;
        }
    }

    getFilterLabel() {
        switch (this.dateFilter) {
            case '30days': return 'Last 30 Days';
            case '90days': return 'Last 90 Days';
            case '1year': return 'Last Year';
            default: return '';
        }
    }

    updateCharts(data) {
        // Limit chart data for performance - important for append-only system
        const limitedDailyStats = data.dailyStats.slice(-100); // Last 100 days
        const limitedUserActivity = data.userActivity.slice(0, 20); // Top 20 users
        const limitedProjectStats = data.projectStats.slice(0, 10); // Top 10 projects
        
        this.createDailyActivityChart(limitedDailyStats);
        this.createUserActivityChart(limitedUserActivity);
        this.createProjectChart(limitedProjectStats);
    }

    createDailyActivityChart(dailyStats) {
        const ctx = document.getElementById('dailyActivityChart').getContext('2d');
        
        if (this.charts.dailyActivity) {
            this.charts.dailyActivity.destroy();
        }

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

    createUserActivityChart(userActivity) {
        const ctx = document.getElementById('userActivityChart').getContext('2d');
        
        if (this.charts.userActivity) {
            this.charts.userActivity.destroy();
        }

        // Sort by total clashes and limit to top 20
        const topUsers = userActivity
            .sort((a, b) => b.totalClashes - a.totalClashes)
            .slice(0, 20);

        const labels = topUsers.map(user => user.user);
        const clashData = topUsers.map(user => user.totalClashes);
        const xClickData = topUsers.map(user => user.xClicks);

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

    createProjectChart(projectStats) {
        const ctx = document.getElementById('projectChart').getContext('2d');
        
        if (this.charts.project) {
            this.charts.project.destroy();
        }

        // Sort by clashes and limit to top 10
        const topProjects = projectStats
            .sort((a, b) => b.clashes - a.clashes)
            .slice(0, 10);

        const labels = topProjects.map(project => project.project);
        const data = topProjects.map(project => project.clashes);

        this.charts.project = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6'
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


    updateTables(data) {
        this.updateRecentActivityTable();
        this.updateUserStatsTable();
        this.updateProjectStatsTable();
    }

    updateRecentActivityTable() {
        const dataToUse = this.filteredData || this.data;
        const tbody = document.getElementById('recentActivityBody');
        tbody.innerHTML = '';

        // Calculate pagination
        const totalEvents = dataToUse.recentEvents.length;
        const startIndex = (this.currentPage - 1) * this.eventsPerPage;
        const endIndex = Math.min(startIndex + this.eventsPerPage, totalEvents);
        const eventsToShow = dataToUse.recentEvents.slice(startIndex, endIndex);

        // Add pagination info
        const tableContainer = tbody.closest('.table-container');
        let paginationInfo = tableContainer.querySelector('.pagination-info');
        if (!paginationInfo) {
            paginationInfo = document.createElement('div');
            paginationInfo.className = 'pagination-info';
            tableContainer.querySelector('.table-header').appendChild(paginationInfo);
        }
        
        const totalPages = Math.ceil(totalEvents / this.eventsPerPage);
        paginationInfo.innerHTML = `
            <span>Showing ${startIndex + 1}-${endIndex} of ${totalEvents.toLocaleString()} events</span>
            <div class="pagination-controls">
                <button onclick="prevPage()" ${this.currentPage === 1 ? 'disabled' : ''}>‹ Previous</button>
                <span>Page ${this.currentPage} of ${totalPages}</span>
                <button onclick="nextPage()" ${endIndex >= totalEvents ? 'disabled' : ''}>Next ›</button>
            </div>
        `;

        eventsToShow.forEach(event => {
            const row = document.createElement('tr');
            const time = new Date(event.timestamp).toLocaleString();
            const actionBadge = event.type === 'x_click' ? 
                '<span class="badge badge-warning">X-Click</span>' : 
                '<span class="badge badge-error">Clash</span>';
            // Format element info for better display
        let elementDisplay = 'N/A';
        if (event.elementInfo) {
            // Extract just the ID from the element info string
            const idMatch = event.elementInfo.match(/ID:\s*(\d+)/);
            const categoryMatch = event.elementInfo.match(/Category:\s*([^,)]+)/);
            if (idMatch || categoryMatch) {
                elementDisplay = `<strong>ID: ${idMatch ? idMatch[1] : 'N/A'}</strong><br>
                                 <small>${categoryMatch ? categoryMatch[1] : ''}</small>`;
            } else {
                elementDisplay = event.elementInfo;
            }
        }

        // Format clashing elements for better display
        let clashDisplay = 'N/A';
        if (event.clashingElements && event.clashingElements.length > 0) {
            clashDisplay = `<span class="badge badge-error">${event.clashingElements.length}</span> elements<br>`;
            // Show first 2 clashing elements
            const preview = event.clashingElements.slice(0, 2).map(el => {
                const idMatch = el.match(/ID:\s*(\d+)/);
                return idMatch ? `ID: ${idMatch[1]}` : el;
            }).join('<br>');
            clashDisplay += `<small>${preview}</small>`;
            if (event.clashingElements.length > 2) {
                clashDisplay += `<br><small>+${event.clashingElements.length - 2} more</small>`;
            }
        }

            row.innerHTML = `
                <td>${time}</td>
                <td>${event.user}</td>
                <td>${event.project}</td>
                <td>${event.elementInfo || 'N/A'}</td>
                <td>${event.clashingElements ? event.clashingElements.length + ' elements' : 'N/A'}</td>
                <td>${actionBadge}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateUserStatsTable() {
        const dataToUse = this.filteredData || this.data;
        const tbody = document.getElementById('userStatsBody');
        tbody.innerHTML = '';

        // Limit to top 50 users for performance, sorted by total clashes
        const topUsers = dataToUse.userActivity
            .sort((a, b) => b.totalClashes - a.totalClashes)
            .slice(0, 50);

        topUsers.forEach(user => {
            const row = document.createElement('tr');
            const lastActivity = new Date(user.lastActivity).toLocaleString();

            row.innerHTML = `
                <td><strong>${user.user}</strong></td>
                <td><span class="badge badge-error">${user.totalClashes.toLocaleString()}</span></td>
                <td><span class="badge badge-warning">${user.xClicks.toLocaleString()}</span></td>
                <td>${user.mostActiveProject}</td>
                <td>${lastActivity}</td>
            `;
            tbody.appendChild(row);
        });

        // Add notice if data was limited
        if (dataToUse.userActivity.length > 50) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="text-center" style="font-style: italic; color: var(--text-secondary);">
                    Showing top 50 users of ${dataToUse.userActivity.length.toLocaleString()} total users
                </td>
            `;
            tbody.appendChild(row);
        }
    }

    updateProjectStatsTable() {
        const dataToUse = this.filteredData || this.data;
        const tbody = document.getElementById('projectStatsBody');
        tbody.innerHTML = '';

        // Limit to top 30 projects for performance, sorted by clashes
        const topProjects = dataToUse.projectStats
            .sort((a, b) => b.clashes - a.clashes)
            .slice(0, 30);

        topProjects.forEach(project => {
            const row = document.createElement('tr');
            const lastClash = new Date(project.lastClash).toLocaleString();
            const userCount = project.users.length;

            row.innerHTML = `
                <td><strong>${project.project}</strong></td>
                <td><span class="badge badge-error">${project.clashes.toLocaleString()}</span></td>
                <td><span class="badge badge-warning">${project.xClicks.toLocaleString()}</span></td>
                <td><span class="badge badge-success">${userCount.toLocaleString()}</span></td>
                <td>${lastClash}</td>
            `;
            tbody.appendChild(row);
        });

        // Add notice if data was limited
        if (dataToUse.projectStats.length > 30) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="text-center" style="font-style: italic; color: var(--text-secondary);">
                    Showing top 30 projects of ${dataToUse.projectStats.length.toLocaleString()} total projects
                </td>
            `;
            tbody.appendChild(row);
        }
    }

    updatePagination() {
        this.updateRecentActivityTable();
    }

    nextPage() {
        const dataToUse = this.filteredData || this.data;
        const totalPages = Math.ceil(dataToUse.recentEvents.length / this.eventsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    goToPage(page) {
        const dataToUse = this.filteredData || this.data;
        const totalPages = Math.ceil(dataToUse.recentEvents.length / this.eventsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    showExportOptions() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📥 Export Append-Only Data</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Choose export format and data range:</p>
                    <div style="margin: 1rem 0;">
                        <label>
                            <input type="radio" name="exportFormat" value="json" checked> JSON (Complete Data)
                        </label><br>
                        <label>
                            <input type="radio" name="exportFormat" value="csv"> CSV (Events Only)
                        </label><br>
                        <label>
                            <input type="radio" name="exportFormat" value="excel"> Excel (Summary + Events)
                        </label>
                    </div>
                    <div style="margin: 1rem 0;">
                        <label>
                            <input type="radio" name="exportRange" value="current" checked> Current Filter (${this.getFilterLabel() || 'All Data'})
                        </label><br>
                        <label>
                            <input type="radio" name="exportRange" value="all"> All Historical Data
                        </label>
                    </div>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 1rem;">
                        💡 Append-only system: Data continuously accumulates and is never overwritten.
                    </p>
                </div>
                <div class="modal-footer">
                    <button onclick="this.closest('.modal').remove()">Cancel</button>
                    <button onclick="dashboard.performExport(); this.closest('.modal').remove()">Export</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    performExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const range = document.querySelector('input[name="exportRange"]:checked').value;
        
        const dataToExport = range === 'all' ? this.data : (this.filteredData || this.data);
        const timestamp = new Date().toISOString().split('T')[0];
        
        switch (format) {
            case 'json':
                this.downloadFile(
                    JSON.stringify(dataToExport, null, 2),
                    `clash-data-append-only-${timestamp}.json`,
                    'application/json'
                );
                break;
            case 'csv':
                this.downloadFile(
                    this.convertToCSV(dataToExport.recentEvents),
                    `clash-events-${timestamp}.csv`,
                    'text/csv'
                );
                break;
            case 'excel':
                this.downloadFile(
                    this.convertToExcelCSV(dataToExport),
                    `clash-report-${timestamp}.csv`,
                    'text/csv'
                );
                break;
        }
    }

    convertToCSV(events) {
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

    convertToExcelCSV(data) {
        let csv = 'CLASH DETECTION DASHBOARD REPORT (APPEND-ONLY SYSTEM)\n';
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        csv += 'SUMMARY\n';
        csv += `Total Clashes,${data.summary.totalClashes}\n`;
        csv += `Total X-Clicks,${data.summary.totalXClicks}\n`;
        csv += `Active Users,${data.summary.uniqueUsers}\n`;
        csv += `Active Projects,${data.summary.uniqueProjects}\n`;
        csv += `Total Events,${data.recentEvents.length}\n\n`;
        
        csv += 'RECENT EVENTS\n';
        csv += this.convertToCSV(data.recentEvents);
        
        return csv;
    }

    downloadFile(content, filename, mimeType) {
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

    getSampleData() {
        // Enhanced sample data for demonstration
        return {
            lastUpdated: new Date().toISOString(),
            summary: {
                totalClashes: 1547,
                totalXClicks: 203,
                uniqueUsers: 12,
                uniqueProjects: 18,
                dateRange: {
                    start: '2024-01-01',
                    end: new Date().toISOString().split('T')[0]
                }
            },
            dailyStats: this.generateSampleDailyStats(),
            userActivity: this.generateSampleUserActivity(),
            projectStats: this.generateSampleProjectStats(),
            recentEvents: this.generateSampleEvents()
        };
    }

    generateSampleDailyStats() {
        const stats = [];
        const startDate = new Date('2024-01-01');
        const endDate = new Date();
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            stats.push({
                date: d.toISOString().split('T')[0],
                clashes: Math.floor(Math.random() * 15),
                xClicks: Math.floor(Math.random() * 5),
                users: ['User_001', 'User_002', 'User_003'],
                projects: ['Project_Alpha', 'Project_Beta']
            });
        }
        
        return stats;
    }

    generateSampleUserActivity() {
        return [
            { user: 'ahmade', totalClashes: 347, xClicks: 42, mostActiveProject: 'space test model-22', lastActivity: new Date().toISOString() },
            { user: 'john.smith', totalClashes: 289, xClicks: 31, mostActiveProject: 'Office Tower A', lastActivity: new Date(Date.now() - 2*60*60*1000).toISOString() },
            { user: 'sarah.jones', totalClashes: 203, xClicks: 18, mostActiveProject: 'Residential Complex', lastActivity: new Date(Date.now() - 4*60*60*1000).toISOString() },
            { user: 'mike.chen', totalClashes: 178, xClicks: 25, mostActiveProject: 'Hospital Wing', lastActivity: new Date(Date.now() - 6*60*60*1000).toISOString() },
            { user: 'lisa.brown', totalClashes: 156, xClicks: 19, mostActiveProject: 'Mall Renovation', lastActivity: new Date(Date.now() - 8*60*60*1000).toISOString() },
            { user: 'david.wilson', totalClashes: 134, xClicks: 14, mostActiveProject: 'School Building', lastActivity: new Date(Date.now() - 12*60*60*1000).toISOString() },
            { user: 'emma.davis', totalClashes: 98, xClicks: 12, mostActiveProject: 'Library Extension', lastActivity: new Date(Date.now() - 24*60*60*1000).toISOString() },
            { user: 'alex.taylor', totalClashes: 67, xClicks: 8, mostActiveProject: 'Parking Garage', lastActivity: new Date(Date.now() - 48*60*60*1000).toISOString() }
        ];
    }

    generateSampleProjectStats() {
        return [
            { project: 'space test model-22', clashes: 156, xClicks: 23, users: ['ahmade'], lastClash: new Date().toISOString() },
            { project: 'Office Tower A', clashes: 134, xClicks: 18, users: ['john.smith', 'sarah.jones'], lastClash: new Date(Date.now() - 2*60*60*1000).toISOString() },
            { project: 'Residential Complex', clashes: 98, xClicks: 14, users: ['sarah.jones', 'mike.chen'], lastClash: new Date(Date.now() - 4*60*60*1000).toISOString() },
            { project: 'Hospital Wing', clashes: 87, xClicks: 12, users: ['mike.chen', 'lisa.brown'], lastClash: new Date(Date.now() - 6*60*60*1000).toISOString() },
            { project: 'Mall Renovation', clashes: 76, xClicks: 11, users: ['lisa.brown', 'david.wilson'], lastClash: new Date(Date.now() - 8*60*60*1000).toISOString() },
            { project: 'School Building', clashes: 65, xClicks: 9, users: ['david.wilson', 'emma.davis'], lastClash: new Date(Date.now() - 12*60*60*1000).toISOString() },
            { project: 'Library Extension', clashes: 54, xClicks: 7, users: ['emma.davis', 'alex.taylor'], lastClash: new Date(Date.now() - 24*60*60*1000).toISOString() },
            { project: 'Parking Garage', clashes: 43, xClicks: 6, users: ['alex.taylor'], lastClash: new Date(Date.now() - 48*60*60*1000).toISOString() }
        ];
    }

    generateSampleEvents() {
        const events = [];
        const users = ['ahmade', 'john.smith', 'sarah.jones', 'mike.chen', 'lisa.brown', 'david.wilson', 'emma.davis', 'alex.taylor'];
        const projects = ['space test model-22', 'Office Tower A', 'Residential Complex', 'Hospital Wing', 'Mall Renovation', 'School Building', 'Library Extension', 'Parking Garage'];
        const types = ['clash', 'x_click'];
        
        // Generate last 1000 events for demonstration
        for (let i = 0; i < 1000; i++) {
            const timestamp = new Date(Date.now() - i * 60 * 60 * 1000); // 1 hour intervals
            const type = types[Math.floor(Math.random() * types.length)];
            const user = users[Math.floor(Math.random() * users.length)];
            const project = projects[Math.floor(Math.random() * projects.length)];
            
            events.push({
                timestamp: timestamp.toISOString(),
                type: type,
                user: user,
                project: project,
                action: type === 'clash' ? 'Clash Detected' : 'Dialog Close Attempt (Prevented)'
            });
        }
        
        return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
    window.dashboard.showExportOptions();
};
