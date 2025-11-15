import { Server as HttpServer } from "http";
import WebSocket, { Server as WebSocketServer } from "ws";

interface Message {
  type: string;
  user: string;
  text: string;
  timestamp: number;
}

const clients = new Set<WebSocket>();

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", function connection(ws: WebSocket) {
    clients.add(ws);

    ws.on("message", function incoming(data) {
      try {
        const msg: Message = JSON.parse(data.toString());
        // Broadcast message to all other clients
        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        }
      } catch (err) {
        console.error("Invalid message:", err);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  console.log("WebSocket server running on /ws");
}