import { Schema, model } from "mongoose";
import IMessage from "../@types/IMessage";

const messageSchema = new Schema<IMessage>(
  {
    match: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Message = model("Message", messageSchema);

export default Message;
