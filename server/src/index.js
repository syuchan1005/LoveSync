import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import Session from 'koa-session';
import Router from 'koa-router';
import passport from 'koa-passport';
import { Strategy as LocalStrategy } from 'passport-local';
import proxy from 'koa-proxies';
import GraphQL from './GraphQL';
import Database from './Database';
// import Serve from 'koa-static';

const db = new Database(`${__dirname}/../../develop.sqlite`);
const graphQL = new GraphQL(`${__dirname}/../scheme.graphqls`, db);

const app = new Koa();
app.keys = ['lovesync'];

app.use(BodyParser());
app.use(Session({}, app));

passport.serializeUser((user, done) => {
  if (!user) {
    done('User is undefined', false);
  } else {
    done(null, user.id);
  }
});
passport.deserializeUser(async (id, done) => {
  const user = await db.models.user.findOne({ where: { id } });
  if (!user) {
    done('User not found', false);
  } else {
    done(null, user);
  }
});
passport.use(new LocalStrategy(async (username, password, done) => {
  const user = await db.getUser(username, password);
  if (user) done(null, user);
  else done('User not found', false);
}));
app.use(passport.initialize());
app.use(passport.session());

const router = Router();
const apiRouter = Router();

apiRouter.post('/signin', ctx => passport.authenticate('local', (err, user) => {
  ctx.body = user ? '/home' : err;
  if (user) return ctx.login(user);
  return undefined;
})(ctx));

apiRouter.get('/signout', (ctx) => {
  ctx.logout();
  ctx.body = '/';
});

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
