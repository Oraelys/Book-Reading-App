import {
  Logger,
  ValidationPipe,
} from '@nestjs/common';

import {
  NestFactory,
} from '@nestjs/core';

import {
  AppModule,
} from './app.module';

import {
  HttpExceptionFilter,
} from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger =
    new Logger('Bootstrap');

  const app =
    await NestFactory.create(
      AppModule,
    );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  const port =
    process.env.PORT ?? 3000;

  await app.listen(port);

  logger.log(
    `Inkwell backend is running on port ${port}`,
  );
}

bootstrap();