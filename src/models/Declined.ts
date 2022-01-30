import { Schema, model } from "mongoose";
import IDeclined from "../@types/IDeclined";

const declinedSchema = new Schema<IDeclined>(
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
    cooldown: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Declined = model("Declined", declinedSchema);

export default Declined;
