(()=>{
let midi=null,song=null,filename='drums',urls=[],fileVersion=0,songVersion=0;
const info=$('drum-info'),results=$('drum-results');
function clear(){urls.forEach(URL.revokeObjectURL);urls=[];results.replaceChildren();}
function invalidate(){clear();}
for(const id of ['drum-every','drum-bpm','drum-offset','pad-snare','pad-hat','pad-high','pad-mid','pad-low'])$(id).addEventListener('change',invalidate);
$('drum-file').onchange=async()=>{
 const version=++fileVersion;clear();midi=null;$('drum-generate').disabled=true;const file=$('drum-file').files[0];if(!file)return;
 try{if(file.size>5*1024*1024)throw Error('Choose a MIDI clip smaller than 5 MB.');const parsed=DrumMidi.parseMidi(await file.arrayBuffer());if(version!==fileVersion)return;midi=parsed;filename=file.name.replace(/\.(mid|midi)$/i,'');
  const tempo=midi.tracks.flat().find(e=>e.bytes[0]===255&&e.bytes[1]===81);
  if(tempo){const b=tempo.bytes.slice(-3);$('drum-bpm').value=Math.round(60000000/(b[0]*65536+b[1]*256+b[2]));}
  const pads=[...new Set(midi.notes.map(n=>n.pitch))].sort((a,b)=>a-b);info.textContent=`Loaded ${midi.notes.length} notes · ${(midi.duration/(midi.ppq*4)).toFixed(2)} bars · pad numbers: ${pads.join(', ')}. Confirm tempo and pad mapping before generating.`;$('drum-generate').disabled=false;
 }catch(e){if(version===fileVersion)info.textContent=e.message;}
};
$('song-file').onchange=async()=>{
 const version=++songVersion;clear();song=null;const file=$('song-file').files[0];if(!file){info.textContent='Reference removed. Fills will use regular bar intervals.';return;}
 let audio;
 try{if(file.size>60*1024*1024)throw Error('Choose a reference audio file smaller than 60 MB.');info.textContent='Reading song reference…';
  const Audio=window.AudioContext||window.webkitAudioContext;audio=new Audio();const decoded=await audio.decodeAudioData(await file.arrayBuffer());
  if(version!==songVersion)return;if(decoded.duration>600)throw Error('Use a reference bounce of 10 minutes or less.');song={channels:Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i)),sampleRate:decoded.sampleRate};info.textContent=`Song reference loaded (${decoded.duration.toFixed(1)} seconds). Set the song tempo and where this MIDI clip starts in the reference.`;
 }catch(e){if(version===songVersion)info.textContent='Could not read reference: '+e.message+' Try a WAV or MP3 bounce supported by your browser.';}finally{audio?.close().catch(()=>{});}
};
function text(tag,value,parent=results){const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;}
$('drum-generate').onclick=()=>{
 clear();if(!midi)return;
 try{
  const every=+$('drum-every').value,fullBars=Math.floor(midi.duration/(midi.ppq*4));if(!fullBars)throw Error('Use a clip at least one complete 4/4 bar long.');
  const pad=id=>{if($(id).value==='')throw Error('Enter every drum pad number.');return +$(id).value;};
  let context=null;
  if($('song-file').files.length&&!song)throw Error('Wait for the song reference to load, or remove it before continuing.');
  if(song)context=DrumMidi.analyzeSong(song.channels,song.sampleRate,{bpm:+$('drum-bpm').value,offset:+$('drum-offset').value,barCount:fullBars,every});
  text('p',context?`Reference-guided candidate fill bars: ${context.fillBars.join(', ')||'none detected'}. ${context.fillBars.length?'':'Try a different interval or use MIDI alone for regular fills.'}`:`Regular fills at the ends of bars ${Array.from({length:Math.floor(fullBars/every)},(_,i)=>(i+1)*every).join(', ')||'none: choose a shorter interval'}. Add the song reference for energy-guided placement.`);
  if(midi.duration%(midi.ppq*4))text('p','The final partial bar is preserved without new hits.');
  text('p','Original timing, notes, velocities, and metadata are preserved. Empty drum bars and near-silent reference bars receive no new hits. Tempo controls reference alignment only; they do not change your MIDI tempo. Import into Ableton at the song tempo.');
  const seed=Math.floor(Math.random()*0xffffffff);
  for(const level of ['subtle','lively','adventurous']){
   const variation=DrumMidi.varyDrums(midi,{level,every,snare:pad('pad-snare'),hat:pad('pad-hat'),toms:[pad('pad-high'),pad('pad-mid'),pad('pad-low')],seed,fillBars:context?.fillBars??null,energy:context?.energy??null});
   const card=document.createElement('article');card.className='drum-result';results.append(card);text('h3',level[0].toUpperCase()+level.slice(1),card);text('p',`${variation.added.length} new hits · ${level==='subtle'?'short snare fills':level==='lively'?'fills, quiet ghost notes, and hat accents':'longer fills, more ghost notes, and hat accents'}`,card);
   const data=DrumMidi.encodeMidi(midi,variation.added),url=URL.createObjectURL(new Blob([data],{type:'audio/midi'}));urls.push(url);
   const link=document.createElement('a');link.className='download-midi';link.href=url;link.download=`${filename}-songroom-${level}.mid`;link.textContent='Download MIDI';card.append(link);
   if(!variation.added.length)text('p','No safe additions fit these settings. The download contains the original notes.',card);
  }
  info.textContent='Variations ready. Drag a downloaded .mid file onto a duplicate of your drum track in Ableton. Keep the same Drum Rack and loop length, then compare with the original.';
 }catch(e){results.replaceChildren();info.textContent=e.message;}
};
window.addEventListener('pagehide',()=>urls.forEach(URL.revokeObjectURL));
})();
