// Coffee Shop POS Main Application Logic

// Application State
let currentState = {
  currentUser: null,
  activeView: "login",
  products: [],
  customers: [],
  orders: [],
  cart: [],
  selectedCustomer: null,
  isPointsRedeemed: false,
  paymentMethod: "cash", // 'cash' | 'qr_code'
  selectedCustomerForHistory: null
};

// Chart Instance Keeper
let salesChartInstance = null;

// DOM Elements
const views = {
  login: document.getElementById("login-view"),
  mainLayout: document.getElementById("main-layout"),
  dashboard: document.getElementById("dashboard-view"),
  pos: document.getElementById("pos-view"),
  customers: document.getElementById("customers-view"),
  inventory: document.getElementById("inventory-view")
};

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Init Database adapter
  await window.db.init();
  
  // Toggle Demo Banner
  const demoBanner = document.getElementById("demo-banner");
  if (window.db.isDemo) {
    demoBanner.style.display = "flex";
  } else {
    demoBanner.style.display = "none";
  }

  // 2. Setup Navigation
  initNavigation();

  // 3. Setup Auth Event Listeners
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("btn-logout").addEventListener("click", handleLogout);

  // 4. POS Event Listeners
  initPOSEventListeners();

  // 5. Customer Event Listeners
  initCustomerEventListeners();

  // 6. Inventory Event Listeners
  initInventoryEventListeners();

  // Initialize Lucide Icons
  lucide.createIcons();

  // Auto-login check (optional - for convenience during development we can mock or wait)
  checkSession();
});

// Toast Notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "info";
  if (type === "success") icon = "check-circle";
  if (type === "error") icon = "alert-circle";

  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  lucide.createIcons();

  // Remove toast after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = "slideInRight 0.3s ease-in reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ================= AUTHENTICATION HANDLERS =================
function checkSession() {
  const savedUser = sessionStorage.getItem("pos_cashier");
  if (savedUser) {
    currentState.currentUser = JSON.parse(savedUser);
    document.getElementById("display-user-name").textContent = currentState.currentUser.name;
    showMainApp();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById("login-username").value.trim();
  const passwordInput = document.getElementById("login-password").value;
  const errorDiv = document.getElementById("login-error");

  errorDiv.style.display = "none";

  // Demo Login Validation
  if (usernameInput === "admin" && passwordInput === "admin") {
    currentState.currentUser = { name: "เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธ‘เน€เธโ€เน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธยเน€เธเธ’เน€เธย A (Admin)", role: "admin" };
    sessionStorage.setItem("pos_cashier", JSON.stringify(currentState.currentUser));
    document.getElementById("display-user-name").textContent = currentState.currentUser.name;
    showToast("เน€เธโฌเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธโ€เน€เธยเน€เธเธเน€เธยเน€เธโ€”เน€เธโ€เน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธ“เน€เธโฌเน€เธเธเน€เธยเน€เธย", "success");
    showMainApp();
    return;
  }

  // Supabase Auth Integration
  if (!window.db.isDemo && window.db.supabase) {
    try {
      const { data, error } = await window.db.supabase.auth.signInWithPassword({
        email: usernameInput.includes("@") ? usernameInput : `${usernameInput}@cafepos.com`,
        password: passwordInput
      });
      if (error) throw error;

      currentState.currentUser = {
        name: data.user.email.split("@")[0].toUpperCase() + " (Supabase)",
        role: "staff",
        id: data.user.id
      };
      sessionStorage.setItem("pos_cashier", JSON.stringify(currentState.currentUser));
      document.getElementById("display-user-name").textContent = currentState.currentUser.name;
      showToast("เน€เธโฌเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธโฌเน€เธเธเน€เธเธ•เน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธเธ…เน€เธยเน€เธเธ", "success");
      showMainApp();
      return;
    } catch (err) {
      errorDiv.textContent = "เน€เธยเน€เธเธ—เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธ—เน€เธเธเน€เธเธเน€เธเธเน€เธเธ‘เน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธโ€“เน€เธเธเน€เธยเน€เธโ€ขเน€เธยเน€เธเธเน€เธย: " + err.message;
      errorDiv.style.display = "block";
      return;
    }
  }

  errorDiv.textContent = "เน€เธยเน€เธเธ—เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธเธเน€เธเธเน€เธเธ—เน€เธเธเน€เธเธเน€เธเธเน€เธเธ‘เน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธโ€“เน€เธเธเน€เธยเน€เธโ€ขเน€เธยเน€เธเธเน€เธย (เน€เธยเน€เธย Demo Mode เน€เธยเน€เธยเน€เธย admin/admin)";
  errorDiv.style.display = "block";
}

function handleLogout() {
  currentState.currentUser = null;
  sessionStorage.removeItem("pos_cashier");
  
  // Hide main layout, show login view
  views.mainLayout.classList.add("hidden");
  views.login.classList.remove("hidden");
  
  currentState.activeView = "login";
  showToast("เน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธโฌเน€เธเธเน€เธเธ•เน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธเธ…เน€เธยเน€เธเธ", "info");
}

function showMainApp() {
  views.login.classList.add("hidden");
  views.mainLayout.classList.remove("hidden");
  switchView("dashboard");
}

// ================= NAVIGATION ROUTER =================
function initNavigation() {
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-target");
      
      // Update Active class
      sidebarItems.forEach(si => si.classList.remove("active"));
      item.classList.add("active");
      
      switchView(target);
    });
  });
}

function switchView(targetView) {
  // Hide all views
  views.dashboard.classList.add("hidden");
  views.pos.classList.add("hidden");
  views.customers.classList.add("hidden");
  views.inventory.classList.add("hidden");

  // Show active view
  views[targetView].classList.remove("hidden");
    currentState.activeView = targetView;

  // Google Analytics GA4 Virtual Pageview tracking
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_title: targetView.toUpperCase() + ' - Cafe POS',
      page_location: window.location.href,
      page_path: '/' + targetView
    });
  }

  // Initialize View Data
  if (targetView === "dashboard") {
    loadDashboardData();
  } else if (targetView === "pos") {
    loadPOSData();
  } else if (targetView === "customers") {
    loadCustomersData();
  } else if (targetView === "inventory") {
    loadInventoryData();
  }
}

