const introSection = document.getElementById("intro-section");
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("artist-input");
const gameContainer = document.getElementById("game-container");
const audioPlayer = document.getElementById("audio-player");
const guessInput = document.getElementById("guess-input");
const songSuggestions = document.getElementById("song-suggestions");
const submitBtn = document.getElementById("submit-btn");
const feedbackTxt = document.getElementById("feedback-txt");
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
      allSongs = data.results;

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
      alert("Error fetching data:", error);
    });
});

submitBtn.addEventListener("click", () => {
  const userGuess = guessInput.value;
  if (
    userGuess.toLowerCase().trim() ===
    currentSong.trackName.toLowerCase().trim()
  ) {
    feedbackTxt.textContent = "Correct!";
    nextBtn.style.display = "block";
  } else {
    feedbackTxt.textContent = "Wrong!";
  }
});

nextBtn.addEventListener("click", () => {
  playRandomSong();
  nextBtn.style.display = "none";
  feedbackTxt.textContent = "";
  guessInput.value = "";
});
