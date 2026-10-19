/* Pitch and transposition helpers are shared with the dependency-free Node tests. */
function detectPitch(samples, sampleRate) {
  let power=0; for(const v of samples) power+=v*v;
  if(Math.sqrt(power/samples.length)<0.012)return null;
  const min=Math.floor(sampleRate/1100),max=Math.min(Math.floor(sampleRate/65),Math.floor(samples.length/2));
  const size=samples.length-max, diff=new Float64Array(max+1);let sum=0;
  for(let lag=1;lag<=max;lag++){
    let d=0;for(let i=0;i<size;i++){const delta=samples[i]-samples[i+lag];d+=delta*delta;}
    sum+=d;diff[lag]=sum?d*lag/sum:1;
  }
  for(let lag=min;lag<max-1;lag++)if(diff[lag]<0.12){
    while(lag+1<max&&diff[lag+1]<diff[lag])lag++;
    const a=diff[lag-1],b=diff[lag],c=diff[lag+1],den=a-2*b+c;
    const refined=lag+(den?(a-c)/(2*den):0);
    return 69+12*Math.log2(sampleRate/refined/440);
  }
  return null;
}
function comfortableKeys(low,high,melodyLow,melodyHigh,sourceKey){
  if(![low,high,melodyLow,melodyHigh,sourceKey].every(Number.isFinite)||low>=high||melodyLow>melodyHigh)return [];
  const results=[];
  for(let shift=-36;shift<=36;shift++){
    const bottom=melodyLow+shift,top=melodyHigh+shift;
    if(bottom<low||top>high)continue;
    results.push({key:((sourceKey+shift)%12+12)%12,shift,low:bottom,high:top,margin:Math.min(bottom-low,high-top)});
  }
  return results.sort((a,b)=>b.margin-a.margin||Math.abs(a.shift)-Math.abs(b.shift));
}
if(typeof module!=='undefined')module.exports={detectPitch,comfortableKeys};
if(typeof document!=='undefined') {
const noteName=n=>names[n%12]+(Math.floor(n/12)-1);
for(const id of ['voice-low','voice-high','melody-low','melody-high']){
  const select=$(id);select.innerHTML='<option value="">Choose a note</option>';
  for(let n=28;n<=96;n++){const o=document.createElement('option');o.value=n;o.textContent=noteName(n);select.append(o);}
}
$('melody-key').innerHTML=names.map((n,i)=>`<option value="${i}">${n}</option>`).join('');
let session=null;
function finishCapture(message){
  if(!session)return;
  const active=session;session=null;clearTimeout(active.timeout);clearTimeout(active.tick);
  active.stream?.getTracks().forEach(t=>t.stop());active.source?.disconnect();active.audio?.close().catch(()=>{});
  $('voice-stop').hidden=true;document.querySelectorAll('.voice-actions button, #capture-melody').forEach(b=>b.disabled=false);
  const notes=active.notes.sort((a,b)=>a-b);
  if(active.mode==='melody'&&notes.length>=10){
    // Ignore a small number of transient pitch outliers; the singer can correct the estimates.
    $('melody-low').value=notes[Math.floor(notes.length*.02)];$('melody-high').value=notes[Math.min(notes.length-1,Math.floor(notes.length*.98))];
    message='Melody range estimated. Check these notes: short extremes may be missed. Set its current key before finding keys.';
  }else if(active.mode==='melody')message='Not enough stable singing detected. Try again or enter melody notes manually.';
  $('voice-status').textContent=message||'Microphone stopped. You can edit the detected note.';
}
async function capture(mode){
  if(session)return;
  if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext){$('voice-status').textContent='Microphone access needs HTTPS and a supported browser. You can still choose notes manually.';return;}
  stop();$('mix-before')?.pause();$('mix-after')?.pause();const active={mode,notes:[],recent:[]};session=active;
  document.querySelectorAll('.voice-actions button, #capture-melody').forEach(b=>b.disabled=true);$('voice-stop').hidden=false;
  $('voice-status').textContent='Allow microphone access, then sing a steady note.';
  try{
    const Audio=window.AudioContext||window.webkitAudioContext;active.audio=new Audio();await active.audio.resume();
    if(session!==active)return;
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    if(session!==active){stream.getTracks().forEach(t=>t.stop());return;}
    active.stream=stream;active.source=active.audio.createMediaStreamSource(stream);const analyser=active.audio.createAnalyser();analyser.fftSize=4096;active.source.connect(analyser);const buffer=new Float32Array(4096);
    active.timeout=setTimeout(()=>finishCapture(),mode==='melody'?45000:12000);
    function tick(){if(session!==active)return;analyser.getFloatTimeDomainData(buffer);const pitch=detectPitch(buffer,active.audio.sampleRate);
      if(pitch!==null){active.recent.push(pitch);if(active.recent.length>4)active.recent.shift();
        if(active.recent.length===4&&Math.max(...active.recent)-Math.min(...active.recent)<.65){
          const n=Math.round(active.recent.reduce((a,b)=>a+b,0)/4);
          if(n>=28&&n<=96){active.notes.push(n);$('voice-status').textContent=`Hearing ${noteName(n)}. ${mode==='melody'?'Keep singing; press Stop when finished.':'Hold your comfortable note…'}`;
          if(mode!=='melody'&&active.notes.length>=8){const sorted=active.notes.slice(-8).sort((a,b)=>a-b);$(mode==='low'?'voice-low':'voice-high').value=sorted[4];finishCapture(`Captured ${noteName(sorted[4])}. Check it and repeat if it doesn’t match your voice.`);return;}}
        }
      }else {active.recent=[];$('voice-status').textContent='Listening… sing one clear, steady note without accompaniment.';}
      active.tick=setTimeout(tick,90);
    }tick();
  }catch(error){if(session===active)finishCapture(error.name==='NotAllowedError'?'Microphone permission was denied. Allow it in browser settings, or choose notes manually.':'Could not access the microphone. Check your input device, or choose notes manually.');}
}
$('capture-low').onclick=()=>capture('low');$('capture-high').onclick=()=>capture('high');$('capture-melody').onclick=()=>capture('melody');$('voice-stop').onclick=()=>finishCapture();
window.addEventListener('pagehide',()=>finishCapture());
document.addEventListener('visibilitychange',()=>{if(document.hidden)finishCapture()});
$('recommend').onclick=()=>{
  const box=$('voice-results');box.replaceChildren();const low=+$('voice-low').value,high=+$('voice-high').value;
  if(!$('voice-low').value||!$('voice-high').value||low>=high){box.textContent='Choose a comfortable low and high note, with the high note above the low note.';return;}
  const hasLow=$('melody-low').value!=='',hasHigh=$('melody-high').value!=='';
  if(hasLow!==hasHigh){box.textContent='Enter both melody notes, or leave both blank for a starting-point suggestion.';return;}
  const supplied=hasLow&&hasHigh,source=supplied?+$('melody-key').value:0,recommendMode=mode;
  const mLow=supplied?+$('melody-low').value:60,mHigh=supplied?+$('melody-high').value:72;
  if(mLow>mHigh){box.textContent='The melody’s highest note must be at or above its lowest note.';return;}
  const results=comfortableKeys(low,high,mLow,mHigh,source);const intro=document.createElement('p');
  intro.textContent=supplied?'These transpositions fit the entered melody inside your comfortable range. Extra room at either end usually helps. Try singing the full song in each key.':`Starting points only: these assume a ${Harmony.scales[recommendMode].label} melody spanning the tonic up one octave. Your actual melody may need a different key. Add its notes above for a closer fit.`;box.append(intro);
  const seen=new Set();for(const result of results){if(seen.has(result.key))continue;seen.add(result.key);if(seen.size>3)break;
    const button=document.createElement('button');button.textContent=`Try ${names[result.key]} ${Harmony.scales[recommendMode].label} · melody ${noteName(result.low)}–${noteName(result.high)}${supplied?` · ${result.shift>=0?'+':''}${result.shift} semitones`:''}`;
    button.onclick=()=>{stop();mode=recommendMode;$('mode').value=mode;variants();key=result.key;$('key').value=key;selected=0;render();$('voice-status').textContent=`Progression set to ${names[key]} ${Harmony.scales[mode].label}. Sing the melody in the suggested register; chord playback is accompaniment, not the melody.`;};box.append(button);
  }
  if(!results.length){const p=document.createElement('p');p.textContent='This melody does not fit your entered range in any key. Check the notes, or try a narrower melody. Changing key alone cannot reduce a melody’s span.';box.append(p);}
};
}
