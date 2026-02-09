lucide.createIcons();

const widget = SC.Widget(document.getElementById('sc-widget'));
let CLIENT_ID = null;
let isPlaying = false;

/* ===== CLIENT ID ===== */

async function getClientId() {
    const res = await fetch('https://soundcloud.com');
    const html = await res.text();
    const match = html.match(/client_id":"(.*?)"/);
    return match ? match[1] : null;
}

/* ===== SKELETON ===== */

function showSkeleton() {
    const c = document.getElementById('track-container');
    c.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const d = document.createElement('div');
        d.className = 'track-card skeleton';
        c.appendChild(d);
    }
}

/* ===== FETCH ===== */

async function fetchMusic(query = 'Pop') {
    const container = document.getElementById('track-container');
    showSkeleton();

    if (!CLIENT_ID) CLIENT_ID = await getClientId();
    if (!CLIENT_ID) {
        container.innerHTML = 'Ошибка SoundCloud';
        return;
    }

    const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(
        query
    )}&client_id=${CLIENT_ID}&limit=24`;

    const res = await fetch(url);
    const data = await res.json();
    renderTracks(data.collection);
}

/* ===== RENDER ===== */

function renderTracks(tracks) {
    const container = document.getElementById('track-container');
    container.innerHTML = '';

    tracks.forEach(track => {
        let art = track.artwork_url
            ? track.artwork_url.replace('large', 't500x500')
            : track.user.avatar_url;

        const card = document.createElement('div');
        card.className = 'track-card';
        card.innerHTML = `
            <img src="${art}">
            <div class="p-title">${track.title}</div>
            <div class="p-artist">${track.user.username}</div>
        `;

        card.onclick = () =>
            playTrack(track.permalink_url, track.title, track.user.username, art);

        container.appendChild(card);
    });
}

/* ===== PLAYER ===== */

function playTrack(url, title, artist, art) {
    document.getElementById('p-title').innerText = title;
    document.getElementById('p-artist').innerText = artist;
    document.getElementById('p-art').src = art;

    widget.load(url, { auto_play: true });
    updatePlayIcon(true);
    isPlaying = true;
}

/* ===== CONTROLS ===== */

const playBtn = document.getElementById('play-pause');

playBtn.onclick = () => {
    widget.isPaused(p => {
        p ? widget.play() : widget.pause();
        updatePlayIcon(p);
        isPlaying = p;
    });
};

function updatePlayIcon(playing) {
    playBtn.innerHTML = playing
        ? '<i data-lucide="pause"></i>'
        : '<i data-lucide="play"></i>';
    lucide.createIcons();
}

/* ===== PROGRESS ===== */

widget.bind(SC.Widget.Events.PLAY_PROGRESS, e => {
    document.getElementById('progress-fill').style.width =
        e.relativePosition * 100 + '%';
});

document.getElementById('progress-container').onclick = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = (e.clientX - r.left) / r.width;
    widget.getDuration(d => widget.seekTo(d * p));
};

/* ===== SEARCH + WAVE ===== */

document.getElementById('sc-search').onkeydown = e => {
    if (e.key === 'Enter') {
        fetchMusic(e.target.value);
        document.getElementById('view-title').innerText =
            'Результаты: ' + e.target.value;
    }
};

const wave = () => {
    const g = ['Phonk', 'Lo-fi', 'Night Drive', 'Synthwave', 'Deep House'];
    const r = g[Math.floor(Math.random() * g.length)];
    fetchMusic(r);
    document.getElementById('view-title').innerText = 'Твоя волна: ' + r;
};

document.getElementById('wave-desktop').onclick = wave;
document.getElementById('wave-mobile').onclick = wave;

/* ===== START ===== */

window.onload = () => fetchMusic('Pop Hits');
