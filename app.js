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
function diagram(){const c=auditionChord||progression()[selected],root=(key+c[0])%12; $('chordTitle').textContent=chordName(c);$('guitar').classList.toggle('selected',instrument==='guitar');$('piano').classList.toggle('selected',instrument==='piano');
if(instrument==='piano'){const on=intervals[c[1]].map(n=>(root+n)%12),white=[0,2,4,5,7,9,11];let s='<svg viewBox="0 0 322 175" role="img" aria-label="Piano notes for '+chordName(c)+'">';white.forEach((n,i)=>s+=`<rect x="${i*46}" y="5" width="44" height="155" rx="4" fill="${on.includes(n)?'#c4d5a5':'#fff'}" stroke="#b8bfab"/><text x="${i*46+22}" y="145" text-anchor="middle" font-size="12" fill="#47573b">${names[n]}</text>`);[1,3,6,8,10].forEach(n=>{let i=white.findIndex(w=>w===n-1);s+=`<rect x="${i*46+30}" y="5" width="28" height="96" rx="3" fill="${on.includes(n)?'#7d995b':'#354335'}"/><text x="${i*46+44}" y="84" text-anchor="middle" font-size="9" fill="white">${names[n]}</text>`});$('diagram').innerHTML=s+'</svg>';$('hint').textContent='Highlighted keys are chord tones. Try these notes in different octaves.';
}else{const fret=(root-4+12)%12;const shape=({'':[0,2,2,1,0,0],m:[0,2,2,0,0,0],'7':[0,2,0,1,0,0],maj7:[0,2,1,1,0,0],m7:[0,2,0,0,0,0],dim:[0,1,2,0,null,null],aug:[0,3,2,1,null,null],'m7♭5':[0,null,0,0,3,null],dim7:[0,1,2,0,2,null],'m(maj7)':[0,2,1,0,0,0],'maj7♯5':[0,3,1,1,null,null]})[c[1]];const frets=shape.map(x=>x===null?null:x+fret),start=fret||1;let s='<svg viewBox="0 0 250 210" role="img" aria-label="Guitar fingering for '+chordName(c)+'">';for(let i=0;i<6;i++)s+=`<line x1="${55+i*28}" y1="35" x2="${55+i*28}" y2="180" stroke="#87937b" stroke-width="${1.8-i*.2}"/><text x="${55+i*28}" y="202" text-anchor="middle" font-size="11" fill="#818b76">${['E','A','D','G','B','e'][i]}</text>`;for(let i=0;i<6;i++)s+=`<line x1="55" x2="195" y1="${35+i*29}" y2="${35+i*29}" stroke="#aab39b" stroke-width="${i===0&&!fret?4:1}"/>`;s+=`<text x="25" y="55" font-size="12" fill="#667657">${start}fr</text>`;frets.forEach((f,i)=>s+=f===null?`<text x="${55+i*28}" y="25" text-anchor="middle" font-size="16" fill="#5a7341">×</text>`:f===0?`<circle cx="${55+i*28}" cy="21" r="5" fill="none" stroke="#5a7341"/>`:`<circle cx="${55+i*28}" cy="${35+(f-start+.5)*29}" r="9" fill="#5a7341"/>`);$('diagram').innerHTML=s+'</svg>';$('hint').textContent='Standard tuning, low E at left. × = mute; circles = open strings; dots = sounding frets. '+(fret?'Movable voicing; barre the lowest fret where needed.':'Open-position voicing.');}}
async function sound(c,duration=.9){
 window.dispatchEvent(new CustomEvent('songroom:audio-play',{detail:'chords'}));
 $('mix-before')?.pause();$('mix-after')?.pause();
 const generation=playbackGeneration;
 ctx ||= new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();
 if(generation!==playbackGeneration)return;
 const root=48+(key+c[0])%12;
 const sources=ToneEngine.playChord(ctx,intervals[c[1]].map(n=>root+n),{tone:$('tone').value,duration,volume:+$('tone-volume').value/100});
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
