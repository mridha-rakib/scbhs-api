import { messaging } from "@/config/firebase.config";
import { logger } from "@/middlewares/pino-logger";
import NotificationModel from "@/modules/notification/notification.model";
import { UserRepository } from "@/modules/user/user.repository";
import { Types } from "mongoose";

export class FCMService {
  private userRepo = new UserRepository();

  // Send notification to specific user(s)
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    type:
      | "case_created"
      | "resource_created"
      | "resource_deleted"
      | "case_assigned"
      | "general",
    relatedId?: string
  ): Promise<void> {
    try {
      // Get FCM tokens for all target users
      const users = await this.userRepo.findAll(
        { _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } },
        { select: "fcmToken _id" }
      );

      const tokens = users
        .filter((user) => user.fcmToken)
        .map((user) => user.fcmToken!);

      if (tokens.length === 0) {
        logger.warn("No FCM tokens found for target users");
        return;
      }

      // Send FCM notification
      const message = {
        notification: { title, body },
        data: {
          type,
          relatedId: relatedId || "",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        tokens,
      };

      const response = await messaging.sendEachForMulticast(message);

      logger.info(
        `FCM sent: ${response.successCount} success, ${response.failureCount} failed`
      );

      // Store notification in database for each user
      const notifications = userIds.map((userId) => ({
        userId: new Types.ObjectId(userId),
        title,
        body,
        type,
        relatedId: relatedId ? new Types.ObjectId(relatedId) : undefined,
        isRead: false,
      }));

      await NotificationModel.insertMany(notifications);
    } catch (error) {
      logger.error(error, "Failed to send FCM notification");
    }
  }

  // Send notification to all users with specific roles
  async sendToRoles(
    roles: string[],
    title: string,
    body: string,
    type: "case_created" | "resource_created" | "case_assigned" | "general",
    relatedId?: string
  ): Promise<void> {
    const users = await this.userRepo.findAll(
      { role: { $in: roles } },
      { select: "_id" }
    );

    const userIds = users.map((user) => user._id.toString());
    await this.sendToUsers(userIds, title, body, type, relatedId);
  }
}
