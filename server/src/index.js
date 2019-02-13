import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import Router from 'koa-router';
// import Csrf from 'koa-csrf';
// import Serve from 'koa-static';

import GraphQL from './GraphQL';

const graphQL = new GraphQL(`${__dirname}/../scheme.graphqls`);

const app = new Koa();

app.use(BodyParser());
// app.use(new Csrf());

const router = Router();

router.get('/test', (ctx) => {
  ctx.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

graphQL.middleware(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Now listen at http://localhost:${port}`);
});
