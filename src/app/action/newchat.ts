'use server'
import { string, z } from "zod/v4";
import { auth } from "@clerk/nextjs/server";
const messageschema =z.object({
    message:z.string().optional()
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
    if(mode==="chat"){
        const message = formdata.get("message")?.toString();
        const verifydata = messageschema.safeParse({ message: message });
        if (!verifydata.success) {
          const msg = verifydata.error.flatten().fieldErrors.message?.[0];
          return { error: msg };
        }
    }
   
    //create a new conversation
    //create a new message if message

    //if message create message
    // if (parsed.data.message && parsed.data.message.trim() !== "") {
     
    //   });
    // }



   //redirect to chat page
    return {
        //redirect to chat id
        redirectUrl:""
    }

}