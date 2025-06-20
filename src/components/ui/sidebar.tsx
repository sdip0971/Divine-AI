"use client";
import { useNewChat } from "./CreatenewChatProvider";
import { useSidebar } from "../Sidebarprovide";
import { X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@clerk/nextjs";
export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { formAction } = useNewChat();
 const session = useSession();
  return (
    <div
      className={`${
        session
          ? `fixed top-0 left-0 h-full w-64 bg-black/30 backdrop-blur-lg text-white p-6 z-40 
            transition-transform duration-300 ease-in-out border-r border-white/10 shadow-xl 
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block`
          : "hidden"
      }`}
      style={{
        backgroundImage: "url('/_.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Mobile Close Button */}
      <Button
        onClick={toggleSidebar}
        aria-label="Close sidebar"
        className="md:hidden absolute top-4 right-4 p-2 rounded-md bg-white/10 hover:bg-white/20"
      >
        <X size={20} />
      </Button>

      {/* Logo Section */}
      <div className="flex items-center mb-12">
        <img
          src="/icons/feather.jpg"
          alt="Feather Icon"
          className="w-10 h-10 rounded-full border-2 border-white shadow-md"
        />
      </div>

      {/* New Chat */}
      <form action={formAction} className="mb-6">
        <input type="hidden" name="mode" value="new-chat" />
        <Button className="w-full bg-gradient-to-br from-indigo-500 to-green-300 hover:from-indigo-800 hover:to-purple-900 text-white px-4 py-2 rounded-md shadow-md transition-all duration-300">
          New Chat
        </Button>
      </form>

      {/* Links */}
      <div className="space-y-4 text-sm font-light tracking-wide text-indigo-100">
        <Button className="w-full bg-gradient-to-br from-indigo-500 to-green-300 hover:from-indigo-800 hover:to-purple-900 text-white px-4 py-2 rounded-md shadow-md transition-all duration-300">
          <Link href="/chat">🧘 Quote of the Day</Link>
        </Button>
        <Button className="w-full bg-gradient-to-br from-indigo-500 to-green-300 hover:from-indigo-800 hover:to-purple-900 text-white px-4 py-2 rounded-md shadow-md transition-all duration-300">
          <Link
            href="/profile"
           
          >
            📜 Story of the Day
          </Link>
        </Button>
      </div>

      {/* ✨ Footer Vibe */}
      <div className="absolute bottom-4 left-6 text-xs text-indigo-300 font-light opacity-70">
        Powered by Gita ⚡
      </div>
    </div>
  );
}
