import prisma from "../../config/config.js";
import logsService from "../logs/logsService.js";

type TaskStatus = "To_Do" | "On_Progress" | "Done";


// Check if task is overdue
const isOverdue = (deadline: Date | null | undefined, status: TaskStatus | null): boolean => {
  if (!deadline || status === "Done") return false;
  return new Date() > new Date(deadline);
};

// Add overdue status to task if applicable
export const addOverdueStatus = (task: any): any => {
  if (!task) return task;
  const isCurrentlyOverdue = isOverdue(task.deadline, task.task_status);
  return {
    ...task,
    original_status: task.task_status || "To_Do",
    task_status: isCurrentlyOverdue ? "Overdue" : (task.task_status || "To_Do"),
  };
};

// Validate status transition rules
const validateTransition = (currentStatus: TaskStatus, newStatus: string, deadline: Date | null): void => {
  if (newStatus === "Overdue") {
    throw new Error("Cannot manually set status to Overdue");
  }
  if (newStatus === currentStatus) return;

  const allowed: Record<TaskStatus, TaskStatus[]> = {
    "To_Do": ["On_Progress"],
    "On_Progress": ["Done"],
    "Done": [],
  };

  if (!allowed[currentStatus]?.includes(newStatus as TaskStatus)) {
    const allowedStr = allowed[currentStatus]?.length > 0 ? allowed[currentStatus].join(", ") : "none";
    throw new Error(
      `Cannot change status from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedStr}`
    );
  }
};
// Get all tasks with filtering
export const getAllTasks = async (
  page = 1,
  limit = 10,
  status?: string,
  userId?: number,
  role?: string,
  projectId?: number
) => {
  try {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status === "Overdue") {
      where.deadline = { lt: new Date() };
      where.task_status = { in: ["To_Do", "On_Progress"] };
    } else if (status) {
      where.task_status = status;
    }

    if (role === "staf" && userId) {
      where.task_assign = userId;
    }
    if (projectId) {
      where.task_project = projectId;
    }

    const [tasks, total] = await Promise.all([
      prisma.tasks.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: { select: { id: true, project_name: true } },
          users: { select: { id: true, username: true, role: true } },
          task_files: {
            select: {
              id: true,
              task_id: true,
              file_name: true,
              file_path: true,
              description: true,
              uploaded_at: true,
              uploader: { select: { username: true } },
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.tasks.count({ where }),
    ]);

    return {
      tasks: tasks.map(addOverdueStatus),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("Error in getAllTasks:", error.message);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};


// Get single task by ID
export const getTaskById = async (id: number) => {
  const task = await prisma.tasks.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, project_name: true } },
      users: { select: { id: true, username: true, role: true } },
      task_files: {
        select: {
          id: true,
          task_id: true,
          file_name: true,
          file_path: true,
          description: true,
          uploaded_at: true,
          uploader: { select: { username: true } },
        },
      },
    },
  });
  return task ? addOverdueStatus(task) : null;
};


// Create new task
export const createTask = async (data: {
  task_name: string;
  task_assign?: number | null;
  task_project: number;
  deadline?: Date | null;
}) => {
  try {
    if (!data.task_name || !data.task_name.trim()) {
      throw new Error("Task name is required");
    }
    if (!data.task_project) {
      throw new Error("Project ID is required");
    }

    // Check if project exists
    const projectExists = await prisma.project.findUnique({
      where: { id: data.task_project }
    });
    if (!projectExists) {
      throw new Error("Project not found");
    }

    // Check for duplicate task name within the same project
    const existingTask = await prisma.tasks.findFirst({
      where: {
        task_name: { equals: data.task_name.trim(), mode: 'insensitive' },
        task_project: data.task_project
      }
    });
    if (existingTask) {
      throw new Error("Task name already exists in this project");
    }

    // Validate assigned user exists if provided
    if (data.task_assign) {
      const userExists = await prisma.users.findUnique({
        where: { id: data.task_assign }
      });
      if (!userExists) {
        throw new Error("Assigned user not found");
      }
    }

    const task = await prisma.tasks.create({
      data: {
        task_name: data.task_name,
        task_project: data.task_project,
        task_assign: data.task_assign || null,
        deadline: data.deadline || null,
        task_status: "To_Do",
      },
      include: {
        project: { select: { id: true, project_name: true } },
        users: { select: { id: true, username: true, role: true } },
        task_files: {
          select: {
            id: true,
            task_id: true,
            file_name: true,
            file_path: true,
            description: true,
            uploaded_at: true,
            uploader: { select: { username: true } },
          },
        },
      },
    });

    const actor = task.users?.username || "System";
    await logsService.createLog(actor, "Created Task", task.task_name || "Unknown");

    return addOverdueStatus(task);
  } catch (error: any) {
    console.error("Error in createTask:", error.message);
    throw new Error(`Failed to create task: ${error.message}`);
  }
};


