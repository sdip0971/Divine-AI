import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
const connectionString = process.env.DATABASE_URL;

console.log("DATABASE_URL =", process.env.DATABASE_URL);
export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL! },
  },
});