import { Worker } from "bullmq";
import IORedis from "ioredis";
import { generateAndStoreStory } from "./everydaystory";

const connection = new IORedis({ maxRetriesPerRequest: null });

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
  