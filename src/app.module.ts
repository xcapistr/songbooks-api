import { Module, Inject } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { dbProvider } from './db.provider'
import { Knex } from 'knex'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, dbProvider],
})
export class AppModule {
  @Inject('DbConnection')
  knex: Knex
}
