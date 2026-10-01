// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация переменных
    let map;
    let gridLayer = null;
    let hexagonLayer = null;
    let currentGridType = 'hexagon';
    let currentGridSize = 500;
    let currentOpacity = 0.7;
    let currentFilters = {
        competitors: 5,
        footTraffic: 7,
        attractiveness: 6,
        metroDistance: 800,
        incomeLevel: 80000
    };
    
    let currentSelectedCell = null;
    
    // Инициализация карты
    function initMap() {
        map = L.map('map').setView(MOSCOW_CENTER, 12);
        
        // Добавление слоя карты
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(map);
        
        // Добавление сетки по умолчанию
        updateGrid();
        
        // Обработчики событий для кнопок управления картой
        document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());
        document.getElementById('resetView').addEventListener('click', () => {
            map.setView(MOSCOW_CENTER, 12);
        });
    }
    
    // Обновление сетки на карте
    function updateGrid() {
        // Удаляем предыдущий слой сетки
        if (gridLayer) {
            map.removeLayer(gridLayer);
            gridLayer = null;
        }
        
        if (hexagonLayer) {
            map.removeLayer(hexagonLayer);
            hexagonLayer = null;
        }
        
        if (currentGridType === 'square') {
            // Квадратная сетка
            const gridData = generateGridData(MOSCOW_CENTER, currentGridSize, currentGridSize);
            gridLayer = L.layerGroup().addTo(map);
            
            gridData.forEach(cell => {
                // Применяем фильтры
                if (!passesFilters(cell)) return;
                
                const color = getColorForRating(cell.metrics.attractiveness);
                
                // Создаем прямоугольник для ячейки
                const rect = L.rectangle(cell.bounds, {
                    color: '#ffffff',
                    weight: 1,
                    fillColor: color,
                    fillOpacity: currentOpacity,
                    className: 'grid-cell'
                }).addTo(gridLayer);
                
                // Добавляем всплывающее окно
                rect.bindPopup(createPopupContent(cell));
                
                // Добавляем обработчик клика
                rect.on('click', function(e) {
                    // Сбрасываем стиль предыдущей выбранной ячейки
                    if (currentSelectedCell) {
                        currentSelectedCell.setStyle({
                            weight: 1
                        });
                    }
                    
                    // Выделяем текущую ячейку
                    rect.setStyle({
                        weight: 3
                    });
                    
                    currentSelectedCell = rect;
                    
                    // Показываем детали в боковой панели
                    showLocationDetails(cell);
                    
                    // Обновляем метрики
                    updateMetrics(cell);
                    
                    // Открываем всплывающее окно
                    rect.openPopup();
                });
                
                // Эффект при наведении
                rect.on('mouseover', function() {
                    rect.setStyle({
                        weight: 2
                    });
                });
                
                rect.on('mouseout', function() {
                    if (rect !== currentSelectedCell) {
                        rect.setStyle({
                            weight: 1
                        });
                    }
                });
            });
        } else {
            // Гексагональная сетка
            const hexGrid = generateHexGrid(MOSCOW_CENTER, currentGridSize, currentGridSize / 2);
            hexagonLayer = L.layerGroup().addTo(map);
            
            hexGrid.forEach(hex => {
                // Применяем фильтры
                if (!passesFilters(hex)) return;
                
                const color = getColorForRating(hex.metrics.attractiveness);
                
                // Создаем многоугольник для шестиугольника
                const polygon = L.polygon(hex.points, {
                    color: '#ffffff',
                    weight: 1,
                    fillColor: color,
                    fillOpacity: currentOpacity,
                    className: 'grid-cell'
                }).addTo(hexagonLayer);
                
                // Добавляем всплывающее окно
                polygon.bindPopup(createPopupContent(hex));
                
                // Добавляем обработчик клика
                polygon.on('click', function(e) {
                    // Сбрасываем стиль предыдущей выбранной ячейки
                    if (currentSelectedCell) {
                        currentSelectedCell.setStyle({
                            weight: 1
                        });
                    }
                    
                    // Выделяем текущую ячейку
                    polygon.setStyle({
                        weight: 3
                    });
                    
                    currentSelectedCell = polygon;
                    
                    // Показываем детали в боковой панели
                    showLocationDetails(hex);
                    
                    // Обновляем метрики
                    updateMetrics(hex);
                    
                    // Открываем всплывающее окно
                    polygon.openPopup();
                });
                
                // Эффект при наведении
                polygon.on('mouseover', function() {
                    polygon.setStyle({
                        weight: 2
                    });
                });
                
                polygon.on('mouseout', function() {
                    if (polygon !== currentSelectedCell) {
                        polygon.setStyle({
                            weight: 1
                        });
                    }
                });
            });
        }
    }
    
    // Проверка, проходит ли ячейка через фильтры
    function passesFilters(cell) {
        return (
            cell.metrics.competitors <= currentFilters.competitors &&
            cell.metrics.footTraffic >= currentFilters.footTraffic &&
            cell.metrics.attractiveness >= currentFilters.attractiveness &&
            cell.metrics.metroDistance <= currentFilters.metroDistance &&
            cell.metrics.avgIncome >= currentFilters.incomeLevel
        );
    }
    
    // Создание содержимого для всплывающего окна
    function createPopupContent(cell) {
        const streetInfo = cell.street ? `<p><strong>Улица:</strong> ${cell.street}</p>` : '';
        
        return `
            <div class="popup-content">
                <h3>${cell.district} ${cell.street ? `- ${cell.street}` : ''}</h3>
                ${streetInfo}
                <p><strong>Конкуренты:</strong> ${cell.metrics.competitors}</p>
                <p><strong>Проходимость:</strong> ${cell.metrics.footTraffic}/10</p>
                <p><strong>До метро:</strong> ${cell.metrics.metroDistance} м</p>
                <p><strong>Средний доход:</strong> ${cell.metrics.avgIncome.toLocaleString()} руб.</p>
                <p><strong>Привлекательность:</strong> 
                    <span class="rating-value" style="background-color: ${getColorForRating(cell.metrics.attractiveness)}; color: #000;">
                        ${cell.metrics.attractiveness}/10
                    </span>
                </p>
            </div>
        `;
    }
    
    // Показать детали локации в боковой панели
    function showLocationDetails(cell) {
        const locationDetails = document.getElementById('locationDetails');
        const streetInfo = cell.street ? `<p><strong>Улица:</strong> ${cell.street}</p>` : '';
        
        locationDetails.innerHTML = `
            <div class="location-info">
                <h3 class="location-name">
                    <i class="fas fa-map-marker-alt"></i>
                    ${cell.district} ${cell.street ? `- ${cell.street}` : ''}
                </h3>
                <div class="location-metrics">
                    <div class="metric-row">
                        <span class="metric-label">Конкуренты в зоне:</span>
                        <span class="metric-value">${cell.metrics.competitors}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Уровень проходимости:</span>
                        <span class="metric-value">${cell.metrics.footTraffic}/10</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Привлекательность места:</span>
                        <span class="metric-value rating-value" style="background-color: ${getColorForRating(cell.metrics.attractiveness)}; color: #000;">
                            ${cell.metrics.attractiveness}/10
                        </span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Средний доход населения:</span>
                        <span class="metric-value">${cell.metrics.avgIncome.toLocaleString()} руб.</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Наличие парковок:</span>
                        <span class="metric-value">${cell.metrics.parkingScore}/10</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Близость к метро:</span>
                        <span class="metric-value">${cell.metrics.metroDistance} м</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Экологичность зоны:</span>
                        <span class="metric-value">${cell.metrics.ecoScore}/10</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Конкуренты в смежных областях:</span>
                        <span class="metric-value">${cell.metrics.relatedCompetitors}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Обновление метрик в правой панели
    function updateMetrics(cell) {
        document.getElementById('growthForecastValue').textContent = `${cell.metrics.growthForecast}%`;
        document.getElementById('growthForecastBar').style.width = `${cell.metrics.growthForecast}%`;
        
        document.getElementById('ecoScoreValue').textContent = `${cell.metrics.ecoScore}/10`;
        document.getElementById('ecoScoreBar').style.width = `${cell.metrics.ecoScore * 10}%`;
        
        document.getElementById('parkingScoreValue').textContent = `${cell.metrics.parkingScore}/10`;
        document.getElementById('parkingScoreBar').style.width = `${cell.metrics.parkingScore * 10}%`;
        
        document.getElementById('relatedCompetitorsValue').textContent = cell.metrics.relatedCompetitors;
        const competitorPercent = Math.min(100, cell.metrics.relatedCompetitors * 10);
        document.getElementById('relatedCompetitorsBar').style.width = `${competitorPercent}%`;
    }
    
    // Инициализация элементов управления
    function initControls() {
        // Переключение темы
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            
            if (document.body.classList.contains('dark-theme')) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Светлая тема</span>';
            } else {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Тёмная тема</span>';
            }
            
            // Обновляем карту для применения новой темы
            setTimeout(() => map.invalidateSize(), 100);
        });
        
        // Тип сетки
        const gridType = document.getElementById('gridType');
        gridType.addEventListener('change', function() {
            currentGridType = this.value;
            updateGrid();
        });
        
        // Размер сетки
        const gridSize = document.getElementById('gridSize');
        const gridSizeValue = document.getElementById('gridSizeValue');
        
        gridSize.addEventListener('input', function() {
            gridSizeValue.textContent = this.value;
        });
        
        gridSize.addEventListener('change', function() {
            currentGridSize = parseInt(this.value);
            updateGrid();
        });
        
        // Прозрачность
        const opacity = document.getElementById('opacity');
        const opacityValue = document.getElementById('opacityValue');
        
        opacity.addEventListener('input', function() {
            opacityValue.textContent = this.value;
            currentOpacity = parseInt(this.value) / 100;
            
            // Обновляем прозрачность текущей сетки
            if (gridLayer) {
                gridLayer.eachLayer(layer => {
                    layer.setStyle({ fillOpacity: currentOpacity });
                });
            }
            
            if (hexagonLayer) {
                hexagonLayer.eachLayer(layer => {
                    layer.setStyle({ fillOpacity: currentOpacity });
                });
            }
        });
        
        // Фильтры
        initFilters();
        
        // Кнопка применения фильтров
        document.getElementById('applyFilters').addEventListener('click', function() {
            updateGrid();
        });
        
        // Кнопка сброса фильтров
        document.getElementById('resetFilters').addEventListener('click', function() {
            resetFilters();
        });
    }
    
    // Инициализация фильтров
    function initFilters() {
        // Конкуренты
        const competitors = document.getElementById('competitors');
        const competitorsValue = document.getElementById('competitorsValue');
        
        competitors.addEventListener('input', function() {
            competitorsValue.textContent = this.value;
            currentFilters.competitors = parseInt(this.value);
        });
        
        // Проходимость
        const footTraffic = document.getElementById('footTraffic');
        const footTrafficValue = document.getElementById('footTrafficValue');
        
        footTraffic.addEventListener('input', function() {
            footTrafficValue.textContent = this.value;
            currentFilters.footTraffic = parseInt(this.value);
        });
        
        // Привлекательность
        const attractiveness = document.getElementById('attractiveness');
        const attractivenessValue = document.getElementById('attractivenessValue');
        
        attractiveness.addEventListener('input', function() {
            attractivenessValue.textContent = this.value;
            currentFilters.attractiveness = parseInt(this.value);
        });
        
        // Расстояние до метро
        const metroDistance = document.getElementById('metroDistance');
        const metroDistanceValue = document.getElementById('metroDistanceValue');
        
        metroDistance.addEventListener('input', function() {
            metroDistanceValue.textContent = this.value;
            currentFilters.metroDistance = parseInt(this.value);
        });
        
        // Уровень дохода
        const incomeLevel = document.getElementById('incomeLevel');
        const incomeValue = document.getElementById('incomeValue');
        
        incomeLevel.addEventListener('input', function() {
            incomeValue.textContent = this.value;
            currentFilters.incomeLevel = parseInt(this.value);
        });
    }
    
    // Сброс фильтров
    function resetFilters() {
        // Сброс значений фильтров
        document.getElementById('competitors').value = 5;
        document.getElementById('competitorsValue').textContent = 5;
        currentFilters.competitors = 5;
        
        document.getElementById('footTraffic').value = 7;
        document.getElementById('footTrafficValue').textContent = 7;
        currentFilters.footTraffic = 7;
        
        document.getElementById('attractiveness').value = 6;
        document.getElementById('attractivenessValue').textContent = 6;
        currentFilters.attractiveness = 6;
        
        document.getElementById('metroDistance').value = 800;
        document.getElementById('metroDistanceValue').textContent = 800;
        currentFilters.metroDistance = 800;
        
        document.getElementById('incomeLevel').value = 80000;
        document.getElementById('incomeValue').textContent = 80000;
        currentFilters.incomeLevel = 80000;
        
        // Обновление сетки
        updateGrid();
    }
    
    // Показать приветственное модальное окно
    function showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        const closeModal = document.getElementById('closeModal');
        const startUsing = document.getElementById('startUsing');
        
        // Показываем модальное окно только при первом посещении
        if (!localStorage.getItem('dfsa_visited')) {
            modal.style.display = 'flex';
        }
        
        // Закрытие модального окна
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
            localStorage.setItem('dfsa_visited', 'true');
        });
        
        startUsing.addEventListener('click', function() {
            modal.style.display = 'none';
            localStorage.setItem('dfsa_visited', 'true');
        });
        
        // Закрытие при клике вне модального окна
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                localStorage.setItem('dfsa_visited', 'true');
            }
        });
    }
    
    // Инициализация приложения
    function initApp() {
        initMap();
        initControls();
        showWelcomeModal();
        
        // Анимация загрузки
        document.body.style.opacity = 0;
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = 1;
        }, 100);
    }
    
    // Запуск приложения
    initApp();
});