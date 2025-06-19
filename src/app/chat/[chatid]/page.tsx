'use client'
import { useParams } from "next/navigation"
import Sidebar from "@/components/ui/sidebar";
function ChatPage() {
    const param = useParams();
    const {chatid} = param;
  
  return (
    <div>
      
    </div>
  );
}

export default ChatPage
