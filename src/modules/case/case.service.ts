import { ErrorCodeEnum } from "@/enums/error-code.enum";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@/utils/app-error.utils";
import { Types } from "mongoose";
import { FCMService } from "../common/services/fcm.service";
import { ApplicationResponse, CaseResponse } from "./case.interface";
import { ICase } from "./case.model";
import { CaseRepository } from "./case.repository";
import { CreateCaseInput, GetCasesInput, UpdateCaseInput } from "./case.type";

export class CaseService {
  private caseRepo = new CaseRepository();
  private fcmService = new FCMService();

  async createCase(
    createCaseData: CreateCaseInput["body"],
    createdByUserId: string
  ): Promise<CaseResponse> {
    if (createCaseData.endDate <= createCaseData.startDate) {
      throw new BadRequestException(
        "End date must be after start date",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    const newCase = await this.caseRepo.create({
      ...createCaseData,
      createdBy: new Types.ObjectId(createdByUserId),
      status: "Ongoing",
    } as any);

    await this.fcmService.sendToRoles(
      ["Counsellor", "Clinician"],
      "New Case Available",
      `Case #${newCase.caseNumber}: ${newCase.title}`,
      "case_created",
      newCase._id.toString()
    );

    return {
      success: true,
      data: {
        id: newCase.id,
        caseNumber: newCase.caseNumber,
        title: newCase.title,
        client: newCase.client,
        counsellorApplied: newCase.counsellorApplied,
        clinicianApplied: newCase.clinicianApplied,
        status: newCase.status,
        startDate: newCase.startDate,
        endDate: newCase.endDate,
        createdAt: newCase.createdAt,
      },
      message: `Case ${newCase.caseNumber} created successfully`,
    };
  }

  async getAllCases(
    filters: GetCasesInput["query"],
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<ICase>[];
    pagination: any;
    message: string;
  }> {
    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "10");

    // Build base query based on user role
    let baseQuery: any = {};

    switch (userRole) {
      case "SuperAdmin":
      case "Admin":
        // Admins can see all cases
        break;

      case "Counsellor":
        // Counsellors see their assigned cases + available cases
        baseQuery = {
          $or: [
            { Counsellor: userId },
            { Counsellor: null, status: { $in: ["Ongoing", "Pending"] } },
          ],
        };
        break;

      case "Clinician":
        // Clinicians see their assigned cases + available cases
        baseQuery = {
          $or: [
            { clinician: userId },
            { clinician: null, status: { $in: ["Ongoing", "Pending"] } },
          ],
        };
        break;

      default:
        throw new UnauthorizedException(
          "Insufficient permissions",
          ErrorCodeEnum.ACCESS_UNAUTHORIZED
        );
    }

    // Apply filters
    if (filters.status) {
      baseQuery.status = filters.status;
    }

    if (filters.search) {
      baseQuery.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { caseNumber: { $regex: filters.search, $options: "i" } },
        { "client.fullName": { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      baseQuery.startDate = {};
      if (filters.dateFrom) {
        baseQuery.startDate.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        baseQuery.startDate.$lte = new Date(filters.dateTo);
      }
    }

    if (filters.assignedTo) {
      if (filters.assignedTo === "assigned") {
        baseQuery.$or = [
          { Counsellor: { $ne: null } },
          { clinician: { $ne: null } },
        ];
      } else if (filters.assignedTo === "unassigned") {
        baseQuery.Counsellor = null;
        baseQuery.clinician = null;
      }
    }

    // Use pagination
    const paginateResult = await this.caseRepo.paginateCases(baseQuery, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: "createdBy", select: "fullName email role" },
        { path: "Counsellor", select: "fullName email role" },
        { path: "clinician", select: "fullName email role" },
      ],
      lean: true,
    });

    return {
      success: true,
      data: Array.isArray(paginateResult.data)
        ? paginateResult.data.map((case_: any) => ({
            _id: case_._id,
            caseNumber: case_.caseNumber,
            title: case_.title,
            description: case_.description,
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            client: case_.client,
            createdBy: case_.createdBy,
            Counsellor: case_.Counsellor,
            clinician: case_.clinician,
            createdAt: case_.createdAt,
          }))
        : [],
      pagination: paginateResult.pagination,
      message: "Cases retrieved successfully",
    };
  }

