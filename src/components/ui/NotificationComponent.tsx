"use client"
import { DndContext } from "@dnd-kit/core";


import { useAuth } from '@clerk/nextjs';
import { Bell, Music, Play, ExternalLink } from 'lucide-react';
import React, { useEffect,useRef, useState } from 'react'
import { io as ws, Socket } from "socket.io-client"; 
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

interface RecommendationData {
  type: "ContentDone";
  timestamp: string;
  payload: {
    success: boolean;
    jobId: string;
    userId: string;
    chatid: string;
    data?: {
      searchQuery: string;
      totalResults: number;
      platforms: {
        spotify: { count: number; results: any[] };
        youtube: { count: number; results: any[] };
      };
      results: any[];
    };
    error?: string;
  };
}
function NotificationComponent() {
  const [recommendations, setRecommendations] = useState<
    RecommendationData[]
  >([]);
  const { userId, getToken, isLoaded } = useAuth();


  const socketref = useRef<Socket|null>(null)
  useEffect(()=>{
    const token = getToken();
      if (!userId || !token) return;

      const setupSocket = async () => {
     

        const socket = ws("http://localhost:4000",{});
        socketref.current = socket;

        socket.on("connect", () => {
          console.log("Connected to socket server");
          socket.emit("subscribeToRecommendations", { userId });
        });

        socket.on("recommendations", (data: RecommendationData) => {
          console.log("Recommendation received:", data);
          setRecommendations((prev) => [data, ...prev].slice(0, 5));
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
        });
      };

      setupSocket();

      return () => {
        if (socketref.current) {
          socketref.current.disconnect();
        }
      };
  },[userId])
  if(!userId || !isLoaded){
    <div>Loading</div>
  }
  const clearAll = () => setRecommendations([])
  return (

      <div draggable className="mt-20  h-auto w-auto ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            draggable
            className="ml-4 p-2  hover:bg-gray-100 rounded-full bg-white "
          >
            <Bell className="h-5 w-5 " />
            {recommendations.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {recommendations.length > 9 ? "9+" : recommendations.length}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="font-semibold">🎵 Content Recommendations</h3>
              {recommendations.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              )}
            </div>

            {recommendations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No new recommendations</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="border-b last:border-b-0">
                    {rec.payload.success ? (
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">
                            Found Something You might like
                          </p>
                          <span className="text-xs text-gray-500">
                            {new Date(rec.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                            {/* YouTube Results */}
                        {rec?.payload.data!.platforms?.youtube?.results
                          ?.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-red-600 mb-1">
                              YouTube (
                              {rec.payload.data!.platforms.youtube.count})
                            </h4>
                            {rec.payload
                              .data!.platforms.youtube.results.slice(0, 2)
                              .map((video, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 mb-2 p-2 bg-gray-50 rounded"
                                >
                                  {video.thumbnail && (
                                    <img
                                      src={video.thumbnail}
                                      alt={video.title}
                                      className="w-16 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium line-clamp-2 mb-1">
                                      {video.title}
                                    </p>
                                    <p className="text-xs text-gray-600 mb-1">
                                      {video.extra?.channelTitle}
                                    </p>
                                    <a
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                                    >
                                      <Play className="h-3 w-3" />
                                      Watch
                                    </a>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        {rec?.payload?.data!.platforms?.spotify?.results
                          ?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-green-600 mb-1">
                              Spotify (
                              {rec.payload.data!.platforms.spotify.count})
                            </h4>
                            {rec.payload
                              .data!.platforms?.spotify?.results?.slice(0, 2)
                              .map((track, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 mb-2 p-2 bg-gray-50 rounded"
                                >
                                  {track.thumbnail && (
                                    <img
                                      src={track.thumbnail}
                                      alt={track.title}
                                      className="w-16 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium line-clamp-2 mb-1">
                                      {track.title}
                                    </p>
                                    <p className="text-xs text-gray-600 mb-1">
                                      {track.extra?.publisher ||
                                        track.extra?.type}
                                    </p>
                                    <a
                                      href={track.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Listen
                                    </a>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      undefined
                    )}
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

  );
}

export default NotificationComponent