// ================= 1. DASHBOARD CONTROLLER =================
async function loadDashboardData() {
  try {
    const products = await window.db.getProducts();
    const customers = await window.db.getCustomers();
    const orders = await window.db.getOrders();

    currentState.products = products;
    currentState.customers = customers;
    currentState.orders = orders;

    // Filter orders for Today
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayOrders = orders.filter(o => {
      const oDate = new Date(o.created_at);
      return oDate >= today;
    });

    // Calculate revenue today
    const revenueToday = todayOrders.reduce((sum, o) => sum + parseFloat(o.final_amount), 0);
    document.getElementById("stat-revenue-today").textContent = `เน€เธเธ${revenueToday.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById("stat-orders-today").textContent = todayOrders.length;
    document.getElementById("stat-total-customers").textContent = customers.length;

    // Calculate points accumulated across all customers
    const totalPoints = customers.reduce((sum, c) => sum + parseFloat(c.points || 0), 0);
    document.getElementById("stat-total-points").textContent = totalPoints.toLocaleString('th-TH', { maximumFractionDigits: 1 });

    // Render charts
    renderSalesChart(orders);
    
    // Render popular items
    await renderPopularItems(orders, products);

    // Render recent orders table
    renderRecentOrders(orders);

  } catch (err) {
    console.error("Error loading dashboard data:", err);
    showToast("เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธเธ’เน€เธเธเน€เธโ€“เน€เธโ€เน€เธเธ–เน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ…เน€เธยเน€เธโ€เน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธโ€เน€เธยเน€เธโ€เน€เธย", "error");
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById("recent-orders-tbody");
  tbody.innerHTML = "";
  
  // Show last 10 orders
  const limitOrders = orders.slice(0, 10);
  
  if (limitOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ•เน€เธเธเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธยเน€เธเธ—เน€เธยเน€เธเธเน€เธเธ…เน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธโ€</td></tr>`;
    return;
  }

  limitOrders.forEach(order => {
    const orderDate = new Date(order.created_at).toLocaleString("th-TH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

    const totalVal = parseFloat(order.final_amount);
    
    // Find customer name
    let customerName = "เน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธโ€”เน€เธเธ‘เน€เธยเน€เธเธเน€เธยเน€เธย (Guest)";
    if (order.customer_id) {
      const cust = currentState.customers.find(c => c.id === order.customer_id);
      if (cust) customerName = cust.name;
    }

    const payMethodText = order.payment_method === "cash" ? "เน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธเน€เธโ€" : "PromptPay";
    const pointsTxt = order.customer_id ? `+${order.points_earned} / -${order.points_redeemed}` : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight: 600;">${order.id.substring(0, 8).toUpperCase()}</td>
      <td>${order.employee_name}</td>
      <td>${customerName}</td>
      <td style="font-weight: bold; color: var(--primary);">เน€เธเธ${totalVal.toFixed(2)}</td>
      <td>${pointsTxt}</td>
      <td>${payMethodText}</td>
      <td style="font-size: 0.8rem; color: var(--text-secondary);">${orderDate}</td>
      <td>
        <button class="btn btn-secondary btn-search-sm" onclick="showReceiptDetail('${order.id}')" title="เน€เธโ€เน€เธเธเน€เธยเน€เธยเน€เธโฌเน€เธเธเน€เธเธเน€เธยเน€เธย">
          <i data-lucide="receipt" style="width: 14px; height: 14px;"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

async function renderPopularItems(orders, products) {
  const listEl = document.getElementById("popular-items-list");
  listEl.innerHTML = "";

  const salesCount = {}; // product_id -> quantity
  const revenueMap = {}; // product_id -> subtotal revenue

  // Read items
  for (const o of orders) {
    const items = await window.db.getOrderItems(o.id);
    items.forEach(item => {
      salesCount[item.product_id] = (salesCount[item.product_id] || 0) + item.quantity;
      revenueMap[item.product_id] = (revenueMap[item.product_id] || 0) + parseFloat(item.subtotal);
    });
  }

  // Map to array & sort
  const popular = Object.keys(salesCount).map(pid => {
    const prod = products.find(p => p.id === pid);
    return {
      name: prod ? prod.name : "เน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธโ€“เน€เธเธเน€เธยเน€เธเธ…เน€เธย",
      category: prod ? prod.category : "unknown",
      qty: salesCount[pid],
      revenue: revenueMap[pid]
    };
  });

  popular.sort((a, b) => b.qty - a.qty);

  const top5 = popular.slice(0, 5);

  if (top5.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin: auto;">เน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ•เน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ…เน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ’เน€เธเธ</div>`;
    return;
  }

  top5.forEach(item => {
    const div = document.createElement("div");
    div.className = "popular-item";
    div.innerHTML = `
      <div class="popular-item-info">
        <span class="popular-name">${item.name}</span>
        <span class="popular-sales">${item.category === "coffee" ? "เนยโ€ข เน€เธยเน€เธเธ’เน€เธยเน€เธย" : "เนยเธ…ย เน€เธโฌเน€เธยเน€เธโฌเน€เธยเน€เธเธเน€เธเธเน€เธเธ•เน€เธย"} เนโฌเธ เน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ…เน€เธยเน€เธเธ ${item.qty} เน€เธยเน€เธเธ”เน€เธยเน€เธย</span>
      </div>
      <span class="popular-revenue">เน€เธเธ${item.revenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    `;
    listEl.appendChild(div);
  });
}

function renderSalesChart(orders) {
  const canvas = document.getElementById("sales-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Destroy previous chart if exists
  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  // Calculate totals for last 7 days
  const labels = [];
  const datasetData = [];

  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    day.setHours(0,0,0,0);
    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);

    const dayName = day.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    labels.push(dayName);

    const dayOrders = orders.filter(o => {
      const oDate = new Date(o.created_at);
      return oDate >= day && oDate < dayEnd;
    });

    const daySum = dayOrders.reduce((sum, o) => sum + parseFloat(o.final_amount), 0);
    datasetData.push(daySum);
  }

  salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'เน€เธเธเน€เธเธเน€เธโ€เน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธเธ’เน€เธเธเน€เธเธเน€เธเธ‘เน€เธย (เน€เธยเน€เธเธ’เน€เธโ€”)',
        data: datasetData,
        borderColor: '#c8963e',
        backgroundColor: 'rgba(200, 150, 62, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#c8963e',
        pointBorderColor: '#120e0c',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
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
          callbacks: {
            label: function(context) {
              return ` เน€เธเธเน€เธเธเน€เธโ€เน€เธยเน€เธเธ’เน€เธเธ: เน€เธเธ${context.raw.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#bbaea8',
            font: { family: 'Inter' }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#bbaea8',
            font: { family: 'Inter' }
          }
        }
      }
    }
  });
}

// ================= 2. POS SCREEN CONTROLLER =================
async function loadPOSData() {
  try {
    const products = await window.db.getProducts();
    // Cache active products
    currentState.products = products.filter(p => p.is_available);
    
    renderPOSProducts(currentState.products);
  } catch (err) {
    showToast("เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธเธ’เน€เธเธเน€เธโ€“เน€เธโ€เน€เธเธ–เน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ…เน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ“เน€เธเธเน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธโ€เน€เธย", "error");
  }
}

function renderPOSProducts(productsList) {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  if (productsList.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธโ€”เน€เธเธ•เน€เธยเน€เธโ€ขเน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธเธ</div>`;
    return;
  }

  productsList.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // Choose icon category
    const icon = prod.category === "coffee" ? "coffee" : "cookie";
    const pointsBadge = prod.category === "coffee" && prod.points_reward > 0 
      ? `<span class="product-reward-badge">+${prod.points_reward} เน€เธยเน€เธโ€ขเน€เธยเน€เธเธ</span>`
      : "";

    card.innerHTML = `
      <div class="product-image-placeholder">
        <i data-lucide="${icon}" style="width: 32px; height: 32px;"></i>
      </div>
      <div class="product-info">
        <div class="product-name" title="${prod.name}">${prod.name}</div>
        <div class="product-card-footer">
          <span class="product-price">เน€เธเธ${parseFloat(prod.price).toFixed(2)}</span>
          ${pointsBadge}
        </div>
      </div>
    `;

    card.addEventListener("click", () => addToCart(prod));
    grid.appendChild(card);
  });
  lucide.createIcons();
}

function initPOSEventListeners() {
  // Search product
  document.getElementById("pos-product-search").addEventListener("input", (e) => {
    const searchVal = e.target.value.toLowerCase().trim();
    filterPOSProducts(searchVal, getActiveCategory());
  });

  // Filter tabs
  const tabs = document.querySelectorAll(".category-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const category = tab.getAttribute("data-target") || tab.getAttribute("data-category");
      const searchVal = document.getElementById("pos-product-search").value.toLowerCase().trim();
      filterPOSProducts(searchVal, category);
    });
  });

  // Search Customer Loyalty
  document.getElementById("btn-search-customer").addEventListener("click", handlePOSCustomerSearch);
  document.getElementById("cart-customer-phone").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handlePOSCustomerSearch();
  });

  // Clear Attached Customer
  document.getElementById("btn-clear-attached-customer").addEventListener("click", clearAttachedCustomer);

  // Loyalty point redemption switch logic
  document.getElementById("chk-redeem-points").addEventListener("change", (e) => {
    currentState.isPointsRedeemed = e.target.checked;
    updateCartTotals();
  });

  // Payment Method switching
  const payBtns = document.querySelectorAll(".payment-btn");
  payBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      payBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentState.paymentMethod = btn.getAttribute("data-method");
    });
  });

  // Checkout submit button
  document.getElementById("btn-checkout-submit").addEventListener("click", handleCheckoutSubmit);

  // Register Customer Modal Trigger in POS
  document.getElementById("btn-add-customer-trigger").addEventListener("click", () => {
    // Fill phone number if already typed in POS search box
    const phoneInput = document.getElementById("cart-customer-phone").value.trim();
    if (phoneInput.length === 10 && !isNaN(phoneInput)) {
      document.getElementById("cust-phone-input").value = phoneInput;
    }
    openModal("customer-modal");
  });
}

