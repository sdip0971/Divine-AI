// First we will create a cronjob that runs every day at morning 
// create a langraph
//1) fetch ltm of user
//2) analyse user intent
//3) feed it to llm to genrate a story
//4) feed the story to get image
//5)return json repsonse
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

cron.schedule("0 6 * * *", async() => {
  const userId = (await auth()).userId;
  if (!userId) {
    return;
  }

  async function ReterieveMemory() {
    const pineconeobj = pinecone;
    // userId is guaranteed to be a string here
    const getusermemory = await pineconeobj.getUserMemories({
      userId: userId!,
      topK: 10,
    });
    const memory = getusermemory.map((memory:Memory)=>{
      const mem = [
        memory.createdAt,
        memory.insights_gained,
        memory.spiritual_journey,
        memory.topics_explored.join(","),
        memory.emotional_state,
        memory.learning_style,
        memory.life_challenges,
      ]
        .filter(
          (item) => typeof item === "string" && item !== "NONE" && item?.trim()
        )
        .join(" | ");
      return mem
  }
  )
    
    return { message: getusermemory };
  }
  async function analyseuserintent() {}

  const workflow = new StateGraph(MessagesAnnotation)

    .addNode("model", ReterieveMemory)
    .addNode("analyseintent", analyseuserintent)
    .addEdge(START, "model")
    .addEdge("model", END);
});
