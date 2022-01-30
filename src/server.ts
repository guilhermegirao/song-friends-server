import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import * as dotenv from "dotenv";
import authenticate from "./middlewares/socketAuth";

import routes from "./routes";
import connection from "./db";
import MessageController from "./controllers/MessageController";
import MatchController from "./controllers/MatchController";

dotenv.config();
connection();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3001;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(routes);

io.use(authenticate);

let rooms: any = {};
let users: any = {};

io.on("connection", async (socket) => {
  users = {
    ...users,
    [socket.data.userId]: socket.id,
  };

  const userId = socket.data.userId;

  socket.on("join", async (room) => {
    const getRoom = rooms?.[room];

    if (!getRoom) {
      rooms = {
        ...rooms,
        [room]: [userId],
      };
    } else if (!getRoom.includes(userId)) {
      rooms?.[room].push(userId);
    }

    const updatedRoom = rooms?.[room];

    socket.on(`emitMessage`, async (message) => {
      const msg = await MessageController.createMessage(userId, room, message);

      updatedRoom.forEach((id) => {
        socket.to(users[id]).emit("onMessage", msg);
      });
    });
  });

  socket.on("emitMatch", async (userIdTarget) => {
    const match = await MatchController.create(userId, userIdTarget);

    if (match?.match && match?.status === 200) {
      if (
        !match?.match?.success &&
        match?.match?.user_1?._id.toString() === userId
      ) {
        socket.emit("onMatch", { ...match, type: "MATCH_CREATED" });
      } else if (match?.match?.success) {
        socket.emit("onMatch", {
          ...match,
          type: "MATCH_SUCCESS",
          matched_user: match?.match?.user_1,
        });

        if (users?.[userIdTarget])
          socket.to(users[userIdTarget]).emit("onMatch", {
            ...match,
            type: "MATCH_SUCCESS",
            matched_user: match?.match?.user_2,
          });
      }
    }
  });

  socket.on("emitRemoveMatch", async (matchId) => {
    const match = await MatchController.delete(userId, matchId);

    if (match?.match && match?.status === 200) {
      socket.emit("onRemoveMatch", {
        ...match,
        type: "MATCH_DELETED",
      });

      let other =
        match?.match?.user_1?._id.toString() === userId
          ? match?.match?.user_2?._id.toString()
          : match?.match?.user_1?._id.toString();

      if (users?.[other]) {
        socket.to(users[other]).emit("onRemoveMatch", {
          ...match,
          type: "MATCH_OTHER_DELETED",
        });
      }
    }
  });

  socket.on("disconnect", () => {
    delete users[socket.data.userId];
    socket.removeAllListeners();
  });
});

server.listen(PORT, () => console.log(`Servidor rodando na porta :${PORT}`));