function getActiveCategory() {
  const tab = document.querySelector(".category-tab.active");
  return tab ? tab.getAttribute("data-category") : "all";
}

function filterPOSProducts(searchVal, category) {
  let filtered = currentState.products;

  // Filter category
  if (category && category !== "all") {
    filtered = filtered.filter(p => p.category === category);
  }

  // Filter search
  if (searchVal) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal));
  }

  renderPOSProducts(filtered);
}

// POS Cart Management
function addToCart(product) {
  const existing = currentState.cart.find(item => item.product.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    currentState.cart.push({ product: product, quantity: 1 });
  }
  updateCartUI();
  showToast(`เน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธ ${product.name} เน€เธเธ…เน€เธยเน€เธโ€ขเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธ’`, "success");
}

function updateCartQty(productId, delta) {
  const item = currentState.cart.find(i => i.product.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    // Remove
    currentState.cart = currentState.cart.filter(i => i.product.id !== productId);
  }
  updateCartUI();
}

function removeFromCart(productId) {
  const item = currentState.cart.find(i => i.product.id === productId);
  currentState.cart = currentState.cart.filter(i => i.product.id !== productId);
  updateCartUI();
  if (item) showToast(`เน€เธโฌเน€เธเธเน€เธเธ’ ${item.product.name} เน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธโ€ขเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธ’`, "info");
}

