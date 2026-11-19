/* One deterministic15s timeline; no wall-clock animation or synthesized mascot poses. */
gsap.ticker.sleep();
const $=selector=>document.querySelector(selector),all=selector=>[...document.querySelectorAll(selector)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const expo=v=>v<=0?0:v>=1?1:1-Math.pow(2,-10*v);
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
for(const node of all('.words')){const words=node.textContent.split(' ');node.textContent='';words.forEach((word,i)=>{const span=document.createElement('span');span.className='word';span.textContent=word;node.append(span);if(i<words.length-1)node.append(document.createTextNode(' '));});}
const tl=gsap.timeline({paused:true});
const scenes=[['.s0',0,2.9],['.s1',2.85,4.5],['.s2',4.55,7.4],['.s3',7.45,9.0],['.brand-scene',9.0,11.95],['.cta-scene',11.95,15.2]];
for(const [selector,start,end]of scenes){
 const node=$(selector),words=all(selector+' .word');
 tl.set(node,{autoAlpha:0},0);
 tl.set(node,{autoAlpha:1},start);
 if(words.length)tl.fromTo(words,{y:95,rotationX:-68,rotationZ:-3,scale:.88,filter:'blur(18px)',opacity:0},{y:0,rotationX:0,rotationZ:0,scale:1,filter:'blur(0px)',opacity:1,duration:.64,stagger:.095,ease:'back.out(1.15)'},start+.04);
 if(selector!=='.cta-scene')tl.to(node,{y:-30,rotationX:10,scale:1.025,filter:'blur(15px)',opacity:0,duration:.34,ease:'expo.in'},end-.22);
}
tl.fromTo('.small-logo',{y:15,opacity:0,filter:'blur(8px)'},{y:0,opacity:1,filter:'blur(0px)',duration:.55,ease:'expo.out'},0);
tl.to('.small-logo',{opacity:0,y:-25,filter:'blur(10px)',duration:.35},8.8);
tl.fromTo('.brand-logo',{scale:.74,rotationX:-24,filter:'blur(14px)',opacity:0},{scale:1,rotationX:0,filter:'blur(0px)',opacity:1,duration:.7,ease:'back.out(1.25)'},9.02);
tl.fromTo('.feature',{y:45,scale:.88,rotationX:-30,opacity:0,filter:'blur(8px)'},{y:0,scale:1,rotationX:0,opacity:1,filter:'blur(0px)',duration:.52,stagger:.24,ease:'back.out(1.25)'},9.45);
tl.fromTo('.logo-sweep',{xPercent:0},{xPercent:360,duration:1.2,ease:'power2.inOut'},9.7);
tl.set('.cta-button,.cta-foot',{autoAlpha:0},0);
tl.fromTo('.cta-button',{y:80,rotationX:38,scale:.88,filter:'blur(15px)',autoAlpha:0},{y:0,rotationX:0,scale:1,filter:'blur(0px)',autoAlpha:1,duration:.75,ease:'back.out(1.3)'},12.35);
tl.fromTo('.cta-foot',{y:0,filter:'blur(8px)',autoAlpha:0},{y:0,filter:'blur(0px)',autoAlpha:1,duration:.55,ease:'expo.out'},12.85);
tl.fromTo('.shimmer',{xPercent:0},{xPercent:220,duration:1.3,ease:'power2.inOut'},13.1);
tl.fromTo('.ring',{scale:.2,opacity:.7},{scale:1.9,opacity:0,duration:1.05,ease:'expo.out'},7.55);
tl.fromTo('.bloom',{opacity:0},{opacity:.72,duration:.2,ease:'power2.out'},7.55).to('.bloom',{opacity:0,duration:1.0,ease:'expo.out'},7.75);
const rng=seed=>{const v=Math.sin(seed*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const particles=Array.from({length:68},(_,i)=>({x:rng(i+1)*1080,y:rng(i+72)*1920,r:.7+rng(i+140)*2.7,v:6+rng(i+200)*16,phase:rng(i+270)*6.28}));
const ctx=$('#particles').getContext('2d');ctx.scale(2,2);
const images=[];
window.assetReady=(async()=>{await document.fonts.ready;for(let i=0;i<180;i++){const image=new Image();image.src=`/assets/frames/${String(i).padStart(3,'0')}.png`;images.push(image);}await Promise.all(images.map(image=>image.decode()));await Promise.all(all('img:not(.body):not(.rim):not(.fur)').map(i=>i.decode()));})();
let lastPose=-1;
window.renderFrame=async(frame)=>{
 await window.assetReady;
 const t=Math.min(frame/30,14.9666666667),idleT=Math.min(t,13.5);tl.time(t,false);gsap.ticker.sleep();
 const warm=smooth((t-3)/5),dark=1-smooth((t-6.5)/1.1)*.65;
 $('.world').style.transform=`translate(${Math.sin(idleT*.19)*17}px,${Math.cos(idleT*.17)*10}px) scale(${1+.12*idleT/15})`;
 $('.warm').style.opacity=.22+warm*.72;$('.cold').style.opacity=(1-warm)*.82;
 $('.ray').style.transform=`rotate(${-26+Math.sin(idleT*.12)*5}deg) translateX(${idleT*3}px)`;
 $('.ray.two').style.transform=`rotate(${25-Math.sin(idleT*.14)*4}deg)`;
 $('.haze').style.transform=`translate(${Math.sin(idleT*.18)*35}px,${Math.cos(idleT*.15)*24}px)`;
 for(const [i,orb]of all('.bokeh').entries()){orb.style.transform=`translate(${Math.sin(idleT*.13+i)*22}px,${Math.cos(idleT*.19+i)*28}px)`;orb.style.opacity=(.5+Math.sin(idleT*.26+i)*.1)*dark;}
 $('.plane').style.transform=`rotate(-8deg) translateY(${-idleT*2}px)`;
 $('.arch').style.transform=`translate(${Math.sin(idleT*.1)*25}px,${idleT*-1.5}px)`;
 $('.grain').style.transform=`translate(${(frame%4)*31}px,${(frame%3)*29}px)`;
 all('.gradient').forEach(el=>el.style.backgroundPosition=`${35+idleT*3}% 50%`);
 // Integer-index sample-and-hold. Original pose2k, not interpolated or invented.
 const pose=Math.min(179,Math.floor(Math.min(t,13.5)*12));
 if(pose!==lastPose){all('.mascot-layer img').forEach(img=>img.src=images[pose].src);$('.phone-light').style.maskImage=`url("${images[pose].src}")`;lastPose=pose;}
 const p=Math.floor(Math.min(t,13.5)*12),jitterX=(rng(p+900)-.5)*3,jitterY=(rng(p+1000)-.5)*3;
 const wobble=(rng(p+1100)-.5)*.32,squash=(rng(p+1200)-.5)*.007;
 let size=730,y=640;
 if(t>=8.7&&t<12){const a=smooth((t-8.7)/.6);size=730-25*a;y=640+57*a;}
 if(t>=11.75){const a=smooth((t-11.75)/.75);size=705+15*a;y=697-58*a;}
 const finalHold=t>=13.5;
 const dx=finalHold?0:jitterX,dy=finalHold?0:jitterY;
 $('.mascot-layer').style.width=`${size}px`;$('.mascot-layer').style.height=`${size*636/640}px`;
 $('.mascot-layer').style.left=`${(1080-size)/2}px`;$('.mascot-layer').style.top=`${y}px`;
 $('.mascot-layer').style.transform=`translate(${dx}px,${dy}px) rotate(${finalHold?0:wobble}deg) scale(${1+squash},${1-squash})`;
 const floor=y+size*620/640;$('.contact-shadow').style.top=`${floor-10}px`;$('.contact-core').style.top=`${floor+4}px`;
 $('.contact-shadow').style.transform=`scaleX(${.94+(rng(p+1300)*.03)})`;
 $('.phone-light').style.opacity=(1-warm)*.8;$('.rim').style.opacity=.10+warm*.06;
 $('.rim').style.filter=`brightness(0) invert(1) drop-shadow(0 0 5px ${warm>.5?'#f3c3e7':'#c2b9f9'})`;
 const batteryIn=expo(t/.8),turn=smooth((t-7.45)/.7);
 $('.battery-wrap').style.opacity=1-turn;$('.battery-wrap').style.transform=`translateY(${(1-batteryIn)*130-turn*15}px) scale(${.87+.13*batteryIn-turn*.48}) rotateX(${turn*25}deg)`;
 $('.battery').style.borderRadius=`${53+turn*100}px`;
 let value=12;if(t>=3)value=Math.max(3,Math.ceil(12-9*clamp((t-3)/1.25)));if(t>=4.5)value=Math.max(1,Math.ceil(3-2*clamp((t-4.5)/1.25)));if(t>=6.5)value=0;
 $('.digits').textContent=value;$('.battery-fill').style.transform=`scaleX(${Math.max(.015,value/12)})`;
 $('.battery-fill').style.opacity=value===0?.12:1;$('.battery-number').style.opacity=1-smooth((t-7.25)/.4);
 all('.crack').forEach((c,i)=>c.style.opacity=(.12+Math.sin(t*2+i)*.07)*(value/12));
 $('.battery-glow').style.opacity=.35+.65*(value/12);
 $('.battery-caption').style.opacity=1-smooth((t-7.1)/.35);
 $('.moon').style.opacity=smooth((t-7.5)/.35)*(1-smooth((t-9)/.55));
 $('.moon').style.transform=`translateY(${-smooth((t-7.5)/1.5)*380}px) scale(${.7+turn*.5}) rotate(${turn*-12}deg)`;
 const burst=smooth((t-7.6)/.12)*(1-smooth((t-8.1)/.9));
 ctx.clearRect(0,0,1080,1920);
 for(const a of particles){const x=a.x+Math.sin(idleT*.18+a.phase)*24,y=(a.y-idleT*a.v+1920)%1920;const alpha=(.13+.17*(.5+.5*Math.sin(idleT+a.phase)))*dark;ctx.beginPath();ctx.fillStyle=`rgba(242,216,239,${alpha})`;ctx.shadowColor='#e4bfed';ctx.shadowBlur=12;ctx.arc(x,y,a.r,0,Math.PI*2);ctx.fill();}
 if(burst>0){for(let i=0;i<16;i++){const angle=i*Math.PI/8,dist=100+(t-7.6)*320,x=540+Math.cos(angle)*dist,y=1090+Math.sin(angle)*dist*.7;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=`rgba(255,232,224,${burst*.8})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.moveTo(0,-9);ctx.lineTo(0,9);ctx.stroke();ctx.restore();}}
 $('.arrow').style.transform=`translateY(${t<13.5?Math.sin((t-12.6)*7)*4:0}px)`;
 $('.cta-button').style.boxShadow=`0 10px 40px #0c071d66,inset 0 2px 0 #fff9,0 0 ${40+Math.sin(idleT*2)*8}px #dda7f533`;
};
window.safeAudit=()=>all('.critical').filter(el=>{const s=getComputedStyle(el);return s.visibility!=='hidden'&&Number(s.opacity)>.15;}).map(el=>{const b=el.getBoundingClientRect();return {element:el.className,x:b.x,y:b.y,width:b.width,height:b.height,inside:b.x>=59&&b.right<=1021&&b.y>=249&&b.bottom<=1581};});
