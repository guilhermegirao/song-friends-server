interface IUser {
  _id: any;
  name: string;
  avatar?: string;
  spotifyId: string;
  artists: Array<string>;
  genres: Array<string>;
}

export default IUser;
