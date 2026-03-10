import { BaseRepository } from "@/modules/base/base.repository";
import type { PaginateOptions, PaginateResult } from "mongoose";
import CaseModel, { ICase } from "./case.model";

export class CaseRepository extends BaseRepository<ICase> {
  constructor() {
    super(CaseModel);
  }

  async paginateCases(
    query: any = {},
    options: PaginateOptions
  ): Promise<PaginateResult<ICase>> {
    return (this.model as any).paginate(query, options);
  }

  async findCaseById(caseId: string): Promise<ICase | null> {
    return this.model
      .findById(caseId)
      .populate("createdBy", "fullName email role")
      .populate("Counsellor", "fullName email role")
      .populate("clinician", "fullName email role")
      .populate("applicants", "fullName email role")
      .exec();
  }

  async findAvailableCases(): Promise<ICase[]> {
    return this.model
      .find({
        $or: [{ Counsellor: null }, { clinician: null }],
        status: { $in: ["Ongoing", "Pending"] },
      })
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findCasesByUser(userId: string, role: string): Promise<ICase[]> {
    const filter: any = {};

    if (role === "Counsellor") {
      filter.Counsellor = userId;
    } else if (role === "Clinician") {
      filter.clinician = userId;
    }

    return this.model
      .find(filter)
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateCaseAssignment(
    caseId: string,
    userId: string,
    role: "Counsellor" | "Clinician"
  ): Promise<ICase | null> {
    const updateField = role === "Counsellor" ? "Counsellor" : "clinician";

    return this.model
      .findByIdAndUpdate(
        caseId,
        {
          [updateField]: userId,
          clinicianApplied: role === "Clinician" ? true : false,
          counsellorApplied: role === "Counsellor" ? true : false,
          $addToSet: { applicants: userId },
        },
        { new: true }
      )
      .populate("Counsellor", "fullName email role")
      .populate("clinician", "fullName email role")
      .exec();
  }

  async markExpiredCasesComplete(now: Date): Promise<void> {
    await this.model.updateMany(
      {
        endDate: { $lte: now },
        status: { $in: ["Ongoing", "Pending", "In Progress"] },
      },
      { status: "Complete" }
    );
  }
}
