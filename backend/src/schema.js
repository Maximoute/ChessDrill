import { pgTable, serial, text } from 'drizzle-orm/pg-core';
export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  startFen: text('start_fen').notNull(),
  endFen: text('end_fen').notNull(),
  explanation: text('explanation'),
  solutionMoves: text('solution_moves').notNull()
});
