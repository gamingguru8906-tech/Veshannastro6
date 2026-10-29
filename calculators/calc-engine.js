/* ─────────────────────────────────────────────────────────────
   Veshannastro: calculator engine for the standalone pages.
   The core below is lifted verbatim from index.html so a page returns
   exactly the same result as the on-site modal. This prelude supplies the
   two globals the modal got from its surrounding scope.
   ───────────────────────────────────────────────────────────── */

/* Used by buildCalcDOBRow() to populate the year dropdown. */
const curYear = new Date().getFullYear();

/* After a result: the 2027 Personal Year Report first (the one product the site sells), then a second step that
   matches the calculator: the matching live consultation on WhatsApp for names and phone numbers, otherwise
   "Send my result on WhatsApp" with the result typed in. Real anchors: crawlable, and they work without more script. */
var WA_NUMBER = '917646952745';
var CALC_NAMES = { loshu: 'Lo Shu grid', lifepath: 'Life Path number', lucky: 'lucky number', colour: 'lucky colour',
  planet: 'ruling planet', name: 'name number', destiny: 'Destiny number', compound: 'compound number',
  business: 'business name number', mobile: 'mobile number', house: 'house number', vehicle: 'vehicle number', bank: 'account number' };
var REPORT_2027 = { label: 'See the 2027 report', href: '/2027-numerology-report/#register' };
function waLink(text){ return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text); }
function nextStep(calcType){
  if(['loshu','lifepath','lucky','colour','planet'].indexOf(calcType) !== -1){
    return { msg: 'This is one number. The 2027 Personal Year Report reads it with your Mulank, Lo Shu grid and all twelve months of 2027, with remedies. From ₹499.' };
  }
  if(['name','destiny','compound'].indexOf(calcType) !== -1){
    return { msg: 'The 2027 Personal Year Report reads your numbers together for every month of 2027, with remedies. From ₹499. For your name itself, Name Frequency Alignment is a 20-minute live consultation, ₹974, on WhatsApp.',
      alt: { label: 'Book Name Frequency Alignment', href: waLink('Hi, I would like to book Name Frequency Alignment (20 min, ₹974).') } };
  }
  if(calcType === 'mobile'){
    return { msg: 'The 2027 Personal Year Report reads your own numbers for every month of 2027, with remedies. From ₹499. For this phone number itself, the Mobile Number Energy Audit is a 20-minute live consultation, ₹824, on WhatsApp.',
      alt: { label: 'Book the Mobile Number Audit', href: waLink('Hi, I would like to book the Mobile Number Energy Audit (20 min, ₹824).') } };
  }
  return { msg: 'Whether this number suits you depends on your own birth numbers. The 2027 Personal Year Report reads them for every month of 2027, with remedies. From ₹499.' };
}
function resultSummary(resEl, calcType){
  var num = resEl.querySelector('.calc-result-num'), label = resEl.querySelector('.calc-result-label');
  if(num) return (label ? label.textContent.trim() + ': ' : '') + num.textContent.trim();
  if(calcType === 'loshu'){
    var missing = [];
    resEl.querySelectorAll('.loshu-cell.missing').forEach(function(c){ missing.push(c.textContent.replace(/\D/g,'').slice(0,1)); });
    return missing.length ? 'Lo Shu grid with ' + missing.sort().join(', ') + ' missing' : 'Lo Shu grid with every number present';
  }
  return resEl.textContent.replace(/\s+/g,' ').trim().slice(0,120);
}
function appendGuideMe(resEl, calcType){
  var existing = resEl.parentElement.querySelector('.calc-upsell');
  if(existing) existing.remove();
  var step = nextStep(calcType);
  var div = document.createElement('div');
  div.className = 'calc-upsell';
  var p = document.createElement('p');
  p.className = 'calc-upsell-msg';
  p.textContent = step.msg;
  var a = document.createElement('a');
  a.className = 'guide-me-btn';
  a.href = REPORT_2027.href;
  a.textContent = REPORT_2027.label;
  var send = document.createElement('a');
  send.className = 'guide-me-btn guide-me-secondary';
  send.target = '_blank'; send.rel = 'noopener';
  if(step.alt){ send.href = step.alt.href; send.textContent = step.alt.label; }
  else {
    send.href = waLink('Hi, I used the ' + (CALC_NAMES[calcType] || 'numerology') + ' calculator on your website. My result: ' + resultSummary(resEl, calcType) + '. I would like to know what it means for me.');
    send.textContent = 'Send my result on WhatsApp';
  }
  div.appendChild(p);
  div.appendChild(a);
  div.appendChild(document.createTextNode(' '));
  div.appendChild(send);
  resEl.after(div);
}

