'use client'

import { Cormorant_Garamond } from "next/font/google";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Createnewchat from "../action/newchat";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useNewChat } from "@/components/ui/CreatenewChatProvider";
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "700"],
});
function Chat() {
    const router=useRouter();
    const { formAction, error } = useNewChat();


  return (
    <div className="flex flex-col mb-20 relative justify-center items-center h-screen ">
      <h1 className="text-white text-center font-inter text-4xl mb-2 font-bold drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
        Get spiritual guidance, real-time wisdom, and ancient answers to modern
        chaos.
      </h1>
      <form className="w-full pt-4 max-w-xl mt-2 relative" action={formAction}>
        <div className="relative  w-full max-w-xl">
          <input type="hidden" name="mode" value="chat" />
          <input
            type="text"
            name="message"
            placeholder="Type your message..."
            className="w-full pl-4  pr-[80px] py-3 rounded-full bg-white/80 text-black focus:outline-none shadow-md backdrop-blur-md"
          />
          <Button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-[42px] px-4 bg-black text-white rounded-full text-sm font-medium shadow-md"
          >
            Send
          </Button>
        </div>
      </form>
      {error && (
        <p className="text-red-500 font-bold text-sm mt-4 p-2 ml-1">{error}</p>
      )}
    </div>
  );
}

export default Chat;
