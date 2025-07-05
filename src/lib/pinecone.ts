import { IntegratedRecord, Pinecone as PineconeClient, RecordMetadata } from '@pinecone-database/pinecone';
import { readFile } from 'fs/promises';
import path from 'path';
import { file, json } from 'zod/v4';
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { GoogleGenerativeAI } from '@google/generative-ai';

 class PineconeDB {
  key = process.env.PINECONE_API_KEY || "";
  client: PineconeClient;
  ai: GoogleGenerativeAI; 
  constructor() {
    if (!this.key) {
      throw new Error("PINECONE_API_KEY is not set in environment variables");
    }
    this.client = new PineconeClient({
      apiKey: this.key,
    });
    this.ai = new GoogleGenerativeAI(process.env.Google_API_KEY!); 
  }
  async upsertgitacontent() {
    const filepath = path.join(__dirname, "Spritualdata", "verse.json");
    const fileContent = await readFile(filepath, "utf-8");
    const verses = JSON.parse(fileContent);
    if (!this.client) {
      throw new Error("Pinecone client is not initialized");
    }
    const index = this.client.index("gita");
    const data = [];
    // we need to batch the upsert requests to avoid hitting the limit
    const BATCH_SIZE = 100;
    const embeddingModel = this.ai.getGenerativeModel({
      model: "gemini-embedding-exp-03-07",
    });
    for (const verse of verses) {
      const result = await embeddingModel.embedContent(verse.word_meanings);
      const embedding = result.embedding;

      if (!embedding || embedding.values.length === 0) {
        console.error(`Failed to get embedding for verse: ${verse.verse}`);
        continue;
      }
      const pineconeVector = {
        id: verse.id.toString(), // Pinecone 'id' must be a string. Ensure verse.id is unique.
        values: embedding.values,
        metadata: {
          // All your custom data goes inside the 'metadata' object
          chapter_id: verse.chapter_id,
          chapter_number: verse.chapter_number,
          externalId: verse.externalId,
          text: verse.text,
          title: verse.title,
          verse_number: verse.verse_number,
          verse_order: verse.verse_order,
          transliteration: verse.transliteration,
          word_meanings: verse.word_meanings,
          // You might want to add a source or type for better filtering/context
          // type: "gita_verse",
        },
      };

      data.push(pineconeVector);
      if (data.length >= BATCH_SIZE) {
        await index.upsert(data);
        data.length = 0; // Clear the array for the next batch
      }
      if (data.length > 0) {
        await index.upsert(data);
      }
    }
  }

  async getgitaresult({
    query,
    topK = 5,
  }: {
    query: string;
    topK?: number;
  }): Promise<any> {
    if (!this.client) {
      throw new Error("Pinecone client is not initialized");
    }
    const index = this.client.Index("gita");
    const embeddingModel = this.ai.getGenerativeModel({
      model: "gemini-embedding-exp-03-07",
    });

    const queryembeddings = await embeddingModel.embedContent(query);
    const queryresult = queryembeddings.embedding;
    if (!queryresult || queryresult.values.length === 0) {
      throw new Error("Failed to get embedding for the query");
    }
    const pineconeQuery = {
      topK: topK,
      values: queryresult.values,
      includeMetadata: true,
    };  
   


 
}

  const pinecone = new PineconeDB();

export const getgitaresult = pinecone.getgitaresult.bind(pinecone);