  async getCaseById(caseId: string): Promise<CaseResponse> {
    const case_ = await this.caseRepo.findCaseById(caseId);

    if (!case_) {
      throw new NotFoundException(
        "Case not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    return {
      success: true,
      message: "Case retrieved successfully",
      data: case_,
    };
  }

  async applyToCase(
    caseId: string,
    userId: string,
    userRole: "Counsellor" | "Clinician"
  ): Promise<ApplicationResponse> {
    const case_ = await this.caseRepo.findCaseById(caseId);

    if (!case_) {
      throw new NotFoundException(
        "Case not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    // Check if case is available for this role
    const roleField = userRole === "Counsellor" ? "Counsellor" : "clinician";
    if (case_[roleField]) {
      throw new BadRequestException(
        `This case already has a ${userRole} assigned`,
        ErrorCodeEnum.RESOURCE_CONFLICT
      );
    }

    // Check if user already applied
    if (case_.applicants?.includes(new Types.ObjectId(userId) as any)) {
      throw new BadRequestException(
        "You have already applied to this case",
        ErrorCodeEnum.RESOURCE_CONFLICT
      );
    }

    // Assign the user to the case
    const updatedCase = await this.caseRepo.updateCaseAssignment(
      caseId,
      userId,
      userRole
    );

    if (!updatedCase) {
      throw new BadRequestException(
        "Failed to apply to case",
        ErrorCodeEnum.INTERNAL_SERVER_ERROR
      );
    }

    // Determine new status based on assignment
    let newStatus = updatedCase.status;
    if (updatedCase.Counsellor && updatedCase.clinician) {
      // Both roles are now filled
      newStatus = "In Progress";
    } else {
      // Only one role is filled, set to Pending
      newStatus = "Pending";
    }

    // Update status if changed
    if (newStatus !== updatedCase.status) {
      await this.caseRepo.updateById(caseId, { status: newStatus });
      updatedCase.status = newStatus;
    }

    // send notification to admin & superadmin about the application
    await this.fcmService.sendToRoles(
      ["Admin", "SuperAdmin"],
      "Case Assignment",
      `${userRole} assigned to Case #${updatedCase.caseNumber}`,
      "case_assigned",
      caseId
    );

    return {
      success: true,
      data: {
        case: {
          id: updatedCase.id,
          caseNumber: updatedCase.caseNumber,
          applicants: updatedCase.applicants,
          counsellorApplied: updatedCase.counsellorApplied,
          clinicianApplied: updatedCase.clinicianApplied,
          status: newStatus,
          Counsellor: updatedCase.Counsellor,
          clinician: updatedCase.clinician,
        },
        newStatus,
      },
      message: `Successfully applied as ${userRole}. Case status updated to ${newStatus}.`,
    };
  }

  // Update case (Admin/SuperAdmin only)

  async updateCase(
    caseId: string,
    updateData: UpdateCaseInput["body"],
    userId: string,
    userRole: string
  ): Promise<CaseResponse> {
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Admin and SuperAdmin can update cases",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate <= updateData.startDate) {
        throw new BadRequestException(
          "End date must be after start date",
          ErrorCodeEnum.VALIDATION_ERROR
        );
      }
    }

    const updatePayload: any = { ...updateData };

    const updatedCase = await this.caseRepo.updateById(caseId, updatePayload);

    if (!updatedCase) {
      throw new NotFoundException(
        "Case not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    return {
      success: true,
      data: {
        id: updatedCase.id,
        caseNumber: updatedCase.caseNumber,
        title: updatedCase.title,
        description: updatedCase.description,
        status: updatedCase.status,
        client: updatedCase.client,
        updatedAt: updatedCase.updatedAt,
      },
      message: `Case ${updatedCase.caseNumber} updated successfully`,
    };
  }

  async deleteCase(
    caseId: string,
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Admin and SuperAdmin can delete cases",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const case_ = await this.caseRepo.findById(caseId);
    if (!case_) {
      throw new NotFoundException(
        "Case not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    // Optional: Prevent deletion of cases that are in progress
    if (case_.status === "In Progress") {
      throw new BadRequestException(
        "Cannot delete cases that are in progress",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    await this.caseRepo.deleteById(caseId);

    return {
      success: true,
      message: `Case ${case_.caseNumber} deleted successfully`,
    };
  }

  // Method to automatically update completed cases
  async updateExpiredCases(): Promise<void> {
    const now = new Date();
    await this.caseRepo.markExpiredCasesComplete(now);
  }

  // get my cases for counsellor and clinician
  async getMyCases(
    filters: GetCasesInput["query"],
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<ICase>[];
    pagination: any;
    message: string;
  }> {
    if (!["Counsellor", "Clinician"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Counsellors and Clinicians can access this endpoint",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "10");

    // Build query for assigned cases only
    const baseQuery: any = {};

    if (userRole === "Counsellor") {
      baseQuery.Counsellor = userId;
    } else if (userRole === "Clinician") {
      baseQuery.clinician = userId;
    }

    // Apply optional filters
    if (filters.status) {
      baseQuery.status = filters.status;
    }

    if (filters.search) {
      baseQuery.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { caseNumber: { $regex: filters.search, $options: "i" } },
        { "client.fullName": { $regex: filters.search, $options: "i" } },
      ];
    }

    const paginateResult = await this.caseRepo.paginateCases(baseQuery, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: "createdBy", select: "fullName email role" },
        { path: "Counsellor", select: "fullName email role" },
        { path: "clinician", select: "fullName email role" },
      ],
      lean: true,
    });

    return {
      success: true,
      data: Array.isArray(paginateResult.data)
        ? paginateResult.data.map((case_: any) => ({
            _id: case_._id,
            caseNumber: case_.caseNumber,
            title: case_.title,
            description: case_.description,
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            client: case_.client,
            applied: case_.applied,
            createdBy: case_.createdBy,
            Counsellor: case_.Counsellor,
            clinician: case_.clinician,
            createdAt: case_.createdAt,
          }))
        : [],
      pagination: paginateResult.pagination,
      message: "My cases retrieved successfully",
    };
  }

  // Get only available cases (not yet assigned to the user)
  async getAvailableCases(
    filters: GetCasesInput["query"],
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<ICase>[];
    pagination: any;
    message: string;
  }> {
    if (!["Counsellor", "Clinician"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Counsellors and Clinicians can access this endpoint",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "10");

    // Build query for available cases only
    const baseQuery: any = {
      status: { $in: ["Ongoing", "Pending"] }, // Only show open cases
    };

    if (userRole === "Counsellor") {
      baseQuery.Counsellor = null; // No Counsellor assigned yet
    } else if (userRole === "Clinician") {
      baseQuery.clinician = null; // No clinician assigned yet
    }

    // Apply optional filters
    if (filters.search) {
      baseQuery.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { caseNumber: { $regex: filters.search, $options: "i" } },
        { "client.fullName": { $regex: filters.search, $options: "i" } },
      ];
    }

    const paginateResult = await this.caseRepo.paginateCases(baseQuery, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: "createdBy", select: "fullName email role" },
        { path: "Counsellor", select: "fullName email role" },
        { path: "clinician", select: "fullName email role" },
      ],
      lean: true,
    });

    return {
      success: true,
      data: Array.isArray(paginateResult.data)
        ? paginateResult.data.map((case_: any) => ({
            _id: case_._id,
            caseNumber: case_.caseNumber,
            title: case_.title,
            description: case_.description,
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            client: case_.client,
            createdBy: case_.createdBy,
            Counsellor: case_.Counsellor,
            clinician: case_.clinician,
            createdAt: case_.createdAt,
          }))
        : [],
      pagination: paginateResult.pagination,
      message: "Available cases retrieved successfully",
    };
  }
}
