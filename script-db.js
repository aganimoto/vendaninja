// ===== IndexedDB Functions =====
function initializeStorage() {
    return new Promise((resolve) => {
        // Check storage type preference
        const storageType = localStorage.getItem('vendaninja_storageType') || 'localStorage';
        state.settings.storageType = storageType;

        if (storageType === 'indexedDB' && 'indexedDB' in window) {
            initIndexedDB().then(() => {
                resolve();
            }).catch(() => {
                console.log('IndexedDB não disponível, usando localStorage');
                state.settings.storageType = 'localStorage';
                resolve();
            });
        } else {
            resolve();
        }
    });
}

function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create object stores
            if (!database.objectStoreNames.contains(STORES.products)) {
                database.createObjectStore(STORES.products, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(STORES.sales)) {
                database.createObjectStore(STORES.sales, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(STORES.settings)) {
                database.createObjectStore(STORES.settings, { keyPath: 'key' });
            }
        };
    });
}

async function loadDataFromStorage() {
    if (state.settings.storageType === 'indexedDB' && db) {
        try {
            // Load settings
            const settingsTx = db.transaction([STORES.settings], 'readonly');
            const settingsStore = settingsTx.objectStore(STORES.settings);
            const settingsRequest = settingsStore.getAll();
            
            await new Promise((resolve) => {
                settingsRequest.onsuccess = () => {
                    const settings = settingsRequest.result;
                    if (settings.length > 0) {
                        settings.forEach(setting => {
                            state.settings[setting.key] = setting.value;
                        });
                    }
                    resolve();
                };
            });

            // Load products
            const productsTx = db.transaction([STORES.products], 'readonly');
            const productsStore = productsTx.objectStore(STORES.products);
            const productsRequest = productsStore.getAll();
            
            await new Promise((resolve) => {
                productsRequest.onsuccess = () => {
                    state.products = productsRequest.result || [];
                    resolve();
                };
            });

            // Load sales
            const salesTx = db.transaction([STORES.sales], 'readonly');
            const salesStore = salesTx.objectStore(STORES.sales);
            const salesRequest = salesStore.getAll();
            
            await new Promise((resolve) => {
                salesRequest.onsuccess = () => {
                    state.sales = salesRequest.result || [];
                    resolve();
                };
            });
        } catch (error) {
            console.error('Erro ao carregar do IndexedDB:', error);
            // Fallback to localStorage
            state.settings.storageType = 'localStorage';
            loadDataFromLocalStorage();
        }
    } else {
        loadDataFromLocalStorage();
    }
}

function loadDataFromLocalStorage() {
    try {
        const savedSettings = localStorage.getItem('vendaninja_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            state.settings = { ...state.settings, ...parsed };
        }

        const savedProducts = localStorage.getItem('vendaninja_products');
        if (savedProducts) {
            const products = JSON.parse(savedProducts);
            if (Array.isArray(products)) {
                state.products = products;
            }
        }

        const savedSales = localStorage.getItem('vendaninja_sales');
        if (savedSales) {
            const sales = JSON.parse(savedSales);
            if (Array.isArray(sales)) {
                state.sales = sales;
            }
        }

        const savedCart = localStorage.getItem('vendaninja_cart');
        if (savedCart) {
            const cart = JSON.parse(savedCart);
            if (Array.isArray(cart)) {
                state.cart = cart;
            }
        }

        const savedCashRegister = localStorage.getItem('vendaninja_cashRegister');
        if (savedCashRegister) {
            const cashRegister = JSON.parse(savedCashRegister);
            if (cashRegister) {
                state.cashRegister = { ...state.cashRegister, ...cashRegister };
            }
        }
        
        const savedCoupons = localStorage.getItem('vendaninja_coupons');
        if (savedCoupons) {
            try {
                state.coupons = JSON.parse(savedCoupons) || [];
            } catch (e) {
                console.error('Erro ao parsear coupons:', e);
                state.coupons = [];
            }
        } else {
            state.coupons = [];
        }
        
        const savedPromotions = localStorage.getItem('vendaninja_promotions');
        if (savedPromotions) {
            try {
                state.promotions = JSON.parse(savedPromotions) || [];
            } catch (e) {
                console.error('Erro ao parsear promotions:', e);
                state.promotions = [];
            }
        } else {
            state.promotions = [];
        }
        
        const savedCampaigns = localStorage.getItem('vendaninja_campaigns');
        if (savedCampaigns) {
            try {
                state.campaigns = JSON.parse(savedCampaigns) || [];
            } catch (e) {
                console.error('Erro ao parsear campaigns:', e);
                state.campaigns = [];
            }
        } else {
            state.campaigns = [];
        }
    } catch (error) {
        console.error('Erro ao carregar dados do localStorage:', error);
    }
}

