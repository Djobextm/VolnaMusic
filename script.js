// Используем твой ID из скриншота
const CLIENT_ID = 'QPbV5Ck8b062jowtT7RNA8ihea9XxwhF';
const widget = SC.Widget(document.getElementById('sc-widget'));
lucide.createIcons();

let isPlaying = false;

// Функция для обхода ошибки API
async function fetchMusic(query = 'Top Hits') {
    const container = document.getElementById('track-container');
    container.innerHTML = '<p>Загрузка реальных треков...</p>';
    
    // Используем публичный поисковый эндпоинт, который не требует OAuth
    const searchUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=10`;

    try {
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.collection && data.collection.length > 0) {
            render(data.collection); // Рендерим реальные данные из ответа
        } else {
            throw new Error('Ничего не найдено');
        }
    } catch (e) {
        console.error("Ошибка API:", e);
        // Только если всё совсем плохо, показываем заглушки
        renderDefaultTracks(); 
    }
}
