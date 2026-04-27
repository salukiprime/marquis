/**
 * details.js - Логика для страницы L'Atelier
 * Включает: выбор модели, цветовые свотчи, анимации спецификаций,
 * прокрутку к конфигурации и превью конфигурации
 */

// Карта изображений моделей для героя и лэндинга
const modelImages = {
    'pavillon': 'images/Marquis%20Pavillon%20.png',
    'belvedere': 'images/Marquis%20Belv%C3%A9d%C3%A8re.png',
    'mistral': 'images/mistral_detail.webp'
};

// colorSwatchMap объявлен глобально в utils.js — не дублируем здесь

const modelData = {
    'pavillon': {
        name: 'Pavillon',
        taglineKey: 'Искусство движения',
        imageBg: 'var(--color-black)',
        descriptionKey: 'Воплощение современной роскоши. Флагманский седан, переопределяющий комфорт. Каждая деталь создана для вашего удобства и превосходства на дороге.',
        generalDescKey: 'atelier_general_desc',
        specs: {
            'Electric/EV': {
                '2026': [
                    { labelKey: 'Запас хода', value: '680 km' },
                    { labelKey: '0-100 км/ч', value: '4.2s' },
                    { labelKey: 'Начальная цена', value: '$112,000' }
                ],
                '2027': [
                    { labelKey: 'Запас хода', value: '710 km' },
                    { labelKey: '0-100 км/ч', value: '4.1s' },
                    { labelKey: 'Начальная цена', value: '$115,500' }
                ]
            }
        },
        engines: [
            { value: 'Electric/EV', labelKey: 'Электродвигатель / EV' }
        ]
    },
    'belvedere': {
        name: 'Belvédère',
        taglineKey: 'Внедорожник для смелых',
        imageBg: '#111',
        descriptionKey: 'Внушительный вид и электрический интеллект. Внедорожник для смелых приключений, где роскошь встречается с инновациями.',
        generalDescKey: 'atelier_general_desc',
        specs: {
            'Electric/EV': {
                '2026': [
                    { labelKey: 'Запас хода', value: '620 km' },
                    { labelKey: '0-100 км/ч', value: '4.5s' },
                    { labelKey: 'Начальная цена', value: '$125,000' }
                ],
                '2027': [
                    { labelKey: 'Запас хода', value: '645 km' },
                    { labelKey: '0-100 км/ч', value: '4.3s' },
                    { labelKey: 'Начальная цена', value: '$128,500' }
                ]
            }
        },
        engines: [
            { value: 'Electric/EV', labelKey: 'Электродвигатель / EV' }
        ]
    },
    'mistral': {
        name: 'Mistral',
        taglineKey: 'Возрождение спортивного купе',
        imageBg: '#222',
        descriptionKey: 'Захватывающая динамика и поразительная аэродинамика. Возрождение спортивного купе в лучшем его проявлении.',
        generalDescKey: 'atelier_general_desc',
        specs: {
            'Electric/EV': {
                '2026': [
                    { labelKey: 'Запас хода', value: '520 km' },
                    { labelKey: '0-100 км/ч', value: '3.6s' },
                    { labelKey: 'Начальная цена', value: '$180,000' }
                ],
                '2027': [
                    { labelKey: 'Запас хода', value: '545 km' },
                    { labelKey: '0-100 км/ч', value: '3.4s' },
                    { labelKey: 'Начальная цена', value: '$188,000' }
                ]
            }
        },
        engines: [
            { value: 'Electric/EV', labelKey: 'Электродвигатель / EV' }
        ]
    }
};

