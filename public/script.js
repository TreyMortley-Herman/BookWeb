import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

// ---------------------
// Firebase Configuration
// ---------------------
const firebaseConfig = {
  apiKey: "AIzaSyBC6_5y0N4Rbn-S42tboZaq3ZzHaRpq_L0",
  authDomain: "bookweb-36055.firebaseapp.com",
  projectId: "bookweb-36055",
  storageBucket: "bookweb-36055.firebasestorage.app",
  messagingSenderId: "227791068443",
  appId: "1:227791068443:web:1c819c673dcc234c8847be"
};

export default firebaseConfig;

// Initialize Firebase.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------------------------------------------------------------
// Listen for authentication state changes.
// If a user is signed in, update the header and initialize the app.
// Otherwise, the page loads without forcing a login prompt.
// ---------------------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    showUserInfo(user);
  }
  // In any case, initialize the application functionality.
  initApp();
});

// ---------------------------------------------------------------------
// Function: showUserInfo()
// Updates the header’s .auth-buttons container to display the user's name
// and a Logout button. This header update will occur on every page hosting
// script.js.
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
      signOut(auth)
        .then(() => {
          // Reload the page so the default header (with Login/Register) is shown.
          window.location.reload();
        })
        .catch((error) => {
          alert("Error signing out: " + error.message);
        });
    });
  }
}

/* -----------------------------------------------------------
    BookWeb Application General Functionality:
   - Book Gallery via Google Books API
   - Bookmarking (Reading List) functionality
   - Finished Books Management
   - Search & Genre Filter functionality
   ----------------------------------------------------------- */

// Global arrays for app functionality.
let booksData = [];
let readingList = [];
let finishedBooks = [];

// ----------------------
// LocalStorage Functions
// ----------------------
function loadFromLocalStorage() {
  const savedReadingList = localStorage.getItem("readingList");
  if (savedReadingList) {
    readingList = JSON.parse(savedReadingList);
  }
}

function saveToLocalStorage() {
  localStorage.setItem("readingList", JSON.stringify(readingList));
}

function loadFinishedBooksFromLocalStorage() {
  const savedFinishedBooks = localStorage.getItem("finishedBooks");
  if (savedFinishedBooks) {
    finishedBooks = JSON.parse(savedFinishedBooks);
  }
}

function saveFinishedBooksToLocalStorage() {
  localStorage.setItem("finishedBooks", JSON.stringify(finishedBooks));
}

// ------------------------------------------------------------
// Function: fetchBooks()
// Fetches books using the Google Books API. Uses "fiction" as default
// or uses a provided genre.
async function fetchBooks(genre = "") {
  try {
    let query = genre ? `subject:${genre}` : "fiction";
    console.log(`Fetching books with query: "${query}"`);
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`);
    const data = await response.json();
    booksData = data.items || [];
    renderBookGallery();
  } catch (error) {
    console.error("Error fetching books:", error);
  }
}

// ------------------------------------------------------------
// Function: renderBookGallery()
// Renders the fetched books into the container with id "book-gallery".
// ------------------------------------------------------------
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
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
        <div class="book-title">${volumeInfo.title || "Unknown Title"}</div>
        <div class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author"}</div>
        <div class="book-date">Published: ${volumeInfo.publishedDate || "Unknown"}</div>
        <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + "..." : "No description available"}</div>
        <div class="book-actions">
          <button class="btn ${isBookmarked ? "btn-secondary" : "btn-primary"} bookmark-btn" data-id="${book.id}">
            ${isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>
      </div>
    `;
    galleryContainer.appendChild(bookElement);
  });
  document.querySelectorAll(".bookmark-btn").forEach(btn => {
    btn.addEventListener("click", handleBookmarkClick);
  });
} 

// ------------------------------------------------------------
// Function: handleBookmarkClick()
// Adds a book to the reading list (if not already added).
// ------------------------------------------------------------
function handleBookmarkClick(event) {
  const bookId = event.target.getAttribute("data-id");
  const book = booksData.find(item => item.id === bookId);
  if (!book) return;
  if (readingList.some(item => item.id === bookId)) {
    alert("This book is already in your reading list");
  } else {
    readingList.push(book);
    saveToLocalStorage();
    event.target.textContent = "Bookmarked";
    event.target.classList.remove("btn-primary");
    event.target.classList.add("btn-secondary");
  }
}

// ------------------------------------------------------------
// Function: setupGenreFilter()
// Attaches a change event to the genre filter (if present).
// ------------------------------------------------------------
function setupGenreFilter() {
  const genreFilter = document.getElementById("genre-filter");
  if (genreFilter) {
    genreFilter.addEventListener("change", () => {
      fetchBooks(genreFilter.value);
    });
  }
}

