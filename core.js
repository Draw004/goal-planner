(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CarrowmontGoalCore=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';

  const VERSION='GOAL-CORE-1.0';
  const FREQUENCY_PERIODS=Object.freeze({weekly:52,biweekly:26,semimonthly:24,fourweekly:13,monthly:12});
  function periodsPerYear(key){return FREQUENCY_PERIODS[key]||12;}
  function annualGrowth(v,r,y){return v*Math.pow(1+r,y);}
  function periodicRate(annual,frequency='monthly'){const periods=periodsPerYear(frequency);return annual===0?0:Math.pow(1+annual,1/periods)-1;}
  function annuityFactor(annual,years,frequency='monthly'){const periods=periodsPerYear(frequency),n=Math.max(1,Math.round(years*periods)),rp=periodicRate(annual,frequency);return rp===0?n:(Math.pow(1+rp,n)-1)/rp;}
  function calculate(s={}){
    const futureCost=annualGrowth(s.today,s.inflation,s.years);const existingFuture=annualGrowth(s.existing,s.ret,s.years);const af=annuityFactor(s.ret,s.years,s.contributionFrequency);const monthlyFuture=s.monthly*af;const lumpFuture=s.futureLump>0?annualGrowth(s.futureLump,s.ret,Math.max(0,s.years-s.futureLumpYear)):0;const projected=existingFuture+monthlyFuture+lumpFuture;const gap=Math.max(0,futureCost-projected);const monthlyRequired=Math.max(0,(futureCost-existingFuture-lumpFuture)/af);const additional=Math.max(0,monthlyRequired-s.monthly);const lumpToday=gap/Math.pow(1+s.ret,s.years);const funding=futureCost>0?projected/futureCost:0;return{futureCost,existingFuture,monthlyFuture,lumpFuture,projected,gap,monthlyRequired,additional,lumpToday,funding,af};
  }
  return Object.freeze({VERSION,FREQUENCY_PERIODS,periodsPerYear,annualGrowth,periodicRate,annuityFactor,calculate});
});
