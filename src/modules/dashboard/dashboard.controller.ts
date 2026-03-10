import { HTTPSTATUS } from "@/config/http.config";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { NextFunction, Request, Response } from "express";
import { DashboardService } from "./dashboard.service";

export class DashboardController {
  private dashboardService = new DashboardService();

  getDashboardOverview = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userRole = req.user!.role;

      const result = await this.dashboardService.getDashboardStats(userRole);

      res.status(HTTPSTATUS.OK).json(result);
    }
  );
}
