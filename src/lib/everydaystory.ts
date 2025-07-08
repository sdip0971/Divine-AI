// First we will create a cronjob that runs every day at morning
// create a langraph
//1) fetch ltm of user
//2) analyse user intent
//3) feed it to llm to genrate a story
//4) feed the story to get image
//5)return json repsonse

"use server";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import { Memory } from "@/lib/pinecone";
import { pinecone } from "@/lib/pinecone";
import { auth } from "@clerk/nextjs/server";
import cron from "node-cron";
import { filterMessages, HumanMessage } from "@langchain/core/messages";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/utils";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: "daugqhs17",
  api_key: "437869453445987",
  api_secret: "0-QBSHXoBCbmw1rNyOZD_bW_X-M",
});

export async function generateAndStoreStory(userId: string) {
  const genAI = new GoogleGenerativeAI(process.env.Google_API_KEY!);

  async function ReterieveMemory() {
    const pineconeobj = pinecone;
    try {
      const getusermemory = await pineconeobj.getUserMemories({
        userId,
        topK: 10,
      });

      const filteredMemories = getusermemory
        .filter((item: { metadata: any }) => {
          const meta = item.metadata || {};
          const values = [
            meta.life_challenges?.trim().toUpperCase(),
            meta.personal_info?.trim().toUpperCase(),
            meta.spiritual_journey?.trim().toUpperCase(),
            meta.insights_gained?.trim().toUpperCase(),
          ];
          return values.some((val) => val && val !== "NONE");
        })
        .map((item: { metadata: any }) => item.metadata);

      const messagestring = filteredMemories
        .reduce((acc: string[], obj: any) => {
          Object.values(obj).forEach((val) => {
            if (typeof val == "string" && val.trim().toUpperCase() != "NONE") {
              acc.push(val);
            } else if (Array.isArray(val) && val.length > 0) {
              acc.push(val.join(", ").trim());
            }
          });
          return acc;
        }, [])
        .join(",");

      const finalMessage =
        messagestring && messagestring.trim() !== ""
          ? messagestring
          : "I have no memories to share yet.";
      return { messages: [new HumanMessage(finalMessage)] };
    } catch (error) {
      return {
        messages: [new HumanMessage("Error: " + String(error))],
      };
    }
  }

  async function analyseuserintent({
    messages,
  }: typeof MessagesAnnotation.State) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const genconfig = {
        maxOutputTokens: 200,
        temperature: 0.5,
        topP: 0.95,
        topK: 40,
      };
      const lastMessage = messages[messages.length - 1];
      const userContent = lastMessage?.content || "";

      const intentanalyse = `You are a spiritual guide and expert in human emotions. Return valid JSON: {"emotion":"one-word", "intent":"one-phrase"} \nMemories:\n"""${userContent}"""`;

      const msg = { role: "user", parts: [{ text: intentanalyse }] };
      const result = await model.generateContent({
        contents: [msg],
        generationConfig: genconfig,
      });

      const intentText =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log("Intent analysis response:", intentText);
      
      const jsonMatch = intentText?.match(/{[\s\S]*}/);
      let intentobj = {};
      
      if (jsonMatch) {
        try {
          intentobj = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.log("Intent JSON parse error:", parseError);
          intentobj = { emotion: "unknown", intent: "seeking guidance" };
        }
      }

      const newMessage = new HumanMessage({
        content: "Intent analyzed successfully",
        additional_kwargs: { intent: intentobj, originalMemories: userContent },
      });
      return { messages: [...messages, newMessage] };
    } catch (error) {
      console.log("Intent analysis error:", error);
      return {
        messages: [
          ...messages,
          new HumanMessage("Intent Error: " + String(error)),
        ],
      };
    }
  }

  async function makestory({ messages }: typeof MessagesAnnotation.State) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const lastMessage = messages[messages.length - 1];
      const userContent = lastMessage?.content || "";
      const intent = lastMessage?.additional_kwargs?.intent || {};

      const makestoryPrompt = `You are an ancient spiritual storyteller. Based on the user's emotional state and intent, create a meaningful spiritual story that provides guidance and inspiration. 

UserIntent: ${JSON.stringify(intent)}
UserMemories: ${userContent}

Create a healing story that addresses their emotional needs and provides spiritual wisdom. The story should be complete and meaningful, around 2-3 paragraphs.

IMPORTANT: Return ONLY a valid JSON response in this exact format:
{"story":"Your complete story here"}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: makestoryPrompt }] }],
        generationConfig: { 
          maxOutputTokens: 200,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      const storyText =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log("Raw story response:", storyText);
      
      const jsonMatch = storyText?.match(/{[\s\S]*}/);
      let story = "";
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          story = parsed.story || "";
        } catch (parseError) {
          console.log("JSON parse error:", parseError);
          story = storyText || "";
        }
      } else {
        story = storyText || "";
      }

      const newMessage = new HumanMessage({
        content: userContent,
        additional_kwargs: { ...lastMessage?.additional_kwargs, story },
      });
      return { messages: [...messages, newMessage] };
    } catch (error) {
      console.log("Story generation error:", error);
      return {
        messages: [
          ...messages,
          new HumanMessage("Story Error: " + String(error)),
        ],
      };
    }
  }

  async function makeimage({ messages }: typeof MessagesAnnotation.State) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.8,
        }
      });
      
      const lastMessage = messages[messages.length - 1];
      const userContent = lastMessage?.content || "";
      const story = lastMessage?.additional_kwargs?.story || "";

      if (!story) {
        console.log("No story found for image generation");
        return {
          messages: [
            ...messages,
            new HumanMessage({
              content: userContent,
              additional_kwargs: {
                ...lastMessage?.additional_kwargs,
                imageDescription: "No story available for image generation",
                imageUrl: `https://example.com/placeholder-${userId}-${Date.now()}.jpg`,
              },
            }),
          ],
        };
      }

      const prompt = `Based on this spiritual story, create a concise, vivid description for generating an aesthetic spiritual image:

Story: "${story}"

Create a single paragraph description that captures the essence, mood, and key visual elements of this story. Focus on spiritual symbols, natural elements, colors, and atmosphere.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const imageDescription = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log("Image description generated:", imageDescription);
      
      // Note: Gemini doesn't generate images directly. You would need to use the description
      // with an image generation service like DALL-E, Midjourney, or Stable Diffusion
      const simulatedImageUrl = `https://example.com/generated-image-${userId}-${Date.now()}.jpg`;

      const newMessage = new HumanMessage({
        content: userContent,
        additional_kwargs: {
          ...lastMessage?.additional_kwargs,
          imageDescription,
          imageUrl: simulatedImageUrl,
        },
      });

      return { messages: [...messages, newMessage] };
    } catch (error) {
      console.log("Image generation error:", error);
      return {
        messages: [
          ...messages,
          new HumanMessage("Image Error: " + String(error)),
        ],
      };
    }
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", ReterieveMemory)
    .addNode("analyseintent", analyseuserintent)
    .addNode("makestory", makestory)
    .addNode("makeimage", makeimage)
    .addEdge(START, "model")
    .addEdge("model", "analyseintent")
    .addEdge("analyseintent", "makestory")
    .addEdge("makestory", "makeimage")
    .addEdge("makeimage", END);

  const compile = workflow.compile();
  const finaldata = await compile.invoke({});
  const story = finaldata.messages;

  console.log("✅ Story + Image saved:", story);
  return story;
}