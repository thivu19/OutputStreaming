let frameCount = 0;
let lastFrameTime = Date.now();
let fpsArray = [];
let ws = null; // Declare WebSocket globally to manage its state

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

    const frameImg = document.getElementById("frame");

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
            if (data.frame) {
                displayFrame(data.frame, data.tag); // Get frame and tag of the image
            }
            /* 
            // Only process frame packets for a certain link
            if (data.type === "frame" && data.data) {
                // Base64 PNG → display in <img>
                frameImg.src = `data:image/png;base64,${data.data}`;
            }
            */
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
function displayFrame(base64Frame, tag) {
    const stream = liveStreamSelect.value;   
    
    // Only show frames matching the user-selected live stream
    if (tag !== stream) {
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
    frameImg.className = 'active';
    
    // Update resolution on first load
    if (!frameImg.onload) {
        frameImg.onload = () => {
            resolutionEl.textContent = frameImg.naturalWidth + 'x' + frameImg.naturalHeight;
            frameImg.onload = null; // Remove handler after execution
        };
    }
}