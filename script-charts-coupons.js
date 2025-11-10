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
    console.log('=== initializeCharts() chamado ===');
    console.log('Chart.js no window:', typeof window.Chart !== 'undefined');
    console.log('Chart.js global:', typeof Chart !== 'undefined');
    
    // Check if Chart.js script tag exists
    const chartScript = document.querySelector('script[src*="chart.js"]');
    console.log('Script tag Chart.js encontrado:', !!chartScript);
    
    // Function to setup listeners
    const setup = () => {
        console.log('Configurando listeners de gráficos...');
        setupChartListeners();
    };
    
    // Check if Chart.js is already loaded
    if (typeof Chart !== 'undefined' || typeof window.Chart !== 'undefined') {
        console.log('✅ Chart.js já está disponível');
        // Make Chart available globally if it's not
        if (typeof Chart === 'undefined' && typeof window.Chart !== 'undefined') {
            window.Chart = window.Chart;
        }
        setup();
        return;
    }
    
    // Wait for Chart.js to be available
    console.log('⏳ Aguardando Chart.js carregar...');
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max
    
    const checkChartJS = setInterval(() => {
        attempts++;
        
        // Check both global and window.Chart
        const chartLoaded = typeof Chart !== 'undefined' || typeof window.Chart !== 'undefined';
        
        if (chartLoaded) {
            console.log('✅ Chart.js carregado após', attempts * 100, 'ms');
            clearInterval(checkChartJS);
            
            // Ensure Chart is globally available
            if (typeof Chart === 'undefined' && typeof window.Chart !== 'undefined') {
                window.Chart = window.Chart;
            }
            
            setup();
        } else if (attempts >= maxAttempts) {
            console.error('❌ Chart.js não carregou após 10 segundos');
            console.error('Verifique se o script está sendo carregado corretamente');
            clearInterval(checkChartJS);
            // Still setup listeners - they will show error message
            setup();
        }
    }, 100);
}

