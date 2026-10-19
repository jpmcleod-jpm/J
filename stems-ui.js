(()=>{
let stems=[],version=0,renderVersion=0,audio=null,live=[],master=null,started=0,offset=0,playing=false,frame=null,downloadUrl=null,loading=false,playVersion=0;
const status=$('stems-status'),list=$('stems-list'),result=$('stems-result');
const clock=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
function text(tag,value,parent){const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;}
function duration(){return Math.max(0,...stems.map(s=>s.buffer.duration));}
function position(){return Math.max(0,Math.min(duration(),offset+(playing?audio.currentTime-started:0)));}
function stopPlayback(reset=false){playVersion++;const pos=position();playing=false;cancelAnimationFrame(frame);for(const n of live){try{n.source.stop()}catch{}n.source.disconnect();n.gain.disconnect();n.pan.disconnect();}live=[];master?.disconnect();master=null;offset=reset?0:pos;$('stems-seek').value=offset;$('stems-time').textContent=clock(offset);$('stems-play').textContent='▶ Play stems';}
function invalidate(){renderVersion++;if(downloadUrl)URL.revokeObjectURL(downloadUrl);downloadUrl=null;result.replaceChildren();}
function updateLive(){if(!playing)return;const plan=StemAudio.balancePlan(stems,$('stems-compare').value==='original');live.forEach(n=>{const p=plan[n.index];n.gain.gain.setTargetAtTime(p.gain,audio.currentTime,.015);n.pan.pan.setTargetAtTime(p.pan,audio.currentTime,.015);});master.gain.setTargetAtTime(previewGain(),audio.currentTime,.015);}
function previewGain(){const peak=Math.max(1,...stems.map(s=>10**(s.stats.peakDb/20)));return (+$('stems-volume').value/100)*.8/(3*stems.length*peak);}
function changed(){invalidate();updateLive();status.textContent='Balance updated. Listen together, then export when you like it.';}
function draw(){
 list.replaceChildren();stems.forEach((stem,index)=>{
  const row=document.createElement('article');row.className='stem-row';list.append(row);text('h3',stem.name,row);text('p',`${stem.buffer.numberOfChannels===2?'Stereo':'Mono'} · ${clock(stem.buffer.duration)} · RMS ${Number.isFinite(stem.stats.rmsDb)?stem.stats.rmsDb.toFixed(1):'−∞'} dBFS`,row);
  const controls=document.createElement('div');controls.className='stem-row-controls';row.append(controls);
  for(const [kind,title,min,max,step] of [['level','LEVEL (DB)',-60,6,.5],['pan','PAN (LEFT / RIGHT)',-1,1,.05]]){
   const label=document.createElement('label');label.append(document.createTextNode(title));const output=document.createElement('output');label.append(output);const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=stem[kind];input.setAttribute('aria-label',stem.name+' '+kind);input.dataset.stem=index;input.dataset.setting=kind;label.append(input);controls.append(label);
   const display=()=>output.textContent=kind==='level'?stem.level+' dB':stem.pan===0?'Center':Math.round(Math.abs(stem.pan)*100)+'% '+(stem.pan<0?'L':'R');display();input.oninput=()=>{stem[kind]=+input.value;display();changed();};
  }
  for(const kind of ['mute','solo']){const label=document.createElement('label');label.className='stem-toggle';const input=document.createElement('input');input.type='checkbox';input.checked=stem[kind];input.dataset.setting=kind;input.setAttribute('aria-label',stem.name+' '+kind);label.append(input,document.createTextNode(kind==='mute'?'Mute':'Solo'));controls.append(label);input.onchange=()=>{stem[kind]=input.checked;changed();};}
  const suggestion=StemAudio.levelSuggestion(stem,stems);text('p',suggestion.reason,row);if(suggestion.delta){const button=text('button',`Try ${suggestion.delta>0?'+':''}${suggestion.delta} dB`,row);button.onclick=()=>{stem.level=Math.max(-60,Math.min(6,stem.level+suggestion.delta));changed();draw();};}
 });
}
$('stems-files').onchange=async()=>{
 const token=++version;stopPlayback(true);invalidate();stems=[];draw();$('stems-transport').disabled=true;loading=true;const files=Array.from($('stems-files').files);let decoder;
 try{
  if(files.length<2||files.length>8)throw Error('Choose between 2 and 8 audio stems together.');
  if(files.reduce((sum,f)=>sum+f.size,0)>160*1024*1024)throw Error('Keep the combined file size under 160 MB.');
  const Audio=window.AudioContext||window.webkitAudioContext;decoder=new Audio();let samples=0;const loaded=[];
  for(const file of files){status.textContent=`Reading ${loaded.length+1} of ${files.length}: ${file.name}`;const buffer=await decoder.decodeAudioData(await file.arrayBuffer());if(token!==version)return;
   samples+=buffer.length*buffer.numberOfChannels;if(buffer.duration>300||samples>64000000)throw Error('Use shorter stems: five minutes per file and 64 million decoded samples total.');
   const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),stats=MixAudio.analyzeAudio(channels,buffer.sampleRate);loaded.push({name:file.name,buffer,stats,level:0,pan:0,mute:false,solo:false});
  }
  stems=loaded;draw();$('stems-transport').disabled=false;$('stems-seek').max=duration();$('stems-seek').value=0;$('stems-compare').value='edited';
  const lengths=stems.map(s=>s.buffer.duration),unequal=Math.max(...lengths)-Math.min(...lengths)>.1;
  status.textContent=`Loaded ${stems.length} stems. ${unequal?'Durations differ: shorter stems end early; all start at 0. Check that they were exported from the same timeline range.':'All stems start together at 0. Confirm their musical alignment by listening.'}`;
 }catch(e){if(token===version){stems=[];draw();status.textContent='Could not load stems: '+e.message+' Try WAV exports if a format is unsupported.';}}finally{decoder?.close().catch(()=>{});if(token===version)loading=false;}
};
async function play(){
 if(!stems.length||loading)return;if(playing){stopPlayback();return;}
 const token=version,playToken=++playVersion;
 try{
  audio ||= new (window.AudioContext||window.webkitAudioContext)();await audio.resume();if(token!==version||playToken!==playVersion||loading)return;
  window.dispatchEvent(new CustomEvent('songroom:audio-play',{detail:'stems'}));stop();$('mix-before').pause();$('mix-after').pause();
  if(offset>=duration())offset=0;const plan=StemAudio.balancePlan(stems,$('stems-compare').value==='original');master=audio.createGain();master.gain.value=previewGain();master.connect(audio.destination);started=audio.currentTime+.03;
  live=[];stems.forEach((s,i)=>{if(s.buffer.duration<=offset)return;const n=StemAudio.connectStem(audio,s.buffer,plan[i],master);n.index=i;n.source.start(started,offset);live.push(n);});playing=true;$('stems-play').textContent='Ⅱ Pause stems';
  function tick(){if(!playing)return;const pos=position();$('stems-seek').value=pos;$('stems-time').textContent=clock(pos)+' / '+clock(duration());if(pos>=duration()){stopPlayback(true);return;}frame=requestAnimationFrame(tick);}tick();
 }catch(e){stopPlayback();status.textContent='Could not play stems: '+e.message;}
}
$('stems-play').onclick=play;$('stems-stop').onclick=()=>stopPlayback(true);
$('stems-seek').oninput=()=>{const resume=playing,next=+$('stems-seek').value;stopPlayback();offset=next;$('stems-seek').value=next;$('stems-time').textContent=clock(next);if(resume)play();};
$('stems-volume').oninput=updateLive;$('stems-compare').onchange=updateLive;
$('stems-normalize').onchange=()=>invalidate();
$('stems-reset').onclick=()=>{stems.forEach(s=>Object.assign(s,{level:0,pan:0,mute:false,solo:false}));changed();draw();};
$('stems-render').onclick=async()=>{
 if(!stems.length)return;invalidate();const token=renderVersion,fileToken=version,snapshot=stems.map(s=>({...s}));$('stems-render').disabled=true;status.textContent='Rendering your balance locally…';
 try{
  if(!StemAudio.balancePlan(snapshot).some(p=>p.gain>0))throw Error('All stems are muted. Enable at least one stem.');
  const rendered=await StemAudio.renderStems(snapshot,$('stems-normalize').checked);if(token!==renderVersion||fileToken!==version)return;
  const stats=MixAudio.analyzeAudio(rendered.channels,rendered.sampleRate);if(stats.silent)throw Error('The resulting mix is silent. Check mute/solo and source files.');
  if(stats.peakDb>0.00001)throw Error('The combined sample peak exceeds 0 dBFS. Lower stem levels or enable −1 dBFS normalization, then export again.');
  const wav=MixAudio.encodeWav(rendered.channels,rendered.sampleRate);if(wav.clamped)throw Error('Clipping detected. Lower levels and render again.');
  downloadUrl=URL.createObjectURL(new Blob([wav.buffer],{type:'audio/wav'}));const a=text('a','Download combined mix (24-bit WAV)',result);a.className='download-midi';a.href=downloadUrl;a.download='songroom-stem-mix.wav';
  text('p',`Stereo · ${rendered.sampleRate.toLocaleString()} Hz · ${clock(stats.duration)} · sample peak ${stats.peakDb.toFixed(1)} dBFS. Export uses your edited balance, including mute/solo.`,result);status.textContent='Combined mix ready. Download it, or load it into the stereo mix helper for EQ and compression.';
 }catch(e){if(token===renderVersion)status.textContent='Could not export: '+e.message;}finally{$('stems-render').disabled=false;}
};
window.addEventListener('songroom:audio-play',e=>{if(e.detail!=='stems')stopPlayback();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});
window.addEventListener('pagehide',()=>{stopPlayback();version++;invalidate();audio?.close().catch(()=>{});audio=null;});
})();
