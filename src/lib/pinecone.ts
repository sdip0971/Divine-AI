import {
  IntegratedRecord,
  Pinecone as PineconeClient,
  RecordMetadata,
} from "@pinecone-database/pinecone";
import { readFile } from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

export interface Memory {
  personal_info: string | "NONE";
  spiritual_journey: string | "NONE"; 
  life_challenges: string | "NONE"; 
  topics_explored: string[];
  emotional_state : string
  insights_gained: string | "NONE";
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  learning_style:string,
}

interface GitaVerse {
  id: number;
  chapter_id: number;
  chapter_number: number;
  externalId: string;
  text: string;
  title: string;
  verse_number: number;
  verse_order: number;
  transliteration: string;
  word_meanings: string;
}

interface PineconeVector {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}

class PineconeDB {
  private key: string;
  private client: PineconeClient;
  private ai: GoogleGenerativeAI;
  private readonly BATCH_SIZE = 100;
  private readonly EMBEDDING_MODEL = "gemini-embedding-exp-03-07";

  constructor() {
    this.key = process.env.PINECONE_API_KEY || "";
    const googleApiKey = process.env.Google_API_KEY || "";

    if (!this.key) {
      throw new Error("PINECONE_API_KEY is not set in environment variables");
    }

    if (!googleApiKey) {
      throw new Error("GOOGLE_API_KEY is not set in environment variables");
    }

    this.client = new PineconeClient({
      apiKey: this.key,
    });

    this.ai = new GoogleGenerativeAI(googleApiKey);
  }

  async upsertGitaContent(): Promise<void> {
    try {
      const filepath = path.join(__dirname, "Spritualdata", "verse.json");
      const fileContent = await readFile(filepath, "utf-8");
      const verses: GitaVerse[] = JSON.parse(fileContent);

      const index = this.client.index("gita");
      const data: PineconeVector[] = [];

      const embeddingModel = this.ai.getGenerativeModel({
        model: this.EMBEDDING_MODEL,
      });

      console.log(`Processing ${verses.length} verses...`);

      for (let i = 0; i < verses.length; i++) {
        const verse = verses[i];

        try {
          const result = await embeddingModel.embedContent(verse.word_meanings);
          const embedding = result.embedding;

          if (!embedding?.values || embedding.values.length === 0) {
            console.error(`Failed to get embedding for verse: ${verse.id}`);
            continue;
          }

          const pineconeVector: PineconeVector = {
            id: verse.id.toString(),
            values: embedding.values,
            metadata: {
              chapter_id: verse.chapter_id,
              chapter_number: verse.chapter_number,
              externalId: verse.externalId,
              text: verse.text,
              title: verse.title,
              verse_number: verse.verse_number,
              verse_order: verse.verse_order,
              transliteration: verse.transliteration,
              word_meanings: verse.word_meanings,
            },
          };

          data.push(pineconeVector);

          // Batch upsert when we reach the batch size
          if (data.length >= this.BATCH_SIZE) {
            await index.upsert(data);
            console.log(`Upserted batch of ${data.length} vectors`);
            data.length = 0; // Clear the array for the next batch
          }
        } catch (error) {
          console.error(`Error processing verse ${verse.id}:`, error);
          continue;
        }
      }

      // Handle remaining vectors
      if (data.length > 0) {
        await index.upsert(data);
        console.log(`Upserted final batch of ${data.length} vectors`);
      }

      console.log("Successfully upserted all Gita content");
    } catch (error) {
      console.error("Error upserting Gita content:", error);
      throw error;
    }
  }

