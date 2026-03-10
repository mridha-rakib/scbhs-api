import { authMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { ResourceController } from "./resource.controller";

const router = Router();
const resourceController = new ResourceController();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Create resource (only Admin and SuperAdmin)
router.post(
  "/",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  resourceController.createResource
);

// Get all resources (filtered by user role)
router.get("/", resourceController.getResources);
router.get("/three", resourceController.getResourcesForThree);
router.get("/locations", resourceController.getAllResourceLocations);

// Get user's bookmarked resources
router.get("/bookmarks", resourceController.getUserBookmarks);

// Get specific resource
router.get("/:id", resourceController.getResourceById);

// Update resource (only Admin and SuperAdmin)
router.put(
  "/:id",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  resourceController.updateResource
);

// Delete resource (only Admin and SuperAdmin)
router.delete(
  "/:id",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  resourceController.deleteResource
);

//  BOOKMARK MANAGEMENT resource (Counsellors, Clinicians, Supervisors)

// Toggle bookmark (same endpoint for add/remove)
router.post(
  "/:id/bookmark/toggle",
  authMiddleware.authorize(["Supervisor", "Counsellor", "Clinician"]),
  resourceController.toggleBookmarkResource
);

// unofficial separate endpoints for clarity
router.post(
  "/:id/bookmark",
  authMiddleware.authorize(["Supervisor", "Counsellor", "Clinician"]),
  resourceController.bookmarkResource
);

router.delete(
  "/:id/bookmark",
  authMiddleware.authorize(["Supervisor", "Counsellor", "Clinician"]),
  resourceController.unbookmarkResource
);

export default router;