function updateCartUI() {
  const container = document.getElementById("cart-items");
  container.innerHTML = "";

  const totalCount = currentState.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cart-item-count").textContent = totalCount;

  if (currentState.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <i data-lucide="shopping-bag"></i>
        <p>เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ•เน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธโ€ขเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธ’</p>
      </div>
    `;
    lucide.createIcons();
    updateCartTotals();
    return;
  }

  currentState.cart.forEach(item => {
    const prod = item.product;
    const subtotal = prod.price * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-details">
        <div class="cart-item-name">${prod.name}</div>
        <div class="cart-item-price">เน€เธเธ${parseFloat(prod.price).toFixed(2)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="btn-qty" onclick="updateCartQty('${prod.id}', -1)">-</button>
        <span class="qty-val">${item.quantity}</span>
        <button class="btn-qty" onclick="updateCartQty('${prod.id}', 1)">+</button>
      </div>
      <div class="cart-item-subtotal">เน€เธเธ${subtotal.toFixed(2)}</div>
      <button class="btn-remove-item" onclick="removeFromCart('${prod.id}')" title="เน€เธเธ…เน€เธยเน€เธเธเน€เธเธเน€เธย">
        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
      </button>
    `;
    container.appendChild(row);
  });
  lucide.createIcons();
  updateCartTotals();
}

function updateCartTotals() {
  const subtotal = currentState.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // Calculate Earned Points
  let pointsEarned = 0;
  currentState.cart.forEach(item => {
    if (item.product.category === "coffee") {
      pointsEarned += parseFloat(item.product.points_reward || 0) * item.quantity;
    }
  });

  // Calculate Redemption discount
  let discount = 0.0;
  let pointsRedeemed = 0;
  
  if (currentState.selectedCustomer) {
    const custPoints = parseFloat(currentState.selectedCustomer.points || 0);
    
    // Redemption condition: 10 points = 60 THB discount
    if (custPoints >= 10) {
      document.getElementById("point-redeem-container").classList.remove("hidden");
      
      if (currentState.isPointsRedeemed) {
        pointsRedeemed = 10;
        discount = 60.0;
        if (subtotal < discount) {
          discount = subtotal; // discount can't be more than subtotal
        }
      }
    } else {
      document.getElementById("point-redeem-container").classList.add("hidden");
      document.getElementById("chk-redeem-points").checked = false;
      currentState.isPointsRedeemed = false;
    }
  }

  const finalAmount = Math.max(0, subtotal - discount);

  // Update DOM totals
  document.getElementById("summary-subtotal").textContent = `เน€เธเธ${subtotal.toFixed(2)}`;
  document.getElementById("summary-discount").textContent = `เน€เธเธ${discount.toFixed(2)}`;
  document.getElementById("summary-total").textContent = `เน€เธเธ${finalAmount.toFixed(2)}`;

  // Show earned points details if customer is selected
  const pointsRow = document.getElementById("row-points-earn");
  if (currentState.selectedCustomer && pointsEarned > 0) {
    pointsRow.classList.remove("hidden");
    document.getElementById("summary-points-earn").textContent = `+${pointsEarned.toFixed(1)} เน€เธยเน€เธโ€ขเน€เธยเน€เธเธ`;
  } else {
    pointsRow.classList.add("hidden");
  }
}

// Loyalty Customers Attachment in POS
async function handlePOSCustomerSearch() {
  const phone = document.getElementById("cart-customer-phone").value.trim();
  if (!phone) {
    showToast("เน€เธยเน€เธเธเน€เธเธเน€เธโ€เน€เธเธ’เน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธโฌเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธโ€”เน€เธเธเน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธยเน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’", "warning");
    return;
  }

  try {
    const customer = await window.db.getCustomerByPhone(phone);
    if (customer) {
      attachCustomerToCart(customer);
      showToast(`เน€เธยเน€เธยเน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’: ${customer.name}`, "success");
    } else {
      showToast("เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ…เน€เธเธเน€เธเธเน€เธเธ’เน€เธยเน€เธเธ”เน€เธยเน€เธโฌเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธเธ•เน€เธย", "error");
    }
  } catch (err) {
    showToast("เน€เธโฌเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธเธ…เน€เธเธ’เน€เธโ€เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ’เน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’", "error");
  }
}

function attachCustomerToCart(customer) {
  currentState.selectedCustomer = customer;
  document.getElementById("cart-customer-phone").value = customer.phone;
  
  // Reveal customer layout
  const attachDiv = document.getElementById("cart-attached-customer");
  attachDiv.classList.remove("hidden");
  
  document.getElementById("cart-cust-name").textContent = `เน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’: ${customer.name}`;
  document.getElementById("cart-cust-points").textContent = `เน€เธยเน€เธโ€ขเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธเธ: ${parseFloat(customer.points || 0).toFixed(1)} เน€เธยเน€เธโ€ขเน€เธยเน€เธเธ`;

  // Reset redemption checkbox
  document.getElementById("chk-redeem-points").checked = false;
  currentState.isPointsRedeemed = false;

  updateCartTotals();
}

function clearAttachedCustomer() {
  currentState.selectedCustomer = null;
  currentState.isPointsRedeemed = false;
  
  document.getElementById("cart-customer-phone").value = "";
  document.getElementById("cart-attached-customer").classList.add("hidden");
  document.getElementById("chk-redeem-points").checked = false;
  
  updateCartTotals();
}