/* ═══════════ CALCULATOR ENGINE ═══════════ */
const CHEIRO={A:1,I:1,J:1,Q:1,Y:1,B:2,K:2,R:2,C:3,G:3,L:3,S:3,D:4,M:4,T:4,E:5,H:5,N:5,X:5,U:6,V:6,W:6,O:7,Z:7,F:8,P:8};
function charVal(c){return CHEIRO[c.toUpperCase()]||0;}
function reduceNum(n){while(n>9&&n!==11&&n!==22&&n!==33){let s=0,t=n;while(t>0){s+=t%10;t=Math.floor(t/10);}n=s;}return n;}
function nameToNum(name){return name.split('').reduce((a,c)=>a+charVal(c),0);}
/* Plates and addresses: digits as they stand, letters by their Chaldean value. */
function charsTotal(s){return [...String(s)].reduce((a,c)=>a+(/[0-9]/.test(c)?parseInt(c,10):charVal(c)),0);}
function dobToLP(dd,mm,yyyy){
  let s=0;
  [dd,mm,yyyy].forEach(x=>{let n=parseInt(x,10);while(n>0){s+=n%10;n=Math.floor(n/10);}});
  return reduceNum(s);
}

const NUM_MEANINGS={
  1:"The Leader: independent, ambitious, pioneering. A number of new beginnings and bold self-reliance.",
  2:"The Diplomat: cooperative, sensitive, intuitive. Harmony and deep partnerships define your path.",
  3:"The Creator: expressive, joyful, artistic. Communication and creative self-expression are your greatest gifts.",
  4:"The Builder: disciplined, practical, reliable. Structure and devoted hard work lead to lasting success.",
  5:"The Explorer: freedom-loving, adventurous, versatile. Change and curiosity are the fuel of your journey.",
  6:"The Nurturer: compassionate, responsible, harmonious. Family, love, and heartfelt service are your calling.",
  7:"The Seeker: analytical, introspective, spiritual. Inner wisdom and sacred truth are your greatest treasures.",
  8:"The Achiever: powerful, authoritative, materially blessed. Business acumen and leadership are your strengths.",
  9:"The Humanitarian: compassionate, idealistic, universal. Service to humanity is your highest and truest purpose.",
  11:"Master Number 11: The Intuitive. Heightened spiritual awareness and inspirational leadership beyond the ordinary.",
  22:"Master Number 22: The Master Builder. Rare ability to transform grand visions into tangible, lasting reality.",
  33:"Master Number 33: The Master Teacher. Nurturing all of humanity through boundless wisdom and compassion."
};
const PLANET_RULERS={1:"Sun ☉: vitality, authority and self-expression",2:"Moon ☽: emotion, intuition and cycles",3:"Jupiter ♃: expansion, wisdom and teaching",4:"Rahu ☊: disruption, ambition and the unconventional",5:"Mercury ☿: intellect, speech and commerce",6:"Venus ♀: love, beauty and comfort",7:"Ketu ☋: detachment, spirituality and inner wisdom",8:"Saturn ♄: discipline, delay and endurance",9:"Mars ♂: courage, energy and drive"};
const LUCKY_COLOURS={1:"Gold, orange and deep yellow",2:"White, silver and pale cream",3:"Yellow, saffron and violet",4:"Grey, electric blue and khaki",5:"Green and light grey",6:"Pink, pastel blue and white",7:"Smoky grey, purple and sea green",8:"Dark blue, black and deep brown",9:"Red, coral and crimson"};
const PLANET_NAMES={1:"the Sun",2:"the Moon",3:"Jupiter",4:"Rahu",5:"Mercury",6:"Venus",7:"Ketu",8:"Saturn",9:"Mars"};
/* 11, 22 and 33 keep their own meaning, but their planet, colour and vibration are those of their root (2, 4, 6). */
function rootNum(n){return n>9?reduceRoot(n):n;}
function reduceRoot(n){while(n>9){let s=0,t=n;while(t>0){s+=t%10;t=Math.floor(t/10);}n=s;}return n;}
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
const colourHex={1:'#ff8c00',2:'#c0c0c0',3:'#ffd700',4:'#4a90d9',5:'#3a9d5d',6:'#ff9eb5',7:'#9b59b6',8:'#1a1a2e',9:'#c0392b'};

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
  name:{title:'Name Calculator',sub:'Cheiro numerology: letters as living vibrations',html:()=>`<div class="calc-field"><label class="calc-label">Full Name</label><input class="calc-input" type="text" id="c-name" placeholder="Enter your full name"></div><button type="button" class="calc-btn" onclick="runCalc('name')" aria-label="Calculate name vibration">Calculate Vibration</button><div class="calc-result" id="c-result"></div>`},
  mobile:{title:'Lucky Mobile Number',sub:'Digital frequency alignment with your birth energy',html:()=>`<div class="calc-field"><label class="calc-label">Mobile Number</label><input class="calc-input" type="tel" id="c-mobile" placeholder="10-digit mobile number" maxlength="10" inputmode="numeric" pattern="[0-9]*" oninput="this.value=this.value.replace(/[^0-9]/g,'')" onkeydown="if(!/^[0-9]$/.test(event.key)&&!['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(event.key))event.preventDefault()"><small style="display:block;margin-top:.4rem;font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.2em;color:var(--gold-dim);text-transform:uppercase;">10 digits · Numbers only</small></div><button type="button" class="calc-btn" onclick="runCalc('mobile')" aria-label="Calculate lucky mobile number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  vehicle:{title:'Vehicle Number',sub:'Transit energy of your registration plate',html:()=>`<div class="calc-field"><label class="calc-label">Vehicle Registration</label><input class="calc-input" type="text" id="c-vehicle" placeholder="e.g. MH12AB1234"></div><button type="button" class="calc-btn" onclick="runCalc('vehicle')" aria-label="Calculate vehicle number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  lucky:{title:'Lucky Number',sub:'Personal fortune number derived from your birth date',html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('lucky')" aria-label="Calculate lucky number">Find My Lucky Number</button><div class="calc-result" id="c-result"></div>`},
  house:{title:'Lucky House Number',sub:'Sacred space numerology: the soul of your home',html:()=>`<div class="calc-field"><label class="calc-label">House / Flat Number</label><input class="calc-input" type="text" id="c-house" placeholder="e.g. 42 or B-14"></div><button type="button" class="calc-btn" onclick="runCalc('house')" aria-label="Calculate lucky house number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  bank:{title:'Lucky Bank Account',sub:'Align your finances with prosperity vibrations',html:()=>`<div class="calc-field"><label class="calc-label">Bank Account Number</label><input class="calc-input" type="tel" id="c-bank" placeholder="14-digit account number" maxlength="14" inputmode="numeric" pattern="[0-9]*" oninput="this.value=this.value.replace(/[^0-9]/g,'')" onkeydown="if(!/^[0-9]$/.test(event.key)&&!['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(event.key))event.preventDefault()"><small style="display:block;margin-top:.4rem;font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.2em;color:var(--gold-dim);text-transform:uppercase;">14 digits · Numbers only</small></div><button type="button" class="calc-btn" onclick="runCalc('bank')" aria-label="Calculate lucky bank account">Calculate</button><div class="calc-result" id="c-result"></div>`},
  colour:{title:'Lucky Colour Finder',sub:'Chromatic destiny encoded in your birth date',html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('colour')" aria-label="Calculate lucky colour">Find My Colour</button><div class="calc-result" id="c-result"></div>`},
  lifepath:{title:'Life Path Number',sub:"The master number of your soul's journey this lifetime",html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('lifepath')" aria-label="Calculate Life Path number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  planet:{title:'Main Planet Number',sub:'Discover the celestial body that governs your frequency',html:()=>`<div class="calc-field"><label class="calc-label">Date of Birth</label>${buildCalcDOBRow()}</div><button type="button" class="calc-btn" onclick="runCalc('planet')" aria-label="Calculate main planet number">Find My Ruling Planet</button><div class="calc-result" id="c-result"></div>`},
  destiny:{title:'Destiny Number',sub:'Your expression number: who you are destined to become',html:()=>`<div class="calc-field"><label class="calc-label">Full Name (as on birth certificate)</label><input class="calc-input" type="text" id="c-name" placeholder="Enter your full name"></div><button type="button" class="calc-btn" onclick="runCalc('destiny')" aria-label="Calculate Destiny number">Calculate</button><div class="calc-result" id="c-result"></div>`},
  compound:{title:'Compound Destiny Number',sub:'Dual vibration carrying karmic echoes from past lives',html:()=>`<div class="calc-field"><label class="calc-label">Full Name</label><input class="calc-input" type="text" id="c-name" placeholder="Enter your full name"></div><button type="button" class="calc-btn" onclick="runCalc('compound')" aria-label="Calculate compound destiny">Calculate</button><div class="calc-result" id="c-result"></div>`},
  business:{title:'Lucky Business Name',sub:'Enterprise vibration: the energy your brand projects',html:()=>`<div class="calc-field"><label class="calc-label">Business Name</label><input class="calc-input" type="text" id="c-name" placeholder="Enter business name"></div><button type="button" class="calc-btn" onclick="runCalc('business')" aria-label="Calculate lucky business name">Calculate</button><div class="calc-result" id="c-result"></div>`},
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
      summaryHtml+='<div style="color:var(--gold);font-family:Cinzel,serif;font-size:8px;letter-spacing:.25em;margin-bottom:.5rem;">⚠ MISSING NUMBERS: KARMIC GAPS</div>';
      mis.forEach(m=>{summaryHtml+=`<div>✦ <span style="color:var(--gold-pale)">Number ${m}</span>: ${missingMeaning[m]}</div>`;});
      summaryHtml+='</div>';
    } else {
      summaryHtml='<div style="margin-top:.8rem;font-size:.78rem;color:var(--gold-pale);text-align:center;">✦ All numbers present: a complete and powerfully balanced grid.</div>';
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
    const r=rootNum(num), c=LUCKY_COLOURS[r];
    res.innerHTML=`<div class="colour-swatch" style="background:${colourHex[r]};box-shadow:0 0 40px ${colourHex[r]}55;"></div><div class="calc-result-num">${num}</div><div class="calc-result-label">Your Lucky Colour</div><div class="calc-result-desc" style="font-size:1rem;color:var(--gold-pale);margin-bottom:.6rem;">${c}</div><div class="calc-result-desc">The colours of ${PLANET_NAMES[r]}, the planet of your birth number ${num}.</div>`;
    res.classList.add('show');appendGuideMe(res,'colour');return;
  }
  if(type==='planet'){
    const dob=getDOBParts();
    if(!dob.dd||!dob.mm||!dob.yyyy){alert('Please select full date of birth');return;}
    num=dobToLP(dob.dd,dob.mm,dob.yyyy);
    res.innerHTML=`<div class="calc-result-num">${num}</div><div class="calc-result-label">Your Ruling Planet</div><div class="calc-result-desc" style="font-size:1rem;color:var(--gold-pale);margin-bottom:.7rem;">${PLANET_RULERS[rootNum(num)]}</div><div class="calc-result-desc">${NUM_MEANINGS[num]||''}</div>`;
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
    num=reduceNum(charsTotal(h));
    label='House Energy Number';
    desc=`Your home carries the energy of ${num}: ${HOUSE_VIBES[rootNum(num)]}. ${NUM_MEANINGS[num]||''}`;
  } else if(type==='bank'){
    const b=(document.getElementById('c-bank')||{}).value||'';
    const bDigits=b.replace(/[^0-9]/g,'');
    if(!bDigits){alert('Please enter your bank account number');return;}
    if(bDigits.length!==14){alert('Bank account number must be exactly 14 digits');return;}
    num=reduceNum([...bDigits].reduce((a,d)=>a+parseInt(d),0));
    label='Financial Vibration';
    desc=`Number ${num} tends to support: ${BANK_VIBES[rootNum(num)]}. ${NUM_MEANINGS[num]||''}`;
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
    num=reduceNum(charsTotal(v));
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
