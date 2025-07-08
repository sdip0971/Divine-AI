import cron from "node-cron";

import { prisma } from "@/lib/utils";
import { createClerkClient } from "@clerk/backend";
import { Clerk } from "@clerk/clerk-sdk-node";
import { generateAndStoreStory } from "@/lib/everydaystory";

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

cron.schedule("0 6 * * *", async () => {
  console.log("⏰ Cron running...");

  const users = await clerk.users.getUserList()// Apne DB ka model check kar

//   for (const user of users) {
    await generateAndStoreStory('user_2yhMXLOKguwYW6VjRut7LdeNTMy');
  //}


});
