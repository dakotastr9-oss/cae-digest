// Переменная для хранения данных
let contentData = {};

// Загрузка данных из content.json
async function loadContentData() {
    try {
        const response = await fetch('content.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        contentData = await response.json();
        console.log('Данные загружены успешно:', Object.keys(contentData).map(key => `${key}: ${contentData[key].length} новостей`));
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Fallback данные на случай ошибки
        contentData = {
            "foreign": [
                {
                    "block": "Ошибка загрузки данных",
                    "month": "september",
                    "title": "Система",
                    "date": "24 сентября 2025",
                    "image": "",
                    "imageAlt": "Ошибка",
                    "content": [
                        {
                            "subheading": "Не удалось загрузить новости",
                            "text": "Проверьте подключение к интернету и наличие файла content.json"
                        }
                    ],
                    "sources": [],
                    "comment": "Требуется перезагрузка страницы"
                }
            ],
            "russian": [],
            "industry": [],
            "events": []
        };
    }
}

// Функция для создания карточки новости
function createNewsCard(item) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    let contentHtml = '';
    if (item.content && Array.isArray(item.content)) {
        item.content.forEach(contentItem => {
            contentHtml += `
                <div class="news-subheading">${contentItem.subheading || ''}</div>
                <div class="news-text">${contentItem.text || ''}</div>
            `;
        });
    } else if (item.content && typeof item.content === 'string') {
        contentHtml = `<div class="news-text">${item.content}</div>`;
    }
    
    let sourcesHtml = '';
    if (item.sources && Array.isArray(item.sources)) {
        sourcesHtml = `
            <div class="news-sources">
                <h4>Источники:</h4>
                ${item.sources.map(source => 
                    `<a href="${source.url}" class="source-link" target="_blank" rel="noopener noreferrer">${source.text}</a>`
                ).join('')}
            </div>
        `;
    }
    
    let commentHtml = '';
    if (item.comment) {
        commentHtml = `
            <div class="news-comment">
                <p><strong>Комментарий:</strong> ${item.comment}</p>
            </div>
        `;
    }
    
    // Проверяем свежесть новости
    let freshnessIndicator = '';
    if (item.date) {
        const newsDate = parseDate(item.date);
        const now = new Date();
        const daysDiff = Math.floor((now - newsDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) {
            freshnessIndicator = '<span class="news-fresh">Новое</span>';
        } else if (daysDiff <= 30) {
            freshnessIndicator = '<span class="news-updated">Недавно</span>';
        }
    }
    
    // Создаем изображение или заглушку
    let imageHtml = '';
    if (item.image && item.image !== 'https://via.placeholder.com/320x180/6B7280/FFFFFF?text=No+Image') {
        imageHtml = `<img src="${item.image}" alt="${item.imageAlt || item.title}" class="news-image" onerror="this.style.display='none'">`;
    } else {
        // Создаем цветную заглушку с первой буквой названия компании
        const firstLetter = item.title ? item.title.charAt(0).toUpperCase() : '?';
        const colors = ['#3B82F6', '#059669', '#DC2626', '#7C3AED', '#EA580C', '#0891B2', '#1D4ED8'];
        const color = colors[item.title ? item.title.charCodeAt(0) % colors.length : 0];
        imageHtml = `
            <div class="news-image" style="background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; font-weight: bold;">
                ${firstLetter}
            </div>
        `;
    }
    
    card.innerHTML = `
        ${imageHtml}
        <div class="news-content">
            <div class="news-meta">
                <span class="news-company">${item.title}</span>
                <span class="news-date">${item.date}</span>
                ${freshnessIndicator}
            </div>
            <div class="news-title">${item.block || item.title}</div>
            ${contentHtml}
            ${sourcesHtml}
            ${commentHtml}
        </div>
    `;
    
    return card;
}

// Функция для парсинга даты из строки
function parseDate(dateString) {
    // Простой парсинг для дат вида "11 августа 2025"
    const months = {
        'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
        'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };
    
    const parts = dateString.toLowerCase().split(' ');
    if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        const year = parseInt(parts[2]);
        
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    
    // Если не удалось распарсить, возвращаем текущую дату
    return new Date();
}

// Функция для отображения новостей по категории
function showSection(sectionId) {
    currentSection = sectionId;
    
    // Скрываем все секции
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Убираем активный класс со всех кнопок навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную секцию
    const activeSection = document.getElementById(sectionId);
    const activeButton = document.querySelector(`[data-section="${sectionId}"]`);
    
    if (activeSection && activeButton) {
        activeSection.classList.add('active');
        activeButton.classList.add('active');
    }
    
    // Сбрасываем поиск и применяем фильтрацию
    document.getElementById('search-input').value = '';
    filterAndDisplayNews();
}

// Функция для загрузки новостей в контейнеры (создает пустые контейнеры)
function loadNews() {
    const sections = ['foreign', 'russian', 'industry', 'events'];
    
    sections.forEach(section => {
        const container = document.getElementById(`${section}-news`);
        container.innerHTML = '';
    });
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Сначала загружаем данные
    await loadContentData();
    
    updateCalendar();
    loadNews();
    updateStatistics();
    
    // Добавляем обработчики для навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Добавляем обработчики для поиска и сортировки
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('sort-select').addEventListener('change', handleSort);
    
    // Показываем первую секцию по умолчанию
    showSection('foreign');
});

// Переменная для хранения текущих данных
let currentSectionData = [];
let currentSection = 'foreign';

// Функция для обработки поиска
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    filterAndDisplayNews(searchTerm);
}