// POS Checkout execution
function handleCheckoutSubmit() {
  if (currentState.cart.length === 0) {
    showToast("เน€เธยเน€เธเธเน€เธเธเน€เธโ€เน€เธเธ’เน€เธโฌเน€เธเธ…เน€เธเธ—เน€เธเธเน€เธยเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธเธเน€เธยเน€เธโ€ขเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธ“เน€เธเธเน€เธเธเน€เธโฌเน€เธยเน€เธเธ”เน€เธย", "warning");
    return;
  }

  const finalVal = parseFloat(document.getElementById("summary-total").textContent.replace("เน€เธเธ", ""));
  
  if (currentState.paymentMethod === "cash") {
    // Open Cash Payout Modal
    document.getElementById("cash-charge-total").textContent = `เน€เธเธ${finalVal.toFixed(2)}`;
    document.getElementById("cash-received-input").value = "";
    document.getElementById("change-result-row").style.display = "none";
    document.getElementById("btn-cash-confirm").disabled = true;
    
    // Bind change calculations
    const receivedInput = document.getElementById("cash-received-input");
    receivedInput.oninput = () => {
      const received = parseFloat(receivedInput.value) || 0;
      const change = received - finalVal;
      
      const changeRow = document.getElementById("change-result-row");
      const confirmBtn = document.getElementById("btn-cash-confirm");
      
      if (received >= finalVal) {
        changeRow.style.display = "block";
        document.getElementById("cash-change-amount").textContent = `เน€เธเธ${change.toFixed(2)}`;
        confirmBtn.disabled = false;
      } else {
        changeRow.style.display = "none";
        confirmBtn.disabled = true;
      }
    };

    // Form confirmation
    document.getElementById("cash-form").onsubmit = (e) => {
      e.preventDefault();
      executeCheckoutOrder("cash");
    };

    openModal("cash-modal");
  } else {
    // QR Code Payment
    document.getElementById("qr-pay-amount").textContent = `เน€เธเธ${finalVal.toFixed(2)}`;
    
    // Sim success click
    document.getElementById("btn-qr-success-simulate").onclick = () => {
      closeModal("qr-modal");
      executeCheckoutOrder("qr_code");
    };

    openModal("qr-modal");
  }
}

async function executeCheckoutOrder(paymentType) {
  try {
    const subtotal = currentState.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // Points earned calculation
    let pointsEarned = 0;
    currentState.cart.forEach(item => {
      if (item.product.category === "coffee") {
        pointsEarned += parseFloat(item.product.points_reward || 0) * item.quantity;
      }
    });

    let discount = 0.0;
    let pointsRedeemed = 0.0;
    
    if (currentState.selectedCustomer && currentState.isPointsRedeemed) {
      pointsRedeemed = 10.0;
      discount = 60.0;
      if (subtotal < discount) discount = subtotal;
    }

    const finalAmount = subtotal - discount;

    const orderData = {
      employee_name: currentState.currentUser ? currentState.currentUser.name : "เน€เธยเน€เธยเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ’เน€เธย",
      customer_id: currentState.selectedCustomer ? currentState.selectedCustomer.id : null,
      total_amount: subtotal,
      discount_amount: discount,
      final_amount: finalAmount,
      payment_method: paymentType,
      points_earned: currentState.selectedCustomer ? pointsEarned : 0.0,
      points_redeemed: pointsRedeemed
    };

    const items = currentState.cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      subtotal: item.product.price * item.quantity
    }));

    // Save order
    const savedOrder = await window.db.createOrder(orderData, items);
    
    // Close cashier modal if cash
    if (paymentType === "cash") {
      closeModal("cash-modal");
    }

    showToast("เน€เธยเน€เธเธ“เน€เธเธเน€เธเธเน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธยเน€เธเธ…เน€เธเธเน€เธยเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ–เน€เธยเน€เธเธเน€เธเธเน€เธโฌเน€เธโ€เน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธ“เน€เธโฌเน€เธเธเน€เธยเน€เธย", "success");
    
    // Generate and display receipt
    displayReceipt(savedOrder, currentState.cart, paymentType);

    // Reset checkout states
    currentState.cart = [];
    clearAttachedCustomer();
    updateCartUI();

  } catch (err) {
    console.error("Checkout execution error:", err);
    showToast("เน€เธโฌเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธเธ…เน€เธเธ’เน€เธโ€เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ–เน€เธยเน€เธยเน€เธเธ”เน€เธเธ…: " + err.message, "error");
  }
}

