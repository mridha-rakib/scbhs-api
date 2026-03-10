import {
  createPaginatedModel,
  createPaginatedSchema,
} from "@/utils/base-schema.utils";
import { Document, Schema } from "mongoose";

export interface IPasswordReset extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  email: string;
  resetCode: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetSchema = createPaginatedSchema<IPasswordReset>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  email: { type: String, required: true, lowercase: true, index: true },
  resetCode: {
    type: String,
    required: true,
    index: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
});

PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default createPaginatedModel<IPasswordReset>(
  "PasswordReset",
  PasswordResetSchema
);
