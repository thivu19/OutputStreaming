import express from "express";
import { WebSocketServer } from "ws";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 8080;

// Serve frontend files
app.use(express.static("public"));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Store the latest frame for each stream (e.g., {"480p": base64_data})
const latestFrames = {};
// Store clients by their stream endpoint
const streamClients = {};

// WebSocket setup
const wss = new WebSocketServer({ noServer: true });

// Function to broadcast a frame to clients connected to a specific endpoint
function broadcast(endpoint, frame) {
    const clients = streamClients[endpoint] || [];
    clients.forEach((client) => {
        if (client.readyState === 1) { // 1 means OPEN
            client.send(JSON.stringify({
                frame: frame     // includes frame, topic, resolution
            }));
        }
    });
}

// Function to handle a POST request and trigger broadcast
function handlePost(endpoint) {
    return (req, res) => {
        const { frame, topic, resolution } = req.body;
        if (!frame) return res.status(400).send("Missing frame data");
        
        latestFrames[endpoint] = {
          frame,
          topic,
          resolution
        };
        
        console.log(
            `Received frame for ${endpoint} (resolution=${resolution}, topic=${topic})`
        );

        broadcast(endpoint, latestFrames[endpoint]);
        res.status(200).send("Frame received");
    };
}

// 3 endpoint (256p, 720p, 1080p)
// REST endpoints for video processors to POST frames
app.post("/frame/256p", handlePost("frame/256p"));
app.post("/frame/720p", handlePost("frame/720p"));
app.post("/frame/1080p", handlePost("frame/1080p"));

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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;            // '/frame/256p'
    const endpoint = path.substring(1);   // 'frame/256p'

    // Check if the requested path is a valid stream endpoint
    if (endpoint in latestFrames) {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);

            // Add the new client to the list for this specific stream
            if (!streamClients[endpoint]) {
                streamClients[endpoint] = [];
            }
            streamClients[endpoint].push(ws);

            console.log(`Client connected to WebSocket endpoint: ${path}`);

            // Send the latest frame immediately on connection
            if (latestFrames[endpoint]) {
                ws.send(JSON.stringify({
                    frame: latestFrames[endpoint]
                }));
            }

            // Handle client disconnection
            ws.on("close", () => {
                const clients = streamClients[endpoint] || [];
                const index = clients.indexOf(ws);
                if (index > -1) clients.splice(index, 1);
                console.log(`Client disconnected: ${endpoint}`);
            });
        });
    } else {
        socket.destroy();
    }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send("Not Found");
});