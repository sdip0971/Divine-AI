import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/utils";
import {pinecone} from "@/lib/pinecone";
import { Memory } from "@/lib/pinecone";


import { auth, getAuth } from "@clerk/nextjs/server";
import { get } from "http";
const genAI = new GoogleGenerativeAI(process.env.Google_API_KEY!);


export async function GET(
  

  req: NextRequest,
  { params }: { params: Promise<{ chatid: string }> }
) {
    console.log("req recieved")
  const encoder = new TextEncoder();
  const chatid = (await params).chatid;
  const userId =  (await auth()).userId
  let memory = {};
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",  });
    const genconfig ={
      "maxOutputTokens": 45,
      "temperature":0.5,
      "topP": 0.95,
      "topK": 40,
    }


  const chat = await prisma.chat.findUnique({
    where: { id: chatid },
    include: { messages: true },
  });

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }
  const lastusermessage = chat.messages.filter((msg)=>msg.role === "user").slice(-1)[0];
  const getLastFewMessages = chat.messages.filter((msg) => msg.role === "user").slice(-3).map((msg) => msg.content).join("\n");
  const ltmagent = [
    {
      role: "model",
      parts: [
        {
          text: `You are analyzing a spiritual conversation for memory extraction. 
Extract information in these categories:

1. PERSONAL_INFO: Name, background, life situation
2. SPIRITUAL_JOURNEY: Current spiritual practices, beliefs, questions
3. LIFE_CHALLENGES: Problems seeking guidance for
4. INSIGHTS_GAINED: Understanding or realizations from conversation
5. TOPICS_EXPLORED: Spiritual concepts discussed
6. EMOTIONAL_STATE: Current mental/emotional context
7. LEARNING_STYLE: How user prefers to learn (practical/theoretical)

User Message: "${lastusermessage.content}"
Previous Context: "${getLastFewMessages? getLastFewMessages : "NONE"}"

Output as JSON:
{
  "personal_info": "extracted info or NONE",
  "spiritual_journey": "extracted info or NONE", 
  "life_challenges": "extracted info or NONE",
  "insights_gained": "extracted info or NONE",
  "topics_explored": ["concept1", "concept2"] or [],
  "emotional_state": "extracted info or NONE",
  "learning_style": "extracted info or NONE"
}
`,
        },
      ],
    },
    {
      role: "user",
      parts: [
        {
          text: lastusermessage.content,
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
  if(jsonMatch){
  const jsonstring = jsonMatch[0]; 
  const memoryres = JSON.parse(jsonstring);
  memory = {
    userId: userId,
     personal_info: memoryres.personal_info
  };
  }
  // if (saveToMemoryText !== "NONE" && saveToMemoryText !== "") {
  

   
  //   //save to vector db
  //   await pinecone.saveUserMessage()
  // }
 
  const context = await pinecone.getGitaResult({query:lastusermessage.content,topK:5});
  console.log("context",context)

 const messages = [
    {
      role: "model",
      parts: [
        {
          text: `You are Divine AI, a spiritual guru trained on the Bhagavad Gita. Speak in poetic, lyrical tones. Quoute Sanskrit shlokas when needed. Respond in user's language always respond in same language as the user. Always bring user back to the spiritual path.`,
        },
      ],
    },
    ...(chat.messages.length > 10
      ? chat.messages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })).slice(-10)
      : chat.messages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }))
    )
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

// Ollama only takes pale text not chat gpt style prompts
// function formatMessages(messages: { role: string; content: string }[]) {
//   return (
//     messages
//       .map((msg) => {
//         const role =
//           msg.role === "user"
//             ? `USER`
//             : msg.role === "assistant"
//             ? `ASSISTANT`
//             : "SYSTEM";
//         return `${role}: ${msg.content}`;
//       })
//       .join("\n") + "\nASSISTANT:");
// }

// import OpenAI from "openai";
// import { buffer } from "stream/consumers";
// const ai = new GoogleGenAI({ apiKey: process.env.Google_API_KEY});
// const openai = new OpenAI({
//   baseURL: "https://openrouter.ai/api/v1",
//   apiKey: process.env.OPENROUTER_API_KEY!,
//   defaultHeaders: {
//     "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
//     "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
//   },
// });
// export async function GET(
//   req: NextRequest,
//   { params }: { params: Promise<{ chatid: string }>}
// ) {
//   const encoder = new TextEncoder();
//   const chatid = (await params).chatid;

//   const chat = await prisma.chat.findUnique({
//     where: { id: chatid },
//     include: { messages: true },
//   });

//   if (!chat) {
//     return NextResponse.json({ error: "Chat not found" }, { status: 404 });
//   }

//   const messages = [
//     {
//       role: "system",
//       content: `You are Divine AI, a spiritual guru trained on the Bhagavad Gita. Speak in poetic, lyrical tones. Quote Sanskrit shlokas when needed. Respond in user's language. Always bring user back to the spiritual path.`,
//     },
//     ...chat.messages.map((m) => ({
//       role: m.role,
//       content: m.content,
//     })),
//   ];

//   const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//       //   "Content-Type": "application/json",
//       //   "HTTP-Referer": "https://your-app.com", // 🔁 Optional but good for rate limits
//       "X-Title": "divine-ai", // 🧠 Just a name tag
//     },
//     body: JSON.stringify({
//       model: "openchat/openchat-3.5-0106", //
//       messages,
//       stream: true,
//     }),
//   });
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: "Explain how AI works in a few words",
//     config: {
//       thinkingConfig: {
//         thinkingBudget: 0, // Disables thinking
//       },
//     },
//   });

