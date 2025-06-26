import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/utils";
export async function POST(req:NextRequest){
const user = await auth()
if (!user || !user.userId) {
    return NextResponse.json([], { status: 200 });
  }
  const { id } = await req.json();
  console.log(id)
  if (!id) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }
  const chat = await prisma.chat.findUnique({
    where: { id: id },
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }
    await prisma.chat.delete({
    where: {
      id: id,
    },
  });
  

  return NextResponse.json({ success: "Deleted the Conversation" }, { status: 200 });
}