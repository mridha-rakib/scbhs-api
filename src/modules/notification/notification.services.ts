import { ErrorCodeEnum } from "@/enums/error-code.enum";
import { NotFoundException } from "@/utils/app-error.utils";
import { INotification } from "./notification.model";
import { NotificationRepository } from "./notification.repository";
import { GetNotificationsInput } from "./notification.type";

export class NotificationService {
  private notificationRepo = new NotificationRepository();

  // Get user notifications with pagination
  async getUserNotifications(
    userId: string,
    filters: GetNotificationsInput["query"]
  ): Promise<{
    success: boolean;
    data: Partial<INotification>[];
    pagination: any;
    message: string;
  }> {
    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "20");

    const query: any = { userId };

    if (filters.isRead) {
      query.isRead = filters.isRead === "true";
    }

    if (filters.type) {
      query.type = filters.type;
    }

    const paginateResult = await this.notificationRepo.paginateNotifications(
      query,
      {
        page,
        limit,
        sort: { createdAt: -1 },
        lean: true,
      }
    );

    return {
      success: true,
      data: Array.isArray(paginateResult.data) ? paginateResult.data : [],
      pagination: paginateResult.pagination,
      message: "Notifications retrieved successfully",
    };
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<{
    success: boolean;
    data: { unreadCount: number };
    message: string;
  }> {
    const unreadCount = await this.notificationRepo.getUnreadCount(userId);

    return {
      success: true,
      data: { unreadCount },
      message: "Unread count retrieved successfully",
    };
  }

  // Mark notification as read
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const notification = await this.notificationRepo.findById(notificationId);

    if (!notification) {
      throw new NotFoundException(
        "Notification not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    // Verify ownership
    if (notification.userId.toString() !== userId) {
      throw new NotFoundException(
        "Notification not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    await this.notificationRepo.markAsRead(notificationId);

    return {
      success: true,
      message: "Notification marked as read",
    };
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.notificationRepo.markAllAsRead(userId);

    return {
      success: true,
      message: "All notifications marked as read",
    };
  }

  // Delete notification
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const notification = await this.notificationRepo.findById(notificationId);

    if (!notification) {
      throw new NotFoundException(
        "Notification not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    // Verify ownership
    if (notification.userId.toString() !== userId) {
      throw new NotFoundException(
        "Notification not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    await this.notificationRepo.deleteById(notificationId);

    return {
      success: true,
      message: "Notification deleted successfully",
    };
  }
}
