// 1. IMPORT FIREBASE SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ⚠️ GANTI KOD DI BAWAH DENGAN FIREBASECONFIG KAU SENDIRI DARI STEP 1:
const firebaseConfig = {
  apiKey: "PASTE_API_KEY_KAU_KAT_SINI",
  authDomain: "PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "NUMBER",
  appId: "APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// STATE MANAGEMENT
let currentUser = localStorage.getItem('event_user') || null;
let activeImageId = null;

const loginPage = document.getElementById('loginPage');
const galleryPage = document.getElementById('galleryPage');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const displayUsername = document.getElementById('displayUsername');
const adminBadge = document.getElementById('adminBadge');
const adminUsersBtn = document.getElementById('adminUsersBtn');
const logoutBtn = document.getElementById('logoutBtn');

function checkAuth() {
  if (currentUser) {
    loginPage.classList.remove('active-page');
    galleryPage.classList.add('active-page');
    displayUsername.innerText = currentUser;

    if (currentUser.toLowerCase() === 'ginka') {
      adminBadge.style.display = 'inline-block';
      adminUsersBtn.style.display = 'inline-block';
    } else {
      adminBadge.style.display = 'none';
      adminUsersBtn.style.display = 'none';
    }
  } else {
    loginPage.classList.add('active-page');
    galleryPage.classList.remove('active-page');
  }
}

// LOGIN & REGISTER USER TO DATABASE
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (username) {
    currentUser = username;
    localStorage.setItem('event_user', currentUser);
    
    // Save to Firebase Realtime DB
    set(ref(db, 'users/' + username.replace(/[^a-zA-Z0-9]/g, "_")), {
      username: username,
      loginAt: new Date().toISOString()
    });

    usernameInput.value = '';
    checkAuth();
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('event_user');
  currentUser = null;
  checkAuth();
});

checkAuth();

// 3D CAROUSEL LOGIC
const carousel = document.getElementById('carousel');
const cards = document.querySelectorAll('.card');
const totalCards = cards.length;
const radius = 380;

let currentAngle = 0;
let isAutoSpinning = true;
let isDragging = false;
let startX = 0;
let dragAngle = 0;

function arrangeCarousel() {
  const angleStep = 360 / totalCards;
  cards.forEach((card, index) => {
    const cardAngle = angleStep * index;
    card.style.transform = `rotateY(${cardAngle}deg) translateZ(${radius}px)`;
  });
}

function updateCarousel() {
  carousel.style.transform = `rotateY(${currentAngle}deg)`;
}

function autoSpin() {
  if (isAutoSpinning && !isDragging) {
    currentAngle -= 0.3;
    updateCarousel();
  }
  requestAnimationFrame(autoSpin);
}

const container = document.querySelector('.gallery-container');
container.addEventListener('mousedown', (e) => { isDragging = true; startX = e.clientX; dragAngle = currentAngle; });
window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  currentAngle = dragAngle + (e.clientX - startX) * 0.4;
  updateCarousel();
});
window.addEventListener('mouseup', () => { isDragging = false; });

container.addEventListener('touchstart', (e) => { isDragging = true; startX = e.touches[0].clientX; dragAngle = currentAngle; });
window.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  currentAngle = dragAngle + (e.touches[0].clientX - startX) * 0.4;
  updateCarousel();
});
window.addEventListener('touchend', () => { isDragging = false; });

document.getElementById('nextBtn').addEventListener('click', () => { currentAngle -= (360 / totalCards); updateCarousel(); });
document.getElementById('prevBtn').addEventListener('click', () => { currentAngle += (360 / totalCards); updateCarousel(); });

const toggleBtn = document.getElementById('toggleSpinBtn');
toggleBtn.addEventListener('click', () => {
  isAutoSpinning = !isAutoSpinning;
  toggleBtn.innerText = isAutoSpinning ? '⏸️ Pause Spin' : '▶️ Auto Spin';
});

document.getElementById('cheerBtn').addEventListener('click', () => {
  if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
});

// REALTIME LIGHTBOX, LIKES & COMMENTS (FIREBASE)
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const closeBtn = document.getElementById('closeBtn');
const likeBtn = document.getElementById('likeBtn');
const likesList = document.getElementById('likesList');
const commentsList = document.getElementById('commentsList');
const commentForm = document.getElementById('commentForm');
const commentInput = document.getElementById('commentInput');

