import os
import sys
import subprocess
import uuid
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

app = FastAPI()

# --- GLOBAL STATUS TRACKER ---
# This variable stores the live progress
current_job = {
    "progress": 0,
    "status": "Idle"
}

# --- Config ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

FFMPEG_DIR = r"C:\ffmpeg\bin"
os.environ["PATH"] += os.pathsep + FFMPEG_DIR

def cleanup_old_files():
    now = time.time()
    cutoff = 86400
    try:
        for filename in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(file_path):
                if now - os.path.getmtime(file_path) > cutoff:
                    os.remove(file_path)
    except: pass

cleanup_old_files()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoRequest(BaseModel):
    url: str

# ✅ NEW: Status Endpoint
@app.get("/status")
def get_status():
    return current_job

# ⚠️ Note: Removed 'async' so this runs in a thread (allowing /status to work)
@app.post("/process")
def process_audio(request: VideoRequest):
    global current_job
    print(f"\n🧠 AI Request for: {request.url}")
    
    # Reset Status
    current_job["progress"] = 5
    current_job["status"] = "Starting..."

    video_id = str(uuid.uuid4())[:8]
    raw_path = os.path.join(OUTPUT_DIR, f"{video_id}_raw.wav")
    
    # 1. Download
    current_job["progress"] = 10
    current_job["status"] = "Downloading Audio..."
    print(f"   [1/3] Downloading...")
    
    dl_command = [
        "yt-dlp",
        "--ffmpeg-location", f"{FFMPEG_DIR}\\ffmpeg.exe",
        "--force-ipv4",
        "--no-playlist",
        "-f", "bestaudio",
        "--force-overwrites",
        "-x", "--audio-format", "wav",
        "--postprocessor-args", "-ac 2 -ar 44100", 
        "-o", raw_path,
        request.url
    ]
    
    try:
        subprocess.run(dl_command, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        current_job["status"] = "Error: Download Failed"
        current_job["progress"] = 0
        raise HTTPException(status_code=500, detail="Download failed")

    # 2. AI Separation
    current_job["progress"] = 40
    current_job["status"] = "Running AI Separation..."
    print(f"   [2/3] Running AI separation...")
    
    ai_command = [
        sys.executable, "-m", "spleeter", "separate",
        "-p", "spleeter:2stems", 
        "-o", OUTPUT_DIR,
        "-d", "3600",
        raw_path
    ]

    result = subprocess.run(ai_command, check=False, capture_output=True)
    
    if result.returncode != 0:
        current_job["status"] = "Error: AI Failed"
        current_job["progress"] = 0
        raise HTTPException(status_code=500, detail="AI Processing Failed.")

    # 3. Conversion
    current_job["progress"] = 80
    current_job["status"] = "Optimizing Audio..."
    print(f"   [3/3] Optimizing...")
    
    spleeter_folder = os.path.join(OUTPUT_DIR, f"{video_id}_raw")
    vocals_wav = os.path.join(spleeter_folder, "vocals.wav")
    final_mp3 = os.path.join(OUTPUT_DIR, f"{video_id}_vocals.mp3")

    if os.path.exists(vocals_wav):
        convert_cmd = [
            f"{FFMPEG_DIR}\\ffmpeg.exe", "-y",
            "-i", vocals_wav,
            "-b:a", "320k",
            "-map", "0:a",
            final_mp3
        ]
        subprocess.run(convert_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Cleanup
        try:
            if os.path.exists(raw_path): os.remove(raw_path)
            if os.path.exists(spleeter_folder): 
                import shutil
                shutil.rmtree(spleeter_folder)
        except: pass
            
    else:
        current_job["status"] = "Error: File Missing"
        raise HTTPException(status_code=500, detail="Vocals file missing.")

    # Finish
    current_job["progress"] = 100
    current_job["status"] = "Done!"
    
    return {
        "status": "success", 
        "download_url": f"http://127.0.0.1:8000/download/{video_id}_vocals.mp3"
    }

@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    return HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)