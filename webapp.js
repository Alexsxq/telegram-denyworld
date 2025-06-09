// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Расширяем WebApp на весь экран
tg.expand();

// Получаем данные пользователя Telegram
const user = tg.initDataUnsafe?.user;

// Функция для отправки данных на сервер
async function sendData(endpoint, data = {}) {
    try {
        const response = await fetch(`https://api.denyworld.com/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Telegram-Init-Data': window.Telegram.WebApp.initData
            },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        return { success: false, error: error.message };
    }
}

// Функция для загрузки данных профиля
async function loadProfileData() {
    if (!user) return;
    
    const data = await sendData('profile', {
        telegram_id: user.id
    });
    
    if (data.success) {
        // Обновляем UI с данными профиля
        updateProfileUI(data.profile);
    } else {
        showError(data.error || 'Не удалось загрузить профиль');
    }
}

// Функция для обновления UI профиля
function updateProfileUI(profile) {
    if (!profile) return;
    
    // Пример обновления элементов на странице профиля
    const avatarElement = document.getElementById('profile-avatar');
    const nameElement = document.getElementById('profile-name');
    const statusElement = document.getElementById('profile-status');
    
    if (avatarElement) {
        avatarElement.src = `https://mc-heads.net/avatar/${profile.minecraft_username}`;
    }
    
    if (nameElement) {
        nameElement.textContent = profile.minecraft_username;
    }
    
    if (statusElement) {
        statusElement.textContent = profile.online ? 'Онлайн' : 'Оффлайн';
        statusElement.className = profile.online ? 'status-online' : 'status-offline';
    }
    
    // Обновление статистики
    const killsElement = document.getElementById('stat-kills');
    const deathsElement = document.getElementById('stat-deaths');
    const kdElement = document.getElementById('stat-kd');
    const playtimeElement = document.getElementById('stat-playtime');
    
    if (killsElement) killsElement.textContent = profile.kills || 0;
    if (deathsElement) deathsElement.textContent = profile.deaths || 0;
    if (kdElement) kdElement.textContent = (profile.kills / (profile.deaths || 1)).toFixed(2);
    if (playtimeElement) playtimeElement.textContent = formatPlaytime(profile.playtime);
}

// Форматирование времени игры
function formatPlaytime(minutes) {
    if (!minutes) return '0ч';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
}

// Функция для показа ошибок
function showError(message) {
    // Можно реализовать красивый toast или alert
    console.error(message);
    alert(`Ошибка: ${message}`);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Если это страница профиля - загружаем данные
    if (window.location.pathname.includes('profile.html')) {
        loadProfileData();
    }
    
    // Можно добавить другие инициализации для разных страниц
});

// Экспортируем функции для использования в других файлах
window.DenyWorldApp = {
    sendData,
    loadProfileData,
    tg,
    user
};
