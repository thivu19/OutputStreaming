import express from "express";
import { WebSocketServer } from "ws";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

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

// ----------------------------------------------------
// Count of frames processed in the last interval
let framesProcessed = 0;
let logged = false;
// Unique POD ID provided by Kubernetes
const POD_ID = Math.random().toString() || "unknown";
// Directory for logs (mounted PVC)
const OUTPUT_DIR = "/data/output";

// Make directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Log file for THIS pod
const LOG_FILE = path.join(OUTPUT_DIR, `${POD_ID}_Throughput.txt`);

function getDatetimeString() {
    return new Date().toISOString().replace("T", " ").split(".")[0];
}

// Attempt to create file if not exists, else append
  fs.writeFile(LOG_FILE, "\n", { flag: "w" }, (err) => {
      if (err) console.error("Error creating throughput log:", err);
  });

function logThroughput() {
    logged = false;
    const count = framesProcessed;
    framesProcessed = 0; // Reset counter

    const logLine = `[${getDatetimeString()}] Processed ${count} frames\n`;
    
    // Attempt to create file if not exists, else append
    fs.writeFile(LOG_FILE, logLine, { flag: "a" }, (err) => {
        if (err) console.error("Error writing throughput log:", err);
    });
    console.log("Write log");
    console.log(LOG_FILE);
}
// -----------------------------------------------------

// WebSocket setup
const wss = new WebSocketServer({ noServer: true });

// PRE-REGISTER all valid stream endpoints
const VALID_ENDPOINTS = ["frame/256p", "frame/720p", "frame/1080p"];

VALID_ENDPOINTS.forEach((ep) => {
    latestFrames[ep] = null;     // allow WebSocket to connect even before first frame
    streamClients[ep] = [];      // initialize client list
});

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

        framesProcessed++;
        
        latestFrames[endpoint] = {
          frame,
          topic,
          resolution
        };
        
        console.log(
            `Received frame for ${endpoint} (resolution=${resolution}, topic=${topic})`
        );

        if (!logged) {
          logged = true;
          // Schedule next log
          console.log("10 sec has pass");
          setTimeout(logThroughput, 10000); // 10 seconds
        }

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
    const path = url.pathname;            // '/frame/720p'
    const endpoint = path.substring(1);   // 'frame/720p'

    if (VALID_ENDPOINTS.includes(endpoint)) {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);

            streamClients[endpoint].push(ws);
            console.log(`Client connected to WebSocket endpoint: ${endpoint}`);

            // Send latest frame IF EXISTS
            if (latestFrames[endpoint]) {
                ws.send(JSON.stringify({
                    frame: latestFrames[endpoint]
                }));
            }

            ws.on("close", () => {
                const clients = streamClients[endpoint];
                streamClients[endpoint] = clients.filter(c => c !== ws);
                console.log(`WebSocket disconnected: ${endpoint}`);
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