// Receipt Modal View Handler
function displayReceipt(order, cartItems, paymentType) {
  const content = document.getElementById("receipt-content");
  const dateStr = new Date(order.created_at || Date.now()).toLocaleString("th-TH");
  
  let custName = "เน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธโ€”เน€เธเธ‘เน€เธยเน€เธเธเน€เธยเน€เธย (Guest)";
  let pointDetails = "";
  
  if (currentState.selectedCustomer) {
    custName = currentState.selectedCustomer.name;
    const initialPts = parseFloat(currentState.selectedCustomer.points);
    const earnPts = parseFloat(order.points_earned);
    const redeemPts = parseFloat(order.points_redeemed);
    const finalPts = Math.max(0, initialPts + earnPts - redeemPts);
    
    pointDetails = `
<div class="receipt-divider"></div>
<div class="receipt-row bold">เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธ’เน€เธยเน€เธเธ”เน€เธย (Loyalty Points)</div>
<div class="receipt-row">เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธเธ•เน€เธย: <span style="text-align:right;">${initialPts.toFixed(1)} pt</span></div>
<div class="receipt-row">เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธโ€”เน€เธเธ•เน€เธยเน€เธยเน€เธโ€เน€เธยเน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธ: <span style="text-align:right;">+${earnPts.toFixed(1)} pt</span></div>
<div class="receipt-row">เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ…เน€เธโ€เน€เธยเน€เธเธ…เน€เธย: <span style="text-align:right;">-${redeemPts.toFixed(1)} pt</span></div>
<div class="receipt-row bold">เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธโ€”เน€เธยเน€เธเธ”: <span style="text-align:right; color:#c8963e;">${finalPts.toFixed(1)} pt</span></div>
    `;
  }

  let itemsHtml = "";
  cartItems.forEach(item => {
    itemsHtml += `
<div class="receipt-item-row">
  <div class="receipt-item-name">${item.product.name}</div>
  <div class="receipt-item-qty">x${item.quantity}</div>
  <div class="receipt-item-sub">เน€เธเธ${(item.product.price * item.quantity).toFixed(2)}</div>
</div>
    `;
  });

  const payTxt = paymentType === "cash" ? "CASH" : "PROMPTPAY QR";

  content.innerHTML = `
    <div class="receipt-header">
      <div class="receipt-shop-name">เนยโ€ข ANTIGRAVITY CAFE เนยเธ…ย</div>
      <div style="font-size:0.75rem; color:#666;">เน€เธเธเน€เธเธ’เน€เธยเน€เธเธ’เน€เธเธเน€เธเธ“เน€เธยเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธย เน€เธยเน€เธโ€”เน€เธเธ. 02-123-4567</div>
      <div style="font-size:0.7rem; color:#888; margin-top:0.25rem;">เน€เธเธเน€เธเธ‘เน€เธยเน€เธโฌเน€เธเธเน€เธเธ…เน€เธเธ’: ${dateStr}</div>
      <div style="font-size:0.7rem; color:#888;">เน€เธโฌเน€เธเธ…เน€เธยเน€เธโ€”เน€เธเธ•เน€เธยเน€เธยเน€เธเธ”เน€เธเธ…: ${order.id.toUpperCase()}</div>
      <div style="font-size:0.7rem; color:#888;">เน€เธยเน€เธยเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธเธ’เน€เธเธ: ${order.employee_name}</div>
    </div>
    
    <div class="receipt-divider"></div>
    <div class="receipt-row bold title-row">
      <div class="receipt-item-name">เน€เธเธเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’</div>
      <div class="receipt-item-qty">เน€เธยเน€เธเธ“เน€เธยเน€เธเธเน€เธย</div>
      <div class="receipt-item-sub">เน€เธเธเน€เธเธเน€เธโ€เน€เธโฌเน€เธยเน€เธเธ”เน€เธย</div>
    </div>
    <div class="receipt-divider"></div>
    
    ${itemsHtml}
    
    <div class="receipt-divider"></div>
    <div class="receipt-row">
      <div>เน€เธเธเน€เธเธ’เน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’ (Subtotal)</div>
      <div>เน€เธเธ${parseFloat(order.total_amount).toFixed(2)}</div>
    </div>
    <div class="receipt-row" style="color:red;">
      <div>เน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธ…เน€เธโ€ (Discount)</div>
      <div>-เน€เธเธ${parseFloat(order.discount_amount).toFixed(2)}</div>
    </div>
    <div class="receipt-row bold" style="font-size:1.05rem; margin-top:0.25rem;">
      <div>เน€เธเธเน€เธเธเน€เธโ€เน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธโ€”เน€เธยเน€เธเธ” (Total)</div>
      <div>เน€เธเธ${parseFloat(order.final_amount).toFixed(2)}</div>
    </div>
    
    <div class="receipt-divider"></div>
    <div class="receipt-row">
      <div>เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธโ€”เน€เธเธ’เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธโฌเน€เธยเน€เธเธ”เน€เธย</div>
      <div>${payTxt}</div>
    </div>
    
    <div class="receipt-divider"></div>
    <div class="receipt-row">
      <div>เน€เธยเน€เธเธ—เน€เธยเน€เธเธเน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’</div>
      <div>${custName}</div>
    </div>
    
    ${pointDetails}
    
    <div class="receipt-divider"></div>
    <div style="text-align:center; font-size:0.75rem; margin-top:1rem; font-weight:600; color:#555;">
      เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธเน€เธโ€เน€เธโ€”เน€เธเธ•เน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ”เน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธเน€เธเธ‘เน€เธย / Thank you!
    </div>
  `;

  // Bind printer simulation
  document.getElementById("btn-print-receipt-simulate").onclick = () => {
    showToast("เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ“เน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธยเน€เธเธ”เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ‘เน€เธยเน€เธโฌเน€เธยเน€เธเธเน€เธเธ—เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธ”เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ“เน€เธโฌเน€เธเธเน€เธยเน€เธย (Simulated thermal print)", "success");
  };

  // Close handle
  document.getElementById("btn-close-receipt-done").onclick = () => {
    closeModal("receipt-modal");
  };
  document.getElementById("btn-close-receipt-modal").onclick = () => {
    closeModal("receipt-modal");
  };

  openModal("receipt-modal");
}

// Function to view existing orders details from dashboard
async function showReceiptDetail(orderId) {
  try {
    const orderList = currentState.orders;
    const order = orderList.find(o => o.id === orderId);
    if (!order) return;
    
    const items = await window.db.getOrderItems(orderId);
    
    // Map database order items object to cart structures
    const cartItems = items.map(it => ({
      product: { name: it.products.name, price: parseFloat(it.unit_price) },
      quantity: it.quantity
    }));

    // Attach temporary customer info mockup for display
    let custObj = null;
    if (order.customer_id) {
      custObj = currentState.customers.find(c => c.id === order.customer_id);
    }
    
    // Open receipt modal directly
    currentState.selectedCustomer = custObj;
    displayReceipt(order, cartItems, order.payment_method);
    currentState.selectedCustomer = null; // Clean up
  } catch (err) {
    showToast("เน€เธโ€เน€เธเธ–เน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธเธ…เน€เธเธเน€เธโฌเน€เธเธเน€เธเธ•เน€เธเธเน€เธโ€เน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธเธ”เน€เธยเน€เธยเน€เธโฌเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธเธ…เน€เธยเน€เธเธเน€เธโฌเน€เธเธเน€เธเธ…เน€เธเธ", "error");
  }
}

// ================= 3. CUSTOMER LOYALTY VIEWS CONTROLLER =================
async function loadCustomersData() {
  try {
    const list = await window.db.getCustomers();
    currentState.customers = list;
    
    renderCustomerList(list);
    document.getElementById("customer-points-log-card").classList.add("hidden");
  } catch (err) {
    showToast("เน€เธโฌเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธเธ…เน€เธเธ’เน€เธโ€เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธเน€เธเธ…เน€เธโ€เน€เธเธเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ—เน€เธยเน€เธเธเน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’", "error");
  }
}

