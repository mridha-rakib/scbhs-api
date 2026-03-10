import { BaseRepository } from "@/modules/base/base.repository";
import NoteModel, { INote } from "./note.model";

export class NoteRepository extends BaseRepository<INote> {
  constructor() {
    super(NoteModel);
  }

  async findNotesByCase(caseId: string): Promise<INote[]> {
    return this.findAll(
      { case: caseId },
      {
        populate: [
          { path: "createdBy", select: "fullName email role" },
          { path: "case", select: "caseNumber title" },
        ],
        sort: { createdAt: -1 },
      }
    );
  }

  async findNoteWithPopulated(noteId: string): Promise<INote | null> {
    const notes = await this.findAll(
      { _id: noteId },
      {
        populate: [
          { path: "createdBy", select: "fullName email role" },
          { path: "case", select: "caseNumber title" },
        ],
      }
    );

    return notes[0] || null;
  }

  async checkNoteExists(noteId: string): Promise<boolean> {
    const note = await this.findById(noteId);

    return Boolean(note);
  }
}
