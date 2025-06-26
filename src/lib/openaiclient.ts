import OpenAI from "openai";
class OpenAIClient {
  static instance : OpenAIClient | null;
    client: OpenAI;

  constructor() {
    this.client = new OpenAI();
  }

  static getInstance() {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  getClient() {
    return this.client;
  }
}
export const openaiclient = OpenAIClient.getInstance().getClient()