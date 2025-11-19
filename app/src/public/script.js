let frameCount = 0;
let lastFrameTime = Date.now();
let fpsArray = [];

const frameImg = document.getElementById('frame');
const frameCountEl = document.getElementById('frameCount');
const fpsEl = document.getElementById('fps');
const latencyEl = document.getElementById('latency');
const resolutionEl = document.getElementById('resolution');

document.addEventListener('DOMContentLoaded', function() {
    // Connect WebSocket automatically based on current host
    const wsUrl = `ws://${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    const frameImg = document.getElementById("frame");

    ws.onopen = () => {
        console.log("Connected to output streaming WebSocket");
    };

    ws.onmessage = (msg) => {
        try {
            const data = JSON.parse(msg.data);

            if (data.frame) {
                displayFrame(data.frame);
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
});

// Display the frame stats
function displayFrame(base64Frame) {
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
    frameImg.src = 'data:image/png;base64' + base64Frame;
    frameImg.className = 'active';
    
    // Update resolution on first load
    if (!frameImg.onload) {
        frameImg.onload = () => {
            resolutionEl.textContent = frameImg.naturalWidth + 'x' + frameImg.naturalHeight;
        };
    }
}