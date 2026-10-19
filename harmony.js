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
const majorStyles={
 Blues:[],
 Jazz:[['Classic ii–V–I',[[2,'m7','ii7'],[7,'7','V7'],[0,'maj7','Imaj7']]],['Jazz turnaround',[[0,'maj7','Imaj7'],[9,'m7','vi7'],[2,'m7','ii7'],[7,'7','V7']]]],
 Country:[['Three chords & a story',[[0,'','I'],[5,'','IV'],[0,'','I'],[7,'','V']]],['Open-road chorus',[[0,'','I'],[7,'','V'],[9,'m','vi'],[5,'','IV']]]],
 Folk:[['Campfire circle',[[0,'','I'],[5,'','IV'],[9,'m','vi'],[7,'','V']]],['Wandering home',[[9,'m','vi'],[5,'','IV'],[0,'','I'],[7,'','V']]]],
 Rock:[['Anthem',[[0,'','I'],[7,'','V'],[9,'m','vi'],[5,'','IV']]],['Mixolydian drive',[[0,'','I'],[10,'','♭VII'],[5,'','IV'],[0,'','I']]]]
};
// Each entry is [name, bars]. Blues uses explicit bar lengths for a full 12-bar form.
majorStyles.Blues=[['12-bar blues',[[0,'7','I7',4],[5,'7','IV7',2],[0,'7','I7',2],[7,'7','V7',1],[5,'7','IV7',1],[0,'7','I7',1],[7,'7','V7',1]]],['Blues turnaround',[[0,'7','I7'],[5,'7','IV7'],[0,'7','I7'],[7,'7','V7']]]];
function modalProgressions(mode,genre){
 const characteristic={major:[0,3,4,0],minor:[0,5,2,6],dorian:[0,3,0,6],phrygian:[0,1,0,6],lydian:[0,1,4,0],mixolydian:[0,6,3,0],locrian:[0,1,4,0],harmonicMinor:[0,3,4,0],melodicMinor:[0,3,4,0]};
 const build=degrees=>degrees.map(d=>degreeChord(mode,d,genre==='Jazz'));
 return [[`${scales[mode].label.split(' (')[0]} · color loop`,build(characteristic[mode])],[genre==='Jazz'?'Modal ii–V–i / I':'Tonic return',build(genre==='Jazz'?[1,4,0]:[0,3,4,0])]];
}
// Section recipes use scale-degree indices and explicit whole-bar durations.
const sectionRecipes={
 Blues:[['Verse · laid-back blues',[[0,4],[3,2],[0,2]],'Verse'],['Verse · moving bass feel',[[0,2],[3,2],[0,2],[4,2]],'Verse'],['Pre-chorus · slow climb',[[3,2],[0,1],[4,1]],'Pre-chorus'],['Pre-chorus · lean on V',[[3,1],[3,1],[4,2]],'Pre-chorus'],['Chorus · call and response',[[0,2],[3,2],[0,2],[4,1],[3,1]],'Chorus'],['Chorus · turnaround hook',[[0,2],[3,2],[0,2],[4,1],[0,1]],'Chorus'],['Bridge · step away',[[3,2],[3,2],[0,2],[4,2]],'Bridge'],['Bridge · minor contrast',[[5,2],[1,2],[3,2],[4,2]],'Bridge']],
 Jazz:[['Verse · tonic in motion',[[0,2],[5,2],[1,2],[4,2]],'Verse'],['Verse · descending colors',[[2,2],[5,2],[1,2],[4,2]],'Verse'],['Pre-chorus · circle climb',[[2,1],[5,1],[1,1],[4,1]],'Pre-chorus'],['Pre-chorus · suspended arrival',[[3,1],[1,1],[4,2]],'Pre-chorus'],['Chorus · home in sevenths',[[0,2],[3,2],[1,1],[4,1],[0,2]],'Chorus'],['Chorus · long resolution',[[1,2],[4,2],[0,4]],'Chorus'],['Bridge · open the harmony',[[3,2],[2,2],[1,2],[4,2]],'Bridge'],['Bridge · circle back',[[5,2],[1,2],[4,2],[0,2]],'Bridge']],
 Country:[['Verse · storytelling',[[0,2],[3,2],[0,2],[4,2]],'Verse'],['Verse · bittersweet road',[[0,2],[5,2],[3,2],[4,2]],'Verse'],['Pre-chorus · lift the story',[[1,1],[3,1],[4,2]],'Pre-chorus'],['Pre-chorus · hold the promise',[[5,1],[3,1],[4,2]],'Pre-chorus'],['Chorus · wide-open hook',[[0,2],[4,2],[5,2],[3,2]],'Chorus'],['Chorus · homeward bound',[[3,2],[0,2],[4,2],[0,2]],'Chorus'],['Bridge · a different view',[[5,2],[3,2],[0,2],[4,2]],'Bridge'],['Bridge · turn the page',[[1,2],[3,2],[5,2],[4,2]],'Bridge']],
 Folk:[['Verse · around the fire',[[0,2],[3,2],[5,2],[4,2]],'Verse'],['Verse · quiet reflection',[[5,2],[3,2],[0,2],[4,2]],'Verse'],['Pre-chorus · gathering light',[[1,1],[3,1],[4,2]],'Pre-chorus'],['Pre-chorus · a gentle rise',[[5,1],[1,1],[3,1],[4,1]],'Pre-chorus'],['Chorus · sing together',[[0,2],[4,2],[3,2],[0,2]],'Chorus'],['Chorus · another way home',[[3,2],[0,2],[5,2],[4,2]],'Chorus'],['Bridge · take a breath',[[5,2],[2,2],[3,2],[4,2]],'Bridge'],['Bridge · turn the lantern',[[1,2],[5,2],[3,2],[4,2]],'Bridge']],
 Rock:[['Verse · steady drive',[[0,2],[5,2],[3,2],[4,2]],'Verse'],['Verse · darker opening',[[5,2],[3,2],[0,2],[4,2]],'Verse'],['Pre-chorus · build the tension',[[1,1],[3,1],[4,2]],'Pre-chorus'],['Pre-chorus · rising stakes',[[5,1],[3,1],[4,1],[4,1]],'Pre-chorus'],['Chorus · big release',[[0,2],[4,2],[5,2],[3,2]],'Chorus'],['Chorus · lift and land',[[3,2],[4,2],[0,2],[0,2]],'Chorus'],['Bridge · pull it back',[[5,2],[2,2],[3,2],[4,2]],'Bridge'],['Bridge · rebuild',[[1,2],[3,2],[5,2],[4,2]],'Bridge']]
};
const bluesForms=[
 ['8-bar blues',[[0,2],[3,1],[0,1],[4,1],[3,1],[0,1],[4,1]]],
 ['16-bar blues',[[0,4],[3,4],[0,4],[4,1],[3,1],[0,1],[4,1]]],
 ['12-bar blues · quick change',[[0,1],[3,1],[0,2],[3,2],[0,2],[4,1],[3,1],[0,1],[4,1]]],
 ['24-bar blues · stretched changes',[[0,8],[3,4],[0,4],[4,2],[3,2],[0,2],[4,2]]]
];
function sectionChord(mode,genre,degree,bars){
 const c=degreeChord(mode,degree,genre==='Jazz');c[3]=bars;
 if(mode==='major'&&genre==='Blues'&&[0,3,4].includes(degree)){c[1]='7';c[2]=['I7','','','IV7','V7'][degree];}
 return c;
}
function progressionLibrary(mode,genre){
 const original=mode==='major'?majorStyles[genre]:modalProgressions(mode,genre);
 // Keep original indices stable so previously saved ideas retain their progressions.
 const entries=original.map(([name,chords])=>[name,chords,{part:'Loops',about:'A short starting point. Repeat or develop it to suit your melody.'}]);
 const build=recipe=>recipe.map(([degree,bars])=>sectionChord(mode,genre,degree,bars));
 if(genre==='Blues')for(const [name,recipe] of bluesForms)entries.push([mode==='major'?name:name+' · modal adaptation',build(recipe),{part:'Forms',about:mode==='major'?'One blues-form variation; turnaround choices differ between songs.':'Blues-form timing with chords harmonized from the selected scale, rather than traditional dominant-seventh blues.'}]);
 if(genre!=='Blues'){const verse=sectionRecipes[genre][0][1],chorus=sectionRecipes[genre][4][1],bridge=sectionRecipes[genre][6][1];entries.push(['16-bar verse + chorus',build([...verse,...chorus]),{part:'Forms',about:'Eight bars of verse followed by eight bars of chorus.'}]);entries.push([genre==='Jazz'?'32-bar AABA form':'32-bar verse / chorus form',build(genre==='Jazz'?[...verse,...verse,...bridge,...verse]:[...verse,...chorus,...verse,...chorus]),{part:'Forms',about:genre==='Jazz'?'Three eight-bar A sections with a contrasting eight-bar B section before the final A.':'Two verse-and-chorus passes, eight bars per section.'}]);}
 for(const [name,recipe,part] of sectionRecipes[genre])entries.push([name,build(recipe),{part,about:part==='Pre-chorus'?'A shorter build toward the chorus. Try a rising melody or a busier rhythm.':part==='Chorus'?'An eight-bar hook section. Let your melody and dynamics supply the lift.':part==='Bridge'?'An eight-bar contrast section. Try a new register, texture, or lyric perspective.':'An eight-bar starting point with room for the story.'}]);
 return entries;
}
function barCount(chords){return chords.reduce((sum,c)=>sum+(c[3]||1),0);}
const api={scales,chordIntervals,spellScale,degreeChord,modalProgressions,progressionLibrary,barCount};if(typeof module!=='undefined')module.exports=api;else root.Harmony=api;
})(typeof globalThis!=='undefined'?globalThis:this);
