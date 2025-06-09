const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Проверка данных Telegram WebApp
function verifyTelegramData(initData) {
    const secret = crypto.createHash('sha256')
        .update(process.env.TELEGRAM_BOT_TOKEN)
        .digest();
    
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    params.sort();
    const dataCheckString = Array.from(params.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    const computedHash = crypto.createHmac('sha256', secret)
        .update(dataCheckString)
        .digest('hex');
    
    return computedHash === hash;
}

// Получение профиля игрока
app.post('/profile', async (req, res) => {
    const initData = req.headers['telegram-init-data'];
    
    if (!verifyTelegramData(initData)) {
        return res.status(401).json({ success: false, error: 'Invalid Telegram data' });
    }
    
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user'));
    
    try {
        // Здесь запрос к базе данных сервера Minecraft
        const profile = await getMinecraftProfile(user.id);
        
        if (!profile) {
            return res.json({ 
                success: false, 
                error: 'Профиль не найден. Привяжите ваш Minecraft аккаунт через /setnick в игре.'
            });
        }
        
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Интеграция с LimboAuth API
app.post('/2fa/verify', async (req, res) => {
    const { telegram_id, minecraft_username, action } = req.body;
    
    if (!telegram_id || !minecraft_username || !action) {
        return res.status(400).json({ success: false, error: 'Missing parameters' });
    }
    
    try {
        // Отправка запроса к API сервера Minecraft
        const response = await fetch('http://minecraft-server:8080/api/limboauth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id,
                username: minecraft_username,
                action: action === 'approve' ? 'allow' : 'deny'
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('2FA error:', error);
        res.status(500).json({ success: false, error: 'Failed to communicate with Minecraft server' });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
