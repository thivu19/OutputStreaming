let frameCount = 0;
let lastFrameTime = Date.now();
let fpsArray = [];
let ws = null; // Declare WebSocket globally to manage its state

const waitingText = document.getElementById('waiting');

const frameImg = document.getElementById('frame');
const frameCountEl = document.getElementById('frameCount');
const fpsEl = document.getElementById('fps');
const latencyEl = document.getElementById('latency');
const resolutionEl = document.getElementById('resolution');

const liveStreamSelect = document.getElementById('livestream-select');
const resolutionSelect = document.getElementById('resolution-select');
const connectButton = document.getElementById('connectBttn');

document.addEventListener('DOMContentLoaded', function() {
    connectButton.addEventListener('click', connectToStream);
});

function connectToStream() {
    // If a connection already exists, close it first
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("Closing existing WebSocket connection.");
        ws.close();
    }

    const resolution = resolutionSelect.value;

    // Construct the endpoint path: e.g., /frame/480p
    const endpoint = `/frame/${resolution}`;

    // Construct the full WebSocket URL
    const wsUrl = `ws://${window.location.host}${endpoint}`;
    console.log(`Attempting to connect to: ${wsUrl}`);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log("Connected to output streaming WebSocket");
        // Reset stats on new connection
        frameCount = 0;
        fpsArray = [];
        frameCountEl.textContent = '0';
        resolutionEl.textContent = 'N/A';
    };

    ws.onmessage = (msg) => {
        try {
            const data = JSON.parse(msg.data);

            // New structure: { frame: { frame: "...", topic: "...", resolution: "..." } }
            if (data.frame && data.frame.frame) {
                displayFrame(
                    data.frame.frame, 
                    data.frame.topic, 
                    data.frame.resolution
                );
            }
        } catch (e) {
            console.error("Error parsing WS data:", e);
        }
    };

    ws.onerror = (err) => {
        console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
        console.log("WebSocket disconnected");
    };
}

// Display the frame stats and frame image
function displayFrame(base64Frame, topic, res) {
    const stream = liveStreamSelect.value;   
    console.log("Selected livestream: " + stream);
    console.log("Sent livestream: " + topic);

    // Only show frames matching the user-selected live stream
    if (topic !== stream) {
        return;     // Ignore this frame
    }

    const now = Date.now();
    const latency = now - lastFrameTime;
    lastFrameTime = now;

    // Update frame count
    frameCount++;
    frameCountEl.textContent = frameCount;

    // Calculate FPS
    fpsArray.push(now);
    fpsArray = fpsArray.filter(time => now - time < 1000);
    fpsEl.textContent = fpsArray.length;

    // Update latency
    latencyEl.textContent = latency + 'ms';

    // Display image
    frameImg.src = `data:image/png;base64,${base64Frame}`;
    frameImg.classList.add("active");

    waitingText.classList.add("active");
    
    // Only set resolution once
    if (frameCount === 1) {
        frameImg.onload = () => {
            resolutionEl.textContent = `${frameImg.naturalWidth}x${frameImg.naturalHeight}`;
        };
    }
}