function setupChartListeners() {
    console.log('=== setupChartListeners() chamado ===');
    
    // Wait a bit to ensure all scripts are loaded
    setTimeout(() => {
        // Event listeners for charts modal
        const chartsBtn = document.getElementById('chartsBtn');
        if (!chartsBtn) {
            console.error('❌ Botão chartsBtn não encontrado no DOM');
            return;
        }
        
        console.log('✅ Botão chartsBtn encontrado');
        
        // Remove any existing event listeners by cloning
        const newChartsBtn = chartsBtn.cloneNode(true);
        chartsBtn.parentNode.replaceChild(newChartsBtn, chartsBtn);
        
        newChartsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📊 Botão de gráficos clicado!');
            console.log('Chart.js:', typeof Chart !== 'undefined' ? '✅ Carregado' : '❌ Não carregado');
            console.log('State:', typeof state !== 'undefined' ? '✅ Disponível' : '❌ Não disponível');
            console.log('openModal:', typeof window.openModal === 'function' ? '✅ Disponível' : '❌ Não disponível');
            console.log('openModal (direct):', typeof openModal === 'function' ? '✅ Disponível' : '❌ Não disponível');
            
            // Try multiple ways to open modal
            let modalOpened = false;
            if (typeof window.openModal === 'function') {
                window.openModal('chartsModal');
                modalOpened = true;
            } else if (typeof openModal === 'function') {
                openModal('chartsModal');
                modalOpened = true;
            } else {
                // Direct DOM manipulation as fallback
                const modal = document.getElementById('chartsModal');
                if (modal) {
                    modal.classList.add('active');
                    modalOpened = true;
                }
            }
            
            if (!modalOpened) {
                console.error('❌ Não foi possível abrir o modal');
                alert('Erro: Não foi possível abrir o modal de gráficos. Recarregue a página.');
                return;
            }
            
            console.log('✅ Modal aberto');
            
            // Set period
            try {
                setChartPeriod('today');
            } catch (e) {
                console.warn('Erro ao definir período:', e);
            }
            
            // Generate charts after modal opens
            const generateAfterOpen = () => {
                const modal = document.getElementById('chartsModal');
                const isVisible = modal && modal.classList.contains('active');
                const chartJsLoaded = typeof Chart !== 'undefined' || typeof window.Chart !== 'undefined' || window.ChartJSLoaded === true;
                const stateAvailable = typeof state !== 'undefined' && state && Array.isArray(state.sales);
                
                console.log('🔍 Verificando condições:', {
                    modalExists: !!modal,
                    isVisible,
                    chartJsLoaded,
                    stateAvailable,
                    salesCount: stateAvailable ? state.sales.length : 'N/A',
                    ChartType: typeof Chart,
                    windowChartType: typeof window.Chart,
                    ChartJSLoadedFlag: window.ChartJSLoaded
                });
                
                if (!chartJsLoaded) {
                    console.error('❌ Chart.js não carregado');
                    console.error('Chart:', typeof Chart);
                    console.error('window.Chart:', typeof window.Chart);
                    console.error('ChartJSLoaded flag:', window.ChartJSLoaded);
                    console.error('ChartJSError flag:', window.ChartJSError);
                    
                    const chartsContent = document.querySelector('.charts-content');
                    if (chartsContent) {
                        chartsContent.innerHTML = `
                            <div style="padding: 2rem; text-align: center; color: var(--danger);">
                                <p><strong>⚠️ Chart.js não está carregado</strong></p>
                                <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                                    Verifique sua conexão com a internet e recarregue a página.
                                </p>
                                <p style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-secondary);">
                                    Se o problema persistir, verifique o console do navegador (F12).
                                </p>
                                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Recarregar Página
                                </button>
                            </div>
                        `;
                    }
                    return;
                }
                
                if (!stateAvailable) {
                    console.error('❌ State não disponível ou inválido');
                    return;
                }
                
                if (isVisible) {
                    console.log('✅ Todas as condições atendidas, gerando gráficos...');
                    // Use multiple delays to ensure everything is ready
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            try {
                                generateCharts();
                            } catch (error) {
                                console.error('❌ Erro ao gerar gráficos:', error);
                            }
                        }, 200);
                    });
                } else {
                    console.log('⏳ Modal ainda não está visível, tentando novamente...');
                    setTimeout(generateAfterOpen, 100);
                }
            };
            
            // Start checking after modal opens
            setTimeout(generateAfterOpen, 400);
        }, 0);
    }, 100);
    
    // Setup close button
    const closeCharts = document.getElementById('closeCharts');
    if (closeCharts) {
        closeCharts.addEventListener('click', () => {
            if (typeof window.closeModal === 'function') {
                window.closeModal('chartsModal');
            } else if (typeof closeModal === 'function') {
                closeModal('chartsModal');
            } else {
                const modal = document.getElementById('chartsModal');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });
    }
    
    // Setup generate charts button
    setTimeout(() => {
        const generateChartsBtn = document.getElementById('generateCharts');
        if (generateChartsBtn) {
            // Remove existing listener if any by cloning
            const newGenerateBtn = generateChartsBtn.cloneNode(true);
            generateChartsBtn.parentNode.replaceChild(newGenerateBtn, generateChartsBtn);
            
            newGenerateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('📊 Botão "Gerar Gráficos" clicado');
                
                const chartJsLoaded = typeof Chart !== 'undefined' || typeof window.Chart !== 'undefined';
                console.log('Chart.js disponível:', chartJsLoaded);
                
                if (chartJsLoaded) {
                    console.log('Gerando gráficos manualmente...');
                    try {
                        generateCharts();
                    } catch (error) {
                        console.error('Erro ao gerar gráficos:', error);
                        alert('Erro ao gerar gráficos. Verifique o console para mais detalhes.');
                    }
                } else {
                    console.error('Chart.js não está disponível');
                    alert('Erro: Chart.js não está carregado. Verifique sua conexão com a internet e recarregue a página.');
                }
            });
            console.log('✅ Botão "Gerar Gráficos" configurado');
        } else {
            console.warn('⚠️ Botão generateCharts não encontrado');
        }
    }, 200);
    
    // Chart period buttons - use event delegation on modal
    setTimeout(() => {
        const chartsModal = document.getElementById('chartsModal');
        if (chartsModal) {
            // Use event delegation for period buttons
            chartsModal.addEventListener('click', function(e) {
                const target = e.target;
                if (target && target.dataset && target.dataset.chartPeriod) {
                    const period = target.dataset.chartPeriod;
                    console.log('Período selecionado:', period);
                    try {
                        setChartPeriod(period);
                        const chartJsLoaded = typeof Chart !== 'undefined' || typeof window.Chart !== 'undefined';
                        if (chartJsLoaded) {
                            generateCharts();
                        } else {
                            console.error('Chart.js não disponível para gerar gráficos');
                        }
                    } catch (error) {
                        console.error('Erro ao definir período:', error);
                    }
                }
            });
            console.log('✅ Event delegation para botões de período configurado');
        } else {
            console.warn('⚠️ Modal chartsModal não encontrado para event delegation');
        }
    }, 200);
    
    // Also listen for modal opened event
    window.addEventListener('modalOpened', function(e) {
        if (e.detail && e.detail.modalId === 'chartsModal') {
            console.log('📊 Modal de gráficos foi aberto via evento');
            setTimeout(() => {
                const chartJsLoaded = typeof Chart !== 'undefined' || typeof window.Chart !== 'undefined';
                if (chartJsLoaded && typeof state !== 'undefined') {
                    generateCharts();
                }
            }, 500);
        }
    });
}

