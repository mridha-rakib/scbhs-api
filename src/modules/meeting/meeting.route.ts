import { authMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { MeetingController } from "./meeting.controller";

const router = Router();
const meetingController = new MeetingController();

router.use(authMiddleware.authenticate);

// Supervisor routes
router.post(
  "/",
  authMiddleware.authorize(["Supervisor"]),
  meetingController.createMeeting
);

router.get(
  "/super-visor-meetings",
  authMiddleware.authorize(["Supervisor"]),
  meetingController.getSupervisorMeetings
);

router.get(
  "/supervisor/meeting-history",
  authMiddleware.authorize(["Supervisor"]),
  meetingController.getSupervisorMeetingHistory
);

router.put(
  "/zoom-link",
  authMiddleware.authorize(["Supervisor"]),
  meetingController.updateZoomLink
);

// Counsellor/clinician meetings history
router.get(
  "/meeting-history",
  authMiddleware.authorize(["Counsellor", "Clinician"]),
  meetingController.getMeetingHistory
);

//  supervisor update meeting
router.put(
  "/:meetingId",
  authMiddleware.authorize(["Supervisor"]),
  meetingController.updateMeeting
);

router.delete(
  "/:meetingId",
  authMiddleware.authorize(["Supervisor"]),
  meetingController.deleteMeeting
);

// Counsellor/Clinician routes
router.get(
  "/available",
  authMiddleware.authorize(["Counsellor", "Clinician"]),
  meetingController.getAvailableMeetings
);

router.get(
  "/my-bookings",
  authMiddleware.authorize(["Counsellor", "Clinician"]),
  meetingController.getUserBookedMeetings
);

router.post(
  "/:meetingId/book",
  authMiddleware.authorize(["Counsellor", "Clinician"]),
  meetingController.bookMeeting
);

router.put(
  "/:meetingId/cancel",
  authMiddleware.authorize(["Counsellor", "Clinician"]),
  meetingController.cancelMeeting
);

export default router;
