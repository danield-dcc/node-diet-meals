import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

const newUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

const getUserParamsSchema = z.object({
  id: z.string().uuid(),
})

export async function usersRoutes(app: FastifyInstance) {
  // create one user
  app.post('/', async (request, reply) => {
    const { name, email } = newUserSchema.parse(request.body)

    if (!name || !email) {
      return reply.status(401).send({ msg: 'Name or email missing' })
    }

    const user = await knex('users')
      .insert({
        id: randomUUID(),
        name,
        email,
      })
      .returning('*')

    // se quisermos mostrar o retorno, adicionar depois do parenteses .returning('*')

    return reply.status(201).send({ user })
  })

  // get user
  app.get('/', async () => {
    const users = await knex('users').select('*')

    return { users }
  })

  // update one user
  app.put('/:id', async (request, reply) => {
    const { name, email } = newUserSchema.parse(request.body)

    const { id } = getUserParamsSchema.parse(request.params)

    await knex('users')
      .where({
        id,
      })
      .update({
        name,
        email,
      })

    return reply.status(201).send()
  })

  // get one user
  app.get('/:id', async (request, reply) => {
    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users')
      .where({
        id,
      })
      .returning('*')

    if (!user[0]) {
      return reply.status(404).send({ msg: 'User not Found' })
    }

    return { user }
  })

  // delete one user
  app.delete('/:id', async (request, reply) => {
    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users')
      .where({
        id,
      })
      .returning('*')

    if (!user[0]) {
      return reply.status(404).send({ msg: 'User not Found' })
    }

    await knex('users')
      .where({
        id,
      })
      .del()

    return reply.status(201).send({ msg: 'user deleted' })
  })
}
