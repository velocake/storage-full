let currentUser = localStorage.getItem('event_user') || null;
let commentsData = JSON.parse(localStorage.getItem('event_comments')) || {};
let likesData = JSON.parse(localStorage.getItem('event_likes')) || {};
let registeredUsers = JSON.parse(localStorage.getItem('event_registered_users')) || [];

const loginPage = document.getElementById('loginPage');
const galleryPage = document.getElementById('galleryPage');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const displayUsername = document.getElementById('displayUsername');
const adminBadge = document.getElementById('adminBadge');
const adminUsersBtn = document.getElementById('adminUsersBtn');
const logoutBtn = document.getElementById('logoutBtn');

let activeImageId = null;

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

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (username) {
    currentUser = username;
    localStorage.setItem('event_user', currentUser);
    
    if (!registeredUsers.includes(username)) {
      registeredUsers.push(username);
      localStorage.setItem('event_registered_users', JSON.stringify(registeredUsers));
    }

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

// --- 3D CAROUSEL LOGIC ---
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

container.addEventListener('mousedown', (e) => {
  isDragging = true; startX = e.clientX; dragAngle = currentAngle;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - startX;
  currentAngle = dragAngle + deltaX * 0.4;
  updateCarousel();
});

window.addEventListener('mouseup', () => { isDragging = false; });

container.addEventListener('touchstart', (e) => {
  isDragging = true; startX = e.touches[0].clientX; dragAngle = currentAngle;
});

window.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const deltaX = e.touches[0].clientX - startX;
  currentAngle = dragAngle + deltaX * 0.4;
  updateCarousel();
});

window.addEventListener('touchend', () => { isDragging = false; });

document.getElementById('nextBtn').addEventListener('click', () => {
  currentAngle -= (360 / totalCards); updateCarousel();
});

document.getElementById('prevBtn').addEventListener('click', () => {
  currentAngle += (360 / totalCards); updateCarousel();
});

const toggleBtn = document.getElementById('toggleSpinBtn');
toggleBtn.addEventListener('click', () => {
  isAutoSpinning = !isAutoSpinning;
  toggleBtn.innerText = isAutoSpinning ? '⏸️ Pause Spin' : '▶️ Auto Spin';
});

document.getElementById('cheerBtn').addEventListener('click', () => {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
});

// --- LIGHTBOX, LIKES & COMMENTS LOGIC ---
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
    const imgSrc = card.querySelector('img').src;
    const title = card.getAttribute('data-title');

    lightboxImg.src = imgSrc;
    lightboxTitle.innerText = title;
    
    renderLikesAndComments();
    lightbox.classList.add('active');
  });
});

closeBtn.addEventListener('click', () => { lightbox.classList.remove('active'); });
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });

function renderLikesAndComments() {
  if (!activeImageId) return;

  const imageLikes = likesData[activeImageId] || [];
  likesList.innerHTML = '';
  
  if (imageLikes.length === 0) {
    likesList.innerHTML = '<span style="font-size:0.8rem; color:#aaa;">Belum ada like.</span>';
  } else {
    imageLikes.forEach(user => {
      const badge = document.createElement('span');
      badge.className = 'like-badge';
      badge.innerText = `${user} ❤️`;
      likesList.appendChild(badge);
    });
  }

  const imageComments = commentsData[activeImageId] || [];
  commentsList.innerHTML = '';

  if (imageComments.length === 0) {
    commentsList.innerHTML = '<span style="font-size:0.8rem; color:#aaa;">Belum ada komen. Jadi yang pertama!</span>';
  } else {
    imageComments.forEach((commentObj, index) => {
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment-item';
      
      let deleteBtnHTML = '';
      if (currentUser && currentUser.toLowerCase() === 'ginka') {
        deleteBtnHTML = `<button class="btn-delete-comment" onclick="deleteComment(${index})">Padam 🗑️</button>`;
      }

      commentDiv.innerHTML = `
        <strong>${commentObj.user}</strong>
        <p>${commentObj.text}</p>
        ${deleteBtnHTML}
      `;
      commentsList.appendChild(commentDiv);
    });
  }
}

likeBtn.addEventListener('click', () => {
  if (!activeImageId || !currentUser) return;
  if (!likesData[activeImageId]) likesData[activeImageId] = [];

  const userIndex = likesData[activeImageId].indexOf(currentUser);
  if (userIndex === -1) {
    likesData[activeImageId].push(currentUser);
  } else {
    likesData[activeImageId].splice(userIndex, 1);
  }

  localStorage.setItem('event_likes', JSON.stringify(likesData));
  renderLikesAndComments();
});

commentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = commentInput.value.trim();
  if (!text || !activeImageId || !currentUser) return;

  if (!commentsData[activeImageId]) commentsData[activeImageId] = [];

  commentsData[activeImageId].push({ user: currentUser, text: text });
  localStorage.setItem('event_comments', JSON.stringify(commentsData));
  commentInput.value = '';
  renderLikesAndComments();
});

window.deleteComment = function(commentIndex) {
  if (currentUser && currentUser.toLowerCase() === 'ginka' && activeImageId) {
    commentsData[activeImageId].splice(commentIndex, 1);
    localStorage.setItem('event_comments', JSON.stringify(commentsData));
    renderLikesAndComments();
  }
};

// --- ADMIN USERS LIST MODAL LOGIC ---
const usersModal = document.getElementById('usersModal');
const closeUsersBtn = document.getElementById('closeUsersBtn');
const usersList = document.getElementById('usersList');

adminUsersBtn.addEventListener('click', () => {
  usersList.innerHTML = '';
  if (registeredUsers.length === 0) {
    usersList.innerHTML = '<li>Tiada user berdaftar lagi.</li>';
  } else {
    registeredUsers.forEach(u => {
      const li = document.createElement('li');
      li.innerText = u.toLowerCase() === 'ginka' ? `${u} (Admin 👑)` : u;
      usersList.appendChild(li);
    });
  }
  usersModal.classList.add('active');
});

closeUsersBtn.addEventListener('click', () => { usersModal.classList.remove('active'); });
usersModal.addEventListener('click', (e) => { if (e.target === usersModal) usersModal.classList.remove('active'); });

arrangeCarousel();
autoSpin();
