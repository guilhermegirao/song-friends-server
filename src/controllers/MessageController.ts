import { Request, Response } from "express";
import Match from "../models/Match";
import Message from "../models/Message";

export default {
  async findMessagesByMatch(req: Request, res: Response) {
    const { match } = req.params;

    if (!match) return res.status(400).json({ error: "Match não informado." });

    try {
      const isSuccessMatch = await Match.exists({ _id: match, success: true });

      if (!isSuccessMatch)
        return res.status(404).json({ error: "Esse match não existe!" });

      const messages = await Message.find({ match });

      return res.status(200).json({ messages });
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Falha ao encontrar as mensagens!" });
    }
  },

  async createMessage(userId: string, matchId: string, message: string) {
    try {
      const isSuccessMatch = await Match.exists({
        _id: matchId,
        success: true,
      });

      if (!isSuccessMatch) return { error: "Esse match não existe!" };

      const newMessage = await Message.create({
        match: matchId,
        author: userId,
        message: message.substring(0, 499),
      });

      return { message: newMessage };
    } catch (err) {
      return { error: "Falha ao enviar a mensagem!" };
    }
  },
};
