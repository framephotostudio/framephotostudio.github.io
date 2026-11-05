// Changes that the website and the iPhone app share (Demah, Nov 5, 2026: "make them both match").
// Used two ways:
//  - scripts/build-web.mjs runs it on the website code before the app-only changes (it skips anything the website already has);
//  - scripts/site-sync.mjs runs it once on the website's index.html so the website itself has the same changes.
// Each change either applies, or is already there; if neither, the build stops so nothing drifts silently.

export const LOOK_NAMES = [
  ['Full Glam', 'Grand Soirée'], ['Red Carpet', 'Première'], ['Clean Girl', 'Bare Luxe'], ['Bridal Glow', 'Ivory Vow'],
  ['Glass Skin', 'Porcelain Dew'], ['Hollywood Glam', 'Silver Screen'], ['Golden Hour', 'Gilded Hour'], ['Magazine Cover', 'Cover Edit'],
  ['Ice Queen', 'Frost Couture'], ['Pumpkin Spice', 'Spiced Amber'], ['Headshot Pro', 'Boardroom Portrait']
];
export const BUTTON_NAMES = [
  ['AI Outfit Change', 'Try it on'], ['AI Background Change', 'Change the scene'], ['AI Accessories', 'Accessories'], ['AI Shoes', 'Shoes'],
  ['AI Looks', 'Couture Looks'], ['AI Glow', 'Couture Glow']
];

