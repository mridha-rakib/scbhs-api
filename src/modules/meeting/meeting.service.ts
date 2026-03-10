import { ErrorCodeEnum } from "@/enums/error-code.enum";
import { UserRepository } from "@/modules/user/user.repository";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@/utils/app-error.utils";
import { Types } from "mongoose";
import { IMeeting } from "./meeting.model";
import { MeetingRepository } from "./meeting.repository";
import {
  CreateMeetingInput,
  UpdateMeetingInput,
  UpdateZoomLinkInput,
} from "./meeting.type";

export class MeetingService {
  private meetingRepo = new MeetingRepository();
  private userRepo = new UserRepository();

  private parseTime(timeStr: string, date: Date): Date {
    const trimmed = timeStr.trim();
    const [time, modifier] = trimmed.split(/\s+/);
    let [hour, minute] = time.split(":").map(Number);

    // Handle AM/PM conversion
    if (modifier) {
      const mod = modifier.toUpperCase();
      if (mod === "PM" && hour < 12) {
        hour += 12;
      }
      if (mod === "AM" && hour === 12) {
        hour = 0;
      }
    }

    const result = new Date(date);
    result.setHours(hour, minute, 0, 0);
    return result;
  }

  async createMeeting(
    createData: CreateMeetingInput["body"],
    supervisorId: string,
    userRole: string
  ): Promise<{ success: boolean; data: Partial<IMeeting>; message: string }> {
    if (userRole !== "Supervisor") {
      throw new UnauthorizedException(
        "Only Supervisors can create meeting slots",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const meetingDate = new Date(createData.date);
    // const [startHour, startMin] = createData.startTime.split(":").map(Number);
    // const [endHour, endMin] = createData.endTime.split(":").map(Number);

    // Use the helper function to parse times (supports AM/PM)
    const startTime = this.parseTime(createData.startTime, meetingDate);
    const endTime = this.parseTime(createData.endTime, meetingDate);

    // const startTime = new Date(meetingDate);
    // startTime.setHours(startHour, startMin, 0, 0);

    // const endTime = new Date(meetingDate);
    // endTime.setHours(endHour, endMin, 0, 0);

    const now = new Date();
    if (startTime <= now) {
      throw new BadRequestException(
        "Meeting start time must be in the future",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    const overlapping = await this.meetingRepo.findOverlappingMeetings(
      supervisorId,
      startTime,
      endTime
    );

    if (overlapping.length > 0) {
      throw new BadRequestException(
        "This time slot overlaps with an existing meeting",
        ErrorCodeEnum.RESOURCE_CONFLICT
      );
    }

    const newMeeting = await this.meetingRepo.create({
      supervisor: new Types.ObjectId(supervisorId),
      startTime,
      endTime,
      status: "Available",
    } as any);

    return {
      success: true,
      data: {
        id: newMeeting._id,
        startTime: newMeeting.startTime,
        endTime: newMeeting.endTime,
        status: newMeeting.status,
        createdAt: newMeeting.createdAt,
      },
      message: "Meeting slot created successfully",
    };
  }

  //
  // const now = new Date();

  //   const meetings = await this.meetingRepo.findAll(
  //     {
  //       bookedBy: userId,
  //       status: "Booked",
  //       endTime: { $gt: now },
  //     },
  //     {
  //       populate: [
  //         { path: "supervisor", select: "fullName email zoomMeetingLink" },
  //       ],
  //       sort: { startTime: 1 },
  //     }
  //   );

  //   return {
  //     success: true,
  //     data: meetings.map((meeting) => ({
  //       id: meeting.id,
  //       supervisor: meeting.supervisor,
  //       startTime: meeting.startTime,
  //       endTime: meeting.endTime,
  //       status: meeting.status,
  //       bookedAt: meeting.bookedAt,
  //     })),
  //     message: "Active and upcoming meetings retrieved successfully",
  //   };

  async getSupervisorMeetings(supervisorId: string): Promise<{
    success: boolean;
    data: {
      meetings: Partial<IMeeting>[];
      stats: any;
    };
    message: string;
  }> {
    const now = new Date();

    // const meetings =
    //   await this.meetingRepo.findSupervisorMeetings(supervisorId);

    const meetings = await this.meetingRepo.findAll(
      {
        supervisor: supervisorId,
        status: { $in: ["Available", "Booked"] },
        endTime: { $gt: now },
      },
      {
        populate: [
          { path: "supervisor", select: "fullName email role zoomMeetingLink" },
          { path: "bookedBy", select: "fullName email role" },
        ],
        sort: { startTime: 1 },
      }
    );

    const stats = await this.meetingRepo.getSupervisorStats(supervisorId);

    return {
      success: true,
      data: {
        meetings: meetings.map((meeting) => ({
          id: meeting._id,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          zoomMeetingLink: (meeting.supervisor as any)?.zoomMeetingLink,
          status: meeting.status,
          supervisor: meeting.supervisor,
          bookedBy: meeting.bookedBy,
          bookedAt: meeting.bookedAt,
        })),
        stats,
      },
      message: "Meetings retrieved successfully",
    };
  }

  async getAvailableMeetings(): Promise<{
    success: boolean;
    data: Partial<IMeeting>[];
    message: string;
  }> {
    const meetings = await this.meetingRepo.findAvailableMeetings();
    return {
      success: true,
      data: meetings.map((meeting) => ({
        id: meeting._id,
        supervisor: meeting.supervisor,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status,
      })),
      message: "Available meetings retrieved successfully",
    };
  }

  async getUserBookedMeetings(userId: string): Promise<{
    success: boolean;
    data: Partial<IMeeting>[];
    message: string;
  }> {
    const now = new Date();

    // const meetings = await this.meetingRepo.findUserBookedMeetings(userId);

    const meetings = await this.meetingRepo.findAll(
      {
        bookedBy: userId,
        status: "Booked",
        endTime: { $gt: now },
      },
      {
        populate: [
          { path: "supervisor", select: "fullName email zoomMeetingLink" },
        ],
        sort: { startTime: 1 },
      }
    );

    return {
      success: true,
      data: meetings.map((meeting) => ({
        id: meeting._id,
        supervisor: meeting.supervisor,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status,
        bookedAt: meeting.bookedAt,
      })),
      message: "Active and upcoming meetings retrieved successfully",
    };
  }

  async bookMeeting(
    meetingId: string,
    userId: string,
    userRole: string
  ): Promise<{ success: boolean; data: Partial<IMeeting>; message: string }> {
    if (!["Counsellor", "Clinician"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Counsellors and Clinicians can book meetings",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const meeting = await this.meetingRepo.findMeetingById(meetingId);
    if (!meeting) {
      throw new NotFoundException(
        "Meeting not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    if (meeting.status !== "Available") {
      throw new BadRequestException(
        "This meeting slot is not available",
        ErrorCodeEnum.RESOURCE_CONFLICT
      );
    }

    const now = new Date();
    if (meeting.startTime <= now) {
      throw new BadRequestException(
        "Cannot book meetings that have already started",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    const updatedMeeting = await this.meetingRepo.updateById(meetingId, {
      status: "Booked",
      bookedBy: new Types.ObjectId(userId),
      bookedAt: now,
    } as any);

    return {
      success: true,
      data: {
        id: updatedMeeting!._id,
        startTime: updatedMeeting!.startTime,
        endTime: updatedMeeting!.endTime,
        status: updatedMeeting!.status,
        bookedAt: updatedMeeting!.bookedAt,
      },
      message: "Meeting booked successfully",
    };
  }

  async cancelMeeting(
    meetingId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const meeting = await this.meetingRepo.findMeetingById(meetingId);
    if (!meeting) {
      throw new NotFoundException(
        "Meeting not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    const bookedById =
      meeting.bookedBy && (meeting.bookedBy as any)._id
        ? (meeting.bookedBy as any)._id.toString()
        : meeting.bookedBy
          ? (meeting.bookedBy as any).toString()
          : null;

    if (bookedById !== userId) {
      throw new UnauthorizedException(
        "You can only cancel your own bookings",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    if (meeting.status !== "Booked") {
      throw new BadRequestException(
        "Only booked meetings can be cancelled",
        ErrorCodeEnum.RESOURCE_CONFLICT
      );
    }

    const now = new Date();
    const timeDiff = meeting.startTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff <= 30) {
      throw new BadRequestException(
        "Cannot cancel meetings within 30 minutes of start time",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    await this.meetingRepo.updateById(meetingId, {
      status: "Available",
      cancelledAt: now,
      bookedBy: null,
      bookedAt: null,
    } as any);

    return {
      success: true,
      message: "Meeting cancelled successfully",
    };
  }

  // async updateMeeting(
  //   meetingId: string,
  //   updatedData: UpdateMeetingInput["body"],
  //   supervisorId: string,
  //   userRole: string
  // ): Promise<{ success: boolean; data: Partial<IMeeting>; message: string }> {
  //   if (userRole !== "Supervisor") {
  //     throw new UnauthorizedException(
  //       "Only Supervisors can delete meeting slots",
  //       ErrorCodeEnum.ACCESS_UNAUTHORIZED
  //     );
  //   }

  //   const meeting = await this.meetingRepo.findById(meetingId);
  //   if (!meeting) {
  //     throw new NotFoundException(
  //       "Meeting not found",
  //       ErrorCodeEnum.RESOURCE_NOT_FOUND
  //     );
  //   }

  //   if (meeting.supervisor.toString() !== supervisorId) {
  //     throw new UnauthorizedException(
  //       "You can only update your own meetings.",
  //       ErrorCodeEnum.ACCESS_UNAUTHORIZED
  //     );
  //   }

  //   if (!updatedData.date || !updatedData.startTime || !updatedData.endTime) {
  //     throw new BadRequestException(
  //       "date, startTime, and endTime are required to update a meeting",
  //       ErrorCodeEnum.VALIDATION_ERROR
  //     );
  //   }

  //   const meetingDate = new Date(updatedData.date);
  //   const [startHour, startMin] = updatedData.startTime.split(":").map(Number);
  //   const [endHour, endMin] = updatedData.endTime.split(":").map(Number);

  //   const newStartTime = new Date(meetingDate);
  //   newStartTime.setHours(startHour, startMin, 0, 0);

  //   const newEndTime = new Date(meetingDate);
  //   newEndTime.setHours(endHour, endMin, 0, 0);

  //   const now = new Date();
  //   if (newStartTime <= now) {
  //     throw new BadRequestException(
  //       "Meeting start time must be in the future",
  //       ErrorCodeEnum.VALIDATION_ERROR
  //     );
  //   }

  //   const overlapping = await this.meetingRepo.findOverlappingMeetings(
  //     supervisorId,
  //     newStartTime,
  //     newEndTime,
  //     meetingId
  //   );

  //   if (overlapping.length > 0) {
  //     throw new BadRequestException(
  //       "This time slot overlaps with another existing meeting",
  //       ErrorCodeEnum.RESOURCE_CONFLICT
  //     );
  //   }

  //   if (meeting.status === "Booked") {
  //     throw new BadRequestException(
  //       "Cannot update a meeting slot that is already booked",
  //       ErrorCodeEnum.RESOURCE_CONFLICT
  //     );
  //   }

  //   const updatedMeeting = await this.meetingRepo.updateById(meetingId, {
  //     startTime: newStartTime,
  //     endTime: newEndTime,
  //   } as any);

  //   return {
  //     success: true,
  //     data: {
  //       id: updatedMeeting!.id,
  //       startTime: updatedMeeting!.startTime,
  //       endTime: updatedMeeting!.endTime,
  //       status: updatedMeeting!.status,
  //       createdAt: updatedMeeting!.createdAt,
  //     },
  //     message: "Meeting updated successfully",
  //   };
  // }

  // async updateMeeting(
  //   meetingId: string,
  //   updateData: UpdateMeetingInput["body"],
  //   supervisorId: string,
  //   userRole: string
  // ): Promise<{ success: boolean; data: Partial<IMeeting>; message: string }> {
  //   if (userRole !== "Supervisor") {
  //     throw new UnauthorizedException(
  //       "Only Supervisors can update meeting slots",
  //       ErrorCodeEnum.ACCESS_UNAUTHORIZED
  //     );
  //   }

  //   const meeting = await this.meetingRepo.findById(meetingId);
  //   if (!meeting) {
  //     throw new NotFoundException(
  //       "Meeting not found",
  //       ErrorCodeEnum.RESOURCE_NOT_FOUND
  //     );
  //   }

  //   // Verify ownership
  //   if (meeting.supervisor.toString() !== supervisorId) {
  //     throw new UnauthorizedException(
  //       "You can only update your own meeting slots",
  //       ErrorCodeEnum.ACCESS_UNAUTHORIZED
  //     );
  //   }

  //   // Cannot update if meeting is already booked
  //   if (meeting.status === "Booked") {
  //     throw new BadRequestException(
  //       "Cannot update a meeting that has already been booked",
  //       ErrorCodeEnum.RESOURCE_CONFLICT
  //     );
  //   }

  //   // Cannot update completed or cancelled meetings
  //   if (["Completed", "Cancelled", "Expired"].includes(meeting.status)) {
  //     throw new BadRequestException(
  //       `Cannot update ${meeting.status.toLowerCase()} meetings`,
  //       ErrorCodeEnum.RESOURCE_CONFLICT
  //     );
  //   }

  //   let newStartTime = meeting.startTime;
  //   let newEndTime = meeting.endTime;

  //   let baseDate;
  //   if (updateData?.date || updateData?.startTime || updateData?.endTime) {
  //     baseDate = updateData.date
  //       ? new Date(updateData.date)
  //       : new Date(meeting.startTime);

  //     if (updateData.startTime) {
  //       newStartTime = this.parseTime(updateData.startTime, baseDate);
  //     }

  //     if (updateData.endTime) {
  //       newEndTime = this.parseTime(updateData.endTime, baseDate);
  //     }

  //     // Ensure start time is in the future
  //     const now = new Date();
  //     if (newStartTime <= now) {
  //       throw new BadRequestException(
  //         "Meeting start time must be in the future",
  //         ErrorCodeEnum.VALIDATION_ERROR
  //       );
  //     }

  //     // Check for overlapping meetings (exclude current meeting)
  //     const overlapping = await this.meetingRepo.findOverlappingMeetings(
  //       supervisorId,
  //       newStartTime,
  //       newEndTime,
  //       meetingId
  //     );

  //     if (overlapping.length > 0) {
  //       throw new BadRequestException(
  //         "This time slot overlaps with an existing meeting",
  //         ErrorCodeEnum.RESOURCE_CONFLICT
  //       );
  //     }
  //   }

  //   const updatedMeeting = await this.meetingRepo.updateById(meetingId, {
  //     date: baseDate,
  //     startTime: newStartTime,
  //     endTime: newEndTime,
  //   } as any);

  //   return {
  //     success: true,
  //     data: {
  //       id: updatedMeeting!.id,
  //       startTime: updatedMeeting!.startTime,
  //       endTime: updatedMeeting!.endTime,
  //       status: updatedMeeting!.status,
  //       updatedAt: updatedMeeting!.updatedAt,
  //     },
  //     message: "Meeting slot updated successfully",
  //   };
  // }

  // async updateMeeting(
  //   meetingId: string,
  //   updateData: UpdateMeetingInput["body"],
  //   supervisorId: string,
  //   userRole: string
  // ): Promise<{ success: boolean; data: Partial<IMeeting>; message: string }> {
  //   if (userRole !== "Supervisor") {
  //     throw new UnauthorizedException(
  //       "Only Supervisors can update meeting slots",
  //       ErrorCodeEnum.ACCESS_UNAUTHORIZED
  //     );
  //   }

  //   const meeting = await this.meetingRepo.findById(meetingId);
  //   if (!meeting) {
  //     throw new NotFoundException(
  //       "Meeting not found",
  //       ErrorCodeEnum.RESOURCE_NOT_FOUND
  //     );
  //   }

  //   // Verify ownership
  //   if (meeting.supervisor.toString() !== supervisorId) {
  //     throw new UnauthorizedException(
  //       "You can only update your own meeting slots",
  //       ErrorCodeEnum.ACCESS_UNAUTHORIZED
  //     );
  //   }

  //   // Cannot update if meeting is already booked
  //   if (meeting.status === "Booked") {
  //     throw new BadRequestException(
  //       "Cannot update a meeting that has already been booked",
  //       ErrorCodeEnum.RESOURCE_CONFLICT
  //     );
  //   }

  //   // Cannot update completed or cancelled meetings
  //   if (["Completed", "Cancelled", "Expired"].includes(meeting.status)) {
  //     throw new BadRequestException(
  //       `Cannot update ${meeting.status.toLowerCase()} meetings`,
  //       ErrorCodeEnum.RESOURCE_CONFLICT
  //     );
  //   }

  //   // Check if any update data is provided
  //   if (
  //     !updateData ||
  //     (!updateData.date && !updateData.startTime && !updateData.endTime)
  //   ) {
  //     throw new BadRequestException(
  //       "At least one field (date, startTime, or endTime) must be provided for update",
  //       ErrorCodeEnum.VALIDATION_ERROR
  //     );
  //   }

  //   // Initialize with existing meeting times
  //   let newStartTime = new Date(meeting.startTime);
  //   let newEndTime = new Date(meeting.endTime);

  //   // Determine the base date to use
  //   const baseDate = updateData.date
  //     ? new Date(updateData.date)
  //     : new Date(meeting.startTime); // Use existing date if not updating

  //   // If updating startTime, parse it with the base date
  //   if (updateData.startTime) {
  //     newStartTime = this.parseTime(updateData.startTime, baseDate);
  //   } else if (updateData.date) {
  //     // If only date is updated, preserve the existing time
  //     const existingStartHour = new Date(meeting.startTime).getHours();
  //     const existingStartMin = new Date(meeting.startTime).getMinutes();
  //     newStartTime = new Date(baseDate);
  //     newStartTime.setHours(existingStartHour, existingStartMin, 0, 0);
  //   }

  //   // If updating endTime, parse it with the base date
  //   if (updateData.endTime) {
  //     newEndTime = this.parseTime(updateData.endTime, baseDate);
  //   } else if (updateData.date) {
  //     // If only date is updated, preserve the existing time
  //     const existingEndHour = new Date(meeting.endTime).getHours();
  //     const existingEndMin = new Date(meeting.endTime).getMinutes();
  //     newEndTime = new Date(baseDate);
  //     newEndTime.setHours(existingEndHour, existingEndMin, 0, 0);
  //   }

  //   // Ensure end time is after start time
  //   if (newEndTime <= newStartTime) {
  //     throw new BadRequestException(
  //       "End time must be after start time",
  //       ErrorCodeEnum.VALIDATION_ERROR
  //     );
  //   }

  //   // Ensure start time is in the future
  //   const now = new Date();
  //   if (newStartTime <= now) {
  //     throw new BadRequestException(
  //       "Meeting start time must be in the future",
  //       ErrorCodeEnum.VALIDATION_ERROR
  //     );
  //   }

  //   // Check for overlapping meetings (exclude current meeting)
  //   const overlapping = await this.meetingRepo.findOverlappingMeetings(
  //     supervisorId,
  //     newStartTime,
  //     newEndTime,
  //     meetingId
  //   );

  //   if (overlapping.length > 0) {
  //     throw new BadRequestException(
  //       "This time slot overlaps with an existing meeting",
  //       ErrorCodeEnum.RESOURCE_CONFLICT
  //     );
  //   }

  //   const updatedMeeting = await this.meetingRepo.updateById(meetingId, {
  //     startTime: newStartTime,
  //     endTime: newEndTime,
  //   } as any);

  //   return {
  //     success: true,
  //     data: {
  //       id: updatedMeeting!.id,
  //       startTime: updatedMeeting!.startTime,
  //       endTime: updatedMeeting!.endTime,
  //       status: updatedMeeting!.status,
  //       updatedAt: updatedMeeting!.updatedAt,
  //     },
  //     message: "Meeting slot updated successfully",
  //   };
  // }

  async updateMeeting(
    meetingId: string,
    updateData: UpdateMeetingInput["body"],
    supervisorId: string,
    userRole: string
  ): Promise<{ success: boolean; data: Partial<IMeeting>; message: string }> {
    if (userRole !== "Supervisor") {
      throw new UnauthorizedException(
        "Only Supervisors can update meeting slots",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const meeting = await this.meetingRepo.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException(
        "Meeting not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    // Verify ownership
    if (meeting.supervisor.toString() !== supervisorId) {
      throw new UnauthorizedException(
        "You can only update your own meeting slots",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    // Cannot update if meeting is already booked
    if (meeting.status === "Booked") {
      throw new BadRequestException(
        "Cannot update a meeting that has already been booked",
        ErrorCodeEnum.RESOURCE_CONFLICT
      );
    }

    // Cannot update completed or cancelled meetings
    if (["Completed", "Cancelled", "Expired"].includes(meeting.status)) {
      throw new BadRequestException(
        `Cannot update ${meeting.status.toLowerCase()} meetings`,
        ErrorCodeEnum.RESOURCE_CONFLICT
      );
    }

    // ✅ FIXED: Better validation check
    const hasUpdates = Boolean(
      updateData?.date || updateData?.startTime || updateData?.endTime
    );

    if (!hasUpdates) {
      throw new BadRequestException(
        "At least one field (date, startTime, or endTime) must be provided for update",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    // Rest of the logic remains the same...
    let newStartTime = new Date(meeting.startTime);
    let newEndTime = new Date(meeting.endTime);

    const baseDate = updateData?.date
      ? new Date(updateData.date)
      : new Date(meeting.startTime);

    if (updateData?.startTime) {
      newStartTime = this.parseTime(updateData.startTime, baseDate);
    } else if (updateData?.date) {
      const existingStartHour = new Date(meeting.startTime).getHours();
      const existingStartMin = new Date(meeting.startTime).getMinutes();
      newStartTime = new Date(baseDate);
      newStartTime.setHours(existingStartHour, existingStartMin, 0, 0);
    }

    if (updateData?.endTime) {
      newEndTime = this.parseTime(updateData.endTime, baseDate);
    } else if (updateData?.date) {
      const existingEndHour = new Date(meeting.endTime).getHours();
      const existingEndMin = new Date(meeting.endTime).getMinutes();
      newEndTime = new Date(baseDate);
      newEndTime.setHours(existingEndHour, existingEndMin, 0, 0);
    }

    if (newEndTime <= newStartTime) {
      throw new BadRequestException(
        "End time must be after start time",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    const now = new Date();
    if (newStartTime <= now) {
      throw new BadRequestException(
        "Meeting start time must be in the future",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    const overlapping = await this.meetingRepo.findOverlappingMeetings(
      supervisorId,
      newStartTime,
      newEndTime,
      meetingId
    );

    if (overlapping.length > 0) {
      throw new BadRequestException(
        "This time slot overlaps with an existing meeting",
        ErrorCodeEnum.RESOURCE_CONFLICT
      );
    }

    const updatedMeeting = await this.meetingRepo.updateById(meetingId, {
      startTime: newStartTime,
      endTime: newEndTime,
    } as any);

    return {
      success: true,
      data: {
        id: updatedMeeting!._id,
        startTime: updatedMeeting!.startTime,
        endTime: updatedMeeting!.endTime,
        status: updatedMeeting!.status,
        updatedAt: updatedMeeting!.updatedAt,
      },
      message: "Meeting slot updated successfully",
    };
  }

  async deleteMeeting(
    meetingId: string,
    supervisorId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (userRole !== "Supervisor") {
      throw new UnauthorizedException(
        "Only Supervisors can delete meeting slots",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const meeting = await this.meetingRepo.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException(
        "Meeting not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    if (meeting.supervisor.toString() !== supervisorId) {
      throw new UnauthorizedException(
        "You can only delete your own meeting slots",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const now = new Date();
    const timeDiff = meeting.startTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff <= 30) {
      throw new BadRequestException(
        "Cannot delete meetings within 30 minutes of start time",
        ErrorCodeEnum.VALIDATION_ERROR
      );
    }

    await this.meetingRepo.deleteById(meetingId);

    return {
      success: true,
      message: "Meeting slot deleted successfully",
    };
  }

  async updateZoomLink(
    updateData: UpdateZoomLinkInput["body"],
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: { zoomMeetingLink: string };
    message: string;
  }> {
    // Only Supervisors can update Zoom link
    if (userRole !== "Supervisor") {
      throw new UnauthorizedException(
        "Only Supervisors can update Zoom meeting link",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    await this.userRepo.updateById(userId, {
      zoomMeetingLink: updateData.zoomMeetingLink,
    } as any);

    return {
      success: true,
      data: {
        zoomMeetingLink: updateData.zoomMeetingLink,
      },
      message: "Zoom meeting link updated successfully",
    };
  }

  async getMeetingHistory(
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<IMeeting>[];
    message: string;
  }> {
    const meetings = await this.meetingRepo.getUserMeetingHistory(userId);
    return {
      success: true,
      data: meetings.map((meeting) => ({
        id: meeting.id,
        supervisor: meeting.supervisor,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status,
      })),
      message: "User meeting history retrieved successfully",
    };
  }

  async getSupervisorMeetingHistory(
    supervisorId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<IMeeting>[];
    message: string;
  }> {
    if (userRole !== "Supervisor") {
      throw new UnauthorizedException(
        "Only Supervisors can access this endpoint",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const meetings =
      await this.meetingRepo.getSupervisorMeetingHistory(supervisorId);

    return {
      success: true,
      data: meetings.map((meeting) => ({
        id: meeting.id,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status,
        bookedBy: meeting.bookedBy,
        bookedAt: meeting.bookedAt,
        completedAt: meeting.completedAt,
      })),
      message: "Meeting history retrieved successfully",
    };
  }
}
