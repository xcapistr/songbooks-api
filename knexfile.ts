import 'dotenv/config'

const connectionSettings = process.env.DATABASE_URL

export default {
  client: 'pg',
  connection: connectionSettings,
  searchPath: ['songbooks'],

  // TODO research
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 500,
  },
}
