(() => {
  'use strict';

  const P = () => window.CarrowmontPdfExport;
  const S = () => window.CarrowmontReportStandard;
  const C = {
    ink:'#13233a', navy:'#123f5f', navy2:'#174e70', teal:'#0e827a', tealDark:'#086b64', muted:'#4a5e75',
    line:'#dce4ea', pale:'#e6f5f3', note:'#f3f9f8', action:'#f5fbfa', amber:'#fff2d9', amberLine:'#e7c77e', amberInk:'#5c4312',
    white:'#ffffff', light:'#f8fbfc', selected:'#e9f6f3', selected2:'#dff1ed'
  };
  const W=794,H=1123,M=38,CW=W-M*2;

  function q(root, sel){ return root.querySelector(sel); }
  function txt(root, sel){ return (q(root,sel)?.textContent||'').replace(/\s+/g,' ').trim(); }
  function directText(el){ return el ? Array.from(el.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(' ').replace(/\s+/g,' ').trim() : ''; }
  function kvRows(root, sel){ return Array.from(q(root,sel)?.querySelectorAll('tr')||[]).map(tr=>({label:txt(tr,'th'),value:txt(tr,'td')})); }
  function gridCards(root, sel){ return Array.from(q(root,sel)?.children||[]).map(el=>({label:txt(el,'span'),value:txt(el,'strong')})); }
  function scenarioRows(root){ return Array.from(q(root,'#reportScenarios')?.querySelectorAll('tr')||[]).map(tr=>({values:Array.from(tr.children).map(td=>(td.textContent||'').replace(/\s+/g,' ').trim()),selected:tr.classList.contains('report-scenario-selected')})); }
  function page(){ return P().createPage({width:W,height:H,scale:2.25,background:'#fff'}); }
  function setFont(ctx,size,weight=400,color=C.ink){ctx.font=`${weight} ${size}px Arial`;ctx.fillStyle=color;ctx.textAlign='left';}
  function measure(ctx,text,size,weight=400){setFont(ctx,size,weight);return ctx.measureText(text).width;}
  function card(ctx,x,y,w,h,fill=C.white,stroke=C.line,r=9){P().roundRect(ctx,x,y,w,h,r,fill,stroke,1);}
  function vline(ctx,x,y1,y2,color,width=1){P().line(ctx,x,y1,x,y2,color,width);}
  function hline(ctx,x1,x2,y,color=C.line,width=1){P().line(ctx,x1,y,x2,y,color,width);}

  function drawBadge(ctx,textValue,x,y){
    const w=Math.max(74,measure(ctx,textValue,9,800)+18); card(ctx,x,y,w,22,C.pale,'#c9e3df',11); P().text(ctx,textValue,x+9,y+14,{size:9,weight:800,color:C.teal});
  }
  function drawHeader(ctx,root){
    P().text(ctx,'CARROWMONT',M,47,{size:13,weight:900,color:C.teal});
    P().text(ctx,'Goal Planning Report',M,75,{size:30,weight:850,color:C.ink});
    P().text(ctx,'Prepared from the Carrowmont Goal Planner',M,96,{size:11.5,weight:400,color:C.muted});
    drawBadge(ctx,txt(root,'#reportGoalTypeBadge'),M,108);
    const rx=M+CW;
    P().text(ctx,txt(root,'#reportGenerated'),rx,45,{size:10.5,weight:800,color:C.ink,align:'right'});
    P().text(ctx,'Educational planning report',rx,63,{size:10.5,weight:400,color:C.muted,align:'right'});
    P().text(ctx,'carrowmont.com',rx,81,{size:10.5,weight:400,color:C.muted,align:'right'});
    hline(ctx,M,M+CW,142,'#153c5a',2);
  }
  function drawGoalTitle(ctx,root){
    P().text(ctx,'YOUR GOAL',M,168,{size:8.5,weight:900,color:C.teal});
    P().text(ctx,txt(root,'#reportGoalName'),M,193,{size:20,weight:850,color:C.ink});
    hline(ctx,M,M+CW,205,'#cfd7dd',1);
    P().text(ctx,txt(root,'#reportGoalTiming'),M,218,{size:10,weight:400,color:C.muted});
  }
  function drawHero(ctx,root){
    const y=241; card(ctx,M,y,CW,162,C.navy,null,14);
    const lx=M+18,ly=y+19,lw=400,lh=122; card(ctx,lx,ly,lw,lh,C.navy2,null,13);
    const rx=lx+lw+17,rw=CW-18-17-lw-18; card(ctx,rx,ly,rw,lh,C.pale,'#c9e3df',13);
    P().wrappedText(ctx,txt(root,'#reportFutureCostLabel'),lx+18,ly+29,lw-36,{size:10.5,lineHeight:13,weight:400,color:'#d8e5ee',maxLines:2});
    P().text(ctx,txt(root,'#reportFutureCost'),lx+18,ly+69,{size:30,weight:850,color:C.white});
    P().wrappedText(ctx,txt(root,'#reportFutureCostNote'),lx+18,ly+96,lw-36,{size:9.2,lineHeight:12,weight:400,color:'#d8e5ee',maxLines:2});
    P().wrappedText(ctx,txt(root,'#reportProjectedPlanLabel'),rx+18,ly+28,rw-36,{size:10.5,lineHeight:13,weight:400,color:'#29445c',maxLines:2});
    P().text(ctx,txt(root,'#reportProjectedPlan'),rx+18,ly+75,{size:29,weight:850,color:C.ink});
    P().text(ctx,txt(root,'#reportFundingStatus'),rx+18,ly+104,{size:9.3,weight:400,color:C.muted});
  }
  function drawExecutive(ctx,root){
    const y=421,h=51; ctx.fillStyle=C.note;ctx.fillRect(M,y,CW,h);ctx.fillStyle=C.teal;ctx.fillRect(M,y,3,h);
    P().wrappedText(ctx,txt(root,'#reportExecutiveNote'),M+14,y+22,CW-28,{size:10.2,lineHeight:15,weight:400,color:'#344a61',maxLines:2});
  }
  function drawSummary(ctx,root){
    const cards=gridCards(root,'.report-summary-grid'),gap=8,col=(CW-gap*2)/3,h=59,y0=487;
    cards.forEach((d,i)=>{const row=Math.floor(i/3),c=i%3,x=M+c*(col+gap),y=y0+row*(h+8);card(ctx,x,y,col,h,C.white,C.line,9);P().wrappedText(ctx,d.label,x+10,y+17,col-20,{size:8.8,lineHeight:11,weight:400,color:'#4d6177',maxLines:2});P().text(ctx,d.value,x+10,y+48,{size:13,weight:850,color:C.ink});});
  }
  function drawAction(ctx,root){
    const y=626,h=208; card(ctx,M,y,CW,h,C.action,'#cfe5e1',10);
    P().text(ctx,'WHAT YOU CAN CHANGE',M+12,y+19,{size:8.5,weight:900,color:C.teal});
    P().text(ctx,'Monthly investment required by the model',M+12,y+39,{size:15.5,weight:850,color:C.ink});
    hline(ctx,M+12,M+319,y+49,'#c8d3d9',1);
    P().text(ctx,'Same assumptions - selected goal date',M+CW-12,y+18,{size:9,weight:400,color:C.muted,align:'right'});
    const current=txt(root,'#reportCurrentMonthly'),needed=txt(root,'#reportNeededMonthly');
    const bx=M+12,by=y+65,bgap=10,bw=(CW-24-bgap)/2,bh=57;
    [
      ['Current monthly contribution',current,bx],['Total monthly investment required from now',needed,bx+bw+bgap]
    ].forEach(([label,value,x])=>{card(ctx,x,by,bw,bh,C.white,'#dce8e6',8);P().wrappedText(ctx,label,x+10,by+19,bw-20,{size:9,lineHeight:11,weight:400,color:'#4d6177',maxLines:2});P().text(ctx,value,x+10,by+47,{size:13,weight:850,color:C.ink});});
    const ribbon=q(root,'#reportAdditionalRibbon'),isGap=ribbon?.classList.contains('report-action-ribbon-gap');const ry=by+66,rh=49;
    card(ctx,bx,ry,CW-24,rh,isGap?C.amber:'#e8f6f2',isGap?C.amberLine:'#b7ded4',9);
    P().text(ctx,'Additional monthly investment required',bx+12,ry+19,{size:9.5,weight:850,color:isGap?C.amberInk:'#075f58'});
    P().text(ctx,'Key action under the selected assumptions',bx+12,ry+35,{size:8.4,weight:400,color:isGap?'#745c27':'#3e6d68'});
    P().text(ctx,txt(root,'#reportAdditionalMonthly'),bx+CW-48,ry+31,{size:18,weight:850,color:isGap?C.amberInk:'#075f58',align:'right'});
    P().wrappedText(ctx,txt(root,'#reportActionNarrative'),bx,ry+69,CW-24,{size:8.9,lineHeight:12.6,weight:400,color:C.muted,maxLines:2});
  }
  function drawKvTable(ctx,rows,x,y,w,opts={}){
    const rowH=opts.rowH||28,labelW=opts.labelW||w*.64;let yy=y;
    rows.forEach((r,i)=>{const h=opts.dynamic?(r.label.length>42?34:rowH):rowH;hline(ctx,x,x+w,yy+h,C.line,1);P().wrappedText(ctx,r.label,x+6,yy+17,labelW-12,{size:opts.size||9.3,lineHeight:11,weight:600,color:'#4b5f76',maxLines:2});P().text(ctx,r.value,x+w-6,yy+18,{size:opts.valueSize||9.6,weight:850,color:i===rows.length-1&&opts.lastTeal?C.tealDark:C.ink,align:'right'});yy+=h;});return yy;
  }
  function drawTwoCol(ctx,root){
    const y=860,gap=18,w=(CW-gap)/2,left=M,right=M+w+gap;
    P().wrappedText(ctx,'Where the projected current-plan value comes from',left,y,w,{size:15.5,lineHeight:18,weight:850,color:C.ink,maxLines:2});
    hline(ctx,left,left+w,y+42,'#c8d0d6',1);P().text(ctx,'Future money at the goal date unless noted',left,y+57,{size:8.5,weight:400,color:C.muted});
    drawKvTable(ctx,kvRows(root,'#reportFundingSources'),left,y+67,w,{rowH:30,dynamic:true,size:9.1,valueSize:9.5,lastTeal:true});
    P().wrappedText(ctx,'Impact of inflation / price growth',right,y,w,{size:15.5,lineHeight:18,weight:850,color:C.ink,maxLines:2});
    hline(ctx,right,right+w,y+42,'#c8d0d6',1);P().wrappedText(ctx,"Compares today's amount with the nominal amount at the goal date",right,y+57,w,{size:8.5,lineHeight:11,weight:400,color:C.muted,maxLines:2});
    const end=drawKvTable(ctx,kvRows(root,'#reportInflationImpact'),right,y+75,w,{rowH:28,dynamic:false,size:9.1,valueSize:9.5});
    P().wrappedText(ctx,txt(root,'#reportInflationNarrative'),right,end+15,w,{size:8.5,lineHeight:11.5,weight:400,color:C.muted,maxLines:3});
  }

  function drawAssumptions(ctx,root){
    const y=42; card(ctx,M,y,CW,31,C.navy,null,8);P().text(ctx,'Plan assumptions',M+12,y+21,{size:14,weight:850,color:C.white});
    const rows=kvRows(root,'#reportAssumptions');let yy=y+48;rows.forEach(r=>{const h=25;hline(ctx,M,M+CW,yy+h,C.line,1);P().text(ctx,r.label,M+6,yy+17,{size:9.5,weight:600,color:'#4b5f76'});P().text(ctx,r.value,M+CW-6,yy+17,{size:9.6,weight:850,color:C.ink,align:'right'});yy+=h;});return yy;
  }
  function drawScenario(ctx,root,y){
    P().text(ctx,'Goal-date comparison',M,y,{size:16,weight:850,color:C.ink});hline(ctx,M,M+CW,y+14,'#c8d0d6',1);
    const top=y+23,headerH=44,rowH=36,noteH=50;const widths=[112,202,205,199];const xs=[M,M+112,M+314,M+519];
    ctx.fillStyle='#f3f7f9';ctx.fillRect(M,top,CW,headerH);ctx.fillStyle='#eaf5f3';ctx.fillRect(xs[3],top,widths[3],headerH);
    const headers=[['GOAL TIMING',''],['GOAL COST','(future money at that date)'],['MONTHLY INVESTMENT REQUIRED','(from now)'],['PROJECTED FUNDING','(from current plan before any increase)']];
    headers.forEach((h,i)=>{const x=xs[i],w=widths[i],color=i===3?C.tealDark:'#40566e';P().text(ctx,h[0],i===0?x+7:x+w/2,top+18,{size:8.4,weight:850,color,align:i===0?'left':'center'});if(h[1])P().wrappedText(ctx,h[1],i===0?x+7:x+w/2,top+32,w-14,{size:7.3,lineHeight:8.5,weight:650,color,align:i===0?'left':'center',maxLines:2});});
    let yy=top+headerH;const rows=scenarioRows(root);rows.forEach(r=>{if(r.selected){ctx.fillStyle=C.selected;ctx.fillRect(M,yy,CW,rowH);ctx.fillStyle=C.selected2;ctx.fillRect(xs[3],yy,widths[3],rowH);ctx.fillStyle=C.teal;ctx.fillRect(M,yy,4,rowH);}else{ctx.fillStyle='#f5fbfa';ctx.fillRect(xs[3],yy,widths[3],rowH);}hline(ctx,M,M+CW,yy+rowH,C.line,1);r.values.forEach((v,i)=>{P().wrappedText(ctx,v,i===0?xs[i]+9:xs[i]+widths[i]/2,yy+22,widths[i]-14,{size:9.4,lineHeight:11,weight:r.selected?850:700,color:C.ink,align:i===0?'left':'center',maxLines:2});});yy+=rowH;});
    ctx.fillStyle=C.note;ctx.fillRect(M,yy+10,CW,noteH);ctx.fillStyle=C.teal;ctx.fillRect(M,yy+10,3,noteH);P().wrappedText(ctx,txt(root,'#reportScenarioNote'),M+14,yy+28,CW-28,{size:8.8,lineHeight:12,weight:400,color:'#344b62',maxLines:3});return yy+10+noteH;
  }
  function drawSectionHeading(ctx,title,y){P().text(ctx,title,M,y,{size:16,weight:850,color:C.ink});hline(ctx,M,M+CW,y+13,'#c8d0d6',1);}
  function drawStats(ctx,items,y,cols){const gap=8,w=(CW-gap*(cols-1))/cols,h=58;items.forEach((it,i)=>{const x=M+i*(w+gap);card(ctx,x,y,w,h,C.light,'#d9e3e9',7);P().wrappedText(ctx,it.label,x+9,y+17,w-18,{size:8,lineHeight:10,weight:400,color:'#4f6379',maxLines:2});P().text(ctx,it.value,x+9,y+47,{size:11.2,weight:850,color:C.ink});});return y+h;}
  function statItems(root,sel){return Array.from(q(root,sel)?.children||[]).map(el=>({label:txt(el,'span'),value:txt(el,'strong')}));}
  function drawNote(ctx,textValue,y,h=62){ctx.fillStyle=C.note;ctx.fillRect(M,y,CW,h);ctx.fillStyle=C.teal;ctx.fillRect(M,y,3,h);P().wrappedText(ctx,textValue,M+14,y+18,CW-28,{size:8.8,lineHeight:12.2,weight:400,color:'#344b62',maxLines:4});}
  async function drawCostChart(ctx,root,y){
    P().text(ctx,'Goal cost path',M,y,{size:12,weight:750,color:'#243b55'});const cy=y+16,ch=216;card(ctx,M,cy,CW,ch,C.white,'#e1e7ec',9);await P().drawSvgElement(ctx,q(root,'#reportCostChart svg'),M+4,cy+4,CW-8,ch-8);const sy=cy+ch+8;const end=drawStats(ctx,statItems(root,'#reportCostChartStats'),sy,3);drawNote(ctx,txt(root,'#reportCostChartNote'),end+8,62);return end+70;
  }
  async function drawSavingsChart(ctx,root,y){
    P().text(ctx,'Current plan vs goal path',M,y,{size:15,weight:850,color:C.ink});const cy=y+14,ch=230;card(ctx,M,cy,CW,ch,C.white,'#e1e7ec',9);await P().drawSvgElement(ctx,q(root,'#reportSavingsChart svg'),M+4,cy+4,CW-8,ch-8);const sy=cy+ch+8;const end=drawStats(ctx,statItems(root,'#reportSavingsChartStats'),sy,4);drawNote(ctx,txt(root,'#reportSavingsChartNote'),end+8,72);return end+80;
  }
  function reportGuidePage(root){
    const methodLabel=txt(root,'#reportMethodologyLabel').replace(/^Methodology:\s*/i,'')||'Current Goal Planner methodology';
    const methodUrl=txt(root,'#reportMethodologyUrl')||'carrowmont.com/goal-planner/#methodology';
    return S().guidePage({
      reportTitle:'Goal Planning Report',
      preparedFrom:'Carrowmont Goal Planner',
      howToRead:'Start with the estimated future goal cost and the projected value of the current plan. Then review the funding gap, the modelled monthly investment required and the alternative scenarios for reaching the same goal.',
      methodology:[
        ['Future goal cost','The amount entered today is grown using the selected inflation or price-growth assumption. If a future target is entered directly, that amount is used instead.'],
        ['Current-plan projection','Existing savings, current monthly contributions and any entered future lump sum are projected using the selected investment-return assumption.'],
        ['Funding gap','The difference between the modelled future goal cost and the projected value of the current plan at the selected goal date.'],
        ['Required monthly investment','The modelled starting monthly contribution from now that would reach the selected goal date under the entered assumptions.'],
        ['Alternative lump sum','An illustrative additional amount today that may close the same modelled gap under the selected investment-return assumption.']
      ],
      terminology:[
        ['Future goal cost','The nominal amount estimated to be needed at the goal date.'],
        ['Projected current plan','The modelled future value of existing savings plus the contributions and lump sums entered.'],
        ['Projected funding','The proportion of the future goal cost covered by the current plan before increasing the monthly contribution.'],
        ['Funding gap','The amount by which the projected current plan falls short of the modelled goal cost.'],
        ['Goal-date comparison','Alternative goal dates shown with their corresponding future cost, monthly investment requirement and projected funding.']
      ],
      assumptions:'Inflation and investment returns are constant modelling assumptions. Country and currency selection control formatting and do not perform foreign-exchange conversion.',
      disclaimer:'This report is an educational planning illustration based entirely on the information and assumptions entered. It does not predict inflation, investment returns, taxes, fees or future prices and is not individualized investment, financial, tax, legal, accounting or insurance advice. Actual outcomes can differ materially.',
      methodologyMeta:methodLabel,
      methodologyUrl:methodUrl,
      contact:'contact@carrowmont.com'
    });
  }

  function toolsPage(){
    return S().continuePlanningPage({currentTool:'goal',intro:`Your goal plan is one part of a broader financial plan. Try these other Carrowmont tools to explore retirement, ${S().investmentIdentity().planningPhrase}, financial independence and the effect of inflation.`});
  }

  async function render(reportRoot){
    if(!reportRoot)throw new Error('Goal report content is unavailable.');
    const p1=page(),c1=p1.ctx;drawHeader(c1,reportRoot);drawGoalTitle(c1,reportRoot);drawHero(c1,reportRoot);drawExecutive(c1,reportRoot);drawSummary(c1,reportRoot);drawAction(c1,reportRoot);drawTwoCol(c1,reportRoot);
    const p2=page(),c2=p2.ctx;let y=drawAssumptions(c2,reportRoot)+35;y=drawScenario(c2,reportRoot,y)+34;drawSectionHeading(c2,'Goal planning visuals',y);P().wrappedText(c2,'These charts show how the goal cost may change and how the current savings plan compares with the goal path.',M,y+29,CW,{size:9.2,lineHeight:12,weight:400,color:C.muted,maxLines:2});await drawCostChart(c2,reportRoot,y+55);
    const p3=page(),c3=p3.ctx;await drawSavingsChart(c3,reportRoot,46);
    return [p1.canvas,p2.canvas,p3.canvas,reportGuidePage(reportRoot),toolsPage()];
  }

  window.CarrowmontGoalPdfRenderer={render};
})();
