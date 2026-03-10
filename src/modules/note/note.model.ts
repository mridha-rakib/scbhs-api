import {
  createPaginatedModel,
  createPaginatedSchema,
} from "@/utils/base-schema.utils";
import { Document, Schema } from "mongoose";

export interface INote extends Document {
  _id: Schema.Types.ObjectId;
  title: string;
  description: string;
  case: Schema.Types.ObjectId; // Reference to Case
  createdBy: Schema.Types.ObjectId; // Reference to User
  createdAt?: Date;
  updatedAt?: Date;
}

const NoteSchema = createPaginatedSchema<INote>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  case: {
    type: Schema.Types.ObjectId,
    ref: "Case",
    required: true,
    index: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
});

export default createPaginatedModel<INote>("Note", NoteSchema);
