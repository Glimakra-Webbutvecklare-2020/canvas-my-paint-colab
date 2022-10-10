import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import express from "express";

// create WebSocket server
const websocketServer = new WebSocketServer({ noServer: true});
const app = express();
app.use(express.static("public"));

const port = 3000;
const expressServer = app.listen(port, () => console.log(`Listening on port ${port}`))
expressServer.on("upgrade", (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

// Create state of canvas
const state = [];
const log = (message) => console.log(`[SERVER] ${message}`); 
// Id split to array of chars
// then string pick first 6 chars
// then coverted to integers ranging from 0-15
// then converted to hex
// then joined together.
const idToColor = (idStr) =>
  `#${idStr
    .split("")
    .map((c) => c.charCodeAt(0) % 16)
    .slice(0, 6)
    .map((i) => i.toString(16))
    .join("")}`;

websocketServer.broadcast = function broadcast(message) {
  websocketServer.clients.forEach((client) => client.send(JSON.stringify(message)));
};

// listen to WebSocket server (websocketServer) connections
websocketServer.on("connection", (ws) => {
  ws.id = uuidv4();
  log(`Client connected from IP ${ws._socket.remoteAddress} with ID: ${ws.id}`);
  log(`Number of connected clients: ${websocketServer.clients.size}`);

  // WebSocket events (ws) for a single client
  // --------------------
  //
  // close event
  ws.on("close", () => {
    console.log("Client disconnected\n");
  });

  // message event
  ws.on("message", (data) => {
    const message = JSON.parse(data);
    log(`Message received: ${data}`);
    switch (message.type) {
      case "init":
        {
          log("Attempting to send init data to client");
          const { id } = ws;
          const color = idToColor(id);
          ws.send(
            JSON.stringify({ type: "init", payload: { id, color, state } })
          );
        }
        break;
      case "paint":
        {
          log(`Broadcasting: ${JSON.stringify(message)}`);
          state.push(message);
          websocketServer.broadcast(message);
        }
        break;
      default: {
        log("Default...");
      }
    }
  });
});