// ------------------------------------------------------------
// Function: searchBooks()
// Fetches books based on a title query using the "intitle:" operator.
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Function: setupSearchListener()
// Attaches event listeners to the search input and button.
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Function: renderReadingList()
// Renders the reading list in the container with id "reading-list-container".
// ------------------------------------------------------------
function renderReadingList() {
  const readingListContainer = document.getElementById("reading-list-container");
  if (!readingListContainer) return;
  readingListContainer.innerHTML = "";
  if (!readingList.length) {
    readingListContainer.innerHTML = "<p>Your reading list is empty.</p>";
    return;
  }
  readingList.forEach(book => {
    const volumeInfo = book.volumeInfo;
    const bookElement = document.createElement("div");
    bookElement.className = "book-card";
    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
        <div class="book-title">${volumeInfo.title || "Unknown Title"}</div>
        <div class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author"}</div>
        <div class="book-date">Published: ${volumeInfo.publishedDate || "Unknown"}</div>
        <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + "..." : "No description available"}</div>
        <div class="book-actions">
          <button class="btn btn-danger remove-btn" data-id="${book.id}">Remove</button>
          <button class="btn btn-success finished-btn" data-id="${book.id}">Finished</button>
        </div>
      </div>
    `;
    readingListContainer.appendChild(bookElement);
  });
  document.querySelectorAll(".remove-btn").forEach(btn => btn.addEventListener("click", handleRemoveFromReadingList));
  document.querySelectorAll(".finished-btn").forEach(btn => btn.addEventListener("click", handleMarkAsFinished));
}

// ------------------------------------------------------------
// Function: handleRemoveFromReadingList()
// Removes a book from the reading list.
function handleRemoveFromReadingList(event) {
  const bookId = event.target.getAttribute("data-id");
  readingList = readingList.filter(item => item.id !== bookId);
  saveToLocalStorage();
  renderReadingList();
}

// ------------------------------------------------------------
// Function: handleMarkAsFinished()
// Removes a book from the reading list and adds it to finishedBooks.
function handleMarkAsFinished(event) {
  const bookId = event.target.getAttribute("data-id");
  const index = readingList.findIndex(item => item.id === bookId);
  if (index === -1) {
    alert("This book is not in your reading list.");
    return;
  }
  const [book] = readingList.splice(index, 1);
  saveToLocalStorage();
  if (!finishedBooks.some(item => item.id === bookId)) {
    finishedBooks.push(book);
    saveFinishedBooksToLocalStorage();
  }
  alert("Book marked as finished!");
  renderReadingList();
  if (document.getElementById("finished-books-container")) {
    renderFinishedBooks();
  }
}

// ------------------------------------------------------------
// Function: renderFinishedBooks()
// Renders the finished books list in the container with id "finished-books-container".
// ------------------------------------------------------------
function renderFinishedBooks() {
  const finishedBooksContainer = document.getElementById("finished-books-container");
  if (!finishedBooksContainer) return;
  finishedBooksContainer.innerHTML = "";
  if (!finishedBooks.length) {
    finishedBooksContainer.innerHTML = "<p>You have not finished any books yet.</p>";
    return;
  }
  finishedBooks.forEach(book => {
    const volumeInfo = book.volumeInfo;
    const bookElement = document.createElement("div");
    bookElement.className = "book-card";
    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
        <div class="book-title">${volumeInfo.title || "Unknown Title"}</div>
        <div class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author"}</div>
        <div class="book-date">Published: ${volumeInfo.publishedDate || "Unknown"}</div>
        <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + "..." : "No description available"}</div>
        <div class="book-actions">
          <button class="remove-btn" data-id="${book.id}">Remove</button>
        </div>
      </div>
    `;
    finishedBooksContainer.appendChild(bookElement);
  });
  document.querySelectorAll(".remove-btn").forEach(btn => btn.addEventListener("click", handleRemoveFinishedBook));
}

// ------------------------------------------------------------
// Function: handleRemoveFinishedBook()
// Removes a book from the finished books list.
function handleRemoveFinishedBook(event) {
  const bookId = event.target.getAttribute("data-id");
  finishedBooks = finishedBooks.filter(item => item.id !== bookId);
  saveFinishedBooksToLocalStorage();
  renderFinishedBooks();
}

// ------------------------------------------------------------
// Function: initApp()
// Main application initialization function.
// Loads localStorage data, fetches books (default "fiction"),
// sets up genre filter and search listeners, and renders the reading list.
// ------------------------------------------------------------

function initApp() { 
  loadFromLocalStorage();
  loadFinishedBooksFromLocalStorage();
  
  if (document.getElementById("book-gallery")) {
    fetchBooks();
    setupGenreFilter();
  }
  
  if (document.getElementById("reading-list-container")) {
    renderReadingList();
  }
  
  if (document.getElementById("finished-books-container")) {
    renderFinishedBooks();
  }
  
  if (document.getElementById("search-button") && document.getElementById("search-input")) {
    setupSearchListener();
  }
  
  console.log("App initialized.");
}

