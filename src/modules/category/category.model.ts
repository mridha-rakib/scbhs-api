import {
  createPaginatedModel,
  createPaginatedSchema,
} from "@/utils/base-schema.utils";
import { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = createPaginatedSchema<ICategory>({
  name: { type: String, required: true, unique: true, index: true },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
});

export default createPaginatedModel<ICategory>("Category", CategorySchema);
