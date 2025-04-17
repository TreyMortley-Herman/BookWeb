import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

// ---------------------
// Firebase Configuration
// ---------------------
const firebaseConfig = {
  apiKey: "AIzaSyBC6_5y0N4Rbn-S42tboZaq3ZzHaRpq_L0",
  authDomain: "bookweb-36055.firebaseapp.com",
  projectId: "bookweb-36055",
  storageBucket: "bookweb-36055.appspot.com",
  messagingSenderId: "227791068443",
  appId: "1:227791068443:web:1c819c673dcc234c8847be"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Global arrays for app functionality
let booksData = [];
let readingList = [];
let finishedBooks = [];

// ---------------------------------------------------------------------
// Authentication State Listener
// ---------------------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    showUserInfo(user);
    // Load user data immediately when auth state changes
    loadUserData(user.uid);
    // If we're on the reading list page, render it immediately
    if (window.location.pathname.includes('readinglist.html')) {
      renderReadingList();
    }
  } else {
    // Clear data when logged out
    readingList = [];
    finishedBooks = [];
  }
  initApp(user);
});

// ---------------------------------------------------------------------
// User Data Management
// ---------------------------------------------------------------------
function loadUserData(userId) {
  const savedReadingList = localStorage.getItem(`readingList_${userId}`);
  readingList = savedReadingList ? JSON.parse(savedReadingList) : [];
  
  const savedFinishedBooks = localStorage.getItem(`finishedBooks_${userId}`);
  finishedBooks = savedFinishedBooks ? JSON.parse(savedFinishedBooks) : [];
}

function saveReadingList() {
  const user = auth.currentUser;
  if (user) {
    localStorage.setItem(`readingList_${user.uid}`, JSON.stringify(readingList));
  }
}

function saveFinishedBooks() {
  const user = auth.currentUser;
  if (user) {
    localStorage.setItem(`finishedBooks_${user.uid}`, JSON.stringify(finishedBooks));
  }
}

// ---------------------------------------------------------------------
// UI Functions
// ---------------------------------------------------------------------
function showUserInfo(user) {
  const authButtonsDiv = document.querySelector(".auth-buttons");
  if (authButtonsDiv) {
    authButtonsDiv.innerHTML = ` <div class="user-controls">
  <span class="user-name">${user.displayName || "User"}</span>
  <button id="logout-button" class="button">Logout</button>
  </div> 
    `;
    document.getElementById("logout-button").addEventListener("click", () => {
      signOut(auth).then(() => window.location.reload());
    });
  }
}

// ---------------------------------------------------------------------
// Book Gallery Functions
// ---------------------------------------------------------------------
async function fetchBooks(genre = "") {
  try {
    let query = genre ? `subject:${genre}` : "fiction";
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`);
    const data = await response.json();
    booksData = data.items || [];
    renderBookGallery();
  } catch (error) {
    console.error("Error fetching books:", error);
  }
}

function renderBookGallery() {
  const galleryContainer = document.getElementById("book-gallery");
  if (!galleryContainer) return;
  
  galleryContainer.innerHTML = "";
  
  if (!booksData.length) {
    galleryContainer.innerHTML = "<p>No books to display.</p>";
    return;
  }

  booksData.forEach(book => {
    const volumeInfo = book.volumeInfo;
    const isBookmarked = readingList.some(item => item.id === book.id);
    const bookElement = document.createElement("div");
    bookElement.className = "book-card";
    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || 'placeholder-image-url'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
        <div class="book-title">${volumeInfo.title || "Unknown Title"}</div>
        <div class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author"}</div>
        <div class="book-date">Published: ${volumeInfo.publishedDate || "Unknown"}</div>
        <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + "..." : "No description available"}</div>
        <div class="book-actions">
          <button class="btn ${isBookmarked ? "btn-secondary" : "btn-primary"} bookmark-btn" 
                  data-id="${book.id}" 
                  ${!auth.currentUser ? 'disabled title="Please login to bookmark"' : ''}>
            ${isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>
      </div>
    `;
    galleryContainer.appendChild(bookElement);
  });

  if (auth.currentUser) {
    document.querySelectorAll(".bookmark-btn").forEach(btn => {
      btn.addEventListener("click", handleBookmarkClick);
    });
  }
}

function handleBookmarkClick(event) {
  const bookId = event.target.getAttribute("data-id");
  const book = booksData.find(item => item.id === bookId);
  if (!book) return;

  const user = auth.currentUser;
  if (!user) return;

  if (readingList.some(item => item.id === bookId)) {
    alert("This book is already in your reading list");
  } else {
    readingList.push(book);
    saveReadingList();
    event.target.textContent = "Bookmarked";
    event.target.classList.remove("btn-primary");
    event.target.classList.add("btn-secondary");
  }
}

// ---------------------------------------------------------------------
// Reading List Functions (Fixed Implementation)
// ---------------------------------------------------------------------
function initReadingListSection() {
  const button = document.getElementById("view-reading-list");
  const container = document.getElementById("reading-list");
  
  if (container) {
    container.style.display = "none";
    
    // Render immediately if user is logged in and on reading list page
    if (auth.currentUser && window.location.pathname.includes('readinglist.html')) {
      container.style.display = "block";
      renderReadingList();
    }
  }
  
  if (button) {
    button.addEventListener("click", () => {
      if (container.style.display === "none") {
        container.style.display = "block";
        renderReadingList();
        button.textContent = "Hide Reading List";
      } else {
        container.style.display = "none";
        button.textContent = "View Reading List";
      }
    });
  }
}

