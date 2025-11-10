// ===== Charts and Dashboards =====
// Chart instances storage
let chartInstances = {
    salesChart: null,
    productsChart: null,
    paymentChart: null,
    weekdayChart: null
};

// Ensure formatCurrency is available (from script.js)
if (typeof formatCurrency === 'undefined') {
    console.warn('formatCurrency não está definido. Usando fallback.');
    window.formatCurrency = function(value) {
        return 'R$ ' + parseFloat(value || 0).toFixed(2).replace('.', ',');
    };
}

// Ensure escapeHtml is available (from script.js)
if (typeof escapeHtml === 'undefined') {
    console.warn('escapeHtml não está definido. Usando fallback.');
    window.escapeHtml = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}

function initializeCharts() {
    // Wait for Chart.js to be available
    const checkChartJS = setInterval(() => {
        if (typeof Chart !== 'undefined') {
            clearInterval(checkChartJS);
            setupChartListeners();
        }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkChartJS);
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não carregou após 5 segundos');
        }
    }, 5000);
}

function setupChartListeners() {
    // Event listeners for charts modal
    const chartsBtn = document.getElementById('chartsBtn');
    if (chartsBtn) {
        // Remove existing listeners to avoid duplicates
        const newChartsBtn = chartsBtn.cloneNode(true);
        chartsBtn.parentNode.replaceChild(newChartsBtn, chartsBtn);
        
        newChartsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof openModal === 'function') {
                openModal('chartsModal');
                setChartPeriod('today');
                // Wait for modal to be visible before generating charts
                setTimeout(() => {
                    if (typeof Chart !== 'undefined') {
                        generateCharts();
                    } else {
                        console.error('Chart.js não está disponível');
                        const chartsContent = document.querySelector('.charts-content');
                        if (chartsContent) {
                            chartsContent.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--danger);"><p>Erro: Chart.js não está carregado. Verifique sua conexão com a internet.</p></div>';
                        }
                    }
                }, 350);
            } else {
                console.error('openModal não está definido');
            }
        });
    } else {
        console.error('Botão chartsBtn não encontrado');
    }
    
    const closeCharts = document.getElementById('closeCharts');
    if (closeCharts) {
        closeCharts.addEventListener('click', () => {
            if (typeof closeModal === 'function') {
                closeModal('chartsModal');
            }
        });
    }
    
    const generateChartsBtn = document.getElementById('generateCharts');
    if (generateChartsBtn) {
        generateChartsBtn.addEventListener('click', () => {
            if (typeof Chart !== 'undefined') {
                generateCharts();
            } else {
                alert('Erro: Chart.js não está carregado. Verifique sua conexão com a internet.');
            }
        });
    }
    
    // Chart period buttons - use event delegation on modal
    const chartsModal = document.getElementById('chartsModal');
    if (chartsModal) {
        chartsModal.addEventListener('click', (e) => {
            if (e.target && e.target.dataset && e.target.dataset.chartPeriod) {
                const period = e.target.dataset.chartPeriod;
                setChartPeriod(period);
                if (typeof Chart !== 'undefined') {
                    generateCharts();
                }
            }
        });
    }
}

function setChartPeriod(period) {
    const chartDateStart = document.getElementById('chartDateStart');
    const chartDateEnd = document.getElementById('chartDateEnd');
    const today = new Date();
    
    if (!chartDateStart || !chartDateEnd) return;
    
    switch(period) {
        case 'today':
            const todayStr = today.toISOString().split('T')[0];
            chartDateStart.value = todayStr;
            chartDateEnd.value = todayStr;
            break;
        case '7days':
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            chartDateStart.value = sevenDaysAgo.toISOString().split('T')[0];
            chartDateEnd.value = today.toISOString().split('T')[0];
            break;
        case '30days':
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            chartDateStart.value = thirtyDaysAgo.toISOString().split('T')[0];
            chartDateEnd.value = today.toISOString().split('T')[0];
            break;
        case 'all':
            chartDateStart.value = '';
            chartDateEnd.value = '';
            break;
    }
    
    // Update button states
    document.querySelectorAll('[data-chart-period]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.chartPeriod === period) {
            btn.classList.add('active');
        }
    });
}

