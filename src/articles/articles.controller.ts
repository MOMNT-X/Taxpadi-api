import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: any,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.create(user.id, createArticleDto);
  }

  @Get()
  async findAll(
    @Query('published') published?: string,
    @Query('category') category?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const publishedBool =
      published === undefined ? undefined : published === 'true';
    const skipNum = skip ? parseInt(skip, 10) : undefined;
    const takeNum = take ? parseInt(take, 10) : undefined;

    return this.articlesService.findAll(publishedBool, category, skipNum, takeNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, user.id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.articlesService.remove(id, user.id);
  }
}


