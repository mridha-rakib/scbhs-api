import { HTTPSTATUS } from "@/config/http.config";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { zParse } from "@/utils/validators.utils";
import { NextFunction, Request, Response } from "express";
import {
  createNoteSchema,
  deleteNoteSchema,
  getNotesByCaseSchema,
  updateNoteSchema,
} from "./note.schema";
import { NoteService } from "./note.service";
import {
  CreateNoteInput,
  DeleteNoteInput,
  GetNotesByCaseInput,
  UpdateNoteInput,
} from "./note.type";

export class NoteController {
  private noteService = new NoteService();

  createNote = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body }: CreateNoteInput = await zParse(createNoteSchema, req);

      const createdById = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.noteService.createNote(
        body,
        createdById,
        userRole
      );

      res.status(HTTPSTATUS.CREATED).json(result);
    }
  );

  updateNote = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { body, params }: UpdateNoteInput = await zParse(
        updateNoteSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.noteService.updateNote(
        params.id,
        body,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  deleteNote = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: DeleteNoteInput = await zParse(deleteNoteSchema, req);

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.noteService.deleteNote(
        params.id,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getNotesByCase = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { params }: GetNotesByCaseInput = await zParse(
        getNotesByCaseSchema,
        req
      );

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.noteService.getNotesByCase(
        params.caseId,
        userId,
        userRole
      );

      res.status(HTTPSTATUS.OK).json(result);
    }
  );

  getNoteById = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.noteService.getNoteById(id, userId, userRole);

      res.status(HTTPSTATUS.OK).json(result);
    }
  );
}
