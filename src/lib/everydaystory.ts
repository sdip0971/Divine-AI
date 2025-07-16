// First we will create a cronjob that runs every day at morning
// create a langraph
//1) fetch ltm of user
//2) analyse user intent
//3) feed it to llm to genrate a story
//4) feed the story to get image
//5)return json repsonse

"use server";
import { GoogleAuth } from "google-auth-library";

import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import { VertexAI } from "@google-cloud/vertexai";
const vertexAI = new VertexAI({
  project: "gen-lang-client-0303042219",
  location: "us-central1",
});
import { Memory } from "@/lib/pinecone";
import { pinecone } from "@/lib/pinecone";
import { auth } from "@clerk/nextjs/server";
import cron from "node-cron";
import { filterMessages, HumanMessage } from "@langchain/core/messages";
import { Content, GoogleGenerativeAI, Part } from "@google/generative-ai";
import { prisma } from "@/lib/utils";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "@/app/api/delete-chat/route";

cloudinary.config({
  cloud_name: process.env.cloud_name!,
  api_key:process.env.api_key!,
  api_secret: process.env.api_secret!,
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

      const intentText =result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
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

      const makestoryPrompt = `You are an ancient mythological storyteller. Based on the user's emotional state and intent, give a meaningful hindu mythological story that provides guidance and inspiration. 
      
  UserIntent: ${JSON.stringify(intent)}
  UserMemories: ${userContent}
  
  Create a healing story that addresses their emotional needs and provides spiritual wisdom. The story should be complete and meaningful, around 2-3 paragraphs.
  Highlight a section of learning for user through this story
  IMPORTANT: Return ONLY a valid JSON response in this exact format:
  {"story":"Your complete story here ,what you learnt from this - lesson for user","title":"A short Title for the story"}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: makestoryPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      const storyText =result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log("Raw story response:", storyText);

      let story = "";
      let title = '';
      // First try to extract JSON from code blocks
      const codeBlockMatch = storyText?.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      if (codeBlockMatch) {
        try {
          const parsed = JSON.parse(codeBlockMatch[1]);
          story = parsed.story || "";
          title= parsed.title || ""
        } catch (parseError) {
          console.log("Code block JSON parse error:", parseError);
          // Try to extract just the story value from the raw text
          const storyMatch = storyText?.match(/{[\s\S]*}/);
          if (storyMatch) {
            story = storyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
          } else {
            story = storyText || "";
          }
        }
      } else {
        // Try to extract story value directly from malformed JSON
        const storyMatch = storyText?.match(
          /"story":\s*"([^"\\]*(?:\\.[^"\\]*)*)"?/
        );
        if (storyMatch) {
          story = storyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        } else {
          
          const jsonMatch = storyText?.match(/{[\s\S]*}/);
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
        }
      }

      console.log("Extracted story:", story);
      console.log("Story length:", story.length);

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
          maxOutputTokens: 250,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
        },
      });

      const lastMessage = messages[messages.length - 1];
      const userContent = lastMessage?.content || "";
      const story = lastMessage?.additional_kwargs?.story || "";

      if (!story) {
        return {
          messages: [
            ...messages,
            new HumanMessage({
              content: userContent,
              additional_kwargs: {
                ...lastMessage?.additional_kwargs,
                imageDescription: "No story available for image generation",
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

    
      let imageDescription = "";

      try {
       
        const rawText =
          result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        console.log("Raw image description response:", rawText);

        if (rawText) {
          imageDescription = rawText;
        } else {
          // Try alternative response structure
          const altText = result.response.text?.();
          if (altText) {
            imageDescription = altText.trim();
          }
        }

        // If still empty, use the story as description
        if (!imageDescription) {
          //@ts-ignore
          imageDescription = `A spiritual scene depicting: ${story.substring(
            0,
            200
          )}...`;
        }
      } catch (extractError) {
        console.log("Error extracting image description:", extractError);

        //@ts-ignore
        imageDescription = `A spiritual scene depicting: ${story.substring(
          0,
          200
        )}...`;
      }

      console.log("Final image description:", imageDescription);

      // IMPORTANT: Preserve the story in the new message
      const newMessage = new HumanMessage({
        content: userContent,
        additional_kwargs: {
          ...lastMessage?.additional_kwargs,
          story, // Make sure the story is preserved
          imageDescription,
        },
      });

      console.log(
        "🔍 DEBUG makeimage - preserving story:",
        newMessage.additional_kwargs.story
      );

      return { messages: [...messages, newMessage] };
    } catch (error) {
      console.log("Image generation error:", error);

      
      const lastMessage = messages[messages.length - 1];
      const story = lastMessage?.additional_kwargs?.story || "";
      const fallbackDescription = story
        ? //@ts-ignore
          `A spiritual scene depicting: ${story.substring(0, 200)}...`
        : "A peaceful spiritual scene";

      return {
        messages: [
          ...messages,
          new HumanMessage({
            content: lastMessage?.content || "",
            additional_kwargs: {
              ...lastMessage?.additional_kwargs,
              imageDescription: fallbackDescription,
            },
          }),
        ],
      };
    }
  }

  async function createimage({ messages }: typeof MessagesAnnotation.State) {
    const lastMessage = messages[messages.length - 1];
    const story = lastMessage?.additional_kwargs?.story || "";
    const imagePrompt =
      (lastMessage?.additional_kwargs?.imageDescription as string) || "";
    console.log(imagePrompt);
    // Ensure imagePrompt is explicitly a string
    const promptText: string = imagePrompt;

    const userContent = lastMessage?.content || "";

    console.log("🔍 DEBUG createimage - story received:", story);

    if (!story || !imagePrompt) {
      return {
        messages: [
          ...messages,
          new HumanMessage({
            content: "Missing story or prompt",
            additional_kwargs: {
              ...lastMessage?.additional_kwargs,
              story, 
            },
          }),
        ],
      };
    }

    try {
  
      const PROJECT_ID = "gen-lang-client-0303042219";
      const MODEL_ID = "imagen-4.0-generate-preview-06-06"; 
      const LOCATION = "us-central1";
      const auth = new GoogleAuth({
        scopes: "https://www.googleapis.com/auth/cloud-platform",
      });

      const client = await auth.getClient();
      const { token } = await client.getAccessToken();
      const ACCESS_TOKEN = token;
     

      const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predict`;

      const body = {
        instances: [
          { prompt: promptText }
        ],
        parameters: {
          sampleCount: 1,
          width: 1024,
          height: 600,
          cfgScale: 8.0
        }
        }
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log(data)
        const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;
        console.log(base64Image)

      
      

      const uploadResult = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64Image}`,
        {
          folder: "spiritual-images",
          public_id: `spiritual_${Date.now()}`,
          overwrite: true,
        }
      );


      const newMessage = new HumanMessage({
        content: userContent,
        additional_kwargs: {
          ...lastMessage.additional_kwargs,
          story, // IMPORTANT: Explicitly preserve the story
          imageUrl: uploadResult.secure_url,
        },
      });

      console.log(
        "🔍 DEBUG createimage - final message story:",
        newMessage.additional_kwargs.story
      );

      return { messages: [...messages, newMessage] };
    } catch (error) {
      console.log("Image creation error:", error);
      return {
        messages: [
          ...messages,
          new HumanMessage({
            content: "Image creation failed",
            additional_kwargs: {
              ...lastMessage?.additional_kwargs,
              story, 
            },
          }),
        ],
      };
    }
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", ReterieveMemory)
    .addNode("analyseintent", analyseuserintent)
    .addNode("makestory", makestory)
    .addNode("makeimage", makeimage)
    .addNode("createimage", createimage)
    .addEdge(START, "model")
    .addEdge("model", "analyseintent")
    .addEdge("analyseintent", "makestory")
    .addEdge("makestory", "makeimage")
    .addEdge("makeimage", "createimage")
    .addEdge("createimage", END);

  const compile = workflow.compile();
  const finalData = await compile.invoke({});
  const messages = finalData.messages;
  const last = messages[messages.length - 1];

  let story = last?.additional_kwargs?.story || "";
  let imageUrl = last?.additional_kwargs?.imageUrl || "";
  console.log(story);
  console.log(imageUrl);
  if (typeof story !== "string") {
    story = JSON.stringify(story);
  }

  if (typeof imageUrl !== "string") {
    imageUrl = String(imageUrl);
  }

  
  if (!imageUrl || typeof imageUrl !== "string") {
    imageUrl = "https://example.com/default-image.jpg"; 
  }

  // Save to DB
  const savedStory = await prisma.story.create({
    data: {
      //@ts-ignore
      story: story,
      userId : userId,
      //@ts-ignore
      image: imageUrl,
    },
  });

  console.log("✅ Story saved to DB:", savedStory);

  return { success: true, storyId: savedStory.id };
}
