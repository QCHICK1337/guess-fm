/* ========================================
   CONFIGURATION & CONSTANTS
   ======================================== */

const CONFIG = {
  ITUNES_API: {
    BASE_URL: "https://itunes.apple.com",
    ARTIST_SEARCH_LIMIT: 1,
    SONG_LOOKUP_LIMIT: 200,
    ARTWORK_SIZE_SMALL: "100x100",
    ARTWORK_SIZE_LARGE: "600x600",
  },
  AUDIO_PLAYER: {
    VOLUME: 0.5,
    CONTROLS: ["play", "progress", "current-time", "mute", "volume"],
  },
  CONFETTI: {
    PARTICLE_COUNT: 100,
    SPREAD: 70,
    ORIGIN_Y: 0.6,
  },
  FILTERS: {
    EXCLUDED_KEYWORDS: ["remix", "instrumental"],
  },
  MESSAGES: {
    ARTIST_REQUIRED: "Please enter an artist",
    ARTIST_NOT_FOUND: "Artist not found",
    NO_SONGS_FOUND: "No playable songs found",
    LOAD_ERROR: "Failed to load songs. Please try again.",
    PLAY_AUDIO_HINT: "Click play to start audio",
    GAME_RESET: "All songs played - game restarted",
    EMPTY_GUESS: "Please enter a guess.",
    CORRECT: "Correct!",
    INCORRECT: "Wrong! Try again.",
  },
};

/* ========================================
   DOM CACHE
   ======================================== */

const DOM = {
  // Screen sections
  introSection: document.getElementById("intro-section"),
  gameContainer: document.getElementById("game-container"),

  // Search/Input
  searchInput: document.getElementById("artist-input"),
  searchBtn: document.getElementById("search-btn"),
  statusMsg: document.getElementById("status-msg"),

  // Game display
  artistHeader: document.getElementById("current-artist-header"),
  artistNameDisplay: document.getElementById("artist-name"),
  albumArt: document.getElementById("album-art"),
  songArtistDisplay: document.getElementById("song-artist"),
  songTitleDisplay: document.getElementById("song-title"),
  feedbackDisplay: document.getElementById("feedback-txt"),

  // Game controls & input
  audioPlayer: document.getElementById("audio-player"),
  guessInput: document.getElementById("guess-input"),
  songSuggestions: document.getElementById("song-suggestions"),
  submitBtn: document.getElementById("submit-btn"),
  skipBtn: document.getElementById("skip-btn"),
  nextBtn: document.getElementById("next-btn"),
};

/* ========================================
   APPLICATION STATE
   ======================================== */

const gameState = {
  currentSong: null,
  allSongs: [],
  playHistory: [],

  reset() {
    this.currentSong = null;
    this.allSongs = [];
    this.playHistory = [];
  },
};

/* ========================================
   AUDIO PLAYER INITIALIZATION
   ======================================== */

const audioPlayer = new Plyr(DOM.audioPlayer, {
  controls: CONFIG.AUDIO_PLAYER.CONTROLS,
});

audioPlayer.volume = CONFIG.AUDIO_PLAYER.VOLUME;

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

// Toggle visibility of elements
function setVisibility(elements, displayValue) {
  elements.forEach((element) => {
    element.style.display = displayValue;
  });
}

// Update status message with styling
function updateStatusMessage(message, statusType) {
  // Remove all status classes
  DOM.statusMsg.classList.remove(
    "is-info",
    "is-error",
    "is-success",
    "is-hidden"
  );

  // Hide and clear if empty message
  if (message === "") {
    DOM.statusMsg.classList.add("is-hidden");
    DOM.statusMsg.textContent = "";
    return;
  }

  // Show message with appropriate styling
  DOM.statusMsg.textContent = message;
  if (statusType) {
    DOM.statusMsg.classList.add(`is-${statusType}`);
  }
}

// Normalize strings for comparison (case/accent/punctuation insensitive)
function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // Remove accents
    .replace(/[^\p{L}\p{N}\s]/gu, "") // Keep only letters, numbers, spaces
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

// Reset search button to original state
function resetSearchButton() {
  DOM.searchBtn.disabled = false;
  DOM.searchBtn.innerHTML =
    '<i class="fa-solid fa-magnifying-glass"></i>Search';
}

// Set search button to loading state
function setSearchButtonLoading() {
  DOM.searchBtn.disabled = true;
  DOM.searchBtn.innerHTML = '<i class="fa-solid fa-spinner"></i>Loading...';
}

/* ========================================
   GAME LOGIC
   ======================================== */

// Get a random unplayed song
function getUnplayedSong() {
  // Reset if all songs have been played
  if (gameState.playHistory.length === gameState.allSongs.length) {
    updateStatusMessage(CONFIG.MESSAGES.GAME_RESET, "info");
    gameState.playHistory = [];
  }

  // Pick a random song not yet played
  let randomSong =
    gameState.allSongs[Math.floor(Math.random() * gameState.allSongs.length)];

  // Keep trying until we find an unplayed song
  while (gameState.playHistory.includes(randomSong.trackId)) {
    randomSong =
      gameState.allSongs[Math.floor(Math.random() * gameState.allSongs.length)];
  }

  gameState.playHistory.push(randomSong.trackId);
  return randomSong;
}

// Play the current round's song
function playCurrentRound() {
  audioPlayer.pause();
  gameState.currentSong = getUnplayedSong();
  DOM.audioPlayer.src = gameState.currentSong.previewUrl;

  audioPlayer.play().catch(() => {
    updateStatusMessage(CONFIG.MESSAGES.PLAY_AUDIO_HINT, "info");
  });
}

