import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookService } from '../../../../services/book.service';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-list.html',
  styleUrl: './book-list.css'
})
export class BookList implements OnInit {
  protected readonly bookService = inject(BookService);

  ngOnInit() {
    this.bookService.fetchBooks().subscribe();
  }

  deleteBook(id: number) {
    if (confirm('SYS: ¿Estás seguro de querer eliminar este registro?')) {
      this.bookService.deleteBook(id).subscribe();
    }
  }
}
