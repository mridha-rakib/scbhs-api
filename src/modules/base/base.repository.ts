import type {
  Document,
  Model,
  PaginateOptions,
  PaginateResult,
} from "mongoose";

export class BaseRepository<
  T extends Document<unknown, any, any, Record<string, any>, object>,
> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findAll(filter = {}, options = {}): Promise<T[]> {
    return this.model.find(filter, null, options).lean() as unknown as T[];
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter = {}): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }
  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
  async paginate(
    query: any = {},
    options: PaginateOptions
  ): Promise<PaginateResult<T>> {
    return (this.model as any).paginate(query, options);
  }

  async countDocuments(filter: any = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }
}
