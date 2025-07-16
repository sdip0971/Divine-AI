import { Worker } from "bullmq";
import IORedis from "ioredis";
import { generateAndStoreStory } from "./everydaystory";
import { Workflow } from "lucide-react";
import { searchspotify, searchytb } from "./tools";

import { ToolNode } from "@langchain/langgraph/prebuilt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { string } from "zod/v4";
import { tool } from "@langchain/core/tools";
import { parse } from "path";
import { HumanMessage } from "@langchain/core/messages";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import redisClient from "./redisClient";
const connection = new IORedis({ maxRetriesPerRequest: null });
const publisher = redisClient
const genAI = new GoogleGenerativeAI(process.env.Google_API_KEY!);

export interface UnifiedResult {
  platform: "youtube" | "spotify";
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  url: string;
  extra?: { [key: string]: any };
}
interface ContentResult {
  success: boolean;
  jobId: string;
  userId: string;
  chatid: string;
  timestamp: string;
  data?: {
    searchQuery: string;
    totalResults: number;
    platforms: {
      spotify: { count: number; results: UnifiedResult[] };
      youtube: { count: number; results: UnifiedResult[] };
    };
    results: UnifiedResult[];
  };
  error?: string;
}
interface CombinedResult {
  query: string;
  results: UnifiedResult[];
}


const worker = new Worker(
  "genrateuserstory",
  async (job) => {
    const { userID } = job.data;
    if (!userID) return;
    await generateAndStoreStory(userID as string);
  },
  { connection }
);
worker.on("completed", (job) => {
  console.log(`Job for ${job.data.userID} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job for ${job?.data.userID} failed: ${err.message}`);
});
  
const contentworker = new Worker("generatecontent",async(job)=>{
  // we will do sentiment analysis and form a search prompt
  //call a tool
  //gather results
  //rank by relevance score by llm maybe if we have time then
  //send result to frontend
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const genconfig = {
    responseMimeType: "application/json",
    maxOutputTokens: 200,
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
  };
  const { lastusermessage,userId,chatid } = job.data
  const prompt = lastusermessage.content as string
  if (!prompt || !userId || !chatid) {
    throw new Error("Missing required job data");
  }

  function extractJsonString(responseText: string): string | null {
    const jsonRegex = /(\{[\s\S]*?\})/;

    const match = responseText.match(jsonRegex);

    if (match) return match[1];

    // Fallback: try to find "searchquery": "..."
    const fallbackMatch = responseText.match(/"searchquery"\s*:\s*"([^"]+)"/);
    if (fallbackMatch) {
      return JSON.stringify({ searchquery: fallbackMatch[1] });
    }

    return null;
  }
  let extractedSearchQuery = "";
  const formquery = async ({ messages }: typeof MessagesAnnotation.State) => {
    const userprompt = messages[0].content

    if (!userprompt) {
      console.error(
        "Error: formquery received no prompt in initial state messages."
      );
      throw new Error("Initial prompt missing in graph state.");
    }
    const intentanalyse = `Generate a highly relevant search query for YouTube and similar platforms strictly related to Hinduism. The query must reflect the emotional tone or sentiment of the provided user prompt and incorporate Hindu philosophies, scriptures, deities, rituals, or spiritual practices accordingly. Ensure the generated query yields Hindu-centric content only. Given the prompt: "${prompt}", Respond only with raw JSON. No explanations, no markdown, no formatting.Example:{"searchquery": "generated-query"} Prompt: "${prompt}"`;
    const msg = { role: "user", parts: [{ text: intentanalyse }] };
    const result = await model.generateContent({
      contents: [msg],
      generationConfig: genconfig,
    });
    

    // const searchQuery =result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const searchQuery = result.response.text();
    console.log("searchquery", searchQuery);
    const jsonStr = extractJsonString(searchQuery);
    console.log("json", jsonStr);
    if (!jsonStr) {
      throw new Error("Failed to extract JSON from Gemini response");
    }

    try {
      const parsed = await JSON.parse(jsonStr);
      const query = parsed.searchquery;
      extractedSearchQuery = query || "Hindu Bhajans";
      console.log("extracted search query", extractedSearchQuery);
      const msg = new HumanMessage({
        content: "Search Query",
        additional_kwargs: { extractedSearchQuery },
      });
      return { messages: [msg] };
    } catch (parseError) {
      const match = searchQuery.match(/"searchquery"\s*:\s*"([^"]+)"/);
      if (match) {
        extractedSearchQuery = match[1];
        console.log("extracted from regex:", extractedSearchQuery);
      } else {
        extractedSearchQuery = "Hindu Bhajans";
        console.log("using fallback query");
      }

      console.log("Code block JSON parse error:", parseError);
    }
  };
  const searchSpotify = tool(
    async ({ query }: { query: string }) => await searchspotify(query),
    { name: "searchSpotify", description: "Search Spotify for tracks" }
  );

  const searchYouTube = tool(
    async ({ query }: { query: string }) => await searchytb(query),
    {
      name: "searchYouTube",
      description: "Search YouTube for videos",
    }
  );

  const tools = [searchSpotify, searchYouTube];
  const searchExecutionNode = async ({
    messages,
  }: typeof MessagesAnnotation.State) => {
    const lastMessage = messages[messages.length - 1];
    const searchQuery =
      lastMessage.additional_kwargs?.extractedSearchQuery ||
      extractedSearchQuery;

    if (!searchQuery) {
      return { error: "No search query available" };
    
    }

    try {
      const combinedResults:CombinedResult = {
        query:JSON.stringify(searchQuery),
        results:[],
    }
      const searchPromises = tools.map(async (tool) => {
        try {
          const results = await tool.func({ query: extractedSearchQuery}) as UnifiedResult[]
          combinedResults.results.push(...results)
          
        } catch (error) {
          console.error(`Error searching ${tool.name}:`, error);
          
        }
      });

      const searchResults = await Promise.all(searchPromises);
    
      const result = new HumanMessage({
        content: JSON.stringify(combinedResults),
        additional_kwargs: {
          combinedResults: JSON.stringify(combinedResults),
        },
      });

     return {
       messages : [result]
     };
    } catch (error) {
      console.error("Error in search execution:", error);
  
    }
  };

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("query", formquery)
    .addNode("tools", searchExecutionNode)
    .addEdge("__start__", "query")
    .addEdge("query", "tools")
    .addEdge("tools", "__end__");


    const app = workflow.compile();
    const initialMessages = [
      new HumanMessage({ content: prompt})
    ];
    const result = await app.invoke({ messages: initialMessages });
    const lastMessage = result.messages[result.messages.length - 1];
    let finalResult: CombinedResult;
    if (lastMessage?.additional_kwargs?.combinedResults) {
      try {
        finalResult = JSON.parse(
          lastMessage.additional_kwargs.combinedResults as string
        );
      } catch (e) {
        console.error("Failed to parse combinedResults from additional_kwargs");
        finalResult = { query: extractedSearchQuery || "unknown", results: [] };
      }
      
    } 
    else if (typeof lastMessage.content === "string") {
      try {
        finalResult = JSON.parse(lastMessage.content);
      } catch (e) {
        console.error("Failed to parse content as JSON");
        finalResult = { query: extractedSearchQuery || "Hindu Bhajans", results: [] };
      }
    }
     else {
      finalResult = { query: extractedSearchQuery || "Hindu Bhajans", results: [] };
    }


    const workerOutput: ContentResult = {
      success: true,
      jobId: job.id!,
      userId,
      chatid,
      timestamp: new Date().toISOString(),
      data: {
        searchQuery: finalResult.query,
        totalResults: finalResult.results?.length | 0,
        platforms: {
          spotify: {
            count: finalResult?.results?.filter((r) => r.platform === "spotify")
              .length,
            results: finalResult?.results?.filter(
              (r) => r.platform === "spotify"
            ),
          },
          youtube: {
            count: finalResult?.results?.filter((r) => r.platform === "youtube")
              .length,
            results: finalResult?.results?.filter(
              (r) => r.platform === "youtube"
            ),
          },
        },
        results: finalResult.results || [],
      },
    };

    return workerOutput;


    
    
}
,{connection})

