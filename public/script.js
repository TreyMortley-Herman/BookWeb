// Book Gallery JS code

// Store the books data
let booksData = [];
let readingList = [];

// Load data from localStorage if available
function loadFromLocalStorage() {
    const savedReadingList = localStorage.getItem('readingList');
    
    if (savedReadingList) {
        readingList = JSON.parse(savedReadingList);
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('readingList', JSON.stringify(readingList));
}

// Fetch books from Google Books API
async function fetchBooks(genre = '') {
    try {
        let query = genre ? `subject:${genre}` : '';
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`);
        const data = await response.json();
        booksData = data.items || [];
        renderBookGallery();
    } catch (error) {
        console.error('Error fetching books:', error);
    }
}

// Render books in the gallery
function renderBookGallery() {
    const galleryContainer = document.getElementById('book-gallery');
    galleryContainer.innerHTML = '';

    booksData.forEach(book => {
        const volumeInfo = book.volumeInfo;
        const bookElement = document.createElement('div');
        bookElement.className = 'book-card';

        // Check if book is already in reading list
        const isBookmarked = readingList.some(item => item.id === book.id);

        bookElement.innerHTML = `
            <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title}">
            <div class="book-info">
                <div class="book-title">${volumeInfo.title || 'Unknown Title'}</div>
                <div class="book-author">${volumeInfo.authors?.join(', ') || 'Unknown Author'}</div>
                <div class="book-date">Published: ${volumeInfo.publishedDate || 'Unknown'}</div>
                <div class="book-summary">${volumeInfo.description?.substring(0, 100) + '...' || 'No description available'}</div>
                <div class="book-actions">
                    <button class="btn ${isBookmarked ? 'btn-secondary' : 'btn-primary'} bookmark-btn" data-id="${book.id}">
                        ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                </div>
            </div>
        `;

        galleryContainer.appendChild(bookElement);
    });

    // Add event listeners to bookmark buttons
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', handleBookmarkClick);
    });
}

// Handle bookmark button click
function handleBookmarkClick(event) {
    const bookId = event.target.getAttribute('data-id');
    const book = booksData.find(item => item.id === bookId);
    
    const isAlreadyBookmarked = readingList.some(item => item.id === bookId);
    
    if (isAlreadyBookmarked) {
        // Book is already in reading list, show a message
        alert('This book is already in your reading list');
    } else {
        // Add book to reading list
        readingList.push(book);
        saveToLocalStorage();
        
        // Update button
        event.target.textContent = 'Bookmarked';
        event.target.classList.remove('btn-primary');
        event.target.classList.add('btn-secondary');
    }
}

// Genre filter handling
function setupGenreFilter() {
    const genreFilter = document.getElementById('genre-filter');
    genreFilter.addEventListener('change', () => {
        fetchBooks(genreFilter.value);
    });
}

// Initialize the application
function init() {
    loadFromLocalStorage();
    fetchBooks(); // Initial books load
    setupGenreFilter();
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 

// Home Page JS code 

// Global variables
let allBooks = [];
const BOOKS_PER_PAGE = 40; // Google Books API max per request
const TOTAL_BOOKS_NEEDED = 200;

// Function to render all books
function renderBooks(books) {
    console.log(`Rendering ${books.length} books`);
    
    let result = document.querySelector('#result');
    
    // Show book count
    let html = `<div class="book-count">Showing ${books.length} books</div>`;
    
    // Create grid for books
    html += '<div class="section books-grid">';
    
    for (let book of books) {
        // Access the volumeInfo from each book
        const volumeInfo = book.volumeInfo || {};
        
        // Check if book is bookmarked (placeholder)
        const isBookmarked = localStorage.getItem(`bookmark-${book.id}`) === 'true';
        
        html += `<div class="book-card">
            <img class="book-cover" src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" alt="Cover of ${volumeInfo.title || 'Book cover'}">
            <div class="book-info">
                <div class="book-title">${volumeInfo.title || 'Unknown Title'}</div>
                <div class="book-author">${volumeInfo.authors?.join(', ') || 'Unknown Author'}</div>
                <div class="book-date">Published: ${volumeInfo.publishedDate || 'Unknown'}</div>
                <div class="book-summary">${volumeInfo.description ? volumeInfo.description.substring(0, 100) + '...' : 'No description available'}</div>
                <div class="book-actions">
                    <button class="btn ${isBookmarked ? 'btn-secondary' : 'btn-primary'} bookmark-btn" data-id="${book.id}">
                        ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                </div>
            </div>
        </div>`; 
    }
    
    
    html += '</div>'; // Close books-grid
    
    result.innerHTML = html;
    
    // Add event listeners to bookmark buttons
    setupBookmarkButtons();
}


// Function to setup bookmark button click handlers
function setupBookmarkButtons() {
    const bookmarkButtons = document.querySelectorAll('.bookmark-btn');
    bookmarkButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookId = this.dataset.id;
            const isCurrentlyBookmarked = localStorage.getItem(`bookmark-${bookId}`) === 'true';
            
            // Toggle bookmark status
            if (isCurrentlyBookmarked) {
                localStorage.removeItem(`bookmark-${bookId}`);
                this.textContent = 'Bookmark';
                this.classList.replace('btn-secondary', 'btn-primary');
            } else {
                localStorage.setItem(`bookmark-${bookId}`, 'true');
                this.textContent = 'Bookmarked';
                this.classList.replace('btn-primary', 'btn-secondary');
            }
        });
    });
}

// Function to fetch books with pagination
async function fetchBooksPage(query, startIndex, maxResults) {
    try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&startIndex=${startIndex}&maxResults=${maxResults}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
}

// Function to fetch all needed books
async function fetchAllBooks() {
    const queries = ['programming', 'javascript', 'html', 'css', 'web development']; // Multiple topics for variety
    const loadingMessage = document.querySelector('#result');
    loadingMessage.innerHTML = '<div class="loading">Loading books... Please wait.</div>';
    
    allBooks = [];
    
    // Loop through queries until we have enough books
    for (let i = 0; i < queries.length && allBooks.length < TOTAL_BOOKS_NEEDED; i++) {
        const query = queries[i];
        let startIndex = 0;
        
        while (allBooks.length < TOTAL_BOOKS_NEEDED) {
            const newBooks = await fetchBooksPage(query, startIndex, BOOKS_PER_PAGE);
            
            if (newBooks.length === 0) {
                // No more results for this query, try next query
                break;
            }
            
            // Filter out duplicates based on book ID
            const uniqueNewBooks = newBooks.filter(newBook => 
                !allBooks.some(existingBook => existingBook.id === newBook.id)
            );
            
            allBooks = [...allBooks, ...uniqueNewBooks];
            
            // Show progress to user
            loadingMessage.innerHTML = `<div class="loading">Loading books... ${Math.min(allBooks.length, TOTAL_BOOKS_NEEDED)} of ${TOTAL_BOOKS_NEEDED}</div>`;
            
            if (allBooks.length >= TOTAL_BOOKS_NEEDED) {
                break;
            }
            
            // Prepare for next page
            startIndex += BOOKS_PER_PAGE;
        }
    }
    
    // Limit to exactly 100 books
    allBooks = allBooks.slice(0, TOTAL_BOOKS_NEEDED);
    
    // Render the books
    renderBooks(allBooks);
}

// Handle search functionality
document.getElementById('search-button').addEventListener('click', function() {
    const searchTerm = document.getElementById('search-input').value.trim();
    if (searchTerm) {
        searchBooks(searchTerm);
    } else {
        // If search is empty, show all books
        renderBooks(allBooks);
    }
});

// Search function
async function searchBooks(query) {
    const result = document.querySelector('#result');
    result.innerHTML = '<div class="loading">Searching for books... Please wait.</div>';
    
    try {
        const books = await fetchBooksPage(query, 0, BOOKS_PER_PAGE);
        if (books.length === 0) {
            result.innerHTML = `<div class="book-count">No books found for "${query}"</div>`;
        } else {
            renderBooks(books);
        }
    } catch (error) {
        console.error('Error searching books:', error);
        result.innerHTML = '<div class="loading">Error searching books. Please try again.</div>';
    }
}

// Start fetching books when the page loads
window.addEventListener('DOMContentLoaded', fetchAllBooks);
