(()=>{
const dialog=$('progression-browser'),results=$('browse-results');let items=[],preview=null,timer=null,sequence=0,ownSound=false;
$('browse-key').innerHTML=$('key').innerHTML;$('browse-mode').innerHTML=$('mode').innerHTML;
function text(tag,value,parent){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
const normalize=value=>value.replaceAll('♭','b').replaceAll('♯','#').toLowerCase();
function browserChord(c){const tonic=+$('browse-key').value,scale=$('browse-mode').value;return (c[4]===undefined?names[(tonic+c[0])%12]:Harmony.spellScale(tonic,scale)[c[4]])+c[1];}
function stopPreview(){
 sequence++;clearTimeout(timer);timer=null;
 if(preview){preview.button.textContent='▶ Hear';preview.button.setAttribute('aria-pressed','false');preview.card.removeAttribute('data-playing');preview=null;stop();}
 $('browse-status').textContent='';
}
async function previewBar(item,button,card,index=0,barIndex=0,token=sequence){
 if(!preview||token!==sequence)return;
 if(index>=item.chords.length){stopPreview();return;}
 const c=item.chords[index],seconds=60/+$('tempo').value*4,root=48+(+$('browse-key').value+c[0])%12;
 const number=item.chords.slice(0,index).reduce((sum,ch)=>sum+(ch[3]||1),0)+barIndex+1;
 $('browse-status').textContent=`Hearing ${item.name} · bar ${number} of ${item.bars}`;
 try{ownSound=true;const played=sound(null,seconds*.9,intervals[c[1]].map(n=>root+n));ownSound=false;await played;if(token!==sequence||!preview)return;
  timer=setTimeout(()=>barIndex+1<(c[3]||1)?previewBar(item,button,card,index,barIndex+1,token):previewBar(item,button,card,index+1,0,token),seconds*1000);
 }catch{ownSound=false;stopPreview();$('browse-status').textContent='Audio is unavailable in this browser.';}
}
function hear(item,button,card){
 if(preview?.button===button){stopPreview();return;}
 stopPreview();stop();preview={button,card};button.textContent='■ Stop';button.setAttribute('aria-pressed','true');card.dataset.playing='true';previewBar(item,button,card);
}
function use(item){
 const tonic=+$('browse-key').value,scale=$('browse-mode').value;stopPreview();stop();genre=item.genre;key=tonic;mode=scale;selected=0;
 $('key').value=key;$('mode').value=mode;$('song-part').value='all';variants();$('variation').value=item.index;render();$('voice-results').replaceChildren();dialog.close();$('status').textContent=`Loaded ${item.name} in ${names[key]} ${Harmony.scales[mode].label}.`;
}
function draw(){
 stopPreview();const tonic=+$('browse-key').value,scale=$('browse-mode').value,filterGenre=$('browse-genre').value,part=$('browse-part').value,length=$('browse-length').value,type=$('browse-chords').value,search=normalize($('browse-search').value.trim());
 $('browser-context').textContent=`${names[tonic]} ${Harmony.scales[scale].label} · ${Harmony.spellScale(tonic,scale).join(' · ')}`;
 items=[];
 for(const name of Object.keys(styles))Harmony.progressionLibrary(scale,name).forEach(([title,chords,meta],index)=>{
  const bars=Harmony.barCount(chords),hasSeventh=chords.some(c=>intervals[c[1]].length>3);
  if(filterGenre!=='all'&&name!==filterGenre||part!=='all'&&meta.part!==part)return;
  if(length==='short'&&bars>4||length==='long'&&bars<16||['8','12'].includes(length)&&bars!==+length)return;
  if(type==='triads'&&hasSeventh||type==='sevenths'&&!hasSeventh)return;
  if(search&&!normalize(title+' '+name+' '+chords.map(browserChord).join(' ')).includes(search))return;
  const context=scale==='major'&&name==='Blues'?' Dominant-seventh blues includes notes outside the major scale.':scale==='major'&&name==='Rock'&&index===1?' Borrows the flat-seven chord from Mixolydian.':'';
  items.push({name:title,chords,genre:name,index,bars,part:meta.part,about:meta.about+context});
 });
 results.replaceChildren();results.scrollTop=0;$('browse-count').textContent=`${items.length} progression${items.length===1?'':'s'}`;
 if(!items.length){text('p','No progressions match these filters. Try another length, chord type, or search.',results);return;}
 for(const item of items){
  const card=document.createElement('article');card.className='browser-card';results.append(card);text('div',`${item.genre} · ${item.part} · ${item.bars} bars`,card).className='eyebrow';text('h3',item.name,card);
  const chips=document.createElement('div');chips.className='browser-chords';card.append(chips);
  item.chords.forEach(c=>{const chip=text('span',browserChord(c),chips);if((c[3]||1)>1)text('small',` × ${c[3]} bars`,chip);});
  text('p',item.about,card);
  const actions=document.createElement('div');actions.className='browser-card-actions';card.append(actions);
  const button=text('button','▶ Hear',actions);button.setAttribute('aria-label',`Hear ${item.genre} ${item.name}`);button.setAttribute('aria-pressed','false');button.onclick=()=>hear(item,button,card);
  const load=text('button','Use progression',actions);load.className='primary';load.setAttribute('aria-label',`Use ${item.genre} ${item.name}`);load.onclick=()=>use(item);
 }
}
function open(){stopPreview();$('browse-key').value=key;$('browse-mode').value=mode;draw();dialog.showModal();document.body.classList.add('browser-open');$('close-progressions').focus();}
$('open-progressions').onclick=open;$('close-progressions').onclick=()=>dialog.close();
for(const id of ['browse-key','browse-mode','browse-genre','browse-part','browse-length','browse-chords'])$(id).onchange=draw;$('browse-search').oninput=draw;
$('browse-reset').onclick=()=>{for(const id of ['browse-genre','browse-part','browse-length','browse-chords'])$(id).value='all';$('browse-search').value='';draw();};
dialog.addEventListener('close',()=>{stopPreview();document.body.classList.remove('browser-open');});
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();});
window.addEventListener('songroom:audio-play',()=>{if(!ownSound&&preview)stopPreview();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPreview();});
window.addEventListener('pagehide',()=>{stopPreview();if(dialog.open)dialog.close();});
})();
