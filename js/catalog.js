/**
 * catalog.js - Логика для страницы La Collection (Статистика + Обзор моделей)
 * Секции: виджеты статистики, диаграмма распределения моделей, каталог моделей
 */

// SVG иконки для карточек статистики (вместо эмодзи)
const statIcons = {
    vehicles: '<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    value: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    engine: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    color: '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'
};

// Карта изображений моделей для обзора
const modelImages = {
    'Pavillon': 'images/Marquis%20Pavillon%20.png',
    'Belvédère': 'images/Marquis%20Belvédère.png',
    'Mistral': 'images/mistral_detail.webp'
};

// Стили цветов полос (чередующиеся для диаграммы)
const barStyles = ['bar-dark', 'bar-scarlet', 'bar-creme'];

// Базовые оценочные цены для расчета стоимости
const basePrices = {
    'Pavillon': 112000,
    'Belvédère': 125000,
    'Mistral': 165000
};

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('stats-grid');
    const distSection = document.getElementById('distribution-section');
    const browseSection = document.getElementById('models-browse-section');
    if (!grid) return;

    // Получаем текущую коллекцию
    let collection = [];
    try {
        if (typeof getCollection === 'function') {
            collection = getCollection();
        } else {
            const raw = localStorage.getItem('marquis_collection');
            collection = raw ? JSON.parse(raw) : [];
        }
    } catch (e) {
        console.error("Ошибка при получении коллекции", e);
    }

    // Показываем пустое состояние если гараж пуст
    if (!collection || collection.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <h2 style="margin-bottom: 1rem;">${'Ваш гараж сейчас пуст. Начните конфигурацию в L\'Atelier!'}</h2>
                <a href="details.html" class="btn btn-primary btn-black">L'Atelier →</a>
            </div>
        `;
        renderCollectionHighlights(browseSection, collection);
        return;
    }

    // === Сбор аналитических данных ===
    const totalVehicles = collection.length;
    let totalValue = 0;
    const engineCounts = {};
    const colorCounts = {};
    const modelCounts = {};

    collection.forEach(car => {
        // Стоимость
        let price = basePrices[car.model] || 100000;
        if (car.year > 2026) price += 5000;
        totalValue += price;

        // Двигатели
        if (car.engine) {
            engineCounts[car.engine] = (engineCounts[car.engine] || 0) + 1;
        }
        // Цвета (переводим имя для отображения)
        if (car.color) {
            colorCounts[car.color] = (colorCounts[car.color] || 0) + 1;
        }
        // Модели
        if (car.model) {
            modelCounts[car.model] = (modelCounts[car.model] || 0) + 1;
        }
    });

    // Функция для поиска самого популярного элемента
    function getMostPopular(countsObj) {
        let maxCount = 0;
        let popularItem = null;
        for (const item in countsObj) {
            if (countsObj[item] > maxCount) {
                maxCount = countsObj[item];
                popularItem = item;
            }
        }
        return popularItem;
    }

    const favEngine = getMostPopular(engineCounts);
    const favColor = getMostPopular(colorCounts);

    // Попытка перевести имя цвета через ключ lang.js
    function translateColor(colorName) {
        // Ищем по fallback-имени в colorSwatchMap если доступен, иначе пробуем t()
        const colorKeyMap = {
            'Obsidian Black': 'Обсидиановый Черный',
            'Deep Sapphire': 'Глубокий Сапфировый',
            'Pearl White': 'Жемчужно-Белый',
            'Marquis Scarlet': 'Алый Маркиз',
            'Imperial Emerald': 'Имперский Изумруд',
            'Tungsten Silver': 'Вольфрамовый Серебряный'
        };
        const key = colorKeyMap[colorName];
        if (key) {
            const translated = key;
            return translated !== key ? translated : colorName;
        }
        return colorName;
    }

    // Форматирование валюты
    function formatCurrency(val) {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', currency: 'USD', maximumFractionDigits: 0 
        }).format(val);
    }

    // === 1. Рендер карточек статистики ===
    const statsData = [
        { 
            titleKey: 'Всего Автомобилей', 
            value: totalVehicles, 
            icon: statIcons.vehicles 
        },
        { 
            titleKey: 'Оценочная Стоимость', 
            value: formatCurrency(totalValue), 
            icon: statIcons.value 
        },
        { 
            titleKey: 'Предпочитаемый Двигатель', 
            value: favEngine ? favEngine : 'Нет данных', 
            icon: statIcons.engine 
        },
        { 
            titleKey: 'Любимый Цвет Кузова', 
            value: favColor ? translateColor(favColor) : 'Нет данных', 
            icon: statIcons.color 
        }
    ];

    grid.innerHTML = '';
    statsData.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-label">${stat.titleKey}</div>
            <div class="stat-value">${stat.value}</div>
        `;
        grid.appendChild(card);
    });

    // === 2. Рендер диаграммы распределения моделей ===
    if (distSection) {
        renderDistribution(distSection, modelCounts, totalVehicles);
    }

    // === 3. Рендер обзора моделей (каталог) ===
    if (browseSection) {
        renderCollectionHighlights(browseSection, collection);
    }
});

