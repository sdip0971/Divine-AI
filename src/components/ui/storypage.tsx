'use client'
import { prisma } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server'
import React, { ReactEventHandler, startTransition, useEffect,useState } from 'react'
import { storystore } from './storystore';
import { error } from 'console';
import Image from 'next/image';
import { translateText } from '@/app/action/translate';



interface storytype {
  lateststory:string,
  latestimg:string,
}
function Storycomponent({
  storyrec,
}: {
  storyrec: storytype;
}) {
  const [language, setlanguage] = useState<string>("");
  const story = storystore((state) => state.story);
  const setstory = storystore((state) => state.setstory);
  const image = storystore((state) => state.image);
  const setimage = storystore((state) => state.setImage);
  const setloading = storystore((state) => state.setloading);
  const loading = storystore((state) => state.loading);
  const error = storystore((state) => state.error);

  const seterror = storystore((state) => state.setError);
  const [currentLang, setCurrentLang] = useState<translatetype>("en-IN");

  useEffect(() => {
    setloading(true);
    setstory(storyrec.lateststory);
    setimage(storyrec.latestimg);
    setloading(false);
  }, []);


  type translatetype = "hi-IN" | "en-IN";
  const handleTranslate = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    event.preventDefault();
    setloading(true);
    const translateto = event.target.value as translatetype;
    if(translateto===currentLang) return
    startTransition(async () => {
    
      const result = await translateText(story,translateto,currentLang);
      console.log(result)
      const translatedText = result.translated_text
      console.log(translatedText)
      setCurrentLang(translateto)
      setstory(translatedText)
      setloading(false)
    });

    
    // const res = await fetch("http://localhost:5000/translate", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     q: story,
    //     source: "auto",
    //     target: translateto,
    //   }),
    //   headers: { "Content-Type": "application/json" },
    // });

    setloading(false);
  };
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="font-extrabold text-5xl flex justify-center font-hind text-amber-50 text-shadow-2xs">
         Personalized Story of the Day
        </h1>
        <div className="flex justify-end mt-2 bg-transparent">
          <select
            className="bg-transparent font-extrabold text-amber-50 text-shadow-2xs border border-border rounded-md px-3 py-1 text-sm"
            onChange={(e) => handleTranslate(e)}
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">Hindi</option>
          </select>
        </div>
        <div className="flex flex-col border-rounded  bg-opacity-10  backdrop-blur-sm items-center py-8 px-4 space-y-6 max-w-3xl mx-auto">
          <div className="w-full   rounded-2xl shadow-xl ">
            {image ?  <Image
              src={image}
              alt="Story Image"
              width={1200}
              height={600}
              className="w-full h-auto object-cover"
              priority
            /> : ""}
          </div>
          <div className="w-full bg-opacity-90  rounded-2xl shadow-lg p-2 overflow-y-auto max-h-[40vh]">
            <div className="text-white-800 font-hind text-shadow-lg  leading-relaxed text-lg whitespace-pre-wrap">
              {story ? story :"No Story Available"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
  

export default Storycomponent
