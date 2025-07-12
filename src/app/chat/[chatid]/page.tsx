"use client";
import { useParams, useSearchParams } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import { useActionState, useEffect, useRef, useState } from "react";
import { messageStore } from "@/components/ui/messagestore";
import { POST } from "@/app/api/delete-chat/route";
import { Button } from "@/components/ui/button";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Message } from "@/lib/types";
import {
  handleMessageButton,
  HandleMessageButtonprop,
} from "@/app/action/handleMessageButton";
import { handlesubmit } from "@/app/action/handlesubmit";
import { useAuth } from "@clerk/nextjs";

function ChatPage() {
  const userid = useAuth().userId
  console.log('user id is ',userid)
  const param = useParams();
  const searchParams = useSearchParams();
  const { chatid } = param;
  const msg = searchParams.get("msg");

  const message = messageStore((s) => s.messages);
  const addmessage = messageStore((s) => s.addMessage);
  const loading = messageStore((s) => s.loading);
  const setloading = messageStore((s) => s.setloading);
  const setMessages = messageStore((s) => s.setMessages);
  // Removed updateMessage since it doesn't exist in the store

  const [error, setError] = useState<string | null>(null);
  const eventRef = useRef<EventSource | null>(null);
  const [inputval, setinputval] = useState("");
  const [isStreaming, setisStreaming] = useState(false);
  const streamingMessageRef = useRef<Message | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialState: HandleMessageButtonprop = {
    error: "",
    status: null,
    message: {
      id: "",
      content: "",
      chatid: chatid as string,
      role: "user",
      createdAt: new Date(),
    },
  };
  const [state, formAction] = useActionState(handleMessageButton, initialState);


  const cleanupStream = () => {
    if (eventRef.current) {
      eventRef.current.close();
      eventRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setisStreaming(false);
    streamingMessageRef.current = null;
  };

  // Enhanced message streaming handler
  const handleMessageSent = (userMessage: Message) => {
    // Clean up any existing stream if any just precaution
    cleanupStream();

    setisStreaming(true);
    setError(null);

    // Created a streaming message 
    const streamingMessage: Message = {
      id: `streaming-${crypto.randomUUID()}`,
      content: "",
      chatid: chatid as string,
      role: "assistant",
      createdAt: new Date(),
    };

    streamingMessageRef.current = streamingMessage;

    // Add both messages to store
    const currentMessages = messageStore.getState().messages;
    setMessages([...currentMessages, userMessage, streamingMessage]);

    // Set up timeout for streaming
    timeoutRef.current = setTimeout(() => {
      setError("Response timeout. Please try again.");
      cleanupStream();
    }, 30000); // 30 second timeout

    // Start streaming
    const eventSource = new EventSource(`/api/${chatid}/stream/response`);
    eventRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        // Clear timeout on first message
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        const parsed = JSON.parse(event.data);

        // Check if this is a completion signal
        if (parsed.type === "complete" || parsed.done === true) {
          setisStreaming(false);
          console.log("Stream completed");
          

          // Mark message as completed
          if (streamingMessageRef.current) {
            const currentState = messageStore.getState().messages;
            const updatedMessages = currentState.map((msg) =>
              msg.id === streamingMessageRef.current?.id
                ? { ...msg, id: `completed-${Date.now()}` }
                : msg
            );
            setMessages(updatedMessages);
          }

          cleanupStream();
          return;
        }

        const tokenValue = parsed.token as string;

        if (streamingMessageRef.current && tokenValue) {
          // Update the streaming message content
          const updatedContent =
            streamingMessageRef.current.content + tokenValue;
          streamingMessageRef.current.content = updatedContent;

          // Update in store - find and update the streaming message
          const currentState = messageStore.getState().messages;
          const updatedMessages = currentState.map((msg) =>
            msg.id === streamingMessageRef.current?.id
              ? { ...msg, content: updatedContent }
              : msg
          );

          setMessages(updatedMessages);
        }
      } catch (parseError) {
        console.error("Error parsing streaming data:", parseError);
        setError("Error receiving response. Please try again.");
        cleanupStream();
      }
    };

    eventSource.onopen = () => {
      console.log("Stream connection opened");
    };

    // Note: EventSource doesn't have onclose event, handle completion via server-sent event
    // The server should send a completion event or close the connection

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      setError("Connection error. Please try again.");
      cleanupStream();
    };
  };

  // Direct form submission handler
   const handleDirectSubmit = async (e: React.FormEvent) => {
     e.preventDefault();

     if (isStreaming || !inputval.trim()) return;

    try {
     const formData = new FormData();
      formData.append("chatid", chatid as string);
      formData.append("message", inputval.trim());
   
       
       const result = await handlesubmit(formData,initialState);

       if (result.status === "success" && result.message) {
         setinputval("");
        handleMessageSent(result.message);
       } else if (result.status === "error") {
        setError(result.error || "Failed to send message");
     }
  } catch (err) {
       console.log("Form submission error:", err);
      setError("Failed to send message. Please try again.");
     }
   };

  useEffect(() => {
    async function FetchChatdata() {
      setMessages([]);
      setError(null);
      setloading(true);

      try {
        if (msg === "true") {
         

          const res = await fetch(`/api/${chatid}/latest-user-message`);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const { allmessages } = (await res.json()) as { allmessages: Message[] };
          console.log("Fetched latest user message:", allmessages);
       
          if (allmessages && allmessages.length > 0) {
            // Set all messages except the last one
           
            const latestUserMessage = allmessages[allmessages.length - 1];

            setMessages([]);
            setloading(false);

            // Start streaming for the latest user message
            if (latestUserMessage.role === "user") {
              handleMessageSent(latestUserMessage);
            }
          }
        } else {
          setloading(true);
          setMessages([])
          //fetch user messages 
          try{
            const res = await fetch(`/api/${chatid}/allmessages`);
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
          
            const {allmessages}  = await res.json() as { allmessages: Message[] };
            console.log("Fetched messages:", allmessages);
            if(allmessages.length === 0){
              setMessages([]);
              console.log(allmessages)
            }
            setMessages(allmessages as Message[]);
          }catch(error){
            console.error("Error fetching messages:", error);
            setError("Failed to load messages. Please try again.");
           
            return;
          }finally{
            setloading(false);
          }

        }
      } catch (fetchError) {
        console.error("Error fetching chat data:", fetchError);
        setError(
          "Unable to load the conversation. Please try refreshing the page."
        );
        setloading(false);
      }
    }

    FetchChatdata();

    // Cleanup on component unmount or chatid change
    return () => {
      cleanupStream();
      setMessages([]);
      setloading(true);
    };
  }, [chatid, msg]);

  // Handle server action state changes
  useEffect(() => {
    if (state.status === "error" && state.error) {
      setError(state.error);
    }
  }, [state]);

 
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleDirectSubmit(e as any);
    }
  };

  if (error) {
    return (
      <div className="fixed border-transparent font-inter border-4 shadow-2xl z-50 bg-transparent ">
        <p className="text-red-400 font-hind shadow-2xs font-normal text-xl mt-1">
          ⚠️ {error}
        </p>
        <button
          onClick={() => setError(null)}
          className="ml-4 text-white/70 hover:text-white"
        >
          ✕
        </button>
      </div>
    );
  }

  if (loading) {
    return <Skeleton />;
  }

  return (
    <div className="max-h-screen min-h-[100%-80px] flex items-center justify-center px-4">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col justify-between bg-white/5 border border-white/20 rounded-2xl p-4 backdrop-blur-lg">
        {/* Messages section */}
        <div className="flex flex-col gap-y-4 overflow-y-auto flex-grow pr-2">
          {message?.map((m) => (
            <div
              key={String(m.id)}
              className={`flex ${
                m.role === "assistant" ? "w-full justify-center" : ""
              } `}
            >
              {m.role === "user" ? (
                <div className="ml-auto max-w-[60%]">
                  <div className="text-white font-inter bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-2 rounded-xl break-words text-sm">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div className="justify-center ml-2 w-full">
                  <div className="text-white font-inter w-full bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-2 rounded-xl break-words text-sm">
                    {m.content}
                    {isStreaming &&
                      m.id === streamingMessageRef.current?.id && (
                        <span className="animate-pulse ml-1">▊</span>
                      )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chat input form */}
        <form
          onSubmit={handleDirectSubmit}
          className="flex w-full max-w-xl mt-4 self-center relative"
        >
          <div className="relative w-full">
            <input
              type="text"
              name="message"
              value={inputval}
              placeholder="Type your message..."
              onChange={(e) => setinputval(e.target.value)}
             // onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className="w-full pl-4 pr-[80px] py-3 rounded-full bg-white/80 text-black focus:outline-none shadow-md backdrop-blur-md disabled:opacity-50"
            />
            <Button
              disabled={isStreaming}
              type="submit"
              className="disabled:opacity-50 absolute right-1 top-1/2 -translate-y-1/2 h-[42px] px-4 bg-black text-white rounded-full text-sm font-medium shadow-md"
            >
              {isStreaming ? "..." : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
