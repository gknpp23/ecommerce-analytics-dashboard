const mockData = {
    all: {
        sales: {
            labels: ["2023-05-01", "2023-05-02", "2023-05-03", "2023-05-04", "2023-05-05", "2023-05-06", "2023-05-07"],
            data: [1200, 1900, 1500, 2200, 1800, 2500, 2800]
        },
        activity: {
            labels: ["2023-05-01", "2023-05-02", "2023-05-03", "2023-05-04", "2023-05-05", "2023-05-06", "2023-05-07"],
            activeUsers: [150, 230, 180, 250, 200, 280, 320],
            newUsers: [30, 45, 35, 50, 40, 55, 60]
        },
        inventory: { labels: ["Smartphone", "Headphones", "Notebook", "Monitor"], data: [5, 3, 12, 25] },
        customers: { labels: ["18-24", "25-34", "35-44", "45+"], data: [30, 45, 15, 10] },
        reviews: [
            { id: 1, author: "Maria J.", rating: 5, text: "Love the product! Fast delivery and exceeded expectations.", date: "2023-05-15" },
            { id: 2, author: "John S.", rating: 4, text: "Great sound quality. Battery life could be better.", date: "2023-05-14" }
        ],
        orders: 184,
        revenue: 24580,
        notifications: [
            { id: 1, type: "danger", message: "Product \"Headphones Pro\" has only 3 units left in stock.", date: "2023-05-15T10:30:00", read: false },
            { id: 2, type: "danger", message: "Product \"Smartphone X9\" has only 5 units left in stock.", date: "2023-05-14T14:15:00", read: false }
        ]
    },
    electronics: {
        sales: {
            labels: ["2023-05-01", "2023-05-02", "2023-05-03", "2023-05-04", "2023-05-05", "2023-05-06", "2023-05-07"],
            data: [800, 1200, 900, 1500, 1100, 1800, 2000]
        },
        activity: {
            labels: ["2023-05-01", "2023-05-02", "2023-05-03", "2023-05-04", "2023-05-05", "2023-05-06", "2023-05-07"],
            activeUsers: [100, 150, 120, 180, 140, 200, 220],
            newUsers: [20, 30, 25, 35, 30, 40, 45]
        },
        inventory: { labels: ["Smartphone", "Headphones", "Notebook"], data: [5, 3, 12] },
        customers: { labels: ["18-24", "25-34", "35-44", "45+"], data: [35, 50, 10, 5] },
        orders: 92,
        revenue: 13799
    },
    clothing: {
        sales: {
            labels: ["2023-05-01", "2023-05-02", "2023-05-03", "2023-05-04", "2023-05-05", "2023-05-06", "2023-05-07"],
            data: [400, 700, 600, 700, 700, 700, 800]
        },
        activity: {
            labels: ["2023-05-01", "2023-05-02", "2023-05-03", "2023-05-04", "2023-05-05", "2023-05-06", "2023-05-07"],
            activeUsers: [50, 80, 60, 70, 60, 80, 100],
            newUsers: [10, 15, 10, 15, 10, 15, 15]
        },
        inventory: { labels: ["T-Shirts", "Jeans", "Jackets"], data: [45, 32, 18] },
        customers: { labels: ["18-24", "25-34", "35-44", "45+"], data: [25, 40, 20, 15] },
        orders: 92,
        revenue: 10781
    }
};

const defaultReviews = cloneJson(mockData.all.reviews);
const defaultNotifications = cloneJson(mockData.all.notifications);
const chartContainers = {
    salesChart: "salesChartContainer",
    inventoryChart: "inventoryChartContainer",
    activityChart: "activityChartContainer",
    customerChart: "customerChartContainer"
};
const chartInstances = {};

let currentCategory = "all";
let currentData = withSharedContent(mockData.all);
let debounceTimer;
let resizeTimer;

function cloneData(data) {
    return cloneJson(data);
}

function cloneJson(data) {
    return JSON.parse(JSON.stringify(data));
}

function withSharedContent(data) {
    const merged = cloneData(data);
    merged.reviews = cloneData(defaultReviews);
    merged.notifications = defaultNotifications;
    return merged;
}

