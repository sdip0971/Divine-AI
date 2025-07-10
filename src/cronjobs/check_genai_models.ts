// check_genai_models.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv"; // Import dotenv to load .env variables

// Load environment variables from .env file
dotenv.config();

async function runModelListTest() {
  const apiKey = process.env.Google_API_KEY;

  if (!apiKey) {
    console.error("ERROR: Google_API_KEY environment variable is not set.");
    console.error(
      "Please ensure your .env file has GOOGLE_API_KEY=YOUR_API_KEY"
    );
    return;
  }

  console.log("Initializing GoogleGenerativeAI with API Key...");
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log("Attempting to call genAI.listModels()...");
    // This is the line that's failing. We are explicitly testing it here.
    const { models } = await genAI.listModels();

    console.log("SUCCESS: genAI.listModels() executed without TypeError!");
    console.log(`Found ${models.length} models.`);

    console.log("\n--- First 5 Models ---");
    models.slice(0, 5).forEach((model) => {
      console.log(`- Name: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(
        `  Supported Methods: ${model.supportedGenerationMethods.join(", ")}`
      );
      console.log("---");
    });

    console.log("\n--- Image Generation Models ---");
    let foundImageModel = false;
    models.forEach((model) => {
      if (
        model.supportedGenerationMethods.includes("generateContent") &&
        (model.name.includes("image") ||
          model.displayName.includes("image") ||
          (model.description &&
            model.description.toLowerCase().includes("image generation")))
      ) {
        console.log(`- Name: ${model.name}`);
        console.log(`  Display Name: ${model.displayName}`);
        console.log(
          `  Supported Methods: ${model.supportedGenerationMethods.join(", ")}`
        );
        console.log(`  Description: ${model.description || "N/A"}`);
        console.log("---");
        foundImageModel = true;
      }
    });

    if (!foundImageModel) {
      console.log(
        "No specific image generation models found supporting 'generateContent' in the filtered list."
      );
    }
  } catch (error) {
    console.error("FAILED: Error during genAI.listModels() test:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

// Execute the test function
runModelListTest();
