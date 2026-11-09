// node tests.cjs  — engine unit tests (+ browser e2e when Playwright is available)
const fs=require('fs'),path=require('path'),vm=require('vm');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const src=html.slice(html.indexOf('/*ENGINE-START*/'),html.indexOf('/*ENGINE-END*/'));
const sb={module:{}};vm.runInNewContext(src+';module.exports=PFE;',sb);const E=sb.module.exports;
let pass=0,fail=0;function ok(c,m){if(c)pass++;else{fail++;console.log('FAIL',m)}}
function st(p,k){return p.drugs.find(d=>d.key===k).status}
function has(arr,s){return arr.some(x=>x.includes(s))}

// PPF
let r=E.ppf({f0:75,f1:70,d0:55,d1:45,sym:false,radio:false});ok(r.phys&&r.count===1,'FVC+DLCO = one domain');
r=E.ppf({f0:68.3,f1:63.3});ok(r.phys&&r.fd===5,'5.0 pp float edge');
r=E.ppf({f0:75,f1:71,d0:55,d1:46});ok(!r.phys,'4 pp / 9 pp not physiologic');
r=E.ppf({f0:null,f1:70,sym:true,radio:true});ok(r.count===2&&r.fd===null,'missing FVC');

// NHI initial
ok(E.nhi({type:'ipf',fvc:65,dlco:49,hrct:1,spec:1,sym:1}).ok,'IPF 65 ok');
ok(!E.nhi({type:'ipf',fvc:48,dlco:49,hrct:1,spec:1,sym:1}).ok,'IPF <50');
ok(E.nhi({type:'ipf',fvc:85,dlco:70,hrct:1,spec:1,sym:1}).ok,'IPF >80 with symptoms');
ok(!E.nhi({type:'ipf',fvc:85,dlco:70,hrct:1,spec:1,sym:0}).ok,'IPF >80 no symptoms');
ok(!E.nhi({type:'ipf',fvc:65,dlco:49,hrct:1,spec:1,sym:1,combo:1}).ok,'IPF combo forbidden');
const ssc={type:'ssc',fvc:52,dlco:40,hrct:1,spec:1,sym:1,fib10:1,rheum:1,isfail:1};
ok(E.nhi(ssc).ok,'SSc eligible');
ok(!E.nhi({...ssc,fvc:38}).ok,'SSc FVC<40');ok(!E.nhi({...ssc,dlco:92}).ok,'SSc DLCO>89');ok(E.nhi({...ssc,dlco:89}).ok,'SSc DLCO 89 edge');ok(!E.nhi({...ssc,isfail:0}).ok,'SSc no IS failure');
const pf={type:'pf',fvc:67,dlco:45,hrct:1,spec:1,sym:1,fib10:1,pft:1,either:1};
ok(E.nhi(pf).ok,'PF ok');ok(!E.nhi({...pf,dlco:28}).ok,'PF DLCO<30');ok(!E.nhi({...pf,fvc:82}).ok,'PF FVC>80');ok(!E.nhi({...pf,either:0}).ok,'PF needs sym or HRCT');
ok(E.nhi({type:'pf',fvc:'',dlco:40}).invalid,'blank invalid');
// NHI renew
ok(E.renew({type:'ipf',prev:66,now:55}).level==='danger','IPF drop 11 grace');
ok(E.renew({type:'ipf',prev:66,now:57}).level==='good','IPF drop 9 continue');
ok(E.renew({type:'pf',prev:70,now:58,weeks:30}).level==='good','PF <52 wk not applicable');
ok(E.renew({type:'pf',prev:70,now:58,weeks:60}).level==='danger','PF >=52 wk drop 12');
ok(E.renew({type:'ssc',weeks:60,ml:150}).level==='danger','SSc >100 mL');
ok(E.renew({type:'ssc',weeks:60,ml:90}).level==='good','SSc 90 mL');

