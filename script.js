// ===== VendaNinja - Point of Sale System =====
// State Management
const state = {
    products: [],
    cart: [],
    sales: [],
    settings: {
        businessName: 'VendaNinja',
        currency: 'R$',
        taxRate: 0,
        theme: 'light',
        storageType: 'localStorage', // 'localStorage' or 'indexedDB'
        timezone: null, // UTC offset (null = auto-detect from device)
        pixKeyType: '', // 'chavealeatoria', 'celular', 'cpf', 'email'
        pixKeyValue: '' // The actual PIX key value
    },
    cashRegister: {
        isOpen: false,
        openDate: null,
        initialAmount: 0,
        currentSession: null,
        history: []
    },
    coupons: [],
    promotions: [],
    campaigns: [],
    appliedCoupon: null
};

// IndexedDB setup
let db = null;
const DB_NAME = 'VendaNinjaDB';
const DB_VERSION = 1;
const STORES = {
    products: 'products',
    sales: 'sales',
    settings: 'settings'
};

// ===== Timezone Detection =====
function getDeviceTimezone() {
    // Get timezone offset in minutes
    const offsetMinutes = new Date().getTimezoneOffset();
    // Convert to hours (negative because getTimezoneOffset returns opposite sign)
    const offsetHours = -offsetMinutes / 60;
    // Round to nearest integer
    return Math.round(offsetHours);
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeStorage();
        await loadData();
        initializeEventListeners();
        
        // Initialize charts and coupons
        if (typeof initializeCharts === 'function') {
            initializeCharts();
        }
        if (typeof initializeCoupons === 'function') {
            initializeCoupons();
        }
        
        // Render after a small delay to ensure DOM is ready and data is loaded
        setTimeout(() => {
            console.log('Inicializando interface...');
            console.log('Produtos carregados:', state.products.length);
            console.log('Vendas carregadas:', state.sales.length);
            
            // Auto-detect timezone if not set
            if (!state.settings.timezone || state.settings.timezone === null || state.settings.timezone === undefined) {
                const deviceTimezone = getDeviceTimezone();
                state.settings.timezone = deviceTimezone;
                saveData();
                console.log('Timezone detectado automaticamente:', deviceTimezone);
            }
            
            renderQuickButtons();
            renderCategories();
            updateCartDisplay();
            applyTheme();
            setupTimezoneOptions();
            applySettings();
            focusSearch();
            updateCashRegisterButton();
            updateCartTime();
            
            // Initialize payment method - show change section if payment is cash (default)
            const paymentMethod = document.getElementById('paymentMethod');
            if (paymentMethod && paymentMethod.value === 'dinheiro') {
                const changeSection = document.getElementById('changeSection');
                if (changeSection) {
                    changeSection.style.display = 'block';
                }
            }
        }, 300);
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

// ===== Data Persistence =====
// These functions are now in script-db.js
// loadData and saveData are wrapper functions that call loadDataFromStorage and saveDataToStorage
async function loadData() {
    try {
        await loadDataFromStorage();
        
        // Ensure products and sales are arrays
        if (!Array.isArray(state.products)) {
            state.products = [];
        }
        if (!Array.isArray(state.sales)) {
            state.sales = [];
        }
        if (!Array.isArray(state.cart)) {
            state.cart = [];
        }
        
        // Load sample products if no data exists
        if (state.products.length === 0) {
            await loadSampleProducts();
        }
        
        applySettings();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Initialize with empty arrays if loading fails
        state.products = state.products || [];
        state.sales = state.sales || [];
        state.cart = state.cart || [];
    }
}

function saveData() {
    saveDataToStorage();
}

async function loadSampleProducts() {
    try {
        const response = await fetch('data/sample-products.json');
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        if (Array.isArray(products) && products.length > 0) {
            state.products = products;
            saveData();
            console.log('Produtos de exemplo carregados:', state.products.length);
        }
    } catch (err) {
        console.error('Erro ao carregar produtos de exemplo:', err);
        // Create default sample products if JSON fails
        state.products = getDefaultProducts();
        saveData();
        console.log('Produtos padrão carregados:', state.products.length);
    }
}

function getDefaultProducts() {
    return [
        { id: '1', name: 'Café', price: 3.50, code: '', category: 'Bebidas', cost: 1.00, stock: 100, quick: true },
        { id: '2', name: 'Pão de Açúcar', price: 2.00, code: '', category: 'Padaria', cost: 0.80, stock: 50, quick: true },
        { id: '3', name: 'Refrigerante', price: 5.00, code: '', category: 'Bebidas', cost: 2.50, stock: 30, quick: true },
        { id: '4', name: 'Salgadinho', price: 4.50, code: '', category: 'Snacks', cost: 2.00, stock: 40, quick: false },
        { id: '5', name: 'Água', price: 2.50, code: '', category: 'Bebidas', cost: 1.00, stock: 60, quick: true },
        { id: '6', name: 'Chocolate', price: 6.00, code: '', category: 'Doces', cost: 3.00, stock: 25, quick: false }
    ];
}

// ===== Event Listeners =====
function initializeEventListeners() {
    // Search input - only if element exists (not on charts.html)
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchAdd();
            }
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Settings modal
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            setupTimezoneOptions();
            openModal('settingsModal');
        });
    }
    const closeSettings = document.getElementById('closeSettings');
    if (closeSettings) {
        closeSettings.addEventListener('click', () => closeModal('settingsModal'));
    }
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // PIX Key Type Change
    const pixKeyTypeEl = document.getElementById('pixKeyType');
    if (pixKeyTypeEl) {
        pixKeyTypeEl.addEventListener('change', handlePixKeyTypeChange);
    }

    // Product manager modal - check if button exists (it might be in settings)
    const productManagerBtn = document.getElementById('productManagerBtn');
    if (productManagerBtn) {
        productManagerBtn.addEventListener('click', () => {
            openModal('productManagerModal');
            renderProductsList();
        });
    }
    const closeProductManager = document.getElementById('closeProductManager');
    if (closeProductManager) {
        closeProductManager.addEventListener('click', () => closeModal('productManagerModal'));
    }
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            const productFormTitle = document.getElementById('productFormTitle');
            const productForm = document.getElementById('productForm');
            const productId = document.getElementById('productId');
            if (productFormTitle) productFormTitle.textContent = 'Adicionar Produto';
            if (productForm) productForm.reset();
            if (productId) productId.value = '';
            openModal('productFormModal');
        });
    }

    // Product form modal
    const closeProductForm = document.getElementById('closeProductForm');
    if (closeProductForm) {
        closeProductForm.addEventListener('click', () => closeModal('productFormModal'));
    }
    const cancelProductForm = document.getElementById('cancelProductForm');
    if (cancelProductForm) {
        cancelProductForm.addEventListener('click', () => closeModal('productFormModal'));
    }
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Reports modal
    const reportsBtn = document.getElementById('reportsBtn');
    if (reportsBtn) {
        reportsBtn.addEventListener('click', () => {
            openModal('reportsModal');
            // Set default dates to today
            setReportPeriod('today');
            // Generate report after modal is fully open
            setTimeout(() => {
                generateReport();
            }, 200);
        });
    }
    const closeReports = document.getElementById('closeReports');
    if (closeReports) {
        closeReports.addEventListener('click', () => closeModal('reportsModal'));
    }
    const generateReportBtn = document.getElementById('generateReport');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            generateReport();
        });
    }
    
    // Quick period buttons - use event delegation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-period') || e.target.closest('.btn-period')) {
            const btn = e.target.classList.contains('btn-period') ? e.target : e.target.closest('.btn-period');
            const period = btn.dataset.period;
            if (period) {
                setReportPeriod(period);
                generateReport();
            }
        }
    });

    // Cash Register
    const cashRegisterBtn = document.getElementById('cashRegisterBtn');
    if (cashRegisterBtn) {
        cashRegisterBtn.addEventListener('click', () => {
            if (state.cashRegister.isOpen) {
                showCloseCashModal();
            } else {
                showOpenCashModal();
            }
        });
    }
    const closeCashRegister = document.getElementById('closeCashRegister');
    if (closeCashRegister) {
        closeCashRegister.addEventListener('click', () => closeModal('cashRegisterModal'));
    }
    const cancelCashRegister = document.getElementById('cancelCashRegister');
    if (cancelCashRegister) {
        cancelCashRegister.addEventListener('click', () => closeModal('cashRegisterModal'));
    }
    const cancelCloseCash = document.getElementById('cancelCloseCash');
    if (cancelCloseCash) {
        cancelCloseCash.addEventListener('click', () => closeModal('cashRegisterModal'));
    }
    const confirmOpenCash = document.getElementById('confirmOpenCash');
    if (confirmOpenCash) {
        confirmOpenCash.addEventListener('click', handleOpenCash);
    }
    const confirmCloseCash = document.getElementById('confirmCloseCash');
    if (confirmCloseCash) {
        confirmCloseCash.addEventListener('click', handleCloseCash);
    }
    const finalCash = document.getElementById('finalCash');
    if (finalCash) {
        finalCash.addEventListener('input', calculateCashDifference);
    }

    // Backup/Restore
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', handleBackup);
    }
    const backupSettingsBtn = document.getElementById('backupSettingsBtn');
    if (backupSettingsBtn) {
        backupSettingsBtn.addEventListener('click', handleBackup);
    }
    const restoreSettingsBtn = document.getElementById('restoreSettingsBtn');
    if (restoreSettingsBtn) {
        restoreSettingsBtn.addEventListener('click', handleRestore);
    }

    // Storage type change
    const storageTypeEl = document.getElementById('storageType');
    if (storageTypeEl) {
        storageTypeEl.addEventListener('change', handleStorageTypeChange);
    }
    
    // Clear cart button
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (state.cart.length === 0) {
                showNotification('Carrinho já está vazio!', 'info');
                return;
            }
            if (confirm('Tem certeza que deseja limpar o carrinho?')) {
                state.cart = [];
                saveData();
                updateCartDisplay();
                showNotification('Carrinho limpo!', 'success');
            }
        });
    }
    
    // Charts button - redirect to charts.html
    const chartsBtn = document.getElementById('chartsBtn');
    if (chartsBtn) {
        chartsBtn.addEventListener('click', () => {
            window.location.href = 'charts.html';
        });
    }
    
    // Promotions button - ensure it's set up
    const promotionsBtn = document.getElementById('promotionsBtn');
    if (promotionsBtn) {
        promotionsBtn.addEventListener('click', () => {
            openModal('promotionsModal');
        });
    }

    // Checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Checkout modal buttons
    const confirmCheckoutBtn = document.getElementById('confirmCheckout');
    if (confirmCheckoutBtn) {
        confirmCheckoutBtn.addEventListener('click', confirmCheckout);
    }

    const cancelCheckoutBtn = document.getElementById('cancelCheckout');
    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', cancelCheckout);
    }

    const closeCheckoutBtn = document.getElementById('closeCheckout');
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', cancelCheckout);
    }

    // Payment method change
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', handlePaymentMethodChange);
    }

    // Received amount change (for change calculation)
    const receivedAmountInput = document.getElementById('receivedAmount');
    if (receivedAmountInput) {
        receivedAmountInput.addEventListener('input', calculateChange);
        receivedAmountInput.addEventListener('blur', calculateChange);
    }

    // CPF input mask and validation
    const cpfInput = document.getElementById('cpfInput');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            maskCPF(e);
            validateCPF(e);
        });
    }

    // Sales history
    document.getElementById('salesHistoryBtn').addEventListener('click', () => {
        openModal('salesHistoryModal');
        renderSalesHistory();
    });
    document.getElementById('closeSalesHistory').addEventListener('click', () => closeModal('salesHistoryModal'));
    document.getElementById('historyDateFilter').addEventListener('change', renderSalesHistory);
    document.getElementById('historySearch').addEventListener('input', renderSalesHistory);

    // Export CSV
    document.getElementById('exportCSV').addEventListener('click', exportReportToCSV);
}

