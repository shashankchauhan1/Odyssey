import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

  try {
    // Call YouTube API from the SERVER (Safe!)
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query + ' travel vlog 4k')}&type=video&key=${apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) {
      return NextResponse.json({ videos: [] });
    }

    // Extract just the IDs
    const videoIds = data.items.map(item => item.id.videoId);
    
    return NextResponse.json({ videos: videoIds });
  } catch (error) {
    return NextResponse.json({ error: 'YouTube Fetch Failed' }, { status: 500 });
  }
}