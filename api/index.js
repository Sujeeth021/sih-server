const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

let latestMessage = "test1";
let latestImage = ""; // To store the filename of the latest image

// Get the absolute path for the uploads directory
const uploadsDir = path.join(__dirname, '../uploads');

// Middleware to parse JSON bodies
app.use(express.json());

// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir); // Directory where images will be saved
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Filename to be saved as
  }
});

const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(uploadsDir));

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

// Handle image uploads
app.post("/upload-image", upload.single('image'), (req, res) => {
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  // Update the latest image URL
  latestImage = req.file.filename;

  const imageUrl = `/uploads/${req.file.filename}`;
  console.log("Image uploaded:", req.file);
  res.status(200).json({ message: "Image uploaded successfully.", imageUrl: imageUrl });
});

// Endpoint to get the latest message
app.get('/latest-message', (req, res) => {
  res.json({ message: latestMessage });
});

// Endpoint to get the latest image
app.get('/latest-image', (req, res) => {
  if (latestImage) {
    const imageUrl = `/uploads/${latestImage}`;
    res.json({ imageUrl: imageUrl });
  } else {
    res.json({ error: "No image available" });
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
