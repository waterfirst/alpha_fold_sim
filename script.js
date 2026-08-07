const $ = (selector) => document.querySelector(selector);

const COLORS = {
  hydrophobic: '#e5a93f', polar: '#4ec6ca', positive: '#ef725e',
  negative: '#5288d8', special: '#9a72c7'
};

const RESIDUES = {
  A:['Alanine','hydrophobic'], C:['Cysteine','special'], D:['Aspartate','negative'],
  E:['Glutamate','negative'], F:['Phenylalanine','hydrophobic'], G:['Glycine','special'],
  H:['Histidine','positive'], I:['Isoleucine','hydrophobic'], K:['Lysine','positive'],
  L:['Leucine','hydrophobic'], M:['Methionine','hydrophobic'], N:['Asparagine','polar'],
  P:['Proline','special'], Q:['Glutamine','polar'], R:['Arginine','positive'],
  S:['Serine','polar'], T:['Threonine','polar'], V:['Valine','hydrophobic'],
  W:['Tryptophan','hydrophobic'], Y:['Tyrosine','hydrophobic']
};

const PRESETS = {
  core: {
    sequence:'KLVFFAEGHDVIVLKKWFGAFM',
    caption:'소수성 잔기가 내부로 모이고 극성·전하 잔기가 외곽에 남는지 관찰하세요.'
  },
  helix: {
    sequence:'EELKKALEELEKKALEELEKKALEEL',
    caption:'반복되는 소수성·전하 패턴이 만드는 경쟁적 접촉을 관찰하세요.'
  },
  disulfide: {
    sequence:'CPPCGSSCCGTTCPNCQGAC',
    caption:'멀리 떨어진 시스테인이 만나 강한 비결합 접촉을 형성하는지 관찰하세요.'
  },
  charged: {
    sequence:'EKEKEKKDEDEKRRDDEEKKDR',
    caption:'반대 전하는 가까워지고 같은 전하는 밀어내는지 contact map에서 확인하세요.'
  },
  mixed: {
    sequence:'MKTAYIAKQRQISFVKSHFSRQDILDLWIYHTQGYFP',
    caption:'여러 상호작용이 경쟁할 때 서로 다른 초기구조가 어떤 저에너지 상태를 찾는지 비교하세요.'
  }
};

const ui = {
  preset:$('#preset'), sequence:$('#sequence'), apply:$('#apply-sequence'),
  temperature:$('#temperature'), temperatureValue:$('#temperature-value'),
  solvent:$('#solvent'), speed:$('#speed'), speedValue:$('#speed-value'),
  run:$('#run'), step:$('#step'), reset:$('#reset'), randomize:$('#randomize'),
  runState:$('#run-state'), error:$('#sequence-error'), caption:$('#experiment-caption'),
  protein:$('#protein-canvas'), energy:$('#energy-canvas'), contact:$('#contact-canvas'),
  tooltip:$('#residue-tooltip'),
  metricEnergy:$('#metric-energy'), metricRg:$('#metric-rg'),
  metricContacts:$('#metric-contacts'), metricAcceptance:$('#metric-acceptance'),
  metricSteps:$('#metric-steps')
};

const state = {
  sequence:'', positions:[], initialPositions:[], running:false, attempted:0, accepted:0,
  energy:null, history:[], seed:20260807, rng:null, screenResidues:[], animationId:null
};

function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function residueType(code) { return RESIDUES[code][1]; }
function distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }

function createInitialChain(randomize=false) {
  state.rng = mulberry32(state.seed);
  const points=[{x:0,y:0}];
  let angle = randomize ? (state.rng()-.5)*1.6 : .18;
  for(let i=1;i<state.sequence.length;i++) {
    if(randomize) angle += (state.rng()-.5)*1.35;
    else angle = Math.sin(i*.75)*.28;
    const previous=points[i-1];
    points.push({x:previous.x+Math.cos(angle),y:previous.y+Math.sin(angle)});
  }
  centerChain(points);
  state.positions=points;
  state.initialPositions=points.map(point=>({...point}));
  state.attempted=0; state.accepted=0; state.history=[];
  state.energy=calculateEnergy(points);
  sampleHistory(true);
  renderAll();
}

