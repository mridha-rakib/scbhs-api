import {
  createPaginatedModel,
  createPaginatedSchema,
} from "@/utils/base-schema.utils";
import { Document, Schema } from "mongoose";

export interface INotification extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  title: string;
  body: string;
  type:
    | "case_created"
    | "resource_created"
    | "case_assigned"
    | "general"
    | "resource_deleted";
  relatedId?: Schema.Types.ObjectId;
  isRead: boolean;
  createdAt?: Date;
}

const NotificationSchema = createPaginatedSchema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "case_created",
      "resource_created",
      "case_assigned",
      "general",
      "resource_deleted",
    ],
    required: true,
  },
  relatedId: { type: Schema.Types.ObjectId },
  isRead: { type: Boolean, default: false, index: true },
});

export default createPaginatedModel<INotification>(
  "Notification",
  NotificationSchema
);
