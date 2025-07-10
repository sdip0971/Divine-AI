import { error } from "console";
import { create } from "zustand";
interface Storystore {
    story : string,
    setstory:(story:string)=>void
    image:string 
    setImage : (image:string)=>void
    loading:boolean,
    setloading:(val:boolean)=>void
    error : string|null,
    setError :(error:string)=>void
}
export const storystore = create<Storystore>((set)=>({
story :'',
image:'',
loading:true,
error:null,
setstory:(story:string)=>set({story}),
setImage:(image:string)=>set({image}),
setloading:(val)=>set({loading:val}),
setError:(error)=>set({error}),

}))