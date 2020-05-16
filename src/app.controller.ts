import { Controller, Get, Query, Param, Body, HttpCode, Post } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('/browse')
  async getData(@Query('query') query: string): Promise<any> {
    return await this.appService.getSearchResult(query)
  }

  @Get('/books/:id/songs')
  async getBookSongs(@Param('id') book: number): Promise<any> {
    return await this.appService.getBookSongs(book)
  }

  @Get('/artists/:id/songs')
  async getArtistSongs(@Param('id') artist: number): Promise<any> {
    return await this.appService.getArtistSongs(artist)
  }

  @Get('/users/:id/books')
  async getUserBooks(@Param('id') user: number): Promise<any> {
    return await this.appService.getUserBooks(user)
  }

  @Post('/books')
  @HttpCode(201)
  async createBook(@Body() bookDto: any): Promise<any> {
    return await this.appService.createBook(bookDto)
  }

  // TODO: create song
}
