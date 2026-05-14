import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Book, BooksResponse, BookResponse, CreateBookDTO, UpdateBookDTO } from '../interfaces/book.model';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Signal state for books
  readonly books = signal<Book[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // GET ALL BOOKS
  fetchBooks(): Observable<Book[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<BooksResponse>(`${this.apiUrl}/api/books`).pipe(
      map(response => response.data || []),
      tap({
        next: (books) => {
          this.books.set(books);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.error || 'No se pudieron cargar los libros');
          this.loading.set(false);
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  // GET SINGLE BOOK
  getBookById(id: number | string): Observable<Book> {
    return this.http.get<BookResponse>(`${this.apiUrl}/api/books/${id}`).pipe(
      map(response => response.data)
    );
  }

  // CREATE BOOK
  createBook(book: CreateBookDTO): Observable<Book> {
    return this.http.post<BookResponse>(`${this.apiUrl}/api/books`, book).pipe(
      map(response => response.data),
      tap((newBook) => {
        // Update local signal state
        this.books.update(books => [...books, newBook]);
      })
    );
  }

  // UPDATE BOOK
  updateBook(id: number | string, book: UpdateBookDTO): Observable<Book> {
    return this.http.patch<BookResponse>(`${this.apiUrl}/api/books/${id}`, book).pipe(
      map(response => response.data),
      tap((updatedBook) => {
        // Update local signal state
        this.books.update(books => 
          books.map(b => b.id === updatedBook.id ? updatedBook : b)
        );
      })
    );
  }

  // DELETE BOOK
  deleteBook(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/books/${id}`).pipe(
      tap(() => {
        // Update local signal state
        this.books.update(books => books.filter(b => b.id != id));
      })
    );
  }
}
