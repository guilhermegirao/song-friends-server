import { Schema, model } from "mongoose";
import IMatch from "../@types/IMatch";

const matchSchema = new Schema<IMatch>(
  {
    user_1: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_2: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    success: {
      type: Boolean,
      default: false,
      required: true,
    },
    similar_artists: {
      type: [String],
    },
    similar_genres: {
      type: [String],
    },
  },
  { timestamps: true }
);

const Match = model("Match", matchSchema);

export default Match;
