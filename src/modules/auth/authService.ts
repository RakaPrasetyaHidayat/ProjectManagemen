import bcrypt from "bcrypt";
import jwtMiddleware from "../../middleware/jwt.js";
import prisma from "../../config/config.js";

export const register = async (data: any): Promise<any> => {
  const { username, password } = data;
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const existing = await prisma.users.findUnique({ where: { username } });
  if (existing) {
    throw new Error("Username already taken");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      username,
      password: hashedPassword,
      role: "staf",
      status: "Pending",
    },
    select: { id: true, username: true, role: true, status: true, created_at: true },
  });

  return { user };
};

export const login = async (data: any): Promise<any> => {
  const { username, password } = data;
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const user = await prisma.users.findUnique({ where: { username } });
  if (!user) {
    throw new Error("Invalid username or password");
  }

  if (user.status === "Pending") {
    throw new Error("Your account is pending approval by a manager");
  }

  if (user.status === "Rejected") {
    throw new Error("Your account has been rejected. Please contact your manager");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid username or password");
  }

  const token = jwtMiddleware.generateToken(user.id, user.role);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    },
  };
};

const authService = { register, login };
export default authService;