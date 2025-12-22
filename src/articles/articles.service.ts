import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleResponseDto } from './dto/article-response.dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(
    authorId: string,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseDto> {
    const article = await this.prisma.article.create({
      data: {
        ...createArticleDto,
        authorId,
        published: createArticleDto.published ?? false,
      },
    });

    return this.mapToResponseDto(article);
  }

  async findAll(
    published?: boolean,
    category?: string,
    skip?: number,
    take?: number,
  ): Promise<ArticleResponseDto[]> {
    const where: any = {};

    if (published !== undefined) {
      where.published = published;
    }

    if (category) {
      where.category = category;
    }

    const articles = await this.prisma.article.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return articles.map((article) => this.mapToResponseDto(article));
  }

  async findOne(id: string): Promise<ArticleResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.mapToResponseDto(article);
  }

  async update(
    id: string,
    userId: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You can only update your own articles');
    }

    const updatedArticle = await this.prisma.article.update({
      where: { id },
      data: updateArticleDto,
    });

    return this.mapToResponseDto(updatedArticle);
  }

  async remove(id: string, userId: string): Promise<void> {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.prisma.article.delete({
      where: { id },
    });
  }

  private mapToResponseDto(article: any): ArticleResponseDto {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      authorId: article.authorId,
      published: article.published,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}

