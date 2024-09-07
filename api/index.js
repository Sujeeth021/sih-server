const express = require("express");
const multer = require("multer");
const path = require("path");
const app = express();

let latestMessage = "test1";

// Middleware to parse JSON bodies
app.use(express.json());

// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); // Directory where images will be saved
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Filename to be saved as
  }
});

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

    latestMessage = message;

    res.json({ receivedMessage: message });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Handle image uploads
app.post("/upload-image", upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  console.log("Image uploaded:", req.file);
  res.status(200).json({ message: "Image uploaded successfully." });
});

// Serve the latest message via Server-Sent Events
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${latestMessage}\n\n`);

  req.on('close', () => {
    console.log('Connection closed');
  });
});

app.listen(3000, () => console.log("Server ready on port 3000."));
