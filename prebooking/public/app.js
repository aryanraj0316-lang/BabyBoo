const form=document.querySelector('#booking-form');
const status=document.querySelector('#form-status');
const button=form.querySelector('button');
const query=new URLSearchParams(location.search);
const campaign=Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content'].map(key=>[key,(query.get(key)||'').slice(0,160)]));
const video=document.querySelector('#buddy'),still=document.querySelector('#buddy-still');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
function showStill(){video.pause();video.hidden=true;video.style.display='none';still.hidden=false;}
function motion(){if(preference.matches)showStill();else{still.hidden=true;video.hidden=false;video.style.display='';video.play().catch(showStill);}}
preference.addEventListener('change',motion);video.addEventListener('error',showStill);motion();
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 button.disabled=true;button.firstChild.textContent='Saving your spot… ';status.className='';status.textContent='';
 try{
  const values=new FormData(form);const response=await fetch('/api/prebook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:values.get('email'),consent:values.get('consent')==='on',website:values.get('website'),...campaign})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Please try again.');
  status.textContent='You’re on the list. Thank you for being part of BabyBoo’s first chapter. No payment has been taken.';
  form.querySelector('#email').value='';form.querySelector('[name=consent]').checked=false;
 }catch(error){status.className='error';status.textContent=error.message||'We couldn’t save your spot. Please try again.';}
 finally{button.disabled=false;button.firstChild.textContent='Reserve my spot ';}
});
