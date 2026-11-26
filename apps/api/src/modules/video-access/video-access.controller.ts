import { Controller } from '@nestjs/common';
import { VideoAccessService } from './video-access.service';

@Controller('video-access')
export class VideoAccessController {
  constructor(private readonly videoAccessService: VideoAccessService) {}
}
