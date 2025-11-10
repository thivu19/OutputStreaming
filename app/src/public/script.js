// Example HLS stream (replace with .m3u8 URL)
document.addEventListener('DOMContentLoaded', function() {
    var player = new Clappr.Player({
        source: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // HLS playlist
        parentId: "#player",
        autoPlay: false,
        width: "100%",
        height: 360
    });
});