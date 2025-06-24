import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/utils";
import { error } from "console";
export async function GET(req:NextRequest,context:{ params : {chatid:string}}) {
const user = await auth()
if (!user || !user.userId) {
    return NextResponse.json([], { status: 200 });
  }
const chatid=context.params.chatid

try {
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatid,
    },
    include: {
      messages: true,
    },
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json({ messages: chat.messages }, { status: 200 });
} catch (e) {
  console.error("API Error:", e);
  return NextResponse.json({ error: "Server Error" }, { status: 500 });
}
}