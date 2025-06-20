'use server'
import { string, z } from "zod/v4";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/utils";
const messageschema =z.object({
    message:z.string().min(1,"Message Sent is Empty")
})
interface MessageState{
error? : string,
redirectUrl?: string
}

export default async function Createnewchat(prevState:MessageState|undefined ,formdata:FormData):Promise<MessageState> {
    const user = await auth();
    
    const mode = formdata.get("mode")

    if (!user || !user.userId) {
          throw new Error("Unauthorized");
        }
 
    const chat = await prisma.chat.create({
      data: {
        createdAt: new Date(),
        UserID: user.userId,
      },
    });
   
    //create a new conversation
    if (mode === "new-chat") {
        
        return {
          //redirect to chat id
          redirectUrl: `/chat/${chat.id}`,
        };
    }
    if (mode === "chat") {
      const message = formdata.get("message")?.toString();
      const verifydata = messageschema.safeParse({ message: message });

      if (!verifydata.success) {
        const msg = verifydata.error.flatten().fieldErrors.message?.[0];
        return { error: msg };
      }
      if(verifydata.data.message?.trim()){
        const message = await prisma.message.create({
            data:{
                content:verifydata.data.message,
                role:"user",
                chatid:chat.id,
                createdAt: new Date()
            }
        })
         return {
            //redirect to chat id
            redirectUrl: `/chat/${chat.id}`,
          };

      }

    }
  
    return { error: "Invalid mode or missing data." };


}