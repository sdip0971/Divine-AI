
"use server";
import { prisma } from "@/lib/utils";
import { z } from "zod"; // Corrected import path
import { Message } from "@/lib/types"; // Assuming Message type is correctly defined

export interface HandleMessageButtonprop {
  error?: string;
  status: "success" | "error" | null; // More descriptive status
  message?: Message;
}

const messageValidation = z
  .string()
  .min(1, "Message cannot be empty")
  .max(1000, "Message cannot exceed 1000 characters");

export async function handleMessageButton(
  prevState: HandleMessageButtonprop,
  formdata: FormData
): Promise<HandleMessageButtonprop> {
  const chatid = formdata.get("chatid") as string;
  

  if (!chatid) {
    console.error("handleMessageButton: chatid is missing from form data.");
    return {
      error: "Chat ID is missing. Please try again.",
      status: "error",
    };
  }

  const chat = await prisma.chat.findUnique({
    where: {
      id: chatid,
    },
    include: {
      messages: true,
    },
  });

  if (!chat) {
    console.error(`handleMessageButton: Chat with ID ${chatid} not found.`);
    return {
      error: "Conversation not found. Please try refreshing.",
      status: "error",
    };
  }

  const messageContent = formdata.get("message");

  const validator = messageValidation.safeParse(messageContent);

  if (!validator.success) {
    console.error(
      "handleMessageButton: Message validation failed.",
      validator.error.issues
    );
    return {
      error: validator.error.issues[0].message || "Invalid message content.",
      status: "error",
    };
  }

  try {
    const msg = await prisma.message.create({
      data: {
        content: validator.data, 
        chatid: chatid,
        role: "user",
        createdAt: new Date(),
      },
    });

    return {
      status: "success", 
      message: msg,
    };
  } catch (dbError) {
    console.error(
      "handleMessageButton: Database error creating message.",
      dbError
    );
    return {
      error: "Failed to save message. Please try again.",
      status: "error",
    };
  }
}