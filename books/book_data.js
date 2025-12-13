/**
 * Book Data Management Module
 * Manages book storage and retrieval using localStorage
 */

const BOOKS_STORAGE_KEY = 'yul_english_books';

/**
 * Save a book to localStorage
 * @param {Object} bookData - The book data to save
 * @param {string} bookData.id - Unique book identifier
 * @param {string} bookData.title - Book title
 * @param {string} bookData.description - Book description
 * @param {string} bookData.icon - Book icon emoji
 * @param {Array} bookData.story - Story sentences
 * @param {Array} bookData.vocabulary - Vocabulary words
 */
function saveBook(bookData) {
    const books = getAllBooks();

    // Add created date if not exists
    if (!bookData.createdDate) {
        bookData.createdDate = new Date().toISOString();
    }

    // Check if book already exists
    const existingIndex = books.findIndex(b => b.id === bookData.id);

    if (existingIndex >= 0) {
        // Update existing book
        books[existingIndex] = bookData;
    } else {
        // Add new book
        books.push(bookData);
    }

    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
    return true;
}

/**
 * Get all books from localStorage
 * @returns {Array} Array of book objects
 */
function getAllBooks() {
    const stored = localStorage.getItem(BOOKS_STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Error parsing books data:', e);
        return [];
    }
}

/**
 * Get a specific book by ID
 * @param {string} bookId - The book ID to retrieve
 * @returns {Object|null} The book object or null if not found
 */
function getBook(bookId) {
    const books = getAllBooks();
    return books.find(b => b.id === bookId) || null;
}

/**
 * Delete a book from localStorage
 * @param {string} bookId - The book ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
function deleteBook(bookId) {
    const books = getAllBooks();
    const filteredBooks = books.filter(b => b.id !== bookId);

    if (filteredBooks.length === books.length) {
        return false; // Book not found
    }

    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(filteredBooks));

    // Also delete progress data for this book
    localStorage.removeItem(`book_progress_${bookId}`);

    return true;
}

/**
 * Check if a book ID already exists
 * @param {string} bookId - The book ID to check
 * @returns {boolean} True if exists, false otherwise
 */
function bookExists(bookId) {
    return getBook(bookId) !== null;
}