function renderCustomerList(customerList) {
  const tbody = document.getElementById("customers-tbody");
  tbody.innerHTML = "";

  if (customerList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ—เน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ’เน€เธยเน€เธเธ”เน€เธยเน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’</td></tr>`;
    return;
  }

  customerList.forEach(cust => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.innerHTML = `
      <td style="font-weight:600;"><i data-lucide="user" style="width:14px; height:14px; margin-right:6px; vertical-align:middle; color:var(--primary);"></i>${cust.name}</td>
      <td>${cust.phone}</td>
      <td style="font-weight:700; color:var(--primary);">${parseFloat(cust.points || 0).toFixed(1)} เน€เธยเน€เธโ€ขเน€เธยเน€เธเธ</td>
    `;
    tr.addEventListener("click", () => showCustomerPointsHistory(cust));
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

function initCustomerEventListeners() {
  // Search customers filter
  document.getElementById("customer-search-input").addEventListener("input", (e) => {
    const searchVal = e.target.value.toLowerCase().trim();
    const filtered = currentState.customers.filter(c => 
      c.name.toLowerCase().includes(searchVal) || c.phone.includes(searchVal)
    );
    renderCustomerList(filtered);
  });

  // Modal triggers
  document.getElementById("btn-add-customer-header").addEventListener("click", () => {
    document.getElementById("customer-form").reset();
    openModal("customer-modal");
  });

  // Form submission
  document.getElementById("customer-form").addEventListener("submit", handleCustomerRegister);

  // Close modals
  document.getElementById("btn-close-customer-modal").addEventListener("click", () => closeModal("customer-modal"));
  document.getElementById("btn-cancel-customer-modal").addEventListener("click", () => closeModal("customer-modal"));
}

async function handleCustomerRegister(e) {
  e.preventDefault();
  const name = document.getElementById("cust-name-input").value.trim();
  const phone = document.getElementById("cust-phone-input").value.trim();

  try {
    const newCustomer = { name, phone };
    const saved = await window.db.addCustomer(newCustomer);
    
    showToast(`เน€เธเธ…เน€เธยเน€เธโ€”เน€เธเธเน€เธโฌเน€เธยเน€เธเธ•เน€เธเธเน€เธยเน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’ ${saved.name} เน€เธเธเน€เธเธ“เน€เธโฌเน€เธเธเน€เธยเน€เธย!`, "success");
    closeModal("customer-modal");

    // Refresh view states
    if (currentState.activeView === "customers") {
      loadCustomersData();
    } else if (currentState.activeView === "pos") {
      // If we are in POS, automatically attach the new customer
      attachCustomerToCart(saved);
      document.getElementById("cart-customer-phone").value = saved.phone;
    }
  } catch (err) {
    showToast(err.message || "เน€เธโฌเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธเธ…เน€เธเธ’เน€เธโ€เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ…เน€เธยเน€เธโ€”เน€เธเธเน€เธโฌเน€เธยเน€เธเธ•เน€เธเธเน€เธย", "error");
  }
}

async function showCustomerPointsHistory(customer) {
  try {
    const logs = await window.db.getCustomerPointHistory(customer.id);
    
    const panel = document.getElementById("customer-points-log-card");
    panel.classList.remove("hidden");
    
    document.getElementById("selected-customer-title").textContent = `${customer.name} (เน€เธยเน€เธโ€”เน€เธเธ. ${customer.phone})`;
    
    const tbody = document.getElementById("points-history-tbody");
    tbody.innerHTML = "";

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">เน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ•เน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธเธ”เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ</td></tr>`;
      return;
    }

    logs.forEach(log => {
      const logDate = new Date(log.created_at).toLocaleString("th-TH");
      const isEarn = log.transaction_type === "earn";
      const badgeClass = isEarn ? "badge-success" : "badge-danger";
      const typeTxt = isEarn ? "เน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธยเน€เธโ€ขเน€เธยเน€เธเธ" : "เน€เธยเน€เธเธ…เน€เธยเน€เธเธเน€เธเธ‘เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธ…เน€เธโ€";
      const valTxt = isEarn ? `+${parseFloat(log.points).toFixed(1)}` : `${parseFloat(log.points).toFixed(1)}`;
      const orderTotal = log.orders ? `เน€เธเธ${parseFloat(log.orders.total_amount).toFixed(2)}` : "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-size:0.8rem; color:var(--text-secondary);">${logDate}</td>
        <td><span class="badge ${badgeClass}">${typeTxt}</span></td>
        <td style="font-weight:700; color: ${isEarn ? 'var(--success)' : 'var(--danger)'};">${valTxt}</td>
        <td>${orderTotal}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error loading points logs:", err);
    showToast("เน€เธยเน€เธเธเน€เธเธ…เน€เธโ€เน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธเธ”เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธเธ…เน€เธยเน€เธเธเน€เธโฌเน€เธเธเน€เธเธ…เน€เธเธ", "error");
  }
}


// ================= 4. INVENTORY / PRODUCTS CONTROLLER =================
async function loadInventoryData() {
  try {
    const list = await window.db.getProducts();
    currentState.products = list;
    renderInventoryTable(list);
  } catch (err) {
    showToast("เน€เธโ€เน€เธเธ–เน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ—เน€เธยเน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธ…เน€เธยเน€เธเธเน€เธโฌเน€เธเธเน€เธเธ…เน€เธเธ", "error");
  }
}

function renderInventoryTable(productsList) {
  const tbody = document.getElementById("inventory-tbody");
  tbody.innerHTML = "";

  if (productsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ•เน€เธเธเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธยเน€เธเธ…เน€เธเธ‘เน€เธย</td></tr>`;
    return;
  }

  productsList.forEach(prod => {
    const pointsTxt = prod.category === "coffee" ? `${parseFloat(prod.points_reward).toFixed(1)} เน€เธยเน€เธโ€ขเน€เธยเน€เธเธ/เน€เธยเน€เธยเน€เธยเน€เธเธ` : "-";
    const categoryTxt = prod.category === "coffee" ? "เนยโ€ข เน€เธยเน€เธเธ’เน€เธยเน€เธย (Coffee)" : "เนยเธ…ย เน€เธโฌเน€เธยเน€เธโฌเน€เธยเน€เธเธเน€เธเธเน€เธเธ•เน€เธย (Bakery)";
    const checked = prod.is_available ? "checked" : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600;">${prod.name}</td>
      <td style="color:var(--text-secondary);">${categoryTxt}</td>
      <td style="font-weight:bold; color:var(--primary);">เน€เธเธ${parseFloat(prod.price).toFixed(2)}</td>
      <td>${pointsTxt}</td>
      <td>
        <label class="switch">
          <input type="checkbox" id="toggle-avail-${prod.id}" ${checked} onchange="toggleProductAvailability('${prod.id}', this.checked)">
          <span class="slider"></span>
        </label>
      </td>
      <td>
        <button class="btn btn-secondary btn-search-sm" onclick="editProductTrigger('${prod.id}')" title="เน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’">
          <i data-lucide="edit" style="width:14px; height:14px;"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

function initInventoryEventListeners() {
  // Filter products by search
  document.getElementById("inventory-search-input").addEventListener("input", (e) => {
    const searchVal = e.target.value.toLowerCase().trim();
    const filtered = currentState.products.filter(p => p.name.toLowerCase().includes(searchVal));
    renderInventoryTable(filtered);
  });

  // Category select change in Modal (hide/show reward points for Bakery category)
  document.getElementById("product-category-input").addEventListener("change", (e) => {
    const ptsGroup = document.getElementById("points-reward-group");
    if (e.target.value === "bakery") {
      ptsGroup.style.display = "none";
    } else {
      ptsGroup.style.display = "flex";
    }
  });

  // Modal triggers
  document.getElementById("btn-add-product-header").addEventListener("click", () => {
    document.getElementById("product-form").reset();
    document.getElementById("product-id-input").value = "";
    document.getElementById("product-modal-title").textContent = "เน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธเธเน€เธเธเน€เธย";
    document.getElementById("points-reward-group").style.display = "flex";
    openModal("product-modal");
  });

  // Form submit add / edit
  document.getElementById("product-form").addEventListener("submit", handleProductSave);

  // Close modals
  document.getElementById("btn-close-product-modal").addEventListener("click", () => closeModal("product-modal"));
  document.getElementById("btn-cancel-product-modal").addEventListener("click", () => closeModal("product-modal"));
}

async function handleProductSave(e) {
  e.preventDefault();
  
  const id = document.getElementById("product-id-input").value;
  const name = document.getElementById("product-name-input").value.trim();
  const category = document.getElementById("product-category-input").value;
  const price = parseFloat(document.getElementById("product-price-input").value);
  const image_url = document.getElementById("product-image-input").value.trim();
  
  // Bakery products don't reward points
  let points_reward = 0.0;
  if (category === "coffee") {
    points_reward = parseFloat(document.getElementById("product-points-input").value) || 1.0;
  }

  const pData = { name, category, price, points_reward, image_url };

  try {
    if (id) {
      // Edit
      await window.db.updateProduct(id, pData);
      showToast("เน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ…เน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ“เน€เธโฌเน€เธเธเน€เธยเน€เธย", "success");
    } else {
      // Create new
      await window.db.addProduct(pData);
      showToast("เน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธ“เน€เธโฌเน€เธเธเน€เธยเน€เธย", "success");
    }
    
    closeModal("product-modal");
    loadInventoryData();
  } catch (err) {
    showToast("เน€เธยเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ–เน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ…เน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธ…เน€เธยเน€เธเธเน€เธโฌเน€เธเธเน€เธเธ…เน€เธเธ: " + err.message, "error");
  }
}

async function toggleProductAvailability(id, checked) {
  try {
    await window.db.updateProduct(id, { is_available: checked });
    const pName = currentState.products.find(p => p.id === id)?.name || "เน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’";
    const statusTxt = checked ? "เน€เธโฌเน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ…เน€เธยเน€เธเธ" : "เน€เธยเน€เธเธ”เน€เธโ€เน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ‘เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ’เน€เธเธ";
    showToast(`${pName}: ${statusTxt}`, "info");
  } catch (err) {
    showToast("เน€เธโฌเน€เธยเน€เธเธ…เน€เธเธ•เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธโ€“เน€เธเธ’เน€เธยเน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ“เน€เธโฌเน€เธเธเน€เธยเน€เธย", "error");
    // Revert check
    document.getElementById(`toggle-avail-${id}`).checked = !checked;
  }
}

function editProductTrigger(id) {
  const prod = currentState.products.find(p => p.id === id);
  if (!prod) return;

  document.getElementById("product-id-input").value = prod.id;
  document.getElementById("product-name-input").value = prod.name;
  document.getElementById("product-category-input").value = prod.category;
  document.getElementById("product-price-input").value = prod.price;
  document.getElementById("product-points-input").value = prod.points_reward;
  document.getElementById("product-image-input").value = prod.image_url || "";
  
  document.getElementById("product-modal-title").textContent = "เน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธเธ…เน€เธเธเน€เธโฌเน€เธเธเน€เธเธ•เน€เธเธเน€เธโ€เน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’";
  
  const ptsGroup = document.getElementById("points-reward-group");
  if (prod.category === "bakery") {
    ptsGroup.style.display = "none";
  } else {
    ptsGroup.style.display = "flex";
  }

  openModal("product-modal");
}


// ================= MODAL WINDOW CONTROLS =================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
  }
}

// Make globally available for onclick binds
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
window.toggleProductAvailability = toggleProductAvailability;
window.editProductTrigger = editProductTrigger;
window.showReceiptDetail = showReceiptDetail;