//   const reader = res.body?.getReader();
//   if (!reader) {
//     return new Response("No response from LLM", { status: 500 });
//   }

//   let fullMessage = "";

//   const stream = new ReadableStream({
//     async start(controller) {
//       const decoder = new TextDecoder();
//       let buffer = "";

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) {
//             await prisma.message.create({
//               data: {
//                 chatid,
//                 content: fullMessage,
//                 role: "assistant",
//                 createdAt: new Date(),
//               },
//             });

//           break;
//         }

//   const chunk = decoder.decode(value);
//   console.log("chunk",chunk)
//   buffer += chunk;

//   const lines = buffer.split("\n");
//   buffer = lines.pop() ?? ""; // last line might be incomplete

//   for (let line of lines) {
//     line = line.trim();
//     if (!line.startsWith("data:")) continue;

//     const jsonString = line.replace("data:", "").trim();

//     if (jsonString === "[DONE]") {
//       controller.close();
//       return;
//     }

//     try {
//       const json = JSON.parse(jsonString);

//       const token = json.choices?.[0]?.delta?.content || "";
//       console.log(token)
//       fullMessage += token;
//       controller.enqueue(
//         encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
//       );
//     } catch (e) {
//       console.error("Parse error:", e);
//       continue;
//     }
//   }
//       }
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     },
//   });
// }

//Ollama model slow and frustrating might try later
// export async function GET(
//   req: NextRequest,
//   { params }: { params: Promise<{ chatid: string }> }
// ) {
//   //convert text chunks in binary data
//   const together = new Together();
//   const encoder = new TextEncoder();
//   const chatid = (await params).chatid;
//   console.log("chat id is ", chatid);

//   const chat = await prisma.chat.findUnique({
//     where: {
//       id: chatid,
//     },
//     include: {
//       messages: true,
//     },
//   });
//   if (!chat) {
//     return NextResponse.json({ error: "Chat not found" }, { status: 404 });
//   }
//   const chatmessages = chat.messages;

//   const messages = [
//     {
//       role: "system",
//       content: `
//         You are Divine AI, a spiritual guru trained on Bhagavad Gita.
//         Speak in a poetic and lyrical tone. Occasionally quote Sanskrit or Hindi shlokas.
//         Mix GenZ humor with deep philosophy Give Response in User's language.
//         Always bring the user back to the spiritual path. End with a divine blessing.
//       `,
//     },
//     ...chat.messages.map((msg) => ({
//       role: msg.role,
//       content: msg.content,
//     })),
//   ];
//   let res;
//   try {
//     // res = await fetch("http://127.0.0.1:11434/api/generate", {
//     //   method: "POST",
//     //   headers: { "Content-Type": "application/json" },
//     //   body: JSON.stringify({
//     //     model: "mistral:7b",
//     //     prompt: messages,
//     //     stream: true,
//     //   }),
//     // });
//     res = await together.chat.completions.create({
//       messages: [],
//       model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
//       stream: true,
//     });

//     console.log(res);
//   } catch (err) {
//     return new Response("LLM server not reachable", { status: 502 });
//   }
//   // response is coming as streams this mehtod
//   //  getReader allows us to read the data streams as it is coming not wait for entire stream
//   const reader = res.body?.getReader();
//   if (!reader) {
//     return new Response("No response from LLM", { status: 500 });
//   }

//   let fullMessage = "";
//   //here we create our own custom readable stream to send back to the frontend
//   //controller is your remote control to push data into the stream manually
//   //Once controller.enqueue() runs, frontend receives it instantly via onmessage
//   const stream = new ReadableStream({
//     async start(controller) {
//       //ollama give raw bytes this converts it into readable format

//       const decoder = new TextDecoder();
//       //this is a loop that reads chunks until the streams are coming

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) {
//           //create the msg in db
//           await prisma.message.create({
//             data: {
//               content: fullMessage,
//               role: "assistant",
//               chatid: chatid,
//               createdAt: new Date(),
//             },
//           });

//           controller.close();
//           break;
//         }

//         //streams are coming

//         //chunks come like this
//         // chunk const chunk = `
//         // data: {"message": {"role": "assistant", "content": "Namaste"}}
//         // data: {"message": {"role": "assistant", "content": " duniya"}}
//         // data: [DONE]
//         // `;

//         //decode stream converted bytes into text
//         const decode = decoder.decode(value);
//         const line = decode.split("\n");
//         //now it looks like [
//         //   'data: {"message": {"role": "assistant", "content": "Namaste"}}',
//         //   'data: {"message": {"role": "assistant", "content": " duniya"}}',
//         //   'data: [DONE]' ]
//         for (let eachline of line) {
//           if (!eachline.startsWith("data:")) continue;

//           const eachmsg = eachline.replace("data:", "").trim();

//           console.log(eachmsg);
//           // when reach last chunk stop
//           if (eachmsg.trim() === "[DONE]") {
//             controller.close();
//             return;
//           }

//           try {
//             const parsed = JSON.parse(eachmsg);
//             if (parsed.done) {
//               controller.close();
//               return;
//             }

//             const data = parsed.response;
//             if (data) {
//               fullMessage += data;
//               // send each token to front end
//               controller.enqueue(
//                 encoder.encode(`data: ${JSON.stringify({ token: data })}\n\n`)
//               );
//             }
//           } catch (err) {
//             console.error(" JSON Parse Error:", err);
//             controller.enqueue(
//               encoder.encode(`data: ${JSON.stringify({ token: "" })}\n\n`)
//             );
//             controller.close();
//             return;
//           }
//         }
//       }
//     },
//   });
//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     },
//   });
// }
