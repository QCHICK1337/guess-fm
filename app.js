const introSection = document.getElementById("intro-section");
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("artist-input");
const gameContainer = document.getElementById("game-container");
const artistHeader = document.getElementById("current-artist-header");
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
  setDisplay([guessInput, submitBtn, skipBtn], "block");
  setDisplay([albumArt, songArtistTxt, songTitleTxt, nextBtn], "none");

  feedbackTxt.textContent = "";
  guessInput.value = "";
}

function setupWinUi() {
  setDisplay([songArtistTxt, albumArt, songTitleTxt, nextBtn], "block");
  setDisplay([guessInput, submitBtn, skipBtn], "none");

  albumArt.src = currentSong.artworkUrl100.replace("100x100", "600x600");
  songArtistTxt.textContent = currentSong.artistName;
  songTitleTxt.textContent = currentSong.trackName;
}

function setDisplay(elements, displayValue) {
  elements.forEach((element) => {
    element.style.display = displayValue;
  });
}

searchBtn.addEventListener("click", () => {
  const artistName = searchInput.value;

  if (artistName === "") {
    alert("Please enter an artist");
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
        alert("Artist not found!");
        return;
      }
      const artistId = data.results[0].artistId;
      artistHeader.textContent = data.results[0].artistName;

      const songLookupUrl = `https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=200`;
      return fetch(songLookupUrl).then((res) => res.json());
    })
    .then((songData) => {
      allSongs = songData.results.filter((item) => {
        return item.wrapperType === "track" && item.previewUrl;
      });

      if (allSongs.length === 0) {
        alert("No playable songs found!");
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
    })
    .catch((error) => console.error(error));
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

skipBtn.addEventListener("click", () => {
  feedbackTxt.textContent = "";
  playRandomSong();
});