// Merge overrides for built-in models
const builtinOverrides = typeof getModelOverrides === 'function' ? getModelOverrides() : {};
for (const key in builtinOverrides) {
    if (modelData[key]) {
        const ov = builtinOverrides[key];
        if (ov.name) modelData[key].name = ov.name;
        if (ov.tagline) modelData[key].taglineKey = ov.tagline;
        if (ov.description) modelData[key].descriptionKey = ov.description;
        
        if (ov.engine) {
            modelData[key].engines = [{ value: ov.engine, labelKey: ov.engine }];
            modelData[key].specs = {};
            modelData[key].specs[ov.engine] = {};
            if (ov.years && ov.years.length > 0) {
                ov.years.forEach(y => {
                    modelData[key].specs[ov.engine][y] = [
                        { labelKey: 'Запас хода', value: ov.specs.range || 'N/A' },
                        { labelKey: '0-100 км/ч', value: ov.specs.acceleration || 'N/A' },
                        { labelKey: 'Начальная цена', value: ov.specs.price || 'N/A' }
                    ];
                });
            }
        }
        
        if (ov.uploadedPhoto) {
            modelData[key].uploadedPhoto = ov.uploadedPhoto;
        } else if (ov.photo) {
            modelData[key].photoOverride = ov.photo;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('model-content');
    const formSection = document.getElementById('atelier-form-section');
    if (!contentDiv || !formSection) return;

    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const modelId  = urlParams.get('model');
    const customId = urlParams.get('custom'); // пользовательская модель

    // --- Маршрут: пользовательская модель ---
    if (customId) {
        showCustomModelPage(customId);
        return;
    }

    const data = modelData[modelId];

    // Если модель не выбрана — показываем лэндинг L'Atelier с выбором модели
    if (!data) {
        showAtelierLanding(contentDiv);
        return;
    }

    // Выбранный цвет (состояние)
    let selectedColor = colorSwatchMap[0].fallback;

    // Отрисовываем подробный контент с фоновым изображением героя
    const heroImageUrl = data.uploadedPhoto || (data.photoOverride ? modelImages[data.photoOverride] : (modelImages[modelId] || ''));
    contentDiv.innerHTML = `
        <div class="details-hero details-hero-override" style="background: ${data.imageBg};">
            <div class="details-hero-bg" style="background-image: url('${heroImageUrl}');"></div>
            <h1 class="details-title">Marquis ${data.name}</h1>
            <p class="details-tagline">${data.taglineKey}</p>
            <button class="scroll-to-config-btn" id="scroll-to-config">
                ${'Сконфигурировать'} <span class="arrow-down">↓</span>
            </button>
        </div>

        <div class="container">
            <div class="details-content" style="display: block; margin-bottom: 4rem;">
                <div class="details-text" style="max-width: 800px; margin: 0 auto 3rem auto; text-align: center;">
                    <h3 style="font-size: 2.5rem; margin-bottom: 1.5rem;">${'Опыт L\'Atelier'}</h3>
                    <p style="font-size: 1.25rem; line-height: 1.8; color: #444; margin-bottom: 2rem;">
                        ${data.descriptionKey}
                    </p>
                    <p style="font-size: 1.125rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-scarlet);">${'Сконфигурируйте этот эксклюзивный шедевр ниже и добавьте его в ваше портфолио Le Garage.'}</p>
                </div>
                ${modelId === 'belvedere' ? `
                <div class="details-gallery" style="border-radius: var(--radius-sm); overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15);">
                    <div style="background-image: url('images/Marquis%20Belvédère.png'); background-size: cover; background-position: center; min-height: 500px; width: 100%;"></div>
                </div>
                ` : modelId === 'pavillon' ? `
                <div class="details-gallery" style="border-radius: var(--radius-sm); overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15);">
                    <div style="background-image: url('images/Marquis%20Pavillon%20.png'); background-size: cover; background-position: center; min-height: 500px; width: 100%;"></div>
                </div>
                ` : `
                <div class="details-gallery" style="border-radius: var(--radius-sm); overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15);">
                    <div style="background-image: url('images/mistral_detail.webp'); background-size: cover; background-position: center; min-height: 500px; width: 100%;"></div>
                </div>
                `}
            </div>
        </div>
    `;

    // Прокрутка к конфигурации
    document.getElementById('scroll-to-config').addEventListener('click', () => {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Настройка Формы (L'Atelier)
    formSection.style.display = 'block';
    
    // Устанавливаем скрытое поле модели
    document.getElementById('model').value = data.name;

    // Заполняем варианты двигателей
    const engineSelect = document.getElementById('engine');
    data.engines.forEach(engine => {
        const option = document.createElement('option');
        option.value = engine.value;
        option.textContent = engine.labelKey;
        engineSelect.appendChild(option);
    });

    // Заполняем визуальные цветовые свотчи
    initColorSwatches(selectedColor);

    // Функция обновления характеристик (динамическая замена с анимацией)
    function updateSpecs() {
        const selectedYear = document.getElementById('year').value;
        const selectedEngine = engineSelect.value;
        const specsContainer = document.getElementById('dynamic-specs-container');
        
        if (!selectedEngine || !selectedYear) {
            specsContainer.innerHTML = '';
            updateConfigSummary();
            return;
        }
        
        // Ensure data exists for combination
        if(data.specs[selectedEngine] && data.specs[selectedEngine][selectedYear]){
            const specsHtml = data.specs[selectedEngine][selectedYear].map(spec => `
                <div class="spec-item">
                    <span class="spec-label">${spec.labelKey}</span>
                    <span>${spec.value}</span>
                </div>
            `).join('');

            specsContainer.innerHTML = `
                <div class="details-specs" style="background-color: var(--color-black); color: var(--color-white); padding: 3rem; border-radius: var(--radius-sm); height: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                    <h4 class="details-specs-header" style="color: var(--color-scarlet); font-size: 1.5rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2rem;">${'Ключевые Характеристики'}</h4>
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        ${specsHtml}
                    </div>
                </div>
            `;
        } else {
             specsContainer.innerHTML = '';
        }

        updateConfigSummary();
    }

    // Привязываем слушатели для динамического обновления
    document.getElementById('year').addEventListener('change', updateSpecs);
    engineSelect.addEventListener('change', updateSpecs);

    // Первоначальная отрисовка — выбираем первый двигатель по умолчанию
    engineSelect.value = data.engines[0].value;
    updateSpecs();

    // Функция обновления превью конфигурации
    function updateConfigSummary() {
        const summaryGrid = document.getElementById('config-summary-grid');
        const modelName = document.getElementById('model').value;
        const year = document.getElementById('year').value;
        const engine = engineSelect.value;
        const currentColor = selectedColor;

        // Найти hex цвета для мини-свотча
        const colorData = colorSwatchMap.find(c => c.fallback === currentColor) || colorSwatchMap[0];
        const colorLabel = colorData.key || colorData.fallback;

        summaryGrid.innerHTML = `
            <div class="config-summary-item">
                <span class="label">${'Модель'}</span>
                <span class="value">Marquis ${modelName}</span>
            </div>
            <div class="config-summary-item">
                <span class="label">${'Год'}</span>
                <span class="value">${year}</span>
            </div>
            <div class="config-summary-item">
                <span class="label">${'Двигатель'}</span>
                <span class="value">${engine ? engine : '—'}</span>
            </div>
            <div class="config-summary-item">
                <span class="label">${'Цвет'}</span>
                <div class="color-preview-row">
                    <span class="mini-swatch" style="background-color: ${colorData.hex};"></span>
                    <span class="value">${colorLabel}</span>
                </div>
            </div>
        `;
    }

    // Инициализация цветовых свотчей
    function initColorSwatches(defaultColor) {
        const container = document.getElementById('color-swatches');
        const nameLabel = document.getElementById('color-name-label');
        const hiddenInput = document.getElementById('color');

        colorSwatchMap.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (color.light ? ' light-color' : '');
            swatch.style.backgroundColor = color.hex;
            swatch.title = color.key || color.fallback;

            // Помечаем первый как выбранный
            if (color.fallback === defaultColor) {
                swatch.classList.add('selected');
                nameLabel.textContent = swatch.title;
                hiddenInput.value = color.fallback;
            }

            swatch.addEventListener('click', () => {
                // Снимаем выделение со всех
                container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                selectedColor = color.fallback;
                nameLabel.textContent = swatch.title;
                hiddenInput.value = color.fallback;
                updateConfigSummary();
            });

            container.appendChild(swatch);
        });
    }

    // Валидация отправки формы
    const form = document.getElementById('vehicle-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const modelName = document.getElementById('model').value;
        const year = document.getElementById('year').value;
        const engine = document.getElementById('engine').value;
        const color = document.getElementById('color').value;

        // Ручная валидация JS, соответствующая правилам задания
        if (!year || !engine) {
            alert('Пожалуйста, заполните все обязательные поля (Год и Двигатель) перед добавлением в Le Garage.');
            return;
        }

        // Сохранить в LocalStorage
        const vehicleData = {
            model: modelName,
            year: parseInt(year),
            engine: engine,
            color: color,
            photo: data.uploadedPhoto || data.photoOverride || null
        };

        addVehicle(vehicleData);

        // Переадресация в Le Garage (index.html)
        alert(`Marquis ${modelName} ${'успешно сконфигурирован и припаркован в Le Garage!'}`);
        window.location.href = 'index.html';
    });

    // -------------------------------------------------------
    // showCustomModelPage — конфигуратор для пользовательской модели
    // Вызывается при ?custom=<id>. Имеет доступ к contentDiv и formSection.
    // -------------------------------------------------------
    function showCustomModelPage(id) {
        const customModels = getCustomModels();
        const model = customModels.find(m => m.id === id);
        if (!model) { window.location.href = 'details.html'; return; }

        const heroImg = model.uploadedPhoto || (model.photo ? (modelImages[model.photo] || '') : '');
        let selectedColor = colorSwatchMap[0].fallback;

        contentDiv.innerHTML = `
            <div class="details-hero details-hero-override" style="background:var(--color-black);">
                <div class="details-hero-bg" style="background-image:url('${heroImg}');"></div>
                <h1 class="details-title">Marquis ${model.name}</h1>
                <p class="details-tagline">${model.tagline}</p>
                <button class="scroll-to-config-btn" id="scroll-to-config">
                    Сконфигурировать <span class="arrow-down">↓</span>
                </button>
            </div>
            <div class="container">
                <div class="details-content" style="display:block;margin-bottom:4rem;">
                    <div class="details-text" style="max-width:800px;margin:0 auto 3rem;text-align:center;">
                        <h3 style="font-size:2.5rem;margin-bottom:1.5rem;">Опыт L'Atelier</h3>
                        <p style="font-size:1.25rem;line-height:1.8;color:#444;margin-bottom:2rem;">${model.description}</p>
                        <p style="font-size:1.125rem;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-scarlet);">
                            Сконфигурируйте этот шедевр ниже и добавьте в Le Garage.
                        </p>
                    </div>
                    <div style="border-radius:var(--radius-sm);overflow:hidden;box-shadow:0 15px 40px rgba(0,0,0,0.15);min-height:400px;background:var(--color-black);display:flex;align-items:center;justify-content:center;">
                        ${heroImg
                            ? `<div style="background-image:url('${heroImg}');background-size:cover;background-position:center;width:100%;min-height:400px;"></div>`
                            : `<span style="color:var(--color-creme);font-size:2rem;letter-spacing:0.15em;text-transform:uppercase;font-weight:300;">MARQUIS ${model.name.toUpperCase()}</span>`
                        }
                    </div>
                </div>
            </div>
        `;

        document.getElementById('scroll-to-config').addEventListener('click', () => {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        // Показываем форму конфигуратора
        formSection.style.display = 'block';
        document.getElementById('model').value = model.name;

        // Populate years dynamically
        const yearSelect = document.getElementById('year');
        yearSelect.innerHTML = '';
        if (model.years && model.years.length > 0) {
            model.years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                yearSelect.appendChild(opt);
            });
        } else if (model.year) {
            const opt = document.createElement('option');
            opt.value = model.year;
            opt.textContent = model.year;
            yearSelect.appendChild(opt);
        } else {
            yearSelect.innerHTML = '<option value="2026">2026</option><option value="2027">2027</option>';
        }

        // Двигатель: только один вариант для пользовательской модели
        const engineSelect = document.getElementById('engine');
        engineSelect.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = model.engine;
        opt.textContent = model.engine;
        engineSelect.appendChild(opt);
        engineSelect.value = model.engine;

        // Статичные характеристики из определения модели
        function renderCustomSpecs() {
            document.getElementById('dynamic-specs-container').innerHTML = `
                <div class="details-specs" style="background-color:var(--color-black);color:var(--color-white);padding:3rem;border-radius:var(--radius-sm);height:100%;box-shadow:0 20px 40px rgba(0,0,0,0.2);">
                    <h4 class="details-specs-header" style="color:var(--color-scarlet);font-size:1.5rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2rem;">Ключевые Характеристики</h4>
                    <div style="display:flex;flex-direction:column;gap:1.5rem;">
                        <div class="spec-item"><span class="spec-label">Запас хода</span><span>${model.specs.range}</span></div>
                        <div class="spec-item"><span class="spec-label">0–100 км/ч</span><span>${model.specs.acceleration}</span></div>
                        <div class="spec-item"><span class="spec-label">Начальная цена</span><span>${model.specs.price}</span></div>
                    </div>
                </div>
            `;
        }
        renderCustomSpecs();

        // Цветовые свотчи
        const swatchContainer  = document.getElementById('color-swatches');
        const colorNameLabel   = document.getElementById('color-name-label');
        const colorHiddenInput = document.getElementById('color');

        colorSwatchMap.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (color.light ? ' light-color' : '');
            swatch.style.backgroundColor = color.hex;
            swatch.title = color.key || color.fallback;
            if (color.fallback === selectedColor) {
                swatch.classList.add('selected');
                colorNameLabel.textContent = swatch.title;
                colorHiddenInput.value = color.fallback;
            }
            swatch.addEventListener('click', () => {
                swatchContainer.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                selectedColor = color.fallback;
                colorNameLabel.textContent = swatch.title;
                colorHiddenInput.value = color.fallback;
                updateSummary();
            });
            swatchContainer.appendChild(swatch);
        });

        // Обновление превью конфигурации
        function updateSummary() {
            const cd = colorSwatchMap.find(c => c.fallback === selectedColor) || colorSwatchMap[0];
            document.getElementById('config-summary-grid').innerHTML = `
                <div class="config-summary-item"><span class="label">Модель</span><span class="value">Marquis ${model.name}</span></div>
                <div class="config-summary-item"><span class="label">Год</span><span class="value">${document.getElementById('year').value}</span></div>
                <div class="config-summary-item"><span class="label">Двигатель</span><span class="value">${model.engine}</span></div>
                <div class="config-summary-item">
                    <span class="label">Цвет</span>
                    <div class="color-preview-row">
                        <span class="mini-swatch" style="background-color:${cd.hex};"></span>
                        <span class="value">${cd.key || cd.fallback}</span>
                    </div>
                </div>
            `;
        }

        document.getElementById('year').addEventListener('change', updateSummary);
        updateSummary();

        // Отправка формы — добавить автомобиль в Le Garage
        document.getElementById('vehicle-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const year  = document.getElementById('year').value;
            const color = document.getElementById('color').value;
            if (!year || !color) {
                alert('Пожалуйста, выберите год и цвет кузова.');
                return;
            }
            addVehicle({
                model:  model.name,
                year:   parseInt(year),
                engine: model.engine,
                color,
                photo:  model.uploadedPhoto || model.photo || null
            });
            alert(`Marquis ${model.name} успешно добавлен в Le Garage!`);
            window.location.href = 'index.html';
        });
    }

});


