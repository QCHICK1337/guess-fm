// DOM ELEMENTS

const introSection = document.getElementById("intro-section");
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("artist-input");
const statusMsg = document.getElementById("status-msg");
const gameContainer = document.getElementById("game-container");
const artistHeader = document.getElementById("current-artist-header");
const artistNameTxt = document.getElementById("artist-name");
const audioPlayer = document.getElementById("audio-player");
const guessInput = document.getElementById("guess-input");
const songSuggestions = document.getElementById("song-suggestions");
const submitBtn = document.getElementById("submit-btn");
const skipBtn = document.getElementById("skip-btn");
const feedbackTxt = document.getElementById("feedback-txt");
const albumArt = document.getElementById("album-art");
const songArtistTxt = document.getElementById("song-artist");
const songTitleTxt = document.getElementById("song-title");
const nextBtn = document.getElementById("next-btn");
const searchIcon = document.getElementById("search-icon");

// STATE VARIABLES

let currentSong = null;
let allSongs = [];
let playHistory = [];

// PLYR SETUP

const player = new Plyr(audioPlayer, {
  controls: ["play", "progress", "current-time", "mute", "volume"],
});

player.volume = 0.5;

// UTILITY FUNCTIONS

// Sets the display property for an array of elements
function setDisplay(elements, displayValue) {
  elements.forEach((element) => {
    element.style.display = displayValue;
  });
}

// Updates status message with optional styling
function setStatus(message, type) {
  statusMsg.classList.remove("is-info", "is-error", "is-success", "is-hidden");

  if (message === "") {
    statusMsg.textContent = "";
    statusMsg.classList.add("is-hidden");
    return;
  }

  statusMsg.textContent = message;
  statusMsg.classList.add(`is-${type}`);
}

// Normalizes strings for comparison
function normalize(value) {
  if (value === null || value === undefined) return "";
  const safe = String(value);
  return safe
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// GAME LOGIC FUNCTIONS

// Returns a random song that hasn't been played yet
function getUnplayedSong() {
  if (playHistory.length === allSongs.length) {
    setStatus("All songs played - game restarted", "info");
    playHistory = [];
  }

  let randomIndex = Math.floor(Math.random() * allSongs.length);
  let pick = allSongs[randomIndex];

  while (playHistory.includes(pick.trackId)) {
    randomIndex = Math.floor(Math.random() * allSongs.length);
    pick = allSongs[randomIndex];
  }

  playHistory.push(pick.trackId);

  return pick;
}

// Plays a random unplayed song
function playRandomSong() {
  player.pause();

  currentSong = getUnplayedSong();
  audioPlayer.src = currentSong.previewUrl;

  player.play().catch(() => {
    setStatus("Click play to start audio", "info");
  });
}

// UI SETUP FUNCTIONS

// Resets UI for a new round
function setupRoundUi() {
  setDisplay([guessInput, submitBtn, skipBtn], "block");
  setDisplay([albumArt, songArtistTxt, songTitleTxt, nextBtn], "none");

  feedbackTxt.classList.remove("is-success");
  feedbackTxt.textContent = "";
  guessInput.value = "";
}

// Displays the correct answer and album info
function setupWinUi() {
  setDisplay([songArtistTxt, albumArt, songTitleTxt, nextBtn], "block");
  setDisplay([guessInput, submitBtn, skipBtn], "none");

  albumArt.src = currentSong.artworkUrl100.replace("100x100", "600x600");
  songArtistTxt.textContent = currentSong.artistName;
  songTitleTxt.textContent = currentSong.trackName;

  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

// EVENT LISTENERS

// Search button: fetch artist and populate game with their songs
searchBtn.addEventListener("click", (event) => {
  event.preventDefault();

  const artistName = searchInput.value;

  if (artistName === "") {
    setStatus("Please enter an artist", "error");
    return;
  }

  searchBtn.disabled = true;
  searchBtn.innerHTML = '<i class="fa-solid fa-spinner"></i>Loading...';

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    artistName
  )}&entity=musicArtist&limit=1`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.results.length === 0) {
        setStatus("Artist not found", "error");
        searchBtn.disabled = false;
        searchBtn.innerHTML =
          '<i class="fa-solid fa-magnifying-glass"></i>Search';
        return;
      }
      const artistId = data.results[0].artistId;
      artistNameTxt.textContent = data.results[0].artistName;

      const songLookupUrl = `https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=200`;
      return fetch(songLookupUrl).then((res) => res.json());
    })
    .then((songData) => {
      const normArtist = normalize(artistHeader.textContent);
      allSongs = songData.results.filter((item) => {
        const normTitle = normalize(item.trackName);

        if (item.wrapperType !== "track" || !item.previewUrl) {
          return false;
        }

        if (
          normTitle.includes("remix") ||
          normTitle.includes("instrumental") ||
          normTitle.includes(normArtist)
        ) {
          return false;
        }

        return true;
      });

      if (allSongs.length === 0) {
        setStatus("No playable songs found", "error");
        searchBtn.disabled = false;
        searchBtn.innerHTML =
          '<i class="fa-solid fa-magnifying-glass"></i>Search';
        return;
      }

      songSuggestions.innerHTML = "";

      const seenTitles = new Set();

      allSongs.forEach((song) => {
        if (seenTitles.has(song.trackName)) {
          return;
        }

        seenTitles.add(song.trackName);

        const option = document.createElement("option");
        option.value = song.trackName;

        songSuggestions.appendChild(option);
      });

      setDisplay([gameContainer], "flex");
      setDisplay([introSection, searchInput, searchBtn], "none");

      searchBtn.disabled = false;
      searchBtn.innerHTML =
        '<i class="fa-solid fa-magnifying-glass"></i>Search';

      playRandomSong();
      setStatus("", "");
    })
    .catch((error) => {
      console.error(error);
      searchBtn.disabled = false;
      searchBtn.innerHTML =
        '<i class="fa-solid fa-magnifying-glass"></i>Search';
    });
});

// Allow Enter key to trigger search
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchBtn.click();
  }
});

// Submit button: check user's guess against current song
submitBtn.addEventListener("click", () => {
  const userGuess = guessInput.value;

  if (userGuess.trim() === "") {
    feedbackTxt.textContent = "Please enter a guess.";
    return;
  }

  if (
    userGuess.toLowerCase().trim() ===
    currentSong.trackName.toLowerCase().trim()
  ) {
    feedbackTxt.textContent = "Correct!";
    feedbackTxt.classList.add("is-success");
    setupWinUi();
  } else {
    feedbackTxt.textContent = "Wrong! Try again.";
  }
});

// Next button: move to the next round
nextBtn.addEventListener("click", () => {
  setupRoundUi();
  playRandomSong();
});

// Skip button: skip to the next song without guessing
skipBtn.addEventListener("click", () => {
  feedbackTxt.textContent = "";
  playRandomSong();
});
