CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  start_fen TEXT NOT NULL,
  end_fen   TEXT NOT NULL,
  explanation TEXT,
  solution_moves TEXT NOT NULL
);
