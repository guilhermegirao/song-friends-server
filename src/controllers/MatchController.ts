import { Request, Response } from "express";

import Match from "../models/Match";
import User from "../models/User";
import Message from "../models/Message";
import Declined from "../models/Declined";
import arrayIntersection from "../utils/arrayIntersection";
import addDays from "../utils/addDays";

export default {
  async findByIdUserLogged(req: Request, res: Response) {
    const userIdLogged = res.locals.id;
    const { id: matchId } = req.params;

    if (!matchId)
      return res.status(400).json({ error: "Match não informado." });

    try {
      const getMatch = await Match.findOne({
        $and: [
          { _id: matchId },
          { $or: [{ user_1: userIdLogged }, { user_2: userIdLogged }] },
        ],
      }).populate(["user_1", "user_2"]);

      if (!getMatch)
        return res.status(404).json({ message: "Esse match não existe." });

      const matchedUser =
        getMatch.user_2._id.toString() !== String(userIdLogged)
          ? getMatch.user_2
          : getMatch.user_1;

      const match = {
        _id: matchId,
        updatedAt: getMatch.updatedAt,
        matched_user: matchedUser,
        similar_genres: getMatch.similar_genres,
      };

      return res.status(200).json({ match });
    } catch (err) {
      return res.status(400).json({ error: "Falha ao encontrar o match!" });
    }
  },

  async findByUserLogged(req: Request, res: Response) {
    const userIdLogged = res.locals.id;

    try {
      const matchesList = await Match.find({
        $or: [{ user_1: userIdLogged }, { user_2: userIdLogged }],
        success: true,
      })
        .populate(["user_1", "user_2"])
        .sort({ createdAt: -1 });

      const matches = [];

      matchesList.forEach((match) => {
        const matchedUser =
          match.user_2._id.toString() !== String(userIdLogged)
            ? match.user_2
            : match.user_1;

        matches.push({
          _id: match._id,
          matched_user: matchedUser,
        });
      });

      return res.status(200).json({ matches });
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Falha ao encontrar os seus matches!" });
    }
  },

  async create(userIdLogged: string, userIdTarget: string) {
    if (!userIdTarget) return { error: "Usuário não informado.", status: 400 };

    if (userIdTarget === userIdLogged)
      return { error: "Você não pode dar match consigo.", status: 400 };

    try {
      const userLogged = await User.findById(userIdLogged);
      const userTarget = await User.findById(userIdTarget);

      if (!userTarget || !userLogged)
        return { error: "Este usuário não existe.", status: 404 };

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

        return { match: newMatch, status: 200 };
      }

      if (!match.success) {
        if (match.user_2._id.toString() === userIdLogged) {
          const updateMatch = await Match.findByIdAndUpdate(
            match._id.toString(),
            { success: true },
            { new: true }
          ).populate(["user_1", "user_2"]);

          return { match: updateMatch, status: 200 };
        }

        return {
          error: "Solicitação de match já realizada e não aceita.",
          status: 400,
        };
      }

      return {
        error: "Solicitação de match já realizada e aceita.",
        status: 400,
      };
    } catch (err) {
      return { error: "Falha ao dar match!", status: 400 };
    }
  },

  async delete(userIdLogged: string, matchId: string) {
    if (!matchId) return { error: "Match não informado.", status: 400 };

    try {
      const match = await Match.findOneAndDelete({
        $and: [
          { _id: matchId },
          { $or: [{ user_1: userIdLogged }, { user_2: userIdLogged }] },
        ],
      });

      if (!match) return { error: "Esse match não existe.", status: 404 };

      await Message.deleteMany({ match: matchId });

      return { match, message: "Match desfeito com sucesso.", status: 200 };
    } catch (err) {
      return { error: "Falha ao desfazer o match!", status: 400 };
    }
  },

  async declineSuggestion(req: Request, res: Response) {
    const userIdLogged = res.locals.id;
    const { user: userIdTarget } = req.body;

    try {
      const userLogged = await User.findById(userIdLogged);
      const userTarget = await User.findById(userIdTarget);

      if (!userTarget || !userLogged)
        return res.status(404).json({ error: "Este usuário não existe." });

      if (userIdTarget === userIdLogged)
        return res.status(400).json({ error: "Você não pode rejeitar a si." });

      const declinedSuggestion = await Declined.exists({
        user_1: userIdLogged,
        user_2: userIdTarget,
        cooldown: { $gte: new Date() },
      });

      if (declinedSuggestion)
        return res
          .status(400)
          .json({ error: "Você não pode rejeitar uma sugestão já rejeitada!" });

      await Declined.deleteOne({ user_1: userIdLogged, user_2: userIdTarget });

      const declined = await Declined.create({
        user_1: userIdLogged,
        user_2: userIdTarget,
        cooldown: addDays(1),
      });

      return res.status(201).json({ declined });
    } catch (err) {
      return res.status(400).json({ error: "Falha ao rejeitar a sugestão!" });
    }
  },
};
