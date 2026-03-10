import { BaseRepository } from "@/modules/base/base.repository";
import { Types } from "mongoose";
import MeetingModel, { IMeeting } from "./meeting.model";

export class MeetingRepository extends BaseRepository<IMeeting> {
  constructor() {
    super(MeetingModel);
  }

  async findMeetingById(meetingId: string): Promise<IMeeting | null> {
    const meetings = await this.findAll(
      { _id: meetingId },
      {
        populate: [
          { path: "supervisor", select: "fullName email role zoomMeetingLink" },
          { path: "bookedBy", select: "fullName email role" },
        ],
      }
    );

    return meetings[0] || null;
  }

  async findOverlappingMeetings(
    supervisorId: string,
    startTime: Date,
    endTime: Date,
    excludeMeetingId?: string
  ): Promise<IMeeting[]> {
    const query: any = {
      supervisor: new Types.ObjectId(supervisorId),
      status: { $in: ["Available", "Booked"] },
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
      ],
    };

    if (excludeMeetingId) {
      query._id = { $ne: new Types.ObjectId(excludeMeetingId) };
    }

    return this.findAll(query);
  }

  async findSupervisorMeetings(supervisorId: string): Promise<IMeeting[]> {
    return this.findAll(
      { supervisor: supervisorId },
      {
        populate: [{ path: "bookedBy", select: "fullName email role" }],
        sort: { startTime: 1 },
      }
    );
  }

  async findAvailableMeetings(): Promise<IMeeting[]> {
    const now = new Date();

    return this.findAll(
      { status: "Available", startTime: { $gt: now } },
      {
        populate: [
          {
            path: "supervisor",
            select: "fullName email zoomMeetingLink",
          },
        ],
        sort: { startTime: 1 },
      }
    );
  }

  async findUserBookedMeetings(userId: string): Promise<IMeeting[]> {
    return this.findAll(
      {
        bookedBy: userId,
        status: { $in: ["Booked", "Completed"] },
      },
      {
        populate: [
          { path: "supervisor", select: "fullName email zoomMeetingLink" },
        ],
        sort: { startTime: 1 },
      }
    );
  }

  async getSupervisorStats(supervisorId: string): Promise<{
    total: number;
    available: number;
    booked: number;
    completed: number;
    cancelled: number;
    expired: number;
  }> {
    const stats = await this.model.aggregate([
      { $match: { supervisor: new Types.ObjectId(supervisorId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] },
          },
          booked: { $sum: { $cond: [{ $eq: ["$status", "Booked"] }, 1, 0] } },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
          },
          expired: { $sum: { $cond: [{ $eq: ["$status", "Expired"] }, 1, 0] } },
        },
      },
    ]);

    return (
      stats[0] || {
        total: 0,
        available: 0,
        booked: 0,
        completed: 0,
        cancelled: 0,
        expired: 0,
      }
    );
  }

  async markExpiredMeetings(): Promise<void> {
    const now = new Date();
    await this.model.updateMany(
      {
        status: "Available",
        startTime: { $lt: now },
      },
      {
        status: "Expired",
      }
    );
  }

  async markCompletedMeetings(): Promise<void> {
    const now = new Date();
    await this.model.updateMany(
      {
        status: "Booked",
        endTime: { $lt: now },
      },
      {
        status: "Completed",
        completedAt: now,
      }
    );
  }

  async deleteOldCompletedMeetings(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.model.deleteMany({
      status: "Completed",
      completedAt: { $lt: cutoffDate },
    });
  }

  async getUserMeetingHistory(userId: string): Promise<IMeeting[]> {
    return this.findAll(
      { status: "Completed", bookedBy: userId },
      {
        populate: [
          {
            path: "supervisor",
            select: "fullName email zoomMeetingLink",
          },
          {
            path: "bookedBy",
            select: "fullName email role",
          },
        ],
        sort: { startTime: 1 },
      }
    );
  }

  async getSupervisorMeetingHistory(supervisorId: string): Promise<IMeeting[]> {
    return this.findAll(
      {
        supervisor: new Types.ObjectId(supervisorId),
        status: "Completed",
      },
      {
        populate: [{ path: "bookedBy", select: "fullName email role" }],
        sort: { startTime: -1 },
      }
    );
  }
}
