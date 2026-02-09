/* =====================================================
   INIT
===================================================== */

lucide.createIcons();

const widget = SC.Widget(document.getElementById('sc-widget'));

let CLIENT_ID = null;
let isPlaying = false;

/* =====================================================
   GET CLIENT ID (через CORS proxy — работает на GH Pages)
===================================================== */

async function getClientId() {
    try {
        const res = await fetch(
            'https://api.allorigins.win/raw?url=' +
            encodeURIComponent('https://soundcloud.com')
        );
        const html = await res.text();
        const match = html.match(/client_id":"(.*?)"/);
        return match ? match[1] : null;
    } catch (e) {
        console.error('ClientID error:', e);
        return null;
    }
}

/* =====================================================
   SKELETON LOADING
===================================================== */

function showSkeleton() {
    const c = document.getElementById('track-container');
    c.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const d = document.createElement('div');
        d.className = 'track-card skeleton';
        c.appendChild(d);
    }
}

/* =====================================================
   FETCH MUSIC
===================================================== */

async function fetchMusic(query = 'Pop Hits') {
    const container = document.getElementById('track-container');
    showSkeleton();

    if (!CLIENT_ID) {
        CLIENT_ID = await getClientId();
    }

    if (!CLIENT_ID) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;opacity:.6;padding:40px">
                SoundCloud API недоступен 😔<br>
                Попробуй позже
            </div>`;
        return;
    }

    try {
        const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(
            query
        )}&client_id=${CLIENT_ID}&limit=24`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.collection || !data.collection.length) {
            container.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;opacity:.6">
                    Ничего не найдено
                </div>`;
            return;
        }

        renderTracks(data.collection);
    } catch (e) {
        console.error('Fetch error:', e);
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;opacity:.6">
                Ошибка загрузки
            </div>`;
    }
}

/* =====================================================
   RENDER TRACKS
===================================================== */

function renderTracks(tracks) {
    const container = document.getElementById('track-container');
    container.innerHTML = '';

    tracks.forEach(track => {
        let art = track.artwork_url
            ? track.artwork_url.replace('large', 't500x500')
            : track.user.avatar_url || '';

        if (!art || art.includes('default_avatar')) {
            art = 'https://via.placeholder.com/500?text=No+Cover';
        }

        const card = document.createElement('div');
        card.className = 'track-card';
        card.innerHTML = `
            <img src="${art}" loading="lazy">
            <div class="p-title">${track.title}</div>
            <div class="p-artist">${track.user.username}</div>
        `;

        card.onclick = () =>
            playTrack(
                track.permalink_url,
                track.title,
                track.user.username,
                art
            );

        container.appendChild(card);
    });
}

/* =====================================================
   PLAYER
===================================================== */

function playTrack(url, title, artist, art) {
    document.getElementById('p-title').innerText = title;
    document.getElementById('p-artist').innerText = artist;
    document.getElementById('p-art').src = art;

    widget.load(url, {
        auto_play: true,
        show_artwork: false,
        sharing: false,
        download: false
    });

    isPlaying = true;
    updatePlayIcon(true);

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title,
            artist,
            artwork: [{ src: art, sizes: '512x512', type: 'image/png' }]
        });
    }
}

/* =====================================================
   PLAY / PAUSE
===================================================== */

const playPauseBtn = document.getElementById('play-pause');

playPauseBtn.onclick = () => {
    widget.isPaused(paused => {
        if (paused) {
            widget.play();
            isPlaying = true;
            updatePlayIcon(true);
        } else {
            widget.pause();
            isPlaying = false;
            updatePlayIcon(false);
        }
    });
};

function updatePlayIcon(playing) {
    playPauseBtn.innerHTML = playing
        ? '<i data-lucide="pause"></i>'
        : '<i data-lucide="play"></i>';
    lucide.createIcons();
}

/* =====================================================
   PROGRESS BAR
===================================================== */

widget.bind(SC.Widget.Events.PLAY_PROGRESS, data => {
    document.getElementById('progress-fill').style.width =
        data.relativePosition * 100 + '%';
});

document.getElementById('progress-container').onclick = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    widget.getDuration(d => widget.seekTo(d * pos));
};

/* =====================================================
   SEARCH
===================================================== */

const searchInput = document.getElementById('sc-search');

searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        fetchMusic(e.target.value);
        document.getElementById('view-title').innerText =
            'Результаты: ' + e.target.value;
        searchInput.blur();
    }
});

/* =====================================================
   WAVE
===================================================== */

const startWave = () => {
    const genres = [
        'Phonk',
        'Lo-fi',
        'Night Drive',
        'Synthwave',
        'Deep House',
        'Trap'
    ];
    const random = genres[Math.floor(Math.random() * genres.length)];
    fetchMusic(random);
    document.getElementById('view-title').innerText =
        'Твоя волна: ' + random;
};

document.getElementById('wave-desktop').onclick = startWave;
document.getElementById('wave-mobile').onclick = startWave;

/* =====================================================
   START
===================================================== */

window.addEventListener('load', () => {
    fetchMusic('Pop Hits');
});