/**
 * Отрисовка горизонтальной диаграммы распределения моделей
 */
function renderDistribution(container, modelCounts, total) {
    const models = Object.keys(modelCounts);
    if (models.length === 0) return;

    const barsHtml = models.map((model, i) => {
        const count = modelCounts[model];
        const pct = Math.round((count / total) * 100);
        const barClass = barStyles[i % barStyles.length];
        return `
            <div class="dist-bar-row">
                <div class="dist-bar-label">${model}</div>
                <div class="dist-bar-track">
                    <div class="dist-bar-fill ${barClass}" style="width: 0%;" data-width="${pct}%">
                        <span>${pct}%</span>
                    </div>
                </div>
                <div class="dist-bar-count">${count}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="distribution-section">
            <h3>${'Распределение Моделей'}</h3>
            ${barsHtml}
        </div>
    `;

    // Анимированное заполнение полос (запускаем после вставки в DOM)
    requestAnimationFrame(() => {
        const fills = container.querySelectorAll('.dist-bar-fill');
        fills.forEach(fill => {
            const targetWidth = fill.getAttribute('data-width');
            fill.style.width = targetWidth;
        });
    });
}

/**
 * Отрисовка секции выдающихся автомобилей коллекции
 */
function renderCollectionHighlights(container, collection) {
    if (!container) return;

    if (!collection || collection.length === 0) {
        container.innerHTML = `
            <div class="models-browse-section">
                <h3>Наследие Marquis</h3>
                <div class="catalog-card" style="width: 100%; text-align: center; padding: 4rem;">
                    <h2>Искусство Превосходства</h2>
                    <p style="margin: 1rem 0 2rem;">Откройте для себя непревзойденный мир роскоши и инноваций. Создайте свой первый шедевр в L'Atelier.</p>
                    <a href="details.html" class="btn btn-primary btn-black">Перейти в L'Atelier</a>
                </div>
            </div>
        `;
        return;
    }

    let topCar = collection[0];
    let maxPrice = 0;
    collection.forEach(car => {
        let price = basePrices[car.model] || 100000;
        if (car.year > 2026) price += 5000;
        if (price > maxPrice) {
            maxPrice = price;
            topCar = car;
        }
    });

    const isCustom = topCar.isCustom === true;
    const displayName = isCustom ? topCar.model : `Marquis ${topCar.model}`;
    const photoMap = {
        'pavillon': 'images/Marquis%20Pavillon%20.png',
        'belvedere': 'images/Marquis%20Belvédère.png',
        'mistral': 'images/mistral_detail.webp',
        'Pavillon': 'images/Marquis%20Pavillon%20.png',
        'Belvédère': 'images/Marquis%20Belvédère.png',
        'Mistral': 'images/mistral_detail.webp'
    };
    const photoUrl = photoMap[topCar.photo] || photoMap[topCar.model] || photoMap['Pavillon'];

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { 
        style: 'currency', currency: 'USD', maximumFractionDigits: 0 
    }).format(val);

    container.innerHTML = `
        <div class="models-browse-section">
            <h3>Жемчужина Вашей Коллекции</h3>
            <div class="catalog-card" style="width: 100%; display: flex; flex-direction: row; align-items: center; justify-content: space-between; overflow: hidden; max-height: 400px;">
                <div class="catalog-img-placeholder has-image" style="background-image: url('${photoUrl}'); flex: 1; height: 400px; min-height: 100%; background-size: cover; background-position: center;">
                </div>
                <div class="catalog-card-body" style="flex: 1; padding: 3rem;">
                    <h3 style="font-size: 2rem; margin-bottom: 0.5rem;">${displayName}</h3>
                    <p style="color: var(--color-scarlet); font-weight: 600; text-transform: uppercase; margin-bottom: 1.5rem;">${topCar.year} | ${topCar.engine}</p>
                    <p style="margin-bottom: 2rem; line-height: 1.6;">Этот эксклюзивный экземпляр является самым ценным активом в вашем портфолио Le Garage с оценочной стоимостью <strong>${formatCurrency(maxPrice)}</strong>.</p>
                    <a href="index.html" class="btn btn-primary btn-black">В Le Garage</a>
                </div>
            </div>
        </div>
    `;
}
