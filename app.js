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
  GAME: {
    MAX_ROUNDS: 15,
  },
};

/* ========================================
   DOM CACHE
   ======================================== */

const DOM = {
  // Screen sections
  introSection: document.getElementById("intro-section"),
  gameContainer: document.getElementById("game-container"),
  endGameScreen: document.getElementById("end-game-screen"),
  audioContainer: document.querySelector(".audio-container"),

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

  //Scoreboard
  scoreboard: document.getElementById("scoreboard"),
  scoreTotal: document.getElementById("score-total"),
  scoreStreak: document.getElementById("score-streak"),
  scoreRounds: document.getElementById("score-rounds"),

  //Results
  finalScore: document.getElementById("final-score"),
  finalStreak: document.getElementById("final-streak"),
  finalRounds: document.getElementById("final-rounds"),
  newGameBtn: document.getElementById("new-game-btn"),
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

const scoreState = {
  total: 0,
  rounds: 0,
  streak: 0,
  bestStreak: 0,
  roundStartTs: 0,
  attemptsInRound: 0,
  lastResult: null,
  history: [],
  currentSongId: null,
  artistId: null,
};

/* ========================================
   SCORING HELPERS
   ======================================== */

function startRoundScore(songId) {
  scoreState.roundStartTs = Date.now();
  scoreState.attemptsInRound = 0;
  scoreState.lastResult = null;
  scoreState.currentSongId = songId;
}

function noteAttempt() {
  scoreState.attemptsInRound++;
}

function finalizeRoundScore(result) {
  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    return;
  }

  const T = (Date.now() - scoreState.roundStartTs) / 1000;
  const A = scoreState.attemptsInRound;
  const skipPenalty = 30;

  let points;
  if (result === "skip") {
    points = -skipPenalty;
  } else {
    points = Math.max(
      0,
      (100 - 2 * T - 10 * (A - 1)) * (1 + 0.1 * scoreState.streak)
    );
  }

  scoreState.total = Math.max(0, scoreState.total + points);
  scoreState.rounds++;

  if (result === "correct") {
    scoreState.streak++;
    scoreState.bestStreak = Math.max(scoreState.bestStreak, scoreState.streak);
  }

  if (result === "skip") {
    scoreState.streak = 0;
  }

  scoreState.lastResult = result;

  scoreState.history.push({
    songId: scoreState.currentSongId,
    points,
    T,
    A,
    result,
    at: Date.now(),
  });

  renderScoreboard();
  return points;
}

function renderScoreboard() {
  DOM.scoreTotal.textContent = Math.round(scoreState.total);
  DOM.scoreStreak.textContent = scoreState.streak;
  DOM.scoreRounds.textContent = scoreState.rounds + 1 + ` / 15`;
}

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
  if (gameState.allSongs.length === 0) {
    return;
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
  if (!gameState.currentSong) {
    updateStatusMessage(CONFIG.MESSAGES.NO_SONGS_FOUND, "error");
    return;
  }

  DOM.audioPlayer.src = gameState.currentSong.previewUrl;

  startRoundScore(gameState.currentSong.trackId);

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

  DOM.guessInput.focus();
}

// Show results UI (answer and album visible, input hidden)
function showResultsUI() {
  // Fetch high-resolution album art
  const artworkUrl = gameState.currentSong.artworkUrl100.replace(
    CONFIG.ITUNES_API.ARTWORK_SIZE_SMALL,
    CONFIG.ITUNES_API.ARTWORK_SIZE_LARGE
  );

  DOM.albumArt.src = artworkUrl;
  DOM.songArtistDisplay.textContent = gameState.currentSong.artistName;
  DOM.songTitleDisplay.textContent = gameState.currentSong.trackName;

  setVisibility([DOM.albumArt], "none");

  if (DOM.albumArt.complete) {
    setVisibility([DOM.albumArt], "block");
  } else {
    DOM.albumArt.addEventListener(
      "load",
      () => setVisibility([DOM.albumArt], "block"),
      { once: true }
    );
    DOM.albumArt.addEventListener("error", () => {
      setVisibility([DOM.albumArt], "none");
      // TODO: Set fallback message or placeholder here
    });
  }

  setVisibility(
    [DOM.songArtistDisplay, DOM.songTitleDisplay, DOM.nextBtn],
    "block"
  );
  setVisibility([DOM.guessInput, DOM.submitBtn, DOM.skipBtn], "none");

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
  DOM.scoreboard.classList.remove("is-hidden");
}

