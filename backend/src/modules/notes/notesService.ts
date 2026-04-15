import prisma from "../../config/config.js";
import logsService from "../logs/logsService.js";

export const getAllNotes = async (page = 1, limit = 10, userId?: number) => {
  const skip = (page - 1) * limit;
  const where = userId ? { created_by: userId } : {};

  const [notes, total] = await Promise.all([
    prisma.notes.findMany({
      where,
      skip,
      take: limit,
      include: { user: { select: { id: true, username: true } } },
      orderBy: { created_at: "desc" },
    }),
    prisma.notes.count({ where }),
  ]);

  return { notes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getNoteById = async (id: number) => {
  return prisma.notes.findUnique({
    where: { id },
    include: { user: { select: { id: true, username: true } } },
  });
};

export const createNote = async (content: string, userId: number) => {
  const note = await prisma.notes.create({
    data: { content, created_by: userId },
    include: { user: { select: { id: true, username: true } } },
  });

  await logsService.createLog("System", "Created Note", content.substring(0, 50));
  return note;
};

export const updateNote = async (id: number, content: string, userId: number) => {
  const note = await prisma.notes.findUnique({ where: { id } });
  if (!note) throw new Error("Note not found");

  if (note.created_by !== userId) {
    throw new Error("You can only edit your own notes");
  }

  const updated = await prisma.notes.update({
    where: { id },
    data: { content, updated_at: new Date() },
    include: { user: { select: { id: true, username: true } } },
  });

  await logsService.createLog("System", "Updated Note", content.substring(0, 50));
  return updated;
};

export const deleteNote = async (id: number, userId: number) => {
  const note = await prisma.notes.findUnique({ where: { id } });
  if (!note) throw new Error("Note not found");

  if (note.created_by !== userId) {
    throw new Error("You can only delete your own notes");
  }

  await prisma.notes.delete({ where: { id } });
  await logsService.createLog("System", "Deleted Note", `ID: ${id}`);
};

const notesService = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
};

export default notesService;