async function saveDataToStorage() {
    if (state.settings.storageType === 'indexedDB' && db) {
        try {
            // Save settings
            const settingsTx = db.transaction([STORES.settings], 'readwrite');
            const settingsStore = settingsTx.objectStore(STORES.settings);
            
            Object.keys(state.settings).forEach(key => {
                if (key !== 'storageType') {
                    settingsStore.put({ key, value: state.settings[key] });
                }
            });

            // Save products
            const productsTx = db.transaction([STORES.products], 'readwrite');
            const productsStore = productsTx.objectStore(STORES.products);
            productsStore.clear();
            state.products.forEach(product => {
                productsStore.add(product);
            });

            // Save sales
            const salesTx = db.transaction([STORES.sales], 'readwrite');
            const salesStore = salesTx.objectStore(STORES.sales);
            salesStore.clear();
            state.sales.forEach(sale => {
                salesStore.add(sale);
            });
        } catch (error) {
            console.error('Erro ao salvar no IndexedDB:', error);
            // Fallback to localStorage
            saveDataToLocalStorage();
        }
    } else {
        saveDataToLocalStorage();
    }

    // Always save cart to localStorage for quick access
    localStorage.setItem('vendaninja_cart', JSON.stringify(state.cart));
}

function saveDataToLocalStorage() {
    localStorage.setItem('vendaninja_products', JSON.stringify(state.products));
    localStorage.setItem('vendaninja_sales', JSON.stringify(state.sales));
    localStorage.setItem('vendaninja_settings', JSON.stringify(state.settings));
    localStorage.setItem('vendaninja_cart', JSON.stringify(state.cart));
    localStorage.setItem('vendaninja_storageType', state.settings.storageType);
    
    const cashRegister = state.cashRegister || {
        isOpen: false,
        openDate: null,
        initialAmount: 0,
        currentSession: null,
        history: []
    };
    localStorage.setItem('vendaninja_cashRegister', JSON.stringify(cashRegister));
    localStorage.setItem('vendaninja_coupons', JSON.stringify(state.coupons || []));
    localStorage.setItem('vendaninja_promotions', JSON.stringify(state.promotions || []));
    localStorage.setItem('vendaninja_campaigns', JSON.stringify(state.campaigns || []));
}

async function migrateToIndexedDB() {
    if (!db) {
        await initIndexedDB();
    }

    // Load from localStorage first
    loadDataFromLocalStorage();

    // Save to IndexedDB
    await saveDataToStorage();

    // Clear localStorage (optional, keep for backup)
    // localStorage.clear();

    state.settings.storageType = 'indexedDB';
    localStorage.setItem('vendaninja_storageType', 'indexedDB');
}

async function migrateToLocalStorage() {
    // Load from IndexedDB first
    if (db) {
        await loadDataFromStorage();
    }

    // Save to localStorage
    saveDataToLocalStorage();

    state.settings.storageType = 'localStorage';
    localStorage.setItem('vendaninja_storageType', 'localStorage');
}

