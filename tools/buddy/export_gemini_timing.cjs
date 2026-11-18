/** Read current Screen 1 data without importing native renderers or editing app code. */
const fs=require('fs'),path=require('path'),Module=require('module'),esbuild=require('esbuild');
const ROOT=path.resolve(__dirname,'../..');
(async()=>{
  const result=await esbuild.build({stdin:{contents:`export {demo,buddyTimeline,battery,dim,unlock,swipes,loopSeam} from './src/onboarding/screen1/tokens';export {dialogueTurns} from './src/onboarding/screen1/dialogue';`,resolveDir:ROOT,sourcefile:'screen1-handoff.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false});
  const filename=path.join(ROOT,'node_modules/.cache/gemini-timing.cjs');
  const mod=new Module(filename);mod.filename=filename;
  mod.paths=Module._nodeModulePaths(ROOT);mod._compile(result.outputFiles[0].text,filename);
  const t=mod.exports;
  const mappingText=fs.readFileSync(path.join(ROOT,'src/onboarding/screen1/buddyImages.generated.ts'),'utf8');
  const mapping={};
  for(const match of mappingText.matchAll(/(\w+):\s*require\('([^']+)'\)/g))mapping[match[1]]=path.resolve(ROOT,'src/onboarding/screen1',match[2]);
  const frames=t.buddyTimeline.map(([from,id],i,all)=>({id,from,to:i+1<all.length?all[i+1][0]:t.demo.loop,sourceStem:path.relative(ROOT,mapping[id]).replace(/\\/g,'/')}));
  const timing={loopSeconds:t.demo.loop,canvasPt:{width:160,height:159},baselinePt:155,seatXPt:80,headWidthPt:106,
    phone:{reelSwipes:t.swipes.times,scrollStall:t.swipes.stall.time,batteryWarning:7.6,batteryTakeover:8.3,batteryDrain:{from:t.battery.drainFrom,to:t.battery.drainTo,startPercent:t.battery.start*100,endPercent:t.battery.end*100},shutdown:{from:t.dim.at,to:t.dim.at+t.dim.length},parentPrompt:t.demo.beats.unlock,drawA:{from:t.demo.beats.unlock+t.unlock.swipe[0],to:t.demo.beats.unlock+t.unlock.swipe[1]},unlocked:t.demo.beats.unlocked,rest:t.demo.beats.rest,loopSeam:t.loopSeam},
    buddyFrames:frames,dialogueTurns:t.dialogueTurns};
  const out=path.join(ROOT,'design/screen1/gemini_handoff');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'screen1_timing.json'),JSON.stringify(timing,(_,v)=>typeof v==='number'?Math.round(v*1000)/1000:v,2)+'\n');
  console.log(JSON.stringify(timing,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