function parseLocalDate(value) {
    if (!value) return null;
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());

    const [datePart] = String(value).split("T");
    const parts = datePart.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function toInputDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(value) {
    const date = value.includes("T") ? new Date(value) : parseLocalDate(value);
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: value.includes("T") ? "2-digit" : undefined,
        minute: value.includes("T") ? "2-digit" : undefined
    }).format(date);
}

function formatShortDate(value) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseLocalDate(value));
}

function getCategoryDateRange(category) {
    const labels = mockData[category]?.sales?.labels || [];
    const dates = labels.map(parseLocalDate).filter(Boolean);
    if (!dates.length) return [null, null];
    return [new Date(Math.min(...dates)), new Date(Math.max(...dates))];
}

function getChartViewport() {
    const width = window.innerWidth || document.documentElement.clientWidth;
    return {
        compact: width <= 560,
        narrow: width <= 820
    };
}

function chartOptions(isDonut = false) {
    const viewport = getChartViewport();
    const legendPosition = isDonut && viewport.narrow ? "bottom" : isDonut ? "right" : "top";
    const legendVisible = true;
    const labelSize = viewport.compact ? 10 : viewport.narrow ? 11 : 12;
    const axisSize = viewport.compact ? 9 : viewport.narrow ? 10 : 11;
    const pointRadius = viewport.compact ? 2 : viewport.narrow ? 3 : 4;
    const tickLimit = viewport.compact ? 4 : viewport.narrow ? 5 : 7;

    return {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 120,
        animation: { duration: 700, easing: "easeOutQuart" },
        layout: {
            padding: viewport.compact ? 0 : 2
        },
        cutout: isDonut ? viewport.compact ? "62%" : "58%" : undefined,
        plugins: {
            legend: {
                display: legendVisible,
                position: legendPosition,
                labels: {
                    color: "#aeb7c4",
                    boxHeight: viewport.compact ? 6 : 8,
                    boxWidth: viewport.compact ? 6 : 8,
                    font: { family: "Quicksand", weight: "700", size: labelSize },
                    padding: viewport.compact ? 6 : viewport.narrow ? 10 : 14,
                    usePointStyle: true,
                    pointStyle: "circle"
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: "rgba(32, 36, 44, 0.96)",
                titleColor: "#f6f8fb",
                bodyColor: "#aeb7c4",
                titleFont: { family: "Quicksand", size: 14, weight: "700" },
                bodyFont: { family: "Quicksand", size: 12, weight: "600" },
                borderColor: "rgba(76, 141, 246, 0.5)",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                usePointStyle: true
            }
        },
        scales: isDonut ? {} : {
            y: {
                grid: { color: "rgba(255, 255, 255, 0.06)", drawBorder: false },
                ticks: {
                    color: "#aeb7c4",
                    font: { family: "Quicksand", weight: "600", size: axisSize },
                    maxTicksLimit: tickLimit,
                    padding: viewport.compact ? 4 : 7
                }
            },
            x: {
                grid: { color: "rgba(255, 255, 255, 0.04)", drawBorder: false },
                ticks: {
                    autoSkip: true,
                    color: "#aeb7c4",
                    font: { family: "Quicksand", weight: "600", size: axisSize },
                    maxRotation: 0,
                    maxTicksLimit: tickLimit,
                    minRotation: 0,
                    padding: viewport.compact ? 4 : 7
                }
            }
        },
        elements: {
            line: { tension: 0.38, borderWidth: viewport.compact ? 1.5 : 2 },
            point: { radius: pointRadius, hoverRadius: pointRadius + 2, backgroundColor: "#f6f8fb", borderWidth: viewport.compact ? 1 : 2 },
            bar: { borderRadius: 6, borderSkipped: false }
        }
    };
}

function renderOrUpdateChart(canvasId, config) {
    const container = document.getElementById(chartContainers[canvasId]) || document.getElementById(canvasId)?.parentElement;
    if (!container) return;

    if (typeof Chart === "undefined") {
        clearChart(canvasId);
        container.innerHTML = emptyState("fa-chart-simple", "Chart library unavailable");
        return;
    }

    clearChart(canvasId);

    container.innerHTML = `<canvas id="${canvasId}" role="img" aria-label="${config.data.datasets[0].label} chart"></canvas>`;
    const ctx = document.getElementById(canvasId).getContext("2d");
    chartInstances[canvasId] = new Chart(ctx, config);
}

function clearChart(canvasId) {
    if (!chartInstances[canvasId]) return;
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
}

function emptyState(icon, message) {
    return `
        <div class="empty-state">
            <i class="fas ${icon}" aria-hidden="true"></i>
            <p>${message}</p>
        </div>
    `;
}

function filterDataByDateRange(data, startDate, endDate) {
    if (!startDate || !endDate) return data;

    const filtered = cloneData(data);

    if (filtered.sales?.labels) {
        const indices = filtered.sales.labels.reduce((acc, label, index) => {
            const date = parseLocalDate(label);
            if (date >= startDate && date <= endDate) acc.push(index);
            return acc;
        }, []);
        filtered.sales.labels = indices.map(index => data.sales.labels[index]);
        filtered.sales.data = indices.map(index => data.sales.data[index]);
    }

    if (filtered.activity?.labels) {
        const indices = filtered.activity.labels.reduce((acc, label, index) => {
            const date = parseLocalDate(label);
            if (date >= startDate && date <= endDate) acc.push(index);
            return acc;
        }, []);
        filtered.activity.labels = indices.map(index => data.activity.labels[index]);
        filtered.activity.activeUsers = indices.map(index => data.activity.activeUsers[index]);
        filtered.activity.newUsers = indices.map(index => data.activity.newUsers[index]);
    }

    filtered.orders = filtered.sales?.data?.length || 0;
    filtered.revenue = filtered.sales?.data?.reduce((sum, value) => sum + value, 0) || 0;
    filtered.reviews = cloneData(defaultReviews);
    filtered.notifications = defaultNotifications;

    return filtered;
}

function populateDashboard(data) {
    renderSalesChart(data);
    renderInventoryChart(data);
    renderActivityChart(data);
    renderCustomerChart(data);
    renderStats(data);
    renderReviews(data.reviews);
}

function renderSalesChart(data) {
    const container = document.getElementById("salesChartContainer");
    if (!data.sales?.labels?.length) {
        clearChart("salesChart");
        container.innerHTML = emptyState("fa-chart-line", "No sales data available for the selected filters");
        return;
    }

    renderOrUpdateChart("salesChart", {
        type: "line",
        data: {
            labels: data.sales.labels.map(formatShortDate),
            datasets: [{
                label: "Sales ($)",
                data: data.sales.data,
                backgroundColor: "rgba(76, 141, 246, 0.12)",
                borderColor: "#4c8df6",
                pointBorderColor: "#4c8df6",
                fill: true
            }]
        },
        options: chartOptions()
    });
}

function renderInventoryChart(data) {
    const container = document.getElementById("inventoryChartContainer");
    if (!data.inventory?.labels?.length) {
        clearChart("inventoryChart");
        container.innerHTML = emptyState("fa-boxes-stacked", "No inventory data available for the selected filters");
        return;
    }

    renderOrUpdateChart("inventoryChart", {
        type: "bar",
        data: {
            labels: data.inventory.labels,
            datasets: [{
                label: "Stock Levels",
                data: data.inventory.data,
                backgroundColor: ["#4c8df6", "#41b883", "#f5b84b", "#ef5b5b"].slice(0, data.inventory.labels.length),
                borderColor: "rgba(255, 255, 255, 0.28)",
                borderWidth: 1
            }]
        },
        options: chartOptions()
    });
}

function renderActivityChart(data) {
    const container = document.getElementById("activityChartContainer");
    if (!data.activity?.labels?.length) {
        clearChart("activityChart");
        container.innerHTML = emptyState("fa-users", "No activity data available for the selected filters");
        return;
    }

    renderOrUpdateChart("activityChart", {
        type: "line",
        data: {
            labels: data.activity.labels.map(formatShortDate),
            datasets: [
                {
                    label: "Active Users",
                    data: data.activity.activeUsers,
                    borderColor: "#4c8df6",
                    pointBorderColor: "#4c8df6",
                    backgroundColor: "rgba(76, 141, 246, 0.12)",
                    fill: true
                },
                {
                    label: "New Users",
                    data: data.activity.newUsers,
                    borderColor: "#41b883",
                    pointBorderColor: "#41b883",
                    backgroundColor: "rgba(65, 184, 131, 0.12)",
                    fill: true
                }
            ]
        },
        options: chartOptions()
    });
}

function renderCustomerChart(data) {
    const container = document.getElementById("customerChartContainer");
    if (!data.customers?.labels?.length) {
        clearChart("customerChart");
        container.innerHTML = emptyState("fa-user-group", "No demographic data available for the selected filters");
        return;
    }

    renderOrUpdateChart("customerChart", {
        type: "doughnut",
        data: {
            labels: data.customers.labels,
            datasets: [{
                label: "Age Group",
                data: data.customers.data,
                backgroundColor: ["#4c8df6", "#41b883", "#f5b84b", "#ef5b5b"],
                borderColor: "#20242c",
                borderWidth: 3
            }]
        },
        options: chartOptions(true)
    });
}

function renderStats(data) {
    document.getElementById("revenueValue").textContent = data.revenue ? `$${data.revenue.toLocaleString("en-US")}` : "$0";
    document.getElementById("ordersValue").textContent = String(data.orders || 0);
}

function renderReviews(reviews) {
    const container = document.getElementById("reviewsList");
    if (!reviews?.length) {
        container.innerHTML = emptyState("fa-comment-slash", "No reviews available for the selected filters");
        return;
    }

    container.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-meta">
                <span class="review-author">${review.author}</span>
                <span class="review-rating" aria-label="${review.rating} out of 5 stars">${renderRating(review.rating)}</span>
            </div>
            <p class="review-text">"${review.text}"</p>
            <span class="review-date">${formatDate(review.date)}</span>
        </div>
    `).join("");
}

function renderRating(rating) {
    return Array.from({ length: 5 }, (_, index) => {
        const icon = index < rating ? "fas fa-star" : "far fa-star";
        return `<i class="${icon}" aria-hidden="true"></i>`;
    }).join("");
}

function updateNotificationBadge() {
    const badge = document.getElementById("notificationBadge");
    const unreadCount = defaultNotifications.filter(notification => !notification.read).length;

    badge.textContent = unreadCount ? String(unreadCount) : "";
    badge.classList.toggle("active", unreadCount > 0);
}

function populateNotifications() {
    const list = document.getElementById("notificationList");
    const unreadNotifications = defaultNotifications.filter(notification => !notification.read);
    updateNotificationBadge();

    if (!unreadNotifications.length) {
        list.innerHTML = emptyState("fa-bell-slash", "No notifications to display");
        return;
    }

    list.innerHTML = unreadNotifications.map(item => `
        <div class="notification-item ${item.type}" data-id="${item.id}">
            <span class="notification-read" aria-hidden="true"></span>
            <p>${item.message}</p>
            <div class="notification-time">${formatDate(item.date)}</div>
        </div>
    `).join("");
}

function applyFilters() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const category = document.getElementById("categoryFilter")?.value || "all";
        const startValue = document.getElementById("startDate")?.value;
        const endValue = document.getElementById("endDate")?.value;
        const startDate = parseLocalDate(startValue);
        const endDate = parseLocalDate(endValue);

        if (startDate && endDate && startDate > endDate) {
            showNotificationToast("Start date cannot be after end date", "error");
            return;
        }

        const baseData = withSharedContent(mockData[category] || mockData.all);
        currentData = startDate && endDate ? filterDataByDateRange(baseData, startDate, endDate) : baseData;
        currentCategory = category;

        populateDashboard(currentData);
        populateNotifications();
        showNotificationToast("Filters applied successfully", "success");
    }, 160);
}

function createCustomSelect(containerId, options, defaultValue) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const selected = document.createElement("button");
    selected.className = "custom-select-selected";
    selected.type = "button";
    selected.setAttribute("aria-haspopup", "listbox");
    selected.setAttribute("aria-expanded", "false");

    const list = document.createElement("div");
    list.className = "custom-select-options";
    list.setAttribute("role", "listbox");

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.id = "categoryFilter";
    hidden.value = defaultValue;

    function setValue(option) {
        hidden.value = option.value;
        selected.innerHTML = `<span>${option.label}</span><span class="custom-select-arrow"><i class="fas fa-chevron-down" aria-hidden="true"></i></span>`;
        list.querySelectorAll(".custom-select-option").forEach(item => {
            item.classList.toggle("selected", item.dataset.value === option.value);
        });
    }

    options.forEach(option => {
        const item = document.createElement("div");
        item.className = "custom-select-option";
        item.dataset.value = option.value;
        item.textContent = option.label;
        item.setAttribute("role", "option");
        item.addEventListener("click", () => {
            setValue(option);
            selected.setAttribute("aria-expanded", "false");
            list.classList.remove("active");
        });
        list.appendChild(item);
    });

    selected.addEventListener("click", event => {
        event.stopPropagation();
        const expanded = selected.getAttribute("aria-expanded") === "true";
        selected.setAttribute("aria-expanded", String(!expanded));
        list.classList.toggle("active", !expanded);
    });

    document.addEventListener("click", event => {
        if (!container.contains(event.target)) {
            selected.setAttribute("aria-expanded", "false");
            list.classList.remove("active");
        }
    });

    container.append(selected, list, hidden);
    setValue(options.find(option => option.value === defaultValue) || options[0]);
}

function createCustomDatePicker(containerId, defaultDate, minDate, maxDate) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    let selectedDate = parseLocalDate(defaultDate) || new Date();
    let visibleMonth = selectedDate.getMonth();
    let visibleYear = selectedDate.getFullYear();

    const display = document.createElement("button");
    display.type = "button";
    display.className = "custom-date-display";
    display.setAttribute("aria-haspopup", "dialog");
    display.setAttribute("aria-expanded", "false");

    const calendar = document.createElement("div");
    calendar.className = "custom-date-calendar";

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.id = containerId === "customStartDate" ? "startDate" : "endDate";

    function setSelectedDate(date) {
        selectedDate = parseLocalDate(date);
        hidden.value = toInputDate(selectedDate);
        display.innerHTML = `<span>${hidden.value}</span><i class="fas fa-calendar-days" aria-hidden="true"></i>`;
    }

    function isOutOfRange(date) {
        return (minDate && date < minDate) || (maxDate && date > maxDate);
    }

    function renderCalendar() {
        calendar.innerHTML = "";

        const header = document.createElement("div");
        header.className = "calendar-header";

        const previous = document.createElement("button");
        previous.type = "button";
        previous.className = "calendar-nav";
        previous.innerHTML = `<i class="fas fa-chevron-left" aria-hidden="true"></i>`;

        const title = document.createElement("span");
        title.className = "calendar-title";
        title.textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(visibleYear, visibleMonth, 1));

        const next = document.createElement("button");
        next.type = "button";
        next.className = "calendar-nav";
        next.innerHTML = `<i class="fas fa-chevron-right" aria-hidden="true"></i>`;

        previous.addEventListener("click", event => {
            event.stopPropagation();
            visibleMonth = visibleMonth === 0 ? 11 : visibleMonth - 1;
            if (visibleMonth === 11) visibleYear -= 1;
            renderCalendar();
        });

        next.addEventListener("click", event => {
            event.stopPropagation();
            visibleMonth = visibleMonth === 11 ? 0 : visibleMonth + 1;
            if (visibleMonth === 0) visibleYear += 1;
            renderCalendar();
        });

        header.append(previous, title, next);
        calendar.appendChild(header);

        const table = document.createElement("table");
        const headerRow = document.createElement("tr");
        ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(day => {
            const th = document.createElement("th");
            th.textContent = day;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        const firstDay = new Date(visibleYear, visibleMonth, 1).getDay();
        const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
        let day = 1;

        for (let week = 0; week < 6; week += 1) {
            const row = document.createElement("tr");
            for (let index = 0; index < 7; index += 1) {
                const cell = document.createElement("td");
                if ((week === 0 && index < firstDay) || day > daysInMonth) {
                    cell.textContent = "";
                } else {
                    const date = new Date(visibleYear, visibleMonth, day);
                    cell.textContent = String(day);

                    if (toInputDate(date) === toInputDate(selectedDate)) {
                        cell.classList.add("selected");
                    }

                    if (isOutOfRange(date)) {
                        cell.classList.add("disabled");
                    } else {
                        cell.addEventListener("click", () => {
                            setSelectedDate(date);
                            calendar.classList.remove("active");
                            display.setAttribute("aria-expanded", "false");
                        });
                    }
                    day += 1;
                }
                row.appendChild(cell);
            }
            table.appendChild(row);
            if (day > daysInMonth) break;
        }

        calendar.appendChild(table);
    }

    display.addEventListener("click", event => {
        event.stopPropagation();
        document.querySelectorAll(".custom-date-calendar.active").forEach(openCalendar => {
            if (openCalendar !== calendar) openCalendar.classList.remove("active");
        });
        const isActive = calendar.classList.toggle("active");
        display.setAttribute("aria-expanded", String(isActive));
        if (isActive) renderCalendar();
    });

    calendar.addEventListener("click", event => event.stopPropagation());

    document.addEventListener("click", event => {
        if (!container.contains(event.target)) {
            calendar.classList.remove("active");
            display.setAttribute("aria-expanded", "false");
        }
    });

    setSelectedDate(selectedDate);
    container.append(display, calendar, hidden);
}

function resetDatePickersForCategory(category) {
    const [minDate, maxDate] = getCategoryDateRange(category);
    if (!minDate || !maxDate) return;
    createCustomDatePicker("customStartDate", minDate, minDate, maxDate);
    createCustomDatePicker("customEndDate", maxDate, minDate, maxDate);
}

function setNotificationPanel(open) {
    const panel = document.getElementById("notificationPanel");
    const overlay = document.getElementById("notificationOverlay");

    panel.classList.toggle("active", open);
    overlay.classList.toggle("active", open);
    panel.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("panel-open", open);

    if (open) populateNotifications();
}

function markNotificationAsRead(id) {
    const notification = defaultNotifications.find(item => item.id === id);
    if (!notification) return;
    notification.read = true;
    populateNotifications();
}

function showNotificationToast(message, type = "success") {
    document.querySelector(".toast-notification")?.remove();

    const toast = document.createElement("div");
    const icon = type === "error" ? "fa-circle-exclamation" : "fa-circle-check";
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 220);
    }, 2400);
}

function setupEventListeners() {
    document.getElementById("applyFilters").addEventListener("click", applyFilters);
    document.getElementById("notificationBell").addEventListener("click", () => setNotificationPanel(true));
    document.getElementById("closeNotifications").addEventListener("click", () => setNotificationPanel(false));
    document.getElementById("notificationOverlay").addEventListener("click", () => setNotificationPanel(false));

    document.getElementById("notificationList").addEventListener("click", event => {
        const item = event.target.closest(".notification-item");
        if (item?.dataset.id) markNotificationAsRead(Number(item.dataset.id));
    });

    document.getElementById("reviewsToggle").addEventListener("click", event => {
        const button = event.currentTarget;
        const content = document.getElementById("reviewsExtra");
        const isVisible = content.classList.toggle("visible");
        button.setAttribute("aria-expanded", String(isVisible));
        button.querySelector("span").textContent = isVisible ? "Show Less" : "Learn More";
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") setNotificationPanel(false);
    });

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            populateDashboard(currentData);
        }, 180);
    });
}

function initDashboard() {
    resetDatePickersForCategory("all");
    createCustomSelect("customCategory", [
        { value: "all", label: "All" },
        { value: "electronics", label: "Electronics" },
        { value: "clothing", label: "Clothing" }
    ], "all");

    populateDashboard(currentData);
    populateNotifications();
    setupEventListeners();
}

document.addEventListener("DOMContentLoaded", initDashboard);
