import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/utils";
import {pinecone} from "@/lib/pinecone";
import { Memory } from "@/lib/pinecone";


import { auth, getAuth } from "@clerk/nextjs/server";
import { get } from "http";
import { redirect } from "next/navigation";
import { Queue } from "bullmq";
const genAI = new GoogleGenerativeAI(process.env.Google_API_KEY!);


export interface PineconeVector {
  id: string;
  score:number;
  values: number[];
  metadata: Record<string, any>;
}
export async function GET(
  

  req: NextRequest,
  { params }: { params: Promise<{ chatid: string }> }
) {
    console.log("req recieved")
  const encoder = new TextEncoder();
  const chatid = (await params).chatid;
  const userId =  (await auth()).userId
  if(!userId || userId == null){
   redirect('/login')
  }
  let memory: Memory = {
    userId: '',
    personal_info: "NONE",
    life_challenges: "NONE",
    topics_explored: [],
    learning_style:"NONE",
    emotional_state:"NONE",
    spiritual_journey:"NONE",
    insights_gained: "NONE",
    createdAt: new Date(),
    updatedAt: new Date(),
    language_used:"NONE"
  };
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",  });
    const genconfig ={
      "maxOutputTokens": 200,
      "temperature":0.5,
      "topP": 0.95,
      "topK": 40,
    }


  const chat = await prisma.chat.findUnique({
    where: { id: chatid , 
      UserID:userId
    },
    include: { messages: true }, 
  });
  const IntensityThreeshold = 7.5

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }
  const lastusermessage = chat.messages.filter((msg)=>msg.role === "user").slice(-1)[0];
  const getprevmemory = await pinecone.getUserMemories({userId,query:lastusermessage.content,topK:10})
  const isDupCheck = getprevmemory.filter((mem:PineconeVector)=>{
    const score = mem.score
    return mem && score>0.75
  }).reduce((acc: string[], mem: PineconeVector) => {
    const metadata=mem.metadata
    Object.values(metadata).forEach((val) => {
      if (typeof val == "string" && val.trim().toUpperCase() != "NONE") {
        acc.push(val);
      } else if (Array.isArray(val) && val.length > 0) {
        acc.push(val.join(", ").trim());
      }
    });
    return acc;
  }, []).join(',')

  const getLastFewMessages = chat.messages.filter((msg) => msg.role === "user").slice(-5).map((msg) => msg.content).join("\n");

  const ltmagent = [
    {
      role: "user",
      parts: [
        {
          text: `
                  Current User Msg: "${lastusermessage.content}"
              PrevConversationContext : "{${isDupCheck ? isDupCheck : "NONE"}}"
              Extract spiritual conversation memory from Current User Msg. Only save MEANINGFUL content.
              DO NOT save if this information was already discussed earlier. Strictly output importance_number < 7 if redundant.
              CRITICAL RULES:
              - Only extract MEANINGFUL and CONTEXTUAL information
              - Ignore casual mentions, examples, or trivial details
              - Rate intensity 1-10, only save if 7+ importance
              - Don't save names without meaningful context
              - Focus on spiritual growth, personal struggles, and insights
              - Avoid extracting surface-level information
              -Dont save Current User Msg if already in PrevConcersationContext and give importance_number<7
              IGNORE: casual mentions, examples, surface references
              SAVE: real struggles, insights, spiritual practices, emotional context, meaningful relationships
              SAVE imformation if they relate to:
              - Relationships causing pain/growth
              - People affecting spiritual journey
              - Betrayal, love, loss, family issues
              Don't save random mentions
              Example JSON output:
              {
                "personal_info": "significant life details, relationships, people affecting spiritual journey or NONE",
                "spiritual_journey": "active practices/beliefs/spiritual goals or NONE", 
                "life_challenges": "real problems seeking spiritual guidance or NONE",
                "insights_gained": "actual realizations from conversation or NONE",
                "topics_explored": ["deep spiritual concepts discussed"] or [],
                "emotional_state": "meaningful emotional context or NONE",
                "learning_style": "clear preference practical/theoretical or NONE",
                "language_used":"Hindi",
                "intensity_number": number(1 to 10)
              }`,
        },
      ],
    },
  ];

  const Savetomemoryresponse  = await model.generateContent({
    contents:ltmagent ,
    generationConfig: genconfig,
  });
  console.log("save to memory response",Savetomemoryresponse.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim())
  const saveToMemoryText  = Savetomemoryresponse.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
  const jsonMatch = saveToMemoryText?.match(/{[\s\S]*}/);
  if(jsonMatch && userId){
  const jsonstring = jsonMatch[0]; 
  const memoryres = JSON.parse(jsonstring);
 
  if(memoryres.intensity_number>=IntensityThreeshold){
    memory = {
      userId: userId,
      personal_info: memoryres.personal_info,
      life_challenges: memoryres.life_challenges,
      topics_explored: memoryres.topics_explored,
      insights_gained: memoryres.insights_gained,
      spiritual_journey: memoryres.spiritual_journey,
      emotional_state: memoryres.emotional_state,
      learning_style: memoryres.learning_style,
      language_used: memoryres.language_used,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
   const save =await pinecone.saveUserMessage({memory});
   const triggercontentgenration = new Queue("generatecontent");
   await triggercontentgenration.add('Contentworker',{lastusermessage,userId,chatid})
   console.log(save)
  }

  }
  const getusermemory = await pinecone.getUserMemories({
    userId: userId!,
    topK: 10,
  });
  console.log(getusermemory)

  

   

 
  const context = await pinecone.getGitaResult({query:lastusermessage.content,topK:5});
 
 const messages = [
   {
     role: "model",
     parts: [
       {
         text: `You are Divine AI, a spiritual guru trained on the Bhagavad Gita. Speak in poetic, lyrical tones. Quoute Sanskrit shlokas when needed. Detect language of user automatically and respond in the same. Always bring user back to the spiritual path.`,
       },
     ],
   },
   ...(chat.messages.length > 5
     ? chat.messages
         .map((msg) => ({
           role: msg.role,
           parts: [{ text: msg.content }],
         }))
         .slice(-5)
     : chat.messages.map((msg) => ({
         role: msg.role,
         parts: [{ text: msg.content }],
       }))),
 ];


  const result = await model.generateContentStream({ contents: messages,generationConfig:genconfig });

  let fullMessage = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const textPart = chunk.text();
          if (!textPart) continue;

          fullMessage += textPart;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token: textPart })}\n\n`)
          );
        }

        // Save final message to DB
        await prisma.message.create({
          data: {
            chatid,
            content: fullMessage,
            role: "assistant",
            createdAt: new Date(),
          },
        });
        
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ token: "", done: true })}\n\n`
          )
        );

        controller.close();
      } catch (err) {
        console.error("Gemini stream error:", err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token: "" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}


