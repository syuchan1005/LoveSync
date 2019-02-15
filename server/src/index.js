import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import OAuthServer from 'koa2-oauth-server';
import proxy from 'koa-proxies';
import GraphQL from './GraphQL';
import Database from './Database';
import LocalOAuthModel from './LocalOAuthModel';
// import Serve from 'koa-static';

const db = new Database(`${__dirname}/../../develop.sqlite`);
const graphQL = new GraphQL(`${__dirname}/../scheme.graphqls`, db);

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

app.use(proxy('/', {
  target: 'http://localhost:8080',
}));

db.authenticate()
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Now listen at http://localhost:${port}`);
    });
  });