// Check if guess matches actual song title
function isGuessCorrect(userGuess, actualTitle) {
  return normalizeText(userGuess) === normalizeText(actualTitle);
}

/* ========================================
   UI STATE MANAGEMENT
   ======================================== */

// Show game round UI (input visible, results hidden)
function showGameRoundUI() {
  setVisibility([DOM.guessInput, DOM.submitBtn, DOM.skipBtn], "block");
  setVisibility(
    [DOM.albumArt, DOM.songArtistDisplay, DOM.songTitleDisplay, DOM.nextBtn],
    "none"
  );

  DOM.feedbackDisplay.classList.remove("is-success");
  DOM.feedbackDisplay.textContent = "";
  DOM.guessInput.value = "";
}

// Show results UI (answer and album visible, input hidden)
function showResultsUI() {
  setVisibility(
    [DOM.songArtistDisplay, DOM.albumArt, DOM.songTitleDisplay, DOM.nextBtn],
    "block"
  );
  setVisibility([DOM.guessInput, DOM.submitBtn, DOM.skipBtn], "none");

  // Fetch high-resolution album art
  const artworkUrl = gameState.currentSong.artworkUrl100.replace(
    CONFIG.ITUNES_API.ARTWORK_SIZE_SMALL,
    CONFIG.ITUNES_API.ARTWORK_SIZE_LARGE
  );

  DOM.albumArt.src = artworkUrl;
  DOM.songArtistDisplay.textContent = gameState.currentSong.artistName;
  DOM.songTitleDisplay.textContent = gameState.currentSong.trackName;

  // Celebration effect
  confetti({
    particleCount: CONFIG.CONFETTI.PARTICLE_COUNT,
    spread: CONFIG.CONFETTI.SPREAD,
    origin: { y: CONFIG.CONFETTI.ORIGIN_Y },
  });
}

// Show game interface, hide search screen
function showGameScreens() {
  setVisibility([DOM.gameContainer], "flex");
  setVisibility([DOM.introSection, DOM.searchInput, DOM.searchBtn], "none");
}

// Show search interface, hide game screen
function showSearchScreen() {
  setVisibility([DOM.introSection, DOM.searchInput, DOM.searchBtn], "flex");
  setVisibility([DOM.gameContainer], "none");
}

/* ========================================
   API & DATA FETCHING
   ======================================== */

// Build datalist suggestions from songs
function populateSongSuggestions(songs) {
  DOM.songSuggestions.innerHTML = "";
  const seenTitles = new Set();

  songs.forEach((song) => {
    // Skip duplicate song titles
    if (seenTitles.has(song.trackName)) return;

    seenTitles.add(song.trackName);

    const option = document.createElement("option");
    option.value = song.trackName;
    DOM.songSuggestions.appendChild(option);
  });
}

// Filter out unwanted tracks (remixes, instrumentals, etc.)
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

// Search for artist and load their songs from iTunes API
async function searchAndLoadArtist(artistName) {
  if (artistName.trim() === "") {
    updateStatusMessage(CONFIG.MESSAGES.ARTIST_REQUIRED, "error");
    return;
  }

  setSearchButtonLoading();

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
      updateStatusMessage(CONFIG.MESSAGES.ARTIST_NOT_FOUND, "error");
      resetSearchButton();
      return;
    }

    const artistId = artistData.results[0].artistId;
    DOM.artistNameDisplay.textContent = artistData.results[0].artistName;

    // Fetch all songs by the artist
    const songLookupUrl = `${CONFIG.ITUNES_API.BASE_URL}/lookup?id=${artistId}&entity=song&limit=${CONFIG.ITUNES_API.SONG_LOOKUP_LIMIT}`;
    const songsResponse = await fetch(songLookupUrl);
    const songsData = await songsResponse.json();

    // Filter and validate songs
    gameState.allSongs = filterValidSongs(
      songsData.results,
      DOM.artistNameDisplay.textContent
    );

    if (gameState.allSongs.length === 0) {
      updateStatusMessage(CONFIG.MESSAGES.NO_SONGS_FOUND, "error");
      resetSearchButton();
      return;
    }

    // Step 4: Populate suggestions and show game
    populateSongSuggestions(gameState.allSongs);
    showGameScreens();
    playCurrentRound();
    updateStatusMessage("", "");
  } catch (error) {
    console.error("Error loading artist:", error);
    updateStatusMessage(CONFIG.MESSAGES.LOAD_ERROR, "error");
    resetSearchButton();
  }
}

/* ========================================
   EVENT LISTENERS
   ======================================== */

// Search when button clicked
DOM.searchBtn.addEventListener("click", (event) => {
  event.preventDefault();
  searchAndLoadArtist(DOM.searchInput.value);
});

// Allow Enter key to search
DOM.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    DOM.searchBtn.click();
  }
});

// Submit guess
DOM.submitBtn.addEventListener("click", () => {
  const userGuess = DOM.guessInput.value;

  if (userGuess.trim() === "") {
    DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.EMPTY_GUESS;
    return;
  }

  if (isGuessCorrect(userGuess, gameState.currentSong.trackName)) {
    DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.CORRECT;
    DOM.feedbackDisplay.classList.add("is-success");
    showResultsUI();
  } else {
    DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.INCORRECT;
  }
});

// Move to next round
DOM.nextBtn.addEventListener("click", () => {
  showGameRoundUI();
  playCurrentRound();
});

// Skip current song
DOM.skipBtn.addEventListener("click", () => {
  DOM.feedbackDisplay.textContent = "";
  playCurrentRound();
});
