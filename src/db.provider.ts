import * as knex from 'knex'
import knexConfig from '../knexfile'

export const dbProvider = {
  provide: 'DbConnection',
  useFactory: async () => {
    const connection = knex(knexConfig)
    connection.on('query-error', (e: any) => {
      throw new Error(e)
    })
    return connection
  }
}
