interface IUser {
  _id: any;
  name: string;
  avatar?: string;
  password?: string;
  spotifyId: string;
  artists: Array<string>;
  genres: Array<string>;
}

export default IUser;
