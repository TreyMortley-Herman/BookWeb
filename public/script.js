// ------------------------------
// Book Gallery and Reading List
// ------------------------------

// Store the books data and the reading list
let booksData = [];
let readingList = [];

// Additionally, store finished books
let finishedBooks = [];

// Load reading list from localStorage (if available)
function loadFromLocalStorage() {
  const savedReadingList = localStorage.getItem('readingList');
  if (savedReadingList) {
    readingList = JSON.parse(savedReadingList);
  }
}

// Save the reading list to localStorage
function saveToLocalStorage() {
  localStorage.setItem('readingList', JSON.stringify(readingList));
}

// Load finished books from localStorage (if available)
function loadFinishedBooksFromLocalStorage() {
  const savedFinishedBooks = localStorage.getItem('finishedBooks');
  if (savedFinishedBooks) {
    finishedBooks = JSON.parse(savedFinishedBooks);
  }
}

// Save finished books to localStorage
function saveFinishedBooksToLocalStorage() {
  localStorage.setItem('finishedBooks', JSON.stringify(finishedBooks));
}

// Fetch books from Google Books API (default: no genre filter)
async function fetchBooks(genre = '') {
  try {
    // Use a default query term ("fiction") if no genre is provided.
    let query = genre ? `subject:${genre}` : 'fiction';
    console.log(`Fetching books with query: "${query}"`);
    
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`);
    const data = await response.json();
    
    console.log('API response:', data);
    booksData = data.items || [];
    
    renderBookGallery();
  } catch (error) {
    console.error('Error fetching books:', error);
  }
}

// Render the book gallery (make sure the #book-gallery container exists in the HTML)
function renderBookGallery() {
  const galleryContainer = document.getElementById('book-gallery');
  if (!galleryContainer) {
    console.error("No element with id 'book-gallery' found");
    return;
  }
  galleryContainer.innerHTML = ''; // Clear previous content

  if (booksData.length === 0) {
    galleryContainer.innerHTML = '<p>No books to display.</p>';
    return;
  }

  booksData.forEach(book => {
    const volumeInfo = book.volumeInfo;
    const isBookmarked = readingList.some(item => item.id === book.id);
    const bookElement = document.createElement('div');
    bookElement.className = 'book-card';

    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
          <div class="book-title">${volumeInfo.title || 'Unknown Title'}</div>
          <div class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}</div>
          <div class="book-date">Published: ${volumeInfo.publishedDate || 'Unknown'}</div>
          <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + '...' : 'No description available'}</div>
          <div class="book-actions">
              <button class="btn ${isBookmarked ? 'btn-secondary' : 'btn-primary'} bookmark-btn" data-id="${book.id}">
                  ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
          </div>
      </div>
    `;
    galleryContainer.appendChild(bookElement);
  });

  // Add event listeners to bookmark buttons (to add books to the reading list)
  document.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', handleBookmarkClick);
  });
} 

// Handle adding a book to the reading list
function handleBookmarkClick(event) {
  const bookId = event.target.getAttribute('data-id');
  const book = booksData.find(item => item.id === bookId);
  if (!book) return;

  const isAlreadyBookmarked = readingList.some(item => item.id === bookId);
  if (isAlreadyBookmarked) {
    alert('This book is already in your reading list');
  } else {
    readingList.push(book);
    saveToLocalStorage();
    event.target.textContent = 'Bookmarked';
    event.target.classList.remove('btn-primary');
    event.target.classList.add('btn-secondary');
  }
}

// Setup genre filter (if a select element with id 'genre-filter' exists)
function setupGenreFilter() {
  const genreFilter = document.getElementById('genre-filter');
  if (genreFilter) {
    genreFilter.addEventListener('change', () => {
      fetchBooks(genreFilter.value);
    });
  }
}

