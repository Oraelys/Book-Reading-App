// lib/localBooks.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalBook } from './local-books-type';

const STORAGE_KEY = '@local_books';

export const getLocalBooks = async (): Promise<LocalBook[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      console.log('No books found in storage');
      return [];
    }
    const books = JSON.parse(data);
    // console.log('Loaded books from storage:', books.length);
    return books;
  } catch (error) {
    console.error('Error loading books:', error);
    return [];
  }
};

export const saveLocalBook = async (book: LocalBook): Promise<void> => {
  try {
    const books = await getLocalBooks();
    const existingIndex = books.findIndex((b) => b.id === book.id);
    
    if (existingIndex >= 0) {
      // Update existing book
      books[existingIndex] = book;
      console.log('Updated existing book:', book.title);
    } else {
      // Add new book
      books.push(book);
      console.log('Added new book:', book.title);
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (error) {
    console.error('Error saving book:', error);
    throw error;
  }
};

export const deleteLocalBook = async (id: string): Promise<void> => {
  try {
    const books = await getLocalBooks();
    const filtered = books.filter((b) => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('Deleted book with ID:', id);
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

export const getLocalBookById = async (id: string): Promise<LocalBook | null> => {
  try {
    const books = await getLocalBooks();
    const book = books.find((b) => b.id === id);
    if (book) {
      console.log('Found book:', book.title);
    } else {
      console.log('Book not found with ID:', id);
    }
    return book || null;
  } catch (error) {
    console.error('Error getting book by ID:', error);
    return null;
  }
};