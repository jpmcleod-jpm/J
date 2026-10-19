(()=>{
let buffer=null,version=0,renderVersion=0,originalUrl=null,processedUrl=null,filename='song';
const status=$('mix-status'),analysis=$('mix-analysis'),result=$('mix-result');
const db=n=>Number.isFinite(n)?n.toFixed(1)+' dBFS':'−∞ dBFS';
function text(tag,value,parent){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
function clearProcessed(){renderVersion++;$('mix-after').pause();$('mix-after').removeAttribute('src');$('mix-after').load();if(processedUrl)URL.revokeObjectURL(processedUrl);processedUrl=null;result.replaceChildren();}
function settings(){return {bass:+$('mix-bass').value,mid:+$('mix-mid').value,treble:+$('mix-treble').value,trim:+$('mix-trim').value,lowcut:$('mix-lowcut').checked,compress:$('mix-compress').checked,normalize:$('mix-normalize').checked};}
function change(){clearProcessed();for(const id of ['bass','mid','treble','trim'])$('mix-'+id+'-value').textContent=$('mix-'+id).value+' dB';if(buffer)status.textContent='Settings changed. Render again to update the processed preview and download.';}
for(const id of ['bass','mid','treble','trim','lowcut','compress','normalize'])$('mix-'+id).addEventListener('input',change);
function reset(){for(const id of ['bass','mid','treble','trim'])$('mix-'+id).value='0';$('mix-lowcut').checked=false;$('mix-compress').checked=false;$('mix-normalize').checked=true;change();}
$('mix-reset').onclick=reset;
$('mix-file').onchange=async()=>{
 const token=++version;clearProcessed();buffer=null;analysis.replaceChildren();$('mix-controls').disabled=true;$('mix-before').pause();$('mix-before').removeAttribute('src');$('mix-before').load();if(originalUrl)URL.revokeObjectURL(originalUrl);originalUrl=null;
 const file=$('mix-file').files[0];if(!file){status.textContent='Choose an audio bounce to start.';return;}let audio;
 try{if(file.size>60*1024*1024)throw Error('Choose an audio bounce smaller than 60 MB.');status.textContent='Reading and measuring your audio…';
  const Audio=window.AudioContext||window.webkitAudioContext;audio=new Audio();const decoded=await audio.decodeAudioData(await file.arrayBuffer());if(token!==version)return;
  if(decoded.duration>300||decoded.length*decoded.numberOfChannels>32000000)throw Error('Use a bounce of five minutes or less (up to 32 million decoded samples).');
  const channels=Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i));const stats=MixAudio.analyzeAudio(channels,decoded.sampleRate);buffer=decoded;filename=file.name.replace(/\.[^.]+$/,'');
  text('p',`${stats.duration.toFixed(1)} seconds · ${decoded.numberOfChannels===2?'stereo':'mono'} · ${decoded.sampleRate.toLocaleString()} Hz`,analysis);
  const metrics=document.createElement('div');metrics.className='mix-metrics';analysis.append(metrics);text('p',`Sample peak: ${db(stats.peakDb)}`,metrics);text('p',`Average RMS: ${db(stats.rmsDb)}`,metrics);if(stats.correlation!==null)text('p',`Stereo correlation: ${stats.correlation.toFixed(2)}`,metrics);
  const list=document.createElement('ul');MixAudio.suggestions(stats).forEach(t=>text('li',t,list));analysis.append(list);
  originalUrl=URL.createObjectURL(file);$('mix-before').src=originalUrl;reset();$('mix-controls').disabled=stats.silent;status.textContent=stats.silent?'The audio is nearly silent. Check your Ableton export.':'Audio measured. Start with small adjustments, then render and compare.';
 }catch(e){if(token===version)status.textContent='Could not load audio: '+e.message+' For format errors, try a WAV bounce.';}finally{audio?.close().catch(()=>{});}
};
$('mix-render').onclick=async()=>{
 if(!buffer)return;clearProcessed();const token=renderVersion,fileToken=version,source=buffer,config=settings();$('mix-render').disabled=true;status.textContent='Rendering locally… keep this page open.';
 try{
  const rendered=await MixAudio.processAudio(source,config);if(token!==renderVersion||fileToken!==version)return;
  const stats=MixAudio.analyzeAudio(rendered.channels,rendered.sampleRate);
  if(stats.peakDb>0.00001){status.textContent='These settings push the audio above 0 dBFS. Lower Output Trim or enable −1 dBFS sample-peak normalization, then render again.';return;}
  const wav=MixAudio.encodeWav(rendered.channels,rendered.sampleRate);if(wav.clamped)throw Error('Output clipping detected. Reduce gain and render again.');
  processedUrl=URL.createObjectURL(new Blob([wav.buffer],{type:'audio/wav'}));$('mix-after').src=processedUrl;
  text('p',`Processed sample peak: ${db(stats.peakDb)} · average RMS: ${db(stats.rmsDb)}${config.normalize?' · normalization gain: '+rendered.gainDb.toFixed(1)+' dB':''}`,result);
  const link=document.createElement('a');link.href=processedUrl;link.download=filename+'-songroom-mix.wav';link.className='download-midi';link.textContent='Download processed WAV (24-bit)';result.append(link);
  status.textContent='Processed version ready. Compare both versions at similar listening levels before choosing one.';
 }catch(e){if(token===renderVersion)status.textContent='Could not render: '+e.message;}finally{$('mix-render').disabled=false;}
};
for(const [a,b] of [['mix-before','mix-after'],['mix-after','mix-before']])$(a).addEventListener('play',()=>{window.dispatchEvent(new CustomEvent('songroom:audio-play',{detail:'mix'}));stop();$(b).pause();});
window.addEventListener('pagehide',()=>{if(originalUrl)URL.revokeObjectURL(originalUrl);if(processedUrl)URL.revokeObjectURL(processedUrl)});
})();
