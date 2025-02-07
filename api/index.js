const express = require("express");
const app = express();
const path = require('path');

let latestMessage = "test1";

app.use(express.json());

//app.get("/", (req, res) => res.send("Express on Vercel"));

app.get("/", (req, res) => {
  //res.sendFile(__dirname + '..'+ '/index.html');
  //res.sendFile(path.join(__dirname, "/components", "/home.html"));
  //res.write(__dirname);
  //res.end();
  //res.sendFile(path.join(__dirname, '..', 'components', 'home.html'));
  //res.write(path.join(__dirname, '..', 'components'));
  res.sendFile(path.join(__dirname, '..', 'components', 'home.html'))

  //res.end();
});

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

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send the latest message
  res.write(`data: ${latestMessage}\n\n`);

  //// Keep the connection open
  //const intervalId = setInterval(() => {
  //  res.write(`data: ${latestMessage}\n\n`);
  //}, 5000); // Send an update every 5 seconds
  //
  //req.on('close', () => {
  //clearInterval(intervalId);
  //
  //});
  res.end();
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
