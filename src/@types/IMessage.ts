import IMatch from "./IMatch";
import IUser from "./IUser";

interface IMessage {
  match: IMatch;
  author: IUser;
  message: string;
}

export default IMessage;
