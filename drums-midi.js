/* Standard MIDI File reader/writer. No audio, MIDI, or filenames leave the browser. */
(function(root){
'use strict';
function fail(message){throw new Error(message);}
function parseMidi(input){
 const data=input instanceof Uint8Array?input:new Uint8Array(input);let pos=0,limit=data.length;
 function byte(){if(pos>=limit)fail('The MIDI file is truncated. Export it again from Ableton.');return data[pos++];}
 function number(n){let x=0;while(n--)x=x*256+byte();return x;}
 function tag(){return String.fromCharCode(byte(),byte(),byte(),byte());}
 function vlq(){let x=0;for(let i=0;i<4;i++){const b=byte();x=x*128+(b&127);if(!(b&128))return x;}fail('Invalid MIDI event length.');}
 if(data.length>5*1024*1024)fail('Please upload a MIDI clip smaller than 5 MB.');
 if(tag()!=='MThd')fail('This is not a standard MIDI file. Export a MIDI clip (.mid), not an Ableton project or audio file.');
 const headerSize=number(4);if(headerSize!==6)fail('Unsupported MIDI header. Please re-export the clip from Ableton.');
 const format=number(2),count=number(2),ppq=number(2);if(format>1||!count||count>64||(format===0&&count!==1))fail('Use a format 0 or 1 MIDI clip with at most 64 tracks.');
 if(!ppq||(ppq&32768))fail('SMPTE timecode MIDI is not supported. Export a beat-based MIDI clip.');
 const tracks=[];let total=0,eventCount=0;
 for(let t=0;t<count;t++){
  if(tag()!=='MTrk')fail('Missing MIDI track.');const size=number(4),end=pos+size;if(end>data.length)fail('The MIDI track is truncated.');limit=end;
  let tick=0,running=0,ended=false;const events=[];
  while(pos<end){
   if(++eventCount>200000)fail('This clip has too many events. Export a shorter drum clip.');
   tick+=vlq();if(tick>ppq*4*512)fail('Please export a drum clip of 512 bars or fewer.');
   let status=byte(),first=null;if(status<128){first=status;status=running;if(!status)fail('Invalid running status in MIDI file.');}
   let bytes;
   if(status===255){running=0;const type=byte(),len=vlq();if(pos+len>end)fail('Truncated MIDI metadata.');const payload=Array.from(data.slice(pos,pos+len));pos+=len;bytes=[255,type,...encodeVlq(len),...payload];
    if(type===0x51&&(len!==3||payload.every(x=>x===0)))fail('Invalid MIDI tempo.');
    if(type===0x58&&(len!==4||payload[0]!==4||payload[1]!==2))fail('This first version supports 4/4 clips. Export a 4/4 drum clip.');
    if(type===0x2f){if(len!==0||pos!==end)fail('Invalid end-of-track event.');ended=true;}
   }else if(status===0xf0||status===0xf7){running=0;const len=vlq();if(pos+len>end)fail('Truncated system event.');bytes=[status,...encodeVlq(len),...data.slice(pos,pos+len)];pos+=len;
   }else if(status>=128&&status<=239){running=status;const length=(status>>4)===12||(status>>4)===13?1:2;bytes=[status];if(first!==null)bytes.push(first);while(bytes.length<=length){const value=byte();if(value>127)fail('Invalid MIDI note data.');bytes.push(value);}
   }else fail('Unsupported MIDI event. Re-export this clip from Ableton.');
   events.push({tick,bytes,order:events.length});
  }
  if(!ended)fail('Missing end-of-track event. Please re-export this clip.');
  tracks.push(events);total=Math.max(total,tick);limit=data.length;
 }
 if(pos!==data.length)fail('Unexpected data after MIDI tracks.');
 const noteTracks=tracks.map((events,i)=>events.some(e=>(e.bytes[0]>>4)===9&&e.bytes[2]>0)?i:-1).filter(i=>i>=0);
 if(noteTracks.length!==1)fail('Upload one drum MIDI clip with one note track, rather than a whole song with multiple instrument tracks.');
 const track=noteTracks[0],notes=[],active=new Map(),channels=new Set();
 for(const e of tracks[track]){
  const [s,p,v]=e.bytes,type=s>>4,ch=s&15,k=ch+':'+p;
  if(type===9&&v>0){channels.add(ch);const queue=active.get(k)||[];queue.push({start:e.tick,pitch:p,velocity:v,channel:ch});active.set(k,queue);}
  if(type===8||(type===9&&v===0)){const queue=active.get(k);if(queue?.length){const n=queue.shift();notes.push({...n,end:e.tick});}}
 }
 if([...active.values()].some(q=>q.length))fail('The clip contains notes without endings. Re-export the clip with complete notes.');
 if(channels.size!==1)fail('Use a drum clip on a single MIDI channel.');
 const duration=tracks[track].at(-1).tick;
 if(!duration||!notes.length)fail('No complete drum notes were found.');
 return {format,ppq,tracks,track,notes,duration,total,channel:[...channels][0]};
}
function encodeVlq(value){if(!Number.isInteger(value)||value<0||value>0xfffffff)fail('MIDI time is out of range.');const bytes=[value&127];while(value=Math.floor(value/128))bytes.unshift((value&127)|128);return bytes;}
function be(n,width){const out=Array(width);for(let i=width-1;i>=0;i--){out[i]=n&255;n=Math.floor(n/256);}return out;}
function encodeMidi(midi,additions=[]){
 const out=[77,84,104,100,0,0,0,6,...be(midi.format,2),...be(midi.tracks.length,2),...be(midi.ppq,2)];
 midi.tracks.forEach((events,index)=>{
  let list=events.filter(e=>!(e.bytes[0]===255&&e.bytes[1]===47)).map(e=>({...e}));
  if(index===midi.track)for(const n of additions){list.push({tick:n.start,bytes:[0x90|n.channel,n.pitch,n.velocity],order:1e7});list.push({tick:n.end,bytes:[0x80|n.channel,n.pitch,0],order:-1});}
  list.sort((a,b)=>a.tick-b.tick||a.order-b.order);list.push({tick:events.at(-1).tick,bytes:[255,47,0]});
  let last=0;const body=[];for(const e of list){body.push(...encodeVlq(e.tick-last));for(const b of e.bytes)body.push(b);last=e.tick;}
  out.push(77,84,114,107,...be(body.length,4));for(const b of body)out.push(b);
 });return new Uint8Array(out);
}
function varyDrums(midi,{level='subtle',every=4,snare=38,hat=42,toms=[45,47,50],seed=1,fillBars=null,energy=null}={}){
 if(!['subtle','lively','adventurous'].includes(level)||![1,2,4,8,16].includes(every))fail('Invalid variation settings.');
 if(![snare,hat,...toms].every(n=>Number.isInteger(n)&&n>=0&&n<=127)||toms.length!==3)fail('Drum pad numbers must be between 0 and 127.');
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const bar=midi.ppq*4,step=midi.ppq/4,fullBars=Math.floor(midi.duration/bar),added=[],fills=[];
 const intensity={subtle:0,lively:1,adventurous:2}[level];
 function add(start,pitch,velocity){start=Math.round(start);const end=Math.min(midi.duration,start+Math.max(1,Math.round(step*.45)));
  if(start<0||end<=start)return;
  // Never overlap an original hit on the same pad, or retrigger it before its note-off.
  if([...midi.notes,...added].some(n=>n.pitch===pitch&&start<n.end&&end>n.start))return;
  added.push({start,end,pitch,velocity:Math.max(1,Math.min(127,Math.round(velocity))),channel:midi.channel});
 }
 for(let b=0;b<fullBars;b++){
  // Respect drum breaks and near-silent reference sections.
  if(!midi.notes.some(n=>n.start>=b*bar&&n.start<(b+1)*bar)||(energy&&(energy[b]||0)<.08))continue;
  const density=energy?.[b]===undefined?1:.25+.75*energy[b];
  const fill=fillBars?fillBars.includes(b+1):(b+1)%every===0;
  if(fill){fills.push(b+1);const from=intensity===2?8:12;
   for(let s=from;s<16;s++){if(intensity===0&&s%2===0)continue;
    const pitch=intensity===0?snare:(s<12?snare:toms[Math.min(2,Math.floor((s-12)*3/4))]);
    add(b*bar+s*step,pitch,55+intensity*8+(s-from)*2+random()*12+(energy?20*(energy[b]||0):10));
   }
  }
  if(intensity>0){for(const s of [3,7,11,15])if(random()<(intensity===2?.8:.4)*density)add(b*bar+s*step,snare,25+random()*18);
   for(const s of [2,6,10,14])if(random()<.55*density)add(b*bar+s*step,hat,38+random()*22);
  }
 }
 return {added:added.sort((a,b)=>a.start-b.start),fills,fullBars};
}
// Align a reference bounce to clip bars. Scores measure energy changes, not musical labels.
function analyzeSong(channels,sampleRate,{bpm,offset=0,barCount,every=4}){
 if(!channels.length||!Number.isFinite(bpm)||bpm<30||bpm>300||!Number.isFinite(offset)||offset<0)fail('Check the reference tempo and clip start time.');
 const seconds=240/bpm,duration=channels[0].length/sampleRate;
 if(offset+barCount*seconds>duration+.05)fail('The reference audio is too short for this clip at that tempo and start time.');
 function rms(from,to){let sum=0,count=0;for(const ch of channels)for(let i=Math.floor(from*sampleRate);i<Math.min(ch.length,Math.floor(to*sampleRate));i+=32){sum+=ch[i]*ch[i];count++;}return count?Math.sqrt(sum/count):0;}
 const raw=Array.from({length:barCount},(_,b)=>rms(offset+b*seconds,offset+(b+1)*seconds));
 const maximum=Math.max(...raw,.00001),energy=raw.map(x=>x/maximum),scores=[];
 for(let b=0;b<barCount;b++){
  const boundary=offset+(b+1)*seconds;
  if(boundary+seconds/2>duration){scores.push(0);continue;}
  const before=rms(boundary-seconds/2,boundary),after=rms(boundary,boundary+seconds/2);
  scores.push(Math.abs(after-before)/maximum);
 }
 const fillBars=[];for(let start=0;start<barCount;start+=every){const end=Math.min(start+every,barCount);let best=-1;
  for(let b=start;b<end;b++)if(scores[b]>.12&&(best<0||scores[b]>scores[best]))best=b;
  if(best>=0)fillBars.push(best+1);
 }
 return {energy,scores,fillBars};
}
const api={parseMidi,encodeMidi,varyDrums,analyzeSong};if(typeof module!=='undefined')module.exports=api;else root.DrumMidi=api;
})(typeof globalThis!=='undefined'?globalThis:this);
