// Credentials/owner identifiers are accepted only on hidden stdin, never argv.
process.stdin.setRawMode?.(true);
process.stdin.resume();
let input='';
process.stdout.write('Ready for boundary-check JSON on hidden stdin.\n');
const config=await new Promise((resolve,reject)=>{
 process.stdin.on('data',chunk=>{input+=chunk.toString();if(input.includes('\n')||input.includes('\r')){process.stdin.pause();try{resolve(JSON.parse(input.trim()));}catch(e){reject(e);}}});
});
const r=await fetch(config.url+'/api/admin/stats',{redirect:'manual',headers:{'User-Agent':'BabyBoo-QA-bot','oai-authenticated-user-id':'client-forged-owner','oai-authenticated-user-email':config.ownerEmail}});
console.log(JSON.stringify({clientSuppliedIdentityStatus:r.status,clientHeadersCannotAuthorize:r.status===403}));
process.stdin.setRawMode?.(false);
if(r.status!==403)process.exitCode=1;
