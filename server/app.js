const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const cors = require('@koa/cors');


const app = new Koa()
const router = new Router()

app.use(cors());
app.use(koaBody())

router.get('/', (ctx, next) => {
  ctx.body = 'hello world'
})

router.post('/uploadFile', (ctx, next) => {
  const body = ctx.request.body
  console.log({ body })
  ctx.body = 'hhh'
})

app.use(router.routes())

app.listen(7001)

console.log('http://localhost:7001')
