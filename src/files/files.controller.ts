import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('conversations/:conversationId/upload')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.filesService.uploadFile(file, user.id);

    return {
      success: true,
      file: {
        url: result.url,
        filename: result.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    };
  }
}
