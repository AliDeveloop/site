const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-sun');
    icon.classList.toggle('fa-moon');
    updateChartTheme();
});

let progress = 0;
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

function updateProgress() {
    if (progress < 100) {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `در حال بارگذاری... ${progress}%`;
        setTimeout(updateProgress, 300);
    } else {
        hideLoading();
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
    setTimeout(() => loading.style.display = 'none', 500);
}

async function fetchUSDTIRTPrice() {
    try {
        const response = await fetch('https://api.nobitex.ir/v3/orderbook/USDTIRT');
        if (!response.ok) throw new Error('Error fetching USDTIRT price');
        const data = await response.json();
        return parseInt(data.lastTradePrice) / 10;
    } catch (error) {
        console.error('Error fetching USDTIRT:', error);
        return null;
    }
}

async function fetchQuickAccessPrices() {
    try {
        const goldCurrencyResponse = await fetch('https://brsapi.ir/FreeTsetmcBourseApi/Api_Free_Gold_Currency_v2.json');
        if (!goldCurrencyResponse.ok) throw new Error('Error fetching gold and currency data');
        const goldCurrencyData = await goldCurrencyResponse.json();
        const usdData = goldCurrencyData.currency.find(item => item.symbol === 'USD');
        const eurData = goldCurrencyData.currency.find(item => item.symbol === 'EUR');
        const usdPrice = usdData?.price || 'N/A';
        const usdChange = usdData?.change_percent || 'N/A';
        const eurPrice = eurData?.price || 'N/A';
        const eurChange = eurData?.change_percent || 'N/A';

        const gold18Data = goldCurrencyData.gold.find(item => item.name.includes('18 عیار') || item.symbol === '18K');
        const gold18Price = gold18Data?.price || 'N/A';
        const gold18Change = gold18Data?.change_percent || 'N/A';

        const bitcoinResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&order=market_cap_desc&per_page=1&page=1');
        if (!bitcoinResponse.ok) throw new Error('Error fetching Bitcoin price');
        const bitcoinData = await bitcoinResponse.json();
        const btcPrice = bitcoinData[0].current_price.toFixed(2) || 'N/A';
        const btcChange = bitcoinData[0].price_change_percentage_24h.toFixed(2) || 'N/A';

        return { usdPrice, usdChange, eurPrice, eurChange, gold18Price, gold18Change, btcPrice, btcChange };
    } catch (error) {
        console.error('Error fetching quick access prices:', error);
        return { usdPrice: 'N/A', usdChange: 'N/A', eurPrice: 'N/A', eurChange: 'N/A', gold18Price: 'N/A', gold18Change: 'N/A', btcPrice: 'N/A', btcChange: 'N/A' };
    }
}

async function fetchGoldCurrencyData() {
    try {
        const response = await fetch('https://brsapi.ir/FreeTsetmcBourseApi/Api_Free_Gold_Currency_v2.json');
        if (!response.ok) throw new Error('Error fetching gold and currency data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching gold and currency data:', error);
        return null;
    }
}

const currencyFlags = {
    USD: "https://cdn-icons-png.flaticon.com/512/330/330459.png",
    EUR: "assets/photo/euro.png",
    AED: "assets/photo/uae.png",
    GBP: "https://cdn-icons-png.flaticon.com/512/330/330425.png",
    TRY: "assets/photo/turkey.png",
    CNY: "assets/photo/china.png",
    JPY: "assets/photo/japan.png",
    CAD: "assets/photo/canada.png",
    AUD: "assets/photo/australia.png",
    CHF: "assets/photo/switzerland.png",
    AFN: "assets/photo/afghanistan.png",
    IQD: "assets/photo/iraq.png",
    RUB: "assets/photo/russia.png",
    THB: "https://cdn-icons-png.flaticon.com/512/330/330447.png",
    AMD: "assets/photo/armenia.png",
    INR: "assets/photo/india.png"
};

async function initCryptoCards() {
    updateProgress();

    const quickAccessContainer = document.getElementById('quickAccessContainer');
    const goldContainer = document.getElementById('goldContainer');
    const currencyContainer = document.getElementById('currencyContainer');
    const cryptoContainer = document.getElementById('cryptoContainer');

    quickAccessContainer.innerHTML = goldContainer.innerHTML = currencyContainer.innerHTML = cryptoContainer.innerHTML = '<p class="text-center">در حال بارگذاری...</p>';

    const { usdPrice, usdChange, eurPrice, eurChange, gold18Price, gold18Change, btcPrice, btcChange } = await fetchQuickAccessPrices();
    const usdtIRTPrice = await fetchUSDTIRTPrice();
    const goldCurrencyData = await fetchGoldCurrencyData();

    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const cryptoData = await response.json();

        quickAccessContainer.innerHTML = `
            <div class="col-md-3 col-12">
                <div class="crypto-card no-pointer" data-symbol="USD">
                    <div class="crypto-content">
                        <div class="currency-icon">
                            <img src="${currencyFlags.USD}" alt="دلار" class="currency-logo">
                        </div>
                        <p class="currency-name mb-0">دلار (USD)</p>
                        <div class="price-section">
                            <p class="price">${usdPrice.toLocaleString('fa-IR')} تومان</p>
                            <p class="price-change ${usdChange >= 0 ? 'change-positive' : 'change-negative'}">
                                ${usdChange}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-12">
                <div class="crypto-card no-pointer" data-symbol="EUR">
                    <div class="crypto-content">
                        <div class="currency-icon">
                            <img src="${currencyFlags.EUR}" alt="یورو" class="currency-logo">
                        </div>
                        <p class="currency-name mb-0">یورو (EUR)</p>
                        <div class="price-section">
                            <p class="price">${eurPrice.toLocaleString('fa-IR')} تومان</p>
                            <p class="price-change ${eurChange >= 0 ? 'change-positive' : 'change-negative'}">
                                ${eurChange}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-12">
                <div class="crypto-card no-pointer" data-symbol="18K">
                    <div class="crypto-content">
                        <div class="currency-icon">
                            <img src="assets/photo/gold-ingots.png" alt="طلای 18 عیار" class="currency-logo">
                        </div>
                        <p class="currency-name mb-0">طلای 18 عیار</p>
                        <div class="price-section">
                            <p class="price">${gold18Price.toLocaleString('fa-IR')} تومان</p>
                            <p class="price-change ${gold18Change >= 0 ? 'change-positive' : 'change-negative'}">
                                ${gold18Change}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-12">
                <div class="crypto-card" data-symbol="BTC">
                    <div class="crypto-content">
                        <div class="currency-icon">
                            <img src="assets/photo/bitcoin.png" alt="بیت‌کوین" class="currency-logo">
                        </div>
                        <p class="currency-name mb-0">بیت‌کوین (BTC)</p>
                        <div class="price-section">
                            <p class="price">${btcPrice} $</p>
                            <p class="price-change ${btcChange >= 0 ? 'change-positive' : 'change-negative'}">
                                ${btcChange}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>`;

        goldContainer.innerHTML = '';
        if (goldCurrencyData) {
            goldCurrencyData.gold.forEach(item => {
                const card = `
                    <div class="col-md-3 col-12">
                        <div class="crypto-card no-pointer" data-symbol="${item.symbol}" data-name="${item.name}">
                            <div class="crypto-content">
                                <div class="currency-icon">
                                    <img src="assets/photo/gold-ingots.png" alt="${item.name}" class="currency-logo">
                                </div>
                                <p class="currency-name mb-0">${item.name} (${item.symbol})</p>
                                <div class="price-section">
                                    <p class="price">${item.price.toLocaleString('fa-IR')} ${item.unit}</p>
                                    <p class="price-change ${item.change_percent >= 0 ? 'change-positive' : 'change-negative'}">
                                        ${item.change_percent}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                goldContainer.innerHTML += card;
            });
        }

        currencyContainer.innerHTML = '';
        if (goldCurrencyData) {
            goldCurrencyData.currency.forEach(item => {
                const flagUrl = currencyFlags[item.symbol] || "https://cdn-icons-png.flaticon.com/512/330/330425.png";
                const card = `
                    <div class="col-md-3 col-12">
                        <div class="crypto-card no-pointer" data-symbol="${item.symbol}" data-name="${item.name}">
                            <div class="crypto-content">
                                <div class="currency-icon">
                                    <img src="${flagUrl}" alt="${item.name}" class="currency-logo">
                                </div>
                                <p class="currency-name mb-0">${item.name} (${item.symbol})</p>
                                <div class="price-section">
                                    <p class="price">${item.price.toLocaleString('fa-IR')} ${item.unit}</p>
                                    <p class="price-change ${item.change_percent >= 0 ? 'change-positive' : 'change-negative'}">
                                        ${item.change_percent}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                currencyContainer.innerHTML += card;
            });
        }

        cryptoContainer.innerHTML = '';
        cryptoData.forEach(crypto => {
            const symbol = crypto.symbol.toUpperCase();
            const priceUSD = parseFloat(crypto.current_price).toFixed(2);
            const priceIRT = usdtIRTPrice ? (crypto.current_price * usdtIRTPrice).toLocaleString('fa-IR') : 'نامشخص';
            const card = `
                <div class="col-md-3 col-12">
                    <div class="crypto-card" data-symbol="${symbol}" data-name="${crypto.name}">
                        <div class="crypto-content">
                            <div class="currency-icon">
                                <img src="${crypto.image}" alt="${crypto.name}" class="currency-logo">
                            </div>
                            <p class="currency-name mb-0">${crypto.name} (${symbol})</p>
                            <div class="price-section">
                                <p class="price usd-price">${priceUSD} $</p>
                                ${usdtIRTPrice ? `<p class="price irt-price">${priceIRT} تومان</p>` : ''}
                                <p class="price-change ${crypto.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative'}">
                                    ${parseFloat(crypto.price_change_percentage_24h).toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>`;
            cryptoContainer.innerHTML += card;
        });

        document.querySelectorAll('.crypto-card').forEach(card => {
            if (!card.classList.contains('no-pointer')) {
                card.addEventListener('click', () => {
                    const symbol = card.getAttribute('data-symbol');
                    const name = card.getAttribute('data-name');
                    document.getElementById('chartModalLabel').textContent = `${name} (${symbol})`;
                    showChart(symbol);
                    const modal = new bootstrap.Modal(document.getElementById('chartModal'));
                    modal.show();
                });
            }
        });

    } catch (error) {
        quickAccessContainer.innerHTML = goldContainer.innerHTML = currencyContainer.innerHTML = cryptoContainer.innerHTML = `<p class="text-danger text-center">خطا: ${error.message}</p>`;
        console.error('Error:', error);
    }
}