// New: Search books by title using the Google Books API
async function searchBooks(bookName) {
    try {
      // Use the intitle: parameter to search by book title.
      const searchQuery = `intitle:${encodeURIComponent(bookName)}`;
      console.log(`Searching books with query: "${searchQuery}"`);
  
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=40`);
      const data = await response.json();
      console.log('Search API response:', data);
      booksData = data.items || [];
      renderBookGallery();
    } catch (error) {
      console.error('Error searching books:', error);
    }
  }
  
  // New: Set up search event listener for the search input and button
  function setupSearchListener() {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    if (searchButton && searchInput) {
      searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
          searchBooks(query);
        } else {
          fetchBooks();
        }
      });
      // Optionally, allow 'Enter' key press for search
      searchInput.addEventListener('keypress', (event) => {
        if (event.key === "Enter") {
          const query = searchInput.value.trim();
          if (query) {
            searchBooks(query);
          } else {
            fetchBooks();
          }
        }
      });
    }
  }

// ------------------------------
// Reading List Rendering
// ------------------------------

function renderReadingList() {
  const readingListContainer = document.getElementById('reading-list-container');
  if (!readingListContainer) {
    console.error("No element with id 'reading-list-container' found");
    return;
  }
  readingListContainer.innerHTML = '';

  if (readingList.length === 0) {
    readingListContainer.innerHTML = '<p>Your reading list is empty.</p>';
    return;
  }

  readingList.forEach(book => {
    const volumeInfo = book.volumeInfo;
    const bookElement = document.createElement('div');
    bookElement.className = 'book-card';

    // Now two buttons are added: one to remove and one to mark as finished.
    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
          <div class="book-title">${volumeInfo.title || 'Unknown Title'}</div>
          <div class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}</div>
          <div class="book-date">Published: ${volumeInfo.publishedDate || 'Unknown'}</div>
          <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + '...' : 'No description available'}</div>
          <div class="book-actions">
              <button class="remove-btn" data-id="${book.id}">Remove</button>
              <button class="finished-btn" data-id="${book.id}">Finished</button>
          </div>
      </div>
    `;
    readingListContainer.appendChild(bookElement);
  });

  // Set up event listeners for remove and finish buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', handleRemoveFromReadingList);
  });

  document.querySelectorAll('.finished-btn').forEach(btn => {
    btn.addEventListener('click', handleMarkAsFinished);
  });
}

// Remove a book from the reading list
function handleRemoveFromReadingList(event) {
  const bookId = event.target.getAttribute('data-id');
  readingList = readingList.filter(item => item.id !== bookId);
  saveToLocalStorage();
  renderReadingList();
}

// Mark a book as finished: remove it from reading list and add it to finishedBooks.
function handleMarkAsFinished(event) {
  const bookId = event.target.getAttribute('data-id');
  // Remove from reading list
  const bookIndex = readingList.findIndex(item => item.id === bookId);
  if (bookIndex === -1) {
    alert('This book is not in your reading list.');
    return;
  }
  const [book] = readingList.splice(bookIndex, 1);
  saveToLocalStorage();

  // Add to finishedBooks if not already there
  if (!finishedBooks.some(item => item.id === bookId)) {
    finishedBooks.push(book);
    saveFinishedBooksToLocalStorage();
  }
  alert('Book marked as finished!');
  renderReadingList();
  
  // If finished books section is visible, update it.
  if (document.getElementById('finished-books-container')) {
    renderFinishedBooks();
  }
}

// ------------------------------
// Finished Books Rendering
// ------------------------------

