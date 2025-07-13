"use server"
import { Message } from "@/lib/types";
import { prisma } from "@/lib/utils";
import { z } from "zod";
const messageValidation = z
  .string()
  .min(1, "Message cannot be empty")
  .max(1000, "Message cannot exceed 1000 characters");
import { HandleMessageButtonprop } from "./handleMessageButton";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
export async function handlesubmit(formdata:FormData,initialstate:HandleMessageButtonprop): Promise<{ status: string; message?: Message; error?: string }> {
  const chatid = formdata.get("chatid") as string;
  const { userId } = await auth();
  if(!userId){
     redirect('/login')
  }
  if (!chatid) {
    console.error("handlesubmit: chatid is missing from form data.");
    return { status: "error", error: "Chat ID is missing. Please try again." };
  }
  

  const chat = await prisma.chat.findUnique({
    where: { id: chatid ,
      UserID:userId
    },
    include: { messages: true },
  });


  if (!chat) {
    console.error(`handlesubmit: Chat with ID ${chatid} not found.`);
    return { status: "error", error: "Conversation not found. Please try refreshing." };
  }

  const messageContent = formdata.get("message");

  const validator = messageValidation.safeParse(messageContent);

  if (!validator.success) {
    console.log("handlesubmit: Message validation failed.", validator.error.issues);
    return { status: "error", error: validator.error.issues[0].message || "Invalid message content." };
  }

  try {
    const msg = await prisma.message.create({
      data: {
        content: validator.data,
        chatid,
        role: "user",
        createdAt: new Date(),
      },
    });

    return { status: "success", message: msg };
  } catch (error) {
    console.log("handlesubmit: Error creating message.", error);
    return { status: "error", error: "Failed to send message. Please try again." };
  }
}