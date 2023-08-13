import fastify from 'fastify'
import { usersRoutes } from './routes/usersRoutes'
import { mealsRoutes } from './routes/mealsRoutes'
import { env } from './env'
import cookie from '@fastify/cookie'

const app = fastify()

app.register(cookie)

// routes
app.register(usersRoutes, {
  prefix: 'user',
})

app.register(mealsRoutes, {
  prefix: 'meals',
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP Server Running on port 3333!')
  })
