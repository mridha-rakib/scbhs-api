// src/modules/category/category.service.ts
import { ErrorCodeEnum } from "@/enums/error-code.enum";
import {
  BadRequestException,
  NotFoundException,
} from "@/utils/app-error.utils";
import { Types } from "mongoose";
import { ICategory } from "./category.model";
import { CategoryRepository } from "./category.repository";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.type";

export class CategoryService {
  private repo = new CategoryRepository();

  async createCategory(
    createData: CreateCategoryInput["body"],
    createdById: string
  ): Promise<ICategory> {
    // Check for duplicates
    const exists = await this.repo.existsByName(createData.name);
    if (exists)
      throw new BadRequestException(
        "Category already exists",
        ErrorCodeEnum.RESOURCE_CONFLICT
      );

    const newCategory = await this.repo.create({
      name: createData.name,
      isActive: createData.isActive ?? true,
      createdBy: new Types.ObjectId(createdById),
    } as any);

    return newCategory;
  }

  async updateCategory(
    id: string,
    updateData: UpdateCategoryInput["body"]
  ): Promise<ICategory> {
    const updated = await this.repo.updateById(id, updateData);
    if (!updated)
      throw new NotFoundException(
        "Category not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    return updated;
  }

  async deleteCategory(id: string): Promise<ICategory> {
    const deleted = await this.repo.deleteById(id);
    if (!deleted)
      throw new NotFoundException(
        "Category not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    return deleted;
  }

  async getAllCategories(): Promise<ICategory[]> {
    return this.repo.findAll({}, { sort: { name: 1 } });
  }
}