function setChartPeriod(period) {
    // Make sure function is available on window
    if (!window.setChartPeriod) {
        window.setChartPeriod = setChartPeriod;
    }
    
    const chartDateStart = document.getElementById('chartDateStart');
    const chartDateEnd = document.getElementById('chartDateEnd');
    const today = new Date();
    
    if (!chartDateStart || !chartDateEnd) {
        console.error('chartDateStart or chartDateEnd not found');
        return;
    }
    
    console.log('setChartPeriod called with period:', period);
    
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
        default:
            console.warn('Unknown period:', period);
            return;
    }
    
    console.log('Dates set:', {
        start: chartDateStart.value,
        end: chartDateEnd.value
    });
    
    // Update button states - only update buttons in quick-period-buttons container
    const quickPeriodButtons = document.querySelector('.quick-period-buttons');
    if (quickPeriodButtons) {
        quickPeriodButtons.querySelectorAll('.btn-period').forEach(btn => {
            btn.classList.remove('active');
            const btnPeriod = btn.dataset.period || btn.dataset.chartPeriod;
            if (btnPeriod === period) {
                btn.classList.add('active');
            }
        });
    }
    
    // Generate charts after period change - force immediate update
    console.log('Tentando chamar generateCharts...');
    const generateChartsFn = window.generateCharts || generateCharts;
    
    if (typeof generateChartsFn === 'function') {
        console.log('generateCharts encontrada, chamando...');
        // Use a small delay to ensure DOM is updated
        setTimeout(() => {
            try {
                generateChartsFn();
                console.log('generateCharts chamada com sucesso');
            } catch (error) {
                console.error('Erro ao chamar generateCharts:', error);
            }
        }, 150);
    } else {
        console.error('generateCharts function not found');
        console.log('Available functions:', {
            generateCharts: typeof generateCharts,
            windowGenerateCharts: typeof window.generateCharts
        });
    }
}