// ===== Modal Functions =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // Trigger a custom event when modal opens
        window.dispatchEvent(new CustomEvent('modalOpened', { detail: { modalId } }));
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Make functions globally available
window.openModal = openModal;
window.closeModal = closeModal;

// Close modals on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ===== Product Management =====
function handleSearchAdd() {
    const searchInput = document.getElementById('productSearch');
    const query = searchInput.value.trim().toLowerCase();

    if (!query) return;

    // Search by name or code
    const product = state.products.find(p => 
        p.name.toLowerCase().includes(query) || 
        p.code.toLowerCase() === query.toLowerCase()
    );

    if (product) {
        addToCart(product.id);
        searchInput.value = '';
        playSound();
    } else {
        alert('Produto não encontrado!');
        searchInput.select();
    }
}

function addToCart(productId, quantity = 1) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    // Check stock
    if (product.stock !== undefined && product.stock < quantity) {
        alert(`Estoque insuficiente! Disponível: ${product.stock}`);
        return;
    }

    // Check if product already in cart
    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += quantity;
        if (product.stock !== undefined && product.stock < cartItem.quantity) {
            alert(`Estoque insuficiente! Disponível: ${product.stock}`);
            cartItem.quantity = product.stock;
        }
    } else {
        state.cart.push({
            ...product,
            quantity: quantity,
            discount: 0,
            discountType: 'percent'
        });
    }

    saveData();
    updateCartDisplay();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveData();
    updateCartDisplay();
}

function updateCartQuantity(productId, change) {
    const cartItem = state.cart.find(item => item.id === productId);
    if (!cartItem) return;

    const product = state.products.find(p => p.id === productId);
    cartItem.quantity += change;

    if (cartItem.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    // Check stock
    if (product && product.stock !== undefined && cartItem.quantity > product.stock) {
        alert(`Estoque insuficiente! Disponível: ${product.stock}`);
        cartItem.quantity = product.stock;
    }

    saveData();
    updateCartDisplay();
}

function applyItemDiscount(productId, discount, discountType = 'percent') {
    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.discount = parseFloat(discount) || 0;
        cartItem.discountType = discountType;
        saveData();
        updateCartDisplay();
    }
}