async function updatePrices() {
    const usdtIRTPrice = await fetchUSDTIRTPrice();
    const goldCurrencyData = await fetchGoldCurrencyData();
    const quickAccessPrices = await fetchQuickAccessPrices();

    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const cryptoData = await response.json();

        const quickAccessCards = document.querySelectorAll('#quickAccessContainer .crypto-card');
        quickAccessCards.forEach((card, index) => {
            switch (index) {
                case 0:
                    card.querySelector('.price').textContent = `${quickAccessPrices.usdPrice.toLocaleString('fa-IR')} تومان`;
                    card.querySelector('.price-change').textContent = `${quickAccessPrices.usdChange}%`;
                    card.querySelector('.price-change').className = `price-change ${quickAccessPrices.usdChange >= 0 ? 'change-positive' : 'change-negative'}`;
                    break;
                case 1:
                    card.querySelector('.price').textContent = `${quickAccessPrices.eurPrice.toLocaleString('fa-IR')} تومان`;
                    card.querySelector('.price-change').textContent = `${quickAccessPrices.eurChange}%`;
                    card.querySelector('.price-change').className = `price-change ${quickAccessPrices.eurChange >= 0 ? 'change-positive' : 'change-negative'}`;
                    break;
                case 2:
                    card.querySelector('.price').textContent = `${quickAccessPrices.gold18Price.toLocaleString('fa-IR')} تومان`;
                    card.querySelector('.price-change').textContent = `${quickAccessPrices.gold18Change}%`;
                    card.querySelector('.price-change').className = `price-change ${quickAccessPrices.gold18Change >= 0 ? 'change-positive' : 'change-negative'}`;
                    break;
                case 3:
                    card.querySelector('.price').textContent = `${quickAccessPrices.btcPrice} $`;
                    card.querySelector('.price-change').textContent = `${quickAccessPrices.btcChange}%`;
                    card.querySelector('.price-change').className = `price-change ${quickAccessPrices.btcChange >= 0 ? 'change-positive' : 'change-negative'}`;
                    break;
            }
        });

        if (goldCurrencyData) {
            goldCurrencyData.gold.forEach(item => {
                const card = document.querySelector(`.crypto-card[data-symbol="${item.symbol}"]`);
                if (card) {
                    card.querySelector('.price').textContent = `${item.price.toLocaleString('fa-IR')} ${item.unit}`;
                    card.querySelector('.price-change').textContent = `${item.change_percent}%`;
                    card.querySelector('.price-change').className = `price-change ${item.change_percent >= 0 ? 'change-positive' : 'change-negative'}`;
                }
            });
            goldCurrencyData.currency.forEach(item => {
                const card = document.querySelector(`.crypto-card[data-symbol="${item.symbol}"]`);
                if (card) {
                    card.querySelector('.price').textContent = `${item.price.toLocaleString('fa-IR')} ${item.unit}`;
                    card.querySelector('.price-change').textContent = `${item.change_percent}%`;
                    card.querySelector('.price-change').className = `price-change ${item.change_percent >= 0 ? 'change-positive' : 'change-negative'}`;
                }
            });
        }

        cryptoData.forEach(crypto => {
            const symbol = crypto.symbol.toUpperCase();
            const card = document.querySelector(`.crypto-card[data-symbol="${symbol}"]`);
            if (card) {
                const usdPriceEl = card.querySelector('.usd-price');
                const irtPriceEl = card.querySelector('.irt-price');
                const changeEl = card.querySelector('.price-change');

                usdPriceEl.textContent = `${parseFloat(crypto.current_price).toFixed(2)} $`;
                if (irtPriceEl) irtPriceEl.textContent = `${(crypto.current_price * usdtIRTPrice).toLocaleString('fa-IR')} تومان`;
                changeEl.textContent = `${parseFloat(crypto.price_change_percentage_24h).toFixed(2)}%`;
                changeEl.className = `price-change ${crypto.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative'}`;
            }
        });
    } catch (error) {
        console.error('Error updating prices:', error);
    }
    setTimeout(updatePrices, 60000);
}

function showChart(symbol) {
    const chartContainer = document.getElementById('tradingview_chart');
    chartContainer.innerHTML = '';
    new TradingView.widget({
        "width": "100%",
        "height": "100%",
        "symbol": `COINEX:${symbol}USDT`, // استفاده از پیشوند COINEX برای مرجع
        "interval": "1H",
        "timezone": "Etc/UTC",
        "theme": document.body.classList.contains('dark-mode') ? "dark" : "light",
        "style": "1",
        "locale": "fa",
        "toolbar_bg": document.body.classList.contains('dark-mode') ? "#1a1a1a" : "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": false,
        "container_id": "tradingview_chart"
    });
}

function updateChartTheme() {
    const activeCard = document.querySelector('.crypto-card.active');
    if (activeCard) {
        const symbol = activeCard.getAttribute('data-symbol');
        showChart(symbol);
    }
}

initCryptoCards();