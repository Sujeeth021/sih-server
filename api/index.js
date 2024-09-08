const express = require("express");
const app = express();
const path = require('path');

let messages = []; // Array to store all parsed message objects

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'components', 'home.html'));
});

app.post("/keypair-success", (req, res) => {
  try {
    const message = req.body.message;
    console.log("Received message from Flutter app:", message);

    if (!message) {
      // If message is undefined or null, return an error response
      return res.status(400).json({ error: "Message is required" });
    }

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
