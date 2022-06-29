import {
  Controller,
  Get,
  Query,
  Param,
  Body,
  HttpCode,
  Post
} from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('/browse')
  async getData(
    @Query('query') query: string,
    @Query('user_id') userId: number
  ): Promise<any> {
    return await this.appService.getSearchResult(query, userId)
  }

  @Get('/songs/:id')
  async getSong(
    @Param('id') id: number,
  ): Promise<any> {
    return await this.appService.getSong(id)
  }

  @Get('/artists/:id')
  async getArtist(
    @Param('id') id: number,
  ): Promise<any> {
    return await this.appService.getArtist(id)
  }

  @Get('/books/:id')
  async getBook(
    @Param('id') id: number,
  ): Promise<any> {
    return await this.appService.getBook(id)
  }

  @Get('/books/:id/songs')
  async getBookSongs(
    @Param('id') bookId: number,
    @Query('user_id') userId: number
  ): Promise<any> {
    return await this.appService.getBookSongs(bookId, userId)
  }

  @Get('/artists/:id/songs')
  async getArtistSongs(
    @Param('id') artistId: number,
    @Query('user_id') userId: number
  ): Promise<any> {
    return await this.appService.getArtistSongs(artistId, userId)
  }

  @Get('/users/:id/books')
  async getUserBooks(@Param('id') user: number): Promise<any> {
    return await this.appService.getUserBooks(user)
  }

  @Get('/users/:user_id/songs/:song_id/books')
  async getUserSongBooks(
    @Param('user_id') user: number,
    @Param('song_id') song: number
  ): Promise<any> {
    return await this.appService.getUserSongBooks(user, song)
  }

  @Post('/books')
  @HttpCode(201)
  async createBook(@Body() bookDTO: any): Promise<any> {
    return await this.appService.createBook(bookDTO)
  }

  @Post('/songs')
  @HttpCode(201)
  async createSong(@Body() createSongDTO: any): Promise<any> {
    return await this.appService.createSong(createSongDTO)
  }

  @Post('/books_songs')
  @HttpCode(200)
  async changeBooksSongs(@Body() changeBooksSongsDTO: any): Promise<any> {
    return await this.appService.changeBooksSongs(changeBooksSongsDTO)
  }

  // @Post('/books/:book_id/songs/:song_id')
  // @HttpCode(201)
  // async addSongToBook(@Param('book_id') bookId: number, @Param('song_id') songId: number) : Promise<any> {
  //   return await this.appService.addSongToBook(bookId, songId)
  // }

  // @Delete('/books/:book_id/songs/:song_id')
  // async removeSongFromBook(@Param('book_id') bookId: number, @Param('song_id') songId: number) : Promise<any> {
  //   return await this.appService.removeSongFromBook(bookId, songId)
  // }
}
