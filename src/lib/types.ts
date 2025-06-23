
   export type Message ={
        id :String,
        content: String
        role: "user"|"assistant"|"system",
        chat:Chats,
        chatid:String
        createdAt:Date
    }
   export type Chats = {
        id:String ,
        createdAt:Date,
        messages :Message[],
        UserID :String,
        title:String
    }
