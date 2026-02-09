const CLIENT_ID = 'QPbV5Ck8b062jowtT7RNA8ihea9XxwhF';
const widget = SC.Widget(document.getElementById('sc-widget'));
lucide.createIcons();

// Функция поиска
async function fetchMusic(query = 'Top Hits') {
    const container = document.getElementById('track-container');
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; opacity:0.6;">Ищем музыку...</div>';
    
    // Используем v2 API (он лучше работает с поиском)
    const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=16`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('CORS/API Error');
        const data = await response.json();
        
        container.innerHTML = '';
        if (data.collection.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; text-align:center;">Ничего не найдено</div>';
            return;
        }

        data.collection.forEach(t => {
            // Улучшенная логика подбора обложки
            let art = t.artwork_url ? t.artwork_url.replace('large', 't500x500') : (t.user.avatar_url || '');
            if (art.includes('default_avatar')) art = 'https://via.placeholder.com/500?text=No+Cover';

            const card = document.createElement('div');
            card.className = 'track-card';
            card.innerHTML = `
                <img src="${art}" loading="lazy" onerror="this.src='https://via.placeholder.com/500?text=Error'">
                <div class="p-title" style="font-weight:600; margin-top:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.title}</div>
                <div class="p-artist" style="color:#888; font-size:12px;">${t.user.username}</div>
            `;

            card.onclick = () => {
                // Обновляем плеер
                document.getElementById('p-title').innerText = t.title;
                document.getElementById('p-artist').innerText = t.user.username;
                document.getElementById('p-art').src = art;
                
                // Загружаем в виджет
                widget.load(t.permalink_url, { auto_play: true, show_artwork: false });
                
                // Интеграция с Dynamic Island / Системой
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: t.title,
                        artist: t.user.username,
                        artwork: [{ src: art, sizes: '512x512', type: 'image/png' }]
                    });
                }
            };
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#ff4444;">Ошибка API. Проверьте Redirect URI в настройках SoundCloud.</div>`;
    }
}

// Поиск по Enter
const searchInput = document.getElementById('sc-search');
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchMusic(e.target.value);
            document.getElementById('view-title').innerText = `Поиск: ${e.target.value}`;
        }
    });
}

// Плей/Пауза
document.getElementById('play-pause').onclick = () => widget.toggle();

// Запуск при загрузке
window.onload = () => fetchMusic('Phonk');
