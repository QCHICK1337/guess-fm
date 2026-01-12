import { CONFIG } from "./config.js";
import { DOM } from "./dom.js";
import { normalizeText, updateStatusMessage } from "./utils.js";

export const gameState = {
  currentSong: null,
  allSongs: [],
  playHistory: [],

  reset() {
    this.currentSong = null;
    this.allSongs = [];
    this.playHistory = [];
  },
};

export const scoreState = {
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

export function startRoundScore(songId) {
  scoreState.roundStartTs = Date.now();
  scoreState.attemptsInRound = 0;
  scoreState.lastResult = null;
  scoreState.currentSongId = songId;
}

export function noteAttempt() {
  scoreState.attemptsInRound++;
}

export function finalizeRoundScore(result) {
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

export function renderScoreboard() {
  DOM.scoreTotal.textContent = Math.round(scoreState.total);
  DOM.scoreStreak.textContent = scoreState.streak;
  DOM.scoreRounds.innerHTML = `<span>${
    scoreState.rounds + 1
  }</span><span class="text-secondary"> / 15</span>`;
}

export function getUnplayedSong() {
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

export function playCurrentRound(audioPlayer) {
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

export function isGuessCorrect(userGuess, actualTitle) {
  return normalizeText(userGuess) === normalizeText(actualTitle);
}