function generateCharts() {
    console.log('=== generateCharts() chamado ===');
    
    // Make sure function is available on window (only if not already set)
    if (typeof window.generateCharts !== 'function') {
        window.generateCharts = generateCharts;
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível');
        const chartsContent = document.querySelector('.charts-content');
        if (chartsContent) {
            chartsContent.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--danger);"><p>⚠️ Chart.js não está carregado.</p><p style="font-size: 0.9rem; margin-top: 0.5rem;">Verifique sua conexão com a internet e recarregue a página.</p></div>';
        }
        return;
    }
    
    console.log('Chart.js está disponível');
    
    // Check if state is available
    if (typeof state === 'undefined' || !Array.isArray(state.sales)) {
        console.error('State não está disponível ou sales não é um array');
        console.log('State:', typeof state, state);
        return;
    }
    
    console.log('State disponível, vendas:', state.sales.length);
    
    // Check if we're on charts.html page (not in a modal)
    const isChartsPage = window.location.pathname.includes('charts.html') || document.querySelector('.charts-main');
    const modal = document.getElementById('chartsModal');
    
    // If modal exists, check if it's visible (for pdv.html)
    if (modal && !isChartsPage) {
        const isVisible = modal.classList.contains('active');
        console.log('Modal visível:', isVisible);
        if (!isVisible) {
            console.log('Modal não está visível, mas continuando...');
        }
    } else if (isChartsPage) {
        console.log('Página charts.html detectada, gerando gráficos diretamente');
    }
    
    const chartDateStartEl = document.getElementById('chartDateStart');
    const chartDateEndEl = document.getElementById('chartDateEnd');
    
    if (!chartDateStartEl || !chartDateEndEl) {
        console.error('Campos de data não encontrados:', {
            chartDateStart: !!chartDateStartEl,
            chartDateEnd: !!chartDateEndEl
        });
    }
    
    const chartDateStart = chartDateStartEl ? chartDateStartEl.value : '';
    const chartDateEnd = chartDateEndEl ? chartDateEndEl.value : '';
    
    let filteredSales = Array.isArray(state.sales) ? [...state.sales] : [];
    
    console.log('Dados para gráficos:', {
        totalSales: filteredSales.length,
        dateStart: chartDateStart,
        dateEnd: chartDateEnd,
        dateStartEl: chartDateStartEl ? 'encontrado' : 'não encontrado',
        dateEndEl: chartDateEndEl ? 'encontrado' : 'não encontrado'
    });
    
    // Filter by date range - same logic as generateReport
    if (chartDateStart || chartDateEnd) {
        if (chartDateStart && chartDateEnd) {
            const startDate = new Date(chartDateStart + 'T00:00:00');
            const endDate = new Date(chartDateEnd + 'T23:59:59');
            filteredSales = filteredSales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            });
        } else if (chartDateStart) {
            const startDate = new Date(chartDateStart + 'T00:00:00');
            filteredSales = filteredSales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date);
                return saleDate >= startDate;
            });
        } else if (chartDateEnd) {
            const endDate = new Date(chartDateEnd + 'T23:59:59');
            filteredSales = filteredSales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date);
                return saleDate <= endDate;
            });
        }
    } else {
        // Default to today - same as generateReport
        // Always use today as default for charts.html
        const isChartsPage = window.location.pathname.includes('charts.html') || document.querySelector('.charts-main');
        if (isChartsPage) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filteredSales = filteredSales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date);
                return saleDate >= today && saleDate < tomorrow;
            });
            console.log('Usando filtro padrão de hoje (datas vazias)');
            
            // Set today's date in inputs if they're empty
            if (chartDateStartEl && !chartDateStartEl.value) {
                const todayStr = today.toISOString().split('T')[0];
                chartDateStartEl.value = todayStr;
            }
            if (chartDateEndEl && !chartDateEndEl.value) {
                const todayStr = today.toISOString().split('T')[0];
                chartDateEndEl.value = todayStr;
            }
        }
    }
    
    console.log('Vendas filtradas:', filteredSales.length);
    
    // Calculate metrics
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const totalProfit = filteredSales.reduce((sum, sale) => {
        return sum + ((sale.items || [])).reduce((itemSum, item) => {
            const product = (state.products || []).find(p => p.id === item.id);
            if (product && product.cost !== undefined && product.cost !== null) {
                const itemProfit = (parseFloat(item.price) - parseFloat(product.cost)) * parseInt(item.quantity);
                return itemSum + itemProfit;
            }
            return itemSum;
        }, 0);
    }, 0);
    
    // Update metrics
    const metricTotalSales = document.getElementById('metricTotalSales');
    const metricTotalRevenue = document.getElementById('metricTotalRevenue');
    const metricAvgTicket = document.getElementById('metricAvgTicket');
    const metricTotalProfit = document.getElementById('metricTotalProfit');
    
    if (metricTotalSales) metricTotalSales.textContent = totalSales;
    if (metricTotalRevenue) metricTotalRevenue.textContent = formatCurrency(totalRevenue);
    if (metricAvgTicket) metricAvgTicket.textContent = formatCurrency(avgTicket);
    if (metricTotalProfit) metricTotalProfit.textContent = formatCurrency(totalProfit);
    
    // Generate charts - use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        console.log('Iniciando geração de gráficos individuais...');
        try {
            generateSalesChart(filteredSales);
            generateProductsChart(filteredSales);
            generatePaymentChart(filteredSales);
            generateWeekdayChart(filteredSales);
            console.log('Todos os gráficos gerados com sucesso');
        } catch (error) {
            console.error('Erro ao gerar gráficos:', error);
        }
    });
}

