const audioPlayer = document.getElementById("audioPlayer");
const playlistContainer = document.getElementById("playlistContainer");
const addSongBtn = document.getElementById("addSongBtn");
const clearFormBtn = document.getElementById("clearFormBtn");
const songTitleInput = document.getElementById("songTitle");
const songArtistInput = document.getElementById("songArtist");
const songUrlInput = document.getElementById("songUrl");
const songImageInput = document.getElementById("songImage");
const currentTitle = document.getElementById("currentTitle");
const currentArtist = document.getElementById("currentArtist");
const heroImage = document.getElementById("heroImage");
const openSongLink = document.getElementById("openSongLink");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressTrack = document.getElementById("progressTrack");
const progressFill = document.getElementById("progressFill");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const searchInput = document.getElementById("searchInput");
const playlistStats = document.getElementById("playlistStats");

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80";

let playlist = JSON.parse(localStorage.getItem("frost_playlist")) || [];
let currentIndex = -1;

function savePlaylist() {
  localStorage.setItem("frost_playlist", JSON.stringify(playlist));
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

function isAudioUrl(url) {
  return /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(url);
}

function getSafeImage(url) {
  if (!url || !isValidUrl(url)) return DEFAULT_IMAGE;
  return url;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function updateHero(song) {
  if (!song) {
    currentTitle.textContent = "No song selected";
    currentArtist.textContent = "Add audio link and start playlist";
    heroImage.src = DEFAULT_IMAGE;
    openSongLink.href = "#";
    return;
  }

  currentTitle.textContent = song.title || "Untitled Song";
  currentArtist.textContent = song.artist || "Unknown Artist";
  heroImage.src = getSafeImage(song.image);
  openSongLink.href = song.url || "#";
}

function renderPlaylist(filterText = "") {
  playlistContainer.innerHTML = "";

  const filtered = playlist.filter((song) => {
    const text = filterText.toLowerCase();
    return (
      (song.title || "").toLowerCase().includes(text) ||
      (song.artist || "").toLowerCase().includes(text)
    );
  });

  playlistStats.textContent = `${playlist.length} Song${playlist.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    playlistContainer.innerHTML = `
      <div class="empty-box">
        <h3 style="margin-bottom:10px; color:#fff;">No songs found</h3>
        <p>${playlist.length === 0 ? "Abhi playlist empty hai. Song add karo." : "Search ke hisaab se result nahi mila."}</p>
      </div>
    `;
    return;
  }

  filtered.forEach((song) => {
    const originalIndex = playlist.findIndex((item) =>
      item.id === song.id
    );

    const songCard = document.createElement("div");
    songCard.className = `song-item ${originalIndex === currentIndex ? "active" : ""}`;

    songCard.innerHTML = `
      <div class="song-cover">
        <img src="${escapeHtml(getSafeImage(song.image))}" alt="cover" onerror="this.src='${DEFAULT_IMAGE}'">
      </div>

      <div class="song-info">
        <h4>${escapeHtml(song.title || "Untitled Song")}</h4>
        <p>${escapeHtml(song.artist || "Unknown Artist")}</p>
        <div class="song-url-text">${escapeHtml(song.url || "")}</div>
      </div>

      <div class="song-buttons">
        <button class="play-btn" onclick="playSong(${originalIndex})">Play</button>
        <button class="open-btn" onclick="openSongUrl(${originalIndex})">Open</button>
        <button class="delete-btn" onclick="deleteSong(${originalIndex})">Delete</button>
      </div>
    `;

    playlistContainer.appendChild(songCard);
  });
}

function loadSong(index, autoPlay = false) {
  if (index < 0 || index >= playlist.length) return;

  currentIndex = index;
  const song = playlist[index];

  updateHero(song);

  if (isAudioUrl(song.url)) {
    audioPlayer.src = song.url;
  } else {
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
  }

  renderPlaylist(searchInput.value);

  if (autoPlay) {
    if (isAudioUrl(song.url)) {
      audioPlayer.play()
        .then(() => {
          playPauseBtn.textContent = "⏸";
        })
        .catch(() => {
          playPauseBtn.textContent = "▶";
          alert("Ye audio link browser me play nahi ho pa rahi.");
        });
    } else {
      playPauseBtn.textContent = "▶";
      alert("Ye direct audio file link nahi hai. Open button se browser me kholo.");
    }
  } else {
    playPauseBtn.textContent = "▶";
  }
}

function playSong(index) {
  loadSong(index, true);
}

function openSongUrl(index) {
  if (index < 0 || index >= playlist.length) return;
  const url = playlist[index].url || "";
  if (url && isValidUrl(url)) {
    window.open(url, "_blank");
  }
}

function deleteSong(index) {
  if (index < 0 || index >= playlist.length) return;

  const wasCurrent = index === currentIndex;
  playlist.splice(index, 1);
  savePlaylist();

  if (playlist.length === 0) {
    currentIndex = -1;
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    updateHero(null);
    progressFill.style.width = "0%";
    currentTime.textContent = "00:00";
    duration.textContent = "00:00";
    playPauseBtn.textContent = "▶";
    renderPlaylist(searchInput.value);
    return;
  }

  if (wasCurrent) {
    const newIndex = index >= playlist.length ? playlist.length - 1 : index;
    loadSong(newIndex, false);
  } else if (index < currentIndex) {
    currentIndex--;
  }

  renderPlaylist(searchInput.value);
}

function addSong() {
  const title = songTitleInput.value.trim();
  const artist = songArtistInput.value.trim();
  const url = songUrlInput.value.trim();
  const image = songImageInput.value.trim();

  if (!title) {
    alert("Song title daal bhai.");
    songTitleInput.focus();
    return;
  }

  if (!url) {
    alert("Song URL daal bhai.");
    songUrlInput.focus();
    return;
  }

  if (!isValidUrl(url)) {
    alert("Valid URL daal. http ya https wala proper link chahiye.");
    songUrlInput.focus();
    return;
  }

  if (image && !isValidUrl(image)) {
    alert("Image URL valid daal.");
    songImageInput.focus();
    return;
  }

  playlist.push({
    id: Date.now() + Math.floor(Math.random() * 9999),
    title: title,
    artist: artist || "Unknown Artist",
    url: url,
    image: image || DEFAULT_IMAGE
  });

  savePlaylist();
  renderPlaylist(searchInput.value);

  if (currentIndex === -1) {
    loadSong(0, false);
  }

  clearForm();
}

function clearForm() {
  songTitleInput.value = "";
  songArtistInput.value = "";
  songUrlInput.value = "";
  songImageInput.value = "";
}

playPauseBtn.addEventListener("click", () => {
  if (currentIndex === -1) {
    if (playlist.length > 0) {
      loadSong(0, true);
    } else {
      alert("Pehle koi song add karo.");
    }
    return;
  }

  const currentSong = playlist[currentIndex];

  if (!isAudioUrl(currentSong.url)) {
    alert("Ye direct audio link nahi hai. Open button se browser me kholo.");
    return;
  }

  if (audioPlayer.paused) {
    audioPlayer.play()
      .then(() => {
        playPauseBtn.textContent = "⏸";
      })
      .catch(() => {
        alert("Song play nahi ho pa raha.");
      });
  } else {
    audioPlayer.pause();
    playPauseBtn.textContent = "▶";
  }
});

prevBtn.addEventListener("click", () => {
  if (playlist.length === 0) return;
  let prevIndex = currentIndex - 1;
  if (prevIndex < 0) prevIndex = playlist.length - 1;
  loadSong(prevIndex, true);
});

nextBtn.addEventListener("click", () => {
  if (playlist.length === 0) return;
  let nextIndex = currentIndex + 1;
  if (nextIndex >= playlist.length) nextIndex = 0;
  loadSong(nextIndex, true);
});

audioPlayer.addEventListener("timeupdate", () => {
  if (!audioPlayer.duration) return;
  const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressFill.style.width = percent + "%";
  currentTime.textContent = formatTime(audioPlayer.currentTime);
  duration.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener("loadedmetadata", () => {
  duration.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener("ended", () => {
  if (playlist.length === 0) return;
  let nextIndex = currentIndex + 1;
  if (nextIndex >= playlist.length) nextIndex = 0;
  loadSong(nextIndex, true);
});

progressTrack.addEventListener("click", (e) => {
  if (!audioPlayer.duration) return;
  const rect = progressTrack.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = clickX / rect.width;
  audioPlayer.currentTime = percent * audioPlayer.duration;
});

searchInput.addEventListener("input", function () {
  renderPlaylist(this.value);
});

addSongBtn.addEventListener("click", addSong);
clearFormBtn.addEventListener("click", clearForm);

[songTitleInput, songArtistInput, songUrlInput, songImageInput].forEach((input) => {
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      addSong();
    }
  });
});

if (playlist.length > 0) {
  renderPlaylist();
  loadSong(0, false);
} else {
  renderPlaylist();
  updateHero(null);
}

window.playSong = playSong;
window.deleteSong = deleteSong;
window.openSongUrl = openSongUrl;