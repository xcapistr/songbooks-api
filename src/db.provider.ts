import * as knex from 'knex'

require('dotenv').config()

const connectionSettings = process.env.DATABASE_URL

const dbConfig = {
  client: 'pg',
  connection: connectionSettings,
  searchPath: ['songbooks'],
  pool: {
    min: 2,
    max: 10
  }
}

export const dbProvider = {
  provide: 'DbConnection',
  useFactory: async () => {
    const connection = knex(dbConfig)
    connection.on('query-error', (e: any) => {
      throw new Error(e)
    })
    return connection
  }
}
