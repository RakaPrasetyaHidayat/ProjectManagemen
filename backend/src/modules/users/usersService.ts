import prisma from "../../config/config.js";
import bcrypt from "bcrypt";

export const getAllUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.users.findMany({
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: { id: true, username: true, role: true, status: true, created_at: true },
    }),
    prisma.users.count(),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserById = async (id: number) => {
  return prisma.users.findUnique({
    where: { id },
    select: { id: true, username: true, role: true, status: true, created_at: true },
  });
};

export const getProfile = async (userId: number) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      status: true,
      created_at: true,
      tasks: {
        select: { id: true, task_name: true, task_status: true, deadline: true },
        orderBy: { id: "desc" },
        take: 5,
      },
    },
  });

  if (!user) throw new Error("User not found");
  return user;
};

export const createUser = async (data: any) => {
  const { username, password, role = "staf", status = "Pending" } = data;
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const existing = await prisma.users.findUnique({ where: { username } });
  if (existing) {
    throw new Error("Username already taken");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const u = await prisma.users.create({
    data: { username, password: hashedPassword, role, status },
    select: { id: true, username: true, role: true, status: true, created_at: true },
  });
  try {
    await prisma.activity_logs.create({ data: { actor: "System", action: `Created User ${u.username}`, target: `User ID: ${u.id}` } });
  } catch (_e) {
    // ignore logging errors
  }
  return u;
};

export const updateUser = async (id: number, data: any) => {
  const existing = await prisma.users.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("User not found");
  }

  // Check if username is being changed and if new username already exists
  if (data.username && data.username !== existing.username) {
    const usernameTaken = await prisma.users.findUnique({ where: { username: data.username } });
    if (usernameTaken) {
      throw new Error("Username already taken");
    }
  }

  const updateData: any = { ...data };
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const u = await prisma.users.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, role: true, status: true, created_at: true },
  });
  try {
    await prisma.activity_logs.create({ data: { actor: "System", action: `Updated User ${u.username}`, target: `User ID: ${u.id}` } });
  } catch (_e) {
    // ignore logging errors
  }
  return u;
};

export const deleteUser = async (id: number) => {
  const existing = await prisma.users.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("User not found");
  }
  await prisma.users.delete({ where: { id } });
  try {
    await prisma.activity_logs.create({ data: { actor: "System", action: `Deleted User ${existing.username}`, target: `User ID: ${id}` } });
  } catch (_e) {
    // ignore logging errors
  }
  return null;
};

export const getDashboardStats = async () => {
  const now = new Date();

  const [totalTasks, totalProjects, totalUsers, tasksByStatus, overdueByStatus, recentTasks] =
    await Promise.all([
      prisma.tasks.count(),
      prisma.project.count(),
      prisma.users.count(),
      prisma.tasks.groupBy({ by: ["task_status"], _count: { task_status: true } }),
      prisma.tasks.groupBy({ 
        by: ["task_status"], 
        where: { deadline: { lt: now }, task_status: { in: ["To_Do", "On_Progress"] } },
        _count: { task_status: true } 
      }),
      prisma.tasks.findMany({
        take: 5,
        orderBy: { id: "desc" },
        include: {
          project: { select: { project_name: true } },
          users: { select: { username: true } },
        },
      }),
    ]);

  const statusMap: Record<string, number> = {
    To_Do: 0,
    On_Progress: 0,
    Done: 0,
    Overdue: 0,
  };

  // Populate base counts from DB
  tasksByStatus.forEach((s: any) => {
    if (s.task_status) statusMap[s.task_status] = s._count.task_status;
  });

  // Calculate overdue breakdown and adjust base counts
  let totalOverdue = 0;
  overdueByStatus.forEach((s: any) => {
    const count = s._count.task_status;
    totalOverdue += count;
    // Subtract overdue tasks from their original status counts to get net counts
    if (s.task_status && statusMap[s.task_status as keyof typeof statusMap]) {
      (statusMap as any)[s.task_status] -= count;
    }
  });

  statusMap.Overdue = totalOverdue;

  return { totalTasks, totalProjects, totalUsers, tasksByStatus: statusMap, recentTasks };
};

const usersService = {
  getAllUsers,
  getUserById,
  getProfile,
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
};

export default usersService;