import { Schema, model } from "mongoose";
import IUser from "../@types/IUser";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    spotifyId: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    artists: {
      type: [String],
      required: true,
    },
    genres: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

const User = model("User", userSchema);

export default User;
