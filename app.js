const introSection = document.getElementById("intro-section");
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("artist-input");
const gameContainer = document.getElementById("game-container");
const artistHeader = document.getElementById("current-artist-header");
const audioPlayer = document.getElementById("audio-player");
const guessInput = document.getElementById("guess-input");
const songSuggestions = document.getElementById("song-suggestions");
const submitBtn = document.getElementById("submit-btn");
const feedbackTxt = document.getElementById("feedback-txt");
const albumArt = document.getElementById("album-art");
const songArtistTxt = document.getElementById("song-artist");
const songTitleTxt = document.getElementById("song-title");
const nextBtn = document.getElementById("next-btn");

let currentSong = null;
let allSongs = [];

audioPlayer.volume = 0.5;

function playRandomSong() {
  audioPlayer.pause();

  const randomIndex = Math.floor(Math.random() * allSongs.length);
  currentSong = allSongs[randomIndex];

  audioPlayer.src = currentSong.previewUrl;
  audioPlayer.play();
}

function setupRoundUi() {
  albumArt.style.display = "none";
  songArtistTxt.style.display = "none";
  songTitleTxt.style.display = "none";
  nextBtn.style.display = "none";

  guessInput.style.display = "block";
  submitBtn.style.display = "block";

  feedbackTxt.textContent = "";
  guessInput.value = "";
}

function setupWinUi() {
  albumArt.src = currentSong.artworkUrl100.replace("100x100", "600x600");
  songArtistTxt.textContent = currentSong.artistName;
  songTitleTxt.textContent = currentSong.trackName;

  guessInput.style.display = "none";
  submitBtn.style.display = "none";

  songArtistTxt.style.display = "block";
  albumArt.style.display = "block";
  songTitleTxt.style.display = "block";
  nextBtn.style.display = "block";
}

searchBtn.addEventListener("click", () => {
  const artistName = searchInput.value;

  if (artistName === "") {
    alert("Please enter an artist");
    return;
  }

  const url = `https://itunes.apple.com/search?term=${artistName}&media=music&entity=song&limit=25`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      allSongs = data.results.filter((song) => {
        return song.artistName.toLowerCase().includes(artistName.toLowerCase());
      });

      if (allSongs.length === 0) {
        alert("No songs found for that artist!");
        return;
      }

      const bestMatch = allSongs.reduce((shortestSoFar, current) => {
        if (shortestSoFar.artistName.length > current.artistName.length) {
          return current;
        } else {
          return shortestSoFar;
        }
      });

      artistHeader.textContent = bestMatch.artistName;
      songSuggestions.innerHTML = "";

      allSongs.forEach((song) => {
        const songSuggestionOption = document.createElement("option");
        songSuggestionOption.value = song.trackName;
        songSuggestions.appendChild(songSuggestionOption);
      });

      playRandomSong();

      introSection.style.display = "none";
      searchInput.style.display = "none";
      searchBtn.style.display = "none";
      gameContainer.style.display = "flex";
      guessInput.focus();
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      alert("Error fetching data:" + error);
    });
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchBtn.click();
  }
});

submitBtn.addEventListener("click", () => {
  const userGuess = guessInput.value;

  if (
    userGuess.toLowerCase().trim() ===
    currentSong.trackName.toLowerCase().trim()
  ) {
    feedbackTxt.textContent = "Correct!";
    setupWinUi();
  } else {
    feedbackTxt.textContent = "Wrong! Try again.";
  }
});

nextBtn.addEventListener("click", () => {
  setupRoundUi();
  playRandomSong();
});
