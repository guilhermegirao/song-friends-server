import { Request, Response } from "express";
import Message from "../models/Message";

export default {
  async findMessagesByMatch(req: Request, res: Response) {
    const { id: match } = req.params;

    if (!match) return res.status(400).json({ error: "Match não informado." });

    try {
      const messages = Message.find({ match }).populate("author");

      return res.status(200).json({ match });
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Falha ao encontrar as mensagens!" });
    }
  },
};
