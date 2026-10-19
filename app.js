const $=id=>document.getElementById(id);
const names=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const styles={Blues:[],Jazz:[],Country:[],Folk:[],Rock:[]};
const feelings={Blues:'A little grit, a little soul. Dominant sevenths give this progression its blues character.',Jazz:'Smooth resolutions and colorful sevenths. Let the voicings breathe.',Country:'Honest changes with plenty of room for a story.',Folk:'Warm, familiar changes for a melody to settle into.',Rock:'Strong movement for a big hook. Try a different strumming rhythm.'};
let auditionChord=null;
let genre='Folk',key=0,mode='major',selected=0,instrument='guitar',ctx,playing=false,timer,voices=[];
let playbackGeneration=0;
const intervals=Harmony.chordIntervals;
$('tone').innerHTML=Object.entries(ToneEngine.presets).map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
$('tone').onchange=()=>stop();
$('tone-volume').oninput=()=>stop();
const availableProgressions=()=>Harmony.progressionLibrary(mode,genre);
const progression=()=>availableProgressions()[+$('variation').value][1];
const chordName=c=>(c[4]===undefined?names[(key+c[0])%12]:Harmony.spellScale(key,mode)[c[4]])+c[1];
$('mode').innerHTML=Object.entries(Harmony.scales).map(([id,s])=>`<option value="${id}">${s.label}</option>`).join('');
$('key').innerHTML=names.map((n,i)=>`<option value="${i}">${n}</option>`).join('');
$('genres').innerHTML=Object.keys(styles).map(n=>`<button data-genre="${n}">${n}</button>`).join('');
function variants(){
 const part=$('song-part').value;
 $('variation').innerHTML=availableProgressions().map((x,i)=>({entry:x,index:i})).filter(x=>part==='all'||x.entry[2].part===part).map(({entry:x,index:i})=>`<option value="${i}">${x[0]} · ${Harmony.barCount(x[1])} bars</option>`).join('');
}
function render(){auditionChord=null;document.querySelectorAll('[data-genre]').forEach(b=>b.classList.toggle('selected',b.dataset.genre===genre));const entry=availableProgressions()[+$('variation').value];$('description').textContent=`${entry[0]} · ${Harmony.barCount(entry[1])} bars in 4/4. ${entry[2].about} `+(mode==='major'?feelings[genre]:(genre==='Blues'?'Modal harmony. ':genre+' voicing approach. ')+Harmony.scales[mode].about);const scaleNotes=Harmony.spellScale(key,mode);$('scale-info').textContent=`${scaleNotes[0]} ${Harmony.scales[mode].label} · ${scaleNotes.join(' · ')}${mode==='major'&&genre==='Blues'?' — Blues uses dominant sevenths outside the major scale.':mode==='major'&&genre==='Rock'&&+$('variation').value===1?' — This progression borrows ♭VII from Mixolydian.':''}`;$('scale-chords').innerHTML=Array.from({length:7},(_,d)=>{const c=Harmony.degreeChord(mode,d,genre==='Jazz');return `<button data-degree="${d}" title="Preview ${chordName(c)}">${chordName(c)} <small>${c[2]}</small></button>`}).join('');$('chords').innerHTML=progression().map((c,i)=>`<button class="chord ${selected===i?'active':''}" data-chord="${i}"><strong>${chordName(c)}</strong><small>${c[2]} · ${c[3]||1} bar${c[3]>1?'s':''}</small><span class="bar-position">${(()=>{const from=1+progression().slice(0,i).reduce((sum,ch)=>sum+(ch[3]||1),0),to=from+(c[3]||1)-1;return from===to?'Bar '+from:'Bars '+from+'–'+to})()}</span></button>`).join('');diagram();}
let diagramIdentity='',displayedVoicings=[];
function diagram(){
 const c=auditionChord||progression()[selected],root=(key+c[0])%12,kind=$('voicing-kind').value,tones=intervals[c[1]];
 $('chordTitle').textContent=chordName(c);$('guitar').classList.toggle('selected',instrument==='guitar');$('piano').classList.toggle('selected',instrument==='piano');
 const identity=[root,c[1],instrument,kind].join(':');
 displayedVoicings=instrument==='guitar'?ChordVoicings.simpleGuitarVoicings(root,tones,kind,c[1]):ChordVoicings.simplePianoVoicings(root,tones,kind);
 const prior=identity===diagramIdentity?$('voicing').value:null;diagramIdentity=identity;
 $('voicing').innerHTML=displayedVoicings.map((v,i)=>`<option value="${i}">${v.label}</option>`).join('');
 if(prior!==null&&displayedVoicings[+prior])$('voicing').value=prior;
 const v=displayedVoicings[+$('voicing').value];
 const note=n=>names[n%12]+(Math.floor(n/12)-1);
 $('voicing-notes').textContent=v.midis.map(note).join(' · ')+(v.omitted.length?' — Triad: seventh omitted.':'');
 if(instrument==='guitar'){
  const fretted=v.frets.filter(f=>f!==null&&f>0),start=fretted.length&&Math.max(...fretted)>5?Math.min(...fretted):1;
  let s=`<svg viewBox="0 0 270 255" role="img" aria-label="${chordName(c)} guitar ${v.label}">`;
  for(let i=0;i<6;i++)s+=`<line x1="${60+i*29}" y1="38" x2="${60+i*29}" y2="188" stroke="#87937b" stroke-width="${1.8-i*.2}"/><text x="${60+i*29}" y="211" text-anchor="middle" font-size="11" fill="#818b76">${['E','A','D','G','B','e'][i]}</text><text x="${60+i*29}" y="233" text-anchor="middle" font-size="10" fill="#818b76">${v.frets[i]===null?'—':names[(ChordVoicings.tuning[i]+v.frets[i])%12]}</text>`;
  for(let i=0;i<6;i++)s+=`<line x1="60" x2="205" y1="${38+i*30}" y2="${38+i*30}" stroke="#aab39b" stroke-width="${i===0&&start===1?4:1}"/>`;
  s+=`<text x="20" y="58" font-size="12" fill="#667657">${start}fr</text>`;
  v.frets.forEach((f,i)=>{const x=60+i*29;s+=f===null?`<text x="${x}" y="26" text-anchor="middle" font-size="16" fill="#5a7341">×</text>`:f===0?`<circle cx="${x}" cy="24" r="5" fill="none" stroke="#5a7341"/>`:`<circle cx="${x}" cy="${38+(f-start+.5)*30}" r="10" fill="#5a7341"/><text x="${x}" y="${42+(f-start+.5)*30}" text-anchor="middle" font-size="10" fill="#2b211a">${((ChordVoicings.tuning[i]+f-root)%12+12)%12===0?'R':''}</text>`;});
  $('diagram').innerHTML=s+'</svg>';$('hint').textContent='Standard tuning, low E at left. × = mute · ○ = open string · R = fretted root.';
 }else{
  let low=Math.min(...v.midis),high=Math.max(...v.midis);if([1,3,6,8,10].includes(low%12))low--;if([1,3,6,8,10].includes(high%12))high++;const white=[];
  for(let n=low;n<=high;n++)if([0,2,4,5,7,9,11].includes(n%12))white.push(n);
  const width=white.length*32;let s=`<svg viewBox="0 0 ${width} 175" role="img" aria-label="${chordName(c)} piano ${v.label}">`;
  white.forEach((n,i)=>s+=`<rect x="${i*32}" y="5" width="30" height="155" rx="3" fill="${v.midis.includes(n)?'#c4d5a5':'#fff'}" stroke="#b8bfab"/><text x="${i*32+15}" y="145" text-anchor="middle" font-size="9" fill="#47573b">${note(n)}</text>`);
  white.forEach((n,i)=>{if(![0,2,5,7,9].includes(n%12)||n+1>high)return;s+=`<rect x="${i*32+21}" y="5" width="20" height="96" rx="3" fill="${v.midis.includes(n+1)?'#7d995b':'#354335'}"/><text x="${i*32+31}" y="84" text-anchor="middle" font-size="7" fill="white">${note(n+1)}</text>`;});
  $('diagram').innerHTML=s+'</svg>';$('hint').textContent='Play the highlighted keys. C4 = middle C.';
 }
}
$('voicing-kind').onchange=()=>{stop();diagram()};$('voicing').onchange=()=>{stop();diagram()};
$('hear-voicing').onclick=()=>{stop();const v=displayedVoicings[+$('voicing').value];sound(null,1.5,v.midis).catch(()=>$('status').textContent='Audio unavailable.');};
async function sound(c,duration=.9,exactNotes=null){
 window.dispatchEvent(new CustomEvent('songroom:audio-play',{detail:'chords'}));
 $('mix-before')?.pause();$('mix-after')?.pause();
 const generation=playbackGeneration;
 ctx ||= new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();
 if(generation!==playbackGeneration)return;
 const root=c?48+(key+c[0])%12:0;
 const sources=ToneEngine.playChord(ctx,exactNotes||intervals[c[1]].map(n=>root+n),{tone:$('tone').value,duration,volume:+$('tone-volume').value/100});
 voices.push(...sources);sources.forEach(source=>source.addEventListener('ended',()=>voices=voices.filter(v=>v!==source),{once:true}));
}
function stop(){playbackGeneration++;playing=false;clearTimeout(timer);voices.forEach(v=>{try{v.stop()}catch{}});voices=[];$('play').textContent='▶ Hear progression';$('status').textContent='Click a chord to hear it.';}
function step(i,barIndex=0){
 if(!playing)return;if(i>=progression().length){stop();return;}
 selected=i;render();const c=progression()[i],seconds=60/+$('tempo').value*4;
 sound(c,seconds*.9).catch(()=>{stop();$('status').textContent='Audio is unavailable in this browser.';});
 const barNumber=progression().slice(0,i).reduce((sum,ch)=>sum+(ch[3]||1),0)+barIndex+1;
 $('status').textContent=`Playing ${chordName(c)} · bar ${barNumber} of ${Harmony.barCount(progression())}`;
 timer=setTimeout(()=>barIndex+1<(c[3]||1)?step(i,barIndex+1):step(i+1),seconds*1000);
}
$('scale-chords').onclick=e=>{const b=e.target.closest('[data-degree]');if(!b)return;stop();auditionChord=Harmony.degreeChord(mode,+b.dataset.degree,genre==='Jazz');diagram();sound(auditionChord).catch(()=>$('status').textContent='Audio unavailable.');$('status').textContent=`Previewing ${chordName(auditionChord)} from this scale.`;};
$('play').onclick=()=>{if(playing){stop();return;}playing=true;$('play').textContent='■ Stop';step(0)};
$('song-part').onchange=()=>{stop();selected=0;variants();render()};
$('genres').onclick=e=>{if(!e.target.dataset.genre)return;stop();genre=e.target.dataset.genre;selected=0;variants();render()};$('mode').onchange=()=>{stop();mode=$('mode').value;selected=0;variants();render();$('voice-results').replaceChildren()};$('key').onchange=()=>{stop();key=+$('key').value;render()};$('variation').onchange=()=>{stop();selected=0;render()};$('chords').onclick=e=>{const b=e.target.closest('[data-chord]');if(!b)return;stop();selected=+b.dataset.chord;render();sound(progression()[selected]).catch(()=>$('status').textContent='Audio unavailable.')};$('tempo').oninput=()=>{$('bpmText').textContent=$('tempo').value+' BPM'};
for(const name of ['guitar','piano'])$(name).onclick=()=>{instrument=name;diagram()};
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{$('status').textContent='Browser storage unavailable; copy your notes before closing.';return false}}
$('notes').value=read('songroom-notes','');$('notes').oninput=()=>write('songroom-notes',$('notes').value);let ideas=read('songroom-ideas',[]);function saved(){ $('saved').replaceChildren();ideas.forEach((idea,i)=>{const b=document.createElement('button');b.textContent=`↗ ${names[idea.key]} · ${idea.genre} · ${Harmony.scales[idea.mode||'major'].label} · ${idea.title}`;b.onclick=()=>{stop();genre=idea.genre;key=idea.key;mode=Harmony.scales[idea.mode]?idea.mode:'major';$('mode').value=mode;$('key').value=key;$('song-part').value='all';variants();$('variation').value=idea.variant;$('tone').value=ToneEngine.presets[idea.tone]?idea.tone:'acoustic';$('tone-volume').value=idea.volume??65;$('tempo').value=idea.tempo;$('tempo').oninput();$('notes').value=idea.notes;write('songroom-notes',idea.notes);selected=0;render()};$('saved').append(b);const del=document.createElement('button');del.textContent='×';del.setAttribute('aria-label','Delete '+idea.title);del.onclick=()=>{ideas.splice(i,1);write('songroom-ideas',ideas);saved()};$('saved').append(del)})}
$('save').onclick=()=>{const idea={genre,key,mode,tone:$('tone').value,volume:+$('tone-volume').value,variant:+$('variation').value,tempo:+$('tempo').value,notes:$('notes').value,title:availableProgressions()[+$('variation').value][0]};ideas.push(idea);if(write('songroom-ideas',ideas))$('status').textContent='Idea saved on this browser.';saved()};variants();render();saved();