function centerChain(points=state.positions) {
  const center=points.reduce((sum,p)=>({x:sum.x+p.x,y:sum.y+p.y}),{x:0,y:0});
  center.x/=points.length; center.y/=points.length;
  points.forEach(p=>{p.x-=center.x;p.y-=center.y;});
}

function interactionStrength(codeA,codeB,r) {
  const a=residueType(codeA), b=residueType(codeB);
  const solventScale=ui.solvent.value==='denaturant' ? .22 : 1;
  let energy=0;
  const gaussian=(center,width)=>Math.exp(-Math.pow((r-center)/width,2));

  if(a==='hydrophobic' && b==='hydrophobic') energy-=2.05*solventScale*gaussian(1.18,.42);
  if(codeA==='C' && codeB==='C') energy-=2.15*solventScale*gaussian(1.25,.25);
  if(a==='polar' && b==='polar') energy-=.22*solventScale*gaussian(1.28,.5);
  if((a==='positive' && b==='negative') || (a==='negative' && b==='positive')) energy-=.88*solventScale*Math.exp(-r/1.55);
  if((a==='positive' && b==='positive') || (a==='negative' && b==='negative')) energy+=.78*Math.exp(-r/1.35);
  return energy;
}

function calculateEnergy(points=state.positions) {
  let bond=0,bend=0,nonbond=0,solvent=0;
  for(let i=0;i<points.length-1;i++) {
    const r=distance(points[i],points[i+1]);
    bond+=42*Math.pow(r-1,2);
  }
  for(let i=1;i<points.length-1;i++) {
    const ax=points[i].x-points[i-1].x, ay=points[i].y-points[i-1].y;
    const bx=points[i+1].x-points[i].x, by=points[i+1].y-points[i].y;
    const denom=Math.max(.0001,Math.hypot(ax,ay)*Math.hypot(bx,by));
    const cosine=clamp((ax*bx+ay*by)/denom,-1,1);
    const flexibility=state.sequence[i]==='G' ? .18 : state.sequence[i]==='P' ? 1.1 : .48;
    bend+=flexibility*(1-cosine);
  }
  for(let i=0;i<points.length;i++) {
    for(let j=i+2;j<points.length;j++) {
      const r=Math.max(.42,distance(points[i],points[j]));
      const repulsion=Math.min(80,.22*Math.pow(.78/r,12));
      nonbond+=repulsion+interactionStrength(state.sequence[i],state.sequence[j],r);
    }
  }
  if(ui.solvent.value==='membrane') {
    const centerY=points.reduce((sum,p)=>sum+p.y,0)/points.length;
    for(let i=0;i<points.length;i++) {
      const inside=Math.abs(points[i].y-centerY)<1.35;
      const type=residueType(state.sequence[i]);
      if(type==='hydrophobic') solvent+=inside ? -.42 : .16;
      if(type==='positive' || type==='negative' || type==='polar') solvent+=inside ? .38 : -.05;
    }
  }
  return {bond,bend,nonbond,solvent,total:bond+bend+nonbond+solvent};
}

