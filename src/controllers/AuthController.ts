import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Base64 } from "js-base64";
import qs from "qs";

import User from "../models/User";
import spotifyApi from "../utils/spotifyApi";
import encryptPassword from "../utils/encryptPassword";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.AUTH_SECRET as string);
};

export default {
  async login(req: Request, res: Response) {
    res.redirect(
      spotifyApi.createAuthorizeURL([
        "user-top-read",
        "user-read-private",
        "user-read-email",
      ])
    );
  },

  async loginCallback(req: Request, res: Response) {
    const { code = null, error } = req.query;

    if (error) return res.status(400).json({ error });

    try {
      const data = await spotifyApi.authorizationCodeGrant(code);
      const { access_token } = data.body;

      spotifyApi.setAccessToken(access_token);

      const me = await spotifyApi.getMe();
      const spotifyId = me?.body?.id;

      const topTracks = await spotifyApi.getMyTopArtists({
        limit: 20,
      });
      const artists = [];
      const genresList = [];

      topTracks.body.items.forEach((element) => {
        artists.push(element.name);
        genresList.push(...element.genres);
      });

      const genres = [...new Set(genresList)];

      const user = await User.findOne({ spotifyId }).select("+spotifyId");
      const avatar = me?.body?.images?.[0]?.url || "";

      if (user) {
        const { name, _id } = user;
        const token = generateToken(_id);

        await User.updateOne(
          { spotifyId },
          {
            avatar,
            artists,
            genres,
          }
        );

        const data = Base64.encode(
          JSON.stringify({
            _id,
            name,
            avatar,
            token,
          })
        );

        res.redirect(`${process.env.FRONTEND_URI}?${qs.stringify({ data })}`);
      } else {
        const spotifyName = me?.body?.display_name;

        const newUser = await User.create({
          name: spotifyName,
          avatar,
          genres,
          spotifyId,
          artists,
        });

        const token = generateToken(newUser?._id);

        const data = Base64.encode(
          JSON.stringify({
            _id: newUser?._id,
            name: spotifyName,
            avatar,
            token,
          })
        );

        res.redirect(`${process.env.FRONTEND_URI}?${qs.stringify({ data })}`);
      }
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  async createGuest(req: Request, res: Response) {
    const { name, username, password, genres } = req.body;

    if (!name || !username || !password)
      return res
        .status(400)
        .json({ error: "Nome, usuário ou senha não informados!" });

    if (!genres?.length)
      return res
        .status(400)
        .json({ error: "Insira pelo menos 1 gênero musical favorito." });

    try {
      const user = await User.findOne({ spotifyId: username });

      if (user)
        return res
          .status(404)
          .json({ error: "Já existe um usuário com esse ID cadastrado!" });

      const newUser = await User.create({
        name,
        spotifyId: username,
        password: encryptPassword(password),
        genres: genres.filter((genre) => genre.toLowerCase()),
      });

      newUser.password = undefined;

      const token = generateToken(newUser?._id);

      return res.status(200).json({
        _id: newUser?._id,
        name: newUser?.name,
        avatar: newUser?.avatar,
        token,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Falha ao fazer Cadastro de Convidado!" });
    }
  },

  async loginGuest(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password)
      return res
        .status(400)
        .json({ error: "Usuário ou senha não informados!" });

    try {
      const user = await User.findOne({ spotifyId: username }).select(
        "+password"
      );

      if (!user)
        return res.status(404).json({ error: "Este usuário não existe!" });

      const passwordMatch = bcrypt.compareSync(password, user.password);

      if (!passwordMatch)
        return res.status(400).json({ error: "Senha inválida!" });

      user.password = undefined;

      const token = generateToken(user?._id);

      return res.status(200).json({
        _id: user?._id,
        name: user?.name,
        avatar: user?.avatar,
        token,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Falha ao fazer Login de Convidado!" });
    }
  },
};
