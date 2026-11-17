import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import multer from 'multer';
import { pool } from '../db/pool.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.API_PORT||3001);
const host=process.env.API_HOST||'127.0.0.1';
const paymentsMode=process.env.PAYMENTS_MODE||'disabled';
const scrypt=promisify(scryptCallback);
const mediaDir=path.resolve(root,process.env.MEDIA_DIR||'uploads');
const mediaUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024},fileFilter(_req,file,done){if(/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm))$/.test(file.mimetype))return done(null,true);done(new Error('Upload a JPG, PNG, WebP, GIF, MP4, or WebM file.'))}});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};

function send(res,status,data,headers={}){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers});res.end(JSON.stringify(data));}
async function body(req){let s='';for await(const chunk of req){s+=chunk;if(s.length>6_000_000)throw new Error('Request body too large')}return s?JSON.parse(s):{}}
function sessionToken(req){const raw=req.headers.cookie||'';const value=raw.split(';').map(part=>part.trim()).find(part=>part.startsWith('cbp_session='))?.slice('cbp_session='.length);return value?decodeURIComponent(value):''}
function digestToken(token){return createHash('sha256').update(token).digest('hex')}
async function currentUser(req){const token=sessionToken(req);if(!token)return null;const {rows}=await pool.query('SELECT u.id,u.display_name AS name,u.email,u.role FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()',[digestToken(token)]);return rows[0]||null}
async function issueSession(userId,res){const token=randomBytes(32).toString('base64url');const expires=new Date(Date.now()+30*24*60*60*1000);await pool.query('INSERT INTO user_sessions (user_id,token_hash,expires_at) VALUES ($1,$2,$3)',[userId,digestToken(token),expires]);const secure=process.env.COOKIE_SECURE==='true'?'; Secure':'';res.setHeader('set-cookie',`cbp_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`)}
async function booksList(includeDrafts=false,clientKey='',userId=null){
 const {rows:bookRows}=await pool.query(`SELECT b.*,COUNT(DISTINCT c.id)::int AS chapter_count,EXISTS(SELECT 1 FROM purchases p WHERE p.book_id=b.id AND (($3::uuid IS NOT NULL AND p.user_id=$3::uuid) OR ($3::uuid IS NULL AND p.user_id IS NULL AND p.client_key=$2))) AS is_owned FROM books b LEFT JOIN chapters c ON c.book_id=b.id WHERE b.status <> 'archived' AND ($1::boolean OR b.status='published') GROUP BY b.id ORDER BY b.created_at,b.id`,[includeDrafts,clientKey,userId]);
 const {rows:lessonRows}=await pool.query(`SELECT c.book_id,c.title AS chapter_title,c.position AS chapter_position,l.id AS lesson_id,l.title AS lesson_title,l.body,l.pgn,l.starting_fen,l.key_idea,l.position AS lesson_position FROM chapters c LEFT JOIN lessons l ON l.chapter_id=c.id ORDER BY c.book_id,c.position,l.position`);
 return bookRows.map(b=>{const ls=lessonRows.filter(l=>l.book_id===b.id);const chapters=[...new Map(ls.map(x=>[x.chapter_position,{title:x.chapter_title,position:x.chapter_position,lessons:[]}])).values()];for(const row of ls)if(row.lesson_id){const item={title:row.lesson_title,text:row.body,moves:row.pgn,note:row.key_idea,fen:row.starting_fen};chapters.find(c=>c.position===row.chapter_position)?.lessons.push(item)}return{id:b.id,title:b.title,author:b.author,description:b.description,category:b.category,level:b.level,price:Number(b.price),was:b.list_price==null?null:Number(b.list_price),cover:b.cover,coverImage:b.cover_image,coverType:b.cover_media_type||'image',duration:b.duration,rating:b.rating,reviews:b.review_count,objectives:b.objectives||[],chapters:Number(b.chapter_count),owned:b.is_owned,progress:0,status:b.status,lessons:chapters.flatMap(c=>c.lessons),chapterList:chapters.map(c=>({title:c.title,lessons:c.lessons}))}});
}
function validBookInput(input){return typeof input.title==='string'&&input.title.trim().length>0&&input.title.length<=180}
async function api(req,res,url){
 try{
  if(req.method==='POST'&&url.pathname==='/api/auth/signup'){
   const data=await body(req);const name=String(data.name||'').trim();const email=String(data.email||'').trim().toLowerCase();const password=String(data.password||'');if(name.length<2||name.length>100)return send(res,400,{error:'Name must be between 2 and 100 characters.'});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return send(res,400,{error:'Enter a valid email address.'});if(password.length<8||password.length>200)return send(res,400,{error:'Password must be at least 8 characters.'});const salt=randomBytes(16).toString('hex');const hash=(await scrypt(password,salt,64)).toString('hex');const {rows}=await pool.query('INSERT INTO users (display_name,email,password_salt,password_hash) VALUES ($1,$2,$3,$4) RETURNING id,display_name AS name,email,role',[name,email,salt,hash]);await issueSession(rows[0].id,res);return send(res,201,{user:rows[0]})
  }
  if(req.method==='POST'&&url.pathname==='/api/auth/signin'){
   const data=await body(req);const email=String(data.email||'').trim().toLowerCase(),password=String(data.password||'');if(password.length>200)return send(res,401,{error:'Email or password is incorrect.'});const {rows}=await pool.query('SELECT id,display_name AS name,email,role,password_salt,password_hash FROM users WHERE LOWER(email)=$1',[email]);if(!rows.length)return send(res,401,{error:'Email or password is incorrect.'});const candidate=Buffer.from(await scrypt(password,rows[0].password_salt,64));const stored=Buffer.from(rows[0].password_hash,'hex');if(candidate.length!==stored.length||!timingSafeEqual(candidate,stored))return send(res,401,{error:'Email or password is incorrect.'});const user={id:rows[0].id,name:rows[0].name,email:rows[0].email,role:rows[0].role};await issueSession(user.id,res);return send(res,200,{user})
  }
  if(req.method==='GET'&&url.pathname==='/api/auth/me'){const user=await currentUser(req);return user?send(res,200,{user}):send(res,401,{error:'Sign in required.'})}
  if(req.method==='POST'&&url.pathname==='/api/auth/signout'){const token=sessionToken(req);if(token)await pool.query('DELETE FROM user_sessions WHERE token_hash=$1',[digestToken(token)]);return send(res,200,{ok:true},{'set-cookie':'cbp_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'})}
  if(req.method==='GET'&&url.pathname==='/api/health'){await pool.query('SELECT 1');return send(res,200,{ok:true,database:'connected',paymentsMode})}
  if(req.method==='GET'&&url.pathname==='/api/books'){const user=await currentUser(req);return send(res,200,await booksList(url.searchParams.get('includeDrafts')==='1',url.searchParams.get('clientId')||'',user?.id||null))}
  if(req.method==='POST'&&url.pathname==='/api/books'){
   const data=await body(req);if(!validBookInput(data))return send(res,400,{error:'A book title is required (max 180 characters).'});
   const id=data.id||`book-${randomUUID()}`;
   const {rows}=await pool.query(`INSERT INTO books (id,title,author,description,category,level,price,cover,objectives,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft') RETURNING id`,[id,data.title.trim(),data.author||'',data.description||'',data.category||'Openings',data.level||'Beginner',Math.max(0,Number(data.price)||0),data.cover||'cover-new',JSON.stringify(data.objectives||[])]);
   const order=await pool.query('INSERT INTO chapters (book_id,title,position) VALUES ($1,$2,0) RETURNING id',[id,'Chapter 1']);
   return send(res,201,{id:rows[0].id,chapterId:order.rows[0].id});
  }
  const bookMatch=url.pathname.match(/^\/api\/books\/([^/]+)$/);
  if(req.method==='PATCH'&&bookMatch){
   const data=await body(req);if(data.title!==undefined&&!validBookInput(data))return send(res,400,{error:'Book title is required.'});
   const allowed={title:'title',author:'author',description:'description',category:'category',level:'level',price:'price',cover:'cover',coverImage:'cover_image',coverType:'cover_media_type',objectives:'objectives'};
   const sets=[],values=[];for(const [key,col] of Object.entries(allowed))if(data[key]!==undefined){values.push(data[key]);sets.push(`${col}=$${values.length}`)}
   if(data.status!==undefined){if(!['draft','published','archived'].includes(data.status))return send(res,400,{error:'Invalid book status.'});values.push(data.status);sets.push(`status=$${values.length}`)}
   if(!sets.length)return send(res,400,{error:'No supported changes provided.'});
   values.push(bookMatch[1]);const result=await pool.query(`UPDATE books SET ${sets.join(',')},updated_at=NOW() WHERE id=$${values.length} RETURNING id`,values);
   return result.rowCount?send(res,200,{ok:true}):send(res,404,{error:'Book not found.'});
  }
  const lessonMatch=url.pathname.match(/^\/api\/books\/([^/]+)\/lessons$/);
  if(req.method==='POST'&&lessonMatch){
   const data=await body(req);if(!validBookInput({title:data.title}))return send(res,400,{error:'Lesson title is required.'});
   const client=await pool.connect();try{await client.query('BEGIN');const bookResult=await client.query('SELECT id FROM books WHERE id=$1',[lessonMatch[1]]);if(!bookResult.rowCount){await client.query('ROLLBACK');return send(res,404,{error:'Book not found.'})}
    const chapterTitle=typeof data.chapterTitle==='string'&&data.chapterTitle.trim()?data.chapterTitle.trim():'Chapter 1';
    let chapter=await client.query('SELECT id FROM chapters WHERE book_id=$1 AND title=$2',[lessonMatch[1],chapterTitle]);
    if(!chapter.rowCount){const pos=await client.query('SELECT COALESCE(MAX(position),-1)+1 AS n FROM chapters WHERE book_id=$1',[lessonMatch[1]]);chapter=await client.query('INSERT INTO chapters (book_id,title,position) VALUES ($1,$2,$3) RETURNING id',[lessonMatch[1],chapterTitle,pos.rows[0].n])}
    const pos=await client.query('SELECT COALESCE(MAX(position),-1)+1 AS n FROM lessons WHERE chapter_id=$1',[chapter.rows[0].id]);
    const lesson=await client.query('INSERT INTO lessons (chapter_id,title,body,pgn,starting_fen,key_idea,position) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',[chapter.rows[0].id,data.title,data.text||'',data.pgn||'',data.fen||null,data.note||'',pos.rows[0].n]);
    for(const [ply,explanation] of Object.entries(data.annotations||{}))if(explanation)await client.query('INSERT INTO move_annotations (lesson_id,ply,explanation) VALUES ($1,$2,$3) ON CONFLICT (lesson_id,ply) DO UPDATE SET explanation=EXCLUDED.explanation',[lesson.rows[0].id,Number(ply),explanation]);
    await client.query('COMMIT');return send(res,201,{id:lesson.rows[0].id});
   }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
  }
  const testPaymentMatch=url.pathname.match(/^\/api\/orders\/([^/]+)\/test-payment$/);
  if(req.method==='POST'&&testPaymentMatch){
   if(paymentsMode!=='beta')return send(res,403,{error:'Beta test payments are disabled on this server.'});
   await body(req);
   const user=await currentUser(req);if(!user)return send(res,401,{error:'Sign in before completing checkout.'});
   const client=await pool.connect();try{await client.query('BEGIN');const {rows}=await client.query('SELECT id,order_number,status,subtotal,client_key FROM orders WHERE order_number=$1 AND user_id=$2 FOR UPDATE',[testPaymentMatch[1],user.id]);if(!rows.length){await client.query('ROLLBACK');return send(res,404,{error:'Order not found for this account.'})}const order=rows[0];if(order.status==='pending_payment'){await client.query("UPDATE orders SET status='paid' WHERE id=$1",[order.id]);await client.query('INSERT INTO payment_events (order_id,provider,provider_event_id,event_type) VALUES ($1,$2,$3,$4) ON CONFLICT (provider_event_id) DO NOTHING',[order.id,'beta-test',`beta-test:${order.order_number}`,'test_payment_accepted']);await client.query(`INSERT INTO purchases (client_key,user_id,book_id,order_id) SELECT $1,$2,oi.book_id,oi.order_id FROM order_items oi WHERE oi.order_id=$3 ON CONFLICT DO NOTHING`,[order.client_key,user.id,order.id])}else if(order.status!=='paid'){await client.query('ROLLBACK');return send(res,409,{error:`Order cannot be test-paid from ${order.status}.`})}await client.query('COMMIT');return send(res,200,{orderNumber:order.order_number,status:'paid',amount:Number(order.subtotal),testOnly:true,message:'Beta test payment recorded. No real money was charged.'})}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
  }
  if(req.method==='GET'&&url.pathname==='/api/orders'){const user=await currentUser(req);if(!user)return send(res,401,{error:'Sign in required.'});const {rows}=await pool.query(`SELECT o.id,o.order_number AS "orderNumber",o.status,o.currency,o.subtotal,o.created_at AS created,COALESCE(json_agg(json_build_object('id',b.id,'title',oi.title_at_purchase,'price',oi.unit_price)) FILTER (WHERE oi.id IS NOT NULL),'[]') AS items FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN books b ON b.id=oi.book_id WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,[user.id]);return send(res,200,rows.map(o=>({...o,amount:Number(o.subtotal),items:o.items.map(i=>({...i,price:Number(i.price)}))}))) }
  if(req.method==='POST'&&url.pathname==='/api/orders'){
   const user=await currentUser(req);if(!user)return send(res,401,{error:'Sign in before checkout.'});const data=await body(req);if(typeof data.clientId!=='string'||data.clientId.length<8||data.clientId.length>100)return send(res,400,{error:'A valid checkout session is required.'});if(!Array.isArray(data.items)||!data.items.length)return send(res,400,{error:'Add at least one course to the cart.'});
   const ids=[...new Set(data.items.map(i=>String(i.id)))];if(ids.length!==data.items.length)return send(res,400,{error:'Duplicate products are not allowed.'});
   const {rows:items}=await pool.query(`SELECT id,title,price FROM books WHERE id=ANY($1::text[]) AND status='published'`,[ids]);if(items.length!==ids.length)return send(res,400,{error:'A cart item is unavailable.'});
   const total=items.reduce((sum,item)=>sum+Number(item.price),0);const orderNumber=`CBP-${Date.now().toString(36).toUpperCase()}`;const client=await pool.connect();try{await client.query('BEGIN');const order=await client.query('INSERT INTO orders (order_number,client_key,user_id,customer_email,status,subtotal) VALUES ($1,$2,$3,$4,\'pending_payment\',$5) RETURNING id',[orderNumber,data.clientId,user.id,user.email,total]);for(const item of items)await client.query('INSERT INTO order_items (order_id,book_id,title_at_purchase,unit_price) VALUES ($1,$2,$3,$4)',[order.rows[0].id,item.id,item.title,item.price]);await client.query('COMMIT');return send(res,201,{id:order.rows[0].id,orderNumber,status:'pending_payment',amount:total,items:items.map(i=>({id:i.id,title:i.title,price:Number(i.price)})),created:new Date().toISOString()})}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
  }
  send(res,404,{error:'API route not found.'});
 }catch(error){console.error('API error:',error);if(error.code==='23505')return send(res,409,{error:'A record with that identifier already exists.'});send(res,500,{error:error.message.includes('ECONN')||error.code?.startsWith('08')?'Database connection failed. Check PostgreSQL and DATABASE_URL.':'The request could not be completed.'})}
}

const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
 if(req.method==='POST'&&url.pathname==='/api/media')return mediaUpload.single('media')(req,res,async(error)=>{if(error)return send(res,400,{error:error.message});if(!req.file)return send(res,400,{error:'Choose an image or video first.'});try{await fs.mkdir(mediaDir,{recursive:true});const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/webm':'webm'};const name=`${randomUUID()}.${extensions[req.file.mimetype]}`;await fs.writeFile(path.join(mediaDir,name),req.file.buffer,{flag:'wx'});return send(res,201,{url:`/media/${name}`,mediaType:req.file.mimetype})}catch(e){console.error('Media upload failed:',e);return send(res,500,{error:'Could not save the media file.'})}});
 if(url.pathname.startsWith('/api/'))return api(req,res,url);
 if(url.pathname.startsWith('/media/')){const name=path.basename(url.pathname);if(name!==url.pathname.slice('/media/'.length)){res.writeHead(400);return res.end('Invalid media path')}try{const data=await fs.readFile(path.join(mediaDir,name));const ext=path.extname(name).slice(1);const type={jpg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',mp4:'video/mp4',webm:'video/webm'}[ext]||'application/octet-stream';res.writeHead(200,{'content-type':type,'cache-control':'public, max-age=31536000, immutable'});return res.end(data)}catch{res.writeHead(404);return res.end('Media not found')}}
 let requested=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);let file=path.resolve(root,'dist',`.${requested}`);
 if(!file.startsWith(path.resolve(root,'dist')+path.sep)){res.writeHead(403);return res.end('Forbidden')}
 try{const data=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}catch{try{const html=await fs.readFile(path.join(root,'dist/index.html'));res.writeHead(200,{'content-type':mime['.html']});res.end(html)}catch{res.writeHead(503);res.end('Build the frontend first with npm run build.')}}
});
server.listen(port,host,()=>console.log(`Chessboard Press API listening on http://${host}:${port}`));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{server.close();await pool.end();process.exit(0)});
