"use server"
import { SarvamAIClient } from "sarvamai";
export const translateText = async(story:string,translateto:"en-IN"|"hi-IN",currentlang:"en-IN"|"hi-IN")=>{
    console.log("sarvamkey",process.env.SARVAM_KEY)
 const client = new SarvamAIClient({
   apiSubscriptionKey: process.env.SARVAM_KEY!,
 });
 const translatedtext = await client.text.translate({
   model: "sarvam-translate:v1",
   input: story,
   source_language_code:currentlang,
   target_language_code: translateto,
   speaker_gender: "Male",
 });
  return translatedtext
} 