import { Module } from '@nestjs/common';
import { VideoAccessController } from './video-access.controller';
import { VideoAccessService } from './video-access.service';

@Module({
  controllers: [VideoAccessController],
  providers: [VideoAccessService],
  exports: [VideoAccessService],
})
export class VideoAccessModule {}