function renderFinishedBooks() {
  const finishedBooksContainer = document.getElementById('finished-books-container');
  if (!finishedBooksContainer) {
    console.error("No element with id 'finished-books-container' found");
    return;
  }
  finishedBooksContainer.innerHTML = '';

  if (finishedBooks.length === 0) {
    finishedBooksContainer.innerHTML = '<p>You have not finished any books yet.</p>';
    return;
  }

  finishedBooks.forEach(book => {
    const volumeInfo = book.volumeInfo;
    const bookElement = document.createElement('div');
    bookElement.className = 'book-card';
    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
          <div class="book-title">${volumeInfo.title || 'Unknown Title'}</div>
          <div class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}</div>
          <div class="book-date">Published: ${volumeInfo.publishedDate || 'Unknown'}</div>
          <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + '...' : 'No description available'}</div>
          <div class="book-actions">
              <button class="remove-btn" data-id="${book.id}">Remove</button>
          </div>
      </div>
    `;
    finishedBooksContainer.appendChild(bookElement);
  });

  document.querySelectorAll('.remove-finished-btn').forEach(btn => {
    btn.addEventListener('click', handleRemoveFinishedBook);
  });
}

// Remove a book from the finished books list
function handleRemoveFinishedBook(event) {
  const bookId = event.target.getAttribute('data-id');
  finishedBooks = finishedBooks.filter(item => item.id !== bookId);
  saveFinishedBooksToLocalStorage();
  renderFinishedBooks();
}

// ------------------------------
// Initialization
// ------------------------------

function initReadingListSection() {
  const readingListButton = document.getElementById('view-reading-list');
  if (readingListButton) {
    readingListButton.addEventListener('click', renderReadingList);
  } else {
    console.error("Button with id 'view-reading-list' not found");
  }
}

function init() {
  loadFromLocalStorage();
  loadFinishedBooksFromLocalStorage();
  
  // If the gallery container exists (e.g., on Gallery or Home page), fetch and render books.
  if (document.getElementById('book-gallery')) {
    fetchBooks();
    setupGenreFilter();
  }
  
  if (document.getElementById('view-reading-list')) {
    initReadingListSection();
  }
  
  // If the finished books container exists (e.g., on finishedlist.html), render finished books.
  if (document.getElementById('finished-books-container')) {
    renderFinishedBooks();
  }

  // New: Set up the search functionality if the relevant elements exist.
  if (document.getElementById('search-button') && document.getElementById('search-input')) {
    setupSearchListener();
  }
  
  console.log('App initialized.');
}

document.addEventListener('DOMContentLoaded', init);

// ------------------------------
// Next Page 
// ------------------------------

// ------------------------------
// Pagination Implementation
// ------------------------------

// Global pagination variables
let currentPage = 1;
let booksPerPage = 8; // Adjust based on your layout preferences
let totalPages = 0;

// Function to render books with pagination
function renderBookGallery() {
  const galleryContainer = document.getElementById('book-gallery');
  if (!galleryContainer) {
    console.error("No element with id 'book-gallery' found");
    return;
  }
  galleryContainer.innerHTML = ''; // Clear previous content

  if (booksData.length === 0) {
    galleryContainer.innerHTML = '<p>No books to display.</p>';
    return;
  }

  // Calculate total pages
  totalPages = Math.ceil(booksData.length / booksPerPage);
  
  // Calculate start and end indices for current page
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = Math.min(startIndex + booksPerPage, booksData.length);
  
  // Display only books for current page
  for (let i = startIndex; i < endIndex; i++) {
    const book = booksData[i];
    const volumeInfo = book.volumeInfo;
    const isBookmarked = readingList.some(item => item.id === book.id);
    const bookElement = document.createElement('div');
    bookElement.className = 'book-card';

    bookElement.innerHTML = `
      <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title}">
      <div class="book-info">
          <div class="book-title">${volumeInfo.title || 'Unknown Title'}</div>
          <div class="book-author">${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}</div>
          <div class="book-date">Published: ${volumeInfo.publishedDate || 'Unknown'}</div>
          <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + '...' : 'No description available'}</div>
          <div class="book-actions">
              <button class="btn ${isBookmarked ? 'btn-secondary' : 'btn-primary'} bookmark-btn" data-id="${book.id}">
                  ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
          </div>
      </div>
    `;
    galleryContainer.appendChild(bookElement);
  }

  // Add event listeners to bookmark buttons
  document.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', handleBookmarkClick);
  });
  
  // Update pagination controls
  updatePaginationControls();
}

// Function to create and update pagination controls
function updatePaginationControls() {
  // Find or create pagination container
  let paginationContainer = document.getElementById('pagination-controls');
  
  if (!paginationContainer) {
    paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-controls';
    paginationContainer.className = 'pagination-controls';
    
    // Find where to insert pagination controls (after book gallery)
    const galleryContainer = document.getElementById('book-gallery');
    if (galleryContainer && galleryContainer.parentNode) {
      galleryContainer.parentNode.insertBefore(paginationContainer, galleryContainer.nextSibling);
    }
  }
  
  // Create pagination UI
  let paginationHTML = '';
  
  // Previous button
  paginationHTML += `<button class="pagination-btn" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;
  
  // Page info
  paginationHTML += `<span class="page-info">Page ${currentPage} of ${totalPages}</span>`;
  
  // Next button
  paginationHTML += `<button class="pagination-btn" id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
  
  paginationContainer.innerHTML = paginationHTML;
  
  // Add event listeners to pagination buttons
  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderBookGallery();
      
    }
  });
  
  document.getElementById('next-page')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderBookGallery();

    }
  });
}

// Reset pagination when searching or changing genre
async function fetchBooks(genre = '') {
  try {
    // Reset pagination when fetching new books
    currentPage = 1;
    
    // Use a default query term ("fiction") if no genre is provided.
    let query = genre ? `subject:${genre}` : 'fiction';
    console.log(`Fetching books with query: "${query}"`);
    
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`);
    const data = await response.json();
    
    console.log('API response:', data);
    booksData = data.items || [];
    
    renderBookGallery();
  } catch (error) {
    console.error('Error fetching books:', error);
  }
}

// Same reset for search function
async function searchBooks(bookName) {
  try {
    // Reset pagination when searching new books
    currentPage = 1;
    
    // Use the intitle: parameter to search by book title.
    const searchQuery = `intitle:${encodeURIComponent(bookName)}`;
    console.log(`Searching books with query: "${searchQuery}"`);
  
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=40`);
    const data = await response.json();
    console.log('Search API response:', data);
    booksData = data.items || [];
    renderBookGallery();
  } catch (error) {
    console.error('Error searching books:', error);
  }
} 