function generateSalesChart(sales) {
    console.log('Gerando gráfico de vendas, dados:', sales.length);
    
    const chartContainer = document.querySelector('#salesChart')?.parentElement;
    if (!chartContainer) {
        console.error('Container do gráfico salesChart não encontrado');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível em generateSalesChart');
        return;
    }
    
    // Destroy existing chart
    if (chartInstances.salesChart) {
        try {
            chartInstances.salesChart.destroy();
            console.log('Gráfico anterior destruído');
        } catch (e) {
            console.warn('Erro ao destruir gráfico anterior:', e);
        }
        chartInstances.salesChart = null;
    }
    
    // Get or create canvas
    let ctx = document.getElementById('salesChart');
    if (!ctx) {
        console.log('Canvas não encontrado, criando novo...');
        // Find the container and create canvas
        const heading = chartContainer.querySelector('h3');
        if (heading) {
            // Remove any existing content except heading
            const existingCanvas = chartContainer.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            const canvas = document.createElement('canvas');
            canvas.id = 'salesChart';
            canvas.style.maxHeight = '300px';
            chartContainer.appendChild(canvas);
            ctx = canvas;
        } else {
            chartContainer.innerHTML = '<h3>Vendas ao Longo do Tempo</h3><canvas id="salesChart" style="max-height: 300px;"></canvas>';
            ctx = document.getElementById('salesChart');
        }
    }
    
    if (!ctx) {
        console.error('Não foi possível criar/obter canvas salesChart');
        return;
    }
    
    console.log('Canvas encontrado/criado:', ctx);
    
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
        console.log('Criando gráfico Chart.js com', labels.length, 'labels');
        chartInstances.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Receita (R$)',
                    data: data,
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
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
        console.log('✅ Gráfico de vendas criado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao criar gráfico de vendas:', error);
        console.error('Stack trace:', error.stack);
        const errorMsg = error.message || 'Erro desconhecido';
        chartContainer.innerHTML = '<h3>Vendas ao Longo do Tempo</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro ao gerar gráfico: ' + errorMsg + '</p>';
    }
}

function generateProductsChart(sales) {
    console.log('Gerando gráfico de produtos, dados:', sales.length);
    
    const chartContainer = document.querySelector('#productsChart')?.parentElement;
    if (!chartContainer) {
        console.error('Container do gráfico productsChart não encontrado');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível em generateProductsChart');
        return;
    }
    
    if (chartInstances.productsChart) {
        try {
            chartInstances.productsChart.destroy();
            console.log('Gráfico de produtos anterior destruído');
        } catch (e) {
            console.warn('Erro ao destruir gráfico anterior:', e);
        }
        chartInstances.productsChart = null;
    }
    
    // Get or create canvas
    let ctx = document.getElementById('productsChart');
    if (!ctx) {
        console.log('Canvas productsChart não encontrado, criando novo...');
        const heading = chartContainer.querySelector('h3');
        if (heading) {
            const existingCanvas = chartContainer.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            const canvas = document.createElement('canvas');
            canvas.id = 'productsChart';
            canvas.style.maxHeight = '300px';
            chartContainer.appendChild(canvas);
            ctx = canvas;
        } else {
            chartContainer.innerHTML = '<h3>Top 10 Produtos Mais Vendidos</h3><canvas id="productsChart" style="max-height: 300px;"></canvas>';
            ctx = document.getElementById('productsChart');
        }
    }
    
    if (!ctx) {
        console.error('Não foi possível criar/obter canvas productsChart');
        return;
    }
    
    console.log('Canvas productsChart encontrado/criado:', ctx);
    
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
        chartInstances.productsChart = new Chart(ctx, {
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
        console.log('✅ Gráfico de produtos criado com sucesso');
    } catch (error) {
        console.error('Erro ao criar gráfico de produtos:', error);
        chartContainer.innerHTML = '<h3>Top 10 Produtos Mais Vendidos</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro ao gerar gráfico: ' + (error.message || 'Erro desconhecido') + '</p>';
    }
}

function generatePaymentChart(sales) {
    console.log('Gerando gráfico de pagamentos, dados:', sales.length);
    
    const chartContainer = document.querySelector('#paymentChart')?.parentElement;
    if (!chartContainer) {
        console.error('Container do gráfico paymentChart não encontrado');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível em generatePaymentChart');
        return;
    }
    
    if (chartInstances.paymentChart) {
        try {
            chartInstances.paymentChart.destroy();
            console.log('Gráfico de pagamentos anterior destruído');
        } catch (e) {
            console.warn('Erro ao destruir gráfico anterior:', e);
        }
        chartInstances.paymentChart = null;
    }
    
    // Get or create canvas
    let ctx = document.getElementById('paymentChart');
    if (!ctx) {
        console.log('Canvas paymentChart não encontrado, criando novo...');
        const heading = chartContainer.querySelector('h3');
        if (heading) {
            const existingCanvas = chartContainer.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            const canvas = document.createElement('canvas');
            canvas.id = 'paymentChart';
            canvas.style.maxHeight = '300px';
            chartContainer.appendChild(canvas);
            ctx = canvas;
        } else {
            chartContainer.innerHTML = '<h3>Formas de Pagamento</h3><canvas id="paymentChart" style="max-height: 300px;"></canvas>';
            ctx = document.getElementById('paymentChart');
        }
    }
    
    if (!ctx) {
        console.error('Não foi possível criar/obter canvas paymentChart');
        return;
    }
    
    console.log('Canvas paymentChart encontrado/criado:', ctx);
    
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
        chartInstances.paymentChart = new Chart(ctx, {
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed || context.raw || 0;
                                return context.label + ': R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
                            }
                        }
                    }
                }
            }
        });
        console.log('✅ Gráfico de pagamentos criado com sucesso');
    } catch (error) {
        console.error('Erro ao criar gráfico de pagamentos:', error);
        chartContainer.innerHTML = '<h3>Formas de Pagamento</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro ao gerar gráfico: ' + (error.message || 'Erro desconhecido') + '</p>';
    }
}