cards.forEach(card => {
  card.addEventListener('click', () => {
    activeImageId = card.getAttribute('data-id');
    lightboxImg.src = card.querySelector('img').src;
    lightboxTitle.innerText = card.getAttribute('data-title');
    
    listenToRealtimeData();
    lightbox.classList.add('active');
  });
});

closeBtn.addEventListener('click', () => { lightbox.classList.remove('active'); });

function listenToRealtimeData() {
  if (!activeImageId) return;

  // Listen to Likes Realtime
  onValue(ref(db, `likes/img_${activeImageId}`), (snapshot) => {
    const data = snapshot.val() || {};
    likesList.innerHTML = '';
    const users = Object.keys(data);
    if (users.length === 0) {
      likesList.innerHTML = '<span style="font-size:0.8rem; color:#aaa;">Belum ada like.</span>';
    } else {
      users.forEach(u => {
        const badge = document.createElement('span');
        badge.className = 'like-badge';
        badge.innerText = `${data[u]} ❤️`;
        likesList.appendChild(badge);
      });
    }
  });

  // Listen to Comments Realtime
  onValue(ref(db, `comments/img_${activeImageId}`), (snapshot) => {
    const data = snapshot.val() || {};
    commentsList.innerHTML = '';
    const keys = Object.keys(data);
    if (keys.length === 0) {
      commentsList.innerHTML = '<span style="font-size:0.8rem; color:#aaa;">Belum ada komen. Jadi yang pertama!</span>';
    } else {
      keys.forEach(k => {
        const commentObj = data[k];
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        
        let deleteBtnHTML = '';
        if (currentUser && currentUser.toLowerCase() === 'ginka') {
          deleteBtnHTML = `<button class="btn-delete-comment" data-key="${k}">Padam 🗑️</button>`;
        }

        commentDiv.innerHTML = `
          <strong>${commentObj.user}</strong>
          <p>${commentObj.text}</p>
          ${deleteBtnHTML}
        `;
        commentsList.appendChild(commentDiv);
      });

      // Bind Delete Event for Admin
      document.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.onclick = () => {
          const key = btn.getAttribute('data-key');
          remove(ref(db, `comments/img_${activeImageId}/${key}`));
        };
      });
    }
  });
}

// TOGGLE LIKE
likeBtn.addEventListener('click', () => {
  if (!activeImageId || !currentUser) return;
  const userKey = currentUser.replace(/[^a-zA-Z0-9]/g, "_");
  const likeRef = ref(db, `likes/img_${activeImageId}/${userKey}`);
  
  onValue(likeRef, (snapshot) => {
    if (snapshot.exists()) {
      remove(likeRef);
    } else {
      set(likeRef, currentUser);
    }
  }, { onlyOnce: true });
});

// ADD COMMENT
commentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = commentInput.value.trim();
  if (!text || !activeImageId || !currentUser) return;

  const newCommentRef = push(ref(db, `comments/img_${activeImageId}`));
  set(newCommentRef, { user: currentUser, text: text });
  commentInput.value = '';
});

// ADMIN USERS LIST MODAL
const usersModal = document.getElementById('usersModal');
const closeUsersBtn = document.getElementById('closeUsersBtn');
const usersList = document.getElementById('usersList');

adminUsersBtn.addEventListener('click', () => {
  onValue(ref(db, 'users'), (snapshot) => {
    const data = snapshot.val() || {};
    usersList.innerHTML = '';
    const keys = Object.keys(data);
    if (keys.length === 0) {
      usersList.innerHTML = '<li>Tiada user berdaftar lagi.</li>';
    } else {
      keys.forEach(k => {
        const u = data[k].username;
        const li = document.createElement('li');
        li.innerText = u.toLowerCase() === 'ginka' ? `${u} (Admin 👑)` : u;
        usersList.appendChild(li);
      });
    }
    usersModal.classList.add('active');
  }, { onlyOnce: true });
});

closeUsersBtn.addEventListener('click', () => { usersModal.classList.remove('active'); });

arrangeCarousel();
autoSpin();
