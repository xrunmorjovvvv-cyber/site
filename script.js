// data.js
// Моковые данные для анализа локаций в Москве

// Координаты центра Москвы
const MOSCOW_CENTER = [55.7558, 37.6173];

// Районы Москвы для генерации данных
const MOSCOW_DISTRICTS = [
    { name: "Центральный", center: [55.7570, 37.6175] },
    { name: "Северный", center: [55.8350, 37.5600] },
    { name: "Северо-Восточный", center: [55.8500, 37.6300] },
    { name: "Восточный", center: [55.7800, 37.7800] },
    { name: "Юго-Восточный", center: [55.6900, 37.7600] },
    { name: "Южный", center: [55.6200, 37.6700] },
    { name: "Юго-Западный", center: [55.6500, 37.5500] },
    { name: "Западный", center: [55.7300, 37.4300] },
    { name: "Северо-Западный", center: [55.8300, 37.4200] },
    { name: "Зеленоградский", center: [55.9825, 37.1814] }
];

// Улицы для более детального уровня
const MOSCOW_STREETS = [
    "Тверская", "Арбат", "Новый Арбат", "Кутузовский проспект", "Ленинградский проспект",
    "Проспект Мира", "Ленинский проспект", "Варварка", "Петровка", "Никольская",
    "Манежная", "Охотный Ряд", "Большая Дмитровка", "Мясницкая", "Покровка"
];

// Генерация случайных данных для сетки
function generateGridData(center, gridSize, cellSize) {
    const data = [];
    const latRange = 0.15; // Широтный диапазон (приблизительно 16.7 км)
    const lngRange = 0.3; // Долготный диапазон (приблизительно 20 км на широте Москвы)
    
    // Количество ячеек по горизонтали и вертикали
    const cols = Math.ceil(lngRange / (cellSize / 111000)); // 1 градус ~ 111 км
    const rows = Math.ceil(latRange / (cellSize / 111000));
    
    // Начальная точка (верхний левый угол)
    const startLat = center[0] + latRange / 2;
    const startLng = center[1] - lngRange / 2;
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            // Координаты центра ячейки
            const lat = startLat - (i * cellSize / 111000) - (cellSize / 111000 / 2);
            const lng = startLng + (j * cellSize / 111000) + (cellSize / 111000 / 2);
            
            // Определяем район по близости к центру района
            let district = "Не определен";
            let minDistance = Infinity;
            
            for (const dist of MOSCOW_DISTRICTS) {
                const distance = Math.sqrt(Math.pow(lat - dist.center[0], 2) + Math.pow(lng - dist.center[1], 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    district = dist.name;
                }
            }
            
            // Улица (генерируем только для некоторых ячеек)
            let street = null;
            if (Math.random() > 0.7) {
                street = MOSCOW_STREETS[Math.floor(Math.random() * MOSCOW_STREETS.length)];
            }
            
            // Генерация данных для ячейки
            const competitors = Math.floor(Math.random() * 15);
            const footTraffic = Math.floor(Math.random() * 10) + 1;
            const metroDistance = Math.floor(Math.random() * 2000) + 100;
            const avgIncome = Math.floor(Math.random() * 120000) + 30000;
            const parkingScore = Math.floor(Math.random() * 10) + 1;
            const ecoScore = Math.floor(Math.random() * 10) + 1;
            const relatedCompetitors = Math.floor(Math.random() * 10);
            
            // Расчет рейтинга привлекательности
            let attractiveness = 10;
            attractiveness -= competitors * 0.3; // Чем больше конкурентов, тем хуже
            attractiveness += footTraffic * 0.4; // Чем больше проходимость, тем лучше
            attractiveness -= metroDistance / 500 * 0.3; // Чем дальше от метро, тем хуже
            attractiveness += avgIncome / 20000 * 0.2; // Чем выше доход, тем лучше
            attractiveness += parkingScore * 0.2; // Чем лучше парковки, тем лучше
            attractiveness += ecoScore * 0.15; // Чем лучше экология, тем лучше
            attractiveness -= relatedCompetitors * 0.25; // Конкуренты в смежных областях
            
            // Ограничиваем рейтинг от 1 до 10
            attractiveness = Math.max(1, Math.min(10, Math.round(attractiveness)));
            
            // Прогноз роста бизнеса
            const growthForecast = Math.floor(Math.random() * 20) + 80 + (attractiveness * 2);
            
            data.push({
                id: `${i}-${j}`,
                coordinates: [lat, lng],
                district,
                street,
                metrics: {
                    competitors,
                    footTraffic,
                    metroDistance,
                    avgIncome,
                    parkingScore,
                    ecoScore,
                    relatedCompetitors,
                    attractiveness,
                    growthForecast: Math.min(100, growthForecast)
                },
                bounds: [
                    [lat - cellSize / 111000 / 2, lng - cellSize / 111000 / 2],
                    [lat + cellSize / 111000 / 2, lng + cellSize / 111000 / 2]
                ]
            });
        }
    }
    
    return data;
}

