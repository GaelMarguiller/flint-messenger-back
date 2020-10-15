import express, { Request, Response, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import connectMongo from 'connect-mongo';
import morgan from 'morgan';
import helmet from 'helmet';
import session from 'express-session';

import { configuration, IConfig } from './config';
import connect from './database';
import generalRoute from './routes/router';
import {
  authenticationInitialize,
  authenticationSession,
} from './controllers/authenticationController';

const MongoStore = connectMongo(session);

export default function createExpressApp(config: IConfig): express.Express {
  const { EXPRESS_DEBUG, SESSION_COOKIE_NAME, SESSION_SECRET } = config;
  const app = express();

  app.use(morgan('combined'));
  app.use(helmet());
  app.use(express.json());
  app.use(session({
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
    }), // Recup connexion from mongoose
    saveUninitialized: false,
    resave: false,
  }));
  app.use(authenticationInitialize());
  app.use(authenticationSession());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err.stack);
    res.status?.(500).send(!EXPRESS_DEBUG ? 'Oups' : err);
  }) as ErrorRequestHandler);

  app.get('/', (req: Request, res: Response) => {
    res.send('This is the boilerplate for Flint Messenger app');
  });
  app.use('/api', generalRoute);

  return app;
}

const config = configuration();
const { PORT } = config;
const app = createExpressApp(config);
// eslint-disable-next-line no-console
connect(config).then(() => app.listen(PORT, () => console.log(`Flint messenger listening at ${PORT}`)));
