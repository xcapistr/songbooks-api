import { Injectable, Inject } from '@nestjs/common'
import * as Knex from 'knex'

@Injectable()
export class AppService {
  @Inject('DbConnection')
  knex: Knex

  getHello(): string {
    return 'OH MY CHORD!!!'
  }

  async getSearchResult(query: string): Promise<any> {
    const results: Array<any> = await Promise.all([
      this.knex
        .raw(`SELECT songs.*, artists.name as artist_name, users.username as owner_name
        FROM songs
        JOIN artists ON (songs.artist_id = artists.id)
        JOIN users ON (songs.owner_id = users.id)
        WHERE LOWER(songs.name) LIKE LOWER('${query}%') OR LOWER(songs.name) LIKE LOWER('% ${query}%')`),
      this.knex.raw(`SELECT books.*, 
          COUNT(books_songs.song_id) AS songs_count, 
          users.username AS owner_name
        FROM books 
        LEFT JOIN books_songs ON (books_songs.book_id = books.id)
        LEFT JOIN users ON (books.owner_id = users.id)
        WHERE LOWER(name) LIKE LOWER('${query}%') OR LOWER(name) LIKE LOWER('% ${query}%')
        GROUP BY books.id, users.id;`),
      this.knex.raw(`SELECT artists.*, COUNT(songs.id) as songs_count
        FROM artists
        LEFT JOIN songs ON (artists.id = songs.artist_id)
        WHERE LOWER(artists.name) LIKE LOWER('${query}%') OR LOWER(artists.name) LIKE LOWER('% ${query}%')
        GROUP BY artists.id;`)
    ])
    return {
      songs: results[0].rows,
      books: results[1].rows,
      artists: results[2].rows
    }
  }
}
