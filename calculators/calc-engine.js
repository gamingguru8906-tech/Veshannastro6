/* ─────────────────────────────────────────────────────────────
   Veshannastro — calculator engine for the standalone pages.
   The core below is lifted verbatim from index.html so a page returns
   exactly the same result as the on-site modal. This prelude supplies the
   two globals the modal got from its surrounding scope.
   ───────────────────────────────────────────────────────────── */

/* Used by buildCalcDOBRow() to populate the year dropdown. */
const curYear = new Date().getFullYear();

/* On index.html this opens a booking modal. Standalone pages have no modal,
   so it renders a real anchor instead — crawlable, and it works without JS
   having to wire anything up. */
function appendGuideMe(resEl, calcType){
  var existing = resEl.parentElement.querySelector('.calc-upsell');
  if(existing) existing.remove();

  var msg   = 'Your number holds a story. A full reading places it in the context of the rest of your chart.';
  var label = 'Book a numerology session';
  var href  = '/numerology-booking.html';

  if(calcType === 'name'){
    msg   = 'Considering a name correction? A session covers whether it is worth doing and what spelling actually helps.';
    label = 'Ask about name correction';
  } else if(calcType === 'mobile'){
    msg   = 'Want your mobile number checked against your full chart before you change it?';
    label = 'Get a mobile number analysis';
    href  = '/report-booking.html?service=mobile-numerology';
  } else if(calcType === 'business'){
    msg   = 'Testing a business name? A written report checks it against your own chart, not just its total.';
    label = 'Get a business name report';
    href  = '/report-booking.html?service=business-name';
  }

  var div = document.createElement('div');
  div.className = 'calc-upsell';
  var p = document.createElement('p');
  p.className = 'calc-upsell-msg';
  p.textContent = msg;
  var a = document.createElement('a');
  a.className = 'guide-me-btn';
  a.href = href;
  a.textContent = label;
  div.appendChild(p);
  div.appendChild(a);
  resEl.after(div);
}

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
};;

/* ── Standalone page bootstrap ─────────────────────────────────────────
   Mounts one calculator into #calc-mount based on its data-calc attribute,
   and announces results for screen readers and AI agents.               */
(function(){
  function mount(){
    var host = document.getElementById('calc-mount');
    if(!host) return;
    var type = host.getAttribute('data-calc');
    var cfg  = (typeof calcConfigs !== 'undefined') && calcConfigs[type];
    if(!cfg){ host.innerHTML = '<p>Calculator unavailable. Please <a href="/contact.html">contact us</a>.</p>'; return; }
    host.innerHTML = cfg.html();

    host.querySelectorAll('input').forEach(function(i){
      i.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){ e.preventDefault(); window.runCalc(type); }
      });
    });

    var res = document.getElementById('c-result');
    if(res && window.MutationObserver){
      new MutationObserver(function(){
        var live = document.getElementById('calc-status');
        if(live && res.textContent.trim()){
          live.textContent = 'Result ready: ' + res.textContent.replace(/\s+/g,' ').trim().slice(0,240);
        }
      }).observe(res, {childList:true, subtree:true});
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
