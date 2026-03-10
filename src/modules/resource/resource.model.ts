// file: src/modules/resource/resource.model.ts
import {
  createPaginatedModel,
  createPaginatedSchema,
} from "@/utils/base-schema.utils";
import { Document, Schema } from "mongoose";
import type { UserRole } from "../user/user.model";

export interface IOperatingDay {
  day: string; // "Monday", "Tuesday", etc.
  closed: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "17:00"
}

export interface IResourceContact {
  phoneNumber: string;
  emailAddress: string;
  address: string;
}

export interface IResource extends Document {
  _id: Schema.Types.ObjectId;
  title: string;
  description: string;
  category: Schema.Types.ObjectId;
  location: string;
  servicesAvailable: string[];
  visibleFor: UserRole[];
  contactInfo: IResourceContact;
  operatingHours: IOperatingDay[];
  createdBy: Schema.Types.ObjectId;
  bookmarkedBy: Schema.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const OperatingDaySchema = new Schema<IOperatingDay>(
  {
    day: { type: String, required: true },
    closed: { type: Boolean, default: false },
    openTime: { type: String },
    closeTime: { type: String },
  },
  { _id: false }
);

const ResourceContactSchema = new Schema<IResourceContact>(
  {
    phoneNumber: { type: String, required: true },
    emailAddress: { type: String, required: true },
    address: { type: String, required: true },
  },
  { _id: false }
);

const ResourceSchema = createPaginatedSchema<IResource>({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
    index: true,
  },
  location: { type: String, required: true },
  servicesAvailable: [{ type: String, required: true }], // Dynamic services
  visibleFor: [
    {
      type: String,
      enum: ["Supervisor", "Counsellor", "Clinician"],
      required: true,
    },
  ],
  contactInfo: { type: ResourceContactSchema, required: true },
  operatingHours: [OperatingDaySchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  bookmarkedBy: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
});

export default createPaginatedModel<IResource>("Resource", ResourceSchema);
