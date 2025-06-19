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
    <div className="flex flex-col relative justify-center items-center h-auto ">
      <h1
        className={`${cormorant.variable} font-cormorant text-white  font-inter  text-opacity-90 p-4 text-3xl text-center shadow-2xs leading-relaxed `}
      >
        Get spiritual guidance, real-time wisdom, and ancient answers to modern
        chaos.
      </h1>
      <form className="w-full max-w-xl relative" action={formAction}>
        <input type="hidden" name="mode" value="chat" />
        <input
          type="text"
          name="message"
          placeholder="Type your message..."
          className="w-full h-[5vh] pr-16 pl-4 py-3 rounded-full bg-white/80 text-black focus:outline-none shadow-md backdrop-blur-md"
        />

        <Button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2  text-white rounded-full font-semibold text-sm shadow-lg"
        >
          Send
        </Button>
      </form>
      {error && (
        <p className="text-red-500 font-bold text-sm mt-4 p-2 ml-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default Chat;
