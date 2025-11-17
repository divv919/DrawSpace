import { z } from "zod";
export const UserSchema = z.object({
  email: z.string().min(3).max(30),
  password: z.string(),
  username: z.string(),
});

export const CreateRoomSchema = z.object({
  name: z.string(),
  isProtected: z.boolean(),
  password: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().min(3).max(30),
  password: z.string(),
});