// Update task
export const updateTask = async (
  id: number,
  data: { task_name?: string; task_assign?: number | null; deadline?: Date | null; task_status?: TaskStatus }
) => {
  const task = await prisma.tasks.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");

  // Validate task_name if provided
  if (data.task_name !== undefined && (!data.task_name || !data.task_name.trim())) {
    throw new Error("Task name cannot be empty");
  }

  // Check for duplicate task name within the same project if name is being changed
  if (data.task_name && data.task_name.trim() !== task.task_name) {
    const existingTask = await prisma.tasks.findFirst({
      where: {
        task_name: { equals: data.task_name.trim(), mode: 'insensitive' },
        task_project: task.task_project,
        id: { not: id }
      }
    });
    if (existingTask) {
      throw new Error("Task name already exists in this project");
    }
  }

  // Validate assigned user exists if provided
  if (data.task_assign !== undefined && data.task_assign !== null) {
    const userExists = await prisma.users.findUnique({
      where: { id: data.task_assign }
    });
    if (!userExists) {
      throw new Error("Assigned user not found");
    }
  }

  if (data.task_status) {
    validateTransition(task.task_status as TaskStatus, data.task_status, task.deadline);
  }

  const updated = await prisma.tasks.update({
    where: { id },
    data: {
      task_name: data.task_name ?? undefined,
      task_assign: data.task_assign === undefined ? undefined : data.task_assign,
      deadline: data.deadline ?? undefined,
      task_status: data.task_status ?? undefined,
    } as any,
    include: {
      project: { select: { id: true, project_name: true } },
      users: { select: { id: true, username: true, role: true } },
    },
  });

  await logsService.createLog(
    (updated as any).users?.username || "System",
    "Updated Task",
    updated.task_name || "Unknown"
  );

  return updated;
};


// Delete task
export const deleteTask = async (id: number) => {
  const task = await prisma.tasks.findUnique({ where: { id } });
  if (task) {
    await logsService.createLog("System", "Deleted Task", task.task_name || `ID: ${id}`);
  }
  return prisma.tasks.delete({ where: { id } });
};

// Update task status (by user)
export const updateTaskStatus = async (
  id: number,
  newStatus: string,
  userId: number,
  role: string
) => {
  const task = await prisma.tasks.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");

  // Staff can only update their own tasks (or unassigned tasks which will be assigned to them)
  if (role === "staf" && task.task_assign !== null && task.task_assign !== userId) {
    throw new Error("You can only update status of tasks assigned to you");
  }

  validateTransition(task.task_status as TaskStatus, newStatus, task.deadline);

  const updated = await prisma.tasks.update({
    where: { id },
    data: { 
      task_status: newStatus as TaskStatus,
      task_assign: (role === "staf" && task.task_assign === null) ? userId : (undefined as any)
    },
    include: {
      project: { select: { id: true, project_name: true } },
      users: { select: { id: true, username: true, role: true } },
    },
  });

  await logsService.createLog(
    (updated as any).users?.username || "System",
    `Status -> ${newStatus}`,
    (updated as any).task_name || "Unknown"
  );

  return addOverdueStatus(updated);
};


// Add file to task
export const addFileToTask = async (
  taskId: number,
  fileName: string,
  filePath: string,
  uploadedByUserId: number,
  role: string,
  description?: string
) => {
  try {
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: { users: { select: { username: true, id: true, role: true } } },
    });
    if (!task) throw new Error("Task not found");

    // Staff can only upload to their assigned tasks
    if (role === "staf" && task.task_assign !== null && task.task_assign !== uploadedByUserId) {
      throw new Error("You can only upload files to tasks assigned to you");
    }

    // If unassigned or in To_Do status, automatically update to On_Progress and assign to uploader
    if (task.task_assign === null || task.task_status === "To_Do") {
      const updateData: any = {};
      if (task.task_assign === null) updateData.task_assign = uploadedByUserId;
      if (task.task_status === "To_Do") updateData.task_status = "On_Progress";
      
      await prisma.tasks.update({
        where: { id: taskId },
        data: updateData
      });
    }

    const fileExt = fileName.split(".").pop()?.toLowerCase() || "unknown";

    const file = await prisma.task_files.create({
      data: {
        task_id: taskId,
        file_name: fileName,
        file_path: filePath,
        file_type: fileExt,
        description: description || null,
        uploaded_by: uploadedByUserId,
      },
      include: {
        uploader: { select: { username: true } },
      },
    });

    await logsService.createLog(
      (task as any).users?.username || "System",
      "Uploaded File",
      task.task_name || "Unknown"
    );

    return file;
  } catch (error: any) {
    console.error("Error in addFileToTask:", error.message);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// Get file by ID
export const getTaskFile = async (fileId: number) => {
  return prisma.task_files.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      file_name: true,
      file_path: true,
      file_type: true,
      task_id: true,
    },
  });
};

// Delete file from task
export const deleteTaskFile = async (fileId: number, userId: number, role: string) => {
  const file = await prisma.task_files.findUnique({
    where: { id: fileId },
    include: { tasks: { include: { users: { select: { username: true } } } } },
  });

  if (!file) throw new Error("File not found");

  // Staff can only delete their own uploads
  if (role === "staf" && file.uploaded_by !== userId) {
    throw new Error("You can only delete your own uploaded files");
  }

  await prisma.task_files.delete({ where: { id: fileId } });

  await logsService.createLog(
    file.tasks?.users?.username || "System",
    "Deleted File",
    file.file_name
  );
};

const tasksService = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addFileToTask,
  getTaskFile,
  deleteTaskFile,
};

export default tasksService;