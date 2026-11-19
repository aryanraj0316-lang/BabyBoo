import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../../..'),OUT=process.env.AD_OUTPUT_DIR||path.join(ROOT,'design/prebooking/cinematic');
const files=['BabyBoo_Prebooking_Cinematic_1080x1920.mp4','BabyBoo_Prebooking_Cinematic_1080x1350.mp4'];
const report={videos:[],safeZones:{},audio:'No audio generated',supersampling:'2x2160x3840browser screenshots downscaled to1080x1920',cadence:'12distinct original header poses/sec, alternating2/3frame holds at30fps',limitations:['Original header contains waves, turns and blinks, no yawn or arms-raised pose. Those are not invented.','Source Buddy pixels640x636, upscaled within the2x composition; supersampling improves graphic edges, not original fur detail.','Final1.5seconds holds the CTA/mascot, grain and atmosphere are retained.'],review:'Contact sheet and final PNG must be visually reviewed after this script.'};
for(const [i,name]of files.entries()){
 const file=path.join(OUT,name),probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 const video=probe.streams.find(s=>s.codec_type==='video');
 const data={file:name,width:video.width,height:video.height,fps:video.r_frame_rate,frames:Number(video.nb_read_frames),duration:Number(probe.format.duration),bitrate:Number(video.bit_rate),codec:video.codec_name,pixelFormat:video.pix_fmt,audioTracks:probe.streams.filter(s=>s.codec_type==='audio').length};
 if(data.width!==1080||data.height!==(i?1350:1920)||data.fps!=='30/1'||data.frames!==450||Math.abs(data.duration-15)>.001||data.bitrate<20000000||data.codec!=='h264'||data.pixelFormat!=='yuv420p'||data.audioTracks)throw new Error('Output spec mismatch '+JSON.stringify(data));
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',file,'-f','null','-'],{stdio:'pipe'});data.fullDecode='passed';report.videos.push(data);
}
const audit=JSON.parse(readFileSync(path.join(OUT,'safe-zone-audit.json'))),violations=audit.audits.flatMap(a=>a.elements.filter(e=>!e.inside).map(e=>({time:a.time,...e})));
// Small wordmark PNG includes transparent padding; evaluate its actual glyph bounds.
const cropViolations=audit.audits.flatMap(a=>a.elements.filter(e=>{
 const top=e.element.includes('small-logo')?e.y+e.height*68/260:e.y;
 const bottom=e.element.includes('small-logo')?e.y+e.height*231/260:e.y+e.height;
 return top<285||bottom>1635;
}).map(e=>({time:a.time,...e})));
report.safeZones={samples:audit.audits.length,portraitViolations:violations,centreCropViolations:cropViolations,browserErrors:audit.errors};
writeFileSync(path.join(OUT,'quality-report.json'),JSON.stringify(report,null,2));
if(violations.length||cropViolations.length||audit.errors.length)throw new Error('Review safe-zone-audit/quality-report before delivery.');
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(OUT,files[0]),'-vf','fps=2,scale=270:480,tile=6x5','-frames:v','1',path.join(OUT,'contact-sheet-0.5s.jpg')]);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(OUT,'last-frame-2160x3840.png'),'-vf','scale=1080:1920:flags=lanczos',path.join(OUT,'last-frame.png')]);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(OUT,'last-frame.png'),'-vf','crop=1080:1350:0:285',path.join(OUT,'last-frame-4x5.png')]);
copyFileSync(path.join(HERE,'beats.json'),path.join(OUT,'beats.json'));
console.log(JSON.stringify(report,null,2));