/**
 * showAtelierLanding — Лэндинг L'Atelier.
 * Показывает встроенные модели Marquis + пользовательские модели из localStorage.
 * Форма создаёт ОПРЕДЕЛЕНИЕ МОДЕЛИ (не автомобиль гаража).
 */
function showAtelierLanding(contentDiv) {
    // Встроенные модели Marquis
    const builtInModels = [
        { id: 'pavillon',  name: modelData['pavillon'].name,   href: 'details.html?model=pavillon',  desc: modelData['pavillon'].descriptionKey, img: modelData['pavillon'].uploadedPhoto || (modelData['pavillon'].photoOverride ? modelImages[modelData['pavillon'].photoOverride] : modelImages['pavillon']) },
        { id: 'belvedere', name: modelData['belvedere'].name,  href: 'details.html?model=belvedere', desc: modelData['belvedere'].descriptionKey, img: modelData['belvedere'].uploadedPhoto || (modelData['belvedere'].photoOverride ? modelImages[modelData['belvedere'].photoOverride] : modelImages['belvedere']) },
        { id: 'mistral',   name: modelData['mistral'].name,    href: 'details.html?model=mistral',   desc: modelData['mistral'].descriptionKey, img: modelData['mistral'].uploadedPhoto || (modelData['mistral'].photoOverride ? modelImages[modelData['mistral'].photoOverride] : modelImages['mistral']) }
    ];

    // Пользовательские модели из localStorage
    const customModels = getCustomModels();

    // Строим карточки: сначала встроенные, затем пользовательские
    function buildCard(href, name, desc, img, id, isBuiltIn) {
        const bgStyle = img ? `background-image: url('${img}');` : '';
        return `
            <div style="position: relative;">
                <a href="${href}" class="atelier-model-card">
                    <div class="card-bg" style="${bgStyle}"></div>
                    <div class="card-info">
                        <h3>Marquis ${name}</h3>
                        <p>${desc}</p>
                        <span class="btn btn-secondary">Сконфигурировать →</span>
                    </div>
                </a>
                <button onclick="event.preventDefault(); window.openEditForm('${id}', ${isBuiltIn})" style="position: absolute; top: 15px; right: 15px; padding: 0.4rem 0.8rem; background: rgba(0,0,0,0.8); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer; z-index: 10; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; backdrop-filter: blur(4px); transition: all 0.3s ease;">✎ Редактировать</button>
            </div>
        `;
    }

    const builtInCards = builtInModels.map(m => buildCard(m.href, m.name, m.desc, m.img, m.id, true)).join('');
    const customCards  = customModels.map(m => {
        const img = m.uploadedPhoto ? m.uploadedPhoto : (m.photo ? (modelImages[m.photo] || '') : '');
        return buildCard(`details.html?custom=${m.id}`, m.name, m.tagline, img, m.id, false);
    }).join('');

    contentDiv.innerHTML = `
        <section class="maison-hero" style="min-height:30vh;display:flex;align-items:center;justify-content:center;flex-direction:column;">
            <h1 class="maison-title">L'Atelier</h1>
            <p class="maison-subtitle">Создайте автомобиль вашей мечты с нуля.</p>
        </section>
        <div class="container atelier-landing">
            <h2>Выберите Вашу Модель</h2>
            <p>Выберите модель Marquis для начала персональной конфигурации в L'Atelier.</p>
            <div class="atelier-landing-grid" id="atelier-grid">
                ${builtInCards}
                ${customCards}
            </div>

            <!-- Кнопка создания новой модели -->
            <div class="manual-add-wrapper">
                <button class="manual-add-toggle-btn" id="manual-add-toggle">
                    + Создать новую модель Marquis
                </button>

                <div class="manual-add-form" id="manual-add-form">
                    <div class="manual-form-inner">
                        <h3>Новая модель Marquis</h3>
                        <p>Заполните характеристики. Модель появится в L'Atelier рядом с официальными автомобилями.</p>
                        <form id="manual-vehicle-form" novalidate>

                            <div class="form-group">
                                <label for="manual-model" class="form-label">Название модели *</label>
                                <input type="text" id="manual-model" class="form-control"
                                    placeholder="Например: Soleil">
                            </div>

                            <div class="form-group">
                                <label class="form-label" style="display:block;margin-bottom:0.5rem;">Годы выпуска *</label>
                                <div class="checkbox-group" style="display: flex; gap: 1.5rem; align-items: center;">
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                        <input type="checkbox" name="manual-year" value="2026"> 2026
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                        <input type="checkbox" name="manual-year" value="2027"> 2027
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                        <input type="checkbox" name="manual-year" value="2028"> 2028
                                    </label>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="manual-tagline" class="form-label">Слоган (краткое описание) *</label>
                                <input type="text" id="manual-tagline" class="form-control"
                                    placeholder="Например: Элегантность без компромиссов">
                            </div>

                            <div class="form-group">
                                <label for="manual-desc" class="form-label">Описание модели *</label>
                                <textarea id="manual-desc" class="form-control" rows="3"
                                    placeholder="Полное описание модели — её характер, назначение, философия дизайна..." style="resize:vertical;"></textarea>
                            </div>

                            <div class="form-group">
                                <label for="manual-engine" class="form-label">Тип двигателя *</label>
                                <select id="manual-engine" class="form-control form-select">
                                    <option value="Electric/EV">Electric / EV</option>
                                    <option value="Electric/EV Performance">Electric / EV Performance</option>
                                    <option value="Dual-Motor">Dual-Motor</option>
                                    <option value="Tri-Motor">Tri-Motor</option>
                                    <option value="Quad-Motor">Quad-Motor</option>
                                </select>
                            </div>

                            <!-- Ключевые характеристики -->
                            <div class="form-group">
                                <label class="form-label">Ключевые характеристики *</label>
                                <div class="specs-input-grid">
                                    <div class="spec-input-item">
                                        <span class="spec-input-label">Запас хода</span>
                                        <input type="text" id="spec-range" class="form-control"
                                            placeholder="Например: 620 km">
                                    </div>
                                    <div class="spec-input-item">
                                        <span class="spec-input-label">0–100 км/ч</span>
                                        <input type="text" id="spec-accel" class="form-control"
                                            placeholder="Например: 4.2s">
                                    </div>
                                    <div class="spec-input-item">
                                        <span class="spec-input-label">Начальная цена</span>
                                        <input type="text" id="spec-price" class="form-control"
                                            placeholder="Например: $120,000">
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="manual-photo" class="form-label">Фото модели (из предложенных)</label>
                                <select id="manual-photo" class="form-control form-select">
                                    <option value="">Без фото (плейсхолдер)</option>
                                    <option value="pavillon">Marquis Pavillon</option>
                                    <option value="belvedere">Marquis Belvédère</option>
                                    <option value="mistral">Marquis Mistral</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="manual-photo-upload" class="form-label">Или загрузите свое фото</label>
                                <input type="file" id="manual-photo-upload" class="form-control" accept="image/*">
                                <input type="hidden" id="manual-uploaded-photo-data">
                                <input type="hidden" id="edit-model-id">
                                <input type="hidden" id="edit-is-builtin">
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary btn-black btn-atelier-submit-manual">
                                    Добавить модель в L'Atelier
                                </button>
                                <button type="button" id="manual-cancel" class="btn manual-cancel-btn">
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Переключение видимости формы
    const toggleBtn    = document.getElementById('manual-add-toggle');
    const formContainer = document.getElementById('manual-add-form');

    toggleBtn.addEventListener('click', function() {
        const isOpen = formContainer.classList.contains('open');
        formContainer.classList.toggle('open');
        this.textContent = isOpen
            ? '+ Создать новую модель Marquis'
            : '− Скрыть форму';
    });

    document.getElementById('manual-cancel').addEventListener('click', function() {
        formContainer.classList.remove('open');
        toggleBtn.textContent = '+ Создать новую модель Marquis';
        document.getElementById('manual-vehicle-form').reset();
        document.getElementById('edit-model-id').value = '';
        document.getElementById('edit-is-builtin').value = '';
        document.getElementById('manual-uploaded-photo-data').value = '';
        document.querySelector('#manual-add-form h3').textContent = 'Новая модель Marquis';
        document.querySelector('.btn-atelier-submit-manual').textContent = 'Добавить модель в L\'Atelier';
    });

    // Обработка загрузки фото
    const fileInput = document.getElementById('manual-photo-upload');
    const photoDataInput = document.getElementById('manual-uploaded-photo-data');
    if (fileInput && photoDataInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    photoDataInput.value = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                photoDataInput.value = '';
            }
        });
    }

    // Экспортируем функцию редактирования
    window.openEditForm = function(id, isBuiltIn = false) {
        let model = null;
        if (isBuiltIn) {
            const d = modelData[id];
            const eKey = d.engines[0].value;
            const yKey = Object.keys(d.specs[eKey])[0];
            model = {
                id,
                name: d.name,
                tagline: d.taglineKey,
                description: d.descriptionKey,
                engine: eKey,
                years: Object.keys(d.specs[eKey]),
                specs: {
                    range: d.specs[eKey][yKey][0].value,
                    acceleration: d.specs[eKey][yKey][1].value,
                    price: d.specs[eKey][yKey][2].value
                },
                photo: d.photoOverride || id,
                uploadedPhoto: d.uploadedPhoto || ''
            };
        } else {
            model = getCustomModels().find(m => m.id === id);
        }
        
        if (!model) return;

        document.getElementById('manual-model').value = model.name;
        document.getElementById('manual-tagline').value = model.tagline || '';
        document.getElementById('manual-desc').value = model.description || '';
        document.getElementById('manual-engine').value = model.engine || 'Electric/EV';
        
        const yearCheckboxes = document.querySelectorAll('input[name="manual-year"]');
        yearCheckboxes.forEach(cb => { cb.checked = model.years && model.years.includes(cb.value); });

        if (model.specs) {
            document.getElementById('spec-range').value = model.specs.range || '';
            document.getElementById('spec-accel').value = model.specs.acceleration || '';
            document.getElementById('spec-price').value = model.specs.price || '';
        }

        if (model.photo) document.getElementById('manual-photo').value = model.photo;
        document.getElementById('manual-uploaded-photo-data').value = model.uploadedPhoto || '';
        
        document.getElementById('edit-model-id').value = id;
        document.getElementById('edit-is-builtin').value = isBuiltIn ? 'true' : 'false';
        
        document.querySelector('#manual-add-form h3').textContent = 'Редактировать модель Marquis';
        document.querySelector('.btn-atelier-submit-manual').textContent = 'Сохранить изменения';

        formContainer.classList.add('open');
        toggleBtn.textContent = '− Скрыть форму';
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Валидация и сохранение определения модели
    document.getElementById('manual-vehicle-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const name   = document.getElementById('manual-model').value.trim();
        const yearCheckboxes = document.querySelectorAll('input[name="manual-year"]:checked');
        const years = Array.from(yearCheckboxes).map(cb => cb.value);
        const tagline = document.getElementById('manual-tagline').value.trim();
        const desc   = document.getElementById('manual-desc').value.trim();
        const engine = document.getElementById('manual-engine').value.trim();
        const range  = document.getElementById('spec-range').value.trim();
        const accel  = document.getElementById('spec-accel').value.trim();
        const price  = document.getElementById('spec-price').value.trim();
        const photo  = document.getElementById('manual-photo').value;
        const uploadedPhoto = document.getElementById('manual-uploaded-photo-data').value;

        // JS-валидация всех обязательных полей
        if (!name)    { alert('Пожалуйста, укажите название модели.');          return; }
        if (years.length === 0) { alert('Пожалуйста, выберите хотя бы один год выпуска.'); return; }
        if (!tagline) { alert('Пожалуйста, укажите слоган модели.');            return; }
        if (!desc)    { alert('Пожалуйста, добавьте описание модели.');         return; }
        if (!engine)  { alert('Пожалуйста, укажите тип двигателя.');            return; }
        if (!range)   { alert('Пожалуйста, укажите запас хода.');               return; }
        if (!accel)   { alert('Пожалуйста, укажите разгон 0–100 км/ч.');       return; }
        if (!price)   { alert('Пожалуйста, укажите начальную цену.');           return; }

        const dataToSave = {
            name,
            years,
            tagline,
            description: desc,
            engine,
            specs: { range, acceleration: accel, price },
            photo: photo || null,
            uploadedPhoto: uploadedPhoto || null
        };

        const editId = document.getElementById('edit-model-id').value;
        const isBuiltIn = document.getElementById('edit-is-builtin').value === 'true';

        if (editId) {
            if (isBuiltIn) {
                saveModelOverride(editId, dataToSave);
            } else {
                updateCustomModel(editId, dataToSave);
            }
        } else {
            addCustomModel(dataToSave);
        }
        
        window.location.reload();
    });
}
