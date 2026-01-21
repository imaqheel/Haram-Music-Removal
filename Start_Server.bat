@echo off
title Haram Music Removal - Server
color 0C
echo ==================================================
echo   STARTING AI SERVER... KEEP OPEN
echo ==================================================
echo.

:: 1. Go to the project folder
cd /d "D:\yt-voice-isolator\backend"

:: 2. Activate the virtual environment
call "..\venv\Scripts\activate.bat"

:: 3. Start the Python Server
python server.py

:: 4. Keep window open if it crashes
pause