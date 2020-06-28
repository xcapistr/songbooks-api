import { Injectable, Inject } from '@nestjs/common'
import * as Knex from 'knex'

@Injectable()
export class AppService {
  @Inject('DbConnection')
  knex: Knex

  getHello(): string {
    return 'OH MY CHORD!!!'
  }

  async getSearchResult(query: string, userId: number): Promise<any> {
    const results: Array<any> = await Promise.all([
      this.knex.raw(`
        SELECT songs.*, artists.name as "artistName", users.username as "ownerName", 
          CASE WHEN user_songs.song_id IS NULL
          THEN false
          ELSE true
          END AS imported
        FROM songs
        JOIN artists ON (songs.artist = artists.id)
        JOIN users ON (songs.owner = users.id)
        LEFT JOIN (SELECT DISTINCT(books_songs.song_id) AS song_id
            FROM books_songs
            JOIN users_books USING(book_id)
            WHERE user_id = ${userId}) AS user_songs
            ON (songs.id = user_songs.song_id)
        WHERE LOWER(songs.name) LIKE LOWER('${query}%') OR LOWER(songs.name) LIKE LOWER('${query}%')
      `),
      this.knex.raw(`
        SELECT books.*, 
          COUNT(books_songs.song_id) AS "songsCount", 
          users.username AS "ownerName",
          CASE WHEN user_books.book_id IS NULL
            THEN false
            ELSE true
          END AS imported
        FROM books 
        LEFT JOIN books_songs ON (books_songs.book_id = books.id)
        LEFT JOIN users ON (books.owner = users.id)
        LEFT JOIN (
          SELECT users_books.book_id
          FROM users_books
          WHERE user_id = ${userId}
        ) AS user_books ON (books.id = user_books.book_id)
        WHERE LOWER(name) LIKE LOWER('${query}%') OR LOWER(name) LIKE LOWER('% ${query}%')
        GROUP BY books.id, users.id, user_books.book_id
      `),
      this.knex.raw(`
        SELECT artists.*, COUNT(songs.id) as "songsCount"
        FROM artists
        LEFT JOIN songs ON (artists.id = songs.artist)
        WHERE LOWER(artists.name) LIKE LOWER('${query}%') OR LOWER(artists.name) LIKE LOWER('% ${query}%')
        GROUP BY artists.id
      `)
    ])
    return {
      songs: results[0].rows,
      books: results[1].rows,
      artists: results[2].rows
    }
  }

  async getBookSongs(bookId: number, userId: number) {
    return (
      await this.knex.raw(`
        SELECT songs.*,
          artists.name AS "artistName",
          users.username AS "ownerName",
          CASE WHEN user_songs.song_id IS NULL
            THEN false
            ELSE true
          END AS imported
        FROM songs
        JOIN books_songs ON (songs.id = books_songs.song_id)
        JOIN users ON (songs.owner = users.id)
        JOIN artists ON (songs.artist = artists.id)
        LEFT JOIN (SELECT DISTINCT(books_songs.song_id) AS song_id
          FROM books_songs
          JOIN users_books USING(book_id)
          WHERE user_id = ${userId}) AS user_songs
          ON (songs.id = user_songs.song_id)
        WHERE books_songs.book_id = ${bookId}
      `)
    ).rows
  }

  async getArtistSongs(artistId: number, userId: number) {
    return (
      await this.knex.raw(`
        SELECT songs.*,
          artists.name AS "artistName",
          users.username AS "ownerName",
          CASE WHEN user_songs.song_id IS NULL
            THEN false
            ELSE true
          END AS imported
        FROM songs
        JOIN users ON (songs.owner = users.id)
        JOIN artists ON (songs.artist = artists.id)
        LEFT JOIN (SELECT DISTINCT(books_songs.song_id) AS song_id
            FROM books_songs
            JOIN users_books USING(book_id)
            WHERE user_id = ${userId}) AS user_songs
            ON (songs.id = user_songs.song_id)
        WHERE songs.artist = ${artistId}
      `)
    ).rows
  }

  async getUserBooks(user: number) {
    return (
      await this.knex.raw(`
        SELECT books.*,
          users.username AS "ownerName",
          COUNT(books_songs.song_id) AS "songsCount"
        FROM books
        JOIN users ON (books.owner = users.id)
        LEFT JOIN books_songs ON (books.id = books_songs.book_id)
        JOIN users_books ON (books.id = users_books.book_id)
        WHERE users_books.user_id = ${user}
        GROUP BY books.id, users.id
      `)
    ).rows
  }

  async createBook(book: any) {
    return await this.knex.transaction(async trx => {
      const newBooks = await this.knex('books')
        .insert(
          {
            name: book.name,
            image: book.image,
            owner: book.owner,
            private: book.private,
            stars: 0,
            votes: 0
          },
          '*'
        )
        .transacting(trx)

      await this.knex('users_books')
        .insert({
          user_id: book.owner,
          book_id: newBooks[0].id
        })
        .transacting(trx)
      console.log('New book has been created with ID:', newBooks[0].id)
      return newBooks[0]
    })
  }

  async createSong(createSongDTO: any) {
    return await this.knex.transaction(async trx => {
      // search for artist id
      const artists: Array<any> = await this.knex('artists').whereRaw(
        `LOWER(name) = '${createSongDTO.artistName.toLowerCase()}'`
      )

      // create artist if doesn't exist
      let artistId
      if (artists.length) {
        artistId = artists[0].id
      } else {
        artistId = (
          await this.knex('artists')
            .insert({ name: createSongDTO.artistName }, 'id')
            .transacting(trx)
        )[0]
      }

      // insert song
      const newSongs = await this.knex('songs')
        .insert(
          {
            name: createSongDTO.name,
            text: createSongDTO.text,
            artist: artistId,
            owner: createSongDTO.owner,
            private: createSongDTO.private,
            stars: 0,
            votes: 0
          },
          '*'
        )
        .transacting(trx)

      // insert books-songs relation
      await this.knex('books_songs')
        .insert({
          book_id: createSongDTO.bookId,
          song_id: newSongs[0].id
        })
        .transacting(trx)
      console.log('New song has been created with ID:', newSongs[0].id)

      return newSongs[0]
    })
  }

  async getUserSongBooks(userId: number, songId: number) {
    return (
      await this.knex.raw(`
        SELECT books.id, 
          books.name, 
          CASE 
            WHEN books_songs_filtered.book_id IS NULL
            THEN false
            ELSE true
          END AS includes_song
        FROM songbooks.users_books
        JOIN songbooks.books ON (songbooks.users_books.book_id = songbooks.books.id)
        LEFT JOIN (
          SELECT * FROM songbooks.books_songs WHERE song_id = ${songId}
        ) AS books_songs_filtered ON (songbooks.books.id = books_songs_filtered.book_id)
        WHERE user_id = ${userId}
      `)
    ).rows
  }
}
