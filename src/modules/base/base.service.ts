import type { Document } from "mongoose";

import type { BaseRepository } from "@/modules/base/base.repository";

export class BaseService<
  T extends Document<unknown, any, any, Record<string, any>, object>,
> {
  protected repo: BaseRepository<T>;

  constructor(repo: BaseRepository<T>) {
    this.repo = repo;
  }

  async getAll(filter = {}, options = {}) {
    return this.repo.findAll(filter, options);
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async create(data: Partial<T>) {
    return this.repo.create(data);
  }

  async update(id: string, data: Partial<T>) {
    return this.repo.updateById(id, data);
  }

  async delete(id: string) {
    return this.repo.deleteById(id);
  }
}
