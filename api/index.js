const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

let latestMessage = "test1";
let latestImageData = null; // To store the image data

// Middleware to parse JSON bodies
app.use(express.json());

// Configure multer to handle file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files (e.g., HTML files)
app.use(express.static(path.join(__dirname, '../components')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../components', 'home.html'));
});

// Handle keypair success messages
app.post("/keypair-success", (req, res) => {
  try {
    const message = req.body.message;
    console.log("Received message from Flutter app:", message);

    // Update the latest message
    latestMessage = message;

    // Respond with the message back to the Flutter app
    res.json({ receivedMessage: message });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Handle image uploads (in-memory)
app.post("/upload-image", upload.single('image'), (req, res) => {
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  // Store the image data as a Base64 string
  latestImageData = req.file.buffer.toString('base64');

  res.status(200).json({ message: "Image uploaded successfully." });
});

// Endpoint to get the latest message
app.get('/latest-message', (req, res) => {
  res.json({ message: latestMessage });
});

// Endpoint to get the latest image as a data URL
app.get('/latest-image', (req, res) => {
  if (latestImageData) {
    res.send(`<img src="data:image/jpeg;base64,${latestImageData}" alt="Uploaded Image" style="max-width: 100%; height: auto;"/>`);
  } else {
    res.send('No image available');
  }
});

// Serve the latest message via Server-Sent Events
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send the latest message
  res.write(`data: ${latestMessage}\n\n`);

  // Keep the connection open
  req.on('close', () => {
    console.log('Connection closed');
  });
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