function generateWeekdayChart(sales) {
    console.log('Gerando gráfico de dias da semana, dados:', sales.length);
    
    const chartContainer = document.querySelector('#weekdayChart')?.parentElement;
    if (!chartContainer) {
        console.error('Container do gráfico weekdayChart não encontrado');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível em generateWeekdayChart');
        return;
    }
    
    if (chartInstances.weekdayChart) {
        try {
            chartInstances.weekdayChart.destroy();
            console.log('Gráfico de dias da semana anterior destruído');
        } catch (e) {
            console.warn('Erro ao destruir gráfico anterior:', e);
        }
        chartInstances.weekdayChart = null;
    }
    
    // Get or create canvas
    let ctx = document.getElementById('weekdayChart');
    if (!ctx) {
        console.log('Canvas weekdayChart não encontrado, criando novo...');
        const heading = chartContainer.querySelector('h3');
        if (heading) {
            const existingCanvas = chartContainer.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            const canvas = document.createElement('canvas');
            canvas.id = 'weekdayChart';
            canvas.style.maxHeight = '300px';
            chartContainer.appendChild(canvas);
            ctx = canvas;
        } else {
            chartContainer.innerHTML = '<h3>Vendas por Dia da Semana</h3><canvas id="weekdayChart" style="max-height: 300px;"></canvas>';
            ctx = document.getElementById('weekdayChart');
        }
    }
    
    if (!ctx) {
        console.error('Não foi possível criar/obter canvas weekdayChart');
        return;
    }
    
    console.log('Canvas weekdayChart encontrado/criado:', ctx);
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    
    sales.forEach(sale => {
        if (!sale.date) return;
        const date = new Date(sale.date);
        const weekday = date.getDay();
        weekdayCounts[weekday] += sale.total || 0;
    });
    
    try {
        chartInstances.weekdayChart = new Chart(ctx, {
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
                    },
                    tooltip: {
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
        console.log('✅ Gráfico de dias da semana criado com sucesso');
    } catch (error) {
        console.error('Erro ao criar gráfico de dias da semana:', error);
        chartContainer.innerHTML = '<h3>Vendas por Dia da Semana</h3><p style="text-align: center; padding: 2rem; color: var(--danger);">Erro ao gerar gráfico: ' + (error.message || 'Erro desconhecido') + '</p>';
    }
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
        closePromotions.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof closeModal === 'function') {
                closeModal('promotionsModal');
            } else if (window.closeModal) {
                window.closeModal('promotionsModal');
            } else {
                const modal = document.getElementById('promotionsModal');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });
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

// Make functions available globally immediately after definition
// This ensures they're available as soon as the script loads
(function() {
    'use strict';
    try {
        // Make setChartPeriod available immediately
        if (typeof setChartPeriod === 'function') {
            window.setChartPeriod = setChartPeriod;
            console.log('setChartPeriod disponibilizada no window');
        }
        
        // Make generateCharts available immediately
        if (typeof generateCharts === 'function') {
            window.generateCharts = generateCharts;
            console.log('generateCharts disponibilizada no window');
        }
        
        // Make other functions available
        if (typeof editCoupon === 'function') window.editCoupon = editCoupon;
        if (typeof deleteCoupon === 'function') window.deleteCoupon = deleteCoupon;
        if (typeof editPromotion === 'function') window.editPromotion = editPromotion;
        if (typeof deletePromotion === 'function') window.deletePromotion = deletePromotion;
        
        // Log to verify functions are available
        console.log('Funções disponibilizadas no window:', {
            setChartPeriod: typeof window.setChartPeriod,
            generateCharts: typeof window.generateCharts,
            editCoupon: typeof window.editCoupon,
            deleteCoupon: typeof window.deleteCoupon
        });
    } catch (error) {
        console.error('Erro ao disponibilizar funções no window:', error);
    }
})();