import {
  createPaginatedModel,
  createPaginatedSchema,
} from "@/utils/base-schema.utils";
import { Document, Model, Schema } from "mongoose";

export interface IClientInfo {
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  emergencyContact: string;
  email: string;
  address: string;
}

export interface ICase extends Document {
  _id: Schema.Types.ObjectId;
  caseNumber: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "Ongoing" | "Pending" | "In Progress" | "Complete";
  client: IClientInfo;
  clinicianApplied: boolean;
  counsellorApplied: boolean;
  createdBy: Schema.Types.ObjectId;
  notes?: Schema.Types.ObjectId[]; // References to Note documents
  Counsellor?: Schema.Types.ObjectId;
  clinician?: Schema.Types.ObjectId;
  applicants?: Schema.Types.ObjectId[]; // Users who applied
  createdAt?: Date;
  updatedAt?: Date;
}

const CaseSchema = createPaginatedSchema<ICase>({
  caseNumber: {
    type: String,
    // required: true,
    unique: true,
    index: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Ongoing", "Pending", "In Progress", "Complete"],
    default: "Ongoing",
    index: true,
  },
  client: {
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    email: { type: String },
    address: { type: String },
  },
  clinicianApplied: { type: Boolean, default: false },
  counsellorApplied: { type: Boolean, default: false },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  notes: [{ type: Schema.Types.ObjectId, ref: "Note" }],
  Counsellor: { type: Schema.Types.ObjectId, ref: "User", index: true },
  clinician: { type: Schema.Types.ObjectId, ref: "User", index: true },
  applicants: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

CaseSchema.pre("save", async function (this: ICase, next) {
  if (this.isNew) {
    const currentYear = new Date().getFullYear();
    const lastCase = (await (this.constructor as Model<ICase>)
      .findOne({ caseNumber: new RegExp(`^SC-${currentYear}-`) })
      .sort({ caseNumber: -1 })
      .lean()) as ICase | null;

    let nextNumber = 1;
    if (lastCase) {
      const lastNumber = parseInt(lastCase.caseNumber.split("-")[2]);
      nextNumber = lastNumber + 1;
    }

    this.caseNumber = `SC-${currentYear}-${nextNumber.toString().padStart(4, "0")}`;
  }
  next();
});

export default createPaginatedModel<ICase>("Case", CaseSchema);
