import { authMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { CaseController } from "./case.controller";

const router = Router();
const caseController = new CaseController();

router.use(authMiddleware.authenticate);

router.post(
  "/",
  authMiddleware.authorize(["SuperAdmin", "Admin"]), // Only Admin and SuperAdmin can create cases
  caseController.createCase
);

// Get my assigned cases (Counsellor/Clinician only)
router.get(
  "/my-cases",
  authMiddleware.authorize(["Counsellor", "Clinician"]),
  caseController.getMyCases
);

// Get available cases to apply (Counsellor/Clinician only)
router.get(
  "/available-cases",
  authMiddleware.authorize(["Counsellor", "Clinician"]),
  caseController.getAvailableCases
);

// Get all cases (with pagination and filtering)
router.get("/", caseController.getAllCases);

// Get specific case
router.get("/:id", caseController.getCaseById);

// Update case (Admin/SuperAdmin only)
router.put(
  "/:id",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  caseController.updateCase
);

// Delete case (Admin/SuperAdmin only)
router.delete(
  "/:id",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  caseController.deleteCase
);

router.post(
  "/:caseId/apply",
  authMiddleware.authorize(["Counsellor", "Clinician"]),
  caseController.applyToCase
);

export default router;
