import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

// Serve frontend files
app.use(express.static("public"));

// Example endpoint to serve HLS stream
app.get("/stream/:video", (req, res) => {
  const video = req.params.video;
  console.log(`Request for video stream: ${video}`);
  res.redirect(`https://test-streams.mux.dev/${video}/${video}.m3u8`);
});

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(PORT, () => {
  console.log(`OutputStreaming server running on port ${PORT}`);
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});