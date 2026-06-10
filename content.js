let isolatedAudio = new Audio();
let isIsoMode = false;
let currentVideoUrl = "";
let cachedAudioUrl = null;
let syncInterval = null;

// --- ICONS (SVG) ---

// 🎵 Music Note (For "Original Mode")
const ICON_MUSIC_ON = `
<svg viewBox="0 0 24 24" style="width:100%; height:100%;">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
</svg>`;

// 🚫 Music Crossed Out (For "Isolation Mode")
const ICON_NO_MUSIC = `
<svg viewBox="0 0 24 24" style="width:100%; height:100%;">
    <path d="M4.27 3L3 4.27 12 13.27v2.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73L6.73 3 4.27 3zM14 7h4V3h-6v5.18l2 2z"/>
    <path d="M0 0h24v24H0z" fill="none"/> 
    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" />
</svg>`;

// ⏳ Spinner
const ICON_SPINNER = `
<svg class="yi-spinner" viewBox="0 0 50 50">
  <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
</svg>`;

// --- INJECTION ---
function injectButton() {
    if (document.getElementById('yi-voice-btn')) return;

    // Wait for Settings Button
    const settingsBtn = document.querySelector('.ytp-settings-button');
    if (!settingsBtn) return;
    const rightControls = settingsBtn.parentNode;

    // Create Button
    const btn = document.createElement('button');
    btn.id = 'yi-voice-btn';
    btn.className = 'ytp-button'; 
    btn.title = "Isolate Vocals";
    
    // DEFAULT STATE: Music ON (Blue)
    btn.innerHTML = ICON_MUSIC_ON;
    btn.classList.add('state-original'); // Adds Blue Color via CSS

    btn.onclick = async () => {
        const ytVideo = document.querySelector('video');
        if (!ytVideo) return;

        // SCENARIO: Turn OFF Isolation (Back to Music)
        if (isIsoMode) {
            toggleToOriginal(ytVideo, btn);
            return;
        }

        // SCENARIO: Turn ON Isolation (Remove Music)
        if (cachedAudioUrl) {
            toggleToVocals(cachedAudioUrl, ytVideo, btn);
            return;
        }

        // LOADING STATE
        btn.innerHTML = ICON_SPINNER;
        btn.disabled = true;
        // Keep it aligned during load
        btn.classList.remove('state-original', 'state-isolated'); 

        try {
            const response = await fetch('http://127.0.0.1:8000/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: window.location.href })
            });

            if (!response.ok) throw new Error("Backend Error");
            const data = await response.json();

            cachedAudioUrl = data.download_url;
            toggleToVocals(cachedAudioUrl, ytVideo, btn);

        } catch (err) {
            console.error(err);
            btn.innerHTML = '❌';
            setTimeout(() => { toggleToOriginal(ytVideo, btn); }, 2000);
        }
    };

    rightControls.insertBefore(btn, settingsBtn);
}

// --- SWITCHING LOGIC ---

function toggleToVocals(url, ytVideo, btn) {
    isIsoMode = true;
    if (isolatedAudio.src !== url) isolatedAudio.src = url;

    // UI: Active Isolation (Red, No Music Icon)
    btn.innerHTML = ICON_NO_MUSIC;
    btn.classList.remove('state-original');
    btn.classList.add('state-isolated'); // Adds Red Color
    btn.title = "Vocals Only (Music Off)";
    btn.disabled = false;

    // Audio Sync
    ytVideo.muted = true;
    isolatedAudio.currentTime = ytVideo.currentTime;
    isolatedAudio.volume = ytVideo.volume;
    if (!ytVideo.paused) isolatedAudio.play().catch(e=>{});

    startSyncLoop(ytVideo);
}

function toggleToOriginal(ytVideo, btn) {
    isIsoMode = false;
    isolatedAudio.pause();
    ytVideo.muted = false;

    // UI: Original (Blue, Music Icon)
    btn.innerHTML = ICON_MUSIC_ON;
    btn.classList.remove('state-isolated');
    btn.classList.add('state-original'); // Adds Blue Color
    btn.title = "Original Audio (Music On)";
    btn.disabled = false;
    
    if (syncInterval) clearInterval(syncInterval);
}

// --- SYNC LOOP ---
function startSyncLoop(ytVideo) {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        if (!isIsoMode || !ytVideo) { clearInterval(syncInterval); return; }
        isolatedAudio.volume = ytVideo.volume;
        if (ytVideo.paused && !isolatedAudio.paused) isolatedAudio.pause();
        else if (!ytVideo.paused && isolatedAudio.paused) isolatedAudio.play().catch(e=>{});
        let drift = Math.abs(isolatedAudio.currentTime - ytVideo.currentTime);
        if (drift > 0.3) isolatedAudio.currentTime = ytVideo.currentTime;
        if (!ytVideo.muted) ytVideo.muted = true;
    }, 100);
}

// --- RESET ---
function handleNav() {
    if (window.location.href !== currentVideoUrl) {
        currentVideoUrl = window.location.href;
        isIsoMode = false;
        cachedAudioUrl = null;
        isolatedAudio.pause();
        isolatedAudio.src = "";
        const ytVideo = document.querySelector('video');
        if (ytVideo) ytVideo.muted = false;
        
        // Remove button to force re-inject
        const oldBtn = document.getElementById('yi-voice-btn');
        if (oldBtn) oldBtn.remove();
    }
}

setInterval(() => {
    handleNav();
    injectButton();
}, 500);