function generateCharts() {
    const chartDateStart = document.getElementById('chartDateStart')?.value || '';
    const chartDateEnd = document.getElementById('chartDateEnd')?.value || '';
    
    let filteredSales = Array.isArray(state.sales) ? state.sales : [];
    
    // Filter by date range
    if (chartDateStart && chartDateEnd) {
        filteredSales = filteredSales.filter(sale => {
            if (!sale.date) return false;
            const saleDate = new Date(sale.date);
            const startDate = new Date(chartDateStart + 'T00:00:00');
            const endDate = new Date(chartDateEnd + 'T23:59:59');
            return saleDate >= startDate && saleDate <= endDate;
        });
    }
    
    // Calculate metrics
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
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
    
    // Update metrics
    document.getElementById('metricTotalSales').textContent = totalSales;
    document.getElementById('metricTotalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('metricAvgTicket').textContent = formatCurrency(avgTicket);
    document.getElementById('metricTotalProfit').textContent = formatCurrency(totalProfit);
    
    // Generate charts
    generateSalesChart(filteredSales);
    generateProductsChart(filteredSales);
    generatePaymentChart(filteredSales);
    generateWeekdayChart(filteredSales);
}

function generateSalesChart(sales) {
    const chartContainer = document.querySelector('#salesChart')?.parentElement;
    const ctx = document.getElementById('salesChart');
    
    if (!ctx || !chartContainer) {
        console.error('Elemento salesChart não encontrado');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível');
        chartContainer.innerHTML = '<h3>Vendas ao Longo do Tempo</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro: Chart.js não está carregado. Verifique sua conexão com a internet.</p>';
        return;
    }
    
    // Destroy existing chart
    if (chartInstances.salesChart) {
        try {
            chartInstances.salesChart.destroy();
        } catch (e) {
            console.warn('Erro ao destruir gráfico anterior:', e);
        }
        chartInstances.salesChart = null;
    }
    
    // Ensure canvas exists
    if (!chartContainer.querySelector('canvas#salesChart')) {
        chartContainer.innerHTML = '<h3>Vendas ao Longo do Tempo</h3><canvas id="salesChart"></canvas>';
    }
    const newCtx = document.getElementById('salesChart');
    if (!newCtx) {
        console.error('Não foi possível criar canvas');
        return;
    }
    
    // Group sales by date
    const salesByDate = {};
    sales.forEach(sale => {
        if (!sale.date) return;
        try {
            const date = new Date(sale.date);
            if (isNaN(date.getTime())) return;
            const dateStr = date.toLocaleDateString('pt-BR');
            if (!salesByDate[dateStr]) {
                salesByDate[dateStr] = 0;
            }
            salesByDate[dateStr] += parseFloat(sale.total) || 0;
        } catch (e) {
            console.warn('Erro ao processar venda:', sale, e);
        }
    });
    
    const labels = Object.keys(salesByDate).sort((a, b) => {
        try {
            const dateA = new Date(a.split('/').reverse().join('-'));
            const dateB = new Date(b.split('/').reverse().join('-'));
            return dateA - dateB;
        } catch (e) {
            return a.localeCompare(b);
        }
    });
    const data = labels.map(label => salesByDate[label]);
    
    if (labels.length === 0) {
        chartContainer.innerHTML = '<h3>Vendas ao Longo do Tempo</h3><p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Nenhum dado disponível para o período selecionado.</p>';
        return;
    }
    
    try {
        chartInstances.salesChart = new Chart(newCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Receita (R$)',
                    data: data,
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return 'Receita: R$ ' + context.parsed.y.toFixed(2).replace('.', ',');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2).replace('.', ',');
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico de vendas:', error);
        chartContainer.innerHTML = '<h3>Vendas ao Longo do Tempo</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro ao gerar gráfico: ' + (error.message || 'Erro desconhecido') + '</p>';
    }
}

function generateProductsChart(sales) {
    const chartContainer = document.querySelector('#productsChart').parentElement;
    const ctx = document.getElementById('productsChart');
    if (!ctx) {
        console.error('Elemento productsChart não encontrado');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível');
        chartContainer.innerHTML = '<h3>Top 10 Produtos Mais Vendidos</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro: Chart.js não está carregado.</p>';
        return;
    }
    
    if (chartInstances.productsChart) {
        chartInstances.productsChart.destroy();
        chartInstances.productsChart = null;
    }
    
    // Restore container if it was replaced
    if (!chartContainer.querySelector('canvas#productsChart')) {
        chartContainer.innerHTML = '<h3>Top 10 Produtos Mais Vendidos</h3><canvas id="productsChart"></canvas>';
    }
    const newCtx = document.getElementById('productsChart');
    
    // Count products
    const productCounts = {};
    sales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                if (!productCounts[item.id]) {
                    productCounts[item.id] = {
                        name: item.name || 'Sem nome',
                        quantity: 0
                    };
                }
                productCounts[item.id].quantity += item.quantity || 0;
            });
        }
    });
    
    const topProducts = Object.values(productCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    
    const labels = topProducts.map(p => p.name);
    const data = topProducts.map(p => p.quantity);
    
    if (labels.length === 0) {
        chartContainer.innerHTML = '<h3>Top 10 Produtos Mais Vendidos</h3><p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Nenhum produto vendido no período selecionado.</p>';
        return;
    }
    
    try {
        chartInstances.productsChart = new Chart(newCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quantidade Vendida',
                    data: data,
                    backgroundColor: 'rgba(37, 99, 235, 0.8)',
                    borderColor: 'rgb(37, 99, 235)',
                    borderWidth: 1
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
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico de produtos:', error);
        chartContainer.innerHTML = '<h3>Top 10 Produtos Mais Vendidos</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro ao gerar gráfico. Tente novamente.</p>';
    }
}

function generatePaymentChart(sales) {
    const chartContainer = document.querySelector('#paymentChart').parentElement;
    const ctx = document.getElementById('paymentChart');
    if (!ctx) {
        console.error('Elemento paymentChart não encontrado');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível');
        chartContainer.innerHTML = '<h3>Formas de Pagamento</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro: Chart.js não está carregado.</p>';
        return;
    }
    
    if (chartInstances.paymentChart) {
        chartInstances.paymentChart.destroy();
        chartInstances.paymentChart = null;
    }
    
    // Restore container if it was replaced
    if (!chartContainer.querySelector('canvas#paymentChart')) {
        chartContainer.innerHTML = '<h3>Formas de Pagamento</h3><canvas id="paymentChart"></canvas>';
    }
    const newCtx = document.getElementById('paymentChart');
    
    const paymentMethods = {
        'dinheiro': 'Dinheiro',
        'pix': 'Pix',
        'credito': 'Crédito',
        'debito': 'Débito'
    };
    
    const paymentCounts = {};
    sales.forEach(sale => {
        const method = sale.paymentMethod || 'desconhecido';
        const methodName = paymentMethods[method] || method;
        if (!paymentCounts[methodName]) {
            paymentCounts[methodName] = 0;
        }
        paymentCounts[methodName] += sale.total || 0;
    });
    
    const labels = Object.keys(paymentCounts);
    const data = Object.values(paymentCounts);
    const colors = [
        'rgba(37, 99, 235, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
    ];
    
    if (labels.length === 0) {
        chartContainer.innerHTML = '<h3>Formas de Pagamento</h3><p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Nenhum dado disponível para o período selecionado.</p>';
        return;
    }
    
    try {
        chartInstances.paymentChart = new Chart(newCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico de pagamentos:', error);
        chartContainer.innerHTML = '<h3>Formas de Pagamento</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro ao gerar gráfico. Tente novamente.</p>';
    }
}

function generateWeekdayChart(sales) {
    const chartContainer = document.querySelector('#weekdayChart').parentElement;
    const ctx = document.getElementById('weekdayChart');
    if (!ctx) {
        console.error('Elemento weekdayChart não encontrado');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível');
        chartContainer.innerHTML = '<h3>Vendas por Dia da Semana</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro: Chart.js não está carregado.</p>';
        return;
    }
    
    if (chartInstances.weekdayChart) {
        chartInstances.weekdayChart.destroy();
        chartInstances.weekdayChart = null;
    }
    
    // Restore container if it was replaced
    if (!chartContainer.querySelector('canvas#weekdayChart')) {
        chartContainer.innerHTML = '<h3>Vendas por Dia da Semana</h3><canvas id="weekdayChart"></canvas>';
    }
    const newCtx = document.getElementById('weekdayChart');
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    
    sales.forEach(sale => {
        if (!sale.date) return;
        const date = new Date(sale.date);
        const weekday = date.getDay();
        weekdayCounts[weekday] += sale.total || 0;
    });
    
    chartInstances.weekdayChart = new Chart(newCtx, {
        type: 'bar',
        data: {
            labels: weekdays,
            datasets: [{
                label: 'Receita (R$)',
                data: weekdayCounts,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1
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
                    beginAtZero: true
                }
            }
        }
    });
}

// ===== Coupons and Promotions =====
function initializeCoupons() {
    // Event listeners for promotions modal
    const promotionsBtn = document.getElementById('promotionsBtn');
    if (promotionsBtn) {
        promotionsBtn.addEventListener('click', () => {
            openModal('promotionsModal');
            renderCouponsList();
            renderPromotionsList();
            renderCampaignsList();
        });
    }
    
    const closePromotions = document.getElementById('closePromotions');
    if (closePromotions) {
        closePromotions.addEventListener('click', () => closeModal('promotionsModal'));
    }
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Coupon form
    const addCouponBtn = document.getElementById('addCouponBtn');
    if (addCouponBtn) {
        addCouponBtn.addEventListener('click', () => {
            document.getElementById('couponFormTitle').textContent = 'Adicionar Cupom';
            document.getElementById('couponForm').reset();
            document.getElementById('couponCodeInput').value = '';
            openModal('couponFormModal');
        });
    }
    
    const closeCouponForm = document.getElementById('closeCouponForm');
    if (closeCouponForm) {
        closeCouponForm.addEventListener('click', () => closeModal('couponFormModal'));
    }
    
    const cancelCouponForm = document.getElementById('cancelCouponForm');
    if (cancelCouponForm) {
        cancelCouponForm.addEventListener('click', () => closeModal('couponFormModal'));
    }
    
    const couponForm = document.getElementById('couponForm');
    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponSubmit);
    }
    
    // Promotion form
    const addPromotionBtn = document.getElementById('addPromotionBtn');
    if (addPromotionBtn) {
        addPromotionBtn.addEventListener('click', () => {
            document.getElementById('promotionFormTitle').textContent = 'Adicionar Promoção';
            const form = document.getElementById('promotionForm');
            if (form) {
                form.reset();
                delete form.dataset.editingId;
            }
            loadProductsForPromotion();
            openModal('promotionFormModal');
        });
    }
    
    const closePromotionForm = document.getElementById('closePromotionForm');
    if (closePromotionForm) {
        closePromotionForm.addEventListener('click', () => closeModal('promotionFormModal'));
    }
    
    const cancelPromotionForm = document.getElementById('cancelPromotionForm');
    if (cancelPromotionForm) {
        cancelPromotionForm.addEventListener('click', () => closeModal('promotionFormModal'));
    }
    
    const promotionForm = document.getElementById('promotionForm');
    if (promotionForm) {
        promotionForm.addEventListener('submit', handlePromotionSubmit);
    }
    
    // Apply coupon button
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', applyCoupon);
    }
    
    const couponCodeInput = document.getElementById('couponCode');
    if (couponCodeInput) {
        couponCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCoupon();
            }
        });
    }
}

