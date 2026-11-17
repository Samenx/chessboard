import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const schema = await fs.readFile(path.join(root, 'schema.sql'), 'utf8');
const seedBooks = [
  { id:'vienna', title:'1.e4 Gotham Style Part 1: The Vienna', author:'IM Levy Rozman', category:'Openings', level:'Beginner', price:24.99, listPrice:34.99, cover:'cover-vienna', duration:'3h 20m', objectives:['Build a confident response to 1...e5','Recognize when f4 is strongest','Meet Black’s most common setups'], description:'A practical, attacking repertoire built around the Vienna Game. Learn the ideas behind 1.e4 e5 2.Nc3 and turn an early f-pawn push into a lasting initiative.', keyLessons:[
    { title:'A knight before the storm', body:'The Vienna Game begins with 1.e4 e5 2.Nc3. White develops a knight while keeping the f-pawn free. That small detail gives the opening its character: flexible development with the option to challenge e5 directly.', pgn:'1. e4 e5 2. Nc3', keyIdea:'The Vienna is a natural home for players who want open positions without memorizing a maze of theory.' },
    { title:'Open the f-file', body:'With 3.f4, White immediately challenges Black’s central pawn. After 3...exf4, the pawn is a price paid for quick development and pressure on the kingside.', pgn:'1. e4 e5 2. Nc3 Nf6 3. f4', keyIdea:'The gambit is a practical weapon: space and development are your compensation.' },
    { title:'Develop with tempo', body:'After 1.e4 e5 2.Nc3 Nf6 3.f4, Black has accepted the challenge. White should use the open f-file and bring pieces out quickly.', pgn:'1. e4 e5 2. Nc3 Nf6 3. f4 exf4 4. Nf3', keyIdea:'Natural moves are strongest when they come with a concrete idea.' }
  ]},
  { id:'endgame', title:'The Practical Endgame', author:'GM Dr. Karsten Müller', category:'Endgames', level:'Intermediate', price:29.99, cover:'cover-endgame', duration:'4h 10m', description:'Turn technical positions into points with a clear, repeatable endgame method.' },
  { id:'strategy', title:'Plans, Not Moves', author:'GM Judit Polgár', category:'Strategy', level:'Intermediate', price:19.99, cover:'cover-strategy', duration:'2h 45m', description:'Learn to evaluate pawn structures and build plans that make sense of every move.' },
  { id:'tactics', title:'Tactical Vision', author:'FM Anna Cramling', category:'Tactics', level:'Beginner', price:14.99, cover:'cover-tactics', duration:'2h 05m', description:'Sharpen pattern recognition with a guided tour of forks, pins, and mating nets.' },
  { id:'caro', title:'The Caro-Kann: Solid & Active', author:'GM Alexey Dreev', category:'Openings', level:'Advanced', price:22.99, cover:'cover-caro', duration:'3h 55m', description:'A complete repertoire for Black, focused on active piece play and reliable structures.' },
  { id:'middlegame', title:'The Art of Attack', author:'GM Mikhail Tal', category:'Middlegame', level:'Advanced', price:27.99, cover:'cover-attack', duration:'5h 30m', description:'Learn to recognize the conditions that make a kingside attack work.' },
];

try {
  await pool.query(schema);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM books');
  if (rows[0].count === 0) {
    for (const book of seedBooks) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO books (id,title,author,description,category,level,price,list_price,cover,duration,objectives,status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'published')`, [book.id,book.title,book.author,book.description,book.category,book.level,book.price,book.listPrice||null,book.cover,book.duration,JSON.stringify(book.objectives||[])]);
        const chapterTitles = book.id === 'vienna' ? ['Introduction to the Vienna','Understanding the Vienna Gambit','Black’s Main Responses'] : ['Foundations','Core ideas','Practical positions'];
        for (let i=0;i<chapterTitles.length;i++) {
          const chapter = await client.query('INSERT INTO chapters (book_id,title,position) VALUES ($1,$2,$3) RETURNING id', [book.id,chapterTitles[i],i]);
          const lessons = book.id === 'vienna' ? [book.keyLessons[i]] : [{title:`${chapterTitles[i]}: a first look`,body:book.description,pgn:'',keyIdea:'Build a plan from the position.'}];
          for (let j=0;j<lessons.length;j++) {
            const l=lessons[j];
            await client.query('INSERT INTO lessons (chapter_id,title,body,pgn,key_idea,position) VALUES ($1,$2,$3,$4,$5,$6)', [chapter.rows[0].id,l.title,l.body,l.pgn,l.keyIdea,j]);
          }
        }
        await client.query('COMMIT');
      } catch(error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    }
  }
  console.log('Database schema is ready.');
} catch (error) {
  console.error('Database setup failed:', error.message);
  console.error('Check that PostgreSQL is running and DATABASE_URL in .env points to chessboard_press.');
  process.exitCode=1;
} finally { await pool.end(); }
