import { createServer } from "http";
import { Server } from "socket.io";
import IORedis from "ioredis";
import { clerkClient, verifyToken } from "@clerk/nextjs/server";
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", 
    credentials:true
  },
});

const redis = new IORedis();
// using middleware so none could hit the link and get access to socket
// io.use(async (socket, next) => {
//     const token = socket.handshake.auth.token;
    
//     if (!token) {
//       return next(new Error("No auth token provided"));
//     }
  
//     try {
//         const { sessionId, userId, ...rest } = await verifyToken(token, {
//           secretKey: process.env.CLERK_SECRET_KEY,
//         });
//       if (!sessionId) {
//         return next(new Error("Invalid token"));
//       }
  
//       socket.data.userId = userId;
//       console.log("Socket Authenticated as user:", userId);
//       next();
//     } catch (err) {
//       console.error("Token validation error:", err);
//       next(new Error("Authentication failed"));
//     }});
io.on("connection", (socket) => {
    console.log("Client connected to socket.io");
  
    socket.on("subscribeToRecommendations", async ({ userId }) => {
         if (!userId) {
         console.log('id not recieved / not matched')
          socket.emit("error", {
            message: "Unauthorized: Can only subscribe to your own content",
          });
          return;
        } 
        console.log('socket active')
          const redisSubsriber = new IORedis();


        const channel = `content:${userId}`;
        console.log(channel)
  
       
  
      const messageHandler = (chan: string, message: string) => {
        if (chan === channel) {
          console.log(`Publishing to client ${socket.id} for ${channel}`);
          socket.emit("recommendations", JSON.parse(message));
        }
      }
      await redisSubsriber.subscribe(channel);
  
      redisSubsriber.on("message", messageHandler);
  
      socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`);
        redisSubsriber.unsubscribe(channel);
        redisSubsriber.removeListener("message", messageHandler);
      });
    });
});
httpServer.listen(4000, () => {
  console.log("Socket.IO server listening on port 4000");
});