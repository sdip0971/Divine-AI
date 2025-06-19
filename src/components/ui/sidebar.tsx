"use client";
import React from "react";
import Link from "next/link";
import { Button } from "./button";
import Createnewchat from "@/app/action/newchat";

function Sidebar() {
  return (
    <>
      <aside className="absolute top-0 left-0 z-20 w-64 h-screen bg-white/10 dark:bg-black/20 backdrop-blur-md text-black dark:text-white border-r border-white/20 shadow-lg p-4">
        <div className="flex flex-col gap-6 mt-20">
          <form
            action={
              ((formData:FormData) => Createnewchat(undefined, formData)) as unknown as (
                formData: FormData
              ) => void
            }
          >
            <input type="hidden" name="mode" value="sidebar"></input>
            <Button type="submit"> New Chat</Button>
          </form>
        </div>

        {/* <div className="space-y-2 overflow-y-auto h-[calc(100vh-100px)]">
          {chats.length === 0 ? (
            <p className="text-sm text-gray-500">No chats yet.</p>
          ) : (
            chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className={cn(
                  "block px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700",
                  pathname === `/chat/${chat.id}`
                    ? "bg-gray-300 dark:bg-gray-800"
                    : ""
                )}
              >
                Chat - {new Date(chat.createdAt).toLocaleDateString()}
              </Link>
            ))
          )}
        </div> */}
      </aside>
    </>
  );
}

export default Sidebar;
