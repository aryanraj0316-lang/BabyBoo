/** Native worklet closures initialize eagerly; plain TS tests do not catch forward references. */
const fs=require('fs');
const path=require('path');
const babel=require('@babel/core');
const root=path.resolve(__dirname,'../..');
const folder=path.join(root,'src/onboarding/screen1/buddy/cutout');
const previous=require.extensions['.ts'];
require.extensions['.ts']=(mod,file)=>{
  if(!file.startsWith(folder))throw new Error('Unexpected TS import '+file);
  const {code}=babel.transformFileSync(file,{configFile:false,babelrc:false,presets:[require.resolve('babel-preset-expo')]});
  mod._compile(code,file);
};
try {
  const model=require(path.join(folder,'model.ts'));
  const motion=require(path.join(folder,'motion.ts'));
  const draw=require(path.join(folder,'drawCutout.ts'));
  const seen=new Set();let worklets=0;
  function inspect(value,label){
    if(value===undefined)throw new Error('Uninitialized worklet dependency: '+label);
    if(value===null||seen.has(value)||ArrayBuffer.isView(value))return;
    if(Array.isArray(value)&&!label.endsWith('.__closure'))return;
    if(typeof value==='function'){
      seen.add(value);
      if(value.__closure){worklets++;inspect(value.__closure,label+'.__closure');}
    }else if(typeof value==='object'){
      seen.add(value);for(const [key,child] of Object.entries(value))inspect(child,label+'.'+key);
    }
  }
  for(const [key,value] of Object.entries({...model,...motion,...draw}))inspect(value,key);
  const p=model.projectPoint(0,0,0,model.NEUTRAL);
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new Error('Projection failed after native Babel transform');
  console.log(`PASS: ${worklets} Babel-transformed worklet closures have initialized dependencies.`);
}finally{if(previous)require.extensions['.ts']=previous;else delete require.extensions['.ts'];}
