(function(root){
'use strict';
const scales={
 major:{label:'Major (Ionian)',steps:[0,2,4,5,7,9,11],about:'Bright and resolved. The familiar major-key sound.'},
 minor:{label:'Natural minor (Aeolian)',steps:[0,2,3,5,7,8,10],about:'Reflective and grounded. A minor third, sixth, and seventh soften the sound.'},
 dorian:{label:'Dorian',steps:[0,2,3,5,7,9,10],about:'Minor with a natural sixth: soulful, open, and good for a minor-to-major IV change.'},
 phrygian:{label:'Phrygian',steps:[0,1,3,5,7,8,10],about:'A minor sound with a tense flat second. Try moving between i and ♭II.'},
 lydian:{label:'Lydian',steps:[0,2,4,6,7,9,11],about:'Major with a raised fourth: floating and spacious. Try I to II.'},
 mixolydian:{label:'Mixolydian',steps:[0,2,4,5,7,9,10],about:'Major with a flat seventh: earthy and open. Try I to ♭VII.'},
 locrian:{label:'Locrian',steps:[0,1,3,5,6,8,10],about:'A diminished tonic and flat fifth create an unstable, experimental sound.'},
 harmonicMinor:{label:'Harmonic minor',steps:[0,2,3,5,7,8,11],about:'Minor with a raised seventh, giving the major V chord a strong pull toward i.'},
 melodicMinor:{label:'Melodic minor (ascending / jazz)',steps:[0,2,3,5,7,9,11],about:'Minor with a natural sixth and seventh. Uses the ascending/jazz form throughout.'}
};
const chordIntervals={'':[0,4,7],m:[0,3,7],dim:[0,3,6],aug:[0,4,8],'7':[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],'m7♭5':[0,3,6,10],dim7:[0,3,6,9],'m(maj7)':[0,3,7,11],'maj7♯5':[0,4,8,11]};
const tonics=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
function spellScale(key,mode){
 const letters=['C','D','E','F','G','A','B'],natural=[0,2,4,5,7,9,11],start=letters.indexOf(tonics[key][0]);
 return scales[mode].steps.map((step,i)=>{const letter=(start+i)%7;let accidental=((key+step-natural[letter])%12+12)%12;if(accidental>6)accidental-=12;return letters[letter]+(accidental<0?'♭'.repeat(-accidental):'♯'.repeat(accidental));});
}
function degreeChord(mode,degree,seventh=false){
 const steps=scales[mode].steps,base=steps[degree];const tones=[0,2,4,...(seventh?[6]:[])].map(n=>{const idx=degree+n;return steps[idx%7]+12*Math.floor(idx/7)-base;});
 const quality=Object.keys(chordIntervals).find(q=>String(chordIntervals[q])===String(tones));if(quality===undefined)throw Error('Unsupported chord '+tones);
 const alteration=base-[0,2,4,5,7,9,11][degree],prefix=alteration<0?'♭'.repeat(-alteration):'♯'.repeat(alteration);
 const roman=['I','II','III','IV','V','VI','VII'][degree],minor=quality.startsWith('m')&&!quality.startsWith('maj');
 const label=prefix+(minor||quality.startsWith('dim')?roman.toLowerCase():roman)+(quality==='dim'?'°':quality==='aug'?'+':quality==='m7♭5'?'ø7':quality==='dim7'?'°7':seventh?(quality==='maj7'?'maj7':quality==='maj7♯5'?'+maj7':quality==='m(maj7)'?'(maj7)':'7'):'');
 return [base,quality,label,1,degree];
}
function modalProgressions(mode,genre){
 const characteristic={major:[0,3,4,0],minor:[0,5,2,6],dorian:[0,3,0,6],phrygian:[0,1,0,6],lydian:[0,1,4,0],mixolydian:[0,6,3,0],locrian:[0,1,4,0],harmonicMinor:[0,3,4,0],melodicMinor:[0,3,4,0]};
 const build=degrees=>degrees.map(d=>degreeChord(mode,d,genre==='Jazz'));
 return [[`${scales[mode].label.split(' (')[0]} · color loop`,build(characteristic[mode])],[genre==='Jazz'?'Modal ii–V–i / I':'Tonic return',build(genre==='Jazz'?[1,4,0]:[0,3,4,0])]];
}
const api={scales,chordIntervals,spellScale,degreeChord,modalProgressions};if(typeof module!=='undefined')module.exports=api;else root.Harmony=api;
})(typeof globalThis!=='undefined'?globalThis:this);