  async getGitaResult({
    query,
    topK = 5,
  }: {
    query: string;
    topK?: number;
  }): Promise<any> {
    try {
      if (!query.trim()) {
        throw new Error("Query cannot be empty");
      }

      const index = this.client.Index("gita");
      const embeddingModel = this.ai.getGenerativeModel({
        model: this.EMBEDDING_MODEL,
      });

      const queryEmbeddings = await embeddingModel.embedContent(query);
      const queryResult = queryEmbeddings.embedding;

      if (!queryResult?.values || queryResult.values.length === 0) {
        throw new Error("Failed to get embedding for the query");
      }

      const pineconeQuery = {
        topK: topK,
        vector: queryResult.values,
        includeMetadata: true,
      };

      const searchResults = await index.query(pineconeQuery);
      return searchResults.matches;
    } catch (error) {
      console.error("Error getting Gita results:", error);
      throw error;
    }
  }

  async saveUserMessage({ memory }: { memory: Memory }): Promise<void> {
    try {
      const {
        userId,
        personal_info,
        spiritual_journey,
        life_challenges,
        topics_explored,
        insights_gained,
        emotional_state,
        learning_style
      } = memory;

      if (!userId) {
        throw new Error("UserId is required");
      }

      const namespace = this.client.Index("usermemory").namespace(userId);
      const embeddingModel = this.ai.getGenerativeModel({
        model: this.EMBEDDING_MODEL,
      });

      // Create embedding text from non-empty fields
      const embeddingText = [
        personal_info,
        spiritual_journey,
        life_challenges,
        topics_explored.join(","),
        emotional_state,
        insights_gained,
        learning_style
      ]
        .filter((item) =>typeof item==='string'&& item !== "NONE" && item?.trim())
        .join(" | ");

      if (!embeddingText.trim()) {
        console.log("No meaningful content to save for user:", userId);
        return;
      }

      const embeddingResult = await embeddingModel.embedContent(embeddingText);

      if (
        !embeddingResult?.embedding?.values ||
        embeddingResult.embedding.values.length === 0
      ) {
        throw new Error("Failed to get embedding for the user memory");
      }

      const now = new Date();
      const uniqueId = uuidv4();

      const data: PineconeVector = {
        id: uniqueId,
        values: embeddingResult.embedding.values,
        metadata: {
          personal_info,
          spiritual_journey,
          life_challenges,
          topics_explored,
          insights_gained,
          userId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      };

      await namespace.upsert([data]);
      console.log(`Successfully saved memory for user: ${userId}`);
    } catch (error) {
      console.error("Error saving user message:", error);
      throw error;
    }
  }

  async getUserMemories({
    userId,
    query,
    topK = 5,
  }: {
    userId: string;
    query?: string;
    topK?: number;
  }): Promise<any> {
    try {
      if (!userId) {
        throw new Error("UserId is required");
      }

      const namespace = this.client.Index("usermemory").namespace(userId);

      if (!query) {
        // If no query, just return recent memories using a vectorless query (fetch most recent by metadata if possible)
        const results = await namespace.query({
          topK: topK,
          vector: new Array(3072).fill(0), // Use a zero vector of the correct dimension this will return k most recent records
          includeMetadata: true,
        });
        return results.matches;
      }

      const embeddingModel = this.ai.getGenerativeModel({
        model: this.EMBEDDING_MODEL,
      });

      const queryEmbeddings = await embeddingModel.embedContent(query!);
      const queryResult = queryEmbeddings.embedding;

      if (!queryResult?.values || queryResult.values.length === 0) {
        throw new Error("Failed to get embedding for the query");
      }

      const searchResults = await namespace.query({
        topK,
        vector: queryResult.values,
        includeMetadata: true,
      });

      return searchResults.matches;
    } catch (error) {
      console.error("Error getting user memories:", error);
      throw error;
    }
  }

  async deleteUserMemory(userId: string, memoryId: string): Promise<void> {
    try {
      if (!userId || !memoryId) {
        throw new Error("UserId and memoryId are required");
      }

      const namespace = this.client.Index("usermemory").namespace(userId);
      await namespace.deleteOne(memoryId);
      console.log(`Successfully deleted memory ${memoryId} for user ${userId}`);
    } catch (error) {
      console.error("Error deleting user memory:", error);
      throw error;
    }
  }

  
}

export const pinecone = new PineconeDB();
