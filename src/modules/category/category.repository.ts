import { BaseRepository } from "@/modules/base/base.repository";
import CategoryModel, { ICategory } from "./category.model";

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(CategoryModel);
  }

  public async existsByName(name: string): Promise<boolean> {
    const exists = await this.findOne({ name });
    return Boolean(exists);
  }
}
