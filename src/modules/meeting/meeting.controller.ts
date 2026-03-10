import { HTTPSTATUS } from "@/config/http.config";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { zParse } from "@/utils/validators.utils";
import { NextFunction, Request, Response } from "express";
import {
  bookMeetingSchema,
  cancelMeetingSchema,
  createMeetingSchema,
  deleteMeetingSchema,
  updateMeetingSchema,
  updateZoomLinkSchema,
} from "./meeting.schema";
import { MeetingService } from "./meeting.service";
import {
  BookMeetingInput,
  CancelMeetingInput,
  CreateMeetingInput,
  DeleteMeetingInput,
  UpdateMeetingInput,
  UpdateZoomLinkInput,
} from "./meeting.type";

export class MeetingController {
  private meetingService = new MeetingService();

  createMeeting = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body }: CreateMeetingInput = await zParse(
        createMeetingSchema,
        req
      );

      const supervisorId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.meetingService.createMeeting(
        body,
        supervisorId,
        userRole
      );

      res.status(HTTPSTATUS.CREATED).json(result);
    }
  );

  getSupervisorMeetings = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const supervisorId = req.user!.userId;

      const result =
        await this.meetingService.getSupervisorMeetings(supervisorId);

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getAvailableMeetings = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const result = await this.meetingService.getAvailableMeetings();

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getUserBookedMeetings = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = req.user!.userId;

      const result = await this.meetingService.getUserBookedMeetings(userId);

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  bookMeeting = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: BookMeetingInput = await zParse(bookMeetingSchema, req);

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.meetingService.bookMeeting(
        params.meetingId,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  cancelMeeting = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: CancelMeetingInput = await zParse(
        cancelMeetingSchema,
        req
      );

      const userId = req.user!.userId;

      const result = await this.meetingService.cancelMeeting(
        params.meetingId,
        userId
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  updateMeeting = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body, params }: UpdateMeetingInput = await zParse(
        updateMeetingSchema,
        req
      );

      const supervisorId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.meetingService.updateMeeting(
        params.meetingId,
        body,
        supervisorId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  deleteMeeting = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: DeleteMeetingInput = await zParse(
        deleteMeetingSchema,
        req
      );

      const supervisorId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.meetingService.deleteMeeting(
        params.meetingId,
        supervisorId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  updateZoomLink = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body }: UpdateZoomLinkInput = await zParse(
        updateZoomLinkSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.meetingService.updateZoomLink(
        body,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getMeetingHistory = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.meetingService.getMeetingHistory(
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getSupervisorMeetingHistory = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const supervisorId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.meetingService.getSupervisorMeetingHistory(
        supervisorId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );
}
