import express from "express";
import { WebSocketServer } from "ws";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 8080;

// Serve frontend files
app.use(express.static("public"));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// WebSocket setup
const wss = new WebSocketServer({ noServer: true });
let latestFrame = null;

// 3 endpoint (480p, 720p, 1080p)
// make function to filter NYC and bear (bear.png or NYC.png) capitalize everything and check
// Endpoint for video processor to POST 480p frames
app.post("/480p", (req, res) => {
  const { frame } = req.body; // frame = base64 image or buffer
  if (!frame) return res.status(400).send("Missing frame data");
  latestFrame = frame;
  console.log("Received new 480p frame");
  // Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "frame", data: frame }));
    }
  }); 
})

// Endpoint for video processor to POST 720p frames
app.post("/720p", (req, res) => {
  const { frame } = req.body; // frame = base64 image or buffer
  if (!frame) return res.status(400).send("Missing frame data");
  latestFrame = frame;
  console.log("Received new 720p frame");
  // Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "frame", data: frame }));
    }
  }); 
})

// Endpoint for video processor to POST 1080p frames
app.post("/1080p", (req, res) => {
  const { frame } = req.body; // frame = base64 image or buffer
  if (!frame) return res.status(400).send("Missing frame data");
  latestFrame = frame;
  console.log("Received new 1080p frame");
  // Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "frame", data: frame }));
    }
  }); 
})

/*
// Endpoint for video processor to POST frames
app.post("/frame", (req, res) => {
  const { frame } = req.body; // frame = base64 image or buffer
  if (!frame) return res.status(400).send("Missing frame data");

  latestFrame = frame;
  console.log("Received new frame");

  // Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "frame", data: frame }));
    }
  });

  res.status(200).send("Frame received");
});
*/

// Serve main page
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

// -----------------
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false, // SSL is not needed for internal cluster communication
});

app.get('/test-db', async (req, res) => {
  try {
    // Perform a simple query to test the connection
    const result = await pool.query('SELECT * FROM test_table;'); // Use your test table
    
    res.status(200).json({
      status: "success",
      message: "Connected to DB and read data!",
      data: result.rows
    });

  } catch (e) {
    // If the connection fails, this will catch it
    res.status(500).json({
      status: "error",
      message: "Failed to connect to the database.",
      error: e.message
    });
  }
});

// --------------

// WebSocket upgrade
const server = app.listen(PORT, () => {
  console.log(`OutputStreaming server running on port ${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send("Not Found");
});