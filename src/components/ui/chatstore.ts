import { create } from "zustand";
import { Chats } from "@/lib/types";
import { set } from "zod/v4";
import { StringFormatParams } from "zod/v4/core";
type ChatStore = {
  chats: Chats[];
  loading: boolean;
  
  setChats: (chats: Chats[]) => void;
  setLoading: (val: boolean) => void;
  refreshChats:()=>void;
   removeChat:(id:string)=>void
   deleteChatfromServer:(id:string)=>void
};
export const chatStore = create<ChatStore>((set) => ({
  chats: [],
  loading: false,
  setLoading: (val) => set({ loading: val }),
  setChats: (chats) => set({ chats }),
  refreshChats: async () => {
    set({ loading: true });
    const res = await fetch("/api/get-chats");
    const data = await res.json();
    set({ chats: data, loading: false });
  },
  removeChat:async(id)=>{
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== id),
    }));
  },
  deleteChatfromServer:async(id)=>{
    await fetch("/api/delete-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }
}));