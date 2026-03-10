import { HTTPSTATUS } from "@/config/http.config";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { zParse } from "@/utils/validators.utils";
import { NextFunction, Request, Response } from "express";
import {
  applyCaseSchema,
  createCaseSchema,
  deleteCaseSchema,
  getCasesSchema,
  updateCaseSchema,
} from "./case.schema";
import { CaseService } from "./case.service";
import {
  ApplyCaseInput,
  CreateCaseInput,
  DeleteCaseInput,
  GetCasesInput,
  UpdateCaseInput,
} from "./case.type";

export class CaseController {
  private caseService = new CaseService();

  createCase = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body }: CreateCaseInput = await zParse(createCaseSchema, req);

      const createdByUserId = req.user!.userId;
      const result = await this.caseService.createCase(body, createdByUserId);

      res.status(HTTPSTATUS.CREATED).json(result);
    }
  );

  getAllCases = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { query }: GetCasesInput = await zParse(getCasesSchema, req);
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.caseService.getAllCases(
        query,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getCaseById = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const result = await this.caseService.getCaseById(id);

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  applyToCase = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: ApplyCaseInput = await zParse(applyCaseSchema, req);

      const userId = req.user!.userId;
      const userRole = req.user!.role as "Counsellor" | "Clinician";

      // Only Counsellors and Clinicians can apply
      if (!["Counsellor", "Clinician"].includes(userRole)) {
        return res.status(HTTPSTATUS.FORBIDDEN).json({
          success: false,
          message: "Only Counsellors and Clinicians can apply to cases",
        });
      }

      const result = await this.caseService.applyToCase(
        params.caseId,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  updateCase = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body, params }: UpdateCaseInput = await zParse(
        updateCaseSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.caseService.updateCase(
        params.id,
        body,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  deleteCase = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: DeleteCaseInput = await zParse(deleteCaseSchema, req);

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.caseService.deleteCase(
        params.id,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getMyCases = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { query }: GetCasesInput = await zParse(getCasesSchema, req);
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.caseService.getMyCases(query, userId, userRole);

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getAvailableCases = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { query }: GetCasesInput = await zParse(getCasesSchema, req);
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.caseService.getAvailableCases(
        query,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );
}
