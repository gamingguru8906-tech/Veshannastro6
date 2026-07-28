/* Main site behaviour: hero animation, calculators, booking modal, OTP flow.
   Loaded WITHOUT defer, at the exact position the inline block occupied, so
   execution order relative to the surrounding inline scripts is unchanged.
   Extracted from index.html — do not reorder relative to other scripts. */

(function(){
'use strict';
if(!document.getElementById('sc'))return; /* hero removed — bail */

/* ═══════════ MOBILE DETECTION ═══════════ */
const isMobile=('ontouchstart' in window)||window.innerWidth<=768;

/* ═══════════ PLANETS DATA ═══════════ */
const planets=[
  {name:'Mercury',zodiac:'Gemini & Virgo',  a:72, b:26, color:'#a8a098',glow:'#d0c8b8',r:4,  spd:4.10,phase:0.9, rings:false},
  {name:'Venus',  zodiac:'Taurus & Libra',  a:108,b:38, color:'#e8c870',glow:'#f8e090',r:6,  spd:1.60,phase:2.1, rings:false},
  {name:'Earth',  zodiac:'Our Home',        a:148,b:52, color:'#3a8cc0',glow:'#70b8e8',r:6.5,spd:1.00,phase:4.2, rings:false},
  {name:'Mars',   zodiac:'Aries & Scorpio', a:188,b:66, color:'#c84828',glow:'#f06040',r:5,  spd:0.53,phase:1.5, rings:false},
  {name:'Jupiter',zodiac:'Sagittarius',     a:240,b:84, color:'#c08850',glow:'#e0b070',r:14, spd:0.083,phase:3.8,rings:false},
  {name:'Saturn', zodiac:'Capricorn',       a:292,b:102,color:'#d0b060',glow:'#e8cc80',r:11, spd:0.034,phase:0.5,rings:true},
  {name:'Uranus', zodiac:'Aquarius',        a:334,b:117,color:'#60c0c0',glow:'#88e0e0',r:8,  spd:0.011,phase:2.8,rings:false},
  {name:'Neptune',zodiac:'Pisces',          a:372,b:130,color:'#2858c0',glow:'#5080e8',r:7.5,spd:0.006,phase:5.1,rings:false},
];

/* On mobile skip outer planets to cut draw calls by 40% */
const activePlanets=isMobile ? planets.slice(0,6) : planets;

const canvas=document.getElementById('sc');
const heroSect=document.getElementById('hero');
const info=document.getElementById('pi');
const scue=document.getElementById('scue');
const eyebrow=null;
const htitle=document.getElementById('htitle');
const hsub=null;

/* DPR: cap at 1 on mobile (biggest single win), 2 on desktop */
const dpr=isMobile ? Math.min(devicePixelRatio||1,1) : Math.min(devicePixelRatio||1,2);
const ctx=canvas.getContext('2d',{alpha:false}); /* alpha:false = faster compositing */

let W,H,Cx,Cy,animT=0,hovered=null,smoothProg=0,fitScale=1;
let _cachedGI=1;
let _heroH=0, _vh=0; /* cached layout values — never read in rAF */

/* Pre-computed shade colours — avoid per-frame string ops */
function hexShade(hex,amt){
  const c=parseInt(hex.slice(1),16);
  const r=Math.min(255,Math.max(0,((c>>16)&0xff)+amt));
  const g=Math.min(255,Math.max(0,((c>>8)&0xff)+amt));
  const b=Math.min(255,Math.max(0,(c&0xff)+amt));
  return`#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
}
planets.forEach(p=>{p.darkColor=hexShade(p.color,-55);});

/* ── PERF: pre-build each planet's glow + sphere gradients ONCE, in a
   normalized 0..1 local coordinate space. Canvas gradients are evaluated
   using the transform in effect at fill time (not at creation time), so a
   single cached gradient can be repositioned/rescaled every frame with a
   cheap translate+scale instead of calling createRadialGradient() (one of
   the most expensive canvas calls) for every planet, every frame. This was
   previously the single biggest cause of scroll jank — ~16-20 fresh
   gradients were being allocated every animation frame. ── */
planets.forEach(p=>{
  p._glowGradUnit=ctx.createRadialGradient(0,0,0,0,0,1);
  p._glowGradUnit.addColorStop(0,p.glow+'55');
  p._glowGradUnit.addColorStop(1,p.glow+'00');
  p._sphereGradUnit=ctx.createRadialGradient(-0.3,-0.32,0.05,0,0,1);
  p._sphereGradUnit.addColorStop(0,'rgba(255,255,255,0.62)');
  p._sphereGradUnit.addColorStop(0.28,p.color);
  p._sphereGradUnit.addColorStop(1,p.darkColor);
});

/* ── PERF: pre-build the sun's glow-halo gradients (up to 3 layers) and the
   single sun-flare spike gradient, also normalized to unit space. These were
   previously rebuilt from scratch every frame (the halo) or 12x every frame
   (the spikes on desktop). ── */
const _sunHaloGradUnit=[];
for(let i=1;i<=3;i++){
  const g=ctx.createRadialGradient(0,0,0,0,0,1);
  const a=(0.07/i).toFixed(3);
  g.addColorStop(0,`rgba(255,240,100,${a})`);
  g.addColorStop(0.4,`rgba(255,130,10,${(a*.6).toFixed(3)})`);
  g.addColorStop(1,'rgba(255,40,0,0)');
  _sunHaloGradUnit.push(g);
}
const _spikeGradUnit=ctx.createLinearGradient(0,0,1,0);
_spikeGradUnit.addColorStop(0,'rgba(255,230,90,1)');
_spikeGradUnit.addColorStop(1,'rgba(255,100,0,0)');

/* ── STARS: pre-render onto offscreen canvas once, blit per frame ── */
const STAR_COUNT = isMobile ? 140 : 260;
const stars=[];
for(let i=0;i<STAR_COUNT;i++){
  stars.push({
    x:Math.random(),y:Math.random(),
    r:.3+Math.random()*.8,
    baseAlpha:.15+Math.random()*.55,
    twinkle:Math.random()*Math.PI*2,
    twinkleSpd:.008+Math.random()*.018,
    vx:(Math.random()-.5)*.00015,
    vy:(Math.random()-.5)*.00015,
    ox:Math.random()-0.5,oy:Math.random()-0.5,
  });
}

/* Offscreen star canvas — updated only for twinkle, not gradient creation */
const starOff=document.createElement('canvas');
const starCtx=starOff.getContext('2d',{alpha:true});

function resizeStarCanvas(){
  starOff.width=W;starOff.height=H;
}

function renderStarLayer(prog){
  starCtx.clearRect(0,0,W,H);
  const zf=1+prog*12;
  const fadeOut=1-prog*0.85;
  starCtx.fillStyle='#dce1ff';
  for(const s of stars){
    let sx,sy;
    if(prog>.02){
      sx=Cx+s.ox*W*zf;sy=Cy+s.oy*H*zf;
    } else {
      s.x+=s.vx;s.y+=s.vy;
      if(s.x<0)s.x=1;if(s.x>1)s.x=0;
      if(s.y<0)s.y=1;if(s.y>1)s.y=0;
      sx=s.x*W;sy=s.y*H;
    }
    if(sx<-4||sx>W+4||sy<-4||sy>H+4)continue;
    s.twinkle+=s.twinkleSpd;
    const alpha=s.baseAlpha*(0.58+0.42*Math.sin(s.twinkle))*fadeOut;
    if(alpha<=0.01)continue;
    const sr=s.r*(1+prog*0.7);
    starCtx.globalAlpha=alpha;
    starCtx.beginPath();starCtx.arc(sx,sy,sr,0,6.2832);starCtx.fill();
  }
  starCtx.globalAlpha=1;
}

/* ── SUN: cache the static body gradient, only recreate on resize ── */
let _sunBodyGrad=null, _sunCoreGrad=null, _lastSunR=-1;

function buildSunGrads(cx,cy,r){
  const clampedR=Math.min(r,W*1.5);
  _sunBodyGrad=ctx.createRadialGradient(cx-r*.28,cy-r*.3,r*.04,cx,cy,clampedR);
  _sunBodyGrad.addColorStop(0,'#ffffff');
  _sunBodyGrad.addColorStop(0.04,'#fffef0');
  _sunBodyGrad.addColorStop(0.18,'#ffe860');
  _sunBodyGrad.addColorStop(0.52,'#ff8c10');
  _sunBodyGrad.addColorStop(0.82,'#cc2800');
  _sunBodyGrad.addColorStop(1,'#7a0a00');
  _sunCoreGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,clampedR*.38);
  _sunCoreGrad.addColorStop(0,'rgba(255,255,245,0.95)');
  _sunCoreGrad.addColorStop(0.45,'rgba(255,245,130,0.52)');
  _sunCoreGrad.addColorStop(1,'rgba(255,200,40,0)');
  _lastSunR=r;
}

/* ── PLANET: pre-cached gradient per planet (rebuild only on resize/scale change) ── */
let _planetScale=-1;
function buildPlanetGrads(scale){
  _planetScale=scale;
  for(const p of activePlanets){
    const cr=p.r*Math.max(scale,0.5);
    /* placeholder position — will be translated at draw time via ctx.transform */
    p._cr=cr;
    /* glow gradient stored as colours only; built at draw time with correct px,py */
    p._glowR=cr*2.4;
  }
}

function smoothEase(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}

function getHeroScroll(){
  const denom=_heroH-_vh;
  if(denom<=0)return 0;
  return Math.max(0,Math.min(1,window.scrollY/denom));
}

function resize(){
  W=Math.max(1, canvas.parentElement.clientWidth);
  H=Math.max(1, canvas.parentElement.clientHeight);
  canvas.width=W*dpr;canvas.height=H*dpr;
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  Cx=W/2;Cy=H/2;
  /* ── keep the whole orbital system inside the viewport (no off-screen clipping) ── */
  (function(){
    var outer=activePlanets[activePlanets.length-1];
    var maxR=Math.max.apply(null,activePlanets.map(function(p){return p.r;}));
    var pad=Math.max(16,W*0.045);
    var fx=(W/2-pad-maxR)/outer.a;
    var fy=(H/2-pad-maxR)/outer.b;
    fitScale=Math.max(0.34,Math.min(1,fx,fy));
  })();
  /* cache layout values */
  _heroH=heroSect.offsetHeight;
  _vh=window.innerHeight;
  resizeStarCanvas();
  _lastSunR=-1; /* force sun grad rebuild */
  _planetScale=-1;
}

/* ── DRAW AMBIENT GLOW around sun (single gradient, no arc path) ── */
let _ambGrad=null,_ambCx=-1,_ambCy=-1;
function drawAmbient(pulse){
  if(_ambCx!==Cx||_ambCy!==Cy){
    _ambGrad=ctx.createRadialGradient(Cx,Cy,0,Cx,Cy,300);
    _ambGrad.addColorStop(0,'rgba(255,220,60,0.13)');
    _ambGrad.addColorStop(0.4,'rgba(255,160,20,0.06)');
    _ambGrad.addColorStop(1,'rgba(255,60,0,0)');
    _ambCx=Cx;_ambCy=Cy;
  }
  ctx.globalAlpha=pulse*(1-smoothProg*.6);
  ctx.fillStyle=_ambGrad;
  ctx.fillRect(Cx-300,Cy-300,600,600);
  ctx.globalAlpha=1;
}

/* ── DRAW SUN ── */
function drawSun(cx,cy,baseR,t){
  const pulse=0.985+0.015*Math.sin(t*0.25);
  const r=baseR*pulse;

  /* Glow halo — 3 layers on desktop, 2 on mobile. Gradient itself is cached
     (built once in unit space); only the cheap translate+scale changes. */
  const glowLayers=isMobile?2:3;
  for(let i=glowLayers;i>=1;i--){
    const spread=r*i*6*pulse;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.scale(spread,spread);
    ctx.globalAlpha=1;
    ctx.fillStyle=_sunHaloGradUnit[i-1];
    ctx.beginPath();ctx.arc(0,0,1,0,6.2832);ctx.fill();
    ctx.restore();
  }

  /* Spikes — 8 on mobile, 12 on desktop */
  if(!isMobile){
    const spikeCount=12;
    ctx.globalAlpha=0.22;
    ctx.fillStyle=_spikeGradUnit;
    for(let s=0;s<spikeCount;s++){
      const ang=s*(6.2832/spikeCount)+t*.06;
      const len=r*(1.8+0.4*Math.sin(t*2.1+s*0.7));
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(ang);
      ctx.scale(len,len);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(Math.cos(-0.06),Math.sin(-0.06));
      ctx.lineTo(Math.cos(0.06),Math.sin(0.06));
      ctx.closePath();ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha=1;
  } else {
    /* Mobile: simple single corona ring instead of 8 gradient spikes */
    const coroR=r*2.2;
    const cg=ctx.createRadialGradient(cx,cy,r*.9,cx,cy,coroR);
    cg.addColorStop(0,'rgba(255,200,60,0.18)');
    cg.addColorStop(1,'rgba(255,100,0,0)');
    ctx.fillStyle=cg;
    ctx.beginPath();ctx.arc(cx,cy,coroR,0,6.2832);ctx.fill();
  }

  /* Sun body — rebuild grad only when radius changes significantly */
  if(Math.abs(r-_lastSunR)>0.5) buildSunGrads(cx,cy,r);
  const clampedR=Math.min(r,W*1.5);
  ctx.fillStyle=_sunBodyGrad;
  ctx.beginPath();ctx.arc(cx,cy,clampedR,0,6.2832);ctx.fill();
  ctx.fillStyle=_sunCoreGrad;
  ctx.beginPath();ctx.arc(cx,cy,clampedR*.38,0,6.2832);ctx.fill();
}

/* ── DRAW ORBITS — single path batch (one stroke call, not one per planet) ── */
function drawOrbits(scale,alpha){
  ctx.globalAlpha=alpha*.07;
  ctx.strokeStyle='rgba(255,200,100,1)';
  ctx.lineWidth=0.8;
  ctx.beginPath();
  for(const p of activePlanets){
    ctx.ellipse(Cx,Cy,p.a*scale,p.b*scale,0,0,6.2832);
  }
  ctx.stroke();
  ctx.globalAlpha=1;
}

/* ── DRAW PLANET ── */
function drawPlanet(p,scale,alpha){
  const ang=p.phase+animT*p.spd*0.004;
  const px=Cx+Math.cos(ang)*p.a*scale;
  const py=Cy+Math.sin(ang)*p.b*scale;
  const cr=p.r*Math.max(scale,0.5);

  ctx.globalAlpha=alpha;

  /* Glow halo — cached gradient, repositioned/rescaled via cheap matrix ops */
  const glowR=cr*2.6;
  ctx.save();
  ctx.translate(px,py);
  ctx.scale(glowR,glowR);
  ctx.fillStyle=p._glowGradUnit;
  ctx.beginPath();ctx.arc(0,0,1,0,6.2832);ctx.fill();
  ctx.restore();

  /* Saturn rings */
  if(p.rings){
    ctx.save();ctx.translate(px,py);ctx.scale(1,0.28);
    ctx.globalAlpha=alpha*.7;
    ctx.strokeStyle='rgba(210,185,100,0.25)';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,0,cr*2.0,cr*2.0,0,0,6.2832);ctx.stroke();
    ctx.restore();
    ctx.globalAlpha=alpha;
  }

  /* Planet sphere — cached gradient, repositioned/rescaled via cheap matrix ops */
  ctx.save();
  ctx.translate(px,py);
  ctx.scale(cr,cr);
  ctx.fillStyle=p._sphereGradUnit;
  ctx.beginPath();ctx.arc(0,0,1,0,6.2832);ctx.fill();
  ctx.restore();

  if(hovered===p){
    ctx.strokeStyle=p.glow+'99';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(px,py,cr+5,0,6.2832);ctx.stroke();
  }

  ctx.globalAlpha=1;
  /* Store position for hit-testing */
  p._px=px;p._py=py;p._cr=cr;
}

/* ── MAIN FRAME LOOP ── */
let _lastTime=0; let _heroVis=true;
try{ new IntersectionObserver(function(es){ _heroVis=es[0].isIntersecting;
  if(_heroVis && !document.hidden) requestAnimationFrame(frame);
},{threshold:0}).observe(document.getElementById('sc')); }catch(e){}
function frame(ts){
  if(!document.hidden && _heroVis) requestAnimationFrame(frame);

  /* Throttle to ~45fps on mobile to halve GPU load while staying smooth-looking */
  if(isMobile && ts-_lastTime < 20) return;
  _lastTime=ts;

  animT++;

  const rawProg=getHeroScroll();
  if(!isFinite(smoothProg))smoothProg=0;
  smoothProg+=(rawProg-smoothProg)*0.14;
  const prog=smoothProg;

  const t=animT*.022;
  const pulse=0.88+0.12*Math.sin(animT*.018);

  /* Clear with fillRect (faster than clearRect when alpha:false) */
  ctx.save();ctx.scale(dpr,dpr);
  ctx.fillStyle='#050507';ctx.fillRect(0,0,W,H);

  /* Blit pre-rendered stars */
  renderStarLayer(prog);
  if(starOff.width>0 && starOff.height>0) ctx.drawImage(starOff,0,0);

  const sysScale=fitScale*(1+prog*9);
  const orbAlpha=prog<0.5?1:Math.max(0,1-smoothEase((prog-0.5)/.3));
  const planetAlpha=prog<0.4?1:Math.max(0,1-smoothEase((prog-0.4)/.25));
  const sunR=58*(1+Math.sin(animT*.008)*.015)*sysScale;

  drawAmbient(pulse);
  if(orbAlpha>0.01) drawOrbits(sysScale,orbAlpha);

  /* Back planets (behind sun) */
  if(planetAlpha>0.01){
    for(const p of activePlanets){
      const ang=p.phase+animT*p.spd*0.004;
      if(Math.sin(ang)<0) drawPlanet(p,sysScale,planetAlpha);
    }
  }

  drawSun(Cx,Cy,sunR,t);

  /* Front planets (in front of sun) */
  if(planetAlpha>0.01){
    for(const p of activePlanets){
      const ang=p.phase+animT*p.spd*0.004;
      if(Math.sin(ang)>=0) drawPlanet(p,sysScale,planetAlpha);
    }
  }

  /* Fade to dark */
  if(prog>.72){
    const fa=smoothEase(Math.min(1,(prog-.72)/.28));
    ctx.fillStyle=`rgba(4,2,10,${fa})`;
    ctx.fillRect(0,0,W,H);
  }
  ctx.restore();

  /* DOM opacity — only write when value actually changes (avoid style recalc) */
  const textAlpha=prog<0.52?1:prog>0.80?0:1-smoothEase((prog-0.52)/.28);
  const ta=textAlpha.toFixed(2);
  if(htitle.dataset.ta!==ta){
    htitle.dataset.ta=ta;
    const gi=_cachedGI;
    const s=Math.sin(t*1.55);
    htitle.style.opacity=ta;
    htitle.style.textShadow=`0 0 ${(gi*(28+16*s)).toFixed(0)}px rgba(201,168,76,${(0.55*gi).toFixed(2)}),0 0 ${(gi*(55+26*s)).toFixed(0)}px rgba(201,168,76,${(0.22*gi).toFixed(2)}),0 0 ${(gi*(90+40*s)).toFixed(0)}px rgba(255,180,40,${(0.13*gi).toFixed(2)})`;
    if(eyebrow) eyebrow.style.opacity=(textAlpha*.85).toFixed(3);
    if(hsub) hsub.style.opacity=(textAlpha*.75).toFixed(3);
    scue.style.opacity=prog>.12?'0':'1';
  }
}

/* ── MOUSE / TOUCH HOVER ── */
canvas.addEventListener('mousemove',e=>{
  if(smoothProg>.35){hovered=null;info.classList.remove('show');return;}
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  hovered=null;
  for(const p of activePlanets){
    if(p._px!==undefined && Math.hypot(mx-p._px,my-p._py)<(p._cr||p.r)+14){hovered=p;break;}
  }
  if(hovered){info.textContent=hovered.name+' — '+hovered.zodiac;info.classList.add('show');}
  else info.classList.remove('show');
},{passive:true});
canvas.addEventListener('mouseleave',()=>{hovered=null;info.classList.remove('show');});

/* ── RESIZE — debounced to avoid thrash ── */
let _resizeTimer=0;
window.addEventListener('resize',()=>{
  clearTimeout(_resizeTimer);
  _resizeTimer=setTimeout(()=>{resize();},120);
},{passive:true});

/* ── SCROLL — cache layout values, never read in rAF ── */
window.addEventListener('scroll',()=>{
  /* nothing heavy here — getHeroScroll() reads cached _heroH/_vh */
},{passive:true});

document.addEventListener('visibilitychange',()=>{
  if(!document.hidden && _heroVis) requestAnimationFrame(frame);
});

resize();
requestAnimationFrame(frame);

/* ═══════════ CARD REVEAL ═══════════ */
function revealCards(selector,base,stagger){
  const items=document.querySelectorAll(selector);
  if(!items.length)return;
  let triggered=false;
  const obs=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!triggered){
      triggered=true;
      items.forEach((c,i)=>setTimeout(()=>c.classList.add('in'),base+i*stagger));
      obs.disconnect();
    }
  },{threshold:0.05,rootMargin:'0px 0px -40px 0px'});
  obs.observe(items[0]);
}
revealCards('.card[data-delay]',0,200);
['num1','num2','num3'].forEach(g=>{
  const items=document.querySelectorAll(`.num-card[data-group="${g}"]`);
  if(!items.length)return;
  let triggered=false;
  const obs=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!triggered){
      triggered=true;
      items.forEach((c,i)=>setTimeout(()=>c.classList.add('in'),i*140));
      obs.disconnect();
    }
  },{threshold:0.05,rootMargin:'0px 0px -30px 0px'});
  if(items[0])obs.observe(items[0]);
});

/* ═══════════ DROPDOWN FACTORY ═══════════
   Builds a NATIVE <select> that inherits the old hidden input's id, so every
   existing getElementById(hiddenId).value read keeps working unchanged, while
   AI agents, screen readers and keyboard users get a real form control.
   The former div-based fake dropdown is removed from the DOM entirely.        */
const REQUIRED_SELECTS = new Set([
  'cf-dob-day','cf-dob-month','cf-dob-year',
  'cf-tob-hour','cf-tob-min','cf-tob-ampm',
  'cf-ct-hour','cf-ct-min','cf-ct-ampm'
]);

function makeDropdown(displayId,panelId,hiddenId,textId,items,onChange){
  const sel = document.getElementById(hiddenId);
  if(!sel || sel.tagName !== 'SELECT') return null;

  const placeholder = sel.dataset.placeholder || 'Select';
  const initial     = sel.dataset.initial || '';

  /* Populate once. The placeholder <option> is already in the markup. */
  if(sel.options.length <= 1){
    const frag = document.createDocumentFragment();
    items.forEach(item=>{
      const o = document.createElement('option');
      o.value = item.value;
      o.textContent = item.label;
      frag.appendChild(o);
    });
    sel.appendChild(frag);
  }
  if(initial){ sel.value = initial; sel.classList.add('has-value'); }

  sel.addEventListener('change',()=>{
    sel.classList.toggle('has-value', !!sel.value);
    if(onChange) onChange(sel.value);
  });

  return {display:sel, panel:null, hidden:sel, textEl:null, select:sel};
}

/* Close the place autocomplete on outside click.
   (Native <select> elements close themselves — no manual handling needed.) */
document.addEventListener('click',e=>{
  if(!e.target.closest('.autocomplete-wrap')){
    const pl=document.getElementById('place-list');
    if(pl) pl.classList.remove('open');
  }
});

/* Phone verification state */
window._phoneVerified=false;

/* ── Build rich WhatsApp booking message ── */
window.buildWhatsAppMessage=function(){
  const g=function(id){const el=document.getElementById(id);return el?el.value.trim():'';};

  const name    = g('cf-name');
  const email   = g('cf-email');
  const cc      = g('cf-cc')||'+91';
  const phone   = g('cf-phone');
  const service = _selectedService||'Consultation';
  const price   = _selectedPrice?'₹'+_selectedPrice.toLocaleString('en-IN'):'';

  // Date & time of consultation
  const date    = g('cf-consult-date');
  const ctHour  = g('cf-ct-hour');
  const ctMin   = g('cf-ct-min');
  const ctAmpm  = g('cf-ct-ampm');
  const consultTime = (ctHour&&ctMin&&ctAmpm)?`${ctHour}:${ctMin} ${ctAmpm}`:'';

  // Birth details (single person)
  const dobDay  = g('cf-dob-day');
  const dobMon  = g('cf-dob-month');
  const dobYear = g('cf-dob-year');
  const dob     = (dobDay&&dobMon&&dobYear)?`${dobDay}/${dobMon}/${dobYear}`:'';
  const tobHr   = g('cf-tob-hour');
  const tobMin  = g('cf-tob-min');
  const tobAmpm = g('cf-tob-ampm');
  const tob     = (tobHr&&tobMin&&tobAmpm)?`${tobHr}:${tobMin} ${tobAmpm}`:'';
  const place   = g('cf-place');

  // Compatibility details
  const boyName  = g('cf-boy-name');
  const girlName = g('cf-girl-name');
  const boyDobD  = g('cf-boy-dob-day');
  const boyDobM  = g('cf-boy-dob-month');
  const boyDobY  = g('cf-boy-dob-year');
  const boyDob   = (boyDobD&&boyDobM&&boyDobY)?`${boyDobD}/${boyDobM}/${boyDobY}`:'';
  const girlDobD = g('cf-girl-dob-day');
  const girlDobM = g('cf-girl-dob-month');
  const girlDobY = g('cf-girl-dob-year');
  const girlDob  = (girlDobD&&girlDobM&&girlDobY)?`${girlDobD}/${girlDobM}/${girlDobY}`:'';
  const boyPlace = g('cf-boy-place');
  const girlPlace= g('cf-girl-place');

  const about   = g('cf-about');

  const isCompat = service==='Marriage Compatibility';

  let msg = '';
  msg += '🙏 *Namaste Veshannastro,*\n\n';
  msg += `I would like to book a *${service}* session.
`;
  if(price) msg += `*Amount:* ${price}
`;
  msg += '\n';

  msg += '━━━━━━━━━━━━━━━━━━\n';
  msg += '*👤 MY DETAILS*\n';
  msg += '━━━━━━━━━━━━━━━━━━\n';
  if(name)  msg += `*Name:* ${name}
`;
  if(email) msg += `*Email:* ${email}
`;
  if(phone) msg += `*Phone:* ${cc} ${phone}
`;
  msg += '\n';

  if(date||consultTime){
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '*📅 PREFERRED SLOT*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    if(date)        msg += `*Date:* ${date}
`;
    if(consultTime) msg += `*Time:* ${consultTime}
`;
    msg += '\n';
  }

  if(isCompat && (boyName||girlName)){
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '*💑 COMPATIBILITY DETAILS*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    if(boyName)  msg += `*Boy:* ${boyName}
`;
    if(boyDob)   msg += `*Boy DOB:* ${boyDob}
`;
    if(boyPlace) msg += `*Boy Birthplace:* ${boyPlace}
`;
    if(girlName) msg += `*Girl:* ${girlName}
`;
    if(girlDob)  msg += `*Girl DOB:* ${girlDob}
`;
    if(girlPlace)msg += `*Girl Birthplace:* ${girlPlace}
`;
    msg += '\n';
  } else if(!isCompat && (dob||tob||place)){
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '*🌟 BIRTH DETAILS*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    if(dob)   msg += `*Date of Birth:* ${dob}
`;
    if(tob)   msg += `*Time of Birth:* ${tob}
`;
    if(place) msg += `*Place of Birth:* ${place}
`;
    msg += '\n';
  }

  if(about){
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '*💬 MY QUERY*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += `${about}

`;
  }

  msg += '━━━━━━━━━━━━━━━━━━\n';
  msg += '_Please confirm my booking slot. Thank you!_ 🙏';

  return msg;
};

/* Countdown timer for OTP resend */
window.startCountdown=function(btn){
  let secs=60;
  btn.disabled=true;
  const countEl=document.getElementById('otp-countdown');
  countEl.textContent=`Resend OTP in ${secs}s`;
  const iv=setInterval(()=>{
    secs--;
    if(secs<=0){
      clearInterval(iv);
      btn.disabled=false;
      btn.textContent='Resend OTP →';
      countEl.textContent='';
    } else {
      countEl.textContent=`Resend OTP in ${secs}s`;
    }
  },1000);
};

/* Country codes */
const COUNTRY_CODES=[
  {value:'+91',label:'🇮🇳 +91 India'},{value:'+1',label:'🇺🇸 +1 USA/Canada'},
  {value:'+44',label:'🇬🇧 +44 UK'},{value:'+61',label:'🇦🇺 +61 Australia'},
  {value:'+971',label:'🇦🇪 +971 UAE'},{value:'+65',label:'🇸🇬 +65 Singapore'},
  {value:'+60',label:'🇲🇾 +60 Malaysia'},{value:'+64',label:'🇳🇿 +64 New Zealand'},
  {value:'+27',label:'🇿🇦 +27 South Africa'},{value:'+49',label:'🇩🇪 +49 Germany'},
  {value:'+33',label:'🇫🇷 +33 France'},{value:'+39',label:'🇮🇹 +39 Italy'},
  {value:'+81',label:'🇯🇵 +81 Japan'},{value:'+82',label:'🇰🇷 +82 South Korea'},
  {value:'+86',label:'🇨🇳 +86 China'},{value:'+55',label:'🇧🇷 +55 Brazil'},
  {value:'+52',label:'🇲🇽 +52 Mexico'},{value:'+7',label:'🇷🇺 +7 Russia'},
  {value:'+34',label:'🇪🇸 +34 Spain'},{value:'+31',label:'🇳🇱 +31 Netherlands'},
  {value:'+92',label:'🇵🇰 +92 Pakistan'},{value:'+880',label:'🇧🇩 +880 Bangladesh'},
  {value:'+94',label:'🇱🇰 +94 Sri Lanka'},{value:'+977',label:'🇳🇵 +977 Nepal'},
  {value:'+966',label:'🇸🇦 +966 Saudi Arabia'},{value:'+20',label:'🇪🇬 +20 Egypt'},
  {value:'+234',label:'🇳🇬 +234 Nigeria'},{value:'+254',label:'🇰🇪 +254 Kenya'},
];
makeDropdown('cc-display','cc-panel','cf-cc','cc-text',COUNTRY_CODES,onCountryChange);

/* ── Phone length map (ITU-T national subscriber number lengths) ── */
const PHONE_LENGTHS={
  '+91':10, '+1':10,  '+44':10, '+61':9,  '+971':9, '+65':8,
  '+60':9,  '+64':8,  '+27':9,  '+49':10, '+33':9,  '+39':10,
  '+81':10, '+82':10, '+86':11, '+55':11, '+52':10, '+7':10,
  '+34':9,  '+31':9,  '+92':10, '+880':10,'+94':9,  '+977':10,
  '+966':9, '+20':10, '+234':10,'+254':9,
};

function getExpectedLen(){
  const cc=document.getElementById('cf-cc').value||'+91';
  return PHONE_LENGTHS[cc]||10;
}

function updatePhoneHint(){
  const ph=document.getElementById('cf-phone');
  const hint=document.getElementById('phone-len-hint');
  const badge=document.getElementById('phone-badge');
  const digits=(ph.value||'').replace(/\D/g,'');
  const expected=getExpectedLen();
  if(!digits.length){
    hint.textContent=`Enter ${expected} digits`;
    hint.className='phone-len-hint';
    badge.classList.remove('show');
    return;
  }
  if(digits.length===expected){
    hint.textContent=`✓ ${expected} digits — correct length`;
    hint.className='phone-len-hint ok';
    badge.classList.add('show');
    ph.classList.remove('err');
    cfHideErr(document.getElementById('cf-phone-err'));
  } else {
    hint.textContent=`${digits.length} / ${expected} digits needed`;
    hint.className=digits.length>expected?'phone-len-hint err':'phone-len-hint';
    badge.classList.remove('show');
  }
}

function onCountryChange(){
  const ph=document.getElementById('cf-phone');
  const expected=getExpectedLen();
  ph.maxLength=expected;
  ph.placeholder=`${expected}-digit number`;
  updatePhoneHint();
}

/* Numeric-only + maxlength enforcement on phone field */
(function(){
  const ph=document.getElementById('cf-phone');
  // set initial state for India
  ph.maxLength=10;
  ph.placeholder='10-digit number';
  document.getElementById('phone-len-hint').textContent='Enter 10 digits';

  ph.addEventListener('input',function(){
    // strip non-digits
    const clean=this.value.replace(/\D/g,'');
    const expected=getExpectedLen();
    this.value=clean.slice(0,expected);
    updatePhoneHint();
  });
  ph.addEventListener('keydown',function(e){
    // allow: backspace, delete, tab, escape, enter, arrows, home, end
    const allowed=['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
    if(allowed.includes(e.key))return;
    // allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if((e.ctrlKey||e.metaKey)&&['a','c','v','x'].includes(e.key.toLowerCase()))return;
    // block non-digits
    if(!/^\d$/.test(e.key))e.preventDefault();
  });
  ph.addEventListener('paste',function(e){
    e.preventDefault();
    const pasted=(e.clipboardData||window.clipboardData).getData('text');
    const digits=pasted.replace(/\D/g,'');
    const expected=getExpectedLen();
    this.value=(this.value+digits).replace(/\D/g,'').slice(0,expected);
    updatePhoneHint();
  });
})();

/* Days */
const DAYS=Array.from({length:31},(_,i)=>({value:String(i+1).padStart(2,'0'),label:String(i+1)}));
makeDropdown('dob-day-display','dob-day-panel','cf-dob-day','dob-day-text',DAYS);

/* Months */
const MONTHS=[
  {value:'01',label:'January'},{value:'02',label:'February'},{value:'03',label:'March'},
  {value:'04',label:'April'},{value:'05',label:'May'},{value:'06',label:'June'},
  {value:'07',label:'July'},{value:'08',label:'August'},{value:'09',label:'September'},
  {value:'10',label:'October'},{value:'11',label:'November'},{value:'12',label:'December'},
];
makeDropdown('dob-month-display','dob-month-panel','cf-dob-month','dob-month-text',MONTHS);

/* Years */
const curYear=new Date().getFullYear();
const YEARS=Array.from({length:100},(_,i)=>({value:String(curYear-i),label:String(curYear-i)}));
makeDropdown('dob-year-display','dob-year-panel','cf-dob-year','dob-year-text',YEARS);

/* Time of Birth — AM/PM style */
const TOB_HOURS=Array.from({length:12},(_,i)=>({value:String(i+1).padStart(2,'0'),label:String(i+1).padStart(2,'0')}));
const TOB_MINS=Array.from({length:12},(_,i)=>({value:String(i*5).padStart(2,'0'),label:String(i*5).padStart(2,'0')}));
const TOB_AMPM=[{value:'AM',label:'AM'},{value:'PM',label:'PM'}];

function syncTOBHidden(){
  const h=document.getElementById('cf-tob-hour').value;
  const m=document.getElementById('cf-tob-min').value;
  const ap=document.getElementById('cf-tob-ampm').value;
  if(h&&m&&ap){document.getElementById('cf-time').value=`${h}:${m} ${ap}`;}
}
makeDropdown('tob-hour-display','tob-hour-panel','cf-tob-hour','tob-hour-text',TOB_HOURS,syncTOBHidden);
makeDropdown('tob-min-display','tob-min-panel','cf-tob-min','tob-min-text',TOB_MINS,syncTOBHidden);
makeDropdown('tob-ampm-display','tob-ampm-panel','cf-tob-ampm','tob-ampm-text',TOB_AMPM,syncTOBHidden);

/* Consultation preferred time — AM/PM style */
const CT_HOURS=Array.from({length:12},(_,i)=>({value:String(i+1).padStart(2,'0'),label:String(i+1).padStart(2,'0')}));
const CT_MINS=[{value:'00',label:'00'},{value:'15',label:'15'},{value:'30',label:'30'},{value:'45',label:'45'}];
const CT_AMPM=[{value:'AM',label:'AM'},{value:'PM',label:'PM'}];
makeDropdown('ct-hour-display','ct-hour-panel','cf-ct-hour','ct-hour-text',CT_HOURS);
makeDropdown('ct-min-display','ct-min-panel','cf-ct-min','ct-min-text',CT_MINS);
makeDropdown('ct-ampm-display','ct-ampm-panel','cf-ct-ampm','ct-ampm-text',CT_AMPM);

/* ── BOY DOB dropdowns ── */
makeDropdown('boy-dob-day-display','boy-dob-day-panel','cf-boy-dob-day','boy-dob-day-text',DAYS);
makeDropdown('boy-dob-month-display','boy-dob-month-panel','cf-boy-dob-month','boy-dob-month-text',MONTHS);
makeDropdown('boy-dob-year-display','boy-dob-year-panel','cf-boy-dob-year','boy-dob-year-text',YEARS);
/* ── BOY TOB dropdowns ── */
function syncBoyTOB(){const h=document.getElementById('cf-boy-tob-hour').value,m=document.getElementById('cf-boy-tob-min').value,ap=document.getElementById('cf-boy-tob-ampm').value;if(h&&m&&ap)document.getElementById('cf-boy-time').value=`${h}:${m} ${ap}`;}
makeDropdown('boy-tob-hour-display','boy-tob-hour-panel','cf-boy-tob-hour','boy-tob-hour-text',TOB_HOURS,syncBoyTOB);
makeDropdown('boy-tob-min-display','boy-tob-min-panel','cf-boy-tob-min','boy-tob-min-text',TOB_MINS,syncBoyTOB);
makeDropdown('boy-tob-ampm-display','boy-tob-ampm-panel','cf-boy-tob-ampm','boy-tob-ampm-text',TOB_AMPM,syncBoyTOB);

/* ── GIRL DOB dropdowns ── */
makeDropdown('girl-dob-day-display','girl-dob-day-panel','cf-girl-dob-day','girl-dob-day-text',DAYS);
makeDropdown('girl-dob-month-display','girl-dob-month-panel','cf-girl-dob-month','girl-dob-month-text',MONTHS);
makeDropdown('girl-dob-year-display','girl-dob-year-panel','cf-girl-dob-year','girl-dob-year-text',YEARS);
/* ── GIRL TOB dropdowns ── */
function syncGirlTOB(){const h=document.getElementById('cf-girl-tob-hour').value,m=document.getElementById('cf-girl-tob-min').value,ap=document.getElementById('cf-girl-tob-ampm').value;if(h&&m&&ap)document.getElementById('cf-girl-time').value=`${h}:${m} ${ap}`;}
makeDropdown('girl-tob-hour-display','girl-tob-hour-panel','cf-girl-tob-hour','girl-tob-hour-text',TOB_HOURS,syncGirlTOB);
makeDropdown('girl-tob-min-display','girl-tob-min-panel','cf-girl-tob-min','girl-tob-min-text',TOB_MINS,syncGirlTOB);
makeDropdown('girl-tob-ampm-display','girl-tob-ampm-panel','cf-girl-tob-ampm','girl-tob-ampm-text',TOB_AMPM,syncGirlTOB);

/* Set min date for consultation date picker to today */
(function(){const d=new Date();const y=d.getFullYear(),mo=String(d.getMonth()+1).padStart(2,'0'),dy=String(d.getDate()).padStart(2,'0');document.getElementById('cf-consult-date').min=`${y}-${mo}-${dy}`;})();

/* ── CITY AUTOCOMPLETE via Nominatim (OpenStreetMap) ── */
(function(){
  var _timers={};

  function attachCityAC(inputId, listId, errId){
    var input = document.getElementById(inputId);
    var list  = document.getElementById(listId);
    if(!input || !list) return;

    input.addEventListener('input', function(){
      var val = this.value.trim();
      list.innerHTML='';
      list.classList.remove('open');
      clearTimeout(_timers[inputId]);
      if(val.length < 2) return;

      _timers[inputId] = setTimeout(function(){
        var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=8&featuretype=city&city=' + encodeURIComponent(val) + '&addressdetails=1';
        fetch(url, { headers:{'Accept-Language':'en','User-Agent':'VeshannAstro/1.0'} })
          .then(function(r){ return r.json(); })
          .then(function(data){
            list.innerHTML='';
            if(!data || !data.length){ list.classList.remove('open'); return; }
            data.forEach(function(item){
              var parts=[];
              if(item.address){
                var a=item.address;
                var city=a.city||a.town||a.village||a.municipality||a.county||item.display_name.split(',')[0];
                var state=a.state||a.region||'';
                var country=a.country||'';
                if(city) parts.push(city);
                if(state && state!==city) parts.push(state);
                if(country) parts.push(country);
              }
              var label = parts.length ? parts.join(', ') : item.display_name.split(',').slice(0,3).join(',').trim();
              var div=document.createElement('div');
              div.className='autocomplete-item';
              div.textContent=label;
              div.addEventListener('mousedown', function(e){
                e.preventDefault();
                input.value=label;
                list.innerHTML='';
                list.classList.remove('open');
                input.classList.remove('err');
                if(errId) document.getElementById(errId).style.display='none';
              });
              list.appendChild(div);
            });
            if(list.children.length) list.classList.add('open');
          })
          .catch(function(){ list.classList.remove('open'); });
      }, 320);
    });

    input.addEventListener('blur', function(){
      setTimeout(function(){ list.classList.remove('open'); }, 200);
    });
    input.addEventListener('focus', function(){
      if(list.children.length) list.classList.add('open');
    });
  }

  attachCityAC('cf-place',     'place-list',     'cf-place-err');
  attachCityAC('cf-boy-place', 'boy-place-list', 'cf-boy-place-err');
  attachCityAC('cf-girl-place','girl-place-list','cf-girl-place-err');
})();

/* ═══════════ EMAILJS INIT ═══════════ */
/* Loaded via static <script> tag in <head> — see top of file */

/* ═══════════ RAZORPAY SCRIPT LOAD ═══════════ */
/* Razorpay loaded via static <script defer> in <head> */
let _rzpReady=false;
let _rzpError=false;
(function waitRzp(){
  if(typeof Razorpay!=='undefined'){_rzpReady=true;}
  else{setTimeout(waitRzp,100);}
})();

/* ═══════════ CONSULT MODAL ═══════════ */
let _selectedService='General Consultation';
let _selectedPrice=0;

window.openConsult=function(e,cardEl,forcedService,forcedPrice){
  if(e){e.preventDefault();e.stopPropagation();}
  if(forcedService){
    _selectedService=forcedService;
    _selectedPrice=forcedPrice||0;
  } else {
    const card=cardEl||e?.currentTarget?.closest('[data-service]');
    if(card&&card.dataset.service){
      _selectedService=card.dataset.service;
      _selectedPrice=parseInt(card.dataset.price)||0;
    } else {
      _selectedService='General Consultation';
      _selectedPrice=0;
    }
  }
  // Toggle Marriage Compatibility dual-form
  const isCompat=_selectedService==='Marriage Compatibility';
  document.getElementById('cf-single-details').style.display=isCompat?'none':'block';
  document.getElementById('cf-compat-details').style.display=isCompat?'block':'none';
  // Show service banner
  const banner=document.getElementById('cf-service-banner');
  if(_selectedService&&_selectedPrice){
    banner.textContent=`${_selectedService}  ·  ₹${_selectedPrice.toLocaleString('en-IN')}`;
    banner.style.display='block';
  } else {
    banner.style.display='none';
  }
  const btn=document.getElementById('cf-submit');
  btn.textContent=_selectedPrice?`Proceed to Pay ₹${_selectedPrice.toLocaleString('en-IN')}`:'Submit & Book Consultation';
  document.getElementById('consult-overlay').classList.add('open');
  document.body.style.overflow='hidden';
};

/* ── WhatsApp direct booking ── */
window.openWhatsAppBooking=function(){
  // Basic validation before opening WA
  const name=document.getElementById('cf-name').value.trim();
  const email=document.getElementById('cf-email').value.trim();
  if(!name||name.length<2){
    alert('Please enter your name first.');
    document.getElementById('cf-name').focus();
    return;
  }
  if(!email||!/^[^@]+@[^@]+\.[^@]+$/.test(email)){
    alert('Please enter a valid email address first.');
    document.getElementById('cf-email').focus();
    return;
  }
  const waUrl='https://wa.me/918827684725?text='+encodeURIComponent(buildWhatsAppMessage());
  window.open(waUrl,'_blank');
};

function closeConsult(){
  // Reset OTP verification state
  window._phoneVerified=false;
  const otp=document.getElementById('otp-input-section');
  const strip=document.getElementById('phone-verified-strip');
  const sendBtn=document.getElementById('otp-send-btn');
  const otpStatus=document.getElementById('otp-status');
  const countdown=document.getElementById('otp-countdown');
  const sub=document.getElementById('cf-submit');
  const ph=document.getElementById('cf-phone');
  const ccDisp=document.getElementById('cf-cc');
  if(otp)otp.style.display='none';
  if(strip)strip.style.display='none';
  if(sendBtn){sendBtn.style.display='';sendBtn.disabled=false;sendBtn.textContent='Send OTP to Email →';}
  if(otpStatus)otpStatus.textContent='';
  if(countdown)countdown.textContent='';
  if(sub){sub.textContent='Verify Phone to Continue →';sub.style.opacity='0.5';}
  if(ph){ph.readOnly=false;}
  const emailEl=document.getElementById('cf-email');if(emailEl)emailEl.readOnly=false;
  if(ccDisp){ccDisp.style.pointerEvents='';ccDisp.style.opacity='';}

  document.getElementById('consult-overlay').classList.remove('open');
  document.body.style.overflow='';
  const note=document.querySelector('.price-note');
  if(note)note.remove();
}
var _consultX=document.getElementById('consult-x');if(_consultX)_consultX.addEventListener('click',closeConsult);
var _consultOv=document.getElementById('consult-overlay');if(_consultOv)_consultOv.addEventListener('click',e=>{if(e.target===_consultOv)closeConsult();});
// Service picker (button removed — guarded so no TypeError if absent)
var _openConsultBtn=document.getElementById('open-consult-btn');
if(_openConsultBtn)_openConsultBtn.addEventListener('click',()=>{
  var _svcPicker=document.getElementById('svc-picker-overlay');if(_svcPicker){_svcPicker.classList.add('open');document.body.style.overflow='hidden';}
});
var _svcClose=document.getElementById('svc-picker-close');
if(_svcClose)_svcClose.addEventListener('click',()=>{
  var _svcPicker=document.getElementById('svc-picker-overlay');if(_svcPicker){_svcPicker.classList.remove('open');document.body.style.overflow='';}
});
var _svcPickerOv=document.getElementById('svc-picker-overlay');
if(_svcPickerOv)_svcPickerOv.addEventListener('click',e=>{
  if(e.target===_svcPickerOv){_svcPickerOv.classList.remove('open');document.body.style.overflow='';}
});

window.pickService=function(service,price){
  document.getElementById('svc-picker-overlay').classList.remove('open');
  openConsult(null,null,service,price);
};

/* ── Auto-open booking modal from URL params (used by booking sub-pages) ── */
(function(){
  try{
    var params=new URLSearchParams(window.location.search);
    var svc=params.get('service');
    var price=parseInt(params.get('price'))||0;
    var cat=params.get('cat')||'';
    if(svc){
      window.addEventListener('DOMContentLoaded',function(){
        /* small delay so all scripts are ready */
        setTimeout(function(){
          if(typeof openConsult==='function'){
            openConsult(null,null,svc,price);
          }
        },200);
      });
      /* also clean URL so back-button works cleanly */
      if(window.history && window.history.replaceState){
        window.history.replaceState({},'',window.location.pathname);
      }
    }
  }catch(err){}
})();
document.querySelectorAll('.card-cta').forEach(a=>a.addEventListener('click',function(e){
  openConsult(e,this.closest('[data-service]'));
}));

function collectFormData(){
  const isCompat=_selectedService==='Marriage Compatibility';
  const ctMin=document.getElementById('cf-ct-min').value||'00';
  const consultTime=((document.getElementById('cf-ct-hour').value||'')+':'+ctMin+' '+(document.getElementById('cf-ct-ampm').value||'')).trim();
  if(isCompat){
    const boyTime=(document.getElementById('cf-boy-tob-hour').value||'')+(':'+(document.getElementById('cf-boy-tob-min').value||'00'))+' '+(document.getElementById('cf-boy-tob-ampm').value||'');
    const girlTime=(document.getElementById('cf-girl-tob-hour').value||'')+(':'+(document.getElementById('cf-girl-tob-min').value||'00'))+' '+(document.getElementById('cf-girl-tob-ampm').value||'');
    return{
      from_name   :document.getElementById('cf-name').value.trim(),
      email       :document.getElementById('cf-email').value.trim(),
      phone       :(document.getElementById('cf-cc').value||'+91')+' '+document.getElementById('cf-phone').value.trim(),
      dob         :'BOY: '+[document.getElementById('cf-boy-dob-day').value,document.getElementById('cf-boy-dob-month').value,document.getElementById('cf-boy-dob-year').value].join(' / ')+' | GIRL: '+[document.getElementById('cf-girl-dob-day').value,document.getElementById('cf-girl-dob-month').value,document.getElementById('cf-girl-dob-year').value].join(' / '),
      tob         :'BOY: '+boyTime.trim()+' | GIRL: '+girlTime.trim(),
      pob         :'BOY: '+(document.getElementById('cf-boy-place').value.trim())+' | GIRL: '+(document.getElementById('cf-girl-place').value.trim()),
      query       :'BOY: '+(document.getElementById('cf-boy-name').value.trim())+' | GIRL: '+(document.getElementById('cf-girl-name').value.trim())+'\n\n'+(document.getElementById('cf-about').value.trim()),
      consult_date:document.getElementById('cf-consult-date').value,
      consult_time:consultTime,
      service     :_selectedService,
      amount      :'₹'+(_selectedPrice).toLocaleString('en-IN'),
    };
  }
  const dobVal=[document.getElementById('cf-dob-day').value,document.getElementById('cf-dob-month').value,document.getElementById('cf-dob-year').value].join(' / ');
  const tobVal=document.getElementById('cf-time').value||'Not provided';
  return{
    from_name   :document.getElementById('cf-name').value.trim(),
    email       :document.getElementById('cf-email').value.trim(),
    phone       :(document.getElementById('cf-cc').value||'+91')+' '+document.getElementById('cf-phone').value.trim(),
    dob         :dobVal,
    tob         :tobVal,
    pob         :document.getElementById('cf-place').value.trim(),
    query       :document.getElementById('cf-about').value.trim(),
    consult_date:document.getElementById('cf-consult-date').value,
    consult_time:consultTime,
    service     :_selectedService,
    amount      :'₹'+(_selectedPrice).toLocaleString('en-IN'),
  };
}

function sendEmailAndShowSuccess(params){
  // Show success screen immediately — no blocking alert on email failure
  function showSuccess(){
    document.getElementById('consult-form-wrap').style.display='none';
    document.getElementById('consult-success').classList.add('show');
  }

  emailjs.send('service_3oqwdr2','template_ruq37kg',params)
    .then(showSuccess)
    .catch(function(err){
      console.warn('EmailJS notification skipped:',err.text||err.message||err);
      // Payment is confirmed — still show success, silently log error
      showSuccess();
    });
}

document.getElementById('cf-submit').addEventListener('click',function(){
  // Require phone OTP verification
  if(!window._phoneVerified){
    document.getElementById('otp-status').textContent='Please verify your email first — click "Send OTP to Email" above.';
    document.getElementById('otp-send-btn').scrollIntoView({behavior:'smooth',block:'center'});
    document.getElementById('otp-status').style.color='#e0a070';
    document.getElementById('otp-send-btn').scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }

  let valid=true;
  function check(id,errId,fn){
    const el=document.getElementById(id);const err=document.getElementById(errId);
    const val=el?el.value:'';
    if(!fn(val)){if(el)el.classList.add('err');if(err)cfShowErr(err);valid=false;}
    else{if(el)el.classList.remove('err');if(err)cfHideErr(err);}
  }
  check('cf-name','cf-name-err',v=>v.trim().length>2);
  check('cf-email','cf-email-err',v=>/^[^@]+@[^@]+\.[^@]+$/.test(v));
  // Phone: numeric only, exact length per country code
  (function(){
    const ph=document.getElementById('cf-phone');
    const err=document.getElementById('cf-phone-err');
    const digits=(ph?ph.value:'').replace(/\D/g,'');
    const expected=getExpectedLen();
    if(digits.length!==expected){
      if(ph)ph.classList.add('err');
      if(err){err.textContent=`Please enter exactly ${expected} digits for the selected country`;cfShowErr(err);}
      valid=false;
    } else {
      if(ph)ph.classList.remove('err');
      if(err)cfHideErr(err);
    }
  })();

  const isCompat=_selectedService==='Marriage Compatibility';
  if(!isCompat){
    // Single person validation
    const d=document.getElementById('cf-dob-day').value;
    const mo=document.getElementById('cf-dob-month').value;
    const y=document.getElementById('cf-dob-year').value;
    const dobErr=document.getElementById('cf-dob-err');
    if(!d||!mo||!y){
      cfShowErr(dobErr);valid=false;
      ['dob-day-display','dob-month-display','dob-year-display'].forEach(function(id){
        const el=document.getElementById(id);
        if(el)el.style.borderColor='rgba(224,112,112,0.5)';
      });
    }else{
      cfHideErr(dobErr);
      ['dob-day-display','dob-month-display','dob-year-display'].forEach(function(id){
        const el=document.getElementById(id);if(el)el.style.borderColor='';
      });
    }
    // Time of birth — REQUIRED
    const tErr=document.getElementById('cf-time-err');
    const tVal=document.getElementById('cf-time').value;
    if(!tVal){
      cfShowErr(tErr);
      valid=false;
      // highlight the time dropdowns
      ['ct-time-hour-display','ct-time-min-display','ct-time-ampm-display'].forEach(function(id){
        const el=document.getElementById(id);if(el)el.style.borderColor='rgba(224,112,112,0.5)';
      });
    } else {
      cfHideErr(tErr);
      ['ct-time-hour-display','ct-time-min-display','ct-time-ampm-display'].forEach(function(id){
        const el=document.getElementById(id);if(el)el.style.borderColor='';
      });
    }
    check('cf-place','cf-place-err',v=>v.trim().length>2);
  } else {
    // Boy validation
    check('cf-boy-name','cf-boy-name-err',v=>v.trim().length>2);
    const bd=document.getElementById('cf-boy-dob-day').value,bm=document.getElementById('cf-boy-dob-month').value,by=document.getElementById('cf-boy-dob-year').value;
    const boyDobErr=document.getElementById('cf-boy-dob-err');
    if(!bd||!bm||!by){cfShowErr(boyDobErr);valid=false;}else cfHideErr(boyDobErr);
    // Boy time — REQUIRED
    const btErr=document.getElementById('cf-boy-time-err');
    const btVal=document.getElementById('cf-boy-time')?document.getElementById('cf-boy-time').value:'';
    if(!btVal){cfShowErr(btErr);valid=false;}else cfHideErr(btErr);
    check('cf-boy-place','cf-boy-place-err',v=>v.trim().length>2);
    // Girl validation
    check('cf-girl-name','cf-girl-name-err',v=>v.trim().length>2);
    const gd=document.getElementById('cf-girl-dob-day').value,gm=document.getElementById('cf-girl-dob-month').value,gy=document.getElementById('cf-girl-dob-year').value;
    const girlDobErr=document.getElementById('cf-girl-dob-err');
    if(!gd||!gm||!gy){cfShowErr(girlDobErr);valid=false;}else cfHideErr(girlDobErr);
    // Girl time — REQUIRED
    const gtErr=document.getElementById('cf-girl-time-err');
    const gtVal=document.getElementById('cf-girl-time')?document.getElementById('cf-girl-time').value:'';
    if(!gtVal){cfShowErr(gtErr);valid=false;}else cfHideErr(gtErr);
    check('cf-girl-place','cf-girl-place-err',v=>v.trim().length>2);
  }
  check('cf-about','cf-about-err',v=>v.trim().length>5);
  const cDate=document.getElementById('cf-consult-date').value;
  const cH=document.getElementById('cf-ct-hour').value;
  const cAP=document.getElementById('cf-ct-ampm').value;
  const cErr=document.getElementById('cf-consult-err');
  if(!cDate||!cH||!cAP){
    cfShowErr(cErr);valid=false;
    if(!cH){const d=document.getElementById('cf-ct-hour');if(d)d.style.borderColor='rgba(224,112,112,0.5)';}
    if(!cAP){const d=document.getElementById('cf-ct-ampm');if(d)d.style.borderColor='rgba(224,112,112,0.5)';}
    if(!cDate){const d=document.getElementById('cf-consult-date');if(d)d.classList.add('err');}
  }else{
    cfHideErr(cErr);
    ['ct-hour-display','ct-ampm-display'].forEach(id=>{const d=document.getElementById(id);if(d)d.style.borderColor='';});
    const d=document.getElementById('cf-consult-date');if(d)d.classList.remove('err');
  }

  if(!valid){
    // Scroll to first visible error so user knows what's missing
    const firstErr=document.querySelector('#consult-overlay .cf-err[style*="block"], #consult-overlay .cf-err[style*="display: block"]');
    if(firstErr){firstErr.scrollIntoView({behavior:'smooth',block:'center'});}
    return;
  }

  const params=collectFormData();
  const btn=this;

  // If no price (fallback), just send email directly
  if(!_selectedPrice){
    btn.disabled=true;btn.textContent='Sending…';
    sendEmailAndShowSuccess(params);
    return;
  }

  // Open Razorpay checkout
  function resetBtn(){btn.disabled=false;btn.textContent=`Proceed to Pay ₹${_selectedPrice.toLocaleString('en-IN')}`;}

  // Block file:// origin — Razorpay requires http/https
  if(window.location.protocol==='file:'){
    resetBtn();
    alert('⚠ Payment cannot run from a local file.\n\nPlease upload this file to your web hosting (e.g. Hostinger) and open it via https:// — then payments will work correctly.');
    return;
  }

  // Check if Razorpay loaded (may be blocked by ad-blocker or network)
  if(typeof Razorpay==='undefined'){
    resetBtn();
    const waUrl='https://wa.me/918827684725?text='+encodeURIComponent(buildWhatsAppMessage());
    if(confirm('Payment gateway could not be reached (it may be blocked by an ad-blocker or your network).\n\nClick OK to complete your booking via WhatsApp instead.')){
      window.open(waUrl,'_blank');
    }
    return;
  }
  btn.disabled=true;btn.textContent='Opening Payment…';
  launchRazorpay();

  function launchRazorpay(){
    try{
      const options={
        key        :'rzp_live_T0NA0F3UpQiZxl', // ← REPLACE with your live key from Razorpay Dashboard before going live
        amount     :_selectedPrice*100,
        currency   :'INR',
        name       :'Veshannastro',
        description:_selectedService,
        image      :'',
        prefill    :{name:params.from_name, email:params.email, contact:(document.getElementById('cf-cc').value||'+91')+document.getElementById('cf-phone').value.replace(/\D/g,'')},
        theme      :{color:'#C9A84C'},
        modal      :{ondismiss:function(){resetBtn();}},
        handler    :function(response){
          params.payment_id=response.razorpay_payment_id;
          /* ── Log paid booking to Google Sheet ── */
          try{
            /* no-cors + text/plain body — GAS reads via e.postData.contents */
            fetch('https://script.google.com/macros/s/AKfycbztoMrSKovuP6k6tEQioce6FEJGdbXhjKZTMC3GMq-fJY7kE2EveHIwbzyvqdrVI3rF/exec',{
              method :'POST',
              body   :JSON.stringify({
                name      :params.from_name,
                phone     :params.phone,
                email     :params.email,
                service   :params.service,
                dob       :params.dob,
                birthTime :params.tob,
                birthPlace:params.pob,
                message   :params.query||'',
                source    :'Website - Paid',
                payment_id:params.payment_id,
                amount    :params.amount
              }),
              mode   :'no-cors'
            });
          }catch(e){console.warn('Sheet log failed:',e);}
          sendEmailAndShowSuccess(params);
        },
      };
      const rzp=new Razorpay(options);
      rzp.on('payment.failed',function(response){
        resetBtn();
        const msg=response&&response.error&&response.error.description?response.error.description:'Unknown error';
        alert('Payment failed: '+msg+'\nPlease try again.');
      });
      rzp.open();
    }catch(err){
      resetBtn();
      console.error('Razorpay error:',err);
      alert('Could not open payment gateway: '+err.message+'\nPlease reload the page and try again.');
    }
  }
});

/* ═══════════ CALCULATOR ENGINE ═══════════ */
const CHEIRO={A:1,I:1,J:1,Q:1,Y:1,B:2,K:2,R:2,C:3,G:3,L:3,S:3,D:4,M:4,T:4,E:5,H:5,N:5,X:5,U:6,V:6,W:6,F:8,P:8};
function charVal(c){return CHEIRO[c.toUpperCase()]||0;}
function reduceNum(n){while(n>9&&n!==11&&n!==22&&n!==33){let s=0,t=n;while(t>0){s+=t%10;t=Math.floor(t/10);}n=s;}return n;}
function nameToNum(name){return name.split('').reduce((a,c)=>a+charVal(c),0);}
function dobToLP(dd,mm,yyyy){
  let s=0;
  [dd,mm,yyyy].forEach(x=>{let n=parseInt(x,10);while(n>0){s+=n%10;n=Math.floor(n/10);}});
  return reduceNum(s);
}

const NUM_MEANINGS={
  1:"The Leader — independent, ambitious, pioneering. A number of new beginnings and bold self-reliance.",
  2:"The Diplomat — cooperative, sensitive, intuitive. Harmony and deep partnerships define your path.",
  3:"The Creator — expressive, joyful, artistic. Communication and creative self-expression are your greatest gifts.",
  4:"The Builder — disciplined, practical, reliable. Structure and devoted hard work lead to lasting success.",
  5:"The Explorer — freedom-loving, adventurous, versatile. Change and curiosity are the fuel of your journey.",
  6:"The Nurturer — compassionate, responsible, harmonious. Family, love, and heartfelt service are your calling.",
  7:"The Seeker — analytical, introspective, spiritual. Inner wisdom and sacred truth are your greatest treasures.",
  8:"The Achiever — powerful, authoritative, materially blessed. Business acumen and leadership are your strengths.",
  9:"The Humanitarian — compassionate, idealistic, universal. Service to humanity is your highest and truest purpose.",
  11:"Master Number 11 — The Intuitive. Heightened spiritual awareness and inspirational leadership beyond the ordinary.",
  22:"Master Number 22 — The Master Builder. Rare ability to transform grand visions into tangible, lasting reality.",
  33:"Master Number 33 — The Master Teacher. Nurturing all of humanity through boundless wisdom and compassion."
};
const PLANET_RULERS={1:"Sun ☉ — Vitality, authority, and radiant self-expression",2:"Moon ☽ — Emotion, intuition, and the rhythm of cycles",3:"Jupiter ♃ — Expansion, wisdom, and abundant blessings",4:"Uranus ♅ — Innovation, rebellion, and sudden awakening",5:"Mercury ☿ — Communication, intellect, and swift movement",6:"Venus ♀ — Love, beauty, harmony, and aesthetic grace",7:"Neptune ♆ — Dreams, illusion, mysticism, and the unseen",8:"Saturn ♄ — Discipline, karma, structure, and time",9:"Mars ♂ — Energy, courage, drive, and fierce determination"};
const LUCKY_COLOURS={1:"Gold & Orange — radiate solar confidence",2:"White & Silver — reflect lunar serenity",3:"Yellow & Violet — channel Jupiterian abundance",4:"Blue & Green — ground Uranian innovation",5:"Grey & Silver — flow with Mercurial adaptability",6:"Pink & Rose — emanate Venusian warmth",7:"Indigo & Violet — deepen Neptunian intuition",8:"Midnight Blue & Black — honour Saturnine strength",9:"Crimson & Red — ignite Martian fire"};
const HOUSE_VIBES={1:"Independence & Bold New Beginnings",2:"Harmony, Partnership & Gentle Growth",3:"Creativity, Communication & Joyful Expression",4:"Stability, Security & Ancestral Roots",5:"Change, Adventure & Constant Evolution",6:"Family, Healing & Devoted Service",7:"Reflection, Solitude & Deep Inner Wisdom",8:"Wealth, Power & Profound Transformation",9:"Spirituality, Completion & Universal Love"};
const BANK_VIBES={1:"Wealth through bold independence and initiative",2:"Steady, patient accumulation through partnerships",3:"Lucky windfalls and expansive financial growth",4:"Disciplined savings leading to unshakeable security",5:"Variable yet dynamic fortune through adaptability",6:"Comfortable domestic wealth and lasting comfort",7:"Unexpected gains through deep intuition and faith",8:"Magnetic financial attraction and authority",9:"Abundance that multiplies through generosity"};
const LOSHU_LAYOUT=[[4,9,2],[3,5,7],[8,1,6]];
function buildLoShu(dd,mm,yyyy){
  // Correct Lo Shu: use each digit individually from day, month, year
  // Remove leading zeros - day 9 = '9', not '09'
  const parts=[String(parseInt(dd,10)),String(parseInt(mm,10)),String(parseInt(yyyy,10))];
  const str=parts.join('');
  const c={};
  for(const d of str)if(d!=='0')c[d]=(c[d]||0)+1;
  return c;
}
const colourHex={1:'#ff8c00',2:'#c0c0c0',3:'#ffd700',4:'#4a90d9',5:'#a0a0a0',6:'#ff9eb5',7:'#9b59b6',8:'#1a1a2e',9:'#c0392b'};

/* Calc DOB fields (three-part in calculator) */
function buildCalcDOBRow(){
  return `
    <div class="calc-dob-row">
      <div>
        <span class="dob-sub-label" style="font-family:'Cinzel',serif;font-size:7px;letter-spacing:.3em;color:var(--gold-dim);text-transform:uppercase;display:block;margin-bottom:4px;">Day</span>
        <select class="calc-input" id="c-dob-day" style="cursor:pointer;">
          <option value="">Day</option>
          ${Array.from({length:31},(_,i)=>`<option value="${String(i+1).padStart(2,'0')}">${i+1}</option>`).join('')}
        </select>
      </div>
      <div>
        <span class="dob-sub-label" style="font-family:'Cinzel',serif;font-size:7px;letter-spacing:.3em;color:var(--gold-dim);text-transform:uppercase;display:block;margin-bottom:4px;">Month</span>
        <select class="calc-input" id="c-dob-month" style="cursor:pointer;">
          <option value="">Month</option>
          ${['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=>`<option value="${String(i+1).padStart(2,'0')}">${m}</option>`).join('')}
        </select>
      </div>
      <div>
        <span class="dob-sub-label" style="font-family:'Cinzel',serif;font-size:7px;letter-spacing:.3em;color:var(--gold-dim);text-transform:uppercase;display:block;margin-bottom:4px;">Year</span>
        <select class="calc-input" id="c-dob-year" style="cursor:pointer;">
          <option value="">Year</option>
          ${Array.from({length:100},(_,i)=>`<option value="${curYear-i}">${curYear-i}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
}

function getDOBParts(){
  const dd=document.getElementById('c-dob-day')?.value;
  const mm=document.getElementById('c-dob-month')?.value;
  const yyyy=document.getElementById('c-dob-year')?.value;
  return{dd,mm,yyyy};
}

const calcConfigs={
  loshu:{title:'Lo Shu Grid',sub:'Ancient Chinese 3×3 magic square of destiny',html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('loshu')" aria-label="Calculate Lo Shu Grid">Reveal Grid</button><div class="calc-result" id="c-result"></div>`},
  name:{title:'Name Calculator',sub:'Cheiro numerology — letters as living vibrations',html:()=>`<div class="calc-field"><label class="calc-label">Full Name</label><input class="calc-input" type="text" id="c-name" placeholder="Enter your full name"></div><button type="button" class="calc-btn" onclick="runCalc('name')" aria-label="Calculate name vibration">Calculate Vibration</button><div class="calc-result" id="c-result"></div>`},
  mobile:{title:'Lucky Mobile Number',sub:'Digital frequency alignment with your birth energy',html:()=>`<div class="calc-field"><label class="calc-label">Mobile Number</label><input class="calc-input" type="tel" id="c-mobile" placeholder="10-digit mobile number" maxlength="10" inputmode="numeric" pattern="[0-9]*" oninput="this.value=this.value.replace(/[^0-9]/g,'')" onkeydown="if(!/^[0-9]$/.test(event.key)&&!['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(event.key))event.preventDefault()"><small style="display:block;margin-top:.4rem;font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.2em;color:var(--gold-dim);text-transform:uppercase;">10 digits · Numbers only</small></div><button type="button" class="calc-btn" onclick="runCalc('mobile')" aria-label="Calculate lucky mobile number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  vehicle:{title:'Vehicle Number',sub:'Transit energy of your registration plate',html:()=>`<div class="calc-field"><label class="calc-label">Vehicle Registration</label><input class="calc-input" type="text" id="c-vehicle" placeholder="e.g. MH12AB1234"></div><button type="button" class="calc-btn" onclick="runCalc('vehicle')" aria-label="Calculate vehicle number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  lucky:{title:'Lucky Number',sub:'Personal fortune number derived from your birth date',html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('lucky')" aria-label="Calculate lucky number">Find My Lucky Number</button><div class="calc-result" id="c-result"></div>`},
  house:{title:'Lucky House Number',sub:'Sacred space numerology — the soul of your home',html:()=>`<div class="calc-field"><label class="calc-label">House / Flat Number</label><input class="calc-input" type="text" id="c-house" placeholder="e.g. 42 or B-14"></div><button type="button" class="calc-btn" onclick="runCalc('house')" aria-label="Calculate lucky house number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  bank:{title:'Lucky Bank Account',sub:'Align your finances with prosperity vibrations',html:()=>`<div class="calc-field"><label class="calc-label">Bank Account Number</label><input class="calc-input" type="tel" id="c-bank" placeholder="14-digit account number" maxlength="14" inputmode="numeric" pattern="[0-9]*" oninput="this.value=this.value.replace(/[^0-9]/g,'')" onkeydown="if(!/^[0-9]$/.test(event.key)&&!['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(event.key))event.preventDefault()"><small style="display:block;margin-top:.4rem;font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.2em;color:var(--gold-dim);text-transform:uppercase;">14 digits · Numbers only</small></div><button type="button" class="calc-btn" onclick="runCalc('bank')" aria-label="Calculate lucky bank account">Calculate</button><div class="calc-result" id="c-result"></div>`},
  colour:{title:'Lucky Colour Finder',sub:'Chromatic destiny encoded in your birth date',html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('colour')" aria-label="Calculate lucky colour">Find My Colour</button><div class="calc-result" id="c-result"></div>`},
  lifepath:{title:'Life Path Number',sub:"The master number of your soul's journey this lifetime",html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('lifepath')" aria-label="Calculate Life Path number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  planet:{title:'Main Planet Number',sub:'Discover the celestial body that governs your frequency',html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('planet')" aria-label="Calculate main planet number">Find My Ruling Planet</button><div class="calc-result" id="c-result"></div>`},
  destiny:{title:'Destiny Number',sub:'Your expression number — who you are destined to become',html:()=>`<div class="calc-field"><label class="calc-label">Full Name (as on birth certificate)</label><input class="calc-input" type="text" id="c-name" placeholder="Enter your full name"></div><button type="button" class="calc-btn" onclick="runCalc('destiny')" aria-label="Calculate Destiny number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  compound:{title:'Compound Destiny Number',sub:'Dual vibration carrying karmic echoes from past lives',html:()=>`<div class="calc-field"><label class="calc-label">Full Name</label><input class="calc-input" type="text" id="c-name" placeholder="Enter your full name"></div><button type="button" class="calc-btn" onclick="runCalc('compound')" aria-label="Calculate compound destiny">Calculate</button><div class="calc-result" id="c-result"></div>`},
  business:{title:'Lucky Business Name',sub:'Enterprise vibration — the energy your brand projects',html:()=>`<div class="calc-field"><label class="calc-label">Business Name</label><input class="calc-input" type="text" id="c-name" placeholder="Enter business name"></div><button type="button" class="calc-btn" onclick="runCalc('business')" aria-label="Calculate lucky business name">Calculate</button><div class="calc-result" id="c-result"></div>`},
};

window.openCalc=function(type){
  const cfg=calcConfigs[type];
  if(!cfg)return;
  document.getElementById('calc-title').textContent=cfg.title;
  document.getElementById('calc-subtitle').textContent=cfg.sub;
  document.getElementById('calc-body').innerHTML=cfg.html();
  document.getElementById('calc-overlay').classList.add('open');
  document.body.style.overflow='hidden';
};

window.runCalc=function(type){
  const res=document.getElementById('c-result');
  if(!res)return;
  let num,label,desc;

  if(type==='loshu'){
    const dob=getDOBParts();
    if(!dob.dd||!dob.mm||!dob.yyyy){alert('Please select full date of birth');return;}
    const grid=buildLoShu(dob.dd,dob.mm,dob.yyyy);
    const cellMeaning={1:'Mind',2:'Intuition',3:'Action',4:'Will',5:'Balance',6:'Logic',7:'Sacrifice',8:'Speech',9:'Memory'};
    const missingMeaning={1:'Challenges with confidence & self-expression',2:'Difficulty with intuition & sensitivity',3:'Lack of drive or difficulty taking action',4:'Weak willpower or discipline',5:'Emotional instability; seek inner balance',6:'Struggles with logic & practical thinking',7:'Difficulty with detachment or sacrifice',8:'Communication & expression challenges',9:'Memory issues or lack of humanitarian drive'};
    let h='<div style="margin-bottom:.8rem;font-family:Cinzel,serif;font-size:9px;letter-spacing:.35em;color:var(--gold-dim);text-align:center;text-transform:uppercase;">Your Lo Shu Grid</div><div class="loshu-grid">';
    for(const row of LOSHU_LAYOUT){
      for(const n of row){
        const cnt=grid[String(n)]||0;
        const mis=cnt===0;
        const display=cnt>0?String(n).repeat(Math.min(cnt,3)):String(n);
        h+=`<div class="loshu-cell${mis?' missing':''}" title="${cellMeaning[n]}"><div style="font-size:${cnt>1?'1rem':'1.1rem'}">${display}</div><span class="ln">${cellMeaning[n]}</span></div>`;
      }
    }
    h+='</div>';
    const mis=[];
    for(let i=1;i<=9;i++){if(!grid[String(i)])mis.push(i);}
    let summaryHtml='';
    if(mis.length){
      summaryHtml='<div style="margin-top:.8rem;font-size:.78rem;color:var(--text-muted);text-align:left;line-height:1.9;">';
      summaryHtml+='<div style="color:var(--gold);font-family:Cinzel,serif;font-size:8px;letter-spacing:.25em;margin-bottom:.5rem;">⚠ MISSING NUMBERS — KARMIC GAPS</div>';
      mis.forEach(m=>{summaryHtml+=`<div>✦ <span style="color:var(--gold-pale)">Number ${m}</span> — ${missingMeaning[m]}</div>`;});
      summaryHtml+='</div>';
    } else {
      summaryHtml='<div style="margin-top:.8rem;font-size:.78rem;color:var(--gold-pale);text-align:center;">✦ All numbers present — a complete and powerfully balanced grid.</div>';
    }
    h+=summaryHtml;
    res.innerHTML=h;
    res.classList.add('show');
    appendGuideMe(res,'loshu');
    return;
  }
  if(type==='colour'){
    const dob=getDOBParts();
    if(!dob.dd||!dob.mm||!dob.yyyy){alert('Please select full date of birth');return;}
    num=dobToLP(dob.dd,dob.mm,dob.yyyy);
    const c=LUCKY_COLOURS[num]||LUCKY_COLOURS[1];
    res.innerHTML=`<div class="colour-swatch" style="background:${colourHex[num]||'#C9A84C'};box-shadow:0 0 40px ${colourHex[num]||'#C9A84C'}55;"></div><div class="calc-result-num">${num}</div><div class="calc-result-label">Your Lucky Colour</div><div class="calc-result-desc" style="font-size:1rem;color:var(--gold-pale);margin-bottom:.6rem;">${c.split('—')[0].trim()}</div><div class="calc-result-desc">${c} — wearing these tones aligns your auric field with your personal vibration, amplifying your magnetism.</div>`;
    res.classList.add('show');appendGuideMe(res,'colour');return;
  }
  if(type==='planet'){
    const dob=getDOBParts();
    if(!dob.dd||!dob.mm||!dob.yyyy){alert('Please select full date of birth');return;}
    num=dobToLP(dob.dd,dob.mm,dob.yyyy);
    res.innerHTML=`<div class="calc-result-num">${num}</div><div class="calc-result-label">Your Ruling Planet</div><div class="calc-result-desc" style="font-size:1rem;color:var(--gold-pale);margin-bottom:.7rem;">${PLANET_RULERS[num]||PLANET_RULERS[1]}</div><div class="calc-result-desc">${NUM_MEANINGS[num]||''}</div>`;
    res.classList.add('show');appendGuideMe(res,'planet');return;
  }
  if(type==='compound'){
    const n=(document.getElementById('c-name')||{}).value;
    if(!n||!n.trim()){alert('Please enter a name');return;}
    const raw=nameToNum(n.trim());const single=reduceNum(raw);
    res.innerHTML=`<div class="calc-result-num">${raw} / ${single}</div><div class="calc-result-label">Compound → Single Destiny</div><div class="calc-result-desc">Raw compound number <strong style="color:var(--gold)">${raw}</strong> carries karmic echoes that reduce to <strong style="color:var(--gold)">${single}</strong>. ${NUM_MEANINGS[single]||''}</div>`;
    res.classList.add('show');appendGuideMe(res,'compound');return;
  }
  if(type==='house'){
    const h=(document.getElementById('c-house')||{}).value||'';
    if(!h.trim()){alert('Please enter house number');return;}
    num=reduceNum([...h.replace(/[^0-9]/g,'')].reduce((a,d)=>a+parseInt(d),0));
    label='House Energy Number';
    desc=`Your home resonates with the energy of ${num}: ${HOUSE_VIBES[num]||'Balanced energy'}. ${NUM_MEANINGS[num]||''}`;
  } else if(type==='bank'){
    const b=(document.getElementById('c-bank')||{}).value||'';
    const bDigits=b.replace(/[^0-9]/g,'');
    if(!bDigits){alert('Please enter your bank account number');return;}
    if(bDigits.length!==14){alert('Bank account number must be exactly 14 digits');return;}
    num=reduceNum([...bDigits].reduce((a,d)=>a+parseInt(d),0));
    label='Financial Vibration';
    desc=`Number ${num} resonates with: ${BANK_VIBES[num]||'Steady financial energy'}. ${NUM_MEANINGS[num]||''}`;
  } else if(type==='mobile'){
    const m=(document.getElementById('c-mobile')||{}).value||'';
    const mDigits=m.replace(/[^0-9]/g,'');
    if(!mDigits){alert('Please enter your mobile number');return;}
    if(mDigits.length!==10){alert('Mobile number must be exactly 10 digits');return;}
    num=reduceNum([...mDigits].reduce((a,d)=>a+parseInt(d),0));
    label='Mobile Vibration Number';
    desc=`Your mobile resonates at the frequency of ${num}. ${NUM_MEANINGS[num]||''}`;
  } else if(type==='vehicle'){
    const v=(document.getElementById('c-vehicle')||{}).value||'';
    if(!v.trim()){alert('Please enter vehicle number');return;}
    num=reduceNum([...v.replace(/[^0-9]/g,'')].reduce((a,d)=>a+parseInt(d),0));
    label='Vehicle Transit Energy';
    desc=`Your vehicle carries the cosmic energy of number ${num}. ${NUM_MEANINGS[num]||''}`;
  } else if(type==='name'||type==='business'||type==='destiny'){
    const n=(document.getElementById('c-name')||{}).value||'';
    if(!n.trim()){alert('Please enter a name');return;}
    num=reduceNum(nameToNum(n.trim()));
    label=type==='business'?'Business Vibration Number':type==='destiny'?'Destiny Number':'Name Vibration Number';
    desc=NUM_MEANINGS[num]||'';
  } else {
    const dob=getDOBParts();
    if(!dob.dd||!dob.mm||!dob.yyyy){alert('Please select full date of birth');return;}
    num=dobToLP(dob.dd,dob.mm,dob.yyyy);
    label=type==='lucky'?'Your Lucky Number':'Life Path Number';
    desc=NUM_MEANINGS[num]||'';
  }
  res.innerHTML=`<div class="calc-result-num">${num}</div><div class="calc-result-label">${label}</div><div class="calc-result-desc">${desc}</div>`;
  res.classList.add('show');
  appendGuideMe(res,type);
};


function appendGuideMe(resEl, calcType){
  // Remove any existing upsell
  const existing=resEl.parentElement.querySelector('.calc-upsell');
  if(existing)existing.remove();

  let btnLabel='Book Numerology Analysis';
  let btnAction="openCalcServiceBooking('Numerology Analysis','1299')";
  let upsellMsg='Your number holds a story — let us help you rewrite it into one of clarity, purpose, and flow.';

  if(calcType==='name'){
    upsellMsg='Want to correct your name vibration for better alignment? Book a Name Correction session.';
    btnLabel='Book Name Correction';
    btnAction="openCalcServiceBooking('Name Correction','1899')";
  } else if(calcType==='mobile'){
    upsellMsg='Want to correct your mobile number for better frequency alignment? Book a Mobile No. Correction session.';
    btnLabel='Guide Me';
    btnAction="openMobileCorrectionBooking()";
  }

  const div=document.createElement('div');
  div.className='calc-upsell';
  div.innerHTML=`
    <p class="calc-upsell-msg">${upsellMsg}</p>
    <button class="guide-me-btn" onclick="${btnAction}">
      ${btnLabel}
      <svg viewBox="0 0 24 24" stroke-width="1.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
    </button>
  `;
  resEl.after(div);
}

window.openGuideMeBooking=function(){
  // Close calc modal
  document.getElementById('calc-overlay').classList.remove('open');
  // Open consult modal
  document.getElementById('consult-overlay').classList.add('open');
  document.body.style.overflow='hidden';
  // Pre-fill or show price note in consult modal
  const head=document.querySelector('#consult-overlay .modal-head p');
  if(head&&!head.querySelector('.price-note')){
    const note=document.createElement('span');
    note.className='price-note';
    note.style.cssText='display:block;margin-top:.4rem;font-family:Cinzel,serif;font-size:9px;letter-spacing:.25em;color:var(--gold);';
    note.textContent='Session: ₹1,299 · Numerology Deep Dive';
    head.appendChild(note);
  }
};

/* Direct Mobile Number Correction booking from calculator Guide Me button */
window.openMobileCorrectionBooking=function(){
  document.getElementById('calc-overlay').classList.remove('open');
  _selectedService='Mobile No. Correction';
  _selectedPrice=1699;
  document.getElementById('consult-overlay').classList.add('open');
  document.body.style.overflow='hidden';
  const banner=document.getElementById('cf-service-banner');
  banner.textContent='Mobile No. Correction  ·  \u20b91,699';
  banner.style.display='block';
  const btn=document.getElementById('cf-submit');
  btn.textContent='Proceed to Pay \u20b91,699';
  document.getElementById('cf-single-details').style.display='block';
  document.getElementById('cf-compat-details').style.display='none';
};

/* Direct service booking from calculator Guide Me buttons */
window.openCalcServiceBooking=function(serviceName, priceStr){
  document.getElementById('calc-overlay').classList.remove('open');
  // Set service context before opening modal
  _selectedService=serviceName;
  _selectedPrice=parseInt(priceStr)||0;
  // Find the matching card and open via openConsult
  const card=document.querySelector(`[data-service="${serviceName}"]`);
  openConsult(null, card||null);
};

document.getElementById('calc-close').addEventListener('click',()=>{
  document.getElementById('calc-overlay').classList.remove('open');
  document.body.style.overflow='';
  // Remove any lingering upsell
  document.querySelectorAll('.calc-upsell').forEach(el=>el.remove());
});
document.getElementById('calc-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('calc-overlay')){document.getElementById('calc-overlay').classList.remove('open');document.body.style.overflow='';}});
/* Calculator cards are real <a href> links now, so they work without JS and
   are crawlable. When JS is available we intercept and open the modal instead. */
document.querySelectorAll('.num-card[data-calc]').forEach(card=>{
  card.addEventListener('click',e=>{
    e.preventDefault();
    window.openCalc(card.dataset.calc);
  });
});
document.querySelectorAll('a.num-card-arrow[data-calc]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    window.openCalc(a.dataset.calc);
  });
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.getElementById('calc-overlay').classList.remove('open');
    document.getElementById('consult-overlay').classList.remove('open');
    document.body.style.overflow='';
  }
});

})();
