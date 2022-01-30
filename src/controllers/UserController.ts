import { Request, Response } from "express";

import User from "../models/User";
import Match from "../models/Match";
import Declined from "../models/Declined";

export default {
  async deleteMyAccount(req: Request, res: Response) {
    const userIdLogged = res.locals.id;

    try {
      const user = await User.findByIdAndDelete(userIdLogged);

      if (!user)
        return res.status(404).json({ message: "Essa conta não existe." });

      return res.status(200).json({ message: "Conta deletada com sucesso." });
    } catch (err) {
      return res.status(400).json({ error: "Falha remover sua conta!" });
    }
  },

  async update(req: Request, res: Response) {},

  async findSuggestions(req: Request, res: Response) {
    const userIdLogged = res.locals.id;

    try {
      const userLogged = await User.findById(userIdLogged);

      const suggestionsList = await User.aggregate([
        { $unwind: "$genres" },
        {
          $match: {
            _id: { $ne: userLogged?._id },
            genres: { $in: userLogged?.genres },
          },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            avatar: { $first: "$avatar" },
            similar_genres: { $addToSet: "$genres" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $project: { count: 0 } },
      ]);

      const suggestions = [];

      for (const suggestion of suggestionsList) {
        const hasCreatedMatch = await Match.exists({
          $and: [{ user_1: userIdLogged }, { user_2: suggestion?._id }],
        });

        const hasSucceedMatch = await Match.exists({
          $and: [
            {
              $or: [
                {
                  $and: [{ user_1: userIdLogged }, { user_2: suggestion?._id }],
                },
                {
                  $and: [{ user_1: suggestion?._id }, { user_2: userIdLogged }],
                },
              ],
            },
            { success: true },
          ],
        });

        const isDeclined = await Declined.exists({
          user_1: userIdLogged,
          user_2: suggestion?._id,
          cooldown: { $gte: new Date() },
        });

        if (!hasCreatedMatch && !isDeclined && !hasSucceedMatch)
          suggestions.push(suggestion);
      }

      return res.status(200).json({ suggestions });
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Falha ao encontrar sugestões de usuários!" });
    }
  },

  async findById(req: Request, res: Response) {
    const { id: userId } = req.params;

    if (!userId)
      return res.status(400).json({ error: "Usuário não informado." });

    try {
      const user = await User.findById(userId);

      if (!user)
        return res.status(404).json({ message: "Esse usuário não existe." });

      return res.status(200).json({ user });
    } catch (err) {
      return res.status(400).json({ error: "Falha ao encontrar o usuário" });
    }
  },

  async findByUserLogged(req: Request, res: Response) {
    const userIdLogged = res.locals.id;

    try {
      const user = await User.findById(userIdLogged);

      if (!user)
        return res.status(404).json({ message: "Esse usuário não existe." });

      return res.status(200).json({ user });
    } catch (err) {
      return res.status(400).json({ error: "Falha ao encontrar o usuário" });
    }
  },
};
