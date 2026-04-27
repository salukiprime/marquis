/**
 * utils.js — Вспомогательные утилиты для приложения Marquis
 */

// Генерация уникального идентификатора
function generateId() {
    // Если доступно, используйте crypto, в противном случае откатитесь к Date.now и случайной строке
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Форматирование даты для вывода
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Карта цветов для свотчей — используется на L'Atelier и Le Garage
const colorSwatchMap = [
    { key: 'Обсидиановый Черный', fallback: 'Obsidian Black',    hex: '#111111', light: false },
    { key: 'Глубокий Сапфировый', fallback: 'Deep Sapphire',     hex: '#0d2b5e', light: false },
    { key: 'Жемчужно-Белый',    fallback: 'Pearl White',        hex: '#f0efe8', light: true  },
    { key: 'Алый Маркиз',  fallback: 'Marquis Scarlet',    hex: '#c0392b', light: false },
    { key: 'Имперский Изумруд',  fallback: 'Imperial Emerald',   hex: '#0b5e3f', light: false },
    { key: 'Вольфрамовый Серебряный',   fallback: 'Tungsten Silver',    hex: '#b0b0b0', light: true  }
];

// Карта изображений моделей — используется в нескольких модулях
const modelPhotoMap = {
    'pavillon':  'images/Marquis%20Pavillon%20.png',
    'belvedere': 'images/Marquis%20Belvédère.png',
    'mistral':   'images/mistral_detail.webp',
    'Pavillon':  'images/Marquis%20Pavillon%20.png',
    'Belvédère': 'images/Marquis%20Belvédère.png',
    'Mistral':   'images/mistral_detail.webp'
};

// Получить данные цвета (hex и признак светлого) по его текстовому имени
function getColorData(colorName) {
    return colorSwatchMap.find(c => c.fallback === colorName) || null;
}
