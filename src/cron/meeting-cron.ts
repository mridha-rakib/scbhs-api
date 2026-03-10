import { logger } from "@/middlewares/pino-logger";
import { MeetingRepository } from "@/modules/meeting/meeting.repository";
import cron from "node-cron";
const meetingRepo = new MeetingRepository();

export const startMeetingCronJobs = () => {
  // Mark expired meetings (unbooked slots that passed start time)
  cron.schedule("*/5 * * * *", async () => {
    try {
      await meetingRepo.markExpiredMeetings();
      logger.info("Expired meetings marked");
    } catch (error) {
      logger.error(error, "Error marking expired meetings");
    }
  });

  // Mark completed meetings (booked slots that passed end time)
  cron.schedule("*/5 * * * *", async () => {
    try {
      await meetingRepo.markCompletedMeetings();
      logger.info("Completed meetings marked");
    } catch (error) {
      logger.error(error, "Error marking completed meetings");
    }
  });

  // Delete old completed meetings (runs daily at 2 AM)
  cron.schedule("0 2 * * *", async () => {
    try {
      await meetingRepo.deleteOldCompletedMeetings(7);
      logger.info("Old completed meetings deleted");
    } catch (error) {
      logger.error(error, "Error deleting old meetings");
    }
  });

  logger.info("Meeting cron jobs started");
};
