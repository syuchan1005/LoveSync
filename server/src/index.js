import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import OAuthServer from 'koa2-oauth-server';
import Serve from 'koa-static';
import proxy from 'koa-proxies';

import GraphQL from './GraphQL';
import Database from './Database';
import LocalOAuthModel from './LocalOAuthModel';

const db = new Database(process.env.NODE_ENV === 'production' ? `${__dirname}/../production.sqlite` : `${__dirname}/../../development.sqlite`);
const graphQL = new GraphQL(process.env.NODE_ENV === 'production' ? `${__dirname}/../server/scheme.graphqls` : `${__dirname}/../scheme.graphqls`, db);

const app = new Koa();

app.oauth = new OAuthServer({
  model: new LocalOAuthModel({
    id: 'lovesync',
    secret: 'lovesync_secret',
  }, db),
  accessTokenLifetime: 7200, // 2 hours
  refreshTokenLifetime: 1209600, // 2 weeks
});

app.use(BodyParser());

const router = Router();
const apiRouter = Router();

apiRouter.post('/token', app.oauth.token());

router.use('/api', apiRouter.routes(), apiRouter.allowedMethods());

app.use(router.routes());
app.use(router.allowedMethods());

graphQL.middleware(app);

if (process.env.NODE_ENV === 'production') {
  app.use(async (ctx, next) => {
    if (['/home', '/setting'].includes(ctx.url)) ctx.url = '/';
    await next();
  });
  app.use(Serve(`${__dirname}/../dist`));
} else {
  app.use(proxy('/', {
    target: 'http://localhost:8080',
  }));
}

db.authenticate()
  .then(() => {
    const port = process.env.PORT || 3000;
    const httpServer = app.listen(port, () => {
      console.log(`Now listen at http://localhost:${port}`);
    });
    graphQL.subscription(httpServer);
  });
