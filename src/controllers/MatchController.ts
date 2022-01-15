import { Request, Response } from "express";

import Match from "../models/Match";
import User from "../models/User";
import arrayIntersection from "../utils/arrayIntersection";

export default {
  async findById(req: Request, res: Response) {
    const userIdLogged = res.locals.id;
    const { id: matchId } = req.params;

    if (!matchId)
      return res.status(400).json({ error: "Match não informado." });

    try {
      const match = await Match.findOne({
        $and: [
          { _id: matchId },
          { $or: [{ user_1: userIdLogged }, { user_2: userIdLogged }] },
        ],
      }).populate(["user_1", "user_2"]);

      if (!match)
        return res.status(200).json({ message: "Esse match não existe." });

      return res.status(200).json({ match });
    } catch (err) {
      return res.status(400).json({ error: "Falha ao encontrar o match!" });
    }
  },

  async findByUserLogged(req: Request, res: Response) {
    const userIdLogged = res.locals.id;

    try {
      const matches = await Match.findOne({
        $or: [{ user_1: userIdLogged }, { user_2: userIdLogged }],
      }).populate(["user_1", "user_2"]);

      return res.status(200).json({ matches });
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Falha ao encontrar os seus matches!" });
    }
  },

  async create(req: Request, res: Response) {
    const userIdLogged = res.locals.id;
    const { user: userIdTarget } = req.body;

    if (!userIdTarget)
      return res.status(400).json({ error: "Usuário não informado." });

    if (userIdTarget === userIdLogged)
      return res
        .status(400)
        .json({ error: "Você não pode dar match consigo." });

    try {
      const userLogged = await User.findById(userIdLogged);
      const userTarget = await User.findById(userIdTarget);

      if (!userTarget || !userLogged)
        return res.status(400).json({ error: "Este usuário não existe." });

      const match = await Match.findOne({
        $or: [
          { $and: [{ user_1: userIdLogged }, { user_2: userIdTarget }] },
          { $and: [{ user_1: userIdTarget }, { user_2: userIdLogged }] },
        ],
      }).populate(["user_1", "user_2"]);

      if (!match) {
        const similar_artists = arrayIntersection(
          userLogged.artists,
          userTarget.artists
        );

        const similar_genres = arrayIntersection(
          userLogged.genres,
          userTarget.genres
        );

        const newMatch = await Match.create({
          user_1: userLogged?._id,
          user_2: userTarget?._id,
          success: false,
          similar_artists,
          similar_genres,
        });

        await newMatch.populate(["user_1", "user_2"]);
        await newMatch.save();

        return res.status(201).json({ match: newMatch });
      }

      if (!match.success) {
        if (match.user_2._id.toString() === userIdLogged) {
          const updateMatch = await Match.findByIdAndUpdate(
            match._id.toString(),
            { success: true },
            { new: true }
          ).populate(["user_1", "user_2"]);

          return res.status(200).json({ updateMatch });
        }

        return res
          .status(400)
          .json({ error: "Solicitação de match já realizada e não aceita." });
      }

      return res
        .status(400)
        .json({ error: "Solicitação de match já realizada e aceita." });
    } catch (err) {
      return res.status(400).json({ error: "Falha ao dar match!" });
    }
  },

  async delete(req: Request, res: Response) {
    const userIdLogged = res.locals.id;
    const { id: matchId } = req.params;

    if (!matchId)
      return res.status(400).json({ error: "Match não informado." });

    try {
      const match = await Match.findOneAndDelete({
        $and: [
          { _id: matchId },
          { $or: [{ user_1: userIdLogged }, { user_2: userIdLogged }] },
        ],
      });

      if (!match)
        return res.status(200).json({ message: "Esse match não existe." });

      // Deletar mensagens do match

      return res.status(200).json({ message: "Match desfeito com sucesso." });
    } catch (err) {
      return res.status(400).json({ error: "Falha ao desfazer o match!" });
    }
  },
};
