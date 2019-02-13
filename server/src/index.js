import Koa from 'koa';
import Csrf from 'koa-csrf';
import BodyParser from 'koa-bodyparser';
import Router from 'koa-router';
// import Serve from 'koa-static';

const app = new Koa();

app.use(BodyParser());
app.use(new Csrf());

const router = Router();

router.get('/test', (ctx) => {
  ctx.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Now listen at http://localhost:${port}`);
});
