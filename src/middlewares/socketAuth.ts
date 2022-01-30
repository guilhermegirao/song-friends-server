import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import User from "../models/User";

export default async function (socket: Socket, next) {
  const authHeader = socket.handshake.auth.token;

  if (!authHeader) return next(new Error("Nenhum token fornecido."));

  try {
    const user = await jwt.verify(
      authHeader,
      process.env.AUTH_SECRET as string
    );
    const validUser = await User.findById(user?.id);

    if (!validUser) return next(new Error("Acesso não autorizado!"));

    socket.data.userId = user?.id;
  } catch (err) {
    return next(new Error("Token mal formatado!"));
  }

  return next();
}
