export interface Book {
  id: number;
  title: string;
  author: string;
  description?: string;
  category?: string;
  stock: number;
  price: number;
  status: boolean;
  image_url?: string;
}

export interface CreateBookDTO {
  title: string;
  author: string;
  description?: string;
  category?: string;
  stock: number;
  price: number;
  status: boolean;
  logoDataUri?: string;
}

export type UpdateBookDTO = Partial<CreateBookDTO>;

export interface BookResponse {
  data: Book;
  message?: string;
}

export interface BooksResponse {
  data: Book[];
  message?: string;
}
