import { HTTPSTATUS } from "@/config/http.config";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { zParse } from "@/utils/validators.utils";
import { NextFunction, Request, Response } from "express";
import {
  bookmarkResourceSchema,
  createResourceSchema,
  getResourcesSchema,
  updateResourceSchema,
} from "./resource.schema";
import { ResourceService } from "./resource.service";
import {
  BookmarkResourceInput,
  CreateResourceInput,
  GetResourcesInput,
  UpdateResourceInput,
} from "./resource.type";

export class ResourceController {
  private resourceService = new ResourceService();

  createResource = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body }: CreateResourceInput = await zParse(
        createResourceSchema,
        req
      );

      const createdById = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.createResource(
        body,
        createdById,
        userRole
      );

      res.status(HTTPSTATUS.CREATED).json(result);
    }
  );

  getResources = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { query }: GetResourcesInput = await zParse(
        getResourcesSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.getResources(
        query,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getResourcesForThree = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { query }: GetResourcesInput = await zParse(
        getResourcesSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.getResourcesForThree(
        query,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getResourceById = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.getResourceById(
        id,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  updateResource = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body, params }: UpdateResourceInput = await zParse(
        updateResourceSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.updateResource(
        params.id,
        body,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  deleteResource = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.deleteResource(
        id,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  bookmarkResource = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: BookmarkResourceInput = await zParse(
        bookmarkResourceSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.bookmarkResource(
        params.id,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  unbookmarkResource = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: BookmarkResourceInput = await zParse(
        bookmarkResourceSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.unbookmarkResource(
        params.id,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getUserBookmarks = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.getUserBookmarks(
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  toggleBookmarkResource = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: BookmarkResourceInput = await zParse(
        bookmarkResourceSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.resourceService.toggleBookmarkResource(
        params.id,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getAllResourceLocations = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const result = await this.resourceService.getAllResourceLocations();
      res.status(HTTPSTATUS.OK).json({ success: true, data: result });
    }
  );
}
