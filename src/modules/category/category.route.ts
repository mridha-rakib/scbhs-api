// src/modules/category/category.route.ts
import { authMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { CategoryController } from "./category.controller";

const router = Router();
const controller = new CategoryController();

router.use(authMiddleware.authenticate);

router.get("/", controller.getCategories);

router.post(
  "/",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  controller.createCategory
);

router.put(
  "/:id",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  controller.updateCategory
);

router.delete(
  "/:id",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  controller.deleteCategory
);

export default router;
