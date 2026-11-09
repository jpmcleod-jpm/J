(()=>{
'use strict';
const $=id=>document.getElementById(id);
let arrangedUrl=null,aiUrl=null,arrangeVersion=0,aiVersion=0;
const arranged=$('producer-preview'),aiAudio=$('producer-ai-preview'),arrangedStatus=$('producer-status'),aiStatus=$('producer-ai-status');
function dropUrl(kind){
 if(kind==='arrange'){if(arrangedUrl)URL.revokeObjectURL(arrangedUrl);arrangedUrl=null;arranged.pause();arranged.removeAttribute('src');arranged.load();$('producer-download').replaceChildren();}
 else {if(aiUrl)URL.revokeObjectURL(aiUrl);aiUrl=null;aiAudio.pause();aiAudio.removeAttribute('src');aiAudio.load();$('producer-ai-download').replaceChildren();}
}
function download(parent,url,name,label){
 const anchor=document.createElement('a');anchor.className='download-midi';anchor.href=url;anchor.download=name;anchor.textContent=label;parent.append(anchor);
}
$('mix-file').addEventListener('change',()=>{arrangeVersion++;dropUrl('arrange');arrangedStatus.textContent='New audio selected. Build an arrangement after the upload has finished loading.';});
$('producer-render').onclick=async()=>{
 const buffer=window.songroomMix?.getBuffer();if(!buffer){arrangedStatus.textContent='Upload and load a recording in the mixing section first.';return;}
 const drums=$('producer-drums').checked,bass=$('producer-bass').checked,keys=$('producer-keys').checked;
 if(!drums&&!bass&&!keys){arrangedStatus.textContent='Select at least one accompaniment instrument.';return;}
 const version=++arrangeVersion;dropUrl('arrange');const button=$('producer-render');button.disabled=true;
 arrangedStatus.textContent='Synthesizing your accompaniment locally. Keep the tab open.';
 try{
  const config={buffer,chords:progression(),key,tempo:+$('tempo').value,style:$('producer-feel').value,drums,bass,keys,includeOriginal:true};
  const rendered=await ProducerAudio.render(config);if(version!==arrangeVersion)return;
  const normalized=MixAudio.normalizeChannels(rendered.channels,-1);
  const wav=MixAudio.encodeWav(normalized.channels,rendered.sampleRate);
  if(wav.clamped)throw Error('Output exceeds PCM sample peak. Reduce the level.');
  arrangedUrl=URL.createObjectURL(new Blob([wav.buffer],{type:'audio/wav'}));arranged.src=arrangedUrl;
  download($('producer-download'),arrangedUrl,'songroom-arranged-demo.wav','Download arranged demo WAV');
  arrangedStatus.textContent='Arranged demo ready ('+Math.round(rendered.seconds)+' sec). '+(rendered.trimmed?'Only the first 90 seconds were rendered. ':'')+'The accompaniment follows the chosen tempo and chord progression; verify timing by ear.';
 }catch(e){if(version===arrangeVersion)arrangedStatus.textContent='Could not build arrangement: '+e.message;}
 finally{button.disabled=false;}
};
function base64ToBlob(data,type){
 const raw=atob(data),u=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);
 return new Blob([u],{type});
}
$('producer-ai-generate').onclick=async()=>{
 const password=$('producer-access').value.trim(),brief=$('producer-prompt').value.trim();
 if(!password){aiStatus.textContent='Enter the private Songroom access code configured in Netlify first.';return;}
 if(brief.length<12){aiStatus.textContent='Describe the instruments, mood, and arrangement you want (at least 12 characters).';return;}
 const version=++aiVersion;dropUrl('ai');const button=$('producer-ai-generate');button.disabled=true;
 aiStatus.textContent='Requesting a new AI instrumental idea. The paid provider may take a while; keep this page open.';
 try{
  const chords=progression().map(c=>names[(key+c[0])%12]+(c[1]||'')).join(' - ');
  const response=await fetch('/.netlify/functions/generate-music',{method:'POST',headers:{'Content-Type':'application/json','X-Songroom-Access':password},body:JSON.stringify({prompt:brief,duration:+$('producer-length').value,genre,keyName:names[key]+' '+Harmony.scales[mode].label,tempo:+$('tempo').value,chords})});
  const result=await response.json();if(version!==aiVersion)return;
  if(!response.ok)throw Error(result.error||'The AI service is unavailable.');
  const blob=base64ToBlob(result.audio,'audio/mpeg');aiUrl=URL.createObjectURL(blob);aiAudio.src=aiUrl;
  download($('producer-ai-download'),aiUrl,'songroom-ai-instrumental.mp3','Download AI instrumental MP3');
  aiStatus.textContent='New AI instrumental idea ready. This is a separate generated composition, not stems aligned to your uploaded clip.';
 }catch(e){if(version===aiVersion)aiStatus.textContent='AI generation unavailable: '+e.message;}
 finally{button.disabled=false;}
};
for(const [player,other] of [[arranged,aiAudio],[aiAudio,arranged]])player.addEventListener('play',()=>{other.pause();document.getElementById('mix-before')?.pause();document.getElementById('mix-after')?.pause();window.dispatchEvent(new CustomEvent('songroom:audio-play',{detail:'producer'}));stop();});
window.addEventListener('pagehide',()=>{dropUrl('arrange');dropUrl('ai');});
})();