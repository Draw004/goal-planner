(function(){
  "use strict";
  const L=window.CarrowmontLocale;
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
  function resetAll(){
    goalType='education';els.existingSavings.value=500000;els.monthlyContribution.value=8000;els.returnRate.value=10;els.futureLump.value=0;els.futureLumpYear.value=0;applyTemplate('education',true);
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
    els.snapshotTitle.textContent=s.name;els.timePill.textContent=`${s.years} ${s.years===1?'year':'years'} to goal`;els.futureCost.textContent=compact(c.futureCost);els.projectedPlan.textContent=compact(c.projected);els.fundingGap.textContent=c.gap>0?compact(c.gap):'No gap';els.totalMonthly.textContent=`${money(c.monthlyRequired)}/mo`;els.additionalMonthly.textContent=c.additional>0?`${money(c.additional)}/mo`:'No increase indicated';els.lumpToday.textContent=c.lumpToday>0?money(c.lumpToday):'No additional lump sum';
    const fundPct=Math.min(999,c.funding*100);els.fundingPct.textContent=pct(Math.min(100,fundPct));els.fundingBar.style.width=`${Math.min(100,fundPct)}%`;els.fundingText.textContent=c.funding>=1?`Under these assumptions, your current plan reaches or exceeds the modelled goal.`:`Your current savings plan is projected to cover about ${Math.round(fundPct)}% of the modelled goal.`;
    els.todayCostCard.textContent=compact(s.today);els.futureCostCard.textContent=compact(c.futureCost);els.projectedCard.textContent=compact(c.projected);els.additionalCard.textContent=c.additional>0?`${money(c.additional)}/mo`:`${money(0)}/mo`;
    renderInsights(s,c);renderScenarios(s);renderCostChart(s);renderSavingsChart(s);buildReport(s,c);
  }
  function renderInsights(s,c){
    const increase=s.today>0?(c.futureCost/s.today-1)*100:0;els.insightInflation.textContent=`+${Math.round(increase)}%`;els.insightInflationText.textContent=`At ${ (s.inflation*100).toFixed(1)}% annual inflation, the modelled cost grows from ${compact(s.today)} today to ${compact(c.futureCost)} in ${s.years} years.`;
    els.insightFunding.textContent=`${Math.min(100,Math.round(c.funding*100))}% funded`;els.insightFundingText.textContent=`Existing savings and current contributions are projected to reach ${compact(c.projected)} by the goal date.`;
    els.insightContribution.textContent=c.additional>0?`+${money(c.additional)}/mo`:'No increase indicated';els.insightContributionText.textContent=c.additional>0?`On top of your current ${money(s.monthly)}/month contribution, under these assumptions.`:'Your current contribution is enough to meet or exceed the modelled target under these assumptions.';
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
  async function copySummary(){const s=state(),c=calc(s);const txt=[`CARROWMONT GOAL PLAN SUMMARY`,``, `Goal: ${s.name}`,`Country / region: ${L.getProfile().label}`,`Currency: ${L.getCurrency()}`,`Years to goal: ${s.years}`,`Goal cost today: ${money(s.today)}`,`Inflation assumption: ${(s.inflation*100).toFixed(1)}%`,`Expected investment return: ${(s.ret*100).toFixed(1)}%`,``, `Estimated future goal cost: ${money(c.futureCost)}`,`Projected value of current plan: ${money(c.projected)}`,`Funding gap: ${money(c.gap)}`,`Total monthly investment required: ${money(c.monthlyRequired)}`,`Additional monthly investment indicated: ${money(c.additional)}`,``, `Illustrative estimate only. Actual inflation, investment returns, taxes and future prices may differ.`,`carrowmont.com`].join('\n');try{await navigator.clipboard.writeText(txt);els.copyBtn.textContent='Copied';setTimeout(()=>els.copyBtn.textContent='Copy summary',1400);}catch(_){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}}
  els.copyBtn.addEventListener('click',copySummary);
  function buildReport(s,c){
    const generated=new Intl.DateTimeFormat(L.getLocale(),{dateStyle:'medium'}).format(new Date());
    const specific=s.type==='home'?`<tr><td>Property value today</td><td>${money(Math.max(0,num(els.propertyValue)))}</td></tr><tr><td>Down payment target</td><td>${num(els.downPayment,20).toFixed(0)}%</td></tr>`:s.type==='emergency'?`<tr><td>Essential monthly expenses</td><td>${money(Math.max(0,num(els.monthlyExpenses)))}</td></tr><tr><td>Emergency-fund target</td><td>${num(els.expenseMonths,6).toFixed(0)} months</td></tr>`:'';
    const futureLumpRows=s.futureLump>0?`<tr><td>Future lump sum</td><td>${money(s.futureLump)}</td></tr><tr><td>Years until future lump sum</td><td>${s.futureLumpYear}</td></tr>`:'';
    els.printReport.innerHTML=`<div class="report-brand"><strong>CARROWMONT</strong><br>Goal Planning Report</div><h1>${esc(s.name)}</h1><p>${templates[s.type].label} · ${s.years} years to goal · ${L.getProfile().label} · ${L.getCurrency()} · Generated ${generated}</p><div class="report-hero"><span>Estimated future goal cost</span><strong>${money(c.futureCost)}</strong><span>Based on ${money(s.today)} in today’s money and ${(s.inflation*100).toFixed(1)}% annual inflation / price growth</span></div><h2>Funding snapshot</h2><table><tbody><tr><td>Goal cost in today’s money</td><td>${money(s.today)}</td></tr><tr><td>Existing savings</td><td>${money(s.existing)}</td></tr><tr><td>Current monthly contribution</td><td>${money(s.monthly)}</td></tr>${futureLumpRows}<tr><td>Projected current-plan value</td><td>${money(c.projected)}</td></tr><tr><td>Funding gap</td><td>${money(c.gap)}</td></tr><tr><td>Total monthly investment required</td><td>${money(c.monthlyRequired)}</td></tr><tr><td>Additional monthly investment indicated</td><td>${money(c.additional)}</td></tr><tr><td>Alternative additional lump sum today</td><td>${money(c.lumpToday)}</td></tr></tbody></table><h2>Assumptions</h2><table><tbody><tr><td>Goal type</td><td>${templates[s.type].label}</td></tr>${specific}<tr><td>Years until goal</td><td>${s.years}</td></tr><tr><td>Inflation / price-growth assumption</td><td>${(s.inflation*100).toFixed(1)}%</td></tr><tr><td>Investment-return assumption</td><td>${(s.ret*100).toFixed(1)}%</td></tr></tbody></table><div class="note"><strong>Educational illustration only.</strong> Results depend entirely on the assumptions entered. Actual inflation, returns, taxes, fees and future prices may differ materially. This is not individualized financial, tax, legal or investment advice.</div>`;
  }
  els.reportBtn.addEventListener('click',()=>{const old=document.title;document.title=`Carrowmont Goal Planning Report - ${state().name}`;requestAnimationFrame(()=>requestAnimationFrame(()=>{window.print();setTimeout(()=>document.title=old,500);}));});

  populateLocale();buildGoalTypes();showDynamic();render();
})();
