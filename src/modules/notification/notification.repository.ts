import type { PaginateOptions, PaginateResult } from "mongoose";
import { Types } from "mongoose";
import { BaseRepository } from "../base/base.repository";
import NotificationModel, { INotification } from "./notification.model";

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }

  async paginateNotifications(
    query: any = {},
    options: PaginateOptions = {}
  ): Promise<PaginateResult<INotification>> {
    return (this.model as any).paginate(query, options);
  }

  async markAsRead(notificationId: string): Promise<INotification | null> {
    return this.model.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.model.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }
}
