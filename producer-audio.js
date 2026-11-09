(function(root){
'use strict';
// Browser-local, tempo-aligned MIDI-style accompaniment: not a trained AI model.
function barPlan(chords,key,barCount){
 if(!Array.isArray(chords)||!chords.length||!Number.isInteger(barCount)||barCount<1||barCount>256)throw Error('Choose a progression and 1–256 bars.');
 const expanded=[];
 for(const c of chords){
  if(!Array.isArray(c)||!Number.isFinite(c[0]))throw Error('Invalid chord in progression.');
  const bars=Math.max(1,Math.min(32,Math.round(c[3]||1)));
  for(let i=0;i<bars;i++)expanded.push({root:(key+c[0]+120)%12,quality:c[1]});
 }
 if(!expanded.length)throw Error('No playable chords.');
 return Array.from({length:barCount},(_,i)=>expanded[i%expanded.length]);
}
function noteHz(midi){return 440*Math.pow(2,(midi-69)/12);}
function makeNoise(ctx){
 const n=Math.max(2048,Math.ceil(ctx.sampleRate*.18)),b=ctx.createBuffer(1,n,ctx.sampleRate),a=b.getChannelData(0);
 // Repeatable deterministic noise avoids non-reproducible exports.
 let seed=17411;for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;a[i]=((seed>>>0)/4294967296)*2-1;}
 return b;
}
function tone(ctx,dest,time,midi,duration,gain=0.1,type='triangle',filterHz=1200){
 const osc=ctx.createOscillator(),lp=ctx.createBiquadFilter(),env=ctx.createGain();
 osc.type=type;osc.frequency.value=noteHz(midi);lp.type='lowpass';lp.frequency.value=filterHz;
 env.gain.setValueAtTime(.0001,time);env.gain.exponentialRampToValueAtTime(gain,time+.015);
 env.gain.setTargetAtTime(.0001,time+Math.min(.12,duration*.55),Math.max(.07,duration*.18));
 osc.connect(lp);lp.connect(env);env.connect(dest);osc.start(time);osc.stop(time+duration);
}
function kick(ctx,dest,time,loud){
 const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';
 o.frequency.setValueAtTime(145,time);o.frequency.exponentialRampToValueAtTime(50,time+.10);
 g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(.4*loud,time+.006);
 g.gain.exponentialRampToValueAtTime(.0001,time+.25);o.connect(g);g.connect(dest);o.start(time);o.stop(time+.26);
}
function noiseHit(ctx,dest,noise,time,gain,decay,highpass){
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=ctx.createGain();
 source.buffer=noise;filter.type='highpass';filter.frequency.value=highpass;
 env.gain.setValueAtTime(gain,time);env.gain.exponentialRampToValueAtTime(.0001,time+decay);
 source.connect(filter);filter.connect(env);env.connect(dest);source.start(time);source.stop(time+Math.min(noise.duration,decay+.01));
}
async function render(config){
 const {buffer,chords,key=0,tempo=100,style='country',drums=true,bass=true,keys=true,includeOriginal=true}=config;
 if(!buffer||buffer.numberOfChannels<1||buffer.numberOfChannels>2)throw Error('Upload a mono or stereo clip first.');
 if(!Number.isFinite(tempo)||tempo<50||tempo>200)throw Error('Tempo must be 50–200 BPM.');
 if(!['country','blues','rock','folk'].includes(style))throw Error('Unknown accompaniment style.');
 if(!drums&&!bass&&!keys)throw Error('Select at least one instrument.');
 const frames=Math.min(buffer.length,Math.floor(buffer.sampleRate*90)),seconds=frames/buffer.sampleRate;
 const Audio=root.OfflineAudioContext||root.webkitOfflineAudioContext;if(!Audio)throw Error('Offline audio processing is unavailable.');
 const ctx=new Audio(2,frames,buffer.sampleRate),master=ctx.createGain();master.gain.value=.78;master.connect(ctx.destination);
 if(includeOriginal){const player=ctx.createBufferSource();player.buffer=buffer;const gain=ctx.createGain();gain.gain.value=.76;player.connect(gain);gain.connect(master);player.start(0);}
 const groups={};
 for(const instrument of ['drums','bass','keys']){const g=ctx.createGain();g.gain.value=instrument==='keys'?.48:instrument==='bass'?.65:.72;g.connect(master);groups[instrument]=g;}
 const bps=60/tempo,barDuration=bps*4,barCount=Math.ceil(seconds/barDuration),bars=barPlan(chords,key,barCount),noise=makeNoise(ctx);
 for(let bar=0;bar<barCount;bar++){
  const start=bar*barDuration,root=bars[bar].root,rootMidi=36+root;
  if(bass)for(let beat=0;beat<4;beat++){
   const t=start+beat*bps;if(t>=seconds-.03)break;
   const midi=rootMidi+(beat===2?7:beat===3&&style==='blues'?10:0);
   tone(ctx,groups.bass,t,midi,Math.min(bps*.87,seconds-t),style==='rock'?.20:.15,'triangle',300);
  }
  if(keys){const chord=bars[bar];let quality=chord.quality||'';
   const minor=/m(?!aj)|dim|°/.test(quality),dim=/dim|°/.test(quality),aug=/aug|\+/.test(quality);
   const notes=[0,minor?3:4,dim?6:aug?8:7];
   for(const interval of notes){
    const duration=Math.min(barDuration*.91,seconds-start);if(duration>.1)
     tone(ctx,groups.keys,start,48+root+interval,duration,style==='folk'?.085:.105,'sine',1500);
   }
  }
  if(drums)for(let beat=0;beat<4;beat++){
    const t=start+beat*bps;if(t>=seconds-.03)break;
    if(beat%2===0)kick(ctx,groups.drums,t,style==='rock'?1:.72);
    if(beat%2===1)noiseHit(ctx,groups.drums,noise,t,style==='rock'?.27:.18,.12,1100);
    for(let sub=0;sub<2;sub++){const h=t+sub*bps/2;if(h<seconds-.03)noiseHit(ctx,groups.drums,noise,h,style==='folk'?.032:.065,.045,5100);}
  }
 }
 const rendered=await ctx.startRendering(),channels=Array.from({length:2},(_,i)=>rendered.getChannelData(i));
 return {channels,sampleRate:rendered.sampleRate,seconds,barCount,trimmed:buffer.duration>90};
}
const api={barPlan,noteHz,render};if(typeof module!=='undefined')module.exports=api;else root.ProducerAudio=api;
})(typeof globalThis!=='undefined'?globalThis:this);
