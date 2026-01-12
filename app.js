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
} from "./utils.js";
import { searchAndLoadArtist } from "./api.js";
import {
  showGameScreens,
  showGameRoundUI,
  showResultsUI,
  showSearchScreen,
  showEndGameScreen,
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

  // Reset score for new artist
  scoreState.total = 0;
  scoreState.rounds = 0;
  scoreState.streak = 0;
  scoreState.bestStreak = 0;
  scoreState.history = [];
  renderScoreboard();

  setSearchButtonLoading();

  try {
    const result = await searchAndLoadArtist(artistName);

    scoreState.artistId = result.artistId;
    DOM.artistNameDisplay.textContent = result.artistName;
    gameState.allSongs = result.songs;

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
    playCurrentRound(audioPlayer);
    DOM.guessInput.focus();
    updateStatusMessage("", "");
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

// Search when button clicked
DOM.searchBtn.addEventListener("click", (event) => {
  event.preventDefault();
  loadArtistAndStartGame(DOM.searchInput.value);
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
    if (scoreState.rounds <= CONFIG.GAME.MAX_ROUNDS) {
      DOM.feedbackDisplay.textContent = `${
        CONFIG.MESSAGES.CORRECT
      } +${Math.round(points)} points`;
      DOM.feedbackDisplay.classList.add("is-success");
      showResultsUI(gameState.currentSong);
    }
  } else {
    DOM.feedbackDisplay.textContent = CONFIG.MESSAGES.INCORRECT;
  }
});

// Move to next round
DOM.nextBtn.addEventListener("click", () => {
  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    audioPlayer.pause();
    showEndGameScreen(scoreState);
  } else {
    showGameRoundUI();
    playCurrentRound(audioPlayer);
  }
});

// Skip current song
DOM.skipBtn.addEventListener("click", () => {
  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    audioPlayer.pause();
    showEndGameScreen(scoreState);
    return;
  }

  DOM.feedbackDisplay.textContent = "";
  finalizeRoundScore("skip");

  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    audioPlayer.pause();
    showEndGameScreen(scoreState);
  } else {
    playCurrentRound(audioPlayer);
  }
});

DOM.newGameBtn.addEventListener("click", () => {
  if (scoreState.rounds >= CONFIG.GAME.MAX_ROUNDS) {
    showSearchScreen();
  } else {
    showGameRoundUI();
    playCurrentRound(audioPlayer);
  }
});
