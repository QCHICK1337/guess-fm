import { CONFIG } from "./config.js";
import { DOM } from "./dom.js";
import { setVisibility } from "./utils.js";

export function showGameRoundUI() {
  // Clean up old listeners before setting new image
  DOM.albumArt.removeEventListener("load", handleImageLoad);
  DOM.albumArt.removeEventListener("error", handleImageError);

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

export function showResultsUI(currentSong) {
  // Fetch high-resolution album art
  const artworkUrl = currentSong.artworkUrl100.replace(
    CONFIG.ITUNES_API.ARTWORK_SIZE_SMALL,
    CONFIG.ITUNES_API.ARTWORK_SIZE_LARGE
  );

  // Clean up old listeners before setting new image
  DOM.albumArt.removeEventListener("load", handleImageLoad);
  DOM.albumArt.removeEventListener("error", handleImageError);

  DOM.albumArt.src = artworkUrl;

  DOM.songArtistDisplay.textContent = currentSong.artistName;
  DOM.songTitleDisplay.textContent = currentSong.trackName;

  if (DOM.albumArt.complete) {
    setVisibility([DOM.albumArt], "block");
  } else {
    DOM.albumArt.addEventListener("load", handleImageLoad, { once: true });
    DOM.albumArt.addEventListener("error", handleImageError);
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

export function showGameScreens() {
  setVisibility([DOM.gameContainer], "flex");
  setVisibility([DOM.introSection, DOM.searchInput, DOM.searchBtn], "none");
  DOM.scoreboard.classList.remove("is-hidden");
}

export function showSearchScreen() {
  setVisibility([DOM.introSection, DOM.searchInput, DOM.searchBtn], "block");
  setVisibility([DOM.gameContainer, DOM.endGameScreen], "none");
}

export function showEndGameScreen(scoreState) {
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
      DOM.feedbackDisplay,
    ],
    "none"
  );

  // Populate final results
  DOM.finalScore.textContent = Math.round(scoreState.total);
  DOM.finalStreak.textContent = scoreState.bestStreak;
  DOM.finalRounds.textContent = scoreState.rounds;
}

export function populateSongSuggestions(songs) {
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

function handleImageLoad() {
  setVisibility([DOM.albumArt], "block");
}

function handleImageError() {
  setVisibility([DOM.albumArt], "none");
}