function renderReadingList() {
  const readingListContainer = document.getElementById("reading-list-container");
  if (!readingListContainer) return;
  
  readingListContainer.innerHTML = "";
  
  if (!auth.currentUser) {
    readingListContainer.innerHTML = `
      <div class="alert alert-info">
        <h3>Please log in to view your reading list</h3>
        <p>You need to be logged in to access your saved books.</p>
      </div>
    `;
    return;
  }
  
  if (!readingList.length) {
    readingListContainer.innerHTML = `
      <div class="alert alert-info">
        <h3>Your reading list is empty</h3>
        <p>Start by bookmarking some books from the gallery!</p>
      </div>
    `;
    return;
  }

  readingList.forEach(book => {
    const volumeInfo = book.volumeInfo;
    const bookElement = document.createElement("div");
    bookElement.className = "book-card reading-list-item";
    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || 'placeholder-image-url'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
        <h3 class="book-title">${volumeInfo.title || "Unknown Title"}</h3>
        <p class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author"}</p>
        <div class="book-actions">
          <button class="btn btn-danger remove-btn" data-id="${book.id}">
            <i class="fas fa-trash"></i> Remove
          </button>
          <button class="btn btn-success finished-btn" data-id="${book.id}">
            <i class="fas fa-check"></i> Finished
          </button>
        </div>
      </div>
    `;
    readingListContainer.appendChild(bookElement);
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", handleRemoveFromReadingList);
  });

  document.querySelectorAll(".finished-btn").forEach(btn => {
    btn.addEventListener("click", handleMarkAsFinished);
  });
}

function handleRemoveFromReadingList(event) {
  const bookId = event.target.getAttribute("data-id");
  const user = auth.currentUser;
  if (!user) return;

  readingList = readingList.filter(item => item.id !== bookId);
  saveReadingList();
  renderReadingList();
}

function handleMarkAsFinished(event) {
  const bookId = event.target.getAttribute("data-id");
  const user = auth.currentUser;
  if (!user) return;

  const index = readingList.findIndex(item => item.id === bookId);
  if (index === -1) {
    alert("This book is not in your reading list.");
    return;
  }

  const [book] = readingList.splice(index, 1);
  saveReadingList();

  if (!finishedBooks.some(item => item.id === bookId)) {
    finishedBooks.push(book);
    saveFinishedBooks();
  }

  renderReadingList();
  
  if (document.getElementById("finished-books-container")) {
    renderFinishedBooks();
  }
}

// ---------------------------------------------------------------------
// Finished Books Functions
// ---------------------------------------------------------------------
function renderFinishedBooks() {
  const finishedBooksContainer = document.getElementById("finished-books-container");
  if (!finishedBooksContainer) return;
  
  finishedBooksContainer.innerHTML = "";
  
  if (!auth.currentUser) {
    finishedBooksContainer.innerHTML = `
      <div class="alert alert-info">
        Please log in to view your finished books
      </div>
    `;
    return;
  }
  
  if (!finishedBooks.length) {
    finishedBooksContainer.innerHTML = `
      <div class="alert alert-info">
        You haven't marked any books as finished yet
      </div>
    `;
    return;
  }

  finishedBooks.forEach(book => {
    const volumeInfo = book.volumeInfo;
    const bookElement = document.createElement("div");
    bookElement.className = "book-card finished-book-item";
    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || 'placeholder-image-url'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
        <h3 class="book-title">${volumeInfo.title || "Unknown Title"}</h3>
        <p class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author"}</p>
        <div class="book-actions">
          <button class="btn btn-danger remove-finished-btn" data-id="${book.id}">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `;
    finishedBooksContainer.appendChild(bookElement);
  });

  document.querySelectorAll(".remove-finished-btn").forEach(btn => {
    btn.addEventListener("click", handleRemoveFinishedBook);
  });
}

function handleRemoveFinishedBook(event) {
  const bookId = event.target.getAttribute("data-id");
  const user = auth.currentUser;
  if (!user) return;

  finishedBooks = finishedBooks.filter(item => item.id !== bookId);
  saveFinishedBooks();
  renderFinishedBooks();
}

// ---------------------------------------------------------------------
// Search and Filter Functions
// ---------------------------------------------------------------------
function setupGenreFilter() {
  const genreFilter = document.getElementById("genre-filter");
  if (genreFilter) {
    genreFilter.addEventListener("change", () => {
      fetchBooks(genreFilter.value);
    });
  }
}

async function searchBooks(bookName) {
  try {
    const searchQuery = `intitle:${encodeURIComponent(bookName)}`;
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=40`);
    const data = await response.json();
    booksData = data.items || [];
    renderBookGallery();
  } catch (error) {
    console.error("Error searching books:", error);
  }
}

function setupSearchListener() {
  const searchButton = document.getElementById("search-button");
  const searchInput = document.getElementById("search-input");
  
  if (searchButton && searchInput) {
    searchButton.addEventListener("click", () => {
      const query = searchInput.value.trim();
      query ? searchBooks(query) : fetchBooks();
    });
    
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        query ? searchBooks(query) : fetchBooks();
      }
    });
  }
}

// ---------------------------------------------------------------------
// Main App Initialization
// ---------------------------------------------------------------------
function initApp(user) {
  // Initialize components based on current page
  if (document.getElementById("book-gallery")) {
    fetchBooks();
    setupGenreFilter();
  }

  if (document.getElementById("view-reading-list") || document.getElementById("reading-list")) {
    initReadingListSection();
  }

  if (document.getElementById("finished-books-container")) {
    renderFinishedBooks();
  }

  if (document.getElementById("search-button")) {
    setupSearchListener();
  }
}