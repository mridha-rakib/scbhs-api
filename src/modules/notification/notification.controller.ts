import { HTTPSTATUS } from "@/config/http.config";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { zParse } from "@/utils/validators.utils";
import { NextFunction, Request, Response } from "express";
import {
  deleteNotificationSchema,
  getNotificationsSchema,
  markAsReadSchema,
} from "./notification.schema";
import { NotificationService } from "./notification.services";
import {
  DeleteNotificationInput,
  GetNotificationsInput,
  MarkAsReadInput,
} from "./notification.type";

export class NotificationController {
  private notificationService = new NotificationService();

  getUserNotifications = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { query }: GetNotificationsInput = await zParse(
        getNotificationsSchema,
        req
      );
      const userId = req.user!.userId;

      const result = await this.notificationService.getUserNotifications(
        userId,
        query
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getUnreadCount = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = req.user!.userId;

      const result = await this.notificationService.getUnreadCount(userId);

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  markAsRead = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: MarkAsReadInput = await zParse(markAsReadSchema, req);
      const userId = req.user!.userId;

      const result = await this.notificationService.markAsRead(
        params.id,
        userId
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  markAllAsRead = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = req.user!.userId;

      const result = await this.notificationService.markAllAsRead(userId);

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  deleteNotification = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: DeleteNotificationInput = await zParse(
        deleteNotificationSchema,
        req
      );
      const userId = req.user!.userId;

      const result = await this.notificationService.deleteNotification(
        params.id,
        userId
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );
}
