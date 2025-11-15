import express from "express";
import http from "http";
import { setupWebSocket } from "./websocket";

const app = express();
const server = http.createServer(app);

// ...other middlewares/routes

setupWebSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

export default app;