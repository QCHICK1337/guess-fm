/* ========================================
   IMPORTS
   ======================================== */

import { CONFIG } from "./config.js";
import { DOM } from "./dom.js";
import {
  gameState,
  scoreState,
  noteAttempt,
  finalizeRoundScore,
  renderScoreboard,
  playCurrentRound,
  isGuessCorrect,
} from "./game.js";
import {
  updateStatusMessage,
  resetSearchButton,
  setSearchButtonLoading,
  setVisibility,
  showPointsUpdate,
} from "./utils.js";
import { searchAndLoadArtist } from "./api.js";
import {
  showGameScreens,
  showGameRoundUI,
  showResultsUI,
  showSearchScreen,
  showEndGameScreen,
  showConfetti,
  populateSongSuggestions,
} from "./ui.js";

/* ========================================
   AUDIO PLAYER INITIALIZATION
   ======================================== */

const audioPlayer = new Plyr(DOM.audioPlayer, {
  controls: CONFIG.AUDIO_PLAYER.CONTROLS,
});

audioPlayer.volume = CONFIG.AUDIO_PLAYER.VOLUME;

/* ========================================
   GAME INITIALIZATION
   ======================================== */

async function loadArtistAndStartGame(artistName) {
  gameState.reset();
  scoreState.reset();
  renderScoreboard();

  setSearchButtonLoading();

  try {
    const result = await searchAndLoadArtist(artistName);

    scoreState.artistId = result.artistId;
    DOM.artistNameDisplay.textContent = result.artistName;
    gameState.allSongs = result.songs;

    scoreState.maxRounds = Math.min(
      result.songs.length,
      CONFIG.GAME.MAX_ROUNDS,
    );

    populateSongSuggestions(gameState.allSongs);
    setVisibility(
      [DOM.albumArt, DOM.songArtistDisplay, DOM.songTitleDisplay],
      "none",
    );
    showGameScreens();
    showGameRoundUI();
    setVisibility([DOM.audioContainer, DOM.scoreboard], "flex");
    setVisibility([DOM.artistHeader, DOM.statusMsg], "block");
    updateStatusMessage("", "");
    playCurrentRound(audioPlayer);
    DOM.guessInput.focus();
    resetSearchButton();
  } catch (error) {
    console.error("Error loading artist:", error);
    updateStatusMessage(error.message, "error");
    resetSearchButton();
  }
}

/* ========================================
   EVENT LISTENERS
   ======================================== */

DOM.helpBtn.addEventListener("click", () => {
  DOM.helpModal.classList.add("is-open");
  DOM.helpModal.setAttribute("aria-hidden", "false");
});

DOM.modalCloseBtn.addEventListener("click", () => {
  DOM.helpModal.classList.remove("is-open");
  DOM.helpModal.setAttribute("aria-hidden", "true");
});

DOM.helpModal.addEventListener("click", (event) => {
  if (event.target === DOM.helpModal) {
    DOM.helpModal.classList.remove("is-open");
    DOM.helpModal.setAttribute("aria-hidden", "true");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && DOM.helpModal.classList.contains("is-open")) {
    DOM.helpModal.classList.remove("is-open");
    DOM.helpModal.setAttribute("aria-hidden", "true");
  }
});

// Search when button clicked
DOM.searchBtn.addEventListener("click", (event) => {
  event.preventDefault();
  loadArtistAndStartGame(DOM.searchInput.value);
});

// Allow Enter key to search
DOM.searchInput.addEventListener("keydown", (event) => {
  if (DOM.helpModal.classList.contains("is-open")) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    DOM.searchBtn.click();
  }
});

DOM.guessInput.addEventListener("keydown", (event) => {
  if (DOM.helpModal.classList.contains("is-open")) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    DOM.submitBtn.click();
  }
});

document.addEventListener("keydown", (event) => {
  if (DOM.helpModal.classList.contains("is-open")) {
    return;
  }

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
  if (scoreState.rounds > scoreState.maxRounds) {
    audioPlayer.pause();
    showEndGameScreen(scoreState);
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
    if (scoreState.rounds <= scoreState.maxRounds) {
      showPointsUpdate(Math.round(points));
      DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.CORRECT;
      DOM.feedbackDisplay.classList.add("is-success");
      showConfetti();
      showResultsUI(gameState.currentSong);
    }
  } else {
    DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.INCORRECT;
  }
});

// Move to next round
DOM.nextBtn.addEventListener("click", () => {
  if (scoreState.rounds >= scoreState.maxRounds) {
    audioPlayer.pause();
    showEndGameScreen(scoreState);
  } else {
    showGameRoundUI();
    playCurrentRound(audioPlayer);
  }
});

// Skip current song
DOM.skipBtn.addEventListener("click", () => {
  if (scoreState.rounds >= scoreState.maxRounds) {
    audioPlayer.pause();
    showEndGameScreen(scoreState);
    return;
  }

  DOM.feedbackDisplay.textContent = "";
  const points = finalizeRoundScore("skip");
  showPointsUpdate(Math.round(points));

  if (scoreState.rounds >= scoreState.maxRounds) {
    audioPlayer.pause();
    showEndGameScreen(scoreState);
  } else {
    DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.SONG_REVEAL;
    DOM.feedbackDisplay.classList.add("is-info");
    showResultsUI(gameState.currentSong);
  }
});

DOM.newGameBtn.addEventListener("click", () => {
  if (scoreState.rounds >= scoreState.maxRounds) {
    showSearchScreen();
  } else {
    showGameRoundUI();
    playCurrentRound(audioPlayer);
  }
});
