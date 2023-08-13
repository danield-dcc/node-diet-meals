import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.text('meal').notNullable()
    table.text('description').notNullable()
    table.date('date').notNullable()
    table.dateTime('time').notNullable()
    table.boolean('belongs_to_diet').defaultTo(false)
    table
      .integer('author')
      .unsigned()
      .index()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