// ===== Cart Display =====
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');

    if (!cartItems) {
        console.log('Cart items element not found');
        return;
    }

    if (state.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Carrinho vazio</p>';
        updateCartTotals();
        return;
    }

    cartItems.innerHTML = state.cart.map(item => {
        const itemTotal = calculateItemTotal(item);
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-details">
                        ${formatCurrency(item.price)} × ${item.quantity}
                        ${item.discount > 0 ? ` | Desconto: ${item.discount}${item.discountType === 'percent' ? '%' : state.settings.currency}` : ''}
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                    </div>
                    <div class="cart-item-price">${formatCurrency(itemTotal)}</div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    updateCartTotals();
}

// ===== Cart Time =====
function updateCartTime() {
    const cartTime = document.getElementById('cartTime');
    if (!cartTime) return;
    
    function updateTime() {
        const now = new Date();
        cartTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

function calculateItemTotal(item) {
    let total = item.price * item.quantity;
    if (item.discount > 0) {
        if (item.discountType === 'percent') {
            total -= total * (item.discount / 100);
        } else {
            total -= item.discount;
        }
    }
    return Math.max(0, total);
}

function updateCartTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = state.cart.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        if (item.discount > 0) {
            if (item.discountType === 'percent') {
                return sum + (itemTotal * (item.discount / 100));
            } else {
                return sum + item.discount;
            }
        }
        return sum;
    }, 0);
    
    // Apply coupon discount if any
    let couponDiscount = 0;
    if (state.appliedCoupon) {
        const coupon = state.appliedCoupon;
        const subtotalAfterItemDiscount = subtotal - totalDiscount;
        
        if (coupon.type === 'percent') {
            couponDiscount = subtotalAfterItemDiscount * (coupon.value / 100);
        } else {
            couponDiscount = coupon.value;
        }
    }
    
    const total = subtotal - totalDiscount - couponDiscount;

    const subtotalEl = document.getElementById('cartSubtotal');
    const couponDiscountEl = document.getElementById('cartCouponDiscount');
    const couponDiscountRow = document.getElementById('couponDiscountRow');
    const totalEl = document.getElementById('cartTotal');
    const checkoutTotalEl = document.getElementById('checkoutTotal');
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    
    if (couponDiscount > 0) {
        if (couponDiscountEl) couponDiscountEl.textContent = '-' + formatCurrency(couponDiscount);
        if (couponDiscountRow) couponDiscountRow.style.display = 'flex';
    } else {
        if (couponDiscountRow) couponDiscountRow.style.display = 'none';
    }
    
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (checkoutTotalEl) checkoutTotalEl.textContent = formatCurrency(total);
}

// ===== Quick Buttons =====
let currentCategoryFilter = null;

function renderQuickButtons() {
    const quickButtons = document.getElementById('quickButtons');
    
    if (!quickButtons) {
        console.log('Quick buttons element not found');
        return;
    }
    
    if (!Array.isArray(state.products)) {
        console.log('Products array not available');
        quickButtons.innerHTML = '<p class="empty-cart">Nenhum produto encontrado</p>';
        return;
    }
    
    // Por padrão, mostra apenas produtos rápidos
    // Se uma categoria estiver selecionada, mostra todos os produtos da categoria
    let productsToShow = [];
    if (currentCategoryFilter) {
        productsToShow = state.products.filter(p => p && p.category === currentCategoryFilter);
    } else {
        // Mostra apenas produtos com quick === true por padrão
        productsToShow = state.products.filter(p => p && (p.quick === true || p.quick === 'true'));
    }
    
    console.log('Total de produtos:', state.products.length);
    console.log('Produtos rápidos:', state.products.filter(p => p && (p.quick === true || p.quick === 'true')).length);
    console.log('Produtos a mostrar:', productsToShow.length);

    if (productsToShow.length === 0) {
        quickButtons.innerHTML = '<p class="empty-cart">Nenhum produto encontrado. Adicione produtos nas configurações.</p>';
        return;
    }

    quickButtons.innerHTML = productsToShow.map(product => `
        <button class="quick-btn" onclick="addToCart('${product.id}'); playSound();">
            <span class="quick-btn-name">${escapeHtml(product.name)}</span>
            <span class="quick-btn-price">${formatCurrency(product.price)}</span>
        </button>
    `).join('');
}

// ===== Categories =====
function renderCategories() {
    const posCategories = document.getElementById('posCategories');
    
    if (!posCategories) {
        console.log('Categories element not found');
        return;
    }
    
    if (!Array.isArray(state.products)) {
        posCategories.innerHTML = '';
        return;
    }
    
    // Extrair categorias únicas dos produtos
    const categories = [...new Set(state.products
        .filter(p => p && p.category)
        .map(p => p.category)
    )].sort();
    
    if (categories.length === 0) {
        posCategories.innerHTML = '';
        return;
    }
    
    posCategories.innerHTML = `
        <button class="category-btn ${currentCategoryFilter === null ? 'active' : ''}" onclick="filterByCategory(null)">
            Todos
        </button>
        ${categories.map(category => `
            <button class="category-btn ${currentCategoryFilter === category ? 'active' : ''}" onclick="filterByCategory('${escapeHtml(category)}')">
                ${escapeHtml(category)}
            </button>
        `).join('')}
    `;
}

function filterByCategory(category) {
    currentCategoryFilter = category;
    renderQuickButtons();
    renderCategories();
}

// Make filterByCategory globally available
window.filterByCategory = filterByCategory;

