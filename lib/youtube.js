export async function fetchTravelVideos(destinationName) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ No YouTube API Key found. Skipping video fetch.");
    return [];
  }

  try {
    const query = `${destinationName} travel guide 4k vlog`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) {
      console.error("YouTube API Error:", data);
      return [];
    }

    // Extract just the Video IDs
    return data.items.map(item => item.id.videoId);
  } catch (error) {
    console.error("Failed to fetch YouTube videos:", error);
    return [];
  }
}