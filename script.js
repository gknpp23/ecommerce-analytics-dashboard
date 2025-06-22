<script>
    // Mock data for testing
    const mockData = {
        all: {
            sales: { 
                labels: ['2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05', '2023-05-06', '2023-05-07'], 
                data: [1200, 1900, 1500, 2200, 1800, 2500, 2800] 
            },
            activity: {
                labels: ['2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05', '2023-05-06', '2023-05-07'],
                activeUsers: [150, 230, 180, 250, 200, 280, 320],
                newUsers: [30, 45, 35, 50, 40, 55, 60]
            },
            inventory: { labels: ['Smartphone', 'Headphones', 'Notebook', 'Monitor'], data: [5, 3, 12, 25] },
            customers: { labels: ['18-24', '25-34', '35-44', '45+'], data: [30, 45, 15, 10] },
            reviews: [
                { id: 1, author: 'Maria J.', rating: 5, text: 'Love the product! Fast delivery and exceeded expectations.', date: '2023-05-15' },
                { id: 2, author: 'John S.', rating: 4, text: 'Great sound quality. Battery life could be better.', date: '2023-05-14' },
            ],
            orders: 184,
            revenue: 24580,
            notifications: [
                { id: 1, type: 'danger', message: 'Product "Headphones Pro" has only 3 units left in stock.', date: '2023-05-15T10:30:00', read: false },
                { id: 2, type: 'danger', message: 'Product "Smartphone X9" has only 5 units left in stock.', date: '2023-05-14T14:15:00', read: false },
            ]
        },
        electronics: {
            sales: { 
                labels: ['2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05', '2023-05-06', '2023-05-07'], 
                data: [800, 1200, 900, 1500, 1100, 1800, 2000] 
            },
            activity: {
                labels: ['2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05', '2023-05-06', '2023-05-07'],
                activeUsers: [100, 150, 120, 180, 140, 200, 220],
                newUsers: [20, 30, 25, 35, 30, 40, 45]
            },
            inventory: { labels: ['Smartphone', 'Headphones', 'Notebook'], data: [5, 3, 12] },
            customers: { labels: ['18-24', '25-34', '35-44', '45+'], data: [35, 50, 10, 5] },
            // reviews e notifications não são mais usados aqui
            orders: 92,
            revenue: 13799
        },
        clothing: {
            sales: { 
                labels: ['2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05', '2023-05-06', '2023-05-07'], 
                data: [400, 700, 600, 700, 700, 700, 800] 
            },
            activity: {
                labels: ['2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05', '2023-05-06', '2023-05-07'],
                activeUsers: [50, 80, 60, 70, 60, 80, 100],
                newUsers: [10, 15, 10, 15, 10, 15, 15]
            },
            inventory: { labels: ['T-Shirts', 'Jeans', 'Jackets'], data: [45, 32, 18] },
            customers: { labels: ['18-24', '25-34', '35-44', '45+'], data: [25, 40, 20, 15] },
            // reviews e notifications não são mais usados aqui
            orders: 92,
            revenue: 10781
        }
    };

    // Sempre use as reviews e notifications do mockData.all
    const defaultReviews = mockData.all.reviews;
    const defaultNotifications = mockData.all.notifications;

    let currentCategory = 'all';
    let currentData = JSON.parse(JSON.stringify(mockData.all));
    let chartInstances = {};

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function formatShortDate(dateString) {
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function getCategoryDateRange(category) {
        const sales = mockData[category].sales;
        if (!sales || !sales.labels || sales.labels.length === 0) return [null, null];
        const dates = sales.labels.map(d => new Date(d));
        const min = new Date(Math.min(...dates));
        const max = new Date(Math.max(...dates));
        return [min, max];
    }

    function resetDatePickersForCategory(category) {
        const [min, max] = getCategoryDateRange(category);
        if (min && max) {
            createCustomDatePicker('customStartDate', min);
            createCustomDatePicker('customEndDate', max);
        }
    }

    function filterDataByDateRange(data, startDate, endDate) {
        if (!startDate || !endDate) return data;

        const filteredData = {
            ...data,
            sales: data.sales ? { ...data.sales } : undefined,
            activity: data.activity ? { ...data.activity } : undefined,
        };

        // Filtrar sales
        if (filteredData.sales && filteredData.sales.labels) {
            const salesIndices = [];
            data.sales.labels.forEach((date, index) => {
                const currentDate = new Date(date);
                if (currentDate >= startDate && currentDate <= endDate) {
                    salesIndices.push(index);
                }
            });
            filteredData.sales.labels = salesIndices.map(i => data.sales.labels[i]);
            filteredData.sales.data = salesIndices.map(i => data.sales.data[i]);
        }

        // Filtrar activity
        if (filteredData.activity && filteredData.activity.labels) {
            const activityIndices = [];
            data.activity.labels.forEach((date, index) => {
                const currentDate = new Date(date);
                if (currentDate >= startDate && currentDate <= endDate) {
                    activityIndices.push(index);
                }
            });
            filteredData.activity.labels = activityIndices.map(i => data.activity.labels[i]);
            filteredData.activity.activeUsers = activityIndices.map(i => data.activity.activeUsers[i]);
            filteredData.activity.newUsers = activityIndices.map(i => data.activity.newUsers[i]);
        }

        filteredData.orders = filteredData.sales && filteredData.sales.data ? filteredData.sales.data.length : 0;
        filteredData.revenue = filteredData.sales && filteredData.sales.data ? filteredData.sales.data.reduce((sum, value) => sum + value, 0) : 0;

        // Sempre usa as reviews e notifications padrão
        filteredData.reviews = defaultReviews;
        filteredData.notifications = defaultNotifications;

        return filteredData;
    }

    function ensureCanvas(parentId, canvasId) {
        const parent = document.getElementById(parentId);
        if (!parent) return;
        if (!parent.querySelector('canvas')) {
            parent.innerHTML = `<canvas id="${canvasId}"></canvas>`;
        }
    }

    const chartOptions = (isDonut = false) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        plugins: {
            legend: {
                display: true,
                position: isDonut ? 'right' : 'top',
                labels: {
                    color: 'lightgray',
                    font: { family: 'Quicksand', weight: '600', size: 12 },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(45, 55, 72, 0.95)',
                titleColor: 'white',
                bodyColor: 'var(--light-gray)',
                titleFont: { family: 'Quicksand', size: 14, weight: '600' },
                bodyFont: { family: 'Quicksand', size: 12, weight: '500' },
                borderColor: 'rgba(66, 153, 225, 0.5)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                usePointStyle: true
            }
        },
        scales: isDonut ? {} : {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                ticks: { color: 'white', font: { family: 'Quicksand', weight: '600' }, padding: 8 }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                ticks: { color: 'white', font: { family: 'Quicksand', weight: '600' }, padding: 8 }
            }
        },
        elements: {
            line: { tension: 0.4, borderWidth: 2 },
            point: { radius: 4, hoverRadius: 6, backgroundColor: 'white', borderColor: 'var(--electric-blue)', borderWidth: 2 },
            bar: { borderRadius: 4, borderSkipped: false }
        }
    });

    function renderOrUpdateChart(id, config) {
        const container = document.getElementById(id)?.parentElement;
        if (!container) return;

        if (chartInstances[id]) {
            chartInstances[id].destroy();
        }

        container.innerHTML = `<canvas id="${id}" role="img" aria-label="${config.data.datasets[0].label} chart"></canvas>`;
        const ctx = document.getElementById(id).getContext('2d');
        chartInstances[id] = new Chart(ctx, config);
    }

    function populateDashboard(data) {
        // Sales Chart
        if (data.sales && data.sales.labels && data.sales.labels.length > 0) {
            ensureCanvas('salesChartContainer', 'salesChart');
            renderOrUpdateChart('salesChart', {
                type: 'line',
                data: {
                    labels: data.sales.labels.map(formatShortDate),
                    datasets: [{
                        label: 'Sales ($)',
                        data: data.sales.data,
                        backgroundColor: 'rgba(66, 153, 225, 0.1)',
                        borderColor: 'lightgray',
                        fill: true
                    }]
                },
                options: chartOptions()
            });
        } else {
            document.getElementById('salesChartContainer').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>No sales data available for the selected filters</p>
                </div>`;
        }

        // Inventory Chart
        if (data.inventory && data.inventory.labels && data.inventory.labels.length > 0) {
            ensureCanvas('inventoryChartContainer', 'inventoryChart');
            renderOrUpdateChart('inventoryChart', {
                type: 'bar',
                data: {
                    labels: data.inventory.labels,
                    datasets: [{
                        label: 'Stock Levels',
                        data: data.inventory.data,
                        backgroundColor: [
                            'rgba(66, 153, 225, 0.7)', 'rgba(72, 187, 120, 0.7)',
                            'rgba(246, 173, 85, 0.7)', 'rgba(245, 101, 101, 0.7)'
                        ].slice(0, data.inventory.labels.length),
                        borderColor: 'lightgray', // Adicionado para borda igual aos outros charts
                        borderWidth: 2           // Opcional: deixa a borda mais visível
                    }]
                },
                options: chartOptions()
            });
        } else {
            document.getElementById('inventoryChartContainer').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-boxes"></i>
                    <p>No inventory data available for the selected filters</p>
                </div>`;
        }

        // Customer Activity Chart
        if (data.activity && data.activity.labels && data.activity.labels.length > 0) {
            ensureCanvas('activityChartContainer', 'activityChart');
            renderOrUpdateChart('activityChart', {
                type: 'line',
                data: {
                    labels: data.activity.labels.map(formatShortDate),
                    datasets: [
                        {
                            label: 'Active Users',
                            data: data.activity.activeUsers,
                            borderColor: 'lightgray',
                            backgroundColor: 'rgba(66, 153, 225, 0.1)',
                            fill: true
                        },
                        {
                            label: 'New Users',
                            data: data.activity.newUsers,
                            borderColor: 'lightgray',
                            backgroundColor: 'rgba(72, 187, 120, 0.1)',
                            fill: true
                        }
                    ]
                },
                options: chartOptions()
            });
        } else {
            document.getElementById('activityChartContainer').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No activity data available for the selected filters</p>
                </div>`;
        }

        // Customer Demographics Chart
        if (data.customers && data.customers.labels && data.customers.labels.length > 0) {
            ensureCanvas('customerChartContainer', 'customerChart');
            renderOrUpdateChart('customerChart', {
                type: 'doughnut',
                data: {
                    labels: data.customers.labels,
                    datasets: [{
                        label: 'Age Group',
                        data: data.customers.data,
                        backgroundColor: [
                            'rgba(66, 153, 225, 0.7)', 'rgba(72, 187, 120, 0.7)',
                            'rgba(246, 173, 85, 0.7)', 'rgba(245, 101, 101, 0.7)'
                        ],
                        borderColor: 'lightgray',
                        borderWidth: 2
                    }]
                },
                options: chartOptions(true)
            });
        } else {
            document.getElementById('customerChartContainer').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <p>No demographic data available for the selected filters</p>
                </div>`;
        }

        // Update metrics
        document.getElementById('revenueValue').textContent = data.revenue ? `$${data.revenue.toLocaleString()}` : '$0';
        document.getElementById('ordersValue').textContent = data.orders || '0';

        // Reviews section (sempre usa padrão)
        const reviewsContainer = document.getElementById('reviewsContainer');
        if (defaultReviews && defaultReviews.length > 0) {
            reviewsContainer.innerHTML = defaultReviews.map(review => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="font-weight:600; color: var(--white)">${review.author}</span>
                        <span style="color:var(--warning);">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <p style="font-size:14px; opacity: 0.8; color: var(--light-gray)">"${review.text}"</p>
                    <div style="font-size:12px; color: var(--light-gray); margin-top:5px;">${formatDate(review.date)}</div>
                </div>
            `).join('');
            if (reviewsContainer.lastElementChild) {
                reviewsContainer.lastElementChild.style.borderBottom = 'none';
            }
        } else {
            reviewsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment-alt-slash"></i>
                    <p>No reviews available for the selected filters</p>
                </div>`;
        }
    }

    // Notificações (sempre usa padrão)
    function updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        const notifications = defaultNotifications || [];
        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.add('active');
        } else {
            badge.textContent = '';
            badge.classList.remove('active');
        }
    }

    function populateNotifications() {
        updateNotificationBadge();
        const list = document.getElementById('notificationList');
        // Mostra apenas as não lidas
        const notifications = (defaultNotifications || []).filter(n => !n.read);
        if (notifications.length === 0) {
            list.innerHTML = `<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications to display</p></div>`;
        } else {
            list.innerHTML = notifications.map(item => `
                <div class="notification-item ${item.type}" data-id="${item.id}">
                    <div class="notification-read"></div>
                    <p>${item.message}</p>
                    <div class="notification-time">${formatDate(item.date)}</div>
                </div>
            `).join('');
        }
    }

    // Filtro robusto: sempre filtra a partir do mockData original
    function applyFilters() {
        const startDate = document.getElementById('startDate')?.value ? new Date(document.getElementById('startDate').value) : null;
        const endDate = document.getElementById('endDate')?.value ? new Date(document.getElementById('endDate').value) : null;
        const category = document.getElementById('categoryFilter')?.value || 'all';

        // Sempre filtrar a partir do mockData original
        const baseData = JSON.parse(JSON.stringify(mockData[category]));
        const filtered = filterDataByDateRange(baseData, startDate, endDate);

        currentData = filtered;
        currentCategory = category;

        populateDashboard(currentData);
        populateNotifications();
    }

    // Custom Select (Dropdown) - NÃO atualiza charts ao trocar categoria
    function createCustomSelect(containerId, options, defaultValue) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const selectedDiv = document.createElement('div');
        selectedDiv.className = 'custom-select-selected';
        selectedDiv.tabIndex = 0;
        selectedDiv.setAttribute('role', 'button');
        selectedDiv.setAttribute('aria-haspopup', 'listbox');
        selectedDiv.setAttribute('aria-expanded', 'false');
        selectedDiv.innerHTML = options.find(o => o.value === defaultValue).label + '<span class="custom-select-arrow">&#9662;</span>';
        container.appendChild(selectedDiv);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'custom-select-options';
        optionsDiv.setAttribute('role', 'listbox');
        options.forEach(opt => {
            const optDiv = document.createElement('div');
            optDiv.className = 'custom-select-option' + (opt.value === defaultValue ? ' selected' : '');
            optDiv.setAttribute('role', 'option');
            optDiv.setAttribute('data-value', opt.value);
            optDiv.textContent = opt.label;
            optDiv.addEventListener('click', () => {
                selectedDiv.innerHTML = opt.label + '<span class="custom-select-arrow">&#9662;</span>';
                optionsDiv.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                optDiv.classList.add('selected');
                selectedDiv.setAttribute('aria-expanded', 'false');
                optionsDiv.classList.remove('active');
                document.getElementById('categoryFilter').value = opt.value;

                // Remova o reset das datas ao trocar de categoria!
                // resetDatePickersForCategory(opt.value); // <-- Removido

                // NÃO chama applyFilters aqui!
            });
            optionsDiv.appendChild(optDiv);
        });
        container.appendChild(optionsDiv);

        selectedDiv.addEventListener('click', () => {
            const expanded = selectedDiv.getAttribute('aria-expanded') === 'true';
            selectedDiv.setAttribute('aria-expanded', String(!expanded));
            optionsDiv.classList.toggle('active');
            const arrow = selectedDiv.querySelector('.custom-select-arrow');
            arrow.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                selectedDiv.setAttribute('aria-expanded', 'false');
                optionsDiv.classList.remove('active');
                const arrow = selectedDiv.querySelector('.custom-select-arrow');
                arrow.style.transform = 'rotate(0deg)';
            }
        });

        // Hidden field para integração
        let hidden = document.getElementById('categoryFilter');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id = 'categoryFilter';
            hidden.value = defaultValue;
            container.appendChild(hidden);
        } else {
            hidden.value = defaultValue;
        }
    }

    // Custom Date Picker
    function createCustomDatePicker(containerId, defaultDate, minDate, maxDate) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        let selectedDate = defaultDate ? new Date(defaultDate) : new Date();
        let currentMonth = selectedDate.getMonth();
        let currentYear = selectedDate.getFullYear();

        const displayDiv = document.createElement('div');
        displayDiv.className = 'custom-date-display';
        displayDiv.tabIndex = 0;
        displayDiv.setAttribute('role', 'button');
        displayDiv.setAttribute('aria-haspopup', 'dialog');
        displayDiv.setAttribute('aria-expanded', 'false');
        displayDiv.textContent = selectedDate.toISOString().slice(0,10);

        const calendarDiv = document.createElement('div');
        calendarDiv.className = 'custom-date-calendar';

        function renderCalendar() {
            calendarDiv.innerHTML = '';
            const header = document.createElement('div');
            header.className = 'calendar-header';
            const prev = document.createElement('span');
            prev.className = 'calendar-nav';
            prev.innerHTML = '&#9664;';
            prev.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede o fechamento do modal ao clicar na seta
                if (currentMonth === 0) {
                    currentMonth = 11;
                    currentYear--;
                } else {
                    currentMonth--;
                }
                renderCalendar();
            });
            const next = document.createElement('span');
            next.className = 'calendar-nav';
            next.innerHTML = '&#9654;';
            next.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede o fechamento do modal ao clicar na seta
                if (currentMonth === 11) {
                    currentMonth = 0;
                    currentYear++;
                } else {
                    currentMonth++;
                }
                renderCalendar();
            });
            const monthYear = document.createElement('span');
            monthYear.className = 'calendar-title';
            monthYear.textContent = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
            header.appendChild(prev);
            header.appendChild(monthYear);
            header.appendChild(next);
            calendarDiv.appendChild(header);

            const table = document.createElement('table');
            const daysRow = document.createElement('tr');
            ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
                const th = document.createElement('th');
                th.textContent = d;
                daysRow.appendChild(th);
            });
            table.appendChild(daysRow);

            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
            let date = 1;
            for (let i=0; i<6; i++) {
                const row = document.createElement('tr');
                for (let j=0; j<7; j++) {
                    const cell = document.createElement('td');
                    if (i === 0 && j < firstDay) {
                        cell.textContent = '';
                    } else if (date > daysInMonth) {
                        cell.textContent = '';
                    } else {
                        cell.textContent = date;
                        const thisDate = new Date(currentYear, currentMonth, date);
                        cell.className = '';
                        if (
                            selectedDate.getFullYear() === thisDate.getFullYear() &&
                            selectedDate.getMonth() === thisDate.getMonth() &&
                            selectedDate.getDate() === thisDate.getDate()
                        ) {
                            cell.classList.add('selected');
                        }
                        if (
                            (minDate && thisDate < minDate) ||
                            (maxDate && thisDate > maxDate)
                        ) {
                            cell.style.opacity = 0.3;
                            cell.style.pointerEvents = 'none';
                        } else {
                            cell.addEventListener('click', () => {
                                selectedDate = new Date(thisDate);
                                displayDiv.textContent = selectedDate.toISOString().slice(0,10);
                                calendarDiv.classList.remove('active');
                                displayDiv.setAttribute('aria-expanded', 'false');
                                hidden.value = selectedDate.toISOString().slice(0,10);
                            });
                        }
                        date++;
                    }
                    row.appendChild(cell);
                }
                table.appendChild(row);
                if (date > daysInMonth) break;
            }
            calendarDiv.appendChild(table);
        }

        displayDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            // Fecha todos os outros calendários antes de abrir este
            document.querySelectorAll('.custom-date-calendar.active').forEach(cal => {
                if (cal !== calendarDiv) {
                    cal.classList.remove('active');
                    cal.previousSibling?.setAttribute('aria-expanded', 'false');
                }
            });
            calendarDiv.classList.toggle('active');
            displayDiv.setAttribute('aria-expanded', calendarDiv.classList.contains('active'));
            if (calendarDiv.classList.contains('active')) {
                renderCalendar();
            }
        });

        // Corrige: não fecha o calendário ao clicar nas setas ou dentro do calendário
        calendarDiv.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                calendarDiv.classList.remove('active');
                displayDiv.setAttribute('aria-expanded', 'false');
            }
        });

        // Hidden field para integração
        let hidden = container.querySelector('input[type=hidden]');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.value = selectedDate.toISOString().slice(0,10);
            hidden.id = containerId === 'customStartDate' ? 'startDate' : 'endDate';
            container.appendChild(hidden);
        } else {
            hidden.value = selectedDate.toISOString().slice(0,10);
        }

        container.appendChild(displayDiv);
        container.appendChild(calendarDiv);
    }

    // Eventos
    function setupEventListeners() {
        // Apply filters button
        const applyBtn = document.getElementById('applyFilters');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyFilters);
        }

        // Mark notification as read when clicked
        const notificationList = document.getElementById('notificationList');
        if (notificationList) {
            notificationList.addEventListener('click', function(e) {
                const item = e.target.closest('.notification-item');
                if (item && item.dataset.id) {
                    const notifId = parseInt(item.dataset.id, 10);
                    const notif = (defaultNotifications || []).find(n => n.id === notifId);
                    if (notif && !notif.read) {
                        notif.read = true;
                        populateNotifications();
                    }
                }
            });
        }

        // Close notifications panel
        const closeBtn = document.getElementById('closeNotifications');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('notificationPanel').classList.remove('active');
                document.getElementById('notificationOverlay').classList.remove('active');
            });
        }

        // Open notifications panel
        const bell = document.getElementById('notificationBell');
        if (bell) {
            bell.addEventListener('click', () => {
                const panel = document.getElementById('notificationPanel');
                const overlay = document.getElementById('notificationOverlay');
                const isActive = panel.classList.toggle('active');
                overlay.classList.toggle('active', isActive);
                if (isActive) {
                    populateNotifications();
                }
            });
        }

        // Close overlay when clicking outside
        const overlay = document.getElementById('notificationOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                document.getElementById('notificationOverlay').classList.remove('active');
            });
        }
    }

    // Inicialização
    function initDashboard() {
        // Ao iniciar, sempre mostra o range total da categoria padrão
        resetDatePickersForCategory('all');

        createCustomSelect('customCategory', [
            { value: 'all', label: 'All' },
            { value: 'electronics', label: 'Electronics' },
            { value: 'clothing', label: 'Clothing' }
        ], 'all');

        populateDashboard(currentData);
        populateNotifications();
        setupEventListeners();
    }

    document.addEventListener('DOMContentLoaded', initDashboard);
</script>