function monteCarloStep(count=1) {
  const temperature=Number(ui.temperature.value);
  const moveSize=.13+.10*Math.sqrt(temperature);
  for(let attempt=0;attempt<count;attempt++) {
    const oldEnergy=state.energy.total;
    let restore;
    if(state.rng()<.34 && state.positions.length>8) {
      const pivot=1+Math.floor(state.rng()*(state.positions.length-2));
      const rotateTail=state.rng()<.5;
      const indices=[];
      if(rotateTail) for(let i=pivot+1;i<state.positions.length;i++) indices.push(i);
      else for(let i=0;i<pivot;i++) indices.push(i);
      const previous=indices.map(i=>({i,x:state.positions[i].x,y:state.positions[i].y}));
      const origin=state.positions[pivot],angle=(state.rng()-.5)*1.05;
      const cosine=Math.cos(angle),sine=Math.sin(angle);
      indices.forEach(i=>{
        const point=state.positions[i],dx=point.x-origin.x,dy=point.y-origin.y;
        point.x=origin.x+dx*cosine-dy*sine;point.y=origin.y+dx*sine+dy*cosine;
      });
      restore=()=>previous.forEach(p=>{state.positions[p.i].x=p.x;state.positions[p.i].y=p.y});
    } else {
      const index=Math.floor(state.rng()*state.positions.length);
      const point=state.positions[index],previous={x:point.x,y:point.y};
      point.x+=(state.rng()-.5)*2*moveSize;point.y+=(state.rng()-.5)*2*moveSize;
      restore=()=>{point.x=previous.x;point.y=previous.y};
    }
    const candidate=calculateEnergy();
    const delta=candidate.total-oldEnergy;
    state.attempted++;
    if(delta<=0 || state.rng()<Math.exp(-delta/temperature)) {
      state.energy=candidate;
      state.accepted++;
    } else {
      restore();
    }
    if(state.attempted%500===0) centerChain();
    if(state.attempted%40===0) sampleHistory();
  }
}

function sampleHistory(force=false) {
  const latest=state.history[state.history.length-1];
  if(!force && latest && latest.step===state.attempted) return;
  state.history.push({step:state.attempted,total:state.energy.total});
  if(state.history.length>260) state.history.shift();
}

function contacts() {
  const list=[];
  for(let i=0;i<state.positions.length;i++) {
    for(let j=i+3;j<state.positions.length;j++) {
      const r=distance(state.positions[i],state.positions[j]);
      if(r<1.65) list.push({i,j,r});
    }
  }
  return list;
}

function radiusOfGyration() {
  const center=state.positions.reduce((sum,p)=>({x:sum.x+p.x,y:sum.y+p.y}),{x:0,y:0});
  center.x/=state.positions.length; center.y/=state.positions.length;
  return Math.sqrt(state.positions.reduce((sum,p)=>sum+Math.pow(p.x-center.x,2)+Math.pow(p.y-center.y,2),0)/state.positions.length);
}

function setupCanvas(canvas) {
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const width=Math.max(1,Math.round(rect.width));
  const height=Math.max(1,Math.round(rect.height));
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)) {
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
  }
  const ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,width,height};
}

function structureTransform(width,height) {
  const xs=state.positions.map(p=>p.x), ys=state.positions.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const spanX=Math.max(4,maxX-minX+3),spanY=Math.max(4,maxY-minY+3);
  const scale=clamp(Math.min((width-50)/spanX,(height-50)/spanY),12,48);
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  return p=>({x:width/2+(p.x-cx)*scale,y:height/2+(p.y-cy)*scale,scale});
}

