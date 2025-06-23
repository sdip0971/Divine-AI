'use client'
import React, { useState } from 'react'
import Link from 'next/link';
import { Button } from './button';
import { Trash, Trash2 } from "lucide-react";
import { chatStore } from './chatstore';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
function ChatTab({id}:{id:string}) {
    const [confirmdialogue,setConfirmdialogue]=useState<Boolean>(false);
   const {removeChat,refreshChats} = chatStore()
   const pathname = usePathname()
   const router = useRouter()

    const handleDelete = async(id:string)=>{
     removeChat(id)
     setConfirmdialogue(false); 
     if(pathname==`/chat/${id}`){
    router.push('/chat')
     }
    }
  return (
    <>
      <div className="w-full">
        <Button className=" flex justify-between w-full bg-gradient-to-br overflow-ellipsis  from-indigo-500 to-green-300 hover:from-indigo-800 hover:to-purple-900 text-white px-2 py-2 rounded-md shadow-md transition-all duration-300">
          <Link className="overflow-hidden" href={`/chat/${id}`}>
            {id}
          </Link>
          <div
            onClick={() => setConfirmdialogue(!confirmdialogue)}
            className=" rounded bg-transparent hover:bg-red-100 transition"
          >
            <Trash2 size={18} className="text-red-500" />
          </div>
        </Button>
      </div>
      {confirmdialogue && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setConfirmdialogue(false)}
          ></div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg p-6 w-80 shadow-xl flex flex-col items-center">
            <p className="mb-4 text-center text-sm">
              ⚠️ Are you sure you want to delete this chat?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(id)}
                className="px-4 py-1 bg-red-500 hover:bg-red-700 text-white rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmdialogue(false)}
                className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatTab
