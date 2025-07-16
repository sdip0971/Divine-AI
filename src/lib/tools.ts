import { google } from "googleapis";
const youtube = google.youtube({
  version: "v3",
  auth: process.env.Youtube_API_KEY,
});
import "dotenv/config";
import { platform } from "os";
import { UnifiedResult } from "./worker";
const CLIENT_ID = process.env.Spotify_ClientId;
const ClIENT_SECRET= process.env.Spotify_ClientSecret

export async function searchytb(q: string) {
    const resp = await youtube.search.list({
      part: ["id", "snippet"],
      q: q,
      type: ["video"], 
      maxResults: 10, 
      order: "relevance",
    });
    //@ts-ignore
 if(!resp){
    return 
 }
 const items = resp.data?.items ?? []; 
 const videos: UnifiedResult[] = items.map(item => ({
    platform: "youtube",
    id: item.id?.videoId!,                 
    title: item.snippet?.title!,
    description: item.snippet?.description!,
    thumbnail: item?.snippet?.thumbnails?.high?.url,
    url: `https://youtu.be/${item?.id?.videoId!}`, 
    extra: {
      channelTitle: item?.snippet?.channelTitle!,
      publishedAt: item?.snippet?.publishedAt!,
    },
  }));



  return videos?.slice(0,3)
}
export async function searchspotify(q: string) {

   async function getSpotifyAccessToken() {
     const res = await fetch("https://accounts.spotify.com/api/token", {
       method: "POST",
       headers: {
         Authorization:
           "Basic " +
           Buffer.from(`${CLIENT_ID}:${ClIENT_SECRET}`).toString("base64"),
         "Content-Type": "application/x-www-form-urlencoded",
       },
       body: "grant_type=client_credentials",
     });

     const data = await res.json();
     return data.access_token;
   }
   const access_token=await getSpotifyAccessToken()
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        q
      )}&type=show,episode&market=US&limit=3`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    const data = await res.json(); 
  
    function normalizeSpotify(data: any): UnifiedResult[] {
      const shows = data.shows?.items ?? [];
      const episodes = data.episodes?.items ?? [];
      return [
        ...shows.map((s: any) => ({
          platform: "spotify",
          id: s.id,
          title: s.name,
          description: s.description,
          thumbnail: s.images?.[0]?.url,
          url: s.external_urls.spotify,
          extra: {
            type: "show",
            publisher: s.publisher,
            totalEpisodes: s.total_episodes,
          },
        })),
        ...episodes.map((e: any) => ({
          platform: "spotify",
          id: e.id,
          title: e.name,
          description: e.description,
          thumbnail: e.images?.[0]?.url,
          url: e.external_urls.spotify,
          extra: { type: "episode", release_date: e.release_date },
        })),
      ];
    };
    const normalizeddata= normalizeSpotify(data)
 

    return normalizeddata.slice(0,2);
}
 