function drawProtein() {
  const {ctx,width,height}=setupCanvas(ui.protein);
  ctx.clearRect(0,0,width,height);
  const map=structureTransform(width,height);
  const mapped=state.positions.map(map);

  if(ui.solvent.value==='membrane') {
    const ys=mapped.map(p=>p.y),centerY=ys.reduce((a,b)=>a+b,0)/ys.length;
    const band=Math.min(78,mapped[0].scale*2.7);
    ctx.fillStyle='rgba(229,169,63,.10)';ctx.fillRect(0,centerY-band/2,width,band);
    ctx.strokeStyle='rgba(229,169,63,.42)';ctx.setLineDash([8,7]);
    ctx.beginPath();ctx.moveTo(0,centerY-band/2);ctx.lineTo(width,centerY-band/2);ctx.moveTo(0,centerY+band/2);ctx.lineTo(width,centerY+band/2);ctx.stroke();ctx.setLineDash([]);
  }

  const currentContacts=contacts();
  currentContacts.forEach(({i,j})=>{
    ctx.strokeStyle='rgba(78,198,202,.18)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(mapped[i].x,mapped[i].y);ctx.lineTo(mapped[j].x,mapped[j].y);ctx.stroke();
  });

  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(232,238,245,.72)';ctx.lineWidth=3;
  ctx.beginPath();mapped.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();

  const radius=clamp(mapped[0].scale*.25,6,12);
  state.screenResidues=[];
  mapped.forEach((p,i)=>{
    const code=state.sequence[i],type=residueType(code);
    ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);
    ctx.fillStyle=COLORS[type];ctx.fill();ctx.strokeStyle='#0d1d31';ctx.lineWidth=2;ctx.stroke();
    if(radius>=9 && state.sequence.length<=42) {
      ctx.fillStyle=type==='polar'?'#0d1d31':'#fff';ctx.font=`700 ${Math.max(8,radius*.82)}px ui-sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(code,p.x,p.y+.5);
    }
    state.screenResidues.push({x:p.x,y:p.y,radius:radius+6,index:i});
  });
}

function drawEnergy() {
  const {ctx,width,height}=setupCanvas(ui.energy);
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
  const pad={l:42,r:12,t:12,b:28};
  ctx.strokeStyle='#d6dcda';ctx.lineWidth=1;
  for(let i=0;i<4;i++){const y=pad.t+(height-pad.t-pad.b)*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(width-pad.r,y);ctx.stroke();}
  if(state.history.length<2) return;
  let min=Math.min(...state.history.map(d=>d.total)),max=Math.max(...state.history.map(d=>d.total));
  if(max-min<1){max+=.5;min-=.5} const x0=state.history[0].step,x1=state.history[state.history.length-1].step||1;
  const x=d=>pad.l+(d.step-x0)/Math.max(1,x1-x0)*(width-pad.l-pad.r);
  const y=d=>pad.t+(max-d.total)/(max-min)*(height-pad.t-pad.b);
  ctx.beginPath();state.history.forEach((d,i)=>i?ctx.lineTo(x(d),y(d)):ctx.moveTo(x(d),y(d)));
  ctx.strokeStyle='#e05a3f';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#617084';ctx.font='10px ui-sans-serif';ctx.textAlign='right';ctx.fillText(max.toFixed(1),pad.l-6,pad.t+4);ctx.fillText(min.toFixed(1),pad.l-6,height-pad.b);
  ctx.textAlign='left';ctx.fillText(x0.toLocaleString(),pad.l,height-8);ctx.textAlign='right';ctx.fillText(x1.toLocaleString(),width-pad.r,height-8);
}

function drawContactMap() {
  const {ctx,width,height}=setupCanvas(ui.contact);
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
  const n=state.sequence.length,pad=18,size=Math.min(width-2*pad,height-2*pad),cell=size/n;
  ctx.fillStyle='#e9ece8';ctx.fillRect(pad,pad,size,size);
  const map=new Map(contacts().map(c=>[`${c.i}-${c.j}`,c]));
  for(let i=0;i<n;i++)for(let j=0;j<n;j++) {
    if(i===j) ctx.fillStyle='#14243a';
    else {
      const contact=map.get(`${Math.min(i,j)}-${Math.max(i,j)}`);
      if(!contact) continue;
      const typeA=residueType(state.sequence[i]),typeB=residueType(state.sequence[j]);
      ctx.fillStyle=typeA===typeB?COLORS[typeA]:'#4f6478';
    }
    ctx.fillRect(pad+i*cell,pad+j*cell,Math.max(1,cell-.25),Math.max(1,cell-.25));
  }
  ctx.strokeStyle='#99a5a2';ctx.strokeRect(pad+.5,pad+.5,size,size);
  ctx.fillStyle='#617084';ctx.font='10px ui-sans-serif';ctx.textAlign='left';ctx.fillText('N',pad,height-2);ctx.textAlign='right';ctx.fillText('C',pad+size,height-2);
}

function updateMetrics() {
  ui.metricEnergy.textContent=state.energy.total.toFixed(2);
  ui.metricRg.textContent=radiusOfGyration().toFixed(2);
  ui.metricContacts.textContent=contacts().length.toLocaleString();
  ui.metricAcceptance.textContent=state.attempted?`${(100*state.accepted/state.attempted).toFixed(1)}%`:'—';
  ui.metricSteps.textContent=state.attempted.toLocaleString();
}

function renderAll() { drawProtein();drawEnergy();drawContactMap();updateMetrics(); }

function animationLoop() {
  if(!state.running) return;
  monteCarloStep(Number(ui.speed.value));
  renderAll();
  state.animationId=requestAnimationFrame(animationLoop);
}

function setRunning(running) {
  state.running=running;
  ui.run.textContent=running?'일시정지':'실험 시작';
  ui.runState.textContent=running?'계산 중':state.attempted?'일시정지':'준비';
  ui.runState.dataset.state=running?'running':state.attempted?'paused':'ready';
  ui.step.disabled=running;ui.apply.disabled=running;ui.randomize.disabled=running;
  if(running) animationLoop(); else if(state.animationId) cancelAnimationFrame(state.animationId);
}

function applySequence() {
  const sequence=ui.sequence.value.toUpperCase().replace(/\s+/g,'');
  const invalid=[...sequence].filter(code=>!RESIDUES[code]);
  if(sequence.length<8||sequence.length>48||invalid.length) {
    ui.error.textContent=invalid.length?`사용할 수 없는 문자: ${[...new Set(invalid)].join(', ')}`:'서열 길이는 8–48개여야 합니다.';
    return false;
  }
  setRunning(false);ui.error.textContent='';state.sequence=sequence;ui.sequence.value=sequence;
  createInitialChain(false);return true;
}

function selectPreset(key) {
  ui.sequence.value=PRESETS[key].sequence;ui.caption.textContent=PRESETS[key].caption;applySequence();
}

ui.preset.addEventListener('change',()=>selectPreset(ui.preset.value));
ui.apply.addEventListener('click',applySequence);
ui.temperature.addEventListener('input',()=>{ui.temperatureValue.value=Number(ui.temperature.value).toFixed(2)});
ui.solvent.addEventListener('change',()=>{state.energy=calculateEnergy();sampleHistory(true);renderAll()});
ui.speed.addEventListener('input',()=>{ui.speedValue.value=ui.speed.value});
ui.run.addEventListener('click',()=>setRunning(!state.running));
ui.step.addEventListener('click',()=>{monteCarloStep(100);renderAll()});
ui.reset.addEventListener('click',()=>{setRunning(false);state.positions=state.initialPositions.map(p=>({...p}));state.attempted=0;state.accepted=0;state.history=[];state.energy=calculateEnergy();sampleHistory(true);renderAll()});
ui.randomize.addEventListener('click',()=>{setRunning(false);state.seed=(state.seed+7919)>>>0;createInitialChain(true)});

document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(item=>{const active=item===tab;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active))});
  document.querySelectorAll('.tab-panel').forEach(panel=>{const active=panel.id===`${tab.dataset.tab}-panel`;panel.classList.toggle('active',active);panel.hidden=!active});
}));

ui.protein.addEventListener('pointermove',event=>{
  const rect=ui.protein.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
  const hit=state.screenResidues.find(item=>Math.hypot(item.x-x,item.y-y)<=item.radius);
  if(!hit){ui.tooltip.hidden=true;return}
  const code=state.sequence[hit.index],details=RESIDUES[code];
  ui.tooltip.textContent=`${hit.index+1} · ${code} · ${details[0]}`;
  ui.tooltip.style.left=`${clamp(x+12,8,rect.width-150)}px`;ui.tooltip.style.top=`${clamp(y-30,8,rect.height-40)}px`;ui.tooltip.hidden=false;
});
ui.protein.addEventListener('pointerleave',()=>{ui.tooltip.hidden=true});

const resizeObserver=new ResizeObserver(()=>renderAll());
[ui.protein,ui.energy,ui.contact].forEach(canvas=>resizeObserver.observe(canvas));

ui.sequence.value=PRESETS.core.sequence;
state.sequence=PRESETS.core.sequence;
createInitialChain(false);
