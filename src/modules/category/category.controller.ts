// src/modules/category/category.controller.ts
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { zParse } from "@/utils/validators.utils";
import type { NextFunction, Request, Response } from "express";
import { createCategorySchema, updateCategorySchema } from "./category.schema";
import { CategoryService } from "./category.service";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.type";

export class CategoryController {
  private service = new CategoryService();

  createCategory = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body }: CreateCategoryInput = await zParse(
        createCategorySchema,
        req
      );
      const createdById = req.user!.userId;
      const category = await this.service.createCategory(body, createdById);
      res
        .status(201)
        .json({ success: true, data: category, message: "Category created." });
    }
  );

  updateCategory = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body }: UpdateCategoryInput = await zParse(
        updateCategorySchema,
        req
      );
      const id = req.params.id;
      const updated = await this.service.updateCategory(id, body);
      res
        .status(200)
        .json({ success: true, data: updated, message: "Category updated." });
    }
  );

  deleteCategory = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const id = req.params.id;
      await this.service.deleteCategory(id);
      res.status(200).json({ success: true, message: "Category deleted." });
    }
  );

  getCategories = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const categories = await this.service.getAllCategories();
      res.status(200).json({ success: true, data: categories });
    }
  );
}