// ===== Product Manager =====
function renderProductsList() {
    const productsList = document.getElementById('productsList');
    if (state.products.length === 0) {
        productsList.innerHTML = '<p>Nenhum produto cadastrado.</p>';
        return;
    }

    productsList.innerHTML = state.products.map(product => `
        <div class="product-item">
            <div class="product-item-info">
                <div class="product-item-name">${escapeHtml(product.name)}</div>
                <div class="product-item-details">
                    ${formatCurrency(product.price)} | 
                    ${product.category || 'Sem categoria'} | 
                    ${product.code ? `Código: ${product.code} | ` : ''}
                    ${product.stock !== undefined ? `Estoque: ${product.stock} | ` : ''}
                    ${product.quick ? '⚡ Rápido' : ''}
                </div>
            </div>
            <div class="product-item-actions">
                <button class="btn-edit" onclick="editProduct('${product.id}')">Editar</button>
                <button class="btn-delete" onclick="deleteProduct('${product.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function editProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('productFormTitle').textContent = 'Editar Produto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCode').value = product.code || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productCost').value = product.cost || '';
    document.getElementById('productStock').value = product.stock !== undefined ? product.stock : '';
    document.getElementById('productQuick').checked = product.quick || false;

    closeModal('productManagerModal');
    openModal('productFormModal');
}

function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    state.products = state.products.filter(p => p.id !== productId);
    state.cart = state.cart.filter(item => item.id !== productId);
    saveData();
    renderProductsList();
    renderQuickButtons();
    renderCategories();
    updateCartDisplay();
}

function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const product = {
        id: productId || generateId(),
        name: document.getElementById('productName').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        code: document.getElementById('productCode').value.trim(),
        category: document.getElementById('productCategory').value.trim(),
        cost: document.getElementById('productCost').value ? parseFloat(document.getElementById('productCost').value) : undefined,
        stock: document.getElementById('productStock').value ? parseInt(document.getElementById('productStock').value) : undefined,
        quick: document.getElementById('productQuick').checked
    };

    if (productId) {
        // Update existing product
        const index = state.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            state.products[index] = product;
        }
    } else {
        // Add new product
        state.products.push(product);
    }

    saveData();
    renderProductsList();
    renderQuickButtons();
    closeModal('productFormModal');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ===== Checkout =====
function handleCheckout() {
    if (state.cart.length === 0) {
        showNotification('Carrinho vazio!', 'warning');
        return;
    }

    // Check stock before checkout
    for (const item of state.cart) {
        const product = state.products.find(p => p.id === item.id);
        if (product && product.stock !== undefined) {
            if (product.stock < item.quantity) {
                showNotification(`Estoque insuficiente para ${product.name}! Disponível: ${product.stock}`, 'error');
                return;
            }
        }
    }

    // Update checkout total
    const total = calculateCartTotal();
    const checkoutTotalEl = document.getElementById('checkoutTotal');
    if (checkoutTotalEl) {
        checkoutTotalEl.textContent = formatCurrency(total);
    }

    // Reset form
    const cpfInput = document.getElementById('cpfInput');
    if (cpfInput) cpfInput.value = '';
    
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (paymentMethodSelect) {
        paymentMethodSelect.value = 'dinheiro';
        handlePaymentMethodChange();
    }
    
    const receivedAmountInput = document.getElementById('receivedAmount');
    if (receivedAmountInput) receivedAmountInput.value = '';
    
    const changeDisplay = document.getElementById('changeDisplay');
    if (changeDisplay) changeDisplay.style.display = 'none';

    // Open modal
    openModal('checkoutModal');
}

function confirmCheckout() {
    const cpfInput = document.getElementById('cpfInput');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const receivedAmountInput = document.getElementById('receivedAmount');
    
    if (!cpfInput || !paymentMethodSelect || !receivedAmountInput) {
        showNotification('Erro ao processar checkout. Elementos não encontrados.', 'error');
        return;
    }

    const cpf = cpfInput.value.trim();
    const paymentMethod = paymentMethodSelect.value;
    const receivedAmount = parseFloat(receivedAmountInput.value) || 0;
    
    // Calculate totals with coupon
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemDiscount = state.cart.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        if (item.discount > 0) {
            if (item.discountType === 'percent') {
                return sum + (itemTotal * (item.discount / 100));
            } else {
                return sum + item.discount;
            }
        }
        return sum;
    }, 0);
    
    // Apply coupon discount if any
    let couponDiscount = 0;
    if (state.appliedCoupon) {
        const coupon = state.appliedCoupon;
        const subtotalAfterItemDiscount = subtotal - itemDiscount;
        
        if (coupon.type === 'percent') {
            couponDiscount = subtotalAfterItemDiscount * (coupon.value / 100);
        } else {
            couponDiscount = coupon.value;
        }
    }
    
    const total = subtotal - itemDiscount - couponDiscount;
    
    // Validate payment for cash
    if (paymentMethod === 'dinheiro') {
        if (receivedAmount <= 0) {
            showNotification('Por favor, informe o valor recebido.', 'warning');
            return;
        }
        if (receivedAmount < total) {
            showNotification(`Valor recebido (${formatCurrency(receivedAmount)}) é menor que o total (${formatCurrency(total)}).`, 'error');
            return;
        }
    }

    const sale = {
        id: generateId(),
        date: new Date().toISOString(),
        items: state.cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            discount: item.discount || 0,
            discountType: item.discountType || 'percent'
        })),
        subtotal: subtotal,
        discount: itemDiscount + couponDiscount,
        couponDiscount: couponDiscount,
        couponCode: state.appliedCoupon ? state.appliedCoupon.code : null,
        tax: 0,
        total: total,
        paymentMethod: paymentMethod,
        receivedAmount: paymentMethod === 'dinheiro' ? receivedAmount : total,
        change: paymentMethod === 'dinheiro' ? (receivedAmount - total) : 0,
        cpf: cpf || null
    };

    // Update stock
    for (const item of state.cart) {
        const product = state.products.find(p => p.id === item.id);
        if (product && product.stock !== undefined) {
            product.stock -= item.quantity;
        }
    }

    // Add to sales history
    state.sales.push(sale);

    // Update coupon uses if applied
    if (state.appliedCoupon) {
        const coupon = state.coupons.find(c => c.id === state.appliedCoupon.id);
        if (coupon) {
            coupon.uses = (coupon.uses || 0) + 1;
        }
    }
    
    // Clear cart and form
    state.cart = [];
    state.appliedCoupon = null;
    cpfInput.value = '';
    paymentMethodSelect.value = 'dinheiro';
    receivedAmountInput.value = '';
    
    const changeSection = document.getElementById('changeSection');
    if (changeSection) changeSection.style.display = 'block';
    
    const changeDisplay = document.getElementById('changeDisplay');
    if (changeDisplay) changeDisplay.style.display = 'none';
    
    // Clear coupon message and input
    const couponMessage = document.getElementById('couponMessage');
    if (couponMessage) couponMessage.innerHTML = '';
    const couponCode = document.getElementById('couponCode');
    if (couponCode) couponCode.value = '';

    saveData();
    updateCartDisplay();
    closeModal('checkoutModal');
    generateReceipt(sale);
    playSound();
    
    // Show success notification
    showNotification('Venda finalizada com sucesso!', 'success');
}

function cancelCheckout() {
    closeModal('checkoutModal');
}

function calculateCartTotal() {
    const subtotal = state.cart.reduce((sum, item) => {
        return sum + calculateItemTotal(item);
    }, 0);
    
    const itemDiscount = state.cart.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        if (item.discount > 0) {
            if (item.discountType === 'percent') {
                return sum + (itemTotal * (item.discount / 100));
            } else {
                return sum + item.discount;
            }
        }
        return sum;
    }, 0);
    
    // Apply coupon discount if any
    let couponDiscount = 0;
    if (state.appliedCoupon) {
        const coupon = state.appliedCoupon;
        const subtotalAfterItemDiscount = subtotal - itemDiscount;
        
        if (coupon.type === 'percent') {
            couponDiscount = subtotalAfterItemDiscount * (coupon.value / 100);
        } else {
            couponDiscount = coupon.value;
        }
    }
    
    return subtotal - itemDiscount - couponDiscount;
}

// ===== Receipt =====
function generateReceipt(sale) {
    const receiptContent = document.getElementById('receiptContent');
    const date = new Date(sale.date);
    const dateStr = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    
    const paymentMethodNames = {
        'dinheiro': 'Dinheiro',
        'pix': 'Pix',
        'credito': 'Cartão de Crédito',
        'debito': 'Cartão de Débito'
    };

    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>${escapeHtml(state.settings.businessName)}</h2>
            <div class="receipt-date">${dateStr}</div>
            ${sale.cpf ? `<div class="receipt-date">CPF: ${sale.cpf}</div>` : ''}
        </div>
        <div class="receipt-items">
            ${sale.items.map(item => {
                const itemTotal = (item.price * item.quantity) - (item.discount > 0 ? 
                    (item.discountType === 'percent' ? 
                        (item.price * item.quantity * item.discount / 100) : 
                        item.discount) : 0);
                return `
                    <div class="receipt-item">
                        <div class="receipt-item-name">${escapeHtml(item.name)}</div>
                        <div class="receipt-item-details">
                            ${item.quantity}x ${formatCurrency(item.price)} = ${formatCurrency(itemTotal)}
                            ${item.discount > 0 ? ` (Desc: ${item.discount}${item.discountType === 'percent' ? '%' : state.settings.currency})` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="receipt-totals">
            <div class="receipt-total-line">
                <span>Subtotal:</span>
                <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            ${sale.discount > 0 ? `
                <div class="receipt-total-line">
                    <span>Desconto:</span>
                    <span>${formatCurrency(sale.discount)}</span>
                </div>
            ` : ''}
            ${sale.couponCode ? `
                <div class="receipt-total-line" style="font-size: 0.9em; color: var(--text-secondary);">
                    <span>Cupom: ${escapeHtml(sale.couponCode)}</span>
                    <span>-${formatCurrency(sale.couponDiscount || 0)}</span>
                </div>
            ` : ''}
            <div class="receipt-total-line receipt-total-final">
                <span>TOTAL:</span>
                <span>${formatCurrency(sale.total)}</span>
            </div>
            <div class="receipt-total-line">
                <span>Forma de Pagamento:</span>
                <span>${paymentMethodNames[sale.paymentMethod] || sale.paymentMethod}</span>
            </div>
            ${sale.paymentMethod === 'dinheiro' ? `
                <div class="receipt-total-line">
                    <span>Valor Recebido:</span>
                    <span>${formatCurrency(sale.receivedAmount)}</span>
                </div>
                <div class="receipt-total-line">
                    <span>Troco:</span>
                    <span>${formatCurrency(sale.change)}</span>
                </div>
            ` : ''}
        </div>
        <div class="receipt-footer">
            <p>Obrigado pela preferência!</p>
        </div>
    `;

    // Print receipt
    window.print();
}

// ===== Payment Method =====
function handlePaymentMethodChange() {
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const changeSection = document.getElementById('changeSection');
    const receivedAmountInput = document.getElementById('receivedAmount');
    const changeDisplay = document.getElementById('changeDisplay');
    
    if (!paymentMethodSelect) {
        return;
    }
    
    const paymentMethod = paymentMethodSelect.value;
    
    if (paymentMethod === 'dinheiro') {
        if (changeSection) {
            changeSection.style.display = 'block';
        }
        if (receivedAmountInput) {
            // Clear and focus the input
            setTimeout(() => {
                receivedAmountInput.focus();
            }, 100);
        }
        // Calculate change if there's a value
        if (receivedAmountInput && receivedAmountInput.value) {
            calculateChange();
        }
    } else {
        if (changeSection) {
            changeSection.style.display = 'none';
        }
        if (receivedAmountInput) {
            receivedAmountInput.value = '';
        }
        if (changeDisplay) {
            changeDisplay.style.display = 'none';
        }
    }
}

function calculateChange() {
    const receivedAmountInput = document.getElementById('receivedAmount');
    const changeDisplay = document.getElementById('changeDisplay');
    const changeValue = document.getElementById('changeValue');
    
    if (!receivedAmountInput || !changeDisplay || !changeValue) {
        return;
    }
    
    const receivedAmount = parseFloat(receivedAmountInput.value) || 0;
    const total = calculateCartTotal(); // Já considera cupons e descontos
    const change = receivedAmount - total;
    
    if (receivedAmount > 0) {
        changeDisplay.style.display = 'flex';
        if (change >= 0) {
            changeValue.style.color = 'var(--success)';
            changeValue.textContent = formatCurrency(change);
        } else {
            changeValue.style.color = 'var(--danger)';
            changeValue.textContent = 'Faltam: ' + formatCurrency(Math.abs(change));
        }
    } else {
        changeDisplay.style.display = 'none';
    }
}

// ===== CPF Validation =====
function validateCPF(e) {
    const cpf = e.target.value.replace(/\D/g, '');
    const input = e.target;
    
    if (cpf.length === 11) {
        if (isValidCPF(cpf)) {
            input.style.borderColor = 'var(--success)';
        } else {
            input.style.borderColor = 'var(--danger)';
        }
    } else {
        input.style.borderColor = 'var(--border)';
    }
}

function isValidCPF(cpf) {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// ===== Storage Type =====
async function handleStorageTypeChange() {
    const storageType = document.getElementById('storageType').value;
    
    if (storageType === 'indexedDB') {
        if (!('indexedDB' in window)) {
            alert('IndexedDB não está disponível neste navegador. Usando localStorage.');
            document.getElementById('storageType').value = 'localStorage';
            return;
        }
        
        if (confirm('Migrar dados para IndexedDB? Isso pode levar alguns segundos.')) {
            try {
                await migrateToIndexedDB();
                showNotification('Dados migrados para IndexedDB com sucesso!', 'success');
            } catch (error) {
                alert('Erro ao migrar para IndexedDB: ' + error.message);
                document.getElementById('storageType').value = 'localStorage';
            }
        } else {
            document.getElementById('storageType').value = state.settings.storageType;
        }
    } else {
        if (confirm('Migrar dados para localStorage?')) {
            try {
                await migrateToLocalStorage();
                showNotification('Dados migrados para localStorage com sucesso!', 'success');
            } catch (error) {
                alert('Erro ao migrar para localStorage: ' + error.message);
            }
        } else {
            document.getElementById('storageType').value = state.settings.storageType;
        }
    }
}

// ===== Sales History =====
function renderSalesHistory() {
    const historyList = document.getElementById('salesHistoryList');
    const dateFilter = document.getElementById('historyDateFilter').value;
    const searchFilter = document.getElementById('historySearch').value.toLowerCase();
    
    let filteredSales = state.sales;
    
    // Filter by date
    if (dateFilter) {
        const selectedDate = new Date(dateFilter);
        filteredSales = filteredSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.toDateString() === selectedDate.toDateString();
        });
    }
    
    // Filter by search
    if (searchFilter) {
        filteredSales = filteredSales.filter(sale => {
            const saleText = JSON.stringify(sale).toLowerCase();
            return saleText.includes(searchFilter);
        });
    }
    
    // Sort by date (newest first)
    filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredSales.length === 0) {
        historyList.innerHTML = '<p class="empty-cart">Nenhuma venda encontrada.</p>';
        return;
    }
    
    const paymentMethodNames = {
        'dinheiro': '💵 Dinheiro',
        'pix': '🔵 Pix',
        'credito': '💳 Crédito',
        'debito': '💳 Débito'
    };
    
    historyList.innerHTML = filteredSales.map(sale => {
        const date = new Date(sale.date);
        const dateStr = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="sale-item" onclick="viewSaleDetails('${sale.id}')">
                <div class="sale-item-header">
                    <div class="sale-item-date">${dateStr}</div>
                    <div class="sale-item-total">${formatCurrency(sale.total)}</div>
                </div>
                <div class="sale-item-details">
                    <span class="sale-item-payment">${paymentMethodNames[sale.paymentMethod] || sale.paymentMethod}</span>
                    ${sale.cpf ? `<span>CPF: ${sale.cpf}</span>` : ''}
                    <span>${sale.items.length} item(s)</span>
                </div>
                <div class="sale-item-items">
                    ${sale.items.slice(0, 3).map(item => `
                        <div class="sale-item-item">
                            <span>${escapeHtml(item.name)}</span>
                            <span>${item.quantity}x ${formatCurrency(item.price)}</span>
                        </div>
                    `).join('')}
                    ${sale.items.length > 3 ? `<div class="sale-item-item"><span>...</span><span>+${sale.items.length - 3} mais</span></div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function viewSaleDetails(saleId) {
    const sale = state.sales.find(s => s.id === saleId);
    if (sale) {
        generateReceipt(sale);
    }
}

// ===== Reports =====
function setReportPeriod(period) {
    const reportDateStart = document.getElementById('reportDateStart');
    const reportDateEnd = document.getElementById('reportDateEnd');
    const today = new Date();
    
    if (!reportDateStart || !reportDateEnd) return;
    
    switch(period) {
        case 'today':
            const todayStr = today.toISOString().split('T')[0];
            reportDateStart.value = todayStr;
            reportDateEnd.value = todayStr;
            break;
        case '7days':
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            reportDateStart.value = sevenDaysAgo.toISOString().split('T')[0];
            reportDateEnd.value = today.toISOString().split('T')[0];
            break;
        case '30days':
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            reportDateStart.value = thirtyDaysAgo.toISOString().split('T')[0];
            reportDateEnd.value = today.toISOString().split('T')[0];
            break;
    }
    
    // Update button states
    document.querySelectorAll('.btn-period').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });
}

function generateReport() {
    const reportDateStartEl = document.getElementById('reportDateStart');
    const reportDateEndEl = document.getElementById('reportDateEnd');
    const paymentMethodFilterEl = document.getElementById('reportPaymentMethod');
    const reportsContent = document.getElementById('reportsContent');

    if (!reportsContent) {
        console.error('Reports content element not found');
        return;
    }

    const reportDateStart = reportDateStartEl ? reportDateStartEl.value : '';
    const reportDateEnd = reportDateEndEl ? reportDateEndEl.value : '';
    const paymentMethodFilter = paymentMethodFilterEl ? paymentMethodFilterEl.value : '';

    let filteredSales = Array.isArray(state.sales) ? state.sales : [];
    
    console.log('Total de vendas:', filteredSales.length);
    console.log('Filtros:', { reportDateStart, reportDateEnd, paymentMethodFilter });
    
    // Filter by date range
    if (reportDateStart || reportDateEnd) {
        if (reportDateStart && reportDateEnd) {
            const startDate = new Date(reportDateStart + 'T00:00:00');
            const endDate = new Date(reportDateEnd + 'T23:59:59');
            filteredSales = filteredSales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            });
        } else if (reportDateStart) {
            const startDate = new Date(reportDateStart + 'T00:00:00');
            filteredSales = filteredSales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date);
                return saleDate >= startDate;
            });
        } else if (reportDateEnd) {
            const endDate = new Date(reportDateEnd + 'T23:59:59');
            filteredSales = filteredSales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date);
                return saleDate <= endDate;
            });
        }
    } else {
        // Default to today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filteredSales = filteredSales.filter(sale => {
            if (!sale.date) return false;
            const saleDate = new Date(sale.date);
            return saleDate >= today && saleDate < tomorrow;
        });
    }
    
    // Filter by payment method
    if (paymentMethodFilter) {
        filteredSales = filteredSales.filter(sale => sale.paymentMethod === paymentMethodFilter);
    }
    
    console.log('Vendas filtradas:', filteredSales.length);

    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalProfit = filteredSales.reduce((sum, sale) => {
        return sum + (sale.items || []).reduce((itemSum, item) => {
            const product = state.products.find(p => p.id === item.id);
            if (product && product.cost !== undefined) {
                const itemProfit = (item.price - product.cost) * item.quantity;
                return itemSum + itemProfit;
            }
            return itemSum;
        }, 0);
    }, 0);

    // Top items
    const itemCounts = {};
    filteredSales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                if (!itemCounts[item.id]) {
                    itemCounts[item.id] = { name: item.name || 'Sem nome', quantity: 0, revenue: 0 };
                }
                itemCounts[item.id].quantity += item.quantity || 0;
                itemCounts[item.id].revenue += (item.price || 0) * (item.quantity || 0);
            });
        }
    });

    // Payment method breakdown
    const paymentBreakdown = {};
    filteredSales.forEach(sale => {
        const method = sale.paymentMethod || 'desconhecido';
        if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = { count: 0, total: 0 };
        }
        paymentBreakdown[method].count++;
        paymentBreakdown[method].total += sale.total || 0;
    });

    const topItems = Object.values(itemCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    const paymentMethodNames = {
        'dinheiro': 'Dinheiro',
        'pix': 'Pix',
        'credito': 'Crédito',
        'debito': 'Débito'
    };

    if (filteredSales.length === 0) {
        const totalSales = state.sales ? state.sales.length : 0;
        reportsContent.innerHTML = `
            <div class="report-summary">
                <h3>Resumo do Período</h3>
                <p style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    Nenhuma venda encontrada para o período selecionado.
                </p>
                ${totalSales > 0 ? `
                    <p style="text-align: center; padding: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        Total de vendas no sistema: ${totalSales}
                    </p>
                ` : ''}
            </div>
        `;
        window.currentReportData = [];
        return;
    }

    reportsContent.innerHTML = `
        <div class="report-summary">
            <h3>Resumo do Período</h3>
            <div class="report-stat">
                <span class="report-stat-label">Total de Vendas:</span>
                <span class="report-stat-value">${totalSales}</span>
            </div>
            <div class="report-stat">
                <span class="report-stat-label">Receita Total:</span>
                <span class="report-stat-value">${formatCurrency(totalRevenue)}</span>
            </div>
            ${totalProfit > 0 ? `
                <div class="report-stat">
                    <span class="report-stat-label">Lucro Total:</span>
                    <span class="report-stat-value">${formatCurrency(totalProfit)}</span>
                </div>
            ` : ''}
        </div>
        ${Object.keys(paymentBreakdown).length > 0 ? `
            <div class="top-items" style="margin-top: 2rem;">
                <h3>Por Forma de Pagamento</h3>
                ${Object.entries(paymentBreakdown).map(([method, data]) => `
                    <div class="top-item">
                        <span>${paymentMethodNames[method] || method}</span>
                        <span>${data.count} venda(s) - ${formatCurrency(data.total)}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        ${topItems.length > 0 ? `
            <div class="top-items" style="margin-top: 2rem;">
                <h3>Top Produtos</h3>
                ${topItems.map(item => `
                    <div class="top-item">
                        <span>${escapeHtml(item.name)}</span>
                        <span>${item.quantity} un. - ${formatCurrency(item.revenue)}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    // Store filtered sales for CSV export
    window.currentReportData = filteredSales;
}

// ===== CSV Export =====
function exportReportToCSV() {
    const sales = window.currentReportData || [];
    
    if (sales.length === 0) {
        alert('Não há dados para exportar. Gere um relatório primeiro.');
        return;
    }
    
    const paymentMethodNames = {
        'dinheiro': 'Dinheiro',
        'pix': 'Pix',
        'credito': 'Crédito',
        'debito': 'Débito'
    };
    
    // CSV Headers
    const headers = [
        'Data',
        'Hora',
        'ID Venda',
        'Produto',
        'Quantidade',
        'Preço Unitário',
        'Subtotal',
        'Forma de Pagamento',
        'CPF',
        'Total da Venda',
        'Valor Recebido',
        'Troco'
    ];
    
    // Build CSV rows
    const rows = [];
    
    sales.forEach(sale => {
        let dateStr = '';
        let timeStr = '';
        
        if (sale.date) {
            try {
                const saleDate = new Date(sale.date);
                if (!isNaN(saleDate.getTime())) {
                    dateStr = saleDate.toLocaleDateString('pt-BR');
                    timeStr = saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
            } catch (e) {
                console.warn('Erro ao formatar data da venda:', sale.date, e);
            }
        }
        
        const paymentMethod = paymentMethodNames[sale.paymentMethod] || sale.paymentMethod || 'N/A';
        const cpf = sale.cpf || '';
        const receivedAmount = sale.receivedAmount || '';
        const change = sale.change || '';
        
        if (sale.items && sale.items.length > 0) {
            sale.items.forEach((item, index) => {
                const row = [
                    index === 0 ? escapeCsvField(dateStr) : '', // Data apenas na primeira linha
                    index === 0 ? escapeCsvField(timeStr) : '', // Hora apenas na primeira linha
                    index === 0 ? escapeCsvField(sale.id || '') : '', // ID apenas na primeira linha
                    escapeCsvField(item.name || ''),
                    item.quantity || 0,
                    formatNumberForCSV(item.price || 0),
                    formatNumberForCSV((item.price || 0) * (item.quantity || 0)),
                    index === 0 ? escapeCsvField(paymentMethod) : '', // Forma de pagamento apenas na primeira linha
                    index === 0 ? escapeCsvField(cpf) : '', // CPF apenas na primeira linha
                    index === 0 ? formatNumberForCSV(sale.total || 0) : '', // Total apenas na primeira linha
                    index === 0 ? (receivedAmount ? formatNumberForCSV(receivedAmount) : '') : '',
                    index === 0 ? (change ? formatNumberForCSV(change) : '') : ''
                ];
                rows.push(row);
            });
        } else {
            // Se não houver itens, adiciona pelo menos uma linha com os dados da venda
            const row = [
                escapeCsvField(dateStr),
                escapeCsvField(timeStr),
                escapeCsvField(sale.id || ''),
                'N/A',
                0,
                0,
                0,
                escapeCsvField(paymentMethod),
                escapeCsvField(cpf),
                formatNumberForCSV(sale.total || 0),
                receivedAmount ? formatNumberForCSV(receivedAmount) : '',
                change ? formatNumberForCSV(change) : ''
            ];
            rows.push(row);
        }
    });
    
    // Combine headers and rows
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');
    
    // Add BOM for UTF-8 (helps Excel open the file correctly)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with date range
    const reportDateStart = document.getElementById('reportDateStart')?.value || '';
    const reportDateEnd = document.getElementById('reportDateEnd')?.value || '';
    let filename = 'relatorio-vendas';
    if (reportDateStart && reportDateEnd) {
        filename += `-${reportDateStart}_${reportDateEnd}`;
    } else {
        filename += '-' + new Date().toISOString().split('T')[0];
    }
    filename += '.csv';
    
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('CSV exportado com sucesso!', 'success');
}

function escapeCsvField(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    // Se contém ponto e vírgula, aspas ou quebra de linha, precisa ser envolvido em aspas
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function formatNumberForCSV(value) {
    if (value === null || value === undefined || value === '') return '0';
    return parseFloat(value).toFixed(2).replace('.', ',');
}

// ===== Settings =====
function saveSettings() {
    state.settings.businessName = document.getElementById('businessName').value.trim() || 'VendaNinja';
    state.settings.currency = document.getElementById('currency').value.trim() || 'R$';
    state.settings.taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    
    // Timezone
    const timezoneEl = document.getElementById('timezone');
    if (timezoneEl) {
        const selectedTimezone = parseInt(timezoneEl.value);
        if (!isNaN(selectedTimezone)) {
            state.settings.timezone = selectedTimezone;
        } else {
            // Fallback to device timezone if invalid
            state.settings.timezone = getDeviceTimezone();
        }
    }
    
    // PIX Key
    const pixKeyTypeEl = document.getElementById('pixKeyType');
    const pixKeyValueEl = document.getElementById('pixKeyValue');
    
    if (pixKeyTypeEl && pixKeyValueEl) {
        const pixKeyType = pixKeyTypeEl.value;
        const pixKeyValue = pixKeyValueEl.value.trim();
        
        if (pixKeyType && pixKeyValue) {
            // Validate PIX key based on type
            if (validatePixKey(pixKeyType, pixKeyValue)) {
                state.settings.pixKeyType = pixKeyType;
                state.settings.pixKeyValue = pixKeyValue;
            } else {
                showNotification('Chave PIX inválida! Verifique o formato.', 'error');
                return;
            }
        } else if (pixKeyType && !pixKeyValue) {
            showNotification('Por favor, informe a chave PIX.', 'warning');
            return;
        } else {
            state.settings.pixKeyType = '';
            state.settings.pixKeyValue = '';
        }
    }
    
    // Storage type is handled separately by handleStorageTypeChange

    saveData();
    applySettings();
    closeModal('settingsModal');
    showNotification('Configurações salvas!', 'success');
}

function applySettings() {
    const businessNameEl = document.getElementById('businessName');
    const currencyEl = document.getElementById('currency');
    const taxRateEl = document.getElementById('taxRate');
    const storageTypeEl = document.getElementById('storageType');
    const timezoneEl = document.getElementById('timezone');
    const pixKeyTypeEl = document.getElementById('pixKeyType');
    const pixKeyValueEl = document.getElementById('pixKeyValue');
    
    if (businessNameEl) businessNameEl.value = state.settings.businessName;
    if (currencyEl) currencyEl.value = state.settings.currency;
    if (taxRateEl) taxRateEl.value = state.settings.taxRate;
    if (storageTypeEl) storageTypeEl.value = state.settings.storageType || 'localStorage';
    
    // Timezone - auto-detect if not set
    if (timezoneEl) {
        if (!state.settings.timezone || state.settings.timezone === null || state.settings.timezone === undefined) {
            const deviceTimezone = getDeviceTimezone();
            state.settings.timezone = deviceTimezone;
            saveData();
        }
        timezoneEl.value = state.settings.timezone;
    }
    
    // PIX Key
    if (pixKeyTypeEl) {
        pixKeyTypeEl.value = state.settings.pixKeyType || '';
        handlePixKeyTypeChange();
    }
    if (pixKeyValueEl) {
        pixKeyValueEl.value = state.settings.pixKeyValue || '';
    }
}

// ===== Timezone Setup =====
function setupTimezoneOptions() {
    const timezoneEl = document.getElementById('timezone');
    if (!timezoneEl) return;
    
    // Get device timezone if not set
    if (!state.settings.timezone || state.settings.timezone === undefined) {
        const deviceTimezone = getDeviceTimezone();
        state.settings.timezone = deviceTimezone;
        saveData();
    }
    
    // Generate UTC options from -12 to +12
    let options = '';
    const deviceTimezone = getDeviceTimezone();
    
    for (let i = -12; i <= 12; i++) {
        const sign = i >= 0 ? '+' : '';
        const label = `UTC${sign}${i}`;
        // Mark device timezone
        const isDevice = i === deviceTimezone;
        const isSelected = i === state.settings.timezone;
        const selected = isSelected ? ' selected' : '';
        const deviceLabel = isDevice ? ` (Dispositivo)` : '';
        options += `<option value="${i}"${selected}>${label}${deviceLabel}</option>`;
    }
    
    timezoneEl.innerHTML = options;
}

// ===== PIX Key Management =====
function handlePixKeyTypeChange() {
    const pixKeyTypeEl = document.getElementById('pixKeyType');
    const pixKeyValueGroup = document.getElementById('pixKeyValueGroup');
    const pixKeyValueLabel = document.getElementById('pixKeyValueLabel');
    const pixKeyValueEl = document.getElementById('pixKeyValue');
    const pixKeyHelp = document.getElementById('pixKeyHelp');
    
    if (!pixKeyTypeEl || !pixKeyValueGroup || !pixKeyValueLabel || !pixKeyValueEl) return;
    
    const pixKeyType = pixKeyTypeEl.value;
    
    if (!pixKeyType) {
        pixKeyValueGroup.style.display = 'none';
        pixKeyValueEl.value = '';
        if (pixKeyHelp) pixKeyHelp.style.display = 'none';
        return;
    }
    
    pixKeyValueGroup.style.display = 'block';
    
    // Set label and placeholder based on type
    const labels = {
        'chavealeatoria': 'Chave Aleatória PIX (UUID)',
        'celular': 'Celular (com DDD)',
        'cpf': 'CPF',
        'email': 'E-mail'
    };
    
    const placeholders = {
        'chavealeatoria': 'Ex: 123e4567-e89b-12d3-a456-426614174000',
        'celular': 'Ex: 11987654321',
        'cpf': 'Ex: 123.456.789-00',
        'email': 'Ex: exemplo@email.com'
    };
    
    const helpTexts = {
        'chavealeatoria': 'Formato: UUID (36 caracteres com hífens)',
        'celular': 'Formato: DDD + número (11 dígitos, apenas números)',
        'cpf': 'Formato: 000.000.000-00',
        'email': 'Formato: exemplo@dominio.com'
    };
    
    pixKeyValueLabel.textContent = labels[pixKeyType] || 'Chave PIX:';
    pixKeyValueEl.placeholder = placeholders[pixKeyType] || 'Digite a chave PIX';
    
    if (pixKeyHelp) {
        pixKeyHelp.textContent = helpTexts[pixKeyType] || '';
        pixKeyHelp.style.display = helpTexts[pixKeyType] ? 'block' : 'none';
    }
    
    // Clear existing masks and add new one based on type
    // We'll handle masking in a single event listener that checks the type
    pixKeyValueEl.oninput = function(e) {
        const currentType = pixKeyTypeEl.value;
        if (currentType === 'cpf') {
            maskCPF(e);
        } else if (currentType === 'celular') {
            maskPhone(e);
        }
    };
}

function validatePixKey(type, value) {
    if (!type || !value) return false;
    
    switch (type) {
        case 'chavealeatoria':
            // UUID format: 8-4-4-4-12 characters
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(value);
            
        case 'celular':
            // Phone: DDD (2 digits) + number (9 digits) = 11 digits total
            const phoneDigits = value.replace(/\D/g, '');
            return phoneDigits.length === 11;
            
        case 'cpf':
            // CPF validation
            const cpf = value.replace(/\D/g, '');
            return cpf.length === 11 && isValidCPF(cpf);
            
        case 'email':
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
            
        default:
            return false;
    }
}

function maskPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
        if (value.length > 2) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
        }
        if (value.length > 10) {
            value = value.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
        }
        e.target.value = value;
    } else {
        e.target.value = value.substring(0, 11).replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
    }
}

// ===== Theme =====
function toggleTheme() {
    const currentTheme = state.settings.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    state.settings.theme = newTheme;
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    saveData();
}

function applyTheme() {
    const theme = state.settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

// ===== Backup/Restore =====
function handleBackup() {
    const data = {
        products: state.products,
        sales: state.sales,
        settings: state.settings,
        version: '1.0.0',
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendaninja-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Add restore functionality
function handleRestore() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('Isso irá substituir todos os dados atuais. Continuar?')) {
                    state.products = data.products || [];
                    state.sales = data.sales || [];
                    state.settings = { ...state.settings, ...(data.settings || {}) };
                    saveData();
                    renderQuickButtons();
                    renderProductsList();
                    updateCartDisplay();
                    applySettings();
                    applyTheme();
                    alert('Dados restaurados com sucesso!');
                }
            } catch (error) {
                alert('Erro ao restaurar dados: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===== CPF Mask =====
function maskCPF(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    }
}

// ===== Utility Functions =====
function formatCurrency(value) {
    return state.settings.currency + ' ' + parseFloat(value).toFixed(2).replace('.', ',');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function focusSearch() {
    document.getElementById('productSearch').focus();
}

function playSound() {
    const audio = document.getElementById('shurikenSound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log('Erro ao reproduzir som:', err));
    }
}

// ===== Notifications =====
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        // Fallback to alert if notification element doesn't exist
        alert(message);
        return;
    }
    
    notification.textContent = message;
    notification.className = `notification notification-${type}`;
    notification.style.display = 'block';
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

// ===== Cash Register =====
function showOpenCashModal() {
    const title = document.getElementById('cashRegisterTitle');
    const openContent = document.getElementById('openCashContent');
    const closeContent = document.getElementById('closeCashContent');
    
    if (!title || !openContent || !closeContent) return;
    
    title.textContent = 'Abrir Caixa';
    openContent.style.display = 'block';
    closeContent.style.display = 'none';
    const initialCash = document.getElementById('initialCash');
    if (initialCash) initialCash.value = '0';
    openModal('cashRegisterModal');
}

function showCloseCashModal() {
    const title = document.getElementById('cashRegisterTitle');
    const openContent = document.getElementById('openCashContent');
    const closeContent = document.getElementById('closeCashContent');
    
    if (!title || !openContent || !closeContent) return;
    
    title.textContent = 'Fechar Caixa';
    openContent.style.display = 'none';
    closeContent.style.display = 'block';
    
    // Calculate cash summary
    const initialAmount = state.cashRegister.initialAmount || 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaySales = (state.sales || []).filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date);
        return saleDate >= today && saleDate < tomorrow && sale.paymentMethod === 'dinheiro';
    });
    
    const cashSales = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const expectedAmount = initialAmount + cashSales;
    
    const cashInitialAmount = document.getElementById('cashInitialAmount');
    const cashSalesAmount = document.getElementById('cashSalesAmount');
    const cashExpectedAmount = document.getElementById('cashExpectedAmount');
    const finalCash = document.getElementById('finalCash');
    
    if (cashInitialAmount) cashInitialAmount.textContent = formatCurrency(initialAmount);
    if (cashSalesAmount) cashSalesAmount.textContent = formatCurrency(cashSales);
    if (cashExpectedAmount) cashExpectedAmount.textContent = formatCurrency(expectedAmount);
    if (finalCash) finalCash.value = expectedAmount.toFixed(2);
    
    calculateCashDifference();
    openModal('cashRegisterModal');
}

function calculateCashDifference() {
    const finalCashInput = document.getElementById('finalCash');
    const expectedAmountEl = document.getElementById('cashExpectedAmount');
    const differenceEl = document.getElementById('cashDifference');
    const differenceAmount = document.getElementById('cashDifferenceAmount');
    
    if (!finalCashInput || !expectedAmountEl || !differenceEl || !differenceAmount) return;
    
    const finalCash = parseFloat(finalCashInput.value) || 0;
    const expectedText = expectedAmountEl.textContent.replace(/[^\d,.-]/g, '').replace(',', '.');
    const expectedAmount = parseFloat(expectedText) || 0;
    const difference = finalCash - expectedAmount;
    
    differenceEl.style.display = 'flex';
    
    if (difference > 0) {
        differenceAmount.style.color = 'var(--success)';
        differenceAmount.textContent = '+' + formatCurrency(difference);
    } else if (difference < 0) {
        differenceAmount.style.color = 'var(--danger)';
        differenceAmount.textContent = '-' + formatCurrency(Math.abs(difference));
    } else {
        differenceAmount.style.color = 'var(--text-primary)';
        differenceAmount.textContent = formatCurrency(0);
    }
}

function handleOpenCash() {
    const initialCashInput = document.getElementById('initialCash');
    if (!initialCashInput) return;
    
    const initialAmount = parseFloat(initialCashInput.value) || 0;
    
    state.cashRegister.isOpen = true;
    state.cashRegister.openDate = new Date().toISOString();
    state.cashRegister.initialAmount = initialAmount;
    state.cashRegister.currentSession = {
        openDate: state.cashRegister.openDate,
        initialAmount: initialAmount
    };
    
    saveData();
    updateCashRegisterButton();
    closeModal('cashRegisterModal');
    showNotification('Caixa aberto com sucesso!', 'success');
}

function handleCloseCash() {
    const finalCashInput = document.getElementById('finalCash');
    const expectedAmountEl = document.getElementById('cashExpectedAmount');
    
    if (!finalCashInput || !expectedAmountEl) return;
    
    const finalCash = parseFloat(finalCashInput.value) || 0;
    const expectedText = expectedAmountEl.textContent.replace(/[^\d,.-]/g, '').replace(',', '.');
    const expectedAmount = parseFloat(expectedText) || 0;
    const difference = finalCash - expectedAmount;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaySales = (state.sales || []).filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date);
        return saleDate >= today && saleDate < tomorrow;
    });
    
    const cashSales = todaySales
        .filter(sale => sale.paymentMethod === 'dinheiro')
        .reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    const session = {
        openDate: state.cashRegister.openDate,
        closeDate: new Date().toISOString(),
        initialAmount: state.cashRegister.initialAmount,
        finalAmount: finalCash,
        expectedAmount: expectedAmount,
        cashSales: cashSales,
        totalSales: todaySales.length,
        difference: difference,
        sales: todaySales
    };
    
    state.cashRegister.history.push(session);
    state.cashRegister.isOpen = false;
    state.cashRegister.openDate = null;
    state.cashRegister.initialAmount = 0;
    state.cashRegister.currentSession = null;
    
    saveData();
    updateCashRegisterButton();
    closeModal('cashRegisterModal');
    showNotification('Caixa fechado com sucesso!', 'success');
}

function updateCashRegisterButton() {
    const btn = document.getElementById('cashRegisterBtn');
    
    if (!btn) return;
    
    if (state.cashRegister.isOpen) {
        btn.title = 'Caixa Aberto - Clique para fechar';
        btn.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
    } else {
        btn.title = 'Caixa Fechado - Clique para abrir';
        btn.style.backgroundColor = '';
    }
}

// Make functions available globally for onclick handlers
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.playSound = playSound;
window.viewSaleDetails = viewSaleDetails;


