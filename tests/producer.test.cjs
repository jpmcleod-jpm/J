const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Producer=require('../producer-audio.js');
const {handler}=require('../netlify/functions/generate-music.js');

test('bar plan expands chord durations and repeats across the clip',()=>{
 const bars=Producer.barPlan([[0,'','I',2],[5,'m','iv',1]],9,7);
 assert.deepEqual(bars.map(b=>b.root),[9,9,2,9,9,2,9]);
 assert.equal(bars[2].quality,'m');
 assert.equal(bars.length,7);
});
test('bar plan validates bad inputs and frequency reference',()=>{
 assert.equal(Producer.noteHz(69),440);
 assert.throws(()=>Producer.barPlan([],0,2),/Choose a progression/);
 assert.throws(()=>Producer.barPlan([[0,'','I',1]],0,0),/Choose a progression/);
 assert.throws(()=>Producer.barPlan([[NaN,'','I',1]],0,2),/Invalid chord/);
});
test('producer page IDs are all unique and include key controls',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const id of ['producer-render','producer-ai-generate','producer-preview','producer-ai-preview','producer-access','producer-prompt','mix-file']){
  assert.ok(ids.includes(id),'Missing '+id);
 }
 assert.match(html,/producer-audio\.js/);
 assert.match(html,/producer-ui\.js/);
});
test('paid generation endpoint rejects missing configuration and non-POST requests',async()=>{
 const notPost=await handler({httpMethod:'GET'});
 assert.equal(notPost.statusCode,405);
 const oldKey=process.env.ELEVENLABS_API_KEY,oldAccess=process.env.SONGROOM_ACCESS_CODE;
 try {
  delete process.env.ELEVENLABS_API_KEY;delete process.env.SONGROOM_ACCESS_CODE;
  const missing=await handler({httpMethod:'POST',headers:{},body:'{}'});
  assert.equal(missing.statusCode,503);
  process.env.ELEVENLABS_API_KEY='test-only';
  process.env.SONGROOM_ACCESS_CODE='secret-in-test';
  const denied=await handler({httpMethod:'POST',headers:{'x-songroom-access':'wrong'},body:'{}'});
  assert.equal(denied.statusCode,403);
 } finally {
  if(oldKey===undefined)delete process.env.ELEVENLABS_API_KEY;else process.env.ELEVENLABS_API_KEY=oldKey;
  if(oldAccess===undefined)delete process.env.SONGROOM_ACCESS_CODE;else process.env.SONGROOM_ACCESS_CODE=oldAccess;
 }
});
