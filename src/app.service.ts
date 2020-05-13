import { Injectable, Inject } from '@nestjs/common';
import * as Knex from 'knex';

@Injectable()
export class AppService {
  @Inject('DbConnection')
  knex: Knex

  getHello(): string {
    return 'Hello World!';
  }

  async getBooks(): Promise<any> {
    return await this.knex('books')
  }
}
