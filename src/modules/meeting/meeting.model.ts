import {
  createPaginatedModel,
  createPaginatedSchema,
} from "@/utils/base-schema.utils";
import { Document, Schema } from "mongoose";

export type MeetingStatus =
  | "Available"
  | "Booked"
  | "Completed"
  | "Cancelled"
  | "Expired";

export interface IMeeting extends Document {
  _id: Schema.Types.ObjectId;
  supervisor: Schema.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: MeetingStatus;
  bookedBy?: Schema.Types.ObjectId;
  bookedAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const MeetingSchema = createPaginatedSchema<IMeeting>({
  supervisor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["Available", "Booked", "Completed", "Cancelled", "Expired"],
    default: "Available",
    index: true,
  },
  bookedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  bookedAt: { type: Date },
  cancelledAt: { type: Date },
  completedAt: { type: Date },
});

MeetingSchema.index({ supervisor: 1, startTime: 1, endTime: 1 });

export default createPaginatedModel<IMeeting>("Meeting", MeetingSchema);
