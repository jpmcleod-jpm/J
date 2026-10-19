(function(root){
'use strict';
const tuning=[40,45,50,55,59,64],strings=['E','A','D','G','B','e'];
const shapes={'':[0,2,2,1,0,0],m:[0,2,2,0,0,0],'7':[0,2,0,1,0,0],maj7:[0,2,1,1,0,0],m7:[0,2,0,0,0,0],dim:[0,1,2,0,null,null],aug:[0,3,2,1,null,null],'m7♭5':[0,null,0,0,3,null],dim7:[0,1,2,0,2,null],'m(maj7)':[0,2,1,0,0,0],'maj7♯5':[0,3,1,1,null,null]};
function inversion(midis,tonic,tones){const index=tones.indexOf(((Math.min(...midis)-tonic)%12+12)%12);return ['Root position','1st inversion','2nd inversion','3rd inversion'][index]||'Alternate bass';}
function guitarVoicings(tonic,tones,kind='full',quality=''){
 const wanted=kind==='triad'?tones.slice(0,3):tones,pcs=wanted.map(n=>(tonic+n)%12),result=[],seen=new Set();
 function add(frets,label){const midis=frets.flatMap((f,i)=>f===null?[]:[tuning[i]+f]);if(!pcs.every(p=>midis.some(n=>n%12===p)))return;const id=frets.map(f=>f===null?'x':f).join('-');if(seen.has(id))return;seen.add(id);const inv=inversion(midis,tonic,wanted);result.push({id,frets,midis,inversion:inv,label:label+' · '+inv,kind,omitted:kind==='triad'&&tones.length>3?tones.slice(3):[]});}
 if(kind==='full'&&shapes[quality]){const fret=(tonic-4+12)%12;add(shapes[quality].map(f=>f===null?null:f+fret),'E-family shape');}
 const count=kind==='triad'?3:4;
 // Compact shapes on contiguous strings; every required chord tone must be present.
 for(let first=6-count;first>=0;first--){const choices=Array.from({length:count},(_,j)=>Array.from({length:16},(_,f)=>f).filter(f=>pcs.includes((tuning[first+j]+f)%12)));
  function search(frets,j){if(j===count){const min=Math.min(...frets),max=Math.max(...frets);if(max-min>4)return;const shape=Array(6).fill(null);frets.forEach((f,i)=>shape[first+i]=f);add(shape,`${kind==='triad'?'Triad':'Compact'} · ${strings.slice(first,first+count).join('–')} strings`);return;}for(const f of choices[j])search([...frets,f],j+1);}
  search([],0);
 }
 return result;
}
function pianoVoicings(tonic,tones,kind='full'){
 const wanted=kind==='triad'?tones.slice(0,3):tones,rootNote=48+tonic,result=[];
 for(let i=0;i<wanted.length;i++){
  const closed=[...wanted.slice(i),...wanted.slice(0,i).map(n=>n+12)].map(n=>rootNote+n),inv=inversion(closed,tonic,wanted);
  result.push({id:'closed-'+i,midis:closed,label:'Close position · '+inv,inversion:inv,kind,omitted:kind==='triad'?tones.slice(3):[]});
  const spread=[...closed];spread[1]+=12;spread.sort((a,b)=>a-b);result.push({id:'spread-'+i,midis:spread,label:'Spread voicing · '+inv,inversion:inv,kind,omitted:kind==='triad'?tones.slice(3):[]});
 }
 return result;
}
function simpleGuitarVoicings(tonic,tones,kind='full',quality=''){
 const candidates=guitarVoicings(tonic,tones,kind,quality),labels=['Low E string','A string','D string','G string','B string','High e string'];
 const firstRoot=v=>v.frets.findIndex((f,i)=>f!==null&&(tuning[i]+f)%12===tonic);
 const score=v=>{const played=v.frets.filter(f=>f!==null);return (v.inversion==='Root position'?0:100)+Math.max(...played)+.1*(Math.max(...played)-Math.min(...played));};
 return labels.flatMap((label,string)=>{const group=candidates.filter(v=>firstRoot(v)===string).sort((a,b)=>score(a)-score(b));return group.length?[{...group[0],label:'Root on '+label,rootString:string}]:[];});
}
function simplePianoVoicings(tonic,tones,kind='full'){
 return pianoVoicings(tonic,tones,kind).filter(v=>v.id.startsWith('closed')).map(v=>{
  const index=v.midis.findIndex(n=>n%12===tonic),last=v.midis.length-1;
  const label=index===0?'Root at bottom':index===last?'Root at top':last===2?'Root in middle':index===1?'Root in lower middle':'Root in upper middle';
  return {...v,label,rootIndex:index};
 }).sort((a,b)=>a.rootIndex-b.rootIndex);
}
const api={tuning,guitarVoicings,pianoVoicings,simpleGuitarVoicings,simplePianoVoicings};if(typeof module!=='undefined')module.exports=api;else root.ChordVoicings=api;
})(typeof globalThis!=='undefined'?globalThis:this);
