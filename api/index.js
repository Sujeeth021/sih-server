const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const path = require('path');

let latestMessage = "test1";
let latestImageData = null; // To store the image data
let messages = []; // Array to store all parsed message objects
// Middleware to parse JSON bodies
app.use(express.json());

// Configure multer to handle file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files (e.g., HTML files)
app.use(express.static(path.join(__dirname, '../components')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'components', 'home.html'));
});

app.post("/keypair-success", (req, res) => {
  try {
    const message = req.body.message;
    console.log("Received message from Flutter app:", message);

    // Update the latest message
    latestMessage = message;

    // Parse the message string into an object with renamed keys
    const parsedMessage = parseMessage(message);

    // Check if the key pair already exists in the messages array
    if (!keyPairExists(parsedMessage)) {
      // Append the parsed object to the messages array if it doesn't already exist
      messages.push(parsedMessage);
    } else {
      console.log("Key pair already exists, not appending.");
    }

    // Respond with the parsed message back to the Flutter app
    res.json({ receivedMessage: parsedMessage });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/events", (req, res) => {
  // Construct the HTML table
  let tableHTML = `
    <html>
    <head>
      <title>Key Pair Events</title>
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
    </head>
    <body>
      <h2>Key Pair Events</h2>
      <table>
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Alias</th>
            <th>Public Key</th>
          </tr>
        </thead>
        <tbody>`;

  // Populate the table with data from the messages array
  messages.forEach((message) => {
    tableHTML += `
      <tr>
        <td>${message.deviceID}</td>
        <td>${message.alias}</td>
        <td>${message.publicKey}</td>
      </tr>`;
  });

  // Close the table and HTML tags
  tableHTML += `
        </tbody>
      </table>
    </body>
    </html>`;

  // Send the HTML response
  res.send(tableHTML);
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

// Helper function to parse the incoming message string into an object with renamed keys
function parseMessage(message) {
  const keyValuePairs = message.split(',');
  const parsedObject = {};

  keyValuePairs.forEach(pair => {
    const [key, value] = pair.split(':').map(str => str.trim());

    // Rename the keys to deviceID, alias, and publicKey
    if (key === 'Device ID') {
      parsedObject['deviceID'] = value;
    } else if (key.includes('alias')) {
      parsedObject['alias'] = value;
    } else if (key === 'Public Key') {
      parsedObject['publicKey'] = value;
    }
  });

  return parsedObject;
}

// Helper function to check if the key pair already exists in the messages array
function keyPairExists(parsedMessage) {
  return messages.some(existingMessage => {
    return existingMessage['deviceID'] === parsedMessage['deviceID'] &&
           existingMessage['publicKey'] === parsedMessage['publicKey'];
  });
}
