import IUser from "./IUser";

interface IMatch {
  user_1: IUser;
  user_2: IUser;
  success: Boolean;
  similar_artists: Array<string>;
  similar_genres: Array<string>;
  updatedAt?: Date;
}

export default IMatch;
