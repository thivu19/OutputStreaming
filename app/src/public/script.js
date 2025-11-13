// Example HLS stream (replace with .m3u8 URL)
document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket(`ws://${window.location.host}`);
    const img = document.getElementById("video-frame");

    socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "frame") {
        img.src = `data:image/jpeg;base64,${msg.data}`;
    }
    };
});