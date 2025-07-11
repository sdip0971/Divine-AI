import { SarvamAIClient } from "sarvamai";
let client: SarvamAIClient | null;
export function getSarvamClient() {
  
  if (!client) {
    client = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAM_KEY!,
    });
  }
  return client;
}