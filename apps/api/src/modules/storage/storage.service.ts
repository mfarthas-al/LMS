import { Injectable } from '@nestjs/common';

/** S3-compatible object storage wrapper (MinIO locally, R2/S3 later). Private bucket + signed URLs only. */
@Injectable()
export class StorageService {}