export function shared(html) {
  const has = s => html.indexOf(s) > -1;
  function one(find, repl, why) {
    const n = html.split(find).length - 1;
    if (n === 1) { html = html.replace(find, () => repl); return; }
    if (n === 0 && has(repl)) return;
    throw new Error('Shared change "' + why + '": expected 1 match, found ' + n + '. Update scripts/shared.mjs.');
  }
  function all(find, repl, why, done) {
    if (has(find)) { html = html.split(find).join(repl); return; }
    if (has(done || repl)) return;
    throw new Error('Shared change "' + why + '" not found. Update scripts/shared.mjs.');
  }
  function block(start, end, repl, maxLen, why, doneMark) {
    if (has(doneMark)) return;
    const a = html.indexOf(start), b = end === '\n' ? html.indexOf('\n', a) : html.indexOf(end, a);
    if (a < 0 || b < 0 || b - a > maxLen) throw new Error('Shared change "' + why + '" not found. Update scripts/shared.mjs.');
    html = html.slice(0, a) + repl + html.slice(b);
  }

  // ---- Platform Pack: every set saves distinct sizes, each framed on the face, never two identical files ----
  one("const SETS={social:['ig-portrait','ig-story','tiktok'],pro:['linkedin','whatsapp-profile','x'],dating:['hinge','ig-portrait','whatsapp-profile']};",
    "const SETS={social:['ig-portrait','ig-square','ig-story','pinterest','youtube'],pro:['linkedin','headshot','linkedin-post','x','whatsapp-status'],dating:['hinge','tinder','league']};", 'pack sets');
  block("const PACK=[['ig-portrait','Instagram post']", '].map(([id,n])=>',
    "const PACK=[['ig-portrait','Instagram post'],['ig-square','Square post'],['ig-story','Story · Reels'],['tiktok','TikTok'],['pinterest','Pinterest pin'],['youtube','YouTube thumbnail'],['linkedin','LinkedIn profile'],['headshot','Headshot'],['linkedin-post','LinkedIn post'],['x','X post'],['whatsapp-status','WhatsApp status'],['whatsapp-profile','WhatsApp profile'],['facebook-portrait','Facebook post'],['hinge','Hinge · Bumble · Raya'],['tinder','Tinder'],['league','The League']",
    600, 'pack chip list', "['hinge','Hinge · Bumble · Raya']");
  // face framing: if the head with hair doesn't fit a size, frame the face itself (hair at the sides may be trimmed);
  // if even that doesn't fit, zoom out on a smooth backdrop instead of keeping the whole photo small
  block('function faceFrame(i,iw,ih,box){', '\n',
    "function faceFrame(i,iw,ih,box){const cw=presets[i][3],ch=presets[i][4],sc=Math.max(cw/iw,ch/ih),w=iw*sc,h=ih*sc,ty=ch>cw*1.05?.45:.5,o=beauty.faceOutline||[];let tight=box;if(o.length>2){const xs=o.map(p=>p.x),ys=o.map(p=>p.y),fx0=Math.min(...xs),fx1=Math.max(...xs),fy0=Math.min(...ys),fy1=Math.max(...ys),fw=fx1-fx0,fh=fy1-fy0;tight={x0:Math.max(0,fx0-.06*fw),x1:Math.min(1,fx1+.06*fw),y0:Math.max(0,fy0-.3*fh),y1:Math.min(1,fy1+.1*fh)}}const cl=v=>Math.max(0,Math.min(1,v));function at(b,z){const W=w*z,H=h*z,cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,x=Math.abs(cw-W)>1?cl((.5*cw-cx*W)/(cw-W)):.5,y=Math.abs(ch-H)>1?cl((ty*ch-cy*H)/(ch-H)):.5,ox=(cw-W)*x,oy=(ch-H)*y;if(ox+b.x0*W<-1||ox+b.x1*W>cw+1||oy+b.y0*H<-1||oy+b.y1*H>ch+1)return null;return{x,y,z,mode:'fill'}}for(const b of [box,tight]){const r=at(b,1);if(r)return r}const zb=tight,z=Math.max(.3,Math.min(1,.96*cw/((zb.x1-zb.x0)*w),.96*ch/((zb.y1-zb.y0)*h)));return at(zb,z)||at(tight,z)||{x:.5,y:.5,z:1,mode:'fit'}}",
    3000, 'face framing', 'const zb=tight,z=Math.max(.3');
  // the space around a zoomed-out or whole photo is a smooth backdrop made from the photo's own edge colours (no blown-up blur)
  one("if(f.mode==='fit'&&$('#frameBackdrop').value==='soft'){const bg=document.createElement('canvas');bg.width=32;bg.height=Math.max(1,Math.round(32*input.height/input.width));bg.getContext('2d').drawImage(baseCanvas(160),0,0,bg.width,bg.height);const cover=Math.max(c.width/bg.width,c.height/bg.height);const bw=bg.width*cover,bh=bg.height*cover;ctx.imageSmoothingEnabled=true;ctx.drawImage(bg,(c.width-bw)/2,(c.height-bh)/2,bw,bh);ctx.fillStyle='#ffffff66';ctx.fillRect(0,0,c.width,c.height);bg.width=bg.height=1}",
    "if((f.mode==='fit'||f.z<.999)&&$('#frameBackdrop').value==='soft'){(window.fcSoftBackdrop||function(x,w,h){x.fillStyle='#f4eef6';x.fillRect(0,0,w,h)})(ctx,c.width,c.height,baseCanvas(160))}", 'pack backdrop');
  // one file per size: platforms that share a size are saved once, named for all of them; the saved sizes are shown on screen
  one("const files=[];for(const i of selected){const blob=await exportBlob(i);files.push(new File([blob],filename(i),{type:blob.type}))}",
    "const groups=new Map();for(const i of selected){const k=presets[i][3]+'x'+presets[i][4];if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i)}const files=[],made=[];framed=0;for(const g of groups.values()){const i=g[0];if(frameState[i].mode==='fill')framed++;const blob=await exportBlob(i);const names=[...new Set(g.map(j=>{const q=PACK.find(x=>x[0]===j);return q?q[1]:presets[j][1]+' '+presets[j][2]}))];const slug=names.join(' ').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const f=new File([blob],'face-couture-'+slug+'-'+presets[i][3]+'x'+presets[i][4]+'.'+($('#quality').value==='image/png'?'png':'jpg'),{type:blob.type});files.push(f);made.push({file:f,names,w:presets[i][3],h:presets[i][4]})}", 'pack one file per size');
  one("const r=await deliverFiles(files,'Face Couture Platform Pack');", "const r=await deliverFiles(files,'Face Couture Platform Pack');try{if(r!=='cancelled'&&window.fcPackResult)window.fcPackResult(made,r)}catch(e){}", 'pack result');
  one("(framed?', '+framed+' framed on your face':'')", "(framed&&framed===files.length?', each framed on your face':framed?', '+framed+' framed on your face':'')", 'pack toast');
  one('Center on my face (keeps the whole photo if a size would cut it off)', 'Frame every size on my face', 'pack option');
  all('<button type="button" data-set="pro">Professional</button>', '<button type="button" data-set="pro">Work</button>', 'Work set name');
  // app-zone guide text sits in the top red band, not across the face
  // each app zone is labelled (top bar, buttons, caption) so the preview reads at a glance
  { const NEWZ = "ctx.fillText('Keep clear of red',w*.28,h*.06);const L=['App top bar','Like · Comment · Share','Caption'];z.forEach((q,j)=>{const fs=Math.round(w*(j===1?.026:.034));ctx.font='600 '+fs+'px -apple-system,sans-serif';if(j===1){ctx.save();ctx.translate((q[0]+q[2]/2)*w,(q[1]+q[3]/2)*h);ctx.rotate(-Math.PI/2);ctx.fillText(L[j],0,fs/3);ctx.restore()}else if(j===2)ctx.fillText(L[j],(q[0]+q[2]/2)*w,(q[1]+q[3]/2)*h+fs/3)})";
    if (!has("const L=['App top bar','Like · Comment · Share','Caption']")) {
      if (has("ctx.fillText('Keep faces and text out of the red areas',w/2,h*.5)")) html = html.replace("ctx.fillText('Keep faces and text out of the red areas',w/2,h*.5)", () => NEWZ);
      else if (has("ctx.fillText('Keep clear of red',w*.28,h*.06)")) html = html.replace("ctx.fillText('Keep clear of red',w*.28,h*.06)", () => NEWZ);
      else throw new Error('Shared change "zone labels" not found. Update scripts/shared.mjs.');
    } }
  // Grand Soirée (was Full Glam) lipstick: velvet rose, fuller colour and a pearl gloss (Demah's pick B)
  one("b.tint=S.beauty.tint;b.gloss=60;", "b.tint=85;b.gloss=40;", 'Grand Soirée lipstick strength');
  one("Object.assign(sh,{color:'glamRosePink',lipFinish:'cream',glossShade:'gRose',opaqueLip:1});", "Object.assign(sh,{color:'velvetRose',lipFinish:'cream',glossShade:'gPearl',opaqueLip:1});", 'Grand Soirée lipstick shade');
  // consent wording
  all('only to create this look, and it is not stored.', 'only to create this look. We do not store it.', 'consent wording (script)');
  all("to create the look. It isn't stored. <a", "to create the look. We don't store it. <a", 'consent wording (label)');
  // names: original look names and the AI Studio button names
  all("matte:{n:'Matte Pro'", "matte:{n:'Velvet Matte'", 'Velvet Matte');
  for (const [a, b] of LOOK_NAMES) all(a, b, 'look name ' + a);
  for (const [a, b] of BUTTON_NAMES) all(a, b, 'button name ' + a);
  return html;
}

