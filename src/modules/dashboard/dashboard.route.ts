import { authMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { DashboardController } from "./dashboard.controller";

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Get dashboard overview (Admin and SuperAdmin only)
router.get(
  "/overview",
  authMiddleware.authorize(["Admin", "SuperAdmin"]),
  dashboardController.getDashboardOverview
);

export default router;
