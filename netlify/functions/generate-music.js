'use strict';
// Netlify Function. The paid provider key and the access code are server-only environment variables.
const {timingSafeEqual}=require('node:crypto');
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const reply=(statusCode,error,extra={})=>({statusCode,headers,body:JSON.stringify(error?{error}:{...extra})});
function secureCompare(actual,expected){
 const a=Buffer.from(actual||''),b=Buffer.from(expected||'');
 return a.length===b.length&&a.length>0&&timingSafeEqual(a,b);
}
function buildPrompt(data){
 if(!data||typeof data.prompt!=='string'||data.prompt.trim().length<12||data.prompt.length>900)throw Error('Write a 12–900 character production brief.');
 if(![15,30].includes(data.duration))throw Error('Choose a 15- or 30-second idea.');
 if(typeof data.tempo!=='number'||data.tempo<50||data.tempo>200)throw Error('Tempo must be 50–200 BPM.');
 const clean=(value,length)=>String(value||'').replace(/[\r\n\t]/g,' ').slice(0,length);
 return 'Create a new original instrumental song idea. No singing, spoken word, or recognizable existing copyrighted melodies. '+
  'Genre: '+clean(data.genre,40)+'. Tonal centre: '+clean(data.keyName,50)+'. Tempo about '+data.tempo+' BPM. '+
  'Suggested chord movement: '+clean(data.chords,220)+'. Producer brief: '+data.prompt.trim()+'. '+
  'Clear drums and bass, musical structure, careful instrument separation, studio recording sound. Instrumental only.';
}
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return reply(405,'POST required.');
 const apiKey=process.env.ELEVENLABS_API_KEY,access=process.env.SONGROOM_ACCESS_CODE;
 if(!apiKey||!access)return reply(503,'AI generation has not been configured. The site owner must set ELEVENLABS_API_KEY and SONGROOM_ACCESS_CODE in Netlify environment variables and redeploy.');
 const supplied=event.headers['x-songroom-access']||event.headers['X-Songroom-Access']||'';
 if(!secureCompare(supplied,access))return reply(403,'Invalid private access code.');
 if((event.body||'').length>6000)return reply(413,'Production brief is too long.');
 try{
  const data=JSON.parse(event.body||'{}'),prompt=buildPrompt(data);
  // Use an explicit modern model: the legacy model is scheduled for retirement.
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),52000);
  let resp;
  try{resp=await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192',{method:'POST',headers:{'xi-api-key':apiKey,'Content-Type':'application/json','Accept':'audio/mpeg'},body:JSON.stringify({model_id:'music_v2_5',prompt,music_length_ms:data.duration*1000,force_instrumental:true}),signal:controller.signal});}
  finally{clearTimeout(timeout);}
  if(!resp.ok){
   const body=(await resp.text()).slice(0,300);
   return reply(resp.status>=500?502:resp.status,'Music provider rejected the request ('+resp.status+'). '+body);
  }
  const binary=Buffer.from(await resp.arrayBuffer());
  if(!binary.length||binary.length>3900000)return reply(502,'AI audio response was empty or too large for this deployment.');
  return reply(200,null,{audio:binary.toString('base64'),model:'music_v2_5'});
 }catch(e){
  if(e?.name==='AbortError')return reply(504,'The AI provider took longer than the site timeout. This request may still have used provider credits; check your provider account before retrying.');
  if(e instanceof SyntaxError)return reply(400,'Invalid request JSON.');
  if(e?.message?.includes('fetch'))return reply(502,'Could not reach the music provider.');
  if(/production brief|Tempo|Choose a 15-/.test(e?.message||''))return reply(400,e.message);
  return reply(500,'Could not generate music. Check provider status and deployment logs.');
 }
};
