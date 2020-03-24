const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const cors = require('@koa/cors');

const app = new Koa()
const router = new Router()

const sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, time * 1000);
  });
}

app.use(cors());
app.use(koaBody())

router.get('/', (ctx, next) => {
  ctx.body = 'hello world'
})

let j = 0;

router.post('/uploadFile', async (ctx, next) => {
  const body = ctx.request.body
  console.log({ body })
  await sleep(5);

  if (j % 2) {
    // ctx.status = 500;
  }
  j++;
  ctx.body = 'success'
})


let i = 0;
router.post('/uploadChunk', async (ctx, next) => {
  const body = ctx.request.body
  console.log({ body })
  await sleep(0.3);

  const getId = () => {
    return `${new Date().getTime()}${i++}`;
  };

  if (i % 2) {
    // ctx.status = 500;

  }




  ctx.body = {
    ret: 0,
    msg: "",
    code: null,
    success: true,
    data: { blockId: getId(), md5: `eb082ac604dc42f6775526fe61ab944${i}` }
  }
})

app.use(router.routes())

app.listen(7001)

console.log('http://localhost:7001')
