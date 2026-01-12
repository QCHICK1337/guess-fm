import { CONFIG } from "./config.js";
import { normalizeText } from "./utils.js";

export async function searchAndLoadArtist(artistName) {
  if (artistName.trim() === "") {
    throw new Error(CONFIG.MESSAGES.ARTIST_REQUIRED);
  }

  try {
    // Search for the artist
    const artistSearchUrl = `${
      CONFIG.ITUNES_API.BASE_URL
    }/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=${
      CONFIG.ITUNES_API.ARTIST_SEARCH_LIMIT
    }`;

    const artistResponse = await fetch(artistSearchUrl);
    const artistData = await artistResponse.json();

    if (artistData.results.length === 0) {
      throw new Error(CONFIG.MESSAGES.ARTIST_NOT_FOUND);
    }

    const artist = artistData.results[0];

    // Fetch all songs by the artist
    const songLookupUrl = `${CONFIG.ITUNES_API.BASE_URL}/lookup?id=${artist.artistId}&entity=song&limit=${CONFIG.ITUNES_API.SONG_LOOKUP_LIMIT}`;
    const songsResponse = await fetch(songLookupUrl);
    const songsData = await songsResponse.json();

    // Filter and validate songs
    const songs = filterValidSongs(songsData.results, artist.artistName);

    if (songs.length === 0) {
      throw new Error(CONFIG.MESSAGES.NO_SONGS_FOUND);
    }

    return {
      artistId: artist.artistId,
      artistName: artist.artistName,
      songs,
    };
  } catch (error) {
    if (
      error.message.includes(CONFIG.MESSAGES.ARTIST_REQUIRED) ||
      error.message.includes(CONFIG.MESSAGES.ARTIST_NOT_FOUND) ||
      error.message.includes(CONFIG.MESSAGES.NO_SONGS_FOUND)
    ) {
      throw error;
    }
    throw new Error(CONFIG.MESSAGES.LOAD_ERROR);
  }
}

function filterValidSongs(allTracks, artistName) {
  const normalizedArtistName = normalizeText(artistName);

  return allTracks.filter((track) => {
    // Must be a track and have preview URL
    if (track.wrapperType !== "track" || !track.previewUrl) return false;

    const normalizedTrackName = normalizeText(track.trackName);

    // Exclude remixes, instrumentals, and tracks that are artist's name
    for (const keyword of CONFIG.FILTERS.EXCLUDED_KEYWORDS) {
      if (normalizedTrackName.includes(keyword)) return false;
    }
    if (normalizedTrackName.includes(normalizedArtistName)) return false;

    return true;
  });
}
