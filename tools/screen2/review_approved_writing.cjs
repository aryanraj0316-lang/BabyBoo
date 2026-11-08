/** Static QA of the new approved-source composition; no legacy renderers. */
const fs=require('fs'),path=require('path'),esbuild=require('esbuild');
const ROOT=path.resolve(__dirname,'../..');
(async()=>{
  const model=path.join(ROOT,'node_modules/.cache/approved-writing.cjs');
  await esbuild.build({entryPoints:[path.join(ROOT,'src/onboarding/screen2/approvedWritingModel.ts')],outfile:model,bundle:true,platform:'node',format:'cjs'});
  const {writing:W,writingAt,WRITING_LENGTH}=require(model);
  globalThis.CanvasKit=await require(path.join(ROOT,'node_modules/canvaskit-wasm/bin/full/canvaskit.js'))();
  const {getSkiaExports,makeOffscreenSurface,ClipOp,PaintStyle,StrokeCap,StrokeJoin,BlendMode,BlurStyle}=require(path.join(ROOT,'node_modules/@shopify/react-native-skia/lib/commonjs/headless'));
  const {Skia}=getSkiaExports();
  const asset=name=>Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(path.join(ROOT,'assets/onboarding/screen2/buddy',name)))));
  const body=asset('buddy_note_approved@3x.webp'),repair=asset('buddy_note_repair@3x.webp'),penless=asset('buddy_note_penless@3x.webp'),pen=asset('buddy_note_pen@3x.webp');
  const penRepair=Skia.Path.MakeFromSVGString(W.penRepairPath),paw=Skia.Path.MakeFromSVGString(W.pawPath);
  const eyes=Skia.Path.Make();W.eyeRects.forEach(r=>eyes.addOval(r));
  const card=Skia.Path.Make();W.card.forEach(([x,y],i)=>i?card.lineTo(x,y):card.moveTo(x,y));card.close();
  const inkPath=Skia.Path.Make();W.strokes[0].forEach(([x,y],i)=>i?inkPath.lineTo(x,y):inkPath.moveTo(x,y));
  const paint=Skia.Paint();paint.setAntiAlias(true);
  const ink=Skia.Paint();ink.setColor(Skia.Color(W.ink));ink.setAntiAlias(true);ink.setStyle(PaintStyle.Stroke);ink.setStrokeWidth(W.strokeWidth);ink.setStrokeCap(StrokeCap.Round);ink.setStrokeJoin(StrokeJoin.Round);
  const mask=Skia.Paint();mask.setColor(Skia.Color('white'));mask.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal,0.5,true));
  const maskBlend=Skia.Paint();maskBlend.setBlendMode(BlendMode.DstIn);
  const penMask=Skia.Paint();penMask.setColor(Skia.Color('white'));penMask.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal,0.65,true));
  const eyeMask=Skia.Paint();eyeMask.setColor(Skia.Color('white'));eyeMask.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal,0.15,true));
  const out=path.join(ROOT,'design/screen2/approved_writing/local');fs.mkdirSync(out,{recursive:true});
  const draw=(canvas,image)=>canvas.drawImageRect(image,Skia.XYWHRect(0,0,image.width(),image.height()),Skia.XYWHRect(0,0,160,159),paint);
  for(let i=-1;i<=7;i++) {
    const surface=makeOffscreenSurface(960,954),canvas=surface.getCanvas();canvas.clear(Skia.Color('#FFFEFC'));canvas.scale(6,6);
    const down=i>=0&&i<=6,state=writingAt(i<0?0:WRITING_LENGTH*Math.min(i,6)/6),pulse=down?Math.sin(i*Math.PI/3)**2:0;
    if(down){
      canvas.save();canvas.clipPath(paw,ClipOp.Difference,true);draw(canvas,body);canvas.restore();
      canvas.save();canvas.clipPath(paw,ClipOp.Intersect,true);draw(canvas,repair);canvas.restore();
      for(const [p,maskPaint] of [[penRepair,penMask],[eyes,eyeMask]]) {
        canvas.saveLayer();draw(canvas,repair);canvas.saveLayer(maskBlend);canvas.drawPath(p,maskPaint);canvas.restore();canvas.restore();
      }
    }else draw(canvas,body);
    if(state.end>0){canvas.save();canvas.clipPath(card,ClipOp.Intersect,true);const p=Skia.Path.MakeFromSVGString(inkPath.toSVGString());p.trim(0,state.end,false);canvas.drawPath(p,ink);canvas.restore();}
    if(down){
      canvas.save();canvas.translate(state.x,state.y);canvas.rotate((W.penAngle-pulse*0.025)*180/Math.PI,0,0);
      canvas.drawImageRect(pen,Skia.XYWHRect(0,0,pen.width(),pen.height()),Skia.XYWHRect(-W.penHeight*W.penAspect/2,-W.penHeight,W.penHeight*W.penAspect,W.penHeight),paint);canvas.restore();
      canvas.save();canvas.translate(state.pawX,state.pawY+pulse*0.55);canvas.translate(...W.pawOrigin);canvas.rotate(pulse*0.018*180/Math.PI,0,0);canvas.translate(-W.pawOrigin[0],-W.pawOrigin[1]);
      canvas.saveLayer();draw(canvas,penless);canvas.saveLayer(maskBlend);canvas.drawPath(paw,mask);canvas.restore();canvas.restore();canvas.restore();
    }
    surface.flush();fs.writeFileSync(path.join(out,i===-1?'reference.png':i===7?'rest.png':`down-${i}.png`),Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
  }
  console.log('Approved-source rest and seven local writing previews saved.');
})().catch(e=>{console.error(e);process.exit(1)});
