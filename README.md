# Haram-Music-Removal
A Chrome Extension that uses AI to isolate vocals from YouTube videos.
# 🎵 YouTube Vocal Isolator AI

A powerful Chrome Extension that uses AI (Spleeter) to isolate vocals from any YouTube video in real-time.

## 🚀 Features
- **One-Click Isolation:** Just click the button on any YouTube video.
- **AI-Powered:** Uses Spleeter AI to separate music from vocals.
- **Zero Latency:** Converts audio to high-quality MP3 for instant playback.
- **Secure:** Runs locally on your machine (Privacy focused).

## 🛠️ Installation Guide

### Part 1: The Server (Backend)
1. Download this repository as a ZIP.
2. Install **Python** and **FFmpeg** on your computer.
3. Open the `Server` folder.
4. Double-click `Start_Server.bat`.
   - *A black window will open. Keep this open!*

### Part 2: The Extension (Frontend)
1. Open Google Chrome or Brave.
2. Go to `chrome://extensions`.
3. Turn on **Developer Mode** (Top right switch).
4. Click **Load Unpacked**.
5. Select the `Extension` folder from this project.

## 🎮 How to Use
1. Run `Start_Server.bat`.
2. Run `Launch_Tool.bat` (This opens Brave with special permissions).
3. Go to a YouTube music video.
4. Click the **🎵 Extension Icon**.
5. Watch the progress bar... and enjoy the isolated vocals!

## ⚠️ Requirements
- Windows 10/11
- Python 3.8+
- FFmpeg installed and added to Path.
