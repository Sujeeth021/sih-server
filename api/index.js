const express = require("express");
const app = express();
const path = require('path');

let messages = []; // Array to store all messages

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'components', 'home.html'));
});

app.post("/keypair-success", (req, res) => {
  try {
    const message = req.body.message;
    console.log("Received message from Flutter app:", message);

    // Append the new message to the messages array
    messages.push(message);

    // Respond with the message back to the Flutter app
    res.json({ receivedMessage: message });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/events", (req, res) => {
  // res.setHeader("Content-Type", "text/event-stream");
  // res.setHeader("Cache-Control", "no-cache");
  // res.setHeader("Connection", "keep-alive");

  // Send all stored messages
  messages.forEach((message) => {
    res.write(`data: ${message}\n\n`);
  });

  // Keep the connection open for future messages (optional)
  // const intervalId = setInterval(() => {
  //   res.write(`data: ${latestMessage}\n\n`);
  // }, 5000); // Send an update every 5 seconds
  //
  // req.on('close', () => {
  //   clearInterval(intervalId);
  // });

  res.end();
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
