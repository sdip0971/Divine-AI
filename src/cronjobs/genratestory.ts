import cron from "node-cron";
import { Queue } from "bullmq";
import { prisma } from "@/lib/utils";
import { createClerkClient } from "@clerk/backend";

import { generateAndStoreStory } from "@/lib/everydaystory";
import dotenv from "dotenv";
dotenv.config();

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const myQueue = new Queue("genrateuserstory");
cron.schedule("0 6 * * *", async () => {
  console.log("⏰ Cron running...");

  const users = (await clerk.users.getUserList()).data
console.log(users)
 async function addJobs() {
  
  for (const user of users) {
    console.log(`Adding job for user ${user.id}`);
    await myQueue.add("GenrateUserStory", { userID: user.id });
  }
  
 }
 addJobs()

}
);
