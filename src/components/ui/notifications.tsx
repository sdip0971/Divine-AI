"use server"
import { auth } from "@clerk/nextjs/server";
import NotificationComponent from "./NotificationComponent";

async function Notification() {
    const authi = await auth()
    const userId = await authi.userId
    const token = await authi.getToken()
   
    return (
      <div>
        <NotificationComponent />;
      </div>
    );
    
    

   
    }



export default Notification