import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Base64 } from "js-base64";
import qs from "qs";

import User from "../models/User";
import spotifyApi from "../utils/spotifyApi";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.AUTH_SECRET as string, {
    expiresIn: "1d",
  });
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

      if (user) {
        const { name, _id, avatar = "" } = user;
        const token = generateToken(_id);

        await User.updateOne(
          { spotifyId },
          {
            artists,
            genres,
          }
        );

        const data = Base64.encode(
          JSON.stringify({
            name,
            avatar,
            token,
          })
        );

        res.redirect(`${process.env.FRONTEND_URI}?${qs.stringify({ data })}`);
      } else {
        const spotifyName = me?.body?.display_name;
        const spotifyAvatar = me?.body?.images?.[0]?.url || "";

        const newUser = await User.create({
          name: spotifyName,
          avatar: spotifyAvatar,
          genres,
          spotifyId,
          artists,
        });

        const token = generateToken(newUser?._id);

        const data = Base64.encode(
          JSON.stringify({
            name: spotifyName,
            avatar: spotifyAvatar,
            token,
          })
        );

        res.redirect(`${process.env.FRONTEND_URI}?${qs.stringify({ data })}`);
      }
    } catch (error) {
      return res.status(400).json({ error: "Falha ao entrar!" });
    }
  },
};
