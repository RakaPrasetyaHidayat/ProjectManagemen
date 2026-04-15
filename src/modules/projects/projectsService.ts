import prisma from "../../config/config.js";
import logsService from "../logs/logsService.js";
import { addOverdueStatus } from "../tasks/tasksService.js";


const transformProject = (project: any) => {
  if (!project) return null;
  const { createdByUser, _count, ...rest } = project;
  return {
    ...rest,
    users: createdByUser,
    taskCount: _count?.tasks || 0,
  };
};

export const getAllProjects = async (page = 1, limit = 10, userId?: number, role?: string) => {
  try {
    const skip = (page - 1) * limit;
    const where: any = {};
    
    // Staff can see all projects
    // if (role === "staf" && userId) { ... }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          createdByUser: { select: { id: true, username: true, role: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.project.count({ where }),
    ]);

    const transformedProjects = projects.map(transformProject).filter(Boolean);

    return { projects: transformedProjects, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (error: any) {
    console.error("Error in getAllProjects:", error.message);
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }
};

export const getProjectById = async (id: number) => {
  try {
    if (!id || id <= 0) {
      throw new Error("Invalid project ID");
    }

    const p = await prisma.project.findUnique({
      where: { id },
      include: {
        createdByUser: { select: { id: true, username: true, role: true } },
        _count: { select: { tasks: true } },
      },
    });

    if (!p) {
      return null;
    }
    
    const transformed = transformProject(p);
    
    // Fetch tasks separately with safe field selection
    let tasks = [];
    try {
      tasks = await prisma.tasks.findMany({
        where: { task_project: id },
        include: {
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
      });
    } catch (taskError: any) {
      // Fallback: fetch tasks without task_files if there's an error
      tasks = await prisma.tasks.findMany({
        where: { task_project: id },
        include: {
          users: { select: { id: true, username: true, role: true } },
        },
        orderBy: { id: "desc" },
      });
    }

    return {
      ...transformed,
      tasks: tasks.length > 0 ? tasks.map(addOverdueStatus) : []
    };
  } catch (error: any) {
    console.error(`Error in getProjectById for id ${id}:`, error.message);
    throw new Error(`Failed to fetch project: ${error.message}`);
  }
};

export const createProject = async (data: any) => {
  try {
    if (!data.project_name) {
      throw new Error("Project name is required");
    }

    // Check for duplicate project name
    const existing = await prisma.project.findFirst({
      where: { project_name: { equals: data.project_name, mode: 'insensitive' } }
    });
    if (existing) {
      throw new Error("Project name already exists");
    }

    const p = await prisma.project.create({
      data: {
        project_name: data.project_name,
        created_by: data.created_by,
      },
      include: { 
        createdByUser: { select: { id: true, username: true, role: true } },
        _count: { select: { tasks: true } },
      },
    });
    const actor = p.createdByUser?.username || `User ID ${data.created_by}`;
    await logsService.createLog(actor, "Created Project", p.project_name || "Unknown");
    return transformProject(p);
  } catch (error: any) {
    console.error("Error in createProject:", error.message);
    throw new Error(`Failed to create project: ${error.message}`);
  }
};

export const updateProject = async (id: number, data: any) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Project not found");
    }

    // Check for duplicate project name if it's being changed
    if (data.project_name && data.project_name !== existing.project_name) {
      const nameTaken = await prisma.project.findFirst({
        where: { 
          project_name: { equals: data.project_name, mode: 'insensitive' },
          id: { not: id }
        }
      });
      if (nameTaken) {
        throw new Error("Project name already exists");
      }
    }

    const p = await prisma.project.update({
      where: { id },
      data,
      include: { 
        createdByUser: { select: { id: true, username: true, role: true } },
        _count: { select: { tasks: true } },
      },
    });
    
    const actor = p.createdByUser?.username || "System";
    await logsService.createLog(actor, "Updated Project", p.project_name || "Unknown");
    return transformProject(p);
  } catch (error: any) {
    console.error("Error in updateProject:", error.message);
    throw new Error(`Failed to update project: ${error.message}`);
  }
};

export const deleteProject = async (id: number) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Project not found");
    }
    await prisma.project.delete({ where: { id } });
    await logsService.createLog("System", "Deleted Project", existing.project_name || `ID: ${id}`);
    return null;
  } catch (error: any) {
    console.error("Error in deleteProject:", error.message);
    throw new Error(`Failed to delete project: ${error.message}`);
  }
};

const projectsService = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};

export default projectsService;