// Цвет для рейтинга
function getColorForRating(rating) {
    if (rating >= 9) return "#44ff44"; // Отличный
    if (rating >= 8) return "#aaff44"; // Высокий
    if (rating >= 6) return "#ffff44"; // Выше среднего
    if (rating >= 3) return "#ffaa44"; // Средний
    return "#ff4444"; // Низкий
}

// Генерация шестиугольников
function generateHexGrid(center, size, radius) {
    const hexagons = [];
    const latRange = 0.15;
    const lngRange = 0.3;
    
    // Размер шестиугольника в градусах
    const hexSize = radius / 111000;
    
    // Количество шестиугольников по горизонтали и вертикали
    const cols = Math.ceil(lngRange / (hexSize * 1.5));
    const rows = Math.ceil(latRange / (hexSize * Math.sqrt(3)));
    
    // Начальная точка
    const startLat = center[0] + latRange / 2;
    const startLng = center[1] - lngRange / 2;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * hexSize * 1.5;
            const y = row * hexSize * Math.sqrt(3);
            
            // Сдвиг для нечетных строк
            const offsetX = (row % 2 === 0) ? 0 : hexSize * 0.75;
            
            const centerLat = startLat - y;
            const centerLng = startLng + x + offsetX;
            
            // Генерация вершин шестиугольника
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i;
                const lat = centerLat + hexSize * Math.sin(angle);
                const lng = centerLng + hexSize * Math.cos(angle);
                points.push([lat, lng]);
            }
            
            // Определяем район
            let district = "Не определен";
            let minDistance = Infinity;
            
            for (const dist of MOSCOW_DISTRICTS) {
                const distance = Math.sqrt(Math.pow(centerLat - dist.center[0], 2) + Math.pow(centerLng - dist.center[1], 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    district = dist.name;
                }
            }
            
            // Улица
            let street = null;
            if (Math.random() > 0.7) {
                street = MOSCOW_STREETS[Math.floor(Math.random() * MOSCOW_STREETS.length)];
            }
            
            // Генерация данных
            const competitors = Math.floor(Math.random() * 15);
            const footTraffic = Math.floor(Math.random() * 10) + 1;
            const metroDistance = Math.floor(Math.random() * 2000) + 100;
            const avgIncome = Math.floor(Math.random() * 120000) + 30000;
            const parkingScore = Math.floor(Math.random() * 10) + 1;
            const ecoScore = Math.floor(Math.random() * 10) + 1;
            const relatedCompetitors = Math.floor(Math.random() * 10);
            
            // Расчет рейтинга привлекательности
            let attractiveness = 10;
            attractiveness -= competitors * 0.3;
            attractiveness += footTraffic * 0.4;
            attractiveness -= metroDistance / 500 * 0.3;
            attractiveness += avgIncome / 20000 * 0.2;
            attractiveness += parkingScore * 0.2;
            attractiveness += ecoScore * 0.15;
            attractiveness -= relatedCompetitors * 0.25;
            
            attractiveness = Math.max(1, Math.min(10, Math.round(attractiveness)));
            
            // Прогноз роста бизнеса
            const growthForecast = Math.floor(Math.random() * 20) + 80 + (attractiveness * 2);
            
            hexagons.push({
                id: `hex-${row}-${col}`,
                center: [centerLat, centerLng],
                points,
                district,
                street,
                metrics: {
                    competitors,
                    footTraffic,
                    metroDistance,
                    avgIncome,
                    parkingScore,
                    ecoScore,
                    relatedCompetitors,
                    attractiveness,
                    growthForecast: Math.min(100, growthForecast)
                }
            });
        }
    }
    
    return hexagons;
}