// Функция для обработки сортировки
function handleSort() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    filterAndDisplayNews(searchTerm);
}

// Функция для фильтрации и отображения новостей
function filterAndDisplayNews(searchTerm = '') {
    const sortType = document.getElementById('sort-select').value;
    let data = [...(contentData[currentSection] || [])];
    
    // Фильтрация по поисковому запросу
    if (searchTerm) {
        data = data.filter(item => {
            const searchContent = [
                item.title,
                item.block,
                ...(item.content ? item.content.map(c => c.text + ' ' + c.subheading) : []),
                item.comment
            ].join(' ').toLowerCase();
            
            return searchContent.includes(searchTerm);
        });
    }
    
    // Сортировка
    data.sort((a, b) => {
        switch(sortType) {
            case 'date-desc':
                return parseDate(b.date) - parseDate(a.date);
            case 'date-asc':
                return parseDate(a.date) - parseDate(b.date);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
    // Отображение
    const container = document.getElementById(`${currentSection}-news`);
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Новости не найдены.</p>';
    } else {
        data.forEach(item => {
            const card = createNewsCard(item);
            container.appendChild(card);
        });
    }
}

// Функция для обновления календаря
function updateCalendar() {
    const now = new Date();
    const months = [
        'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
        'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
    ];
    
    document.getElementById('current-date').textContent = now.getDate();
    document.getElementById('current-month').textContent = months[now.getMonth()];
    document.getElementById('current-year').textContent = now.getFullYear();
}

// Функция для анимации чисел
function animateNumber(element, finalNumber, duration = 1000) {
    const startNumber = 0;
    const increment = finalNumber / (duration / 16); // 60 FPS
    let currentNumber = startNumber;
    
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= finalNumber) {
            element.textContent = finalNumber;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentNumber);
        }
    }, 16);
}

// Функция для обновления статистики
function updateStatistics() {
    const sections = ['foreign', 'russian', 'industry', 'events'];
    let totalNews = 0;
    let monthNews = 0;
    let companiesSet = new Set();
    
    const currentMonth = 'september'; // Текущий месяц для актуальных новостей
    
    sections.forEach(section => {
        const data = contentData[section] || [];
        totalNews += data.length;
        
        data.forEach(item => {
            if (item.month === currentMonth) {
                monthNews++;
            }
            if (item.title) {
                companiesSet.add(item.title);
            }
        });
    });
    
    // Анимируем числа
    animateNumber(document.getElementById('total-news'), totalNews);
    animateNumber(document.getElementById('month-news'), monthNews, 800);
    animateNumber(document.getElementById('companies-count'), companiesSet.size, 600);
    
    // Обновляем дату последнего обновления
    const now = new Date();
    const today = now.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long'
    });
    document.getElementById('last-update').textContent = today;
}

// Функция для обновления времени последнего обновления
function updateLastUpdated() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/Moscow'
    };
    const formatter = new Intl.DateTimeFormat('ru-RU', options);
    const lastUpdated = formatter.format(now);
    
    // Можно добавить элемент для отображения времени обновления
    console.log(`Дайджест обновлен: ${lastUpdated}`);
}
