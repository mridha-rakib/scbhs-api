import type { NextFunction, Request, Response } from "express";
import type { Document } from "mongoose";

import type { BaseService } from "@/modules/base/base.service";

export class BaseController<
  T extends Document<unknown, any, any, Record<string, any>, object>,
> {
  protected service: BaseService<T>;

  constructor(service: BaseService<T>) {
    this.service = service;
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
