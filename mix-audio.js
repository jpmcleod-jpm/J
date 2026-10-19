(function(root){
'use strict';
const db=value=>value>0?20*Math.log10(value):-Infinity;
function analyzeAudio(channels,sampleRate){
 if(!channels.length||channels.length>2||!channels[0].length||sampleRate<=0||channels.some(c=>c.length!==channels[0].length))throw Error('Use nonempty mono or stereo audio.');
 let peak=0,squares=0,nearFull=0,cross=0,left=0,right=0,mid=0,side=0;const channelRms=[],dc=[],bands=[0,0,0];
 const aLow=1-Math.exp(-2*Math.PI*180/sampleRate),aHigh=1-Math.exp(-2*Math.PI*4000/sampleRate);
 for(const channel of channels){let power=0,sum=0,low=0,upper=0;
  for(const v of channel){if(!Number.isFinite(v))throw Error('Audio contains invalid samples.');peak=Math.max(peak,Math.abs(v));if(Math.abs(v)>=.999)nearFull++;power+=v*v;sum+=v;low+=aLow*(v-low);upper+=aHigh*(v-upper);bands[0]+=low*low;bands[1]+=(upper-low)**2;bands[2]+=(v-upper)**2;}
  squares+=power;channelRms.push(Math.sqrt(power/channel.length));dc.push(sum/channel.length);
 }
 if(channels.length===2){for(let i=0;i<channels[0].length;i++){const l=channels[0][i],r=channels[1][i];left+=l*l;right+=r*r;cross+=l*r;mid+=((l+r)/2)**2;side+=((l-r)/2)**2;}}
 const bandTotal=bands.reduce((a,b)=>a+b,0);
 return {duration:channels[0].length/sampleRate,peakDb:db(peak),rmsDb:db(Math.sqrt(squares/(channels.length*channels[0].length))),nearFull,channelDb:channelRms.map(db),dc,correlation:channels.length===2&&left*right>0?cross/Math.sqrt(left*right):null,sideToMidDb:channels.length===2?db(Math.sqrt(side/Math.max(mid,1e-30))):null,bands:bands.map(v=>bandTotal?v/bandTotal:0),silent:peak<1e-7};
}
function suggestions(a){
 if(a.silent)return ['This file is silent or nearly silent. Check the export range, enabled tracks, and master output in Ableton.'];
 const advice=[];
 if(a.nearFull)advice.push(`${a.nearFull.toLocaleString()} samples are near full scale. Check the original for clipping or limiting; lowering this file cannot repair distortion already recorded.`);
 else if(a.peakDb> -1)advice.push('Sample peaks leave less than 1 dB of headroom. Consider a lower output level before exporting.');
 else advice.push('Sample peaks have some headroom. Judge loudness by listening; these meters do not measure LUFS or inter-sample true peaks.');
 if(a.correlation!==null&&a.correlation<0)advice.push('The stereo channels are negatively correlated overall. Check the mix in mono for cancellation, especially widened instruments.');
 if(a.channelDb.length===2&&a.channelDb.every(Number.isFinite)&&Math.abs(a.channelDb[0]-a.channelDb[1])>3)advice.push('Left and right average levels differ by more than 3 dB. Check panning and stereo effects; this can also be intentional.');
 if(a.dc.some(n=>Math.abs(n)>.01))advice.push('A measurable DC offset is present. Try the low-cut filter and check your recording chain.');
 if(a.bands[0]>.65)advice.push('The rough low-band estimate is dominant. Listen for bass/kick masking before trying a small bass cut; bass-heavy arrangements can be intentional.');
 if(a.bands[2]>.35)advice.push('The rough high-band estimate is prominent. Listen for harsh cymbals or sibilance before reducing treble.');
 advice.push('Use small changes and compare at similar listening levels. A stereo bounce cannot rebalance individual tracks, remove all masking, or guarantee a better mix.');return advice;
}
function normalizeChannels(channels,targetDb=-1){
 let peak=0;for(const ch of channels)for(const v of ch)peak=Math.max(peak,Math.abs(v));const target=10**(targetDb/20),gain=peak>0?target/peak:1;
 return {channels:channels.map(c=>Float32Array.from(c,v=>v*gain)),gainDb:db(gain)};
}
function encodeWav(channels,sampleRate){
 const frames=channels[0]?.length;if(!frames||![1,2].includes(channels.length)||channels.some(c=>c.length!==frames))throw Error('Use nonempty mono or stereo audio.');
 const bytes=frames*channels.length*3,buffer=new ArrayBuffer(44+bytes),view=new DataView(buffer);const str=(p,s)=>{for(let i=0;i<s.length;i++)view.setUint8(p+i,s.charCodeAt(i));};
 str(0,'RIFF');view.setUint32(4,36+bytes,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels.length,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels.length*3,true);view.setUint16(32,channels.length*3,true);view.setUint16(34,24,true);str(36,'data');view.setUint32(40,bytes,true);
 let pos=44,clamped=0;
 for(let i=0;i<frames;i++)for(const channel of channels){const value=channel[i];if(!Number.isFinite(value))throw Error('Audio contains invalid samples.');if(Math.abs(value)>1)clamped++;const v=Math.round(Math.max(-1,Math.min(1,value))*(value<0?8388608:8388607));view.setUint8(pos++,v&255);view.setUint8(pos++,(v>>8)&255);view.setUint8(pos++,(v>>16)&255);}
 return {buffer,clamped};
}
async function processAudio(buffer,settings){
 const Audio=root.OfflineAudioContext||root.webkitOfflineAudioContext;if(!Audio)throw Error('Offline audio rendering is unavailable in this browser.');
 const audio=new Audio(buffer.numberOfChannels,buffer.length,buffer.sampleRate),source=audio.createBufferSource();source.buffer=buffer;let tail=source;
 const connect=node=>{tail.connect(node);tail=node;};
 if(settings.lowcut){const hp=audio.createBiquadFilter();hp.type='highpass';hp.frequency.value=30;hp.Q.value=.707;connect(hp);}
 for(const [type,freq,gain] of [['lowshelf',180,settings.bass],['peaking',1000,settings.mid],['highshelf',4000,settings.treble]]){const filter=audio.createBiquadFilter();filter.type=type;filter.frequency.value=freq;filter.gain.value=gain;filter.Q.value=.7;connect(filter);}
 if(settings.compress){const comp=audio.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=2;comp.attack.value=.015;comp.release.value=.2;connect(comp);}
 const output=audio.createGain();output.gain.value=10**(settings.trim/20);connect(output);tail.connect(audio.destination);source.start();const rendered=await audio.startRendering();
 let channels=Array.from({length:rendered.numberOfChannels},(_,i)=>rendered.getChannelData(i));let gainDb=0;if(settings.normalize){const result=normalizeChannels(channels);channels=result.channels;gainDb=result.gainDb;}
 return {channels,sampleRate:rendered.sampleRate,gainDb};
}
const api={analyzeAudio,suggestions,normalizeChannels,encodeWav,processAudio};if(typeof module!=='undefined')module.exports=api;else root.MixAudio=api;
})(typeof globalThis!=='undefined'?globalThis:this);
