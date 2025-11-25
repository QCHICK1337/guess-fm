const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("artist-input");
const gameContainer = document.getElementById("game-container");
const audioPlayer = document.getElementById("audio-player");
const guessInput = document.getElementById("guess-input");
const songSuggestions = document.getElementById("song-suggestions");
const submitBtn = document.getElementById("submit-btn");
const feedbackTxt = document.getElementById("feedback-txt");

let currentSong = null;
let allSongs = [];

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
      const randomIndex = Math.floor(Math.random() * allSongs.length);

      songSuggestions.innerHTML = "";
      allSongs.forEach((song) => {
        const songSuggestionString = document.createElement("option");
        songSuggestionString.value = song.trackName;
        songSuggestions.appendChild(songSuggestionString);
      });

      currentSong = allSongs[randomIndex];

      audioPlayer.src = currentSong.previewUrl;
      audioPlayer.play();

      gameContainer.style.display = "flex";
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
});

submitBtn.addEventListener("click", () => {
  const userGuess = guessInput.value;
  if (
    userGuess.toLowerCase().trim() ===
    currentSong.trackName.toLowerCase().trim()
  ) {
    feedbackTxt.textContent = "Correct!";
  } else {
    feedbackTxt.textContent = "Wrong!";
  }
});
