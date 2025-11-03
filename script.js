// Базовый класс Клетка
        class Cell {
            constructor(type, moisture = 0) {
                this.type = type; // 'land' или 'water'
                this.moisture = moisture;
                this.plant = null;
                this.element = null;
            }
            
            // Расчет влажности на основе соседних клеток с водой
            calculateMoisture(grid, x, y) {
                if (this.type === 'water') {
                    this.moisture = 1;
                    return;
                }
                
                let totalMoisture = 0;
                const size = Math.sqrt(grid.length);
                
                // Проверяем соседние клетки
                for (let i = -2; i <= 2; i++) {
                    for (let j = -2; j <= 2; j++) {
                        const newX = x + i;
                        const newY = y + j;
                        
                        if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
                            const neighbor = grid[newY * size + newX];
                            if (neighbor.type === 'water') {
                                // Влажность уменьшается с расстоянием
                                const distance = Math.sqrt(i*i + j*j);
                                totalMoisture += 1 / (distance + 1);
                            }
                        }
                    }
                }
                
                this.moisture = Math.min(totalMoisture, 1);
                this.updateAppearance();
            }
            
            // Обновление внешнего вида клетки
            updateAppearance() {
                if (this.type === 'water') {
                    this.element.style.backgroundColor = '#4a86e8';
                } else {
                    // Плавный переход от желтого к темно-коричневому в зависимости от влажности
                    const r = Math.floor(255 - this.moisture * 150);
                    const g = Math.floor(200 - this.moisture * 100);
                    const b = Math.floor(50 + this.moisture * 50);
                    this.element.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                }
                
                // Отображение растения, если оно есть
                if (this.plant) {
                    this.plant.updateAppearance();
                }
            }
            
            // Посадка растения
            plantSeed(plantType) {
                if (this.type !== 'land') return false;
                
                let plant;
                switch(plantType) {
                    case 'swamp':
                        plant = new SwampPlant();
                        break;
                    case 'potato':
                        plant = new PotatoPlant();
                        break;
                    case 'cactus':
                        plant = new CactusPlant();
                        break;
                    default:
                        return false;
                }
                
                this.plant = plant;
                this.plant.cell = this;
                this.updateAppearance();
                return true;
            }
            
            // Удаление растения
            removePlant() {
                this.plant = null;
                this.updateAppearance();
            }
            
            // Изменение типа клетки
            changeType(newType) {
                this.type = newType;
                if (newType === 'water') {
                    this.moisture = 1;
                    this.plant = null;
                }
                this.updateAppearance();
            }
        }

        // Базовый класс Растение
        class Plant {
            constructor(name, moistureMin, moistureMax, growthStages) {
                this.name = name;
                this.moistureMin = moistureMin;
                this.moistureMax = moistureMax;
                this.growthStages = growthStages;
                this.currentStage = 0;
                this.cell = null;
            }
            
            // Проверка условий для роста
            canGrow() {
                const moisture = this.cell.moisture;
                return moisture >= this.moistureMin && moisture <= this.moistureMax;
            }
            
            // Рост растения
            grow() {
                if (!this.canGrow()) {
                    // Растение погибает, если условия не подходят
                    this.cell.removePlant();
                    return;
                }
                
                if (this.currentStage < this.growthStages - 1) {
                    this.currentStage++;
                    this.updateAppearance();
                }
            }
            
            // Обновление внешнего вида растения
            updateAppearance() {
                if (!this.cell || !this.cell.element) return;
                
                // Очищаем предыдущее содержимое
                this.cell.element.innerHTML = '';
                
                // Создаем элемент для отображения растения
                const plantElement = document.createElement('div');
                plantElement.className = 'plant-icon';
                
                // Отображаем растение в зависимости от стадии роста
                if (this.currentStage === 0) {
                    plantElement.textContent = '🌱'; // Росток
                } else if (this.currentStage === 1) {
                    plantElement.textContent = this.getMiddleStageIcon();
                } else {
                    plantElement.textContent = this.getMatureIcon();
                }
                
                this.cell.element.appendChild(plantElement);
            }
            
            // Методы, которые должны быть реализованы в дочерних классах
            getMiddleStageIcon() { return '🌿'; }
            getMatureIcon() { return '🌳'; }
        }

        // Классы конкретных растений
        class SwampPlant extends Plant {
            constructor() {
                super('Болотник', 0.7, 1, 3);
            }
            
            getMiddleStageIcon() { return '🌿'; }
            getMatureIcon() { return '🪴'; }
        }

        class PotatoPlant extends Plant {
            constructor() {
                super('Картошка', 0.4, 0.8, 3);
            }
            
            getMiddleStageIcon() { return '🥔'; }
            getMatureIcon() { return '🥔'; }
        }

        class CactusPlant extends Plant {
            constructor() {
                super('Кактус', 0, 0.3, 3);
            }
            
            getMiddleStageIcon() { return '🌵'; }
            getMatureIcon() { return '🌵'; }
        }

        // Основной код приложения
        document.addEventListener('DOMContentLoaded', function() {
            const gridElement = document.getElementById('grid');
            const cellInfoElement = document.getElementById('cell-info');
            const tools = document.querySelectorAll('.tool');
            let selectedTool = 'shovel';
            let grid = [];
            const gridSize = 10;
            
            // Инициализация сетки
            function initializeGrid() {
                gridElement.innerHTML = '';
                grid = [];
                
                for (let y = 0; y < gridSize; y++) {
                    for (let x = 0; x < gridSize; x++) {
                        const cell = new Cell('land');
                        const cellElement = document.createElement('div');
                        cellElement.className = 'cell';
                        cellElement.dataset.x = x;
                        cellElement.dataset.y = y;
                        
                        cell.element = cellElement;
                        grid.push(cell);
                        gridElement.appendChild(cellElement);
                        
                        // Обработчик клика по клетке
                        cellElement.addEventListener('click', function() {
                            handleCellClick(x, y);
                        });
                    }
                }
                
                // Добавляем несколько клеток с водой для примера
                grid[22].changeType('water');
                grid[33].changeType('water');
                grid[77].changeType('water');
                
                // Пересчитываем влажность для всех клеток
                recalculateMoisture();
            }
            
            // Пересчет влажности для всех клеток
            function recalculateMoisture() {
                for (let y = 0; y < gridSize; y++) {
                    for (let x = 0; x < gridSize; x++) {
                        const cell = grid[y * gridSize + x];
                        cell.calculateMoisture(grid, x, y);
                    }
                }
            }
            
            // Обработчик клика по клетке
            function handleCellClick(x, y) {
                const cell = grid[y * gridSize + x];
                
                // Обновляем информацию о клетке
                updateCellInfo(cell, x, y);
                
                // Выполняем действие в зависимости от выбранного инструмента
                switch(selectedTool) {
                    case 'shovel':
                        if (cell.type === 'land') {
                            cell.changeType('water');
                        } else {
                            cell.changeType('land');
                        }
                        recalculateMoisture();
                        break;
                    case 'bucket':
                        if (cell.type === 'water') {
                            cell.changeType('land');
                        } else {
                            cell.changeType('water');
                        }
                        recalculateMoisture();
                        break;
                    case 'swamp':
                    case 'potato':
                    case 'cactus':
                        if (cell.type === 'land' && !cell.plant) {
                            cell.plantSeed(selectedTool);
                        }
                        break;
                }
            }
            
            // Обновление информации о клетке
            function updateCellInfo(cell, x, y) {
                let info = `Позиция: (${x}, ${y})<br>`;
                info += `Тип: ${cell.type === 'land' ? 'Земля' : 'Вода'}<br>`;
                info += `Влажность: ${Math.round(cell.moisture * 100)}%<br>`;
                
                if (cell.plant) {
                    info += `Растение: ${cell.plant.name}<br>`;
                    info += `Стадия роста: ${cell.plant.currentStage + 1}/${cell.plant.growthStages}<br>`;
                    info += `Условия: ${cell.plant.canGrow() ? 'Подходят' : 'Не подходят'}`;
                } else {
                    info += 'Растение: нет';
                }
                
                cellInfoElement.innerHTML = info;
            }
            
            // Обработчики для инструментов
            tools.forEach(tool => {
                tool.addEventListener('click', function() {
                    tools.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    selectedTool = this.dataset.tool;
                });
            });
            
            // Функция для роста растений
            function growPlants() {
                grid.forEach(cell => {
                    if (cell.plant) {
                        cell.plant.grow();
                    }
                });
            }
            
            // Инициализация сетки
            initializeGrid();
            
            // Автоматический рост растений каждые 5 секунд
            setInterval(growPlants, 5000);
        });