// plan
let p=E.plan({dis:'ipf',mdd:true,fvc:88,dlco:56,egfr:75,liver:'normal'});
ok(st(p,'nint')==='first'&&st(p,'pir')==='option'&&st(p,'ner')==='foreign','IPF default');
p=E.plan({dis:'ipf',mdd:false,fvc:70,dlco:50,egfr:70});ok(st(p,'nint')==='na'&&has(p.alerts,'MDD'),'IPF without MDD');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,liver:'a'});ok(st(p,'nint')==='first'&&p.drugs[0].dose.startsWith('100'),'Child-Pugh A reduce');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,liver:'b'});ok(st(p,'nint')==='avoid'&&st(p,'pir')==='first'&&st(p,'ner')==='foreign','Child-Pugh B');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,liver:'c'});ok(st(p,'nint')==='avoid'&&st(p,'pir')==='avoid'&&st(p,'ner')==='avoid','Child-Pugh C all avoid');
p=E.plan({dis:'ipf',mdd:true,fvc:61,dlco:37,egfr:7,bleed:true});ok(st(p,'pir')==='avoid'&&st(p,'ner')==='avoid'&&st(p,'nint')==='first','ESRD case');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,cyp1a2:true});ok(st(p,'pir')==='avoid','fluvoxamine');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,bleed:true,gi:true});ok(st(p,'pir')==='first'&&st(p,'nint')==='caution','fewer cautions wins');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,cyp3a:true});ok(p.drugs[2].dose.startsWith('9 mg'),'CYP3A inhibitor 9 mg');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,current:'pir'});ok(st(p,'pir')==='continue'&&p.drugs[2].dose.includes('不可降為 9'),'on pirfenidone');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,cyp3aInd:true});ok(st(p,'ner')==='avoid','inducer');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,preg:true});ok(st(p,'nint')==='avoid'&&st(p,'ner')==='avoid','pregnancy');
p=E.plan({dis:'ipf',mdd:true,fvc:70,dlco:50,egfr:70,act:'urgent'});ok(p.urgent&&st(p,'nint')==='defer'&&has(p.acute,'EXAFIP'),'AE-IPF');
p=E.plan({dis:'ra',ppf:'no',pattern:'uip',fvc:73,dlco:50,egfr:68});ok(st(p,'nint')==='na'&&p.summary.includes('病因治療'),'RA no PPF');
p=E.plan({dis:'ra',ppf:'yes',pattern:'uip',fvc:65,dlco:45,egfr:68});ok(st(p,'nint')==='first'&&st(p,'pir')==='offlabel','RA UIP PPF');
p=E.plan({dis:'ss',ppf:'no',fvc:75,dlco:60,egfr:80});ok(st(p,'nint')==='option'&&has(p.disease,'MMF'),'SSc no PPF: MMF first');
p=E.plan({dis:'hp',ppf:'yes',act:'yes',fvc:68,dlco:44,egfr:72});ok(st(p,'nint')==='first'&&st(p,'pir')==='na'&&has(p.disease,'抗原'),'HP PPF');
p=E.plan({dis:'undetermined',fvc:70,dlco:50,egfr:70});ok(p.drugs.every(d=>d.status==='na')&&p.summary.includes('確立診斷'),'undetermined');
p=E.plan({dis:'iim',ppf:'uncertain',act:'urgent',fvc:52,dlco:34,egfr:63});ok(p.urgent&&has(p.acute,'tacrolimus'),'MDA5 urgent');
p=E.plan({dis:'ipf',mdd:true,fvc:45,dlco:30,egfr:70,spo2:87,exspo2:80,age:72});ok(has(p.support,'長期氧療')&&has(p.support,'攜帶式')&&has(p.support,'≥70 歲')&&has(p.support,'安寧'),'support items');

// complex cases 9–11 — embedded profiles
const cs=html.slice(html.indexOf('const cases=['),html.indexOf('const caseProfiles'));
const cases=vm.runInNewContext('('+cs.trim().replace(/^const cases=/,'').replace(/;$/,'')+')',{});
ok(cases.length===11,'11 cases');
const c9=E.plan(cases[8].x);ok(st(c9,'pir')==='switch'&&st(c9,'nint')==='first'&&has(c9.drugs[0].notes,'出血')&&c9.drugs[2].dose.includes('不可降為 9')&&has(c9.support,'肺高壓')&&has(c9.escalate,'12 週緩衝期')&&c9.summary.includes('轉換為 Nintedanib'),'case 9 plan');
ok(E.renew(cases[8].nhi).level==='danger','case 9 NHI grace');
const c10=E.plan(cases[9].x);ok(c10.urgent&&has(c10.alerts,'腎危象')&&has(c10.alerts,'≥15 mg')&&st(c10,'nint')==='defer'&&has(c10.disease,'tocilizumab'),'case 10 plan');
ok(E.nhi(cases[9].nhi).ok,'case 10 NHI SSc eligible');
const c11=E.plan(cases[10].x);ok(st(c11,'nint')==='avoid'&&st(c11,'pir')==='na'&&st(c11,'ner')==='foreign'&&has(c11.drugs[2].notes,'Child-Pugh B')&&c11.summary.includes('nerandomilast')&&has(c11.support,'肝硬化'),'case 11 plan');
const n11=E.nhi(cases[10].nhi);ok(!n11.ok&&n11.reasons.some(x=>x.includes('DLCO')),'case 11 NHI DLCO fail');

// quiz answer distribution
const qs=html.slice(html.indexOf('const questions=['),html.indexOf('];let qi'))+']';
const Q=vm.runInNewContext('('+qs.replace(/^const questions=/,'')+')',{});
ok(Q.length===25,'25 questions');ok(Q.every(q=>q[1].length===4&&q[2]>=0&&q[2]<4),'question shape');
ok(JSON.stringify(Q.slice(20).map(q=>q[2]))==='[0,2,3,1,2]','hard answers');

console.log(`engine: ${pass} passed, ${fail} failed`);

// e2e
(async()=>{let chromium;try{({chromium}=require('playwright'))}catch(e){console.log('playwright not found, e2e skipped');process.exit(fail?1:0)}
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1200,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const url=process.env.URL||'file://'+path.join(__dirname,'index.html');await pg.goto(url+'#treat');
 let e2=0,ef=0;const t=(c,m)=>{if(c)e2++;else{ef++;console.log('E2E FAIL',m)}};
 t(await pg.isVisible('#treat'),'hash opens treat');
 await pg.click('text=產生治療計畫');t(await pg.locator('#txout .drug').count()===3,'3 drug cards');
 t(await pg.getAttribute('[data-drug=nint]','data-status')==='first','default nint first');
 await pg.fill('#txegfr','200');await pg.click('text=產生治療計畫');t((await pg.textContent('#txout')).includes('超出範圍'),'range check');
 await pg.fill('#txegfr','');await pg.click('text=產生治療計畫');t((await pg.textContent('#txout')).includes('缺 eGFR'),'blank egfr ok');
 for(const [i,exp] of [[8,{nint:'first',pir:'switch'}],[9,{nint:'defer'}],[10,{nint:'avoid',ner:'foreign'}],[6,{pir:'avoid',ner:'avoid'}]]){
  await pg.evaluate(()=>showTab('cases'));await pg.click(`.casebtn >> nth=${i}`);await pg.click('#caseContent >> text=帶入治療計畫');
  for(const k in exp)t(await pg.getAttribute(`[data-drug=${k}]`,'data-status')===exp[k],`case ${i+1} ${k}`);}
 await pg.evaluate(()=>showTab('cases'));await pg.click('.casebtn >> nth=10');await pg.click('#caseContent >> text=帶入健保核對');t((await pg.textContent('#nhiout')).includes('DLCO'),'case 11 nhi');
 await pg.evaluate(()=>showTab('cases'));await pg.click('.casebtn >> nth=8');await pg.click('#caseContent >> text=帶入健保核對');t((await pg.textContent('#rnout')).includes('緩衝期'),'case 9 renew');
 await pg.selectOption('#nhitype','ssc');t(await pg.isVisible('#nhiisfail')&&!(await pg.isVisible('#nhipft')),'nhi toggle');
 // wizard
 await pg.evaluate(()=>showTab('wizard'));await pg.click('.wtab >> nth=1');await pg.selectOption('#wfib','yes');await pg.selectOption('#wpattern','nsip');await pg.selectOption('#wcause','none');await pg.selectOption('#wmdd','yes');
 await pg.click('.wtab >> nth=2');await pg.fill('#wf0','75');await pg.fill('#wf1','68');await pg.check('#wyear');await pg.check('#wexclude');await pg.click('.wtab >> nth=0');await pg.check('#wworsen');
 await pg.click('.wtab >> nth=3');await pg.fill('#wegfr','60');await pg.selectOption('#wliver','normal');await pg.click('.wtab >> nth=4');
 const wt=await pg.textContent('#wresult');t(wt.includes('符合 PPF')&&wt.includes('未分類'),'wizard unclassifiable PPF');t(await pg.getAttribute('#wresult [data-drug=nint]','data-status')==='first','wizard nint first');
 await pg.click('.wtab >> nth=1');await pg.selectOption('#wpattern','uip');await pg.click('.wtab >> nth=4');t((await pg.textContent('#wresult')).includes('IPF 不適用 PPF'),'wizard IPF');
 // quiz to the end
 await pg.evaluate(()=>showTab('quiz'));for(let i=0;i<25;i++){await pg.check('#qchoices input >> nth=0');await pg.click('#qsubmit');await pg.click('#qnext')}
 t((await pg.textContent('#qexplain')).includes('/ 25'),'quiz completes');
 // mind map
 await pg.evaluate(()=>showTab('mind'));const leaves=await pg.locator('#mindtree li.leaf').count();t(leaves>=180,'mind leaves '+leaves);
 t(await pg.locator('#mindtree .mroot>li').count()===13,'13 branches');t(await pg.locator('#mindnum tr').count()>=15,'number table');
 await pg.fill('#mindq','NUDT15');const vis=await pg.$$eval('#mindtree li.leaf',ls=>ls.filter(l=>l.checkVisibility()).map(l=>l.textContent));t(vis.length>=2&&vis.every(x=>x.includes('NUDT15')),'search NUDT15 '+vis.length);
 await pg.fill('#mindq','');await pg.check('#mindkp');const kv=await pg.$$eval('#mindtree li.leaf',ls=>ls.filter(l=>l.checkVisibility()).length);t(kv>40&&kv<leaves,'key-point filter '+kv);
 await pg.uncheck('#mindkp');await pg.click('text=全部收合');t(await pg.$$eval('#mindtree li.leaf',ls=>ls.filter(l=>l.checkVisibility()).length)===0,'collapse all');
 await pg.fill('#mindq','zzqq');t((await pg.textContent('#mindcount')).includes('找不到'),'no match message');await pg.fill('#mindq','');
 await pg.setViewportSize({width:375,height:800});await pg.evaluate(()=>showTab('treat'));t(await pg.evaluate(()=>document.documentElement.scrollWidth<=376),'no horizontal scroll at 375');
 t(errs.length===0,'no page errors: '+errs.join('|'));
 await b.close();console.log(`e2e: ${e2} passed, ${ef} failed`);process.exit(fail||ef?1:0)})();
