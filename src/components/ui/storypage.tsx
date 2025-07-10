'use client'
import { prisma } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server'
import React, { useEffect } from 'react'
import { storystore } from './storystore';
import { error } from 'console';
import Image from 'next/image';
interface storytype {
  lateststory:string,
  latestimg:string,
}
function Storycomponent({storyrec}:{storyrec:storytype}) {
  const story = storystore((state) => state.story);
  const setstory = storystore((state) => state.setstory);
  const image = storystore((state) => state.image);
  const setimage = storystore((state) => state.setImage);
  const setloading = storystore((state) => state.setloading);
  const loading = storystore((state) => state.loading);
  const error = storystore((state) => state.error);

  const seterror = storystore((state) => state.setError);
  useEffect(() => {
    setloading(true);
    setstory(storyrec.lateststory);
    setimage(storyrec.latestimg);

    setloading(false);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 px-4 space-y-6 max-w-3xl mx-auto">
      <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <Image
          src={image}
          alt="Story Image"
          width={1200}
          height={600}
          className="w-full h-auto object-cover"
          priority
        />
      </div>
      <div className="w-full bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-lg p-6 overflow-y-auto max-h-[40vh]">
        <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
          {story}
        </p>
      </div>
    </div>
  );
}
  

export default Storycomponent
