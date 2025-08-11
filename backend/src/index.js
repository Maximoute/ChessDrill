import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { db } from './db.js';
import { exercises } from './schema.js';
import { eq, desc } from 'drizzle-orm';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_,res)=>res.json({ ok: true }));

app.get('/api/exercises', async (_,res)=>{
  const rows = await db.select().from(exercises).orderBy(desc(exercises.id));
  res.json(rows);
});

app.get('/api/exercises/:id', async (req,res)=>{
  const id = Number(req.params.id);
  const [row] = await db.select().from(exercises).where(eq(exercises.id, id));
  if (!row) return res.status(404).json({ ok:false, error:'Not found' });
  res.json(row);
});

app.post('/api/exercises', async (req,res)=>{
  const { startFen, endFen, explanation = '', solutionMoves } = req.body || {};
  if (!startFen || !endFen || !solutionMoves) return res.status(400).json({ ok:false, error:'Missing fields' });
  const [inserted] = await db.insert(exercises).values({ startFen, endFen, explanation, solutionMoves }).returning();
  res.status(201).json(inserted);
});

app.put('/api/exercises/:id', async (req,res)=>{
  const id = Number(req.params.id);
  const { startFen, endFen, explanation, solutionMoves } = req.body || {};
  const [updated] = await db.update(exercises)
    .set({ startFen, endFen, explanation, solutionMoves })
    .where(eq(exercises.id, id)).returning();
  if (!updated) return res.status(404).json({ ok:false, error:'Not found' });
  res.json(updated);
});

app.delete('/api/exercises/:id', async (req,res)=>{
  const id = Number(req.params.id);
  await db.delete(exercises).where(eq(exercises.id, id));
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`[api] listening on :${port}`));
