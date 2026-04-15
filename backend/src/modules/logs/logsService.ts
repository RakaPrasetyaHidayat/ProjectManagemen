import prisma from "../../config/config.js";

export const createLog = async (actor: string, action: string, target: string) => {
  try {
    return await prisma.activity_logs.create({
      data: { actor, action, target },
    });
  } catch (error) {
    // Silently fail if logs table not available
  }
};

export const getLogs = async (limit = 50) => {
  try {
    const logs = await prisma.activity_logs.findMany({
      take: limit,
      orderBy: { id: "desc" },
    });
    return logs.map((log: any) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      target: log.target,
      when: log.created_at 
        ? new Date(log.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Unknown",
    }));
  } catch {
    return [];
  }
};

const logsService = { createLog, getLogs };
export default logsService;