// Website-side helpers the shared changes call (the app has its own copies in app/app-early.js and app/app.js).
export const SITE_HEAD = `<script>/* v109: smooth Platform Pack backdrop (defined early, used by the studio's first render) */;(function(){try{var W=window,D=document;
W.fcSoftBackdrop=W.fcSoftBackdrop||function(ctx,Wd,H,src){try{var s=D.createElement('canvas'),n=24;s.width=n;s.height=Math.max(2,Math.round(n*src.height/src.width));var g=s.getContext('2d');g.drawImage(src,0,0,s.width,s.height);var d=g.getImageData(0,0,s.width,s.height).data,sw=s.width,sh=s.height;var avg=function(x0,y0,x1,y1){var r=0,gg=0,b=0,c=0;for(var y=y0;y<y1;y++)for(var x=x0;x<x1;x++){var i=(y*sw+x)*4;r+=d[i];gg+=d[i+1];b+=d[i+2];c++}return 'rgb('+Math.round(r/c)+','+Math.round(gg/c)+','+Math.round(b/c)+')'};var gr,k;if(H/Wd>src.height/src.width){k=Math.max(1,Math.round(sh*.08));gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,avg(0,0,sw,k));gr.addColorStop(1,avg(0,sh-k,sw,sh))}else{k=Math.max(1,Math.round(sw*.1));gr=ctx.createLinearGradient(0,0,Wd,0);gr.addColorStop(0,avg(0,0,k,sh));gr.addColorStop(1,avg(sw-k,0,sw,sh))}ctx.fillStyle=gr;ctx.fillRect(0,0,Wd,H);s.width=s.height=1}catch(e){ctx.fillStyle='#f4eef6';ctx.fillRect(0,0,Wd,H)}};
}catch(e){}})();</script>`;
export const SITE_BLOCK = `<style id="fcPackDoneCss">#fcPackDone{margin:12px 0 4px;padding:6px 0 0}#fcPackDone>b{display:block;font-size:17px;color:#2f7a4a}#fcPackDone>span{display:block;font-size:13.5px;color:#5a4470;margin:2px 0 10px}#fcPackDone .fcPackGrid{display:flex;flex-wrap:wrap;gap:12px 10px;align-items:flex-end}#fcPackDone figure{margin:0;width:calc(33.33% - 7px);max-width:150px}#fcPackDone .fcPackImg{border-radius:10px;overflow:hidden;background:#f3eef6;box-shadow:0 4px 12px -6px rgba(59,31,87,.4)}#fcPackDone .fcPackImg img{display:block;width:100%;height:100%;object-fit:contain}#fcPackDone figcaption b{display:block;font-size:11.5px;line-height:1.2;color:#3b1f57;margin-top:5px}#fcPackDone figcaption small{display:block;font-size:11px;color:#7a6890}</style>
<script>/* v109 (Nov 5, 2026): Platform Pack backdrop and result, and app-zone previews on the 9:16 size. Same as the iPhone app. */
;(function(){try{var W=window,D=document;
var urls=[];if(!W.fcPackResult)W.fcPackResult=function(made,r){var save=D.getElementById('packSave');if(!save||!made||!made.length)return;urls.forEach(function(u){try{URL.revokeObjectURL(u)}catch(e){}});urls=[];var old=D.getElementById('fcPackDone');if(old)old.parentNode.removeChild(old);var d=D.createElement('div');d.id='fcPackDone';var head=r==='pending'?'Your pack is ready':r==='downloaded'?'Saved \\u2713':'Saved \\u2713';d.innerHTML='<b>'+head+'</b><span>'+made.length+(made.length===1?' size':' sizes')+', each framed on your face</span><div class="fcPackGrid"></div>';var grid=d.querySelector('.fcPackGrid');made.forEach(function(m){var u=URL.createObjectURL(m.file);urls.push(u);var f=D.createElement('figure');f.innerHTML='<div class="fcPackImg" style="aspect-ratio:'+m.w+'/'+m.h+'"><img alt=""></div><figcaption><b></b><small></small></figcaption>';f.querySelector('img').src=u;f.querySelector('img').alt=m.names.join(', ')+' size';f.querySelector('figcaption b').textContent=m.names.join(' \\u00b7 ');f.querySelector('figcaption small').textContent=m.w+' \\u00d7 '+m.h;grid.appendChild(f)});save.parentNode.insertBefore(d,save.nextSibling)};
function zoneFrame(i,iw,ih){try{var o=beauty.faceOutline;if(!o||o.length<3)return null;var xs=o.map(function(p){return p.x}),ys=o.map(function(p){return p.y});var fx0=Math.min.apply(0,xs),fx1=Math.max.apply(0,xs),fy0=Math.min.apply(0,ys),fy1=Math.max.apply(0,ys),fw=fx1-fx0,fh=fy1-fy0;var top=Math.max(0,fy0-.35*fh),bot=Math.min(1,fy1+.14*fh),cx=(fx0+fx1)/2,cy=(top+bot)/2;var cw=presets[i][3],ch=presets[i][4],sc=Math.max(cw/iw,ch/ih),w=iw*sc,h=ih*sc;var z=Math.max(.3,Math.min(1,.56*ch/((bot-top)*h),.68*cw/(fw*1.2*w))),Wz=w*z,Hz=h*z;var cl=function(v){return Math.max(0,Math.min(1,v))};var x=Math.abs(cw-Wz)>1?cl((.41*cw-cx*Wz)/(cw-Wz)):.5,y=Math.abs(ch-Hz)>1?cl((.43*ch-cy*Hz)/(ch-Hz)):.5;return{x:x,y:y,z:z,mode:'fill'}}catch(e){return null}}
function zones(){var pp=D.getElementById('platformPreview');if(!pp||pp.__fc)return!!pp;pp.__fc=true;var back=null;D.addEventListener('change',function(e){if(e.target&&e.target.id==='file')back=null},true);
pp.addEventListener('change',function(){var v=pp.value;if(!/^(tiktok|reels|safe)$/.test(v)){try{var tt=D.getElementById('toast');if(tt){tt.classList.remove('show');tt.style.display='none'}}catch(e){}if(back){try{var b=back;back=null;frameState[b.i]=b.f;choose(b.active);pp.value=v;if(typeof schedule==='function')schedule()}catch(e){}}return}
try{var i=presets.findIndex(function(p){return p[0]===(v==='tiktok'?'tiktok':'ig-story')});if(i<0)return;if(back&&back.i!==i){frameState[back.i]=back.f}else if(presets[active][3]===1080&&presets[active][4]===1920&&!back)return;if(!back||back.i!==i)back={i:i,f:Object.assign({},frameState[i]),active:back?back.active:active};
Promise.resolve(ensureFace()).then(function(ok){if(ok){var d=baseCanvas(100);frameState[i]=zoneFrame(i,d.width,d.height)||faceFrame(i,d.width,d.height,headBox())}choose(i);pp.value=v;if(typeof schedule==='function')schedule();setTimeout(function(){if(pp.value===v&&typeof W.toast==='function')W.toast('Showing the 9:16 '+(v==='tiktok'?'TikTok':v==='reels'?'Reels':'Story')+' size, framed on your face.')},80)})}catch(e){}});return true}
var n=0,t=setInterval(function(){if(zones()||++n>40)clearInterval(t)},250);
}catch(e){console.warn('v109',e)}})();
</script>`;
