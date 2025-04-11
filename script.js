
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