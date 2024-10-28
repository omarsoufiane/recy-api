import './shared/utils/bigint-polyfill';

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import winston from 'winston';

import { AppModule } from './app.module';
import { winstonLoggerOptions } from './modules/logger/logger.config';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winston.createLogger(winstonLoggerOptions),
  });

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);

  logger.log('Starting application...', 'Bootstrap');

  app.enableVersioning({
    type: VersioningType.URI,
  });
  logger.log('API versioning enabled.', 'Bootstrap');

  const config = new DocumentBuilder()
    .setTitle('Recy Network')
    .setDescription('Recy Network API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const options: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };
  SwaggerModule.setup('docs', app, document, options);
  logger.log('Swagger document configured.', 'Bootstrap');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  logger.log('Global validation pipes enabled.', 'Bootstrap');
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  logger.log('Global expections filters enabled.', 'Bootstrap');

  const port = process.env.PORT || 3333;
  await app.listen(port);
  logger.log(`Application running on port ${port}`, 'Bootstrap');
}

bootstrap();
