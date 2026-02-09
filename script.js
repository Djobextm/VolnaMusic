// Твой Client ID из настроек SoundCloud
const CLIENT_ID = 'QPbV5Ck8b062jowtT7RNA8ihea9XxwhF';
const widgetIframe = document.getElementById('sc-widget');
const widget = SC.Widget(widgetIframe);

// Инициализация иконок
lucide.createIcons();

let isPlaying = false;

// --- 1. ФУНКЦИЯ ПОИСКА (ГЛАВНЫЙ ДВИГАТЕЛЬ) ---
async function fetchMusic(query = 'Top Hits') {
    const container = document.getElementById('track-container');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; opacity:0.5;">Ищем волну...</div>';

    // Используем v2 API, так как он стабильнее для поиска без авторизации пользователя
    const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=20`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка сети или Client ID');
        
        const data = await response.json();
        renderTracks(data.collection);
    } catch (error) {
        console.error("Ошибка при поиске:", error);
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:20px;">
                <p>Ошибка API. Проверьте, что в настройках SoundCloud прописан Redirect URI:</p>
                <code style="background:#222; padding:5px;">https://djobextm.github.io/VolnaMusic/</code>
            </div>`;
    }
}

// Рендеринг карточек треков
function renderTracks(tracks) {
    const container = document.getElementById('track-container');
    container.innerHTML = '';

    if (!tracks || tracks.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">Ничего не найдено</div>';
        return;
    }

    tracks.forEach(track => {
        // Выбираем лучшую доступную обложку
        let art = track.artwork_url ? track.artwork_url.replace('large', 't500x500') : (track.user.avatar_url || '');
        if (art.includes('default_avatar')) art = 'https://via.placeholder.com/500?text=No+Cover';

        const card = document.createElement('div');
        card.className = 'track-card';
        card.innerHTML = `
            <img src="${art}" loading="lazy" onerror="this.src='https://via.placeholder.com/500?text=Error'">
            <div class="p-title" style="font-weight:600; margin-top:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${track.title}</div>
            <div class="p-artist" style="color:#888; font-size:12px;">${track.user.username}</div>
        `;

        card.onclick = () => playTrack(track.permalink_url, track.title, track.user.username, art);
        container.appendChild(card);
    });
}

// --- 2. УПРАВЛЕНИЕ ПЛЕЕРОМ ---
function playTrack(url, title, artist, art) {
    // Обновляем мини-плеер
    document.getElementById('p-title').innerText = title;
    document.getElementById('p-artist').innerText = artist;
    document.getElementById('p-art').src = art;

    // Загружаем трек в скрытый виджет
    widget.load(url, {
        auto_play: true,
        show_artwork: false,
        buying: false,
        sharing: false,
        download: false
    });

    isPlaying = true;
    updatePlayIcon(true);
    
    // Системное управление (Dynamic Island / Экран блокировки)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            artwork: [{ src: art, sizes: '512x512', type: 'image/png' }]
        });
    }
}

// Кнопка Play/Pause
const playPauseBtn = document.getElementById('play-pause');
playPauseBtn.onclick = () => {
    widget.toggle();
    isPlaying = !isPlaying;
    updatePlayIcon(isPlaying);
};

function updatePlayIcon(playing) {
    playPauseBtn.innerHTML = playing ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
    lucide.createIcons();
}

// Отслеживание прогресса
widget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
    const progress = data.relativePosition * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
});

// Клик по полосе прогресса (перемотка)
document.getElementById('progress-container').onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    widget.getDuration((duration) => {
        widget.seekTo(duration * pos);
    });
};

// --- 3. ПОИСК И КНОПКИ ---
const searchInput = document.getElementById('sc-search');
searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
        fetchMusic(e.target.value);
        document.getElementById('view-title').innerText = `Результаты: ${e.target.value}`;
        searchInput.blur(); // Убираем клавиатуру на мобилках
    }
};

// Функция "Моя волна"
const startWave = () => {
    const genres = ['Phonk', 'Cyberpunk', 'Lo-fi', 'Deep House', 'Night Drive'];
    const random = genres[Math.floor(Math.random() * genres.length)];
    fetchMusic(random);
    document.getElementById('view-title').innerText = `Твоя волна: ${random}`;
};

document.getElementById('wave-desktop').onclick = startWave;
document.getElementById('wave-mobile').onclick = startWave;

// --- 4. ЗАПУСК ПРИ ЗАГРУЗКЕ ---
window.onload = () => {
    fetchMusic('Pop Hits');
};
