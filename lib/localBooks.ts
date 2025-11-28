import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalBook } from './local-books-type';

const BOOKS_KEY = 'LOCAL_BOOKS';

export async function getLocalBooks(): Promise<LocalBook[]> {
  const data = await AsyncStorage.getItem(BOOKS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveLocalBook(book: LocalBook) {
  const books = await getLocalBooks();
  books.unshift(book);
  await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export async function deleteLocalBook(id: string) {
  const books = await getLocalBooks();
  const filtered = books.filter((b) => b.id !== id);
  await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(filtered));
}
