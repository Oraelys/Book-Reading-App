import { Controller, Get, Param } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
  ) {}

  @Get()
  async getBooks() {
    return this.booksService.findAll();
  }

  @Get(':id')
  async getBook(
    @Param('id') id: string,
  ) {
    return this.booksService.findOne(id);
  }
}