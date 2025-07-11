
import Storycomponent from "@/components/ui/storypage"
import { prisma } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";
import { SarvamAIClient } from "sarvamai";


export default async function StoryPage() {
  const { userId } = await auth();
  if(!userId){
   redirect('/login')
  }
 
  
   const fetchdb = async()=>{
    const storyfetch = await prisma.story.findMany({
      where:{
        userId
      },
      orderBy:{
        createdAt:'desc'
      }
    })
    const lateststory = storyfetch[0].story
    const latestimg = storyfetch[0].image
    console.log(latestimg)
    return {lateststory,latestimg}
   }
   const story = await fetchdb()
  return (
    <div>
      <Storycomponent storyrec={story} />
    </div>
  )
}


