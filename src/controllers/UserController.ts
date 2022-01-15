import { Request, Response } from "express";

import User from "../models/User";

export default {
  async deleteMyAccount(req: Request, res: Response) {
    const userIdLogged = res.locals.id;

    try {
      const user = await User.findByIdAndDelete(userIdLogged);

      if (!user)
        return res.status(200).json({ message: "Essa conta não existe." });

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

      const suggestions = await User.aggregate([
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

      return res.status(200).json({ suggestions });
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Falha ao encontrar sugestões de usuários!" });
    }
  },
};
