import { ErrorCodeEnum } from "@/enums/error-code.enum";
import { CaseRepository } from "@/modules/case/case.repository";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@/utils/app-error.utils";
import { Types } from "mongoose";
import { INote } from "./note.model";
import { NoteRepository } from "./note.repository";
import { CreateNoteInput, UpdateNoteInput } from "./note.type";

export class NoteService {
  private noteRepo = new NoteRepository();
  private caseRepo = new CaseRepository();

  async createNote(
    createData: CreateNoteInput["body"],
    createdById: string,
    userRole: string
  ): Promise<{ success: boolean; data: Partial<INote>; message: string }> {
    // Only admin and superAdmin can create notes
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only admin and super-admin can create notes",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    // Check if case exists
    const caseExists = await this.caseRepo.findById(createData.case);
    if (!caseExists) {
      throw new NotFoundException(
        "Case not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    const newNote = await this.noteRepo.create({
      title: createData.title,
      description: createData.description,
      case: new Types.ObjectId(createData.case),
      createdBy: new Types.ObjectId(createdById),
    } as any);

    // update case's note array
    await this.caseRepo.updateById(createData.case, {
      $push: { notes: newNote._id },
    } as any);

    return {
      success: true,
      data: {
        id: newNote.id,
        title: newNote.title,
        description: newNote.description,
        createdAt: newNote.createdAt,
      },
      message: "Note created successfully",
    };
  }

  async updateNote(
    noteId: string,
    updateData: UpdateNoteInput["body"],
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<INote>;
    message: string;
  }> {
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Admin and SuperAdmin can update notes",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const noteExists = await this.noteRepo.checkNoteExists(noteId);
    if (!noteExists) {
      throw new NotFoundException(
        "Note not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    const updatedNote = await this.noteRepo.updateById(noteId, updateData);

    if (!updatedNote) {
      throw new BadRequestException(
        "Failed to update note",
        ErrorCodeEnum.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      data: {
        id: updatedNote.id,
        title: updatedNote.title,
        description: updatedNote.description,
        updatedAt: updatedNote.updatedAt,
      },
      message: "Note updated successfully",
    };
  }

  async deleteNote(
    noteId: string,
    userId: string,
    userRole: string
  ): Promise<{ success: boolean; message: string }> {
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Admin and SuperAdmin can delete notes",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const note = await this.noteRepo.findById(noteId);
    if (!note) {
      throw new NotFoundException(
        "Note not found.",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    await this.noteRepo.deleteById(noteId);

    await this.caseRepo.updateById(note.case.toString(), {
      $pull: { notes: noteId },
    } as any);

    return {
      success: true,
      message: "Note deleted successfully",
    };
  }

  async getNotesByCase(
    caseId: string,
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<INote>[];
    message: string;
  }> {
    const caseExists = await this.caseRepo.findById(caseId);

    if (!caseExists) {
      throw new NotFoundException(
        "Case not found.",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    const notes = await this.noteRepo.findNotesByCase(caseId);

    return {
      success: true,
      data: notes.map((note) => ({
        id: note._id,
        title: note.title,
        description: note.description,
        createdBy: note.createdBy,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
      message: "Notes retrieved successfully",
    };
  }

  async getNoteById(
    noteId: string,
    userId: string,
    userRole: string
  ): Promise<{ success: boolean; data: Partial<INote>; message: string }> {
    const note = await this.noteRepo.findNoteWithPopulated(noteId);
    if (!note) {
      throw new NotFoundException(
        "Note not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    return {
      success: true,
      data: note,
      message: "Note retrieved successfully",
    };
  }
}