function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tab}Tab`) {
            content.classList.add('active');
        }
    });
}

function renderCouponsList() {
    const couponsList = document.getElementById('couponsList');
    if (!couponsList) return;
    
    if (!state.coupons || state.coupons.length === 0) {
        couponsList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Nenhum cupom cadastrado</p>';
        return;
    }
    
    couponsList.innerHTML = state.coupons.map(coupon => {
        const isActive = coupon.active && new Date(coupon.endDate) >= new Date() && new Date(coupon.startDate) <= new Date();
        const uses = coupon.uses || 0;
        const maxUses = coupon.maxUses || 0;
        const isExpired = maxUses > 0 && uses >= maxUses;
        
        return `
            <div class="coupon-card" style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(coupon.name)}</h3>
                        <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Código: <strong>${escapeHtml(coupon.code)}</strong></p>
                        <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">
                            Desconto: ${coupon.type === 'percent' ? coupon.value + '%' : formatCurrency(coupon.value)}
                            ${coupon.minPurchase > 0 ? ` | Mínimo: ${formatCurrency(coupon.minPurchase)}` : ''}
                        </p>
                        <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">
                            Validade: ${new Date(coupon.startDate).toLocaleDateString('pt-BR')} - ${new Date(coupon.endDate).toLocaleDateString('pt-BR')}
                        </p>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                            Usos: ${uses}${maxUses > 0 ? ` / ${maxUses}` : ' (ilimitado)'}
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-secondary" onclick="editCoupon('${coupon.id}')" style="padding: 0.5rem;">✏️</button>
                        <button class="btn-secondary" onclick="deleteCoupon('${coupon.id}')" style="padding: 0.5rem;">🗑️</button>
                    </div>
                </div>
                <div style="margin-top: 0.5rem;">
                    <span class="badge" style="background: ${isActive && !isExpired ? 'var(--success)' : 'var(--danger)'}; color: white; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
                        ${isActive && !isExpired ? 'Ativo' : isExpired ? 'Esgotado' : 'Inativo'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function renderPromotionsList() {
    const promotionsList = document.getElementById('promotionsList');
    if (!promotionsList) return;
    
    if (!state.promotions || state.promotions.length === 0) {
        promotionsList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Nenhuma promoção cadastrada</p>';
        return;
    }
    
    promotionsList.innerHTML = state.promotions.map(promotion => {
        const isActive = promotion.active && new Date(promotion.endDate) >= new Date() && new Date(promotion.startDate) <= new Date();
        
        return `
            <div class="promotion-card" style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(promotion.name)}</h3>
                        <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Tipo: ${getPromotionTypeName(promotion.type)}</p>
                        <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">
                            Validade: ${new Date(promotion.startDate).toLocaleDateString('pt-BR')} - ${new Date(promotion.endDate).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-secondary" onclick="editPromotion('${promotion.id}')" style="padding: 0.5rem;">✏️</button>
                        <button class="btn-secondary" onclick="deletePromotion('${promotion.id}')" style="padding: 0.5rem;">🗑️</button>
                    </div>
                </div>
                <div style="margin-top: 0.5rem;">
                    <span class="badge" style="background: ${isActive ? 'var(--success)' : 'var(--danger)'}; color: white; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
                        ${isActive ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function renderCampaignsList() {
    const campaignsList = document.getElementById('campaignsList');
    if (!campaignsList) return;
    
    if (!state.campaigns || state.campaigns.length === 0) {
        campaignsList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">Nenhuma campanha cadastrada</p>';
        return;
    }
    
    campaignsList.innerHTML = state.campaigns.map(campaign => {
        return `
            <div class="campaign-card" style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; border: 1px solid var(--border);">
                <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(campaign.name)}</h3>
                <p style="margin: 0; color: var(--text-secondary);">${escapeHtml(campaign.description || '')}</p>
            </div>
        `;
    }).join('');
}

function getPromotionTypeName(type) {
    const types = {
        'discount': 'Desconto',
        'buyxgety': 'Leve X Pague Y',
        'freeShipping': 'Frete Grátis'
    };
    return types[type] || type;
}

function handleCouponSubmit(e) {
    e.preventDefault();
    
    const coupon = {
        id: generateId(),
        name: document.getElementById('couponName').value.trim(),
        code: document.getElementById('couponCodeInput').value.trim().toUpperCase(),
        type: document.getElementById('couponType').value,
        value: parseFloat(document.getElementById('couponValue').value),
        minPurchase: parseFloat(document.getElementById('couponMinPurchase').value) || 0,
        startDate: document.getElementById('couponStartDate').value,
        endDate: document.getElementById('couponEndDate').value,
        maxUses: parseInt(document.getElementById('couponMaxUses').value) || 0,
        active: document.getElementById('couponActive').checked,
        uses: 0,
        createdAt: new Date().toISOString()
    };
    
    // Validate
    if (coupon.startDate > coupon.endDate) {
        alert('Data de início não pode ser maior que data de término');
        return;
    }
    
    // Check if code already exists (only for new coupons)
    if (!editingId && state.coupons.some(c => c.code === coupon.code)) {
        alert('Código de cupom já existe');
        return;
    }
    
    // Check if code exists for other coupons (when editing)
    if (editingId && state.coupons.some(c => c.code === coupon.code && c.id !== editingId)) {
        alert('Código de cupom já existe');
        return;
    }
    
    if (!state.coupons) state.coupons = [];
    if (!editingId) {
        state.coupons.push(coupon);
    }
    
    // Clear editing ID
    delete e.target.dataset.editingId;
    
    saveData();
    renderCouponsList();
    closeModal('couponFormModal');
    showNotification(editingId ? 'Cupom atualizado com sucesso!' : 'Cupom adicionado com sucesso!', 'success');
}

function handlePromotionSubmit(e) {
    e.preventDefault();
    
    const editingId = e.target.dataset.editingId;
    let promotion;
    
    if (editingId) {
        // Edit existing promotion
        const existingIndex = state.promotions.findIndex(p => p.id === editingId);
        if (existingIndex === -1) return;
        
        promotion = {
            ...state.promotions[existingIndex],
            name: document.getElementById('promotionName').value.trim(),
            type: document.getElementById('promotionType').value,
            products: Array.from(document.getElementById('promotionProducts').selectedOptions).map(opt => opt.value),
            discount: parseFloat(document.getElementById('promotionDiscount').value) || 0,
            startDate: document.getElementById('promotionStartDate').value,
            endDate: document.getElementById('promotionEndDate').value,
            active: document.getElementById('promotionActive').checked
        };
        state.promotions[existingIndex] = promotion;
    } else {
        // Create new promotion
        promotion = {
            id: generateId(),
        name: document.getElementById('promotionName').value.trim(),
        type: document.getElementById('promotionType').value,
        products: Array.from(document.getElementById('promotionProducts').selectedOptions).map(opt => opt.value),
        discount: parseFloat(document.getElementById('promotionDiscount').value) || 0,
        startDate: document.getElementById('promotionStartDate').value,
        endDate: document.getElementById('promotionEndDate').value,
        active: document.getElementById('promotionActive').checked,
        createdAt: new Date().toISOString()
    };
    
    // Validate
    if (promotion.startDate > promotion.endDate) {
        alert('Data de início não pode ser maior que data de término');
        return;
    }
    
    if (!state.promotions) state.promotions = [];
    if (!editingId) {
        state.promotions.push(promotion);
    }
    
    // Clear editing ID
    delete e.target.dataset.editingId;
    
    saveData();
    renderPromotionsList();
    closeModal('promotionFormModal');
    showNotification(editingId ? 'Promoção atualizada com sucesso!' : 'Promoção adicionada com sucesso!', 'success');
}

function loadProductsForPromotion() {
    const select = document.getElementById('promotionProducts');
    if (!select) return;
    
    select.innerHTML = state.products.map(product => {
        return `<option value="${product.id}">${escapeHtml(product.name)}</option>`;
    }).join('');
}

function applyCoupon() {
    const couponCode = document.getElementById('couponCode').value.trim().toUpperCase();
    const couponMessage = document.getElementById('couponMessage');
    
    if (!couponCode) {
        couponMessage.innerHTML = '<span style="color: var(--danger);">Digite um código de cupom</span>';
        return;
    }
    
    const coupon = state.coupons.find(c => c.code === couponCode);
    
    if (!coupon) {
        couponMessage.innerHTML = '<span style="color: var(--danger);">Cupom não encontrado</span>';
        state.appliedCoupon = null;
        updateCartDisplay();
        return;
    }
    
    // Validate coupon
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);
    
    if (!coupon.active) {
        couponMessage.innerHTML = '<span style="color: var(--danger);">Cupom inativo</span>';
        state.appliedCoupon = null;
        updateCartDisplay();
        return;
    }
    
    if (now < startDate) {
        couponMessage.innerHTML = '<span style="color: var(--danger);">Cupom ainda não está válido</span>';
        state.appliedCoupon = null;
        updateCartDisplay();
        return;
    }
    
    if (now > endDate) {
        couponMessage.innerHTML = '<span style="color: var(--danger);">Cupom expirado</span>';
        state.appliedCoupon = null;
        updateCartDisplay();
        return;
    }
    
    if (coupon.maxUses > 0 && (coupon.uses || 0) >= coupon.maxUses) {
        couponMessage.innerHTML = '<span style="color: var(--danger);">Cupom esgotado</span>';
        state.appliedCoupon = null;
        updateCartDisplay();
        return;
    }
    
    const subtotal = calculateCartTotal();
    if (coupon.minPurchase > 0 && subtotal < coupon.minPurchase) {
        couponMessage.innerHTML = `<span style="color: var(--danger);">Valor mínimo de compra: ${formatCurrency(coupon.minPurchase)}</span>`;
        state.appliedCoupon = null;
        updateCartDisplay();
        return;
    }
    
    // Apply coupon
    state.appliedCoupon = coupon;
    couponMessage.innerHTML = `<span style="color: var(--success);">Cupom aplicado! Desconto: ${coupon.type === 'percent' ? coupon.value + '%' : formatCurrency(coupon.value)}</span>`;
    updateCartDisplay();
    saveData();
}

function editCoupon(id) {
    const coupon = state.coupons.find(c => c.id === id);
    if (!coupon) return;
    
    document.getElementById('couponFormTitle').textContent = 'Editar Cupom';
    document.getElementById('couponName').value = coupon.name;
    document.getElementById('couponCodeInput').value = coupon.code;
    document.getElementById('couponType').value = coupon.type;
    document.getElementById('couponValue').value = coupon.value;
    document.getElementById('couponMinPurchase').value = coupon.minPurchase || 0;
    document.getElementById('couponStartDate').value = coupon.startDate;
    document.getElementById('couponEndDate').value = coupon.endDate;
    document.getElementById('couponMaxUses').value = coupon.maxUses || 0;
    document.getElementById('couponActive').checked = coupon.active;
    
    // Store editing coupon ID
    document.getElementById('couponForm').dataset.editingId = id;
    openModal('couponFormModal');
}

function deleteCoupon(id) {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
    
    state.coupons = state.coupons.filter(c => c.id !== id);
    saveData();
    renderCouponsList();
    showNotification('Cupom excluído com sucesso!', 'success');
}

function editPromotion(id) {
    const promotion = state.promotions.find(p => p.id === id);
    if (!promotion) return;
    
    document.getElementById('promotionFormTitle').textContent = 'Editar Promoção';
    document.getElementById('promotionName').value = promotion.name;
    document.getElementById('promotionType').value = promotion.type;
    document.getElementById('promotionDiscount').value = promotion.discount || 0;
    document.getElementById('promotionStartDate').value = promotion.startDate;
    document.getElementById('promotionEndDate').value = promotion.endDate;
    document.getElementById('promotionActive').checked = promotion.active;
    
    loadProductsForPromotion();
    if (promotion.products && promotion.products.length > 0) {
        promotion.products.forEach(productId => {
            const option = document.querySelector(`#promotionProducts option[value="${productId}"]`);
            if (option) option.selected = true;
        });
    }
    
    const form = document.getElementById('promotionForm');
    if (form) {
        form.dataset.editingId = id;
    }
    openModal('promotionFormModal');
}

function deletePromotion(id) {
    if (!confirm('Tem certeza que deseja excluir esta promoção?')) return;
    
    state.promotions = state.promotions.filter(p => p.id !== id);
    saveData();
    renderPromotionsList();
    showNotification('Promoção excluída com sucesso!', 'success');
}

// Make functions available globally
window.editCoupon = editCoupon;
window.deleteCoupon = deleteCoupon;
window.editPromotion = editPromotion;
window.deletePromotion = deletePromotion;

