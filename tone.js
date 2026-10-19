(function(root){
'use strict';
const presets={acoustic:'Acoustic-style pluck',electric:'Clean electric-style',piano:'Piano-style',epiano:'Electric piano-style',organ:'Warm organ',pad:'Soft pad'};
function synthesizeNote(frequency,seconds,sampleRate,tone){
 if(!presets[tone])throw Error('Unknown playback sound.');
 const length=Math.ceil(seconds*sampleRate),samples=new Float32Array(length);
 for(let i=0;i<length;i++){
  const t=i/sampleRate,phase=2*Math.PI*frequency*t;let v=0;
  if(tone==='acoustic'){for(let h=1;h<=6;h++)v+=Math.sin(phase*h)*Math.exp(-t*(1.9+h*.7))/(h*h*.75);v*=.55;}
  if(tone==='electric')v=(Math.sin(phase)+.25*Math.sin(phase*2)+.12*Math.sin(phase*3))*Math.exp(-t*1.7)*.7;
  if(tone==='piano')v=(Math.sin(phase)+.45*Math.sin(phase*2)*Math.exp(-t*2)+.18*Math.sin(phase*3))*Math.exp(-t*1.1)*.6;
  if(tone==='epiano')v=Math.sin(phase+2*Math.exp(-t*3)*Math.sin(phase*2))*Math.exp(-t*1.4)*.85;
  if(tone==='organ')v=(Math.sin(phase)+.4*Math.sin(phase*2)+.2*Math.sin(phase*3)+.1*Math.sin(phase*4))*.5;
  if(tone==='pad')v=(Math.sin(phase)+.25*Math.sin(phase*1.003)+.2*Math.sin(phase*.997))*.5;
  const attack=tone==='pad'?.2:tone==='organ'?.025:.005;
  const release=tone==='pad'?.25:.045;
  samples[i]=v*Math.min(1,t/attack)*Math.min(1,(seconds-t)/Math.min(release,seconds/2));
 }
 return samples;
}
function playChord(audio,notes,{tone='acoustic',duration=1,volume=.65}={}){
 const sources=[];
 notes.forEach((midi,i)=>{
  const samples=synthesizeNote(440*2**((midi-69)/12),duration,audio.sampleRate,tone);
  const buffer=audio.createBuffer(1,samples.length,audio.sampleRate);buffer.copyToChannel(samples,0);
  const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffer;gain.gain.value=volume*.22/Math.sqrt(notes.length);source.connect(gain).connect(audio.destination);source.addEventListener('ended',()=>{source.disconnect();gain.disconnect()},{once:true});
  source.start(audio.currentTime+(tone==='acoustic'||tone==='electric'?i*.025:0));sources.push(source);
 });return sources;
}
const api={presets,synthesizeNote,playChord};if(typeof module!=='undefined')module.exports=api;else root.ToneEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
