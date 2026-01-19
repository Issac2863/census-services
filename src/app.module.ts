import { Module } from '@nestjs/common';
import { CensusController } from './census.controller';
import { CensusService } from './census.service';

@Module({
  imports: [],
  controllers: [CensusController],
  providers: [CensusService],
})
export class AppModule { }
