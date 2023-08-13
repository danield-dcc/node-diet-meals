import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

const mealSchema = z.object({
  meal: z.string(),
  description: z.string(),
  belongsToDiet: z.boolean().default(false),
  author: z.string(),
})

const getMealParamsSchema = z.object({
  id: z.string().uuid(),
})

export async function mealsRoutes(app: FastifyInstance) {
  // create one meal
  app.post('/', async (request, reply) => {
    const { meal, description, author, belongsToDiet } = mealSchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    const newMeal = await knex('meals')
      .insert({
        id: randomUUID(),
        meal,
        description,
        author,
        belongs_to_diet: belongsToDiet,
        date: knex.fn.now(),
        time: knex.fn.now(),
        session_id: sessionId,
      })
      .returning('*')

    return reply.status(201).send({ newMeal })
  })

  // get all meals and his author
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists], // middleware
    },
    async (request) => {
      const { sessionId } = request.cookies

      const meals = await knex('meals')
        .select()
        .from('meals')
        .leftJoin('users', 'meals.author', 'users.id')
        .where('meals.session_id', sessionId)
        .select('*', 'meals.session_id')

      return meals
    },
  )

  // get total metrics
  app.get(
    '/total',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const totalMeals = await knex('meals')
        .select()
        .andWhere('meals.session_id', sessionId)

      const insideDietMeals = await knex('meals')
        .where({
          belongs_to_diet: true,
        })
        .andWhere('meals.session_id', sessionId)

      const notInsideDietMeals = await knex('meals')
        .where({
          belongs_to_diet: false,
        })
        .andWhere('meals.session_id', sessionId)

      const countOfSequentialDietMeals = []
      let totalMealsBelongingToDiet = 0

      for (let i = 0; i < totalMeals.length; i++) {
        if (
          totalMeals[i].belongs_to_diet === true ||
          (totalMeals[i].belongs_to_diet as any) === 1
        ) {
          totalMealsBelongingToDiet++
        } else {
          countOfSequentialDietMeals.push(totalMealsBelongingToDiet)
          totalMealsBelongingToDiet = 0
        }
      }
      countOfSequentialDietMeals.push(totalMealsBelongingToDiet)

      const result = {
        totalMeals: totalMeals.length,
        insideDietMeals: insideDietMeals.length,
        notInsideDietMeals: notInsideDietMeals.length,
        bestSequencieOfMeals: countOfSequentialDietMeals.sort(function (a, b) {
          return b - a
        })[0],
      }

      return result
    },
  )

  // update one meal
  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { author, belongsToDiet, description, meal } = mealSchema.parse(
        request.body,
      )

      const { id } = getMealParamsSchema.parse(request.params)

      const user = await knex('meals')
        .where({
          id,
        })
        .returning('*')

      if (!user[0]) {
        return reply.status(404).send({ msg: 'Meal not Found' })
      }

      try {
        await knex('meals')
          .where({
            id,
          })
          .update({
            author,
            belongs_to_diet: belongsToDiet,
            description,
            meal,
            updated_at: knex.fn.now(),
          })
      } catch (error) {
        return reply.status(404).send({ msg: error })
      }

      return reply.status(201).send()
    },
  )

  // get one meal
  app.get('/:id', async (request, reply) => {
    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals')
      .where({
        id,
      })
      .returning('*')

    if (!meal[0]) {
      return reply.status(404).send({ msg: 'Meal Not Found' })
    }

    return { meal }
  })

  // delete one meal
  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { id } = getMealParamsSchema.parse(request.params)

      try {
        await knex('meals')
          .where({
            id,
          })
          .del()
      } catch (error) {
        return reply.status(404).send({ msg: error })
      }

      return reply.status(201).send({ msg: 'meal deleted' })
    },
  )
}
