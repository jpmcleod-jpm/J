(function(root){
'use strict';
function balancePlan(stems,original=false){
 const solo=!original&&stems.some(s=>s.solo&&!s.mute);
 return stems.map(s=>{
  const db=original?0:Number(s.level),pan=original?0:Number(s.pan);
  if(!Number.isFinite(db)||db< -60||db>6||!Number.isFinite(pan)||pan< -1||pan>1)throw Error('Check stem level and pan settings.');
  return {gain:!original&&(s.mute||(solo&&!s.solo))?0:10**(db/20),pan};
 });
}
function connectStem(audio,buffer,plan,destination){
 const source=audio.createBufferSource(),gain=audio.createGain(),pan=audio.createStereoPanner();source.buffer=buffer;gain.gain.value=plan.gain;pan.pan.value=plan.pan;source.connect(gain).connect(pan).connect(destination);return {source,gain,pan};
}
async function renderStems(stems,normalize=true){
 if(!stems.length)throw Error('Load stems first.');
 const sampleRate=stems[0].buffer.sampleRate;
 if(stems.some(s=>s.buffer.sampleRate!==sampleRate))throw Error('Stem sample rates must match.');
 const length=Math.max(...stems.map(s=>s.buffer.length)),Audio=root.OfflineAudioContext||root.webkitOfflineAudioContext;
 const audio=new Audio(2,length,sampleRate),plan=balancePlan(stems);
 stems.forEach((stem,i)=>connectStem(audio,stem.buffer,plan[i],audio.destination).source.start());
 const rendered=await audio.startRendering();let channels=[rendered.getChannelData(0),rendered.getChannelData(1)],gainDb=0;
 if(normalize){const result=root.MixAudio.normalizeChannels(channels);channels=result.channels;gainDb=result.gainDb;}
 return {channels,sampleRate,gainDb};
}
function levelSuggestion(stem,others){
 if(!Number.isFinite(stem.stats.rmsDb))return {delta:0,reason:'Silent stem: check the exported range and track output.'};
 const levels=others.map(s=>s.stats.rmsDb).filter(Number.isFinite).sort((a,b)=>a-b);const median=levels[Math.floor(levels.length/2)]??stem.stats.rmsDb;
 if(stem.stats.rmsDb>median+6)return {delta:-3,reason:'Average level is well above the other stems. Try −3 dB and listen for whether it masks them.'};
 if(stem.stats.rmsDb<median-10)return {delta:2,reason:'Average level is low relative to the others. Try +2 dB only if it is getting lost; sparse parts may already be loud enough.'};
 return {delta:0,reason:'No large average-level outlier. Set the balance by listening; equal RMS is not a mixing goal.'};
}
const api={balancePlan,connectStem,renderStems,levelSuggestion};if(typeof module!=='undefined')module.exports=api;else root.StemAudio=api;
})(typeof globalThis!=='undefined'?globalThis:this);
