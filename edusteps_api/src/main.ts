import { RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './common/interceptors/big-int.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createValidationPipe } from './common/pipes/validation.pipe';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'log', 'debug'],
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: '/uploads/(.*)', method: RequestMethod.ALL }],
  });

  // Root route to prevent 404 on base URL (https://edusteps-981m.onrender.com/)
  app.getHttpAdapter().get('/', (req, res) => {
    res.json({
      status: 'success',
      message: 'InternSteps Backend API is running successfully!',
    });
  });

  // Must be registered BEFORE helmet and ServeStaticModule serves files.
  app.use((req: any, res: any, next: () => void) => {
    if (req.path.startsWith('/uploads/')) {
      const origin = req.headers.origin as string;
      if (origin && (origin.endsWith('.netlify.app') || origin.includes('localhost'))) {
        res.header('Access-Control-Allow-Origin', origin);
      } else if (!origin) {
        res.header('Access-Control-Allow-Origin', '*');
      }
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    }
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024,
    }),
  );

  // BigInt serialization
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  // Dynamic Allowed Origins for Netlify Previews & Production + Localhost
  const allowedOrigins = [
    'https://magenta-douhua-28a513.netlify.app',
    'http://localhost:5173',
    'http://localhost:8082',
    'http://localhost:8081',
  ];

  app.use((req: any, res: any, next: () => void) => {
    const origin = req.headers.origin as string;
    const isAllowed = origin && (allowedOrigins.includes(origin) || origin.endsWith('.netlify.app') || origin.includes('localhost'));

    if (req.method === 'OPTIONS') {
      if (isAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      return res.sendStatus(204);
    }
    next();
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.netlify.app') || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(createValidationPipe());
  app.useGlobalInterceptors(new BigIntInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger — development only
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('InternSteps API')
      .setDescription('API documentation for InternSteps platform')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
    });
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();