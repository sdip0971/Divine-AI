import { create} from "zustand";
import { Message } from "@/lib/types";
type ChatMessageStore = {
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  loading:boolean,
  setloading : (value:boolean)=>void;
 
};
export const messageStore = create<ChatMessageStore>((set) => ({
  messages: [],
  loading: true,
  addMessage: (msg: Message) => {
    set((state) => ({
      messages: [msg, ...state.messages],
    }));
  },
  setMessages: (msgs: Message[]) => {
    set({ messages: msgs });
  },
  setloading: (value: boolean) => set({ loading: value }),
}));