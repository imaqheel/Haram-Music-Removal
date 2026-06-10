# Haram Music Removal | YouTube Vocal Isolator AI

An AI-powered Chrome Extension that isolates vocals/speech from YouTube videos in real-time, removing background music and instrumental tracks. It communicates with a local AI-powered audio processing backend (such as Spleeter or HTDemix) to fetch isolated vocal streams and syncs them seamlessly with the active video player.

---

## 🚀 Features

- **Real-Time Injection**: Seamlessly injects a custom control button (`Isolate Vocals` / `Original Audio`) directly into the YouTube video player controls bar, right next to the native settings gear.
- **Drift Synchronization Loop**: Runs a high-frequency polling loop (every 100ms) to ensure the isolated vocal track remains perfectly in sync with the video's current time, volume, and playback state.
- **Toggle State Management**: Instantly switch back to the original audio with background music, or toggle isolation back on using cached audio links to prevent duplicate processing.
- **Manifest V3 Compliant**: Built using the modern Google Chrome Extension manifest specification.

---

## 🛠️ Tech Stack

- **Extension Frontend**: JavaScript (Web Audio, DOM injection), CSS, HTML (Manifest V3)
- **Local Backend (Required)**: Python (FastAPI / Flask) running source separation models (e.g., Spleeter AI, Demucs) to host the `/process` API endpoint.

---

## 📦 Installation & Setup

### 1. Install the Chrome Extension
1. Clone or download this repository to your local machine:
   ```bash
   git clone https://github.com/imaqheel/Haram-Music-Removal.git
   ```
2. Open Google Chrome and navigate to the Extensions management page:
   - URL: `chrome://extensions/`
   - Or click the puzzle icon in the toolbar and select **Manage Extensions**.
3. Toggle the **Developer mode** switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the folder containing `manifest.json` (the cloned repository folder).
6. The extension is now installed and active!

### 2. Configure the Local Backend
The extension expects a local server running at `http://127.0.0.1:8000` to process the YouTube audio extraction:
- **Endpoint**: `POST http://127.0.0.1:8000/process`
- **Request Body**: `{ "url": "https://www.youtube.com/watch?v=..." }`
- **Response Format**: `{ "download_url": "http://127.0.0.1:8000/static/vocal_track.mp3" }`

Ensure your local Python backend is active and listening before clicking the isolation button on YouTube.

---

## ⚙️ How it Works

1. **Injection**: When you open any YouTube video, a script checks for the player controls and injects a custom button.
2. **AI Processing**: Clicking the button sends the current YouTube URL to the local backend. The backend downloads the audio, extracts the vocal-only track using AI models, and exposes a temporary audio link.
3. **Mute & Sync**: The extension mutes the YouTube video player and begins playing the isolated vocal audio file, running a background synchronization loop that matches volume, play/pause states, and corrects any playback drift exceeding 0.3 seconds.
4. **Clean Navigation**: When navigating to a new video, the script destroys the active button, stops the sync loop, unmutes the player, and prepares to re-inject for the new URL.
