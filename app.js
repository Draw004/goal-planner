(function(){
  "use strict";
  const L=window.CarrowmontLocale;
  const REPORT_ENGINE=window.CarrowmontReportEngine;
  const PDF_EXPORT=window.CarrowmontPdfExport;
  const GOAL_PDF=window.CarrowmontGoalPdfRenderer;
  const REPORT_CONFIG=window.CARROWMONT_GOAL_CONFIG||{};
  if(!L) return;
  const $=id=>document.getElementById(id);
  const els={
    localeMenu:$('localeMenu'),localeSummary:$('localeSummary'),localeCurrent:$('localeCurrent'),regionSelect:$('regionSelect'),currencySelect:$('currencySelect'),localeDone:$('localeDone'),
    goalTypes:$('goalTypes'),goalName:$('goalName'),years:$('years'),amountToday:$('amountToday'),propertyValue:$('propertyValue'),downPayment:$('downPayment'),monthlyExpenses:$('monthlyExpenses'),expenseMonths:$('expenseMonths'),inflationRate:$('inflationRate'),existingSavings:$('existingSavings'),monthlyContribution:$('monthlyContribution'),returnRate:$('returnRate'),futureLump:$('futureLump'),futureLumpYear:$('futureLumpYear'),inflationLabel:$('inflationLabel'),amountLabel:$('amountLabel'),amountHelp:$('amountHelp'),goalHelp:$('goalHelp'),resetBtn:$('resetBtn'),
    snapshotTitle:$('snapshotTitle'),timePill:$('timePill'),futureCost:$('futureCost'),futureCostNote:$('futureCostNote'),projectedPlan:$('projectedPlan'),fundingGap:$('fundingGap'),totalMonthly:$('totalMonthly'),additionalMonthly:$('additionalMonthly'),lumpToday:$('lumpToday'),fundingPct:$('fundingPct'),fundingBar:$('fundingBar'),fundingText:$('fundingText'),todayCostCard:$('todayCostCard'),futureCostCard:$('futureCostCard'),projectedCard:$('projectedCard'),additionalCard:$('additionalCard'),costChart:$('costChart'),savingsChart:$('savingsChart'),scenarioGrid:$('scenarioGrid'),
    insightInflation:$('insightInflation'),insightInflationText:$('insightInflationText'),insightFunding:$('insightFunding'),insightFundingText:$('insightFundingText'),insightContribution:$('insightContribution'),insightContributionText:$('insightContributionText'),insightTime:$('insightTime'),insightTimeText:$('insightTimeText'),copyBtn:$('copyBtn'),reportBtn:$('reportBtn'),printReport:$('printReport')
  };
  const templates={
    education:{label:'Child education',short:'Education',goalName:'Higher education',amount:2500000,inflation:7,years:12,help:'Model tuition or education costs in today’s money.',inflabel:'Education inflation assumption'},
    home:{label:'Home purchase',short:'Home',goalName:'Home down payment',property:8000000,down:20,inflation:5,years:8,help:'Model a future down payment rather than the full property price.',inflabel:'Home-price growth assumption'},
    wedding:{label:'Wedding',short:'Wedding',goalName:'Wedding',amount:1500000,inflation:5,years:7,help:'Estimate a future wedding budget from today’s cost.',inflabel:'Cost inflation assumption'},
    travel:{label:'Travel',short:'Travel',goalName:'Major travel goal',amount:500000,inflation:4,years:5,help:'Plan for a major trip or travel milestone.',inflabel:'Travel-cost inflation assumption'},
    vehicle:{label:'Vehicle',short:'Vehicle',goalName:'Vehicle purchase',amount:1500000,inflation:4,years:5,help:'Estimate a future vehicle purchase budget.',inflabel:'Vehicle-price growth assumption'},
    emergency:{label:'Emergency fund',short:'Emergency',goalName:'Emergency fund',expenses:75000,months:6,inflation:4,years:1,help:'Build a liquidity target from essential monthly expenses.',inflabel:'Expense inflation assumption'},
    custom:{label:'Custom goal',short:'Custom',goalName:'My goal',amount:1000000,inflation:5,years:10,help:'Use a flexible target for any other major financial goal.',inflabel:'Inflation assumption'}
  };
  let goalType='education';
  let pendingRegion=L.getRegion(),pendingCurrency=L.getCurrency();

  function populateLocale(){
    els.regionSelect.innerHTML=Object.entries(L.regions).map(([c,p])=>`<option value="${c}">${p.label}</option>`).join('');
    els.currencySelect.innerHTML=Object.entries(L.currencies).map(([c,p])=>`<option value="${c}">${c} — ${p.label}</option>`).join('');
    els.regionSelect.value=pendingRegion;els.currencySelect.value=pendingCurrency;updateLocaleSummary();
  }
  function updateLocaleSummary(){els.localeCurrent.textContent=`${L.getProfile().label} · ${L.getCurrency()}`;document.querySelectorAll('.currency-prefix').forEach(e=>e.textContent=L.currencySymbol());}
  function openLocale(){pendingRegion=L.getRegion();pendingCurrency=L.getCurrency();els.regionSelect.value=pendingRegion;els.currencySelect.value=pendingCurrency;}
  els.localeMenu.addEventListener('toggle',()=>{if(els.localeMenu.open)openLocale();});
  els.regionSelect.addEventListener('change',e=>{pendingRegion=e.target.value;const p=L.regions[pendingRegion];if(p&&L.currencies[p.currency]){pendingCurrency=p.currency;els.currencySelect.value=pendingCurrency;}});
  els.currencySelect.addEventListener('change',e=>pendingCurrency=e.target.value);
  els.localeDone.addEventListener('click',()=>{const changed=pendingRegion!==L.getRegion()||pendingCurrency!==L.getCurrency();L.setLocale(pendingRegion,pendingCurrency);els.localeMenu.open=false;if(changed) resetMoneyForLocale();});
  document.addEventListener('click',e=>{if(els.localeMenu.open&&!els.localeMenu.contains(e.target)){els.localeMenu.open=false;}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&els.localeMenu.open)els.localeMenu.open=false;});
  window.addEventListener('carrowmont:localechange',()=>{updateLocaleSummary();render();});

  function buildGoalTypes(){
    els.goalTypes.innerHTML=Object.entries(templates).map(([k,t])=>`<button type="button" class="goal-type ${k===goalType?'active':''}" data-goal="${k}">${t.label}<small>${k==='home'?'Down payment':k==='emergency'?'Months of expenses':'Future target'}</small></button>`).join('');
    els.goalTypes.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>applyTemplate(b.dataset.goal,true)));
  }
  function showDynamic(){
    document.querySelectorAll('.dynamic-standard').forEach(e=>e.classList.toggle('hidden',goalType==='home'||goalType==='emergency'));
    document.querySelectorAll('.dynamic-home').forEach(e=>e.classList.toggle('hidden',goalType!=='home'));
    document.querySelectorAll('.dynamic-emergency').forEach(e=>e.classList.toggle('hidden',goalType!=='emergency'));
  }
  function applyTemplate(type,resetValues){
    goalType=type;const t=templates[type];buildGoalTypes();showDynamic();
    els.inflationLabel.textContent=t.inflabel;els.goalHelp.textContent=t.help;
    if(resetValues){
      els.goalName.value=t.goalName;els.years.value=t.years;els.inflationRate.value=t.inflation;
      if(t.amount!=null)els.amountToday.value=t.amount;if(t.property!=null)els.propertyValue.value=t.property;if(t.down!=null)els.downPayment.value=t.down;if(t.expenses!=null)els.monthlyExpenses.value=t.expenses;if(t.months!=null)els.expenseMonths.value=t.months;
    }
    render();
  }
  function resetMoneyForLocale(){
    els.amountToday.value=0;els.propertyValue.value=0;els.monthlyExpenses.value=0;els.existingSavings.value=0;els.monthlyContribution.value=0;els.futureLump.value=0;render();
  }
  function usesIndiaDemoDefaults(){return L.getRegion()==='IN'&&L.getCurrency()==='INR';}
  function resetAll(){
    goalType='education';els.existingSavings.value=500000;els.monthlyContribution.value=8000;els.returnRate.value=10;els.futureLump.value=0;els.futureLumpYear.value=0;applyTemplate('education',true);
    if(!usesIndiaDemoDefaults()) resetMoneyForLocale();
  }
  els.resetBtn.addEventListener('click',resetAll);

  function num(el,def=0){const v=parseFloat(el.value);return Number.isFinite(v)?v:def;}
  function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
  function state(yearOverride){
    const y=clamp(yearOverride??num(els.years,1),1,50),infl=clamp(num(els.inflationRate),0,30)/100,ret=clamp(num(els.returnRate),0,30)/100;
    let today=0;
    if(goalType==='home')today=Math.max(0,num(els.propertyValue))*clamp(num(els.downPayment,20),0,100)/100;
    else if(goalType==='emergency')today=Math.max(0,num(els.monthlyExpenses))*clamp(num(els.expenseMonths,6),1,36);
    else today=Math.max(0,num(els.amountToday));
    return {type:goalType,name:els.goalName.value.trim()||templates[goalType].goalName,years:y,inflation:infl,ret,today,existing:Math.max(0,num(els.existingSavings)),monthly:Math.max(0,num(els.monthlyContribution)),futureLump:Math.max(0,num(els.futureLump)),futureLumpYear:clamp(num(els.futureLumpYear),0,y)};
  }
  function annualGrowth(v,r,y){return v*Math.pow(1+r,y);}
  function monthlyRate(annual){return annual===0?0:Math.pow(1+annual,1/12)-1;}
  function annuityFactor(annual,years){const n=Math.max(1,Math.round(years*12)),rm=monthlyRate(annual);return rm===0?n:(Math.pow(1+rm,n)-1)/rm;}
  function calc(s){
    const futureCost=annualGrowth(s.today,s.inflation,s.years);const existingFuture=annualGrowth(s.existing,s.ret,s.years);const af=annuityFactor(s.ret,s.years);const monthlyFuture=s.monthly*af;const lumpFuture=s.futureLump>0?annualGrowth(s.futureLump,s.ret,Math.max(0,s.years-s.futureLumpYear)):0;const projected=existingFuture+monthlyFuture+lumpFuture;const gap=Math.max(0,futureCost-projected);const monthlyRequired=Math.max(0,(futureCost-existingFuture-lumpFuture)/af);const additional=Math.max(0,monthlyRequired-s.monthly);const lumpToday=gap/Math.pow(1+s.ret,s.years);const funding=futureCost>0?projected/futureCost:0;return{futureCost,existingFuture,monthlyFuture,lumpFuture,projected,gap,monthlyRequired,additional,lumpToday,funding,af};
  }
  const money=v=>L.formatMoney(v,{maximumFractionDigits:0});
  const compact=v=>L.formatCompactMoney(v,{maximumFractionDigits:2});
  function pct(v){return `${Math.round(v)}%`;}
  function esc(v){return String(v).replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));}

  function render(){
    const s=state(),c=calc(s);updateLocaleSummary();
    els.snapshotTitle.textContent=s.name;els.timePill.textContent=`${s.years} ${s.years===1?'year':'years'} to goal`;els.futureCost.textContent=compact(c.futureCost);els.projectedPlan.textContent=compact(c.projected);els.fundingGap.textContent=c.gap>0?compact(c.gap):'No gap';els.totalMonthly.textContent=`${money(c.monthlyRequired)}/mo`;els.additionalMonthly.textContent=c.additional>0?`${money(c.additional)}/mo`:'No increase required';els.lumpToday.textContent=c.lumpToday>0?money(c.lumpToday):'No additional lump sum';
    const fundPct=Math.min(999,c.funding*100);els.fundingPct.textContent=pct(Math.min(100,fundPct));els.fundingBar.style.width=`${Math.min(100,fundPct)}%`;els.fundingText.textContent=c.funding>=1?`Under these assumptions, your current plan reaches or exceeds the modelled goal.`:`Your current savings plan is projected to cover about ${Math.round(fundPct)}% of the modelled goal.`;
    els.todayCostCard.textContent=compact(s.today);els.futureCostCard.textContent=compact(c.futureCost);els.projectedCard.textContent=compact(c.projected);els.additionalCard.textContent=c.additional>0?`${money(c.additional)}/mo`:`${money(0)}/mo`;
    renderInsights(s,c);renderScenarios(s);renderCostChart(s);renderSavingsChart(s);buildReport(s,c);
  }
  function renderInsights(s,c){
    const increase=s.today>0?(c.futureCost/s.today-1)*100:0;els.insightInflation.textContent=`+${Math.round(increase)}%`;els.insightInflationText.textContent=`At ${ (s.inflation*100).toFixed(1)}% annual inflation, the modelled cost grows from ${compact(s.today)} today to ${compact(c.futureCost)} in ${s.years} years.`;
    els.insightFunding.textContent=`${Math.min(100,Math.round(c.funding*100))}% funded`;els.insightFundingText.textContent=`Existing savings and current contributions are projected to reach ${compact(c.projected)} by the goal date.`;
    els.insightContribution.textContent=c.additional>0?`+${money(c.additional)}/mo`:'No increase required';els.insightContributionText.textContent=c.additional>0?`On top of your current ${money(s.monthly)}/month contribution, under these assumptions.`:'Your current contribution is enough to meet or exceed the modelled target under these assumptions.';
    const later=calc(state(s.years+2));const diff=c.monthlyRequired-later.monthlyRequired;els.insightTime.textContent=`2 extra years`;els.insightTimeText.textContent=diff>=0?`Moving the goal two years later reduces the modelled monthly requirement by about ${money(diff)}/month, while the nominal goal cost also rises with inflation.`:`Moving the goal two years later increases the modelled monthly requirement by about ${money(Math.abs(diff))}/month under these assumptions because the goal cost is growing faster than the investment assumption.`;
  }
  function renderScenarios(s){
    const ys=[Math.max(1,s.years-2),s.years,Math.min(50,s.years+2)];els.scenarioGrid.innerHTML=ys.map(y=>{const st=state(y),c=calc(st),current=y===s.years;return `<article class="scenario ${current?'current':''}"><div class="tag">${current?`Current choice · ${y} years`:`Goal in ${y} years`}</div><strong class="big">${compact(c.futureCost)}</strong><dl><div><dt>Years to save</dt><dd>${y}</dd></div><div><dt>Total monthly required</dt><dd>${money(c.monthlyRequired)}</dd></div><div><dt>Projected funding</dt><dd>${Math.min(100,Math.round(c.funding*100))}%</dd></div></dl></article>`;}).join('');
  }
  function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const n=v/p;const m=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;return m*p;}
  function chartBase(svg,maxVal,years){const W=800,H=300,l=80,r=20,t=20,b=42,iw=W-l-r,ih=H-t-b,x=y=>l+(y/years)*iw,yy=v=>t+ih-(v/maxVal)*ih;let h='';for(let i=0;i<=4;i++){const v=maxVal*i/4,py=yy(v);h+=`<line class="gridline" x1="${l}" x2="${W-r}" y1="${py}" y2="${py}"/><text class="axis" x="${l-10}" y="${py+4}" text-anchor="end">${compact(v)}</text>`;}[0,Math.round(years/2),years].forEach(y=>h+=`<text class="axis" x="${x(y)}" y="${H-14}" text-anchor="middle">${y===0?'Today':`Year ${Number.isInteger(y)?y:y.toFixed(1)}`}</text>`);svg.innerHTML=h;return{x,yy,W,H,l,r,t,b,iw,ih,years};}
  function chartYears(years){const out=[];for(let y=0;y<=Math.floor(years);y++)out.push(y);if(Math.abs(out[out.length-1]-years)>.001)out.push(years);return out;}
  function chartYearLabel(y){return y<.001?'Today':`Year ${Math.abs(y-Math.round(y))<.001?Math.round(y):y.toFixed(1)}`;}
  function bindChartInteraction(svg,series,g,extraLine){
    const card=svg.closest('.chart-card');if(!card)return;
    let tip=card.querySelector('.goal-chart-tooltip');if(!tip){tip=document.createElement('div');tip.className='goal-chart-tooltip';tip.setAttribute('aria-hidden','true');card.appendChild(tip);}
    const guide=document.createElementNS('http://www.w3.org/2000/svg','line');guide.setAttribute('class','goal-chart-guide');guide.setAttribute('y1',g.t);guide.setAttribute('y2',g.H-g.b);guide.setAttribute('visibility','hidden');svg.appendChild(guide);
    const dots=series.map((ser,i)=>{const d=document.createElementNS('http://www.w3.org/2000/svg','circle');d.setAttribute('class','goal-chart-hover-dot');d.setAttribute('r',i===0?'5.5':'5');d.setAttribute('fill',ser.color);d.setAttribute('visibility','hidden');svg.appendChild(d);return d;});
    tip.classList.remove('visible');tip.setAttribute('aria-hidden','true');
    let touchPinned=false;
    const hide=()=>{tip.classList.remove('visible');tip.setAttribute('aria-hidden','true');guide.setAttribute('visibility','hidden');dots.forEach(d=>d.setAttribute('visibility','hidden'));};
    const nearestPoint=(pts,year)=>pts.reduce((best,p)=>Math.abs(p.y-year)<Math.abs(best.y-year)?p:best,pts[0]);
    const show=ev=>{
      const rect=svg.getBoundingClientRect();if(!rect.width)return;
      const pointerX=Math.max(0,Math.min(rect.width,ev.clientX-rect.left));const viewX=pointerX/rect.width*g.W;
      const rawYear=Math.max(0,Math.min(g.years,(viewX-g.l)/Math.max(1e-9,g.iw)*g.years));
      const anchor=nearestPoint(series[0].points,rawYear);const year=anchor.y;const cx=g.x(year);guide.setAttribute('x1',cx);guide.setAttribute('x2',cx);guide.setAttribute('visibility','visible');
      const values=series.map((ser,i)=>{const p=nearestPoint(ser.points,year);dots[i].setAttribute('cx',cx);dots[i].setAttribute('cy',g.yy(p.v));dots[i].setAttribute('visibility','visible');return{...ser,value:p.v};});
      let html=`<strong>${esc(chartYearLabel(year))}</strong>`+values.map(v=>`<span>${esc(v.label)}: ${esc(compact(v.value))}</span>`).join('');
      if(extraLine)html+=extraLine(values,year)||'';tip.innerHTML=html;tip.setAttribute('aria-hidden','false');
      const cr=card.getBoundingClientRect(),tipWidth=220;let left=ev.clientX-cr.left+14;left=Math.max(8,Math.min(left,card.clientWidth-tipWidth-8));let top=ev.clientY-cr.top-72;top=Math.max(8,Math.min(top,card.clientHeight-90));tip.style.left=`${left}px`;tip.style.top=`${top}px`;tip.classList.add('visible');
    };
    svg.onpointermove=ev=>{if(ev.pointerType!=='touch')show(ev);};
    svg.onpointerdown=ev=>{show(ev);touchPinned=ev.pointerType==='touch';};
    svg.onpointerleave=ev=>{if(ev.pointerType!=='touch'&&!touchPinned)hide();};
    svg.onpointercancel=ev=>{if(ev.pointerType!=='touch')hide();};
  }
  function renderCostChart(s){const pts=chartYears(s.years).map(y=>({y,v:annualGrowth(s.today,s.inflation,y)}));const max=niceMax(Math.max(...pts.map(p=>p.v))*1.08),g=chartBase(els.costChart,max,s.years),path=pts.map((p,i)=>`${i?'L':'M'}${g.x(p.y)},${g.yy(p.v)}`).join(' ');els.costChart.innerHTML+=`<path class="goal-line" d="${path}"/><circle class="dot-goal" cx="${g.x(s.years)}" cy="${g.yy(pts[pts.length-1].v)}" r="5"/>`;bindChartInteraction(els.costChart,[{label:'Goal cost',color:'#173d5c',points:pts}],g);}
  function planAt(s,y){const existing=annualGrowth(s.existing,s.ret,y),af=annuityFactor(s.ret,y),monthly=s.monthly*af,lump=(s.futureLump>0&&y>=s.futureLumpYear)?annualGrowth(s.futureLump,s.ret,y-s.futureLumpYear):0;return existing+monthly+lump;}
  function renderSavingsChart(s){const pts=chartYears(s.years).map(y=>({y,goal:annualGrowth(s.today,s.inflation,y),plan:y===0?s.existing:planAt(s,y)}));const max=niceMax(Math.max(...pts.flatMap(p=>[p.goal,p.plan]))*1.08),g=chartBase(els.savingsChart,max,s.years),goalPts=pts.map(p=>({y:p.y,v:p.goal})),planPts=pts.map(p=>({y:p.y,v:p.plan})),p1=goalPts.map((p,i)=>`${i?'L':'M'}${g.x(p.y)},${g.yy(p.v)}`).join(' '),p2=planPts.map((p,i)=>`${i?'L':'M'}${g.x(p.y)},${g.yy(p.v)}`).join(' ');els.savingsChart.innerHTML+=`<path class="goal-line" d="${p1}"/><path class="plan-line" d="${p2}"/><circle class="dot-goal" cx="${g.x(s.years)}" cy="${g.yy(goalPts.at(-1).v)}" r="5"/><circle class="dot-plan" cx="${g.x(s.years)}" cy="${g.yy(planPts.at(-1).v)}" r="5"/>`;bindChartInteraction(els.savingsChart,[{label:'Goal path',color:'#173d5c',points:goalPts},{label:'Your current plan',color:'#0e8b80',points:planPts}],g,(vals)=>{const gap=vals[0].value-vals[1].value;return gap>=0?`<span>Funding gap: ${esc(compact(gap))}</span>`:`<span>Above goal path: ${esc(compact(Math.abs(gap)))}</span>`;});}

  document.querySelectorAll('input').forEach(i=>i.addEventListener('input',render));els.goalName.addEventListener('input',render);
  function currencyCode(){return L.getCurrency();}
  function regionLabel(){return L.getProfile().label;}
  function reportRow(label,value,valueClass=''){return `<tr><th>${esc(label)}</th><td class="${valueClass}">${esc(value)}</td></tr>`;}
  function goalSpecificAssumptions(s){
    const rows=[];
    if(s.type==='home'){
      rows.push(['Property value today',money(Math.max(0,num(els.propertyValue)))]);
      rows.push(['Down payment target',`${num(els.downPayment,20).toFixed(0)}%`]);
      rows.push(['Goal amount today (down payment)',money(s.today)]);
    }else if(s.type==='emergency'){
      rows.push(['Essential monthly expenses',`${money(Math.max(0,num(els.monthlyExpenses)))}/mo`]);
      rows.push(['Emergency-fund target',`${num(els.expenseMonths,6).toFixed(0)} months`]);
      rows.push(['Goal amount today',money(s.today)]);
    }else{
      rows.push(['Goal cost today',money(s.today)]);
    }
    return rows;
  }
  function reportAssumptions(s){
    const rows=[
      ['Goal type',templates[s.type].label],['Goal name',s.name],['Country / region',regionLabel()],['Currency',currencyCode()],
      ['Years until goal',`${s.years}`],...goalSpecificAssumptions(s),
      [templates[s.type].inflabel,`${(s.inflation*100).toFixed(1)}% p.a.`],['Expected annual investment return',`${(s.ret*100).toFixed(1)}% p.a.`],
      ['Existing savings for this goal',money(s.existing)],['Current monthly contribution',`${money(s.monthly)}/mo`]
    ];
    if(s.futureLump>0){rows.push(['Future lump sum',money(s.futureLump)]);rows.push(['Years until future lump sum',`${s.futureLumpYear}`]);}
    return rows;
  }
  function reportScenarioResults(s){
    const ys=[Math.max(1,s.years-2),s.years,Math.min(50,s.years+2)].filter((y,i,a)=>a.indexOf(y)===i);
    return ys.map(y=>{const st=state(y);return{years:y,result:calc(st)};});
  }
  function buildGoalReportModel(s,c){
    const generatedAt=new Date();
    const scenarios=reportScenarioResults(s);
    const costPoints=chartYears(s.years).map(y=>({year:y,value:annualGrowth(s.today,s.inflation,y)}));
    const goalPoints=costPoints.map(p=>({year:p.year,value:p.value}));
    const planPoints=chartYears(s.years).map(y=>({year:y,value:y===0?s.existing:planAt(s,y)}));
    const fundingPct=c.futureCost>0?Math.max(0,c.projected/c.futureCost*100):0;
    const surplus=Math.max(0,c.projected-c.futureCost);
    const methodology={
      id:REPORT_CONFIG.METHODOLOGY_ID||'goal-planner-methodology-current',
      label:REPORT_CONFIG.METHODOLOGY_LABEL||'Current Goal Planner methodology',
      url:REPORT_CONFIG.METHODOLOGY_URL||'https://carrowmont.com/goal-planner/#methodology'
    };
    const spec={
      schemaVersion:REPORT_CONFIG.REPORT_SCHEMA_VERSION||'1.0',toolId:'goal-planner',toolName:'Carrowmont Goal Planner',generatedAt,
      locale:L.getLocale(),country:regionLabel(),currency:currencyCode(),methodology,
      inputs:{...s,goalTypeLabel:templates[s.type].label},
      calculatedResults:{...c,fundingPct,surplus},
      assumptions:reportAssumptions(s).map(([label,value])=>({label,value})),
      extras:{scenarios:scenarios.map(x=>({years:x.years,result:x.result})),costPoints,goalPoints,planPoints,priceGrowthMultiple:s.today>0?c.futureCost/s.today:1}
    };
    const model=REPORT_ENGINE?REPORT_ENGINE.createReportModel(spec):spec;
    window.__CARROWMONT_LAST_GOAL_REPORT_MODEL=model;
    return model;
  }
  function fundingSummary(s,c){
    const p=c.futureCost>0?Math.max(0,c.projected/c.futureCost*100):0;
    if(c.futureCost<=0)return['No goal amount','Enter a goal amount to build the estimate.'];
    if(p>=100)return['Funded under current plan',`Under these assumptions, the current plan reaches or exceeds the modelled goal by ${compact(Math.max(0,c.projected-c.futureCost))} at the selected goal date.`];
    return['Partly funded',`Under these assumptions, the current plan is projected to cover about ${Math.round(p)}% of the modelled goal, leaving a funding gap of ${compact(c.gap)} at the selected goal date.`];
  }
  function niceReportMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const n=v/p;const m=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;return m*p;}
  function reportMilestoneYears(years){
    const mid=Math.max(1,Math.round(years/2));
    return [0,mid,years].filter((y,i,a)=>a.findIndex(v=>Math.abs(v-y)<.001)===i).sort((a,b)=>a-b);
  }
  function renderReportCostChart(container,s){
    if(!container)return;
    const points=chartYears(s.years).map(y=>({year:y,value:annualGrowth(s.today,s.inflation,y)}));
    if(!points.length||s.today<=0){container.innerHTML='<div class="report-chart-empty">Enter a goal amount to draw this chart.</div>';return;}
    const W=720,H=210,LFT=72,R=20,T=18,B=36,iw=W-LFT-R,ih=H-T-B,maxVal=niceReportMax(Math.max(...points.map(p=>p.value))*1.08);
    const x=y=>LFT+(y/s.years)*iw, yy=v=>T+ih-(v/maxVal)*ih;
    const grid=[0,.25,.5,.75,1].map(q=>{const v=maxVal*q,py=yy(v);return `<line x1="${LFT}" x2="${W-R}" y1="${py}" y2="${py}" stroke="#dce7ec"/><text x="${LFT-9}" y="${py+3}" text-anchor="end" font-size="8" fill="#53687f">${esc(compact(v))}</text>`;}).join('');
    const poly=points.map(p=>`${x(p.year).toFixed(1)},${yy(p.value).toFixed(1)}`).join(' ');
    const area=`<polygon points="${x(0)},${H-B} ${poly} ${x(s.years)},${H-B}" fill="#0e827a" opacity="0.08"/>`;
    const milestoneYears=reportMilestoneYears(s.years);const milestones=milestoneYears.map((year,idx)=>{const p=points.reduce((best,v)=>Math.abs(v.year-year)<Math.abs(best.year-year)?v:best,points[0]);const px=x(p.year),py=yy(p.value);const title=p.year===0?'Today':Math.abs(p.year-s.years)<.001?`Goal date - year ${s.years}`:`Year ${Math.round(p.year)}`;const value=compact(p.value);const bw=118,bh=30;let bx=idx===milestoneYears.length-1?px-bw-8:px+8;let by=py-bh-8;by=Math.max(3,by);if(idx===1&&by<40)by=40;return `<g><circle cx="${px}" cy="${py}" r="4" fill="#0e827a" stroke="#fff" stroke-width="1.5"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#f3f9f8" stroke="#b8ddd7"/><text x="${bx+7}" y="${by+11}" font-size="7.4" font-weight="750" fill="#40566e">${esc(title)}</text><text x="${bx+7}" y="${by+23}" font-size="8.5" font-weight="850" fill="#0e827a">${esc(value)}</text></g>`;}).join('');
    const xTicks=[0,Math.round(s.years/2),s.years].filter((y,i,a)=>a.indexOf(y)===i).map(y=>{const anchor=y===0?'start':y===s.years?'end':'middle';const px=y===0?x(y)+2:y===s.years?x(y)-2:x(y);return `<text x="${px}" y="${H-10}" text-anchor="${anchor}" font-size="8" fill="#53687f">${y===0?'Today':y===s.years?`Goal - year ${s.years}`:`Year ${y}`}</text>`;}).join('');
    container.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="presentation" aria-hidden="true">${grid}${area}<polyline fill="none" stroke="#0e827a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${poly}"/>${milestones}${xTicks}</svg>`;
  }
  function renderReportSavingsChart(container,s,c){
    if(!container)return;
    const years=chartYears(s.years),goal=years.map(y=>({year:y,value:annualGrowth(s.today,s.inflation,y)})),plan=years.map(y=>({year:y,value:y===0?s.existing:planAt(s,y)}));
    if(!goal.length||s.today<=0){container.innerHTML='<div class="report-chart-empty">Enter a goal amount to draw this chart.</div>';return;}
    const W=720,H=220,LFT=72,R=20,T=30,B=36,iw=W-LFT-R,ih=H-T-B,maxVal=niceReportMax(Math.max(...goal.map(p=>p.value),...plan.map(p=>p.value))*1.08);
    const x=y=>LFT+(y/s.years)*iw, yy=v=>T+ih-(v/maxVal)*ih;
    const grid=[0,.25,.5,.75,1].map(q=>{const v=maxVal*q,py=yy(v);return `<line x1="${LFT}" x2="${W-R}" y1="${py}" y2="${py}" stroke="#dce7ec"/><text x="${LFT-9}" y="${py+3}" text-anchor="end" font-size="8" fill="#53687f">${esc(compact(v))}</text>`;}).join('');
    const gpoly=goal.map(p=>`${x(p.year).toFixed(1)},${yy(p.value).toFixed(1)}`).join(' '),ppoly=plan.map(p=>`${x(p.year).toFixed(1)},${yy(p.value).toFixed(1)}`).join(' ');
    const endGoal=goal[goal.length-1],endPlan=plan[plan.length-1],ex=x(s.years),gy=yy(endGoal.value),py=yy(endPlan.value),gap=Math.max(0,endGoal.value-endPlan.value);
    const legend='<line x1="85" x2="110" y1="12" y2="12" stroke="#123f5f" stroke-width="4"/><text x="118" y="15" font-size="8" fill="#40566e">Goal path</text><line x1="260" x2="285" y1="12" y2="12" stroke="#0e827a" stroke-width="4"/><text x="293" y="15" font-size="8" fill="#40566e">Your current plan</text>';
    let gapMark='';
    if(gap>0){const gx=ex-42,mid=(gy+py)/2;gapMark=`<line x1="${gx}" y1="${gy}" x2="${gx}" y2="${py}" stroke="#c18a22" stroke-width="1.7"/><line x1="${gx-5}" y1="${gy}" x2="${gx+5}" y2="${gy}" stroke="#c18a22" stroke-width="1.7"/><line x1="${gx-5}" y1="${py}" x2="${gx+5}" y2="${py}" stroke="#c18a22" stroke-width="1.7"/><rect x="${gx-130}" y="${mid-9}" width="122" height="18" rx="6" fill="#fff7e7" stroke="#ead6a7"/><text x="${gx-123}" y="${mid+3}" font-size="8" font-weight="800" fill="#7a5716">Funding gap ${esc(compact(gap))}</text>`;}
    const goalBoxY=Math.max(T+8,gy-38),planBoxY=Math.min(H-B-32,Math.max(T+44,py+8));
    const boxes=`<g><rect x="${ex-172}" y="${goalBoxY}" width="164" height="30" rx="6" fill="#f3f7fa" stroke="#cbd9e2"/><text x="${ex-164}" y="${goalBoxY+11}" font-size="7.4" font-weight="750" fill="#40566e">Goal at year ${s.years}</text><text x="${ex-164}" y="${goalBoxY+23}" font-size="8.5" font-weight="850" fill="#123f5f">${esc(compact(endGoal.value))}</text><rect x="${ex-172}" y="${planBoxY}" width="164" height="30" rx="6" fill="#eef8f6" stroke="#b9ddd7"/><text x="${ex-164}" y="${planBoxY+11}" font-size="7.4" font-weight="750" fill="#40566e">Current plan at year ${s.years}</text><text x="${ex-164}" y="${planBoxY+23}" font-size="8.5" font-weight="850" fill="#0e827a">${esc(compact(endPlan.value))}</text></g>`;
    const xTicks=[0,Math.round(s.years/2),s.years].filter((y,i,a)=>a.indexOf(y)===i).map(y=>{const anchor=y===0?'start':y===s.years?'end':'middle';const px=y===0?x(y)+2:y===s.years?x(y)-2:x(y);return `<text x="${px}" y="${H-10}" text-anchor="${anchor}" font-size="8" fill="#53687f">${y===0?'Today':y===s.years?`Goal - year ${s.years}`:`Year ${y}`}</text>`;}).join('');
    container.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="presentation" aria-hidden="true">${legend}${grid}<polyline fill="none" stroke="#123f5f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${gpoly}"/><polyline fill="none" stroke="#0e827a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${ppoly}"/><circle cx="${ex}" cy="${gy}" r="4" fill="#123f5f"/><circle cx="${ex}" cy="${py}" r="4" fill="#0e827a"/>${gapMark}${boxes}${xTicks}</svg>`;
  }
  function buildReport(s,c){
    const model=buildGoalReportModel(s,c),fundingPct=c.futureCost>0?Math.max(0,c.projected/c.futureCost*100):0,surplus=Math.max(0,c.projected-c.futureCost),status=fundingSummary(s,c);
    $('reportGenerated').textContent=`Generated ${model.generatedDisplay||model.generatedDate||''}`;
    $('reportGoalTypeBadge').textContent=templates[s.type].label;
    $('reportGoalName').textContent=s.name;
    $('reportGoalTiming').textContent=`${s.years} ${s.years===1?'year':'years'} to goal - ${regionLabel()} - ${currencyCode()}`;
    $('reportFutureCostLabel').textContent=`Estimated goal cost at goal date (future ${currencyCode()})`;
    $('reportFutureCost').textContent=compact(c.futureCost);
    $('reportFutureCostNote').textContent=s.type==='home'?'Models the selected down payment after price growth':s.type==='emergency'?'Models the selected months of essential expenses after inflation':'Based on today\'s cost and the selected inflation / price-growth assumption';
    $('reportProjectedPlanLabel').textContent=`Projected value of current plan at goal date (future ${currencyCode()})`;$('reportProjectedPlan').textContent=compact(c.projected);
    $('reportFundingStatus').textContent=status[0];$('reportExecutiveNote').textContent=status[1];
    $('reportTodayCost').textContent=compact(s.today);$('reportYears').textContent=`${s.years}`;$('reportFundingPct').textContent=`${Math.min(100,Math.round(fundingPct))}%`;
    $('reportGapLabel').textContent=surplus>0?`Projected surplus at goal date (future ${currencyCode()})`:`Funding gap at goal date (future ${currencyCode()})`;$('reportGap').textContent=surplus>0?compact(surplus):(c.gap>0?compact(c.gap):'No gap');
    $('reportMonthlyRequired').textContent=`${money(c.monthlyRequired)}/mo`;$('reportLumpToday').textContent=c.lumpToday>0?compact(c.lumpToday):'No additional lump sum';
    $('reportCurrentMonthly').textContent=`${money(s.monthly)}/mo`;$('reportNeededMonthly').textContent=`${money(c.monthlyRequired)}/mo`;$('reportAdditionalMonthly').textContent=c.additional>0?`${money(c.additional)}/mo`:`${money(0)}/mo`;
    const ribbon=$('reportAdditionalRibbon');if(ribbon){ribbon.classList.toggle('report-action-ribbon-gap',c.additional>0);ribbon.classList.toggle('report-action-ribbon-ok',!(c.additional>0));}
    $('reportActionNarrative').textContent=c.additional>0?`Under the entered assumptions, increasing the monthly contribution from ${money(s.monthly)} to about ${money(c.monthlyRequired)} may close the modelled funding gap by the selected goal date. This is an illustration, not a recommendation or guarantee.`:`Under the entered assumptions, the current monthly contribution is at or above the amount required by the model for the selected goal date. This is an illustration, not a recommendation or guarantee.`;
    const sourceRows=[['Future value of existing savings at goal date',money(c.existingFuture)],['Future value of current monthly contributions at goal date',money(c.monthlyFuture)]];
    if(s.futureLump>0)sourceRows.push(['Future value of entered future lump sum at goal date',money(c.lumpFuture)]);
    sourceRows.push([`Projected current-plan value at goal date (future ${currencyCode()})`,money(c.projected)]);
    $('reportFundingSources').innerHTML=sourceRows.map(([a,b],i)=>reportRow(a,b,i===sourceRows.length-1?'report-total-value':'')).join('');
    $('reportInflationImpact').innerHTML=[[`Goal amount today`,money(s.today)],[`Goal cost at selected date (future ${currencyCode()})`,money(c.futureCost)],['Nominal amount multiple',`${model.extras.priceGrowthMultiple.toFixed(2)}x`],[templates[s.type].inflabel,`${(s.inflation*100).toFixed(1)}% p.a.`]].map(([a,b])=>reportRow(a,b)).join('');
    $('reportInflationNarrative').textContent=`Today\'s money is the amount entered now. Future ${currencyCode()} is the modelled nominal amount at the selected goal date after applying the entered inflation or price-growth assumption.`;
    $('reportAssumptions').innerHTML=model.assumptions.map(a=>reportRow(a.label,a.value)).join('');
    $('reportScenarios').innerHTML=model.extras.scenarios.map(x=>{const current=x.years===s.years,fc=x.result.futureCost,proj=x.result.projected,p=fc>0?Math.min(100,Math.round(proj/fc*100)):0;return `<tr class="${current?'report-scenario-selected':''}"><td>${x.years} years${current?' (selected)':''}</td><td>${esc(money(fc))}</td><td>${esc(money(x.result.monthlyRequired))}</td><td>${p}%</td></tr>`;}).join('');
    $('reportScenarioNote').textContent=`Projected funding is based on the current plan - ${money(s.existing)} already saved plus ${money(s.monthly)}/month ongoing contribution${s.futureLump>0?` and the entered future lump sum of ${money(s.futureLump)}`:''}. It does not assume the monthly investment required shown in the previous column.`;
    $('reportMethodologyLabel').textContent=`Methodology: ${model.methodology.label||'Current Goal Planner methodology'}`;$('reportMethodologyUrl').textContent=(model.methodology.url||'https://carrowmont.com/goal-planner/#methodology').replace(/^https?:\/\//,'');
    renderReportCostChart($('reportCostChart'),s);
    const milestones=reportMilestoneYears(s.years),midYear=milestones.length>2?milestones[1]:s.years;
    $('reportCostChartStats').innerHTML=[[`Today`,compact(s.today)],[`Year ${Math.round(midYear)}`,compact(annualGrowth(s.today,s.inflation,midYear))],[`Goal date - year ${s.years}`,compact(c.futureCost)]].map(([label,value])=>`<div class="report-chart-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
    $('reportCostChartNote').textContent=`How to read this chart: the left edge is today, so ${compact(s.today)} is a current amount. Every later point is the modelled nominal future-${currencyCode()} amount at that year. By year ${s.years}, the goal is estimated at ${compact(c.futureCost)} under the entered ${(s.inflation*100).toFixed(1)}% annual inflation / price-growth assumption.`;
    renderReportSavingsChart($('reportSavingsChart'),s,c);
    $('reportSavingsChartStats').innerHTML=[[`Goal at year ${s.years}`,compact(c.futureCost)],[`Current plan at year ${s.years}`,compact(c.projected)],[surplus>0?'Projected surplus':'Funding gap',compact(surplus>0?surplus:c.gap)],['Projected funding from current plan',`${Math.min(100,Math.round(fundingPct))}%`]].map(([label,value])=>`<div class="report-chart-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
    $('reportSavingsChartNote').textContent=`How to read this chart: the blue line is the modelled goal-cost path. The green line is the value of your current plan - existing savings, current monthly contributions and any entered future lump sum - before any increase. At the selected goal date the current plan is projected at ${compact(c.projected)} versus a goal of ${compact(c.futureCost)}, which is about ${Math.min(100,Math.round(fundingPct))}% funded${surplus>0?` with a projected surplus of ${compact(surplus)}`:` with a funding gap of ${compact(c.gap)}`}.`;
    return model;
  }
  async function copySummary(){
    const s=state(),c=calc(s),m=buildGoalReportModel(s,c),p=c.futureCost>0?Math.min(100,Math.round(c.projected/c.futureCost*100)):0;
    const txt=[`CARROWMONT GOAL PLANNING SUMMARY`,``, `Goal: ${s.name}`,`Goal type: ${templates[s.type].label}`,`Country / region: ${regionLabel()}`,`Currency: ${currencyCode()}`,`Years to goal: ${s.years}`,`Goal cost today: ${money(s.today)}`,`Inflation / price-growth assumption: ${(s.inflation*100).toFixed(1)}%`,`Expected investment return: ${(s.ret*100).toFixed(1)}%`,``, `Estimated goal cost at goal date: ${money(c.futureCost)}`,`Projected value of current plan at goal date: ${money(c.projected)}`,`Projected funding from current plan: ${p}%`,`Funding gap: ${money(c.gap)}`,`Current monthly contribution: ${money(s.monthly)}`,`Total monthly investment required: ${money(c.monthlyRequired)}`,`Additional monthly investment required: ${money(c.additional)}`,`Alternative additional lump sum today: ${money(c.lumpToday)}`,``, `Calculated using ${m.methodology.label||'the current Goal Planner methodology'}.`,`Illustrative estimate only. Actual inflation, investment returns, taxes, fees and future prices may differ.`,`carrowmont.com`].join('\n');
    try{await navigator.clipboard.writeText(txt);els.copyBtn.textContent='Copied';setTimeout(()=>els.copyBtn.textContent='Copy Summary',1400);}catch(_){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
  }
  async function downloadGoalReport(){
    const status=document.getElementById('reportDownloadStatus');
    if(!PDF_EXPORT||!GOAL_PDF){
      if(status)status.textContent='The report could not be generated. Please refresh the page and try again.';
      return;
    }
    const s=state(),c=calc(s);
    const model=buildReport(s,c);
    els.reportBtn.disabled=true;els.reportBtn.setAttribute('aria-busy','true');
    if(status)status.textContent='Preparing your report...';
    try{
      const canvases=await GOAL_PDF.render(els.printReport);
      const base=REPORT_ENGINE?REPORT_ENGINE.filename('goal-planning-report',new Date(model.generatedAt||Date.now())):`goal-planning-report-${model.generatedDate||''}`;
      await PDF_EXPORT.downloadCanvases(canvases,{filename:`${base}.pdf`,quality:.94});
      if(status)status.textContent='Report has been downloaded.';
    }catch(err){
      console.error('Goal report PDF generation failed',err);
      if(status)status.textContent='The report could not be generated. Please refresh the page and try again.';
    }finally{
      els.reportBtn.disabled=false;els.reportBtn.removeAttribute('aria-busy');
    }
  }
  els.copyBtn.addEventListener('click',copySummary);
  els.reportBtn.addEventListener('click',downloadGoalReport);


  populateLocale();buildGoalTypes();showDynamic();
  if(usesIndiaDemoDefaults()) render(); else resetMoneyForLocale();
})();
