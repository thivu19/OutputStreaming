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

app.listen(PORT, () => {
  console.log(`OutputStreaming server running on port ${PORT}`);
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});