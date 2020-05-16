import { Controller, Get, Query } from '@nestjs/common'
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
}