async function publishStatus(
  userId: string,
  chatid: string,
  status: string,
  message: string
) {
  try {
    const channel = `content:${userId}`;
    const statusMessage = {
      type: "ContentStatus",
      timestamp: new Date().toISOString(),
      payload: {
        userId,
        chatid,
        status,
        message,
      },
    };

    await publisher.publish(channel, JSON.stringify(statusMessage));
  } catch (error) {
    console.error("Failed to publish status:", error);
  }
}

contentworker.on("completed", async (job, result: ContentResult) => {
  try {
    const channel = `content:${result.userId}`;
    const message = {
      type: 'ContentDone',
      timestamp: new Date().toISOString(),
      payload: result
    };
    
    await publisher.publish(channel, JSON.stringify(message));
    console.log(`Published to Redis channel: ${channel}`);
    
    // Store result in Redis for caching/history
    const key = `content:${result.userId}:${result.chatid}`;
    await publisher.setex(key, 3600, JSON.stringify(result));
    
    console.log(`Content generation completed for user ${result.userId}, chat ${result.chatid}`);
    
  } catch (error) {
    console.error('Failed to publish to Redis:', error);
  }
});

// Handle job failures
contentworker.on("failed", async (job, error) => {
  const { userId, chatid } = job?.data || {};
  
  if (userId && chatid) {
    try {
      const failureResult: ContentResult = {
        success: false,
        jobId: job?.id || "unknown",
        userId,
        chatid,
        timestamp: new Date().toISOString(), 
        error: error.message || "Job failed"
      };
      
      const channel = `content:${userId}`;
      const message = {
        type: 'ContentDone',
        timestamp: new Date().toISOString(),
        payload: failureResult
      };
      
      await publisher.publish(channel, JSON.stringify(message));
      console.log(`Published failure notification to Redis channel: ${channel}`);
      
    } catch (publishError) {
      console.error('Failed to publish failure notification:', publishError);
    }
  }
  
  console.error(`Content generation job failed for user ${userId}:`, error);
});

export default contentworker;

