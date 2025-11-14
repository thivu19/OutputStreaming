document.addEventListener('DOMContentLoaded', function() {
    function startStreaming() {
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

            // Only process frame packets
            if (data.type === "frame" && data.data) {
            // Base64 PNG → display in <img>
            frameImg.src = `data:image/png;base64,${data.data}`;
            }
        } catch (e) {
            console.error("Error parsing WS data:", e);
        }
        };

        ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        };
    } 
});