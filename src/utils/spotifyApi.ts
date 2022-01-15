import SpotifyWebApi from "spotify-web-api-node";
import * as dotenv from "dotenv";

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

export default spotifyApi;
