import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookService } from '../../../../services/book.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './book-form.html',
  styleUrl: './book-form.css'
})
export class BookForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  bookId: number | null = null;
  isSubmitting = false;
  errorMsg: string | null = null;
  
  // Image handling
  isProcessingImage = false;
  imagePreview: string | null = null;
  dragOver = false;

  form = this.fb.group({
    title: ['', Validators.required],
    author: ['', Validators.required],
    category: ['', Validators.maxLength(100)],
    description: [''],
    stock: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    status: [true],
    logoDataUri: ['']
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bookId = Number(id);
        this.loadBook(this.bookId);
      }
    });
  }

  loadBook(id: number) {
    this.bookService.getBookById(id).subscribe({
      next: (book) => {
        this.form.patchValue(book);
        if (book.image_url) {
          this.imagePreview = book.image_url;
        }
      },
      error: () => {
        this.errorMsg = 'Error al cargar los datos del libro.';
      }
    });
  }

  // --- Image Handling Logic ---
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.form.controls.logoDataUri.setValue('');
    this.cdr.detectChanges();
  }

  private async processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.errorMsg = 'Formato no válido. Debe ser una imagen.';
      this.cdr.detectChanges();
      return;
    }

    this.isProcessingImage = true;
    this.errorMsg = null;
    this.cdr.detectChanges();

    try {
      const MAX_SIZE_BYTES = 1048576; // 1MB
      let dataUri: string;

      if (file.size > MAX_SIZE_BYTES) {
        dataUri = await this.resizeAndCompressImage(file, 1024, 0.8);
      } else {
        dataUri = await this.fileToDataUri(file);
      }

      this.imagePreview = dataUri;
      this.form.controls.logoDataUri.setValue(dataUri);
    } catch (error) {
      this.errorMsg = 'No se pudo procesar la imagen.';
    } finally {
      this.isProcessingImage = false;
      this.cdr.detectChanges();
    }
  }

  private fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  private resizeAndCompressImage(file: File, maxWidthHeight: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio keeping max dimensions
        if (width > height) {
          if (width > maxWidthHeight) {
            height = Math.round((height * maxWidthHeight) / width);
            width = maxWidthHeight;
          }
        } else {
          if (height > maxWidthHeight) {
            width = Math.round((width * maxWidthHeight) / height);
            height = maxWidthHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('No context');
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP for better compression
        const dataUri = canvas.toDataURL('image/webp', quality);
        resolve(dataUri);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = (e) => {
        reject(e);
        URL.revokeObjectURL(img.src);
      };
    });
  }
  // ---------------------------

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = null;
    
    // Clean up empty logoDataUri string to avoid sending empty string on edit
    const formData = { ...this.form.value };
    if (!formData.logoDataUri) {
      delete formData.logoDataUri;
    }

    const request$ = this.bookId 
      ? this.bookService.updateBook(this.bookId, formData as any)
      : this.bookService.createBook(formData as any);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/dashboard/books']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMsg = err.error?.error || 'Error al guardar el libro.';
      }
    });
  }
}
