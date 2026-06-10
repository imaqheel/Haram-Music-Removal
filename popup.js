const btn = document.getElementById('processBtn');
const statusText = document.getElementById('status-text');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');

// 1. On Popup Open: Check if work is already happening!
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Ask server: "Are you busy right now?"
        let response = await fetch("http://127.0.0.1:8000/status");
        let data = await response.json();

        if (data.status !== "Idle" && data.progress < 100) {
            // SERVER IS BUSY -> Resume the progress bar immediately
            restoreUI(data);
            startPolling(); 
        } else if (data.progress === 100) {
            // SERVER IS DONE -> Show finished state
            showFinishedUI(data);
        }
    } catch (e) {
        statusText.innerText = "Ready to connect.";
    }
});

// 2. Button Click: Start a new job
btn.addEventListener('click', async () => {
    
    // Get Current Tab URL
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes("youtube.com/watch")) {
        statusText.innerText = "❌ Open a YouTube video first!";
        return;
    }

    // Set UI to "Loading" state
    setupLoadingUI();

    // Send Start Command
    try {
        let response = await fetch("http://127.0.0.1:8000/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: tab.url })
        });
        
        // Start checking for updates
        startPolling();

    } catch (error) {
        resetUI();
        statusText.innerText = "❌ Error: Server not running?";
    }
});

// --- Helper Functions (Keeps code clean) ---

function startPolling() {
    // Check status every 500ms
    let poller = setInterval(async () => {
        try {
            let response = await fetch("http://127.0.0.1:8000/status");
            let data = await response.json();
            
            // Update Bar and Text
            progressBar.style.width = data.progress + "%";
            statusText.innerText = data.status + ` (${data.progress}%)`;

            // If finished
            if (data.progress >= 100) {
                clearInterval(poller);
                showFinishedUI(data);
                
                // Fetch the download URL to play audio
                // Note: In a real app, you'd store the download URL in the status or a separate variable
                // For now, we assume the user just wants to see "Done"
            }
        } catch (e) {
            console.log("Polling error", e);
        }
    }, 500);
}

function setupLoadingUI() {
    btn.disabled = true;
    btn.innerText = "Processing...";
    progressContainer.style.display = "block";
    progressBar.style.width = "5%";
    statusText.innerText = "Starting engine...";
}

function restoreUI(data) {
    btn.disabled = true;
    btn.innerText = "Processing in background...";
    progressContainer.style.display = "block";
    progressBar.style.width = data.progress + "%";
    statusText.innerText = data.status + ` (${data.progress}%)`;
}

function showFinishedUI(data) {
    progressBar.style.width = "100%";
    statusText.innerText = "✅ Done! Audio is ready.";
    btn.innerText = "Isolate Again";
    btn.disabled = false;
    
    // Optional: Try to auto-play if the URL is known, 
    // or just let the user know it's done.
}

function resetUI() {
    btn.disabled = false;
    btn.innerText = "Isolate Vocals";
    progressContainer.style.display = "none";
}