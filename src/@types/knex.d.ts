// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      email: string
      created_at: string
      session_id?: string
    }
    meals: {
      id: string
      meal: string
      description: string
      date?: Date
      time?: Date
      belongs_to_diet: boolean
      author: string
      created_at: string
      updated_at?: string
      session_id?: string
    }
  }
}
