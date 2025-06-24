'use client'
import { useParams, useSearchParams } from "next/navigation"
import Sidebar from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { messageStore } from "@/components/ui/messagestore";
import { POST } from "@/app/api/delete-chat/route";
import { Button } from "@/components/ui/button";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
function ChatPage() {
    const param = useParams();
    const searchParams = useSearchParams()
    const { chatid } = param;
    const msg = searchParams.get('msg')
    console.log(msg)

    const message = messageStore((s)=>s.messages)
    const addmessage = messageStore((s)=>s.addMessage)
    const loading = messageStore((s)=>s.loading)
    const setloading = messageStore((s)=>s.setloading)
    const setMessages = messageStore((s) => s.setMessages);
    const [error, setError] = useState<string|null>(null)
    console.log(message)
    useEffect(() => {
      async function FetchChatdata() {
        setMessages([]);
        if (msg === "true") {
          console.log("msg to hai baawe");
          //make db call to get msg and response
          const res = await fetch(`/api/${chatid}/latest-user-message`);
          if (!res.ok || res.status == 404) {
            setError(
              "Unable to Load the conversation look like there is an issue| संवादं द्रष्टुं न शक्यते। किञ्चित् दोषः जातः इव दृश्यते। | संवाद को लोड करने में असमर्थ हैं। ऐसा प्रतीत होता है कि कोई त्रुटि उत्पन्न हो गई है"
            );
            console.log(error)
          }
          const {messages} = await res.json()
        
          
        if (messages && messages.length > 0) {
          setMessages(messages)
          setloading(false);
        }
        }
      }
      
        FetchChatdata();
        return ()=>{
          setMessages([]);
          setloading(true);

        };
      
    }, [chatid]);


   if(error){
    return (
      <>
        <div className="fixed border-transparent font-inter border-4 shadow-2xl z-50 bg-transparent ">
            <p className="text-red-400 font-hind shadow-2xs font-normal text-xl mt-1">⚠️ {error}</p>
          </div>

      </>
    );
   }
   if(loading){
    <Skeleton />; 
   }
  
   return (
     <div className="flex items-center justify-center h-screen w-full">
       <div className="flex flex-col justify-between w-[80vw] h-[90vh] bg-white/5 border border-white/20 rounded-2xl p-4 backdrop-blur-lg">
         {/* Messages section */}
         <div className="flex flex-col gap-4 overflow-y-auto flex-grow pr-2">
           {message.map((m, idx) => (
             <div key={String(m.id)} className="flex justify-end">
               <div className="self-start text-white font-inter bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-2 rounded-xl max-w-[60%] break-words text-sm">
                 {m.content}
               </div>
             </div>
           ))}
         </div>

         {/* Chat input form */}
         <form className="flex w-full max-w-xl mt-4 self-center relative">
           <div className="relative w-full max-w-xl">
             <input type="hidden" name="mode" value="chat" />
             <input
               type="text"
               name="message"
               placeholder="Type your message..."
               className="w-full pl-4 pr-[80px] py-3 rounded-full bg-white/80 text-black focus:outline-none shadow-md backdrop-blur-md"
             />
             <Button
               type="submit"
               className="absolute right-1 top-1/2 -translate-y-1/2 h-[42px] px-4 bg-black text-white rounded-full text-sm font-medium shadow-md"
             >
               Send
             </Button>
           </div>
         </form>
       </div>
     </div>
   );
}

export default ChatPage
