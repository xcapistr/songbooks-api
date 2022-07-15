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

  async getSong(id: number) {
    return (
      await this.knex.raw(`
      SELECT songs.* , artists.name AS "artistName", users.username AS "ownerName" 
      FROM songs
      JOIN artists ON (artists.id = songs.artist)
      JOIN users ON (users.id = songs.owner)
      WHERE songs.id = ${id}
    `)
    ).rows[0]
  }

  async getArtist(id: number) {
    const results: Array<any> = await Promise.all([
      this.knex('artists')
        .where({
          id: id
        })
        .first(),
      this.knex.raw(`
        SELECT songs.*, users.username AS "ownerName"
        FROM songs
        JOIN users ON (users.id = songs.owner)
        WHERE songs.artist = ${id}
      `)
    ])

    return { ...results[0], songs: results[1].rows}
  }

  async getBook(id: number) {
    const results: Array<any> = await Promise.all([
      this.knex.raw(`
          SELECT books.*, users.username AS "ownerName"
          FROM books
          JOIN users ON (users.id = books.owner)
          WHERE books.id = ${id}
        `),
      this.knex.raw(`
        SELECT songs.*, users.username AS "ownerName", artists.name AS "artistName"
        FROM songs
        JOIN books_songs ON (books_songs.song_id = songs.id)
        JOIN users ON (users.id = songs.owner)
        JOIN artists ON (artists.id = songs.artist)
        WHERE books_songs.book_id = ${id}
      `)
    ])
    return { ...results[0].rows[0], songs: results[1].rows}
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
        SELECT DISTINCT(books.id),
          books.name,
          books.image,
          books.private,
          books.stars,
          books.votes,
          users.username AS "ownerName",
          COUNT(books_songs.song_id) AS "songsCount"
        FROM books
          JOIN users ON (books.owner = users.id)
          LEFT JOIN books_songs ON (books.id = books_songs.book_id)
          LEFT JOIN users_books ON (books.id = users_books.book_id)
        WHERE users_books.user_id = ${user} OR books.owner = ${user}
        GROUP BY books.id, users.id
      `)
    ).rows
  }

  async getUserSongs(userId: number) {
    return (await this.knex.raw(`
      SELECT songs.*,
        artists.name AS "artistName",
        string_agg(books.name, ';') AS "bookNames", 
        string_agg(books.name, ';') AS "bookIds"
      FROM songs
        JOIN books_songs ON books_songs.song_id = songs.id
        JOIN books ON books.id = books_songs.book_id
        JOIN users_books ON users_books.book_id = books.id
        JOIN artists ON artists.id = songs.artist
      WHERE users_books.user_id = ${userId}
      GROUP BY songs.id, artists.name
    `)).rows
  }

  async getUserArtists(userId: number) {
    return (await this.knex.raw(`
      SELECT *
      FROM artists
        JOIN users_artists ON users_artists.artist_id = artists.id
      WHERE user_id = ${userId}
    `)).rows
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

  async changeBooksSongs(booksSongsDTO) {
    return await this.knex.transaction(async trx => {
      let response = []
      for (const item of booksSongsDTO) {
        if (item.action === 'insert') {
          const exists =
            (
              await this.knex('books_songs')
                .where({
                  book_id: item.book_id,
                  song_id: item.song_id
                })
                .returning('*')
                .transacting(trx)
            ).length > 0

          console.log(item.book_id, item.song_id, exists)

          if (!exists) {
            const insertedItems = await this.knex('books_songs')
              .insert({
                book_id: item.book_id,
                song_id: item.song_id
              })
              .returning('*')
              .transacting(trx)

            response.push({
              ...insertedItems[0],
              action: 'insert'
            })
          }
        } else if (item.action === 'delete') {
          const deletedItems = await this.knex('books_songs')
            .where({
              book_id: item.book_id,
              song_id: item.song_id
            })
            .del()
            .returning('*')
            .transacting(trx)

          deletedItems.length &&
            response.push({
              ...deletedItems[0],
              action: 'delete'
            })
        }
      }
      return response
    })
  }

  // async addSongToBook(bookId: number, songId: number) {
  //   return await this.knex('books_songs')
  //     .insert({
  //       book_id,
  //       song_id
  //     })
  //     .returning('*')
  // }

  // async removeSongFromBook(bookId: number, songId: number) {
  //   return await this.knex('books_songs')
  //     .where({
  //       book_id,
  //       song_id
  //     })
  //     .del()
  //     .returning('*')
  // }
}
