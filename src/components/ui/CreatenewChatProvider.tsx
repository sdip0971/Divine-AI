'use client'
import Createnewchat from '@/app/action/newchat';
import router from 'next/router';
import { createContext, useActionState, useContext, useEffect, useState } from 'react'
interface ChatContextType {
  error?: string;
  redirectUrl: string;
  formAction:any
}
  
const ChatContext = createContext<ChatContextType|null>(null)
function CreatenewChatProvider({children}:{children:React.ReactNode}) {

    const [message, setMessage] = useState("");
      const [error ,seterror] = useState("");
      const [state, formAction] = useActionState(Createnewchat, {
            error: "",
            redirectUrl: "",
          });
     useEffect(()=>{
          if(state.error){
              seterror(state.error) 
          }
         if(state.redirectUrl){
          router.push(state.redirectUrl)
         }
        },[state])  
   

 
  return (
    <ChatContext.Provider value={{error: error, redirectUrl: state.redirectUrl!,formAction}}>{children}</ChatContext.Provider>
  )
}
function useNewChat(){
 const context = useContext(ChatContext);
 if (!context) {
   throw new Error("useNewChat must be used within a CreatenewChatProvider");
 }
 return context;
}

export {CreatenewChatProvider,useNewChat}