// Show search interface, hide game screen
function showSearchScreen() {
  setVisibility([DOM.introSection, DOM.searchInput, DOM.searchBtn], "block");
  setVisibility([DOM.gameContainer, DOM.endGameScreen], "none");
}

function showEndGameScreen() {
  audioPlayer.pause();

  setVisibility([DOM.endGameScreen], "block");
  setVisibility(
    [
      DOM.guessInput,
      DOM.submitBtn,
      DOM.skipBtn,
      DOM.nextBtn,
      DOM.audioContainer,
      DOM.artistHeader,
      DOM.scoreboard,
      DOM.statusMsg,
      DOM.albumArt,
      DOM.songArtistDisplay,
      DOM.songTitleDisplay,
    ],
    "none"
  );

  // Populate final results
  DOM.finalScore.textContent = Math.round(scoreState.total);
  DOM.finalStreak.textContent = scoreState.bestStreak;
  DOM.finalRounds.textContent = scoreState.rounds;
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

  gameState.reset();

  // Reset score for new artist
  scoreState.total = 0;
  scoreState.rounds = 0;
  scoreState.streak = 0;
  scoreState.bestStreak = 0;
  scoreState.history = [];
  renderScoreboard();

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
    scoreState.artistId = artistId;
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
    setVisibility(
      [DOM.albumArt, DOM.songArtistDisplay, DOM.songTitleDisplay],
      "none"
    );
    showGameScreens();
    showGameRoundUI();
    setVisibility([DOM.audioContainer, DOM.scoreboard], "flex");
    setVisibility([DOM.artistHeader, DOM.statusMsg], "block");
    updateStatusMessage("", "");
    playCurrentRound();
    DOM.guessInput.focus();
    updateStatusMessage("", "");
    resetSearchButton();
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

DOM.guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    DOM.submitBtn.click();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    getComputedStyle(DOM.nextBtn).display !== "none" &&
    gameState.allSongs.length > 0
  ) {
    DOM.nextBtn.click();
  }
});

// Submit guess
DOM.submitBtn.addEventListener("click", () => {
  if (scoreState.rounds === CONFIG.GAME.MAX_ROUNDS) {
    showEndGameScreen();
    return;
  }

  const userGuess = DOM.guessInput.value;

  if (userGuess.trim() === "") {
    DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.EMPTY_GUESS;
    return;
  }

  noteAttempt();

  if (isGuessCorrect(userGuess, gameState.currentSong.trackName)) {
    const points = finalizeRoundScore("correct");

    // Only show results if game hasn't ended
    if (scoreState.rounds <= CONFIG.GAME.MAX_ROUNDS) {
      DOM.feedbackDisplay.textContent = `${
        CONFIG.MESSAGES.CORRECT
      } +${Math.round(points)} points`;
      DOM.feedbackDisplay.classList.add("is-success");
      showResultsUI();
    }
  } else {
    DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.INCORRECT;
  }
});

// Move to next round
DOM.nextBtn.addEventListener("click", () => {
  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    showEndGameScreen();
  } else {
    showGameRoundUI();
    playCurrentRound();
  }
});

// Skip current song
DOM.skipBtn.addEventListener("click", () => {
  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    showEndGameScreen();
    return;
  }

  DOM.feedbackDisplay.textContent = "";
  finalizeRoundScore("skip");

  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    showEndGameScreen();
  } else {
    playCurrentRound();
  }
});

DOM.newGameBtn.addEventListener("click", () => {
  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    showSearchScreen();
  } else {
    showGameRoundUI();
    playCurrentRound();
  }
});
