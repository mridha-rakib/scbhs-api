import { authMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { NotificationController } from "./notification.controller";

const router = Router();
const notificationController = new NotificationController();

router.use(authMiddleware.authenticate);

router.get("/", notificationController.getUserNotifications);

// Get unread notification count (for badge)
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;
