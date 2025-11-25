const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("artist-input");
const gameContainer = document.getElementById("game-container");
const audioPlayer = document.getElementById("audio-player");

let currentSong = null;

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
      const songs = data.results;
      const randomIndex = Math.floor(Math.random() * songs.length);

      currentSong = songs[randomIndex];
      console.log(currentSong);

      audioPlayer.src = currentSong.previewUrl;
      audioPlayer.play();

      gameContainer.style.display = "flex";
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
});
