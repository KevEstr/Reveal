(() => {
  'use strict';
  const qs = s => document.querySelector(s);
  const qsa = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const cv = qs('#stage'), ctx = cv.getContext('2d');
  const flash = qs('#flash'), scrim = qs('#scrim');
  const ring = qs('#charge-ring'), ringFill = qs('#ring-fill');
  const soundHint = qs('#sound-hint');
  const guide = qs('#guide'), bubble = qs('#bubble');
  const wake = qs('#wake');
  const cluesSection = qs('#clues');
  const holdScene = qs('#hold-scene'), reveal = qs('#reveal');
  const confirmScene = qs('#confirm'), ticket = qs('#ticket');
  const chargeMsg = qs('#charge-msg'), cta = qs('#cta');
  const DEST_DISPLAY = 'COVE\u00d1AS';

  let W = 0, H = 0, DPR = 1;
  function resize(){ DPR = Math.min(devicePixelRatio||1,2); W = innerWidth; H = innerHeight; cv.width = W*DPR; cv.height = H*DPR; cv.style.width = W+'px'; cv.style.height = H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }
  addEventListener('resize', resize); resize();

  let dawn = 0, seaLevel = 0, tNow = 0, sceneSea = false, lit = 0;
  let charge = 0, holding = false, holdActive = false;

  // Stars
  let stars = [];
  function seedStars(){ stars = []; const n = Math.round((W*H)/9000); for(let i=0;i<n;i++) stars.push({x:Math.random()*W,y:Math.random()*H*0.78,r:Math.random()*1.3+.2,tw:Math.random()*6.28,sp:Math.random()*1.5+.4}); }
  seedStars(); addEventListener('resize', seedStars);
  // Sparks
  const sparks = [];
  function emitSparks(cx,cy,n,pow,spr){ if(spr==null)spr=W*0.5; for(let i=0;i<n;i++){const a=Math.random()*6.28,s=Math.random()*pow+.3; sparks.push({x:cx+(Math.random()-.5)*spr,y:cy+(Math.random()-.5)*6,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.4,life:1,decay:Math.random()*.012+.004,r:Math.random()*2+.6});} }
  // Color
  const lerp=(a,b,k)=>a+(b-a)*k;
  const mix=(c1,c2,k)=>[Math.round(lerp(c1[0],c2[0],k)),Math.round(lerp(c1[1],c2[1],k)),Math.round(lerp(c1[2],c2[2],k))];
  const rgb=c=>'rgb('+c[0]+','+c[1]+','+c[2]+')';
  const NT=[5,7,13],NM=[10,15,30],NB=[16,22,44],DT=[38,36,82],DM=[122,84,138],DB=[255,162,112];

  // Render
  function draw(){ tNow+=.016; ctx.clearRect(0,0,W,H); const hY=H*.52; const w=Math.min(dawn,1);
    const top=mix(NT,DT,w),mid=mix(NM,DM,w),bot=mix(NB,DB,w);
    const sky=ctx.createLinearGradient(0,0,0,sceneSea?hY:H); sky.addColorStop(0,rgb(top)); sky.addColorStop(.6,rgb(mid)); sky.addColorStop(1,rgb(bot)); ctx.fillStyle=sky; ctx.fillRect(0,0,W,sceneSea?hY:H);
    const sa=(1-w)*.9+.05; for(const s of stars){const tw=.5+Math.sin(tNow*s.sp+s.tw)*.5; ctx.globalAlpha=sa*tw*(.4+lit*.6); ctx.fillStyle='#dce8ff'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill();} ctx.globalAlpha=1;
    if(sceneSea&&dawn>.02){const sR=Math.min(W,H)*.16,sY=hY-lerp(-sR*1.2,sR*.45,Math.min(1,dawn)); const g=ctx.createRadialGradient(W*.5,sY,0,W*.5,sY,sR*2.4); g.addColorStop(0,'rgba(255,242,214,'+(0.95*dawn)+')'); g.addColorStop(.25,'rgba(255,210,150,'+(.8*dawn)+')'); g.addColorStop(.6,'rgba(255,150,110,'+(.25*dawn)+')'); g.addColorStop(1,'rgba(255,150,110,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(W*.5,sY,sR*2.4,0,7); ctx.fill(); ctx.fillStyle='rgba(255,248,232,'+dawn+')'; ctx.beginPath(); ctx.arc(W*.5,sY,sR*.92,0,7); ctx.fill();}
    if(holdActive||sceneSea) drawLine(hY);
    if(sceneSea&&seaLevel>0) drawSea(hY);
    for(let i=sparks.length-1;i>=0;i--){const p=sparks[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=.012; p.life-=p.decay; if(p.life<=0){sparks.splice(i,1);continue;} ctx.globalAlpha=p.life; ctx.fillStyle='rgba(255,'+Math.round(lerp(210,240,p.life))+','+Math.round(lerp(150,210,p.life))+',1)'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill();} ctx.globalAlpha=1;
    requestAnimationFrame(draw); }
  function drawLine(y){const cx=W*.5,en=Math.max(charge,sceneSea?1:0),half=lerp(W*.16,W*.5,Math.min(1,en*1.4+(sceneSea?1:0))),amp=en*10; ctx.save(); ctx.lineCap='round'; ctx.shadowBlur=lerp(14,40,en); ctx.shadowColor=sceneSea?'rgba(255,210,160,.9)':'rgba(190,220,255,.9)'; ctx.beginPath(); for(let i=0;i<=60;i++){const k=i/60,x=(cx-half)+(half*2)*k,e=Math.sin(k*Math.PI),py=y+Math.sin(k*8+tNow*3)*amp*e; if(i===0)ctx.moveTo(x,py);else ctx.lineTo(x,py);} ctx.strokeStyle=sceneSea?'rgba(255,225,190,'+Math.max(.15,1-dawn*.7)+')':'rgba('+Math.round(lerp(190,255,en))+','+Math.round(lerp(220,225,en))+',255,'+(0.5+en*0.5)+')'; ctx.lineWidth=lerp(1.4,3.2,en); ctx.stroke(); ctx.restore();}
  function drawSea(y){const a=seaLevel; const g=ctx.createLinearGradient(0,y,0,H); g.addColorStop(0,'rgba('+Math.round(lerp(20,90,dawn))+','+Math.round(lerp(40,140,dawn))+','+Math.round(lerp(70,150,dawn))+','+a+')'); g.addColorStop(1,'rgba('+Math.round(lerp(8,40,dawn))+','+Math.round(lerp(16,70,dawn))+','+Math.round(lerp(34,90,dawn))+','+a+')'); ctx.fillStyle=g; ctx.fillRect(0,y,W,H-y); const sx=W*.5; ctx.strokeStyle='rgba(220,240,255,'+(0.1*a)+')'; ctx.lineWidth=1; for(let l=0;l<5;l++){const ly=y+(H-y)*((l+1)/6); ctx.beginPath(); for(let x=0;x<=W;x+=12){const wy=ly+Math.sin(x*.02+tNow*(1+l*.3)+l)*3; if(x===0)ctx.moveTo(x,wy);else ctx.lineTo(x,wy);} ctx.stroke();}}
  requestAnimationFrame(draw);

  // Audio
  let AC=null,master=null,oceanGain=null,droneGain=null;
  function initAudio(){if(AC)return; try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return;} master=AC.createGain();master.gain.value=0;master.connect(AC.destination); const bs=2*AC.sampleRate,nb=AC.createBuffer(1,bs,AC.sampleRate),d=nb.getChannelData(0); let b0=0,b1=0,b2=0; for(let i=0;i<bs;i++){const w=Math.random()*2-1;b0=.99765*b0+w*.099046;b1=.963*b1+w*.296516;b2=.57*b2+w*1.052691;d[i]=(b0+b1+b2+w*.1848)*.18;} const ns=AC.createBufferSource();ns.buffer=nb;ns.loop=true; const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=480; oceanGain=AC.createGain();oceanGain.gain.value=0; const sw=AC.createOscillator();sw.frequency.value=.12;const sa=AC.createGain();sa.gain.value=360;sw.connect(sa);sa.connect(lp.frequency); ns.connect(lp);lp.connect(oceanGain);oceanGain.connect(master); droneGain=AC.createGain();droneGain.gain.value=0; const d1=AC.createOscillator();d1.type='sine';d1.frequency.value=55;const d2=AC.createOscillator();d2.type='sine';d2.frequency.value=82.5;const dF=AC.createBiquadFilter();dF.type='lowpass';dF.frequency.value=400;d1.connect(dF);d2.connect(dF);dF.connect(droneGain);droneGain.connect(master); ns.start();sw.start();d1.start();d2.start(); master.gain.linearRampToValueAtTime(.9,AC.currentTime+1.4);droneGain.gain.linearRampToValueAtTime(.14,AC.currentTime+2.4);}
  function audioUpdate(){if(!AC)return;const t=AC.currentTime;if(oceanGain)oceanGain.gain.setTargetAtTime(.03+charge*.35+(sceneSea?.45:0),t,.3);if(droneGain)droneGain.gain.setTargetAtTime(sceneSea?.04:.1+charge*.16,t,.4);}
  function chime(sc){if(!AC)return;const now=AC.currentTime;(sc||[523.25,659.25,783.99,1046.5]).forEach((f,i)=>{const o=AC.createOscillator();o.type='sine';o.frequency.value=f;const g=AC.createGain();g.gain.value=0;o.connect(g);g.connect(master);const at=now+i*.14;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.2,at+.04);g.gain.exponentialRampToValueAtTime(.0001,at+2.4);o.start(at);o.stop(at+2.6);});}
  function tick(f){if(!AC)return;const o=AC.createOscillator();o.type='triangle';o.frequency.value=f||880;const g=AC.createGain();g.gain.value=0;o.connect(g);g.connect(master);const now=AC.currentTime;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.08,now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+.18);o.start(now);o.stop(now+.2);}
  function blip(){tick(420+Math.random()*120);}

  // Guide + bubble
  function showGuide(pos){guide.className='guide show float '+(pos||'at-top');}
  function guideHappy(v){guide.classList.toggle('happy',!!v);}
  function say(html,tap){bubble.classList.remove('show');setTimeout(()=>{bubble.innerHTML=html+(tap?'<span class="tap-cue">toca para seguir</span>':'');bubble.classList.add('show');blip();},220);}
  function hideBubble(){bubble.classList.remove('show');}
  let canTap=false,onTap=null;
  function setTap(fn){onTap=fn;canTap=!!fn;}

  // --- INTRO: dialogo con la estrella ---
  function intro1(){scrim.classList.add('show');showGuide('at-top');guideHappy(true);say('Hola... <span class="accent">te estaba esperando.</span>',true);setTap(intro2);}
  function intro2(){say('Soy una chispa de una idea<br>que alguien tuvo <span class="accent">pensando en ti.</span>',true);emitSparks(W*.5,H*.28,20,4,100);setTap(intro3);}
  function intro3(){say('Esa persona guarda un secreto...<br>y me mando a entregartelo.',true);setTap(intro4);}
  function intro4(){say('Te voy a dar <span class="accent">4 pistas</span>.<br>Intenta adivinar a donde te lleva.',true);setTap(startClues);}

  // --- PISTAS: cartas que se voltean, una a una ---
  const CLUES = [
    {img:'images/1.png', hint:'donde el tiempo se detiene'},
    {img:'images/2.png', hint:'donde todo brilla sin filtro'},
    {img:'images/3.png', hint:'donde se respira diferente'},
    {img:'images/4.png', hint:'donde encuentras paz'}
  ];
  let clueIdx = 0;
  const card = qs('#clue-card'), clueImg = qs('#clue-img'), clueHint = qs('#clue-hint');
  const clueDots = qs('#clue-dots'), clueStep = qs('#clues-step'), clueTap = qs('#clue-tap');

  function startClues(){
    hideBubble(); guide.className = 'guide show float peek';
    wake.classList.remove('is-active');
    cluesSection.classList.add('is-active');
    clueIdx = 0;
    // build dots
    clueDots.innerHTML = '';
    for(let i=0;i<CLUES.length;i++){const d=document.createElement('i');clueDots.appendChild(d);}
    setTimeout(()=>{clueStep.classList.add('in');clueDots.classList.add('in');},300);
    loadClue();
    setTimeout(()=>{card.classList.add('in');clueTap.classList.add('in');},600);
  }
  function loadClue(){
    card.classList.remove('flipped');
    clueImg.style.opacity = '1';
    clueImg.src = CLUES[clueIdx].img;
    clueHint.textContent = CLUES[clueIdx].hint;
    clueStep.textContent = 'pista '+(clueIdx+1)+' de '+CLUES.length;
    qsa('#clue-dots i').forEach((d,i)=>d.classList.toggle('on',i<=clueIdx));
  }
  // tap en la carta = flip
  card.addEventListener('pointerdown', e => {
    e.stopPropagation();
    if(!card.classList.contains('flipped')){
      card.classList.add('flipped');
      tick(600+clueIdx*80);
      clueTap.textContent = 'toca para siguiente pista';
    } else {
      // ya esta volteada: avanzar
      clueIdx++;
      if(clueIdx >= CLUES.length){
        // todas las pistas vistas -> sostener
        clueTap.classList.add('gone');
        setTimeout(goHold, 600);
      } else {
        // carta sale hacia la izquierda, luego entra la nueva por la derecha
        card.classList.remove('in');
        card.classList.add('exit');
        setTimeout(()=>{
          card.classList.remove('exit');
          loadClue();
          card.style.animation='cardSwap .55s var(--ease)';
          card.classList.add('in');
          clueTap.textContent='toca la carta';
          tick(500);
        },420);
        setTimeout(()=>{card.style.animation='';},1000);
      }
    }
  });

  // --- HOLD ---
  const HOLD_MSGS=[{at:0,txt:''},{at:.18,txt:'Respira hondo...'},{at:.42,txt:'Quedate quieto. <span class="accent">Sigue sosteniendo.</span>'},{at:.66,txt:'Lo estas logrando...'},{at:.86,txt:'<span class="accent">No me sueltes. Ya casi.</span>'}];
  let lastHM=-1;
  function goHold(){
    cluesSection.classList.remove('is-active');
    hideBubble(); guide.classList.remove('show');
    setTimeout(()=>{
      holdScene.classList.add('is-active');
      ring.classList.add('show');
      holdActive = true;
      say('Ahora sostenme.<br><span class="accent">No me sueltes.</span>');
      setTimeout(hideBubble, 2000);
    },1000);
  }
  const CIRC=339.292;
  function logicLoop(){
    if(holdActive){
      if(holding){charge+=.0017;if(charge>=1){charge=1;triggerReveal();}}
      else{charge-=.005;if(charge<0)charge=0;}
      ringFill.style.strokeDashoffset=CIRC*(1-charge);
      let mi=0; for(let i=0;i<HOLD_MSGS.length;i++){if(charge>=HOLD_MSGS[i].at)mi=i;}
      if(mi!==lastHM){lastHM=mi;if(HOLD_MSGS[mi].txt){chargeMsg.classList.remove('show');setTimeout(()=>{chargeMsg.innerHTML=HOLD_MSGS[mi].txt;chargeMsg.classList.add('show');tick(560+mi*70);},120);}else chargeMsg.classList.remove('show');}
      audioUpdate();
    }
    requestAnimationFrame(logicLoop);
  }
  requestAnimationFrame(logicLoop);

  // --- REVEAL ---
  function triggerReveal(){
    holdActive=false;holding=false;document.body.classList.remove('holding');
    ring.classList.remove('show');holdScene.classList.remove('is-active');chargeMsg.classList.remove('show');scrim.classList.remove('show');
    chime([392,523.25,659.25,783.99]);flash.classList.add('burst');if(navigator.vibrate)navigator.vibrate([18,40,120]);emitSparks(W*.5,H*.52,240,9);
    setTimeout(()=>flash.classList.remove('burst'),1100);
    sceneSea=true; const t0=performance.now(),dur=5200;
    (function rise(now){const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);dawn=e;seaLevel=Math.max(0,(e-.15)/.85);audioUpdate();if(k<1)requestAnimationFrame(rise);else startName();})(t0);
    let n=0;const iv=setInterval(()=>{emitSparks(W*.5,H*.52,26,5);if(++n>10)clearInterval(iv);},180);
  }
  const titleEl=qs('#reveal-title');
  function buildTitle(){titleEl.innerHTML='';DEST_DISPLAY.split('').forEach(c=>{const s=document.createElement('span');s.className='ch';s.textContent=c;titleEl.appendChild(s);});}
  function startName(){
    reveal.classList.add('is-active');buildTitle();
    const pre=qs('#reveal-pre'),country=qs('#reveal-country'),tag=qs('#reveal-tag');
    setTimeout(()=>pre.classList.add('in'),600);
    const chars=qsa('#reveal-title .ch');
    chars.forEach((ch,i)=>setTimeout(()=>{ch.classList.add('in');tick(523+i*70);},2000+i*320));
    const tEnd=2000+chars.length*320;
    setTimeout(()=>{country.classList.add('in');chime();},tEnd+400);
    setTimeout(()=>{tag.classList.add('in');emitSparks(W*.5,H*.3,80,6);},tEnd+1600);
    setTimeout(startConfirm,tEnd+5400);
  }

  // --- CONFIRM ---
  const confirmLine=qs('#confirm-line'),confirmTap=qs('#confirm-tap');
  const CONFIRMS=['Cove\u00f1as, Colombia.','Si, es <span class="accent">un viaje</span>.','Tu y yo.','Con fecha. Con todo listo.','Solo faltas tu.'];
  let cfIdx=-1,cfReady=false,cfLocked=false;
  function startConfirm(){reveal.classList.remove('is-active');setTimeout(()=>{confirmScene.classList.add('is-active');cfIdx=-1;cfLocked=false;setTimeout(()=>{cfReady=true;nextConfirm();},700);},1100);}
  function nextConfirm(){if(cfLocked)return;cfIdx++;if(cfIdx>=CONFIRMS.length){cfLocked=true;confirmTap.classList.add('gone');confirmLine.classList.remove('show');setTimeout(goTicket,800);return;}confirmLine.classList.remove('show');setTimeout(()=>{confirmLine.innerHTML=CONFIRMS[cfIdx];confirmLine.classList.add('show');tick(620+cfIdx*70);},cfIdx===0?0:480);if(cfIdx===0)setTimeout(()=>confirmTap.classList.add('show'),1400);}
  function tryConfirmAdvance(){if(confirmScene.classList.contains('is-active')&&cfReady&&!cfLocked){nextConfirm();return true;}return false;}

  // --- TICKET ---
  function goTicket(){confirmScene.classList.remove('is-active');setTimeout(()=>{ticket.classList.add('is-active');qs('#ticket-pre').classList.add('in');setTimeout(()=>{qs('#pass').classList.add('in');chime([523,659,784,1047]);},700);setTimeout(()=>cta.classList.add('in'),1700);setTimeout(()=>{qs('#ticket-after').classList.add('in');},2400);},1100);}
  cta.addEventListener('pointerdown',e=>{e.stopPropagation();if(cta.classList.contains('done'))return;cta.textContent='nos vemos alla \u2726';cta.classList.add('done');qs('#ticket-after').textContent='cuenta los dias conmigo.';emitSparks(W*.5,H*.5,120,7,W);chime([659,784,988,1319]);if(navigator.vibrate)navigator.vibrate(40);});

  // --- INPUT ---
  let started=false;
  function wakeUp(){if(started)return;started=true;initAudio();if(AC&&AC.state==='suspended')AC.resume();soundHint.classList.add('hide');emitSparks(W*.5,H*.5,60,6,40);chime([440,554,659]);if(navigator.vibrate)navigator.vibrate(20);setTimeout(intro1,900);}

  document.addEventListener('pointerdown',e=>{
    if(!started){wakeUp();return;}
    if(holdActive){holding=true;document.body.classList.add('holding');return;}
    if(tryConfirmAdvance())return;
    if(canTap&&onTap){const fn=onTap;setTap(null);fn();}
  });
  document.addEventListener('pointerup',()=>{if(holdActive){holding=false;document.body.classList.remove('holding');}});
  document.addEventListener('pointercancel',()=>{if(holdActive){holding=false;document.body.classList.remove('holding');}});
  addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(holdActive)holding=true;else if(!started)wakeUp();else if(canTap&&onTap){const fn=onTap;setTap(null);fn();}}});
  addEventListener('keyup',e=>{if(e.code==='Space'&&holdActive)holding=false;});
  addEventListener('load',()=>{setTimeout(()=>soundHint.classList.add('show'),800);});
})();
