import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/utils";
export async function GET(req:NextRequest){
const user = await auth()
if (!user || !user.userId) {
    return NextResponse.json([], { status: 200 });
  }
  const chats = await prisma.chat.findMany({
    where: {
      UserID: user.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return NextResponse.json(chats)
}