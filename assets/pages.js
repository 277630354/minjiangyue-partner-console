/* ============================================================
 * 民匠有约 · 合伙人后台 — 页面模块
 * 每个页面：head(右侧操作区) / html(主体) / bind(可选事件)
 * ============================================================ */
(function(){
'use strict';
const P=window.POLICY, D=window.DEMO;
/* 惰性代理：pages.js 先于 app.js 加载，工具与图表在运行时才解析 */
const U=new Proxy({},{get:(_,k)=>(...args)=>window.U[k](...args)});
const C=new Proxy({},{get:(_,k)=>(...args)=>window.Chart[k](...args)});
const esc=(...a)=>window.U.esc(...a), fmt=(...a)=>window.U.fmt(...a), num=(...a)=>window.U.num(...a);

function H(){ return {}; }
function lifetime(a){ return a.monthly.reduce((s,v)=>s+v,0); }
function ledger(a){ return U.sum(a.records); }
function settled(a){ return U.sum(a.records,r=>r.status==='已结算'); }
function pending(a){ return U.sum(a.records,r=>r.status!=='已结算'); }
function avail(a){ return Math.max(0,settled(a)-App.state.withdrawals.reduce((s,w)=>s+w.amount,0)); }
function sourceAgg(a){
  const m={}; a.records.forEach(r=>{ m[r.source]=(m[r.source]||0)+r.amount; });
  return P.sources.map(s=>({key:s.key,name:s.name,color:s.color,desc:s.desc,value:m[s.key]||0,
    count:a.records.filter(r=>r.source===s.key).length})).filter(x=>x.value>0).sort((x,y)=>y.value-x.value);
}
function productAgg(a){
  const m={}; a.records.forEach(r=>{ m[r.product]=(m[r.product]||0)+r.amount; });
  const colors={'安心云':'#2D6BC0','如意宝':'#B8862B','福运宝':'#7E6BC8','—':'#8A97A8'};
  return Object.keys(m).map(k=>({name:k,value:m[k],color:colors[k]||'#8A97A8'})).sort((x,y)=>y.value-x.value);
}
function statCard(label,value,foot,tone,spark){
  return '<div class="stat-card '+(tone||'')+'"><div class="stat-label">'+label+'</div><div class="stat-value num">'+value+'</div><div class="stat-foot">'+foot+'</div>'+(spark?C.spark(spark):'')+'</div>';
}
function cardHead(title,sub,extra){ return '<div class="card-hd"><h3>'+title+(sub?' <span class="sub">'+sub+'</span>':'')+'</h3>'+(extra||'')+'</div>'; }
function pageTable(headers,rows,emptyText){
  return '<div class="tbl-wrap"><table class="tbl"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
    (rows.length?rows.join(''):'<tr><td colspan="'+headers.length+'"><div class="empty"><div class="em">▤</div>'+(emptyText||'暂无数据')+'</div></td></tr>')+'</tbody></table></div>';
}
function filterSelect(k,label,opts,cur){
  return '<select class="select" data-k="'+k+'"><option value="">'+label+'</option>'+opts.map(o=>'<option value="'+o[0]+'" '+(cur===o[0]?'selected':'')+'>'+o[1]+'</option>').join('')+'</select>';
}
function levelName(a){
  if(P.levels[a.level])return P.levels[a.level].name;
  if(P.providers[a.level])return P.providers[a.level].name;
  return a.role;
}
function rateLabel(a){
  const l=P.levels[a.level];
  if(l) return l.products['安心云'].firstLabel;
  if(P.providers[a.level]) return '410 元/单';
  return '按招商奖励政策计发';
}

const PAGES={};

/* ==================== 工作台 ==================== */
PAGES.dashboard={
  head(a){ return '<div class="row"><span class="tag tag-gold">'+esc(a.role)+'</span><button class="btn btn-ghost btn-sm" data-act="export" data-v="report">导出经营简报</button></div>'; },
  html(a,st){
    const agg=sourceAgg(a), total=ledger(a), month=a.monthly[a.monthly.length-1];
    const mom=(month-a.monthly[a.monthly.length-2])/a.monthly[a.monthly.length-2]*100;
    const activePct=a.activeTarget?Math.min(100,a.activeYear/a.activeTarget*100):100;
    const donutItems=agg.slice(0,6).map(x=>({name:x.name,value:x.value,color:x.color}));
    const others=agg.slice(6).reduce((s,x)=>s+x.value,0); if(others)donutItems.push({name:'其他',value:others,color:'#B9C4D2'});
    const chart=st.chartMode==='bar'?C.bars(a.monthly,D.MONTHS,{color:'#2D6BC0',hi:'#B8862B'}):C.line(a.monthly,D.MONTHS,{color:'#2D6BC0'});
    const recent=a.records.slice(0,5);
    return ''+
    '<div class="welcome"><div><div class="w-tag">'+esc(a.role)+' · '+esc(a.region)+'</div><h3>上午好，'+esc(a.name)+' 👋</h3>'+
      '<p>本年度成交 '+num(a.activeYear)+' 单，'+(a.activeTarget?(activePct>=100?'已达成':'距离')+'年活跃度要求 '+(activePct>=100?'':num(a.activeTarget-a.activeYear)+' 单，')+'续费分润'+(activePct>=100?'正常计发':'暂不受影响'):'招商奖励按政策计发')+'。最近结算日为 11 月 25 日。</p></div>'+
      '<div class="w-side"><div class="w-lb">本月收益（元）</div><div class="w-num num">'+num(month)+'</div><div class="w-lb">近 12 个月累计 '+fmt(lifetime(a))+'</div></div></div>'+

    '<div class="grid g4">'+statCard('账本累计收益',fmt(total),'共 '+a.records.length+' 笔收益 · 逐笔可追溯','',a.monthly.slice(-6))+
      statCard('本月收益',fmt(month),'较上月 <span class="'+(mom>=0?'pos':'neg')+'">'+(mom>=0?'↑ ':'↓ ')+Math.abs(mom).toFixed(1)+'%</span>','gold',a.monthly.slice(-6))+
      statCard('可提现金额',fmt(avail(a)),'已结算 '+fmt(settled(a))+' · 待结算 '+fmt(pending(a)),'green')+
      statCard('年度成交席位',num(a.activeYear)+' <small style="font-size:13px;font-weight:500;color:var(--muted)">单</small>','累计 '+num(a.seats)+' 席 · 要求 ≥'+num(a.activeTarget||0)+' 单/年','purple')+'</div>'+

    '<div class="quick-actions mt18">'+
      '<button class="qa" data-act="withdraw"><i>¥</i>申请提现</button>'+
      '<button class="qa" data-act="copyInvite"><i>◎</i>复制邀请码</button>'+
      '<button class="qa" data-act="nav" data-v="benefits"><i>◆</i>查看我的权益</button>'+
      '<button class="qa" data-act="nav" data-v="sources"><i>⊞</i>收益来源分析</button>'+
      '<button class="qa" data-act="upgradeApply" data-v="free"><i>↑</i>申请晋升</button>'+
      '<button class="qa" data-act="contract"><i>文</i>合同与凭证</button></div>'+

    '<div class="grid g2" style="grid-template-columns:1.55fr 1fr">'+
      '<div class="card">'+cardHead('收益趋势','近 12 个月','<div class="segmented"><button class="'+(st.chartMode==='line'?'active':'')+'" data-act="chartMode" data-v="line">折线</button><button class="'+(st.chartMode==='bar'?'active':'')+'" data-act="chartMode" data-v="bar">柱状</button></div>')+
        '<div class="card-bd">'+chart+'<div class="legend mt10"><span><i style="background:#2D6BC0"></i>月度收益（元）</span><span><i style="background:#B8862B"></i>当月</span><span class="muted">数据口径：账期归属月，次月 1 日出账单</span></div></div></div>'+
      '<div class="card">'+cardHead('收益来源构成','按金额占比')+'<div class="card-bd">'+
        C.donut(donutItems,fmt(total).replace('¥',''),'收益总额（元）')+
        '<div class="mt14">'+donutItems.slice(0,5).map(x=>'<div class="source-bar"><span class="sb-name">'+x.name+'</span><div class="sb-track"><i style="width:'+(x.value/total*100).toFixed(1)+'%;background:'+x.color+'"></i></div><span class="sb-val num">'+fmt(x.value)+'</span><span class="sb-pct">'+U.pct(x.value,total)+'%</span></div>').join('')+'</div>'+
        '<button class="btn btn-ghost btn-sm btn-block mt10" data-act="nav" data-v="sources">查看全部来源 →</button></div></div></div>'+

    '<div class="grid g2 mt18" style="grid-template-columns:1fr 1fr">'+
      '<div class="card">'+cardHead('活跃度与成长','2026 年度')+'<div class="card-bd">'+
        '<div class="between mb6"><span class="small">年活跃度（成交席位）</span><b class="num">'+num(a.activeYear)+' / '+num(a.activeTarget||0)+'</b></div>'+
        '<div class="progress '+(activePct>=100?'green':'orange')+'"><i style="width:'+activePct+'%"></i></div>'+
        '<div class="small muted mt6">'+(activePct>=100?'✓ 已达标，本年度续费分润正常计发，奖励于年底/次年初统一发放':'未达标，当年不触发续费奖励，请加快席位开发')+'</div>'+
        '<div class="divider"></div>'+
        '<div class="between mb6"><span class="small">席位成交奖金进度</span><b>'+((P.seatAward[a.level]&&P.seatAward[a.level].step)?num(a.seats%P.seatAward[a.level].step)+' / '+num(P.seatAward[a.level].step)+' 席':'不适用')+'</b></div>'+
        '<div class="progress gold"><i style="width:'+((P.seatAward[a.level]&&P.seatAward[a.level].step)?(a.seats%P.seatAward[a.level].step)/P.seatAward[a.level].step*100:0)+'%"></i></div>'+
        '<div class="small muted mt6">'+((P.seatAward[a.level]&&P.seatAward[a.level].amount)?'已发放 '+a.awardTimes+' 次 / 上限 4 次 · 每达标奖励 '+fmt(P.seatAward[a.level].amount):'当前身份无席位成交奖金')+'</div>'+
        '<div class="divider"></div>'+
        '<div class="row between"><div><div class="small muted">下一等级</div><b>'+esc(a.upgradeNext==='—'?'已达最高合伙人等级':a.upgradeNext)+'</b></div><button class="btn btn-soft btn-sm" data-act="nav" data-v="upgrade">晋升中心 →</button></div>'+
      '</div></div>'+
      '<div class="card">'+cardHead('待办与提醒','4 项')+'<div class="card-bd">'+
        D.TODOS.map(t=>'<div class="todo-item"><span class="td-dot"></span><div class="td-t"><b>'+t.t+'</b>'+t.d+'</div><span class="tag tag-orange">'+t.tag+'</span></div>').join('')+
      '</div></div></div>'+

    '<div class="grid g2 mt18" style="grid-template-columns:1fr 1.3fr">'+
      '<div class="card">'+cardHead('结算日历','账期进度')+'<div class="card-bd">'+
        '<div class="bill-row"><span>2026-10 账期</span><b class="num">'+fmt(a.bills[0].amount)+'</b><span class="tag tag-orange">待结算</span></div>'+
        '<div class="bill-row"><span>出账日</span><b>11 月 1 日</b><span class="small muted">已完成</span></div>'+
        '<div class="bill-row"><span>自动结算日</span><b>11 月 25 日</b><span class="small muted">倒计时 14 天</span></div>'+
        '<div class="bill-row"><span>结算账户</span><b>'+esc(a.bank)+'</b></div>'+
        '<div class="notice mt14"><span class="ni">ℹ</span><div>'+P.meta.settlement.note+'。'+P.meta.invoiceRule+'。</div></div>'+
      '</div></div>'+
      '<div class="card">'+cardHead('最新收益','点击行可查看计算口径','<button class="btn-text" data-act="nav" data-v="income">全部明细 →</button>')+'<div class="card-bd" style="padding-top:6px">'+
        recent.map(r=>'<div class="todo-item" style="cursor:pointer" data-act="recordDetail" data-v="'+r.id+'"><div class="ent-ico" style="background:'+U.src(r.source).color+'18;color:'+U.src(r.source).color+'">¥</div><div class="td-t"><b>'+U.src(r.source).name+' · '+fmt(r.amount)+'</b>'+esc(r.customer)+' · '+r.date+'</div>'+U.tag(r.status)+'</div>').join('')+
      '</div></div></div>';
  }
};

/* ==================== 我的收益 ==================== */
function incomeHtml(a,st){
    /* 金牌合伙人与在职员工·铜牌权益：续费分润按年结算、不参与按月自动结算 */
    const renewDash=(a.level==='gold'||a.level==='bronze');
    const settleText=renewDash?'次月 25 日自动结算（不包含续费分润）':'次月 25 日自动结算';
    const pendingMonth=renewDash?U.sum(a.records,r=>r.status!=='已结算'&&r.source!=='renew_seat'):null;
    const pendingYear=renewDash?U.sum(a.records,r=>r.status!=='已结算'&&r.source==='renew_seat'):null;
    const f=st.filters;
    let rows=a.records.filter(r=>
      (!f.source||r.source===f.source)&&(!f.status||r.status===f.status)&&
      (!f.period||r.date.slice(0,7)===f.period)&&(!f.kw||(r.customer+r.id+r.note+r.product).toLowerCase().includes(f.kw.toLowerCase()))
    );
    const filteredTotal=U.sum(rows), per=10, pages=Math.max(1,Math.ceil(rows.length/per)), pg=Math.min(st.page,pages);
    const shown=rows.slice((pg-1)*per,pg*per);
    const monthOpts=Array.from(new Set(a.records.map(r=>r.date.slice(0,7)))).sort().reverse().map(m=>[m,m]);
    const cards=renewDash
      ? '<div class="grid g5">'+statCard('账本累计收益',fmt(ledger(a)),'共 '+a.records.length+' 笔收益记录')+
        statCard('已结算',fmt(settled(a)),'可发起提现','green')+
        statCard('按月待结算',fmt(pendingMonth),'次月 25 日自动结算','gold')+
        statCard('按年待结算',fmt(pendingYear),'续费分润 · 次年 1 月结算','orange')+
        statCard('可提现余额',fmt(avail(a)),'已提现 '+fmt(App.state.withdrawals.reduce((s,w)=>s+w.amount,0)),'purple')+'</div>'
      : '<div class="grid g4">'+statCard('账本累计收益',fmt(ledger(a)),'共 '+a.records.length+' 笔收益记录')+
        statCard('已结算',fmt(settled(a)),'可发起提现','green')+
        statCard('待结算 / 账单中',fmt(pending(a)),settleText,'gold')+
        statCard('可提现余额',fmt(avail(a)),'已提现 '+fmt(App.state.withdrawals.reduce((s,w)=>s+w.amount,0)),'purple')+'</div>';
    return cards+

    '<div class="section-title mt24">账期账单</div>'+
    '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>账期</th><th>收益笔数</th><th>账单金额</th><th>出账日</th><th>自动结算日</th><th>状态</th><th class="right">操作</th></tr></thead><tbody>'+
      a.bills.map(b=>'<tr><td><b>'+b.period+'</b></td><td>'+b.count+' 笔</td><td><b class="num">'+fmt(b.amount)+'</b></td><td>'+b.billDate+'</td><td>'+b.payDate+'</td><td>'+U.tag(b.status)+'</td><td class="right"><button class="btn-text" data-act="toast" data-v="账期 '+b.period+' 对账单已生成">查看对账单</button></td></tr>').join('')+
    '</tbody></table></div></div>'+

    '<div class="section-title mt24">收益明细</div>'+
    '<div class="card"><div class="card-bd">'+
      '<div class="filter-bar">'+
        filterSelect('source','全部收益来源',P.sources.map(s=>[s.key,s.name]),f.source)+
        filterSelect('status','全部状态',[['已结算','已结算'],['待结算','待结算'],['账单中','账单中']],f.status)+
        filterSelect('period','全部月份',monthOpts,f.period)+
        '<input class="input" data-k="kw" placeholder="搜索客户 / 单号 / 口径" value="'+esc(f.kw)+'">'+
        '<button class="btn btn-ghost btn-sm" data-act="toast" data-v="筛选条件已应用">筛选</button>'+
        '<span class="small muted" style="margin-left:auto">共 '+rows.length+' 笔 · 合计 <b style="color:var(--brand)">'+fmt(filteredTotal)+'</b></span>'+
      '</div>'+
      pageTable(['收益单号','日期','收益来源','产品','客户 / 对象','新增席位','续费席位','金额','状态','操作'],
        shown.map(r=>'<tr style="cursor:pointer" data-act="recordDetail" data-v="'+r.id+'"><td><b>'+r.id+'</b></td><td>'+r.date+'</td><td><span class="tag" style="background:'+U.src(r.source).color+'18;color:'+U.src(r.source).color+'">'+U.src(r.source).name+'</span></td><td>'+r.product+'</td><td>'+esc(r.customer)+'</td><td class="num">'+(r.newSeats||0)+'</td><td class="num">'+(r.renewSeats||0)+'</td><td><b class="num">'+fmt(r.amount)+'</b></td><td>'+((renewDash&&r.source==='renew_seat')?'<span class="muted">-</span>':U.tag(r.status))+'</td><td><button class="btn-text">详情 ›</button></td></tr>'),'没有符合条件的收益记录')+
      '<div class="pager"><span>第 '+pg+' / '+pages+' 页</span><div class="pg">'+
        Array.from({length:pages},(_,i)=>'<button class="'+(i+1===pg?'active':'')+'" data-act="page" data-v="'+(i+1)+'">'+(i+1)+'</button>').join('')+'</div></div>'+
    '</div></div>'+
    '<div class="notice mt14"><span class="ni">ℹ</span><div><b>结算口径：</b>次月 1 日出账单、'+(renewDash?'次月 25 日自动结算（不包含续费分润）；续费分润不参与自动结算，状态以「-」标记。':'次月 25 日系统自动结算；')+'账单中 → 待结算 → 已结算。'+P.meta.invoiceRule+'。所有佣金、奖励系统自动结算，无需线下对账。</div></div>';
}

/* ==================== 我的收益：按账号角色直接展示对应账本 ==================== */
PAGES.income={
  head(a,st){
    if(U.isAdvisor(a)) return '<button class="btn btn-ghost btn-sm" data-act="export" data-v="income">导出收益明细</button>';
    return '<div class="row"><button class="btn btn-ghost btn-sm" data-act="export" data-v="income">导出明细</button><button class="btn btn-primary btn-sm" data-act="withdraw">申请提现</button></div>';
  },
  html(a,st){ return U.isAdvisor(a)?advisorIncomeHtml(a):incomeHtml(a,st); }
};

/* 服务商线：把每笔奖励直接归类为直推 15% / 间推 5% / 统提 5% */
function advisorServiceReward(r){
  const n=String(r.note||'');
  if(n.indexOf('直接推荐')>=0) return {type:'直推招商',rate:'15%',cls:'tag-gold'};
  if(n.indexOf('介绍顾问')>=0) return {type:'间推（介绍其他顾问）',rate:'5%',cls:'tag-blue'};
  if(n.indexOf('资源团队')>=0) return {type:'资源团队统提',rate:'5%',cls:'tag-green'};
  if(n.indexOf('推荐奖励')>=0||n.indexOf('晋升差价')>=0) return {type:'加盟费推荐',rate:'20%',cls:'tag-gold'};
  if(n.indexOf('席位')>=0) return {type:'席位分成',rate:'5%',cls:'tag-green'};
  return {type:'顾问奖励',rate:'—',cls:'tag-gray'};
}

function advisorIncomeHtml(acc){
  /* advisor 为入驻统一后的高级总顾问：按奖励类型展示，兼容两类历史口径 */
  const isSvc=acc.level==='advisorService'||acc.level==='advisor';
  const records=acc.records.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const total=records.reduce((s,r)=>s+r.amount,0);
  const settled=records.filter(r=>r.status==='已结算').reduce((s,r)=>s+r.amount,0);
  const pending=total-settled;
  const maxMonth=acc.monthly[acc.monthly.length-1];
  const bySrc={}; records.forEach(r=>{bySrc[r.source]=(bySrc[r.source]||0)+r.amount;});
  const srcList=P.sources.filter(s=>bySrc[s.key]).map(s=>({key:s.key,name:s.name,color:s.color,desc:s.desc,value:bySrc[s.key],count:records.filter(r=>r.source===s.key).length})).sort((a,b)=>b.value-a.value);
  const svcRules=[
    ['直接推荐招商','招商额 15%','总顾问自己资源团队中的招商城市，总顾问拿招商额 15%'],
    ['介绍其他顾问推荐','招商额 5%','总顾问介绍的其他顾问招商成功，总顾问拿 5%，其他顾问拿 10%'],
    ['资源团队统提','招商额 5%','自己资源团队中的招商城市，统提招商额的 5%'],
    ['层级限制','仅两级','超出两级的顾问由第二级顾问负责，公司不再计算和直接发放第三级顾问奖励']
  ];
  const partnerRules=[
    ['代理费推荐奖励','20%','任意合伙人推荐新合伙人，获得被推荐方代理费的 20% 分成'],
    ['新增席位分成','5%','额外享有被推荐方新增席位开发收益 5% 的分成权益'],
    ['续费席位分成','5%','该席位后续续费，同样按 5% 计发分成'],
    ['互斥说明','不可同时享受','该收益与区域被动收益权益不可同时享受']
  ];
  const rules=acc.level==='advisor'?svcRules.concat(partnerRules):(isSvc?svcRules:partnerRules);
  const rows=records;
  const svcSum=kind=>records.filter(r=>advisorServiceReward(r).type===kind).reduce((s,r)=>s+r.amount,0);
  return '<div class="card"><div class="card-bd"><div class="row between wrap" style="gap:16px">'+
    '<div class="row" style="gap:14px"><div class="avatar gold">顾</div><div><b style="font-size:16px">'+esc(acc.role)+'</b>'+
    '<div class="small muted mt6">'+(acc.level==='advisor'?'双线账本 · 招商 15% / 5% / 统提 5% + 加盟费 20% + 席位 5%':(isSvc?'招商奖励账本 · 直接 15% / 间接 5% / 统提 5%':'推荐分成账本 · 代理费 20% + 席位 5%'))+' · 独立核算</div></div></div>'+
    '<div style="text-align:right"><div class="small muted">最近月收益</div><b style="font-size:17px;color:var(--gold)">'+fmt(maxMonth)+'</b></div></div></div></div>'+

    '<div class="grid g4 mt18">'+
      statCard('账本累计收益',fmt(total),'共 '+records.length+' 笔')+
      statCard('已结算',fmt(settled),'可发起对账','green')+
      statCard('待结算 / 账单中',fmt(pending),'次月 25 日自动结算','gold')+
      statCard('收益来源',srcList.length+' <small style="font-size:13px;font-weight:500">类</small>',isSvc?'招商奖励口径':'推荐分成口径','purple')+
    '</div>'+

    '<div class="section-title mt24">收益来源构成</div>'+
    '<div class="card"><div class="card-bd">'+srcList.map(x=>
      '<div class="source-bar"><span class="sb-name">'+x.name+'</span><div class="sb-track"><i style="width:'+(x.value/total*100).toFixed(1)+'%;background:'+x.color+'"></i></div>'+
      '<span class="sb-val num">'+fmt(x.value)+'</span><span class="sb-pct">'+U.pct(x.value,total)+'%</span><span class="sb-pct">'+x.count+' 笔</span></div>').join('')+
    '</div></div>'+

    '<div class="section-title mt24">收益明细 <span class="small muted" style="font-weight:400">点击行查看'+(isSvc?'奖励比例与状态流转':'计算快照与状态流转')+'</span></div>'+
    '<div class="card"><div class="card-bd">'+
      (isSvc?
        '<div class="row wrap" style="gap:18px;padding:10px 12px;margin-bottom:12px;background:#FAFCFF;border-radius:8px">'+
          (acc.level==='advisor'
            ? '<span class="small muted">直推招商 15% <b style="color:var(--gold)">'+fmt(svcSum('直推招商'))+'</b></span>'+
              '<span class="small muted">间推 5% <b style="color:var(--brand)">'+fmt(svcSum('间推（介绍其他顾问）'))+'</b></span>'+
              '<span class="small muted">统提 5% <b style="color:var(--down)">'+fmt(svcSum('资源团队统提'))+'</b></span>'+
              '<span class="small muted">加盟费推荐 20% <b style="color:var(--gold)">'+fmt(svcSum('加盟费推荐'))+'</b></span>'+
              '<span class="small muted">席位分成 5% <b style="color:var(--down)">'+fmt(svcSum('席位分成'))+'</b></span>'
            : '<span class="small muted">直推 15% <b style="color:var(--gold)">'+fmt(svcSum('直推招商'))+'</b></span>'+
              '<span class="small muted">间推 5% <b style="color:var(--brand)">'+fmt(svcSum('间推（介绍其他顾问）'))+'</b></span>'+
              '<span class="small muted">统提 5% <b style="color:var(--down)">'+fmt(svcSum('资源团队统提'))+'</b></span>')+
        '</div>'+
        pageTable(['收益单号','日期','收益类型',(acc.level==='advisor'?'对象 / 城市':'招商对象'),'奖励比例','收益金额','状态','操作'],
          rows.map(r=>{const x=advisorServiceReward(r);return '<tr style="cursor:pointer" data-act="advisorDetail" data-v="'+r.id+'">'+
            '<td><b>'+r.id+'</b></td><td>'+r.date+'</td>'+
            '<td><span class="tag '+x.cls+'">'+x.type+'</span></td><td>'+esc(r.customer)+'</td><td><b>'+x.rate+'</b></td>'+
            '<td><b class="num">'+fmt(r.amount)+'</b></td><td>'+U.tag(r.status)+'</td><td><button class="btn-text">详情 ›</button></td></tr>';}),'暂无顾问收益记录')
      :
        pageTable(['收益单号','日期','收益来源','推荐对象 / 招商城市','关联产品','新增席位','续费席位','金额','状态','操作'],
          rows.map(r=>'<tr style="cursor:pointer" data-act="advisorDetail" data-v="'+r.id+'">'+
            '<td><b>'+r.id+'</b></td><td>'+r.date+'</td>'+
            '<td><span class="tag" style="background:'+U.src(r.source).color+'18;color:'+U.src(r.source).color+'">'+U.src(r.source).name+'</span></td>'+
            '<td>'+esc(r.customer)+'</td><td>'+r.product+'</td><td class="num">'+(r.newSeats||0)+'</td><td class="num">'+(r.renewSeats||0)+'</td>'+
            '<td><b class="num">'+fmt(r.amount)+'</b></td><td>'+U.tag(r.status)+'</td><td><button class="btn-text">详情 ›</button></td></tr>'),'暂无顾问收益记录')
      )+
    '</div></div>'+

    '<div class="section-title mt24">'+(acc.level==='advisor'?'高级总顾问奖励口径 · 招商 + 推荐双线':(isSvc?'服务商招商奖励口径':'合伙人推荐奖励口径'))+'</div>'+
    '<div class="card">'+pageTable(['奖励项目','标准','政策说明'],rules.map(x=>'<tr><td><b>'+x[0]+'</b></td><td><span class="tag tag-gold">'+x[1]+'</span></td><td class="small">'+x[2]+'</td></tr>'))+'</div>'+
    '<div class="notice mt14"><span class="ni">ℹ</span><div><b>数据来源：</b>《民匠有约招商政策（2026版）》四、招商奖励政策 · '+(acc.level==='advisor'?'四、1 / 表 8 顾问招商奖励政策 / 四、4 合伙人推荐奖励 / 表 10':(isSvc?'表 8 顾问招商奖励政策':'四、4 合伙人推荐奖励 / 表 10'))+'。次月 1 日出账单、25 日系统自动结算，与账本独立核算。点击任意明细可查看计算口径与状态流转。</div></div>';
}

/* ==================== 收益来源 ==================== */
PAGES.sources={
  head(a){ return '<button class="btn btn-ghost btn-sm" data-act="export" data-v="income">导出来源明细</button>'; },
  html(a){
    const agg=sourceAgg(a), total=ledger(a);
    return '<div class="grid g4">'+statCard('收益来源类型',agg.length+' <small style="font-size:13px;font-weight:500">类</small>','政策共定义 '+P.sources.length+' 类')+
      statCard('账本累计收益',fmt(total),'全部来源汇总')+
      statCard('第一大来源',agg[0]?agg[0].name:'—',agg[0]?'占比 '+U.pct(agg[0].value,total)+'%':'—','gold')+
      statCard('固定单价类占比',U.pct(agg.filter(x=>['new_seat','renew_seat'].includes(x.key)).reduce((s,x)=>s+x.value,0),total)+'%','新增 + 续费席位分润','purple')+'</div>'+

    '<div class="section-title mt24">收益来源分布</div>'+
    '<div class="card"><div class="card-bd">'+agg.map(x=>'<div class="source-bar"><span class="sb-name">'+x.name+'</span><div class="sb-track"><i style="width:'+(x.value/total*100).toFixed(1)+'%;background:'+x.color+'"></i></div><span class="sb-val num">'+fmt(x.value)+'</span><span class="sb-pct">'+U.pct(x.value,total)+'%</span><span class="sb-pct">'+x.count+' 笔</span></div>').join('')+'</div></div>'+

    '<div class="section-title mt24">各来源计算口径</div>'+
    '<div class="grid g3">'+agg.map(x=>'<div class="card"><div class="card-bd">'+
      '<div class="row mb10"><span style="width:9px;height:9px;border-radius:3px;background:'+x.color+'"></span><b>'+x.name+'</b><span class="tag tag-gray" style="margin-left:auto">'+x.count+' 笔</span></div>'+
      '<div class="money" style="font-size:21px;color:'+x.color+'">'+fmt(x.value)+'</div>'+
      '<p class="small muted" style="line-height:1.75;margin-top:8px;min-height:52px">'+x.desc+'</p>'+
      '<button class="btn btn-ghost btn-sm btn-block mt10" data-act="gotoSource" data-v="'+x.key+'">查看该来源明细 →</button>'+
    '</div></div>').join('')+'</div>'+

    '<div class="section-title mt24">政策定义的全部来源（含本期未发生）</div>'+
    '<div class="card">'+pageTable(['收益来源','计发口径','本期笔数','本期金额','占比','适用身份'],
      P.sources.map(s=>{const x=agg.find(y=>y.key===s.key)||{value:0,count:0};
        const who={'passive_region':'城市服务商','recruit_reward':'服务商 / 顾问 / 员工','seat_award':'金 / 银牌合伙人','fuyun_flow':'全体','other':'按项目','advisor_service':'高级总顾问（城市服务商）','advisor_partner':'高级总顾问（城市合伙人）'}[s.key]||'全体合伙人';
        return '<tr><td><b>'+s.name+'</b></td><td class="small">'+s.desc+'</td><td>'+x.count+'</td><td class="num"><b>'+fmt(x.value)+'</b></td><td>'+U.pct(x.value,total)+'%</td><td>'+who+'</td></tr>';}))+'</div></div>'+
    '<div class="notice mt14"><span class="ni">ℹ</span><div>每笔收益均可通过「我的收益 → 明细详情」追溯到原始订单、计算快照与状态流转；如需核对，可发起对账申请，总部管家将在 1 个工作日内响应。</div></div>';
  }
};

/* ==================== 收益统计 ==================== */
PAGES.stats={
  head(a,st){ return '<div class="row"><div class="segmented"><button class="'+(st.statRange===12?'active':'')+'" data-act="statRange" data-v="12">近 12 月</button><button class="'+(st.statRange===6?'active':'')+'" data-act="statRange" data-v="6">近 6 月</button></div><button class="btn btn-ghost btn-sm" data-act="export" data-v="report">导出报表</button></div>'; },
  html(a,st){
    const n=st.statRange, vals=a.monthly.slice(-n), labels=D.MONTHS.slice(-n);
    const tot=vals.reduce((s,v)=>s+v,0), avg=Math.round(tot/vals.length), max=Math.max.apply(null,vals);
    const last=vals[vals.length-1], prev=vals[vals.length-2], mom=((last-prev)/prev*100);
    const agg=sourceAgg(a), prods=productAgg(a), ptotal=prods.reduce((s,x)=>s+x.value,0);
    const chart=st.chartMode==='bar'?C.bars(vals,labels,{color:'#2D6BC0',hi:'#B8862B'}):C.line(vals,labels,{color:'#2D6BC0'});
    return '<div class="grid g4">'+statCard('区间总收益',fmt(tot),'近 '+n+' 个月累计')+
      statCard('月均收益',fmt(avg),'区间均值','gold')+
      statCard('峰值月份',fmt(max),labels[vals.indexOf(max)]+' · 单月最高','green')+
      statCard('本月环比',(mom>=0?'+':'')+mom.toFixed(1)+'%','较上月 '+(mom>=0?'<span class="pos">↑ 增长</span>':'<span class="neg">↓ 回落</span>'),'purple')+'</div>'+

    '<div class="grid g2 mt18" style="grid-template-columns:1.6fr 1fr">'+
      '<div class="card">'+cardHead('月度收益趋势','近 '+n+' 个月','<div class="segmented"><button class="'+(st.chartMode==='line'?'active':'')+'" data-act="chartMode" data-v="line">折线</button><button class="'+(st.chartMode==='bar'?'active':'')+'" data-act="chartMode" data-v="bar">柱状</button></div>')+'<div class="card-bd">'+chart+'</div></div>'+
      '<div class="card">'+cardHead('按产品分布','账本口径')+'<div class="card-bd">'+C.donut(prods,fmt(ptotal).replace('¥',''),'产品收益（元）')+
        '<div class="legend mt14" style="justify-content:center">'+prods.map(x=>'<span><i style="background:'+x.color+'"></i>'+x.name+' '+U.pct(x.value,ptotal)+'%</span>').join('')+'</div>'+
        '<div class="notice mt14"><span class="ni">ℹ</span><div>补充说明：金银铜合伙人体系纳入分佣的产品仅「安心云」（698 元/席位）；本账本同时保留如意宝、福运宝历史口径，以总部最终产品清单为准。</div></div>'+
      '</div></div></div>'+

    '<div class="grid g2 mt18">'+
      '<div class="card">'+cardHead('收益来源排行','按金额')+'<div class="card-bd">'+agg.map((x,i)=>'<div class="source-bar"><span class="sb-name"><b style="color:'+(i<3?'var(--brand)':'var(--muted)')+'">'+(i+1)+'.</b> '+x.name+'</span><div class="sb-track"><i style="width:'+(x.value/agg[0].value*100).toFixed(1)+'%;background:'+x.color+'"></i></div><span class="sb-val num">'+fmt(x.value)+'</span></div>').join('')+'</div></div>'+
      '<div class="card">'+cardHead('团队贡献 Top 5','一级绑定合伙人','<button class="btn-text" data-act="nav" data-v="team">团队看板 →</button>')+'<div class="card-bd">'+
        (a.team.length?a.team.slice(0,5).map((t,i)=>'<div class="todo-item"><span class="tag '+(i===0?'tag-gold':'tag-gray')+'">'+'TOP'+(i+1)+'</span><div class="td-t"><b>'+esc(t.name)+' · '+esc(t.level)+'</b>'+t.seats+' 席 · 企业购买金额 '+fmt(t.amount)+'</div><b class="num">'+fmt(Math.round(t.seats*350*.05))+'</b></div>').join(''):'<div class="empty"><div class="em">◎</div>暂无绑定合伙人，快去分享邀请码</div>')+
        '<div class="small muted mt10">贡献收益 = 被推荐方新增席位开发收益 × 5%（含续费），按政策口径估算。</div>'+
      '</div></div></div>'+

    '<div class="section-title mt24">月度明细</div>'+
    '<div class="card">'+pageTable(['月份','收益金额','环比','占区间比'],vals.map((v,i)=>'<tr><td><b>'+labels[i]+'</b></td><td class="num"><b>'+fmt(v)+'</b></td><td>'+(i?'<span class="'+(v>=vals[i-1]?'pos':'neg')+'">'+(v>=vals[i-1]?'+':'')+((v-vals[i-1])/vals[i-1]*100).toFixed(1)+'%</span>':'—')+'</td><td>'+U.pct(v,tot)+'%</td></tr>'))+'</div></div>';
  }
};

/* ==================== 我的权益 ==================== */
PAGES.benefits={
  head(a){ return '<button class="btn btn-ghost btn-sm" data-act="contract">合同与凭证</button>'; },
  html(a){
    const l=P.levels[a.level], isProvider=!!P.providers[a.level];
    const pack=isProvider?P.providerPack:P.valuePack;
    const packKey=isProvider?(a.level==='local'?'local':'center'):(a.level||'gold');
    const activePct=a.activeTarget?Math.min(100,a.activeYear/a.activeTarget*100):100;
    return '<div class="card" style="background:linear-gradient(105deg,#FBF6EA,#F4F8FE);border-color:#EFE4CC"><div class="card-bd">'+
      '<div class="row between wrap" style="gap:20px"><div class="row" style="gap:16px">'+
      '<div class="avatar gold" style="width:58px;height:58px;flex-basis:58px;font-size:24px">'+esc(l?l.short:(isProvider?'城':'顾'))+'</div>'+
      '<div><div class="row"><h2 style="font-size:21px">'+esc(a.role)+'</h2>'+U.levelTag(a.level)+'</div>'+
      '<p class="small muted mt6">'+esc(a.company)+' · '+esc(a.subject)+' · 签约区域 '+esc(a.region)+'</p>'+
      '<p class="small muted">协议生效 '+a.joinDate+' · 合同编号 '+a.contract+' · 合伙人编号 '+a.id+'</p></div></div>'+
      '<div style="text-align:right"><div class="small muted">已缴'+(isProvider?'加盟费':'代理费')+'</div><div class="money" style="color:var(--gold)">'+fmt(a.levelFee)+'</div>'+
      '<div class="small muted mt6">增值包价值 '+(isProvider?(P.providers[a.level]||P.providers.center).packValue:(l?l.packValue:'—'))+'</div></div></div></div></div>'+

    '<div class="grid g4 mt18">'+statCard('首年分润单价',rateLabel(a),'安心云口径')+
      statCard('年活跃度要求',a.activeTarget?('≥'+num(a.activeTarget)+' 单'):'—',a.activeTarget?'当前 '+num(a.activeYear)+' 单 · '+(activePct>=100?'已达标':'进行中'):'按招商政策','gold')+
      statCard('权益包配额',isProvider?'12 项':'14 项','系统 / 数据 / 物料 / 设计 / 赋能 / 培训','green')+
      statCard('结算方式','次月 25 日','系统自动结算 · 无需线下对账','purple')+'</div>'+

    '<div class="section-title mt24">我的分润规则 <span class="small muted" style="font-weight:400">表 5 · 三级合伙人政策对比表</span></div>'+
    '<div class="card">'+pageTable(['身份 / 等级','代理费','产品','首年分润','第 2 年','第 3 年','第 4 年','第 5 年及以后','年活跃度'],
      Object.values(P.levels).flatMap(lv=>['安心云','如意宝','福运宝'].map((p,i)=>{
        const d=lv.products[p], me=lv.key===a.level;
        const cells=i===0?'<td rowspan="3" style="background:'+(me?'#FBF6EA':'#fff')+'"><b>'+lv.name+(me?' <span class="tag tag-gold">当前</span>':'')+'</b></td><td rowspan="3">'+fmt(lv.fee)+'</td>':'';
        const renew=d.type==='flow'?d.rates.slice(1):d.renewLabel;
        return '<tr'+(me?' style="background:#FFFDF7"':'')+'>'+cells+'<td>'+p+'</td><td><b>'+d.firstLabel+'</b></td>'+
          [0,1,2,3].map(j=>'<td>'+(renew[j]||'—')+'</td>').join('')+
          (i===0?'<td rowspan="3">≥'+lv.active+' 单/年<br><span class="small muted">否则无续费分润</span></td>':'')+'</tr>';
      })).concat(['<tr style="background:var(--brand-soft2)"><td rowspan="3"><b>城市服务商</b></td><td rowspan="3">中心 50 万<br>地级 20 万</td><td>安心云</td><td><b>410 元/单</b></td><td>205 元</td><td colspan="3">第二年起统一 50%</td><td rowspan="3">按城市任务</td></tr>',
        '<tr style="background:var(--brand-soft2)"><td>如意宝</td><td><b>300 元/单</b></td><td>150 元</td><td colspan="3">第二年起统一 50%</td></tr>',
        '<tr style="background:var(--brand-soft2)"><td>福运宝</td><td><b>流水 5‰</b></td><td>流水 2.5‰</td><td colspan="3">第二年起统一</td></tr>']))+'</div></div>'+
    '<div class="notice mt10"><span class="ni">ℹ</span><div>续费分润 = 对应产品首年分润 × 折扣比例；福运宝按结算流水比例分润，非固定金额。推广收益另有阶梯规则：主动开发订单累计 1000 单（含）以内按 240 元/席/年，超过 1000 单部分按 300 元/席/年结算。</div></div>'+

    '<div class="section-title mt24">加盟增值包 · 我的配额 <span class="small muted" style="font-weight:400">'+(isProvider?'表 2 / 表 4':'表 7')+'</span></div>'+
    '<div class="card">'+pageTable(['模块','项目名称',isProvider?'中心城市':'金牌',isProvider?'地级城市':'银牌',isProvider?'备注':'铜牌','价值'],
      pack.map(x=>'<tr><td>'+x.mod+'</td><td><b>'+x.name+'</b>'+(x.note?'<br><span class="small muted">'+x.note+'</span>':'')+'</td>'+
        '<td>'+(x[isProvider?'center':'gold']||'—')+'</td><td>'+(x[isProvider?'local':'silver']||'—')+'</td><td>'+(isProvider?(x.note||'—'):(x.bronze||'—'))+'</td><td>'+x.value+'</td></tr>'))+'</div></div>'+

    '<div class="grid g2 mt18">'+
      '<div class="card">'+cardHead('权益领取状态')+'<div class="card-bd">'+
        ['城市服务商管理系统','数字营销系统工具','当地工商主体数据','品牌物料包','启航培训（2.5 天）','专属城市服务经理'].map((x,i)=>'<div class="kv"><span>'+x+'</span><b style="color:'+(i===2?'var(--warn)':'var(--down)')+'">'+(i===2?'申领中':'✓ 已开通')+'</b></div>').join('')+
      '</div></div>'+
      '<div class="card">'+cardHead('权益说明与限制')+'<div class="card-bd">'+
        '<div class="rule-block" style="border:none;padding:0;margin-bottom:10px"><p>· 年活跃度未达标（金 ≥400 / 银 ≥100 / 铜 ≥10 单），当年不触发续费分润，奖励于年底或次年年初统一发放。</p>'+
        '<p>· 团队席位 5% 分成权益与区域被动收益权益不可同时享受。</p>'+
        '<p>· 合伙人晋升后，历史订单按原等级结算，新增与续费按新等级执行。</p>'+
        '<p>· 分销层级限定两级，超出两级不再产生分佣。</p></div>'+
        '<button class="btn btn-soft btn-sm" data-act="nav" data-v="rules">查看完整政策口径 →</button>'+
      '</div></div></div>';
  }
};

/* ==================== 晋升中心 ==================== */
PAGES.upgrade={
  html(a){
    const l=P.levels[a.level], award=P.seatAward[a.level]||P.seatAward.bronze;
    const progress=l&&l.key==='bronze'?Math.min(100,a.seats/150*100):(l&&l.key==='silver'?Math.min(100,a.seats/300*100):100);
    /* 免费晋升第二条路径：累计推荐合伙人（表 6） */
    const refTarget=(l&&l.key==='bronze')?{silver:2,gold:1,seats:150,next:'银牌合伙人'}:(l&&l.key==='silver')?{silver:5,gold:2,seats:300,next:'金牌合伙人'}:null;
    const silverCnt=(a.team||[]).filter(t=>t.level==='银牌合伙人').length;
    const goldCnt=(a.team||[]).filter(t=>t.level==='金牌合伙人').length;
    const refDone=refTarget?(silverCnt>=refTarget.silver&&goldCnt>=refTarget.gold):true;
    const refPct=refTarget?Math.min(100,Math.min(silverCnt/refTarget.silver,goldCnt/refTarget.gold)*100):100;
    return '<div class="card"><div class="card-bd"><div class="row between wrap" style="gap:16px">'+
      '<div class="row" style="gap:14px"><div class="avatar gold">'+esc(l?l.short:'顾')+'</div><div><b style="font-size:16px">当前等级：'+levelName(a)+'</b><div class="small muted mt6">累计成交 '+num(a.seats)+' 席 · 一级绑定合伙人 '+a.teamCount+' 位 · 席位成交奖金已发放 '+a.awardTimes+' 次</div></div></div>'+
      '<div style="text-align:right"><div class="small muted">下一等级</div><b style="font-size:17px;color:var(--gold)">'+esc(a.upgradeNext==='—'?'已达最高等级':a.upgradeNext)+'</b></div></div></div></div>'+

    '<div class="grid g2 mt18">'+
      '<div class="card">'+cardHead('免费晋升通道','表 6 · 满足其一即可','<span class="tag tag-green">免费</span>')+'<div class="card-bd">'+
        '<div class="between mb6"><span class="small">路径一 · 自身 + 直推团队累计成交席位</span><b class="num">'+num(a.seats)+' / '+(l&&l.key==='bronze'?'150':(l&&l.key==='silver'?'300':'已达上限'))+'</b></div>'+
        '<div class="progress '+(progress>=100?'green':'gold')+'"><i style="width:'+progress+'%"></i></div>'+
        '<div class="between mb6 mt14"><span class="small">路径二 · 累计推荐合伙人达标</span><b class="num">'+(refDone?'✓ 已达标':'未达标')+'</b></div>'+
        (refTarget
          ? '<div class="kv"><span>累计推荐银牌合伙人</span><b class="num">'+silverCnt+' / '+refTarget.silver+' 位'+(silverCnt>=refTarget.silver?' ✓':'')+'</b></div>'+
            '<div class="kv"><span>累计推荐金牌合伙人</span><b class="num">'+goldCnt+' / '+refTarget.gold+' 位'+(goldCnt>=refTarget.gold?' ✓':'')+'</b></div>'+
            '<div class="progress '+(refDone?'green':'gold')+' mt6"><i style="width:'+refPct+'%"></i></div>'+
            '<div class="small muted mt6">同时满足银牌 '+refTarget.silver+' 位、金牌 '+refTarget.gold+' 位即可免费晋升至'+refTarget.next+'；一级绑定合伙人共 '+((a.team||[]).length)+' 位。</div>'
          : '<div class="small muted">当前已达最高等级，推荐合伙人路径不再适用。</div>')+
        '<div class="divider"></div>'+
        P.upgrades.map(x=>'<div class="rule-block"><h4><span class="rn">↑</span>'+x.from+' → '+x.to+'</h4><ul>'+x.conditions.map(c=>'<li>'+c+'</li>').join('')+'</ul></div>').join('')+
        '<button class="btn btn-primary btn-block" data-act="upgradeApply" data-v="free">提交达标晋升申请</button>'+
      '</div></div>'+
      '<div class="card">'+cardHead('补差价晋升','补充说明 · 交钱晋升路径','<span class="tag tag-gold">即时生效</span>')+'<div class="card-bd">'+
        '<div class="card" style="box-shadow:none;background:#FAFCFF">'+pageTable(['晋升路径','晋升费用','推荐人奖励（20%）','说明'],
          P.paidUpgrade.map(x=>'<tr><td><b>'+x.path+'</b></td><td><b class="num">'+fmt(x.fee)+'</b></td><td>'+fmt(x.reward)+'</td><td class="small">'+x.note+'</td></tr>'))+'</div>'+
        '<div class="section-title">推荐代理费分成（表 10）</div>'+
        '<div class="card" style="box-shadow:none;background:#FAFCFF">'+pageTable(['推荐方','被推荐方','分成比例'],P.referral.matrix.map(m=>'<tr><td>'+m[0]+'</td><td>'+m[1]+'</td><td><b>'+m[2]+'</b></td></tr>'))+'</div>'+
        '<button class="btn btn-gold btn-block mt14" data-act="upgradeApply" data-v="paid">申请补差价晋升</button>'+
      '</div></div></div>'+

    '<div class="grid g2 mt18">'+
      '<div class="card">'+cardHead('席位成交奖金','表 11 · '+P.seatAward.cap)+'<div class="card-bd">'+
        '<div class="kv"><span>当前等级标准</span><b>'+award.label+'</b></div>'+
        '<div class="kv"><span>累计成交席位</span><b>'+num(a.seats)+' 席</b></div>'+
        '<div class="kv"><span>已发放次数</span><b>'+a.awardTimes+' / 4 次</b></div>'+
        '<div class="between mb6 mt14"><span class="small">下一档达标进度</span><b>'+(award.step?num(a.seats%award.step)+' / '+num(award.step):'不适用')+'</b></div>'+
        '<div class="progress gold"><i style="width:'+(award.step?(a.seats%award.step)/award.step*100:0)+'%"></i></div>'+
      '</div></div>'+
      '<div class="card">'+cardHead('晋升结算规则','补充说明第 5 条')+'<div class="card-bd">'+
        '<div class="notice"><span class="ni">ℹ</span><div>'+P.upgradeRule+'</div></div>'+
        '<div class="section-title">系统实现口径</div>'+
        '<div class="kv"><span>历史订单</span><b>按下单时锁定的分佣快照结算</b></div>'+
        '<div class="kv"><span>增量订单</span><b>晋升生效后按新等级标准</b></div>'+
        '<div class="kv"><span>奖励清算</span><b>先结算晋升前已达标的全部奖励，再重新起算</b></div>'+
        '<div class="kv"><span>跨级晋升</span><b>需总部审批，默认逐级晋升</b></div>'+
      '</div></div></div>';
  }
};

/* ==================== 团队与邀请 ==================== */
PAGES.team={
  head(a){ return '<button class="btn btn-ghost btn-sm" data-act="export" data-v="team">导出团队看板</button>'; },
  html(a){
    const invite='MJYY-'+a.id;
    const linkPartner='https://partner.minjiangyue.com/i/'+invite;
    const linkCompany='https://corp.minjiangyue.com/i/'+invite;
    const teamSeats=a.team.reduce((s,t)=>s+t.seats,0), teamAmount=a.team.reduce((s,t)=>s+t.amount,0);
    return '<div class="grid g2" style="grid-template-columns:1fr 1.6fr">'+
      '<div class="card">'+cardHead('我的专属邀请码','拉新绑定入口')+'<div class="card-bd">'+
        '<div class="row" style="gap:18px;align-items:flex-start">'+U.qr(a.id.length*137)+
        '<div style="flex:1"><div class="small muted">邀请码</div><div style="font-size:20px;font-weight:800;letter-spacing:1px;color:var(--brand);margin:2px 0 10px">'+invite+'</div>'+
        '<div class="small muted mt10">合伙人管理后台链接</div>'+
        '<div class="small" style="word-break:break-all;color:var(--text-2);margin:2px 0 5px">'+linkPartner+'</div>'+
        '<button class="btn btn-ghost btn-sm" data-act="copyLinkPartner">复制合伙人后台链接</button>'+
        '<div class="small muted mt10">企业后台链接</div>'+
        '<div class="small" style="word-break:break-all;color:var(--text-2);margin:2px 0 5px">'+linkCompany+'</div>'+
        '<button class="btn btn-ghost btn-sm" data-act="copyLinkCompany">复制企业后台链接</button>'+
        '<div class="row wrap mt12"><button class="btn btn-primary btn-sm" data-act="copyInvite">复制邀请码</button></div></div></div>'+
        '<div class="notice mt14"><span class="ni">ℹ</span><div>客户或新合伙人通过邀请码注册/下单即自动建立推荐—被推荐关系；分销层级限定两级，超出两级不再产生分佣。</div></div>'+
      '</div></div>'+
      '<div><div class="grid g2">'+statCard('一级绑定合伙人',a.teamCount+' <small style="font-size:13px;font-weight:500">位</small>','金 '+a.team.filter(t=>t.level==='金牌合伙人').length+' · 银 '+a.team.filter(t=>t.level==='银牌合伙人').length+' · 铜 '+a.team.filter(t=>t.level==='铜牌合伙人').length)+
        statCard('团队推销席位',num(teamSeats)+' <small style="font-size:13px;font-weight:500">席</small>','被邀合伙人推销成交的席位总量','gold')+
        statCard('席位金额',fmt(teamAmount),'推销席位对应成交总金额','green')+
        statCard('预计 5% 分成',fmt(Math.round(teamSeats*350*.05)),'被推荐方新增席位开发收益分成','purple')+'</div>'+
        '<div class="card mt18">'+cardHead('数据权限说明','补充说明第 7 条')+'<div class="card-bd">'+
          '<p class="small" style="line-height:1.9;color:var(--text-2)">邀请人可实时查看其<b>一级绑定合伙人</b>的发展概况，包含：合伙人数量、合伙人等级、晋升费用、企业席位数量、新增席位数量、续费席位数量、企业购买金额七个维度。数据仅供邀请人查看一级绑定概况，<b>不涉及跨级数据，且不包含敏感的企业客户明细信息</b>。</p>'+
        '</div></div></div></div>'+

    '<div class="section-title mt24">一级绑定合伙人看板</div>'+
    '<div class="card">'+pageTable(['合伙人','等级','晋升费用','企业席位数量','新增席位数量','续费席位数量','企业购买金额','绑定日期','活跃度','预计分成'],
      a.team.map(t=>'<tr><td><b>'+esc(t.name)+'</b></td><td>'+U.levelTag(t.level==='金牌合伙人'?'gold':(t.level==='银牌合伙人'?'silver':'bronze'))+'</td><td class="num">'+fmt(t.fee)+'</td><td>'+t.seats+' 席</td><td class="num">'+(t.newSeats||0)+' 席</td><td class="num">'+(t.renewSeats||0)+' 席</td><td class="num">'+fmt(t.amount)+'</td><td>'+t.date+'</td><td>'+U.tag(t.active)+'</td><td class="num"><b>'+fmt(Math.round(t.seats*350*.05))+'</b></td></tr>'),'暂无绑定合伙人，分享邀请码开始组建团队')+'</div></div>'+

    '<div class="section-title mt24">团队成员</div>'+
    '<div class="grid g4">'+(a.team.length?a.team.map(t=>'<div class="team-card"><div class="tc-hd"><div class="avatar gray">'+esc(t.name.slice(0,1))+'</div><div><b>'+esc(t.name)+'</b><div class="small muted">'+esc(t.level)+'</div></div>'+U.tag(t.active)+'</div>'+
      '<div class="tc-grid"><div>推销席位<b>'+t.seats+'</b></div><div>席位金额<b>'+fmt(t.amount)+'</b></div><div>绑定日期<b>'+t.date+'</b></div></div></div>').join(''):'<div class="empty" style="grid-column:1/-1"><div class="em">◎</div>暂无团队成员</div>')+'</div>'+

    '<div class="notice mt18"><span class="ni">ℹ</span><div><b>推荐奖励口径：</b>任意合伙人推荐新合伙人，可获得被推荐方代理费的 '+P.referral.partnerFeeRate*100+'% 分成（晋升按差价口径）；额外享有被推荐方新增席位开发收益 5% 分成，该席位后续续费同样按 5% 计发。该收益与区域被动收益权益不可同时享受。</div></div>';
  }
};

/* ==================== 席位订单 ==================== */
PAGES.orders={
  head(a){ return '<button class="btn btn-ghost btn-sm" data-act="export" data-v="orders">导出订单</button>'; },
  html(a,st){
    const f=st.filters, per=10;
    let rows=a.orders.filter(o=>(!f.kw||(o.customer+o.id+o.product).toLowerCase().includes(f.kw.toLowerCase()))&&(!f.orderStatus||o.status===f.orderStatus));
    const pages=Math.max(1,Math.ceil(rows.length/per)), pg=Math.min(st.page,pages), shown=rows.slice((pg-1)*per,pg*per);
    const newSeats=a.orders.filter(o=>o.type==='新增').reduce((s,o)=>s+o.seats,0);
    const renewSeats=a.orders.filter(o=>o.type==='续费').reduce((s,o)=>s+o.seats,0);
    return '<div class="grid g4">'+statCard('累计成交席位',num(a.seats)+' <small style="font-size:13px;font-weight:500">席</small>','合伙人全周期业绩')+
      statCard('本期新增席位',newSeats+' <small style="font-size:13px;font-weight:500">席</small>','按首年单价计发分润')+
      statCard('本期续费席位',renewSeats+' <small style="font-size:13px;font-weight:500">席</small>','按年度折扣计发分润','gold')+
      statCard('订单总数',a.orders.length+' <small style="font-size:13px;font-weight:500">笔</small>','含新增与续费','purple')+'</div>'+

    '<div class="section-title mt24">订单明细 <span class="small muted" style="font-weight:400">点击行查看分润快照</span></div>'+
    '<div class="card"><div class="card-bd">'+
      '<div class="filter-bar"><input class="input" data-k="kw" placeholder="搜索客户 / 订单号 / 产品" value="'+esc(f.kw)+'">'+
      '<select class="select" data-k="orderStatus"><option value="">全部状态</option><option value="已成交" '+(f.orderStatus==='已成交'?'selected':'')+'>已成交</option><option value="已失效" '+(f.orderStatus==='已失效'?'selected':'')+'>已失效</option></select>'+
      '<span class="small muted" style="margin-left:auto">共 '+rows.length+' 笔订单</span></div>'+
      pageTable(['订单号','客户名称','产品','席位','业务类型','首购基准日','业绩年度','订单金额','状态'],
        shown.map(o=>'<tr style="cursor:pointer" data-act="orderDetail" data-v="'+o.id+'"><td><b>'+o.id+'</b></td><td>'+esc(o.customer)+'</td><td>'+o.product+'</td><td>'+o.seats+' 席</td><td><span class="tag '+(o.type==='新增'?'tag-blue':'tag-gold')+'">'+o.type+'</span></td><td>'+o.baseDate+'</td><td>第 '+o.yearNo+' 年</td><td class="num">'+fmt(o.amount)+'</td><td>'+U.tag(o.status)+'</td></tr>'),'暂无订单')+
      '<div class="pager"><span>第 '+pg+' / '+pages+' 页</span><div class="pg">'+Array.from({length:pages},(_,i)=>'<button class="'+(i+1===pg?'active':'')+'" data-act="page" data-v="'+(i+1)+'">'+(i+1)+'</button>').join('')+'</div></div>'+
    '</div></div>'+
    '<div class="notice mt14"><span class="ni">ℹ</span><div><b>新增 / 续费判定：</b>以客户「首次购买第一个席位」的日期为统一基准起算日，基准日锁定后不因增购、换购改变；基准日所在年度首次成交计为新增，此后同一客户的席位购买（含次年续费、增购）按对应年度折扣计为续费。每年独立核算，不做跨年抵扣。客户当年满足活跃度要求，续费奖励于年底或次年年初统一发放。</div></div>';
  }
};

/* ==================== 结算与提现 ==================== */
PAGES.settlement={
  head(a){ return '<div class="row"><button class="btn btn-ghost btn-sm" data-act="export" data-v="bill">导出账单</button><button class="btn btn-primary btn-sm" data-act="withdraw">申请提现</button></div>'; },
  html(a){
    const wds=App.state.withdrawals;
    const yearSplit=(a.level==='gold'||a.level==='bronze');
    const topCards=yearSplit
      ? '<div class="grid g5">'+statCard('可提现余额',fmt(avail(a)),'已结算收益扣减已提现','green')+
        statCard('本期账单',fmt(a.bills[0].amount),'2026-10 账期 · 待结算','gold')+
        statCard('自动结算日','11 月 25 日','次月 1 日出账单 · 不含续费')+
        statCard('续费自动结算日','次年 1 月 25 日','续费分润按年结算','orange')+
        statCard('提现申请',wds.length+' <small style="font-size:13px;font-weight:500">笔</small>','审核中 '+wds.filter(w=>w.status==='审核中').length+' 笔','purple')+'</div>'
      : '<div class="grid g4">'+statCard('可提现余额',fmt(avail(a)),'已结算收益扣减已提现','green')+
        statCard('本期账单',fmt(a.bills[0].amount),'2026-10 账期 · 待结算','gold')+
        statCard('自动结算日','11 月 25 日','次月 1 日出账单')+
        statCard('提现申请',wds.length+' <small style="font-size:13px;font-weight:500">笔</small>','审核中 '+wds.filter(w=>w.status==='审核中').length+' 笔','purple')+'</div>';
    return topCards+

    '<div class="grid g2 mt18" style="grid-template-columns:1fr 1.3fr">'+
      '<div class="card">'+cardHead('结算周期',yearSplit?'按月 + 按年双周期':'系统自动结算')+'<div class="card-bd"><div class="timeline">'+
        '<div class="tl-item done"><b>业务发生</b><p>订单成交 / 推荐落地，系统按等级规则生成收益单与分润快照</p></div>'+
        '<div class="tl-item done"><b>次月 1 日 · 出账单</b><p>汇总上月收益（不含续费分润），生成账单，合伙人可在线核对</p></div>'+
        '<div class="tl-item"><b>次月 25 日 · 自动结算</b><p>按月项目自动结算至账户：新增席位佣金、推荐奖励、席位成交奖金（新增）等</p></div>'+
        (yearSplit?'<div class="tl-item"><b>次年 1 月 25 日 · 续费按年结算</b><p>续费分润按年结算：次年 1 月 1 日出账、1 月 25 日结算，首页「按年待结算」可查；席位成交奖金（续费）同口径</p></div>':'')+
        '<div class="tl-item"><b>发票 / 开票校验</b><p>'+P.meta.invoiceRule+'</p></div>'+
        '<div class="tl-item"><b>提现打款</b><p>财务审核通过后打款至绑定结算账户</p></div>'+
      '</div></div></div>'+
      '<div><div class="card">'+cardHead('结算项目与时间',yearSplit?'续费分润按年结算':'补充说明第 6 条')+'<div class="tbl-wrap"><table class="tbl"><thead><tr><th>业务类型</th><th>出账时间</th><th>结算时间</th><th>周期</th></tr></thead><tbody>'+
        (yearSplit
          ? P.settlementSplit.map(x=>'<tr'+(x.cycle==='年'?' style="background:#FFF8EC"':'')+'><td>'+x.type+'</td><td>'+x.bill+'</td><td><b>'+x.pay+'</b></td><td><span class="tag '+(x.cycle==='年'?'tag-orange':'tag-blue')+'">按'+x.cycle+'</span></td></tr>').join('')
          : P.settlementItems.map(x=>'<tr><td>'+x.type+'</td><td>'+x.bill+'</td><td><b>'+x.pay+'</b></td><td><span class="tag tag-blue">按月</span></td></tr>').join(''))+'</tbody></table></div></div>'+
        '<div class="card mt18">'+cardHead('账期账单','最近 4 期')+'<div class="tbl-wrap"><table class="tbl"><thead><tr><th>账期</th><th>笔数</th><th>金额</th><th>结算日</th><th>状态</th></tr></thead><tbody>'+
        a.bills.map(b=>'<tr><td><b>'+b.period+'</b></td><td>'+b.count+'</td><td class="num"><b>'+fmt(b.amount)+'</b></td><td>'+b.payDate+'</td><td>'+U.tag(b.status)+'</td></tr>').join('')+'</tbody></table></div></div>'+
      '</div></div></div>'+

    '<div class="section-title mt24">提现记录</div>'+
    '<div class="card">'+pageTable(['申请日期','提现金额','结算账户','发票 / 开票','状态'],
      wds.map(w=>'<tr><td>'+w.date+'</td><td class="num"><b>'+fmt(w.amount)+'</b></td><td>'+esc(w.bank)+'</td><td>'+(U.isCorp(a.subject)?'增值税发票已上传':'系统自动开票')+'</td><td>'+U.tag(w.status)+'</td></tr>'),'暂无提现记录，点击右上角「申请提现」发起')+'</div></div>'+
    '<div class="notice mt14"><span class="ni">ℹ</span><div>'+P.meta.settlement.note+(yearSplit?'。<b>续费按年口径：</b>续费分润与席位成交奖金（续费）不参与按月自动结算，次年 1 月 1 日出账、1 月 25 日结算；按月账单与待结算统计均不含续费分润。':'')+'。<b>退费口径：</b>政策未明确中途退出的代理费退还与已售席位分润处理，系统预留「退出/退费申请」入口，提交后进入总部人工审核，已结算收益不回滚、未结算账单冻结待审，最终以双方签署的渠道合作协议为准。</div></div>';
  }
};

/* ==================== 权益架构图（纯文本 · 可选中复制） ==================== */
PAGES.equityMap={
  html(){
    /* em: 一级分支  node: 二级节点  leaf: 三级明细 —— 全部为可选中文本 */
    return '<div class="card"><div class="card-hd"><h3>城市合伙人及服务商权益体系架构<span class="sub">全链路一图总览 · 文字可选中复制</span></h3>'+
      '<span class="tag tag-blue">八大身份 · 九个类别</span></div><div class="card-bd">'+
      '<p class="small muted" style="margin-bottom:14px">金牌合伙人、银牌合伙人、铜牌合伙人、中心城市服务商、地级城市服务商、高级总顾问招募城市服务商、高级总顾问招募城市合伙人、其他顾问、全员营销，八个身份九个类别。</p>'+

      em('01','体系总览',[
        leaf('城市合伙人（金牌 / 银牌 / 铜牌）→ 城市服务商（中心 / 地级）→ 顾问体系 → 全员营销')
      ])+

      em('02','合伙人体系 → 权益对比',[
        node('金牌合伙人',[leaf('代理费 69,800 元 ｜ 安心云首年 350 元/单 ｜ 如意宝首年 240 元/单 ｜ 福运宝 4%~0.4% （一4‰，二2‰，三1.2‰，四0.8‰，五0.4‰）｜续费收益：续费年第一年50%，二30%，三20%，四10% ｜ 活跃度 ≥400 单/年')]),
        node('银牌合伙人',[leaf('代理费 6,980 元 ｜ 安心云首年 200 元/单 ｜ 如意宝首年 180 元/单 ｜ 福运宝 3%~0.3% （一3‰，二1.5‰，三0.9‰，四0.6‰，五0.3‰）｜续费收益：续费年第一年50%，二30%，三20%，四10% ｜ 活跃度 ≥100 单/年')]),
        node('铜牌合伙人',[leaf('代理费 0 元 ｜ 安心云首年 130 元/单 ｜ 如意宝首年 130 元/单 ｜ 福运宝 2%~0.2% （一2‰，二1‰，三0.6‰，四0.4‰，五0.2‰）｜ 续费年安心云，如意宝通金银比例｜活跃度 ≥10 单/年')])
      ])+

      em('03','合伙人晋升通道',[
        node('铜牌 → 银牌',[leaf('路径一：自身 + 直推团队累计席位 ≥150 个 ｜ 路径二：推荐银牌 2 位 + 金牌 1 位')]),
        node('银牌 → 金牌',[leaf('路径一：自身 + 直推团队累计席位 ≥300 个 ｜ 路径二：推荐银牌 5 位 + 金牌 2 位')])
      ])+

      em('04','合伙人推荐奖励机制',[
        leaf('代理费分成 20% ｜ 被推荐方新增席位收益 5% 分成 ｜ 续费权益：同享 5% 计发')
      ])+

      em('05','合伙人席位成交奖金',[
        leaf('金牌：每 1000 席位奖 2 万元（限 4 次）｜ 银牌：每 100 席位奖 2000 元（限 4 次）')
      ])+

      em('06','城市服务商 → 中心 / 地级对比',[
        node('中心城市服务商',[leaf('加盟费 50 万元 ｜ 城市：一线城市 / 省会 + 最多 4 副城 ｜ 任务：3 万单')]),
        node('地级城市服务商',[leaf('加盟费 20 万元 ｜ 城市：地级市排名 100 内 ｜ 任务：1 万单')]),
        node('分润标准（中心 = 地级）',[leaf('安心云首年 410 元/单、次年起 50% ｜ 如意宝首年 300 元/单、次年起 50% ｜ 福运宝首年 5%、次年起 2.5%')])
      ])+

      em('07','城市服务商招商奖励',[
        leaf('推荐中心服务商 5 万元 ｜ 推荐地级服务商 2 万元 ｜ 推荐金牌 13,960 元 ｜ 推荐银牌 1,396 元 ｜ 被推荐方新增和续费席位收益 5% 分成')
      ])+

      em('08','城市服务商被动收益',[
        leaf('安心云新席 60 元/席 ｜ 如意宝新席 80 元/席 ｜ 福运宝新席流水 1% ｜ 备注：自主开发不计入')
      ])+

      em('09','顾问招商奖励',[
        node('招商城市服务商',[
          sub('高级总顾问',[leaf('自有资源招商 5% ｜ 直接推荐招商 15% ｜ 转介绍：总顾问 5% + 其他顾问 10%')]),
          sub('其他顾问',[leaf('推荐成功城市服务商：招商额 10%')])
        ]),
        node('招商城市合伙人',[leaf('城市合伙人加盟费 20% 的推荐奖励 ｜ 被推荐方新增和续费席位收益 5% 分成 ｜ 该收益与区域被动收益权益不可同时享受')])
      ])+

      em('10','全员营销（公司员工）',[
        leaf('基础权益：铜牌合伙人权益 ｜ 推荐中心服务商 2.5 万元 ｜ 推荐地级服务商 1 万元')
      ])+

      '</div></div>';
  }
};
function em(no,title,lines){
  return '<div class="em-block"><div class="em-hd"><span class="em-no">'+no+'</span><b>'+title+'</b></div>'+
    '<div class="em-bd">'+lines.join('')+'</div></div>';
}
function node(title,lines){
  return '<div class="em-node"><div class="em-node-t">'+title+'</div><div class="em-node-b">'+lines.join('')+'</div></div>';
}
function sub(title,lines){
  return '<div class="em-sub"><div class="em-sub-t">'+title+'</div><div class="em-sub-b">'+lines.join('')+'</div></div>';
}
function leaf(text){
  return '<div class="em-leaf">'+text+'</div>';
}

/* ==================== 政策与规则 ==================== */
PAGES.rules={
  head(){ return '<span class="tag tag-blue">'+P.meta.version+'</span>'; },
  html(a){
    const faq=P.faq, pending=faq.filter(f=>f.tag==='待总部确认').length;
    return '<div class="card"><div class="card-bd"><div class="row between wrap" style="gap:16px">'+
      '<div><h3 style="font-size:17px">民匠有约招商政策（2026版）· 综合版</h3>'+
      '<p class="small muted mt6">'+P.meta.scope+'。'+P.meta.effective+'。</p>'+
      '<p class="small muted">规则依据：主政策表 1–表 11、金银铜合伙人分佣体系补充说明、服务商问题梳理口径。</p></div>'+
      '<div class="row"><span class="tag tag-green">系统口径已同步</span><span class="tag tag-orange">'+pending+' 项待总部确认</span></div></div></div></div>'+

    '<div class="section-title mt24">一、分润政策总表（表 5）</div>'+
    '<div class="card">'+pageTable(['等级','代理费','产品','首年分润','第 2 年','第 3 年','第 4 年','第 5 年及以后','年活跃度'],
      Object.values(P.levels).flatMap(lv=>['安心云','如意宝','福运宝'].map((p,i)=>{
        const d=lv.products[p], renew=d.type==='flow'?d.rates.slice(1):d.renewLabel;
        return '<tr>'+(i===0?'<td rowspan="3"><b>'+lv.name+'</b></td><td rowspan="3">'+fmt(lv.fee)+'</td>':'')+'<td>'+p+'</td><td><b>'+d.firstLabel+'</b></td>'+
          [0,1,2,3].map(j=>'<td>'+(renew[j]||'—')+'</td>').join('')+(i===0?'<td rowspan="3">≥'+lv.active+' 单/年</td>':'')+'</tr>';
      })))+'</div></div>'+

    '<div class="grid g2 mt18">'+
      '<div class="card">'+cardHead('二、招商奖励政策','表 8 / 表 9 / 表 10')+'<div class="card-bd">'+
        '<div class="rule-block"><h4><span class="rn">1</span>顾问招商奖励（城市服务商）</h4><p>总顾问直推 15%、间推 5%；总顾问介绍的其他顾问直推 10%；其他顾问直推 10%。顾问推荐招商只分设两级。</p></div>'+
        '<div class="rule-block"><h4><span class="rn">2</span>城市服务商招商奖励</h4><ul>'+P.serviceRecruit.map(x=>'<li>'+x.target+' → <b>'+fmt(x.amount)+'</b></li>').join('')+'</ul></div>'+
        '<div class="rule-block"><h4><span class="rn">3</span>员工招商（全员营销）</h4><p>'+P.employee.note+'</p><ul>'+P.employee.rewards.map(x=>'<li>'+x.target+' → <b>'+fmt(x.amount)+'</b></li>').join('')+'</ul></div>'+
        '<div class="rule-block" style="margin-bottom:0"><h4><span class="rn">4</span>合伙人推荐奖励</h4><p>'+P.referral.partnerFeeNote+'</p><p>'+P.referral.seatShareNote+'</p></div>'+
      '</div></div>'+
      '<div><div class="card">'+cardHead('三、城市服务商被动收益权益','第五章')+'<div class="card-bd">'+
        '<p class="small" style="line-height:1.85;color:var(--text-2)">'+P.passive.intro+'</p>'+
        P.passive.rows.map(x=>'<div class="kv"><span>'+x.product+'</span><b>'+x.rule+'</b></div>').join('')+
      '</div></div>'+
      '<div class="card mt18">'+cardHead('四、城市服务商收益测算','表 1 · 中心城市 / 年')+'<div class="card-bd" style="padding:12px">'+
        P.providerIncome.center.slice(0,6).map(x=>'<div class="kv"><span>'+x.item+'</span><b>'+x.value+'</b></div>').join('')+
        '<div class="kv" style="border-top:1px dashed var(--line);padding-top:12px"><span><b>合计</b></span><b style="color:var(--gold);font-size:16px">1672.4 万+</b></div>'+
        '<button class="btn btn-ghost btn-sm btn-block mt10" data-act="toast" data-v="地级城市服务商测算：609.4 万+（推广 300 万 / 国通 180 万 / 加盟 52.4 万 等）">查看地级城市测算</button>'+
      '</div></div></div></div>'+

    '<div class="section-title mt24">五、结算与绑定口径</div>'+
    '<div class="grid g3">'+
      '<div class="rule-block"><h4><span class="rn">¥</span>自动结算</h4><p>'+P.meta.settlement.billDay+'，'+P.meta.settlement.payDay+'。'+P.meta.invoiceRule+'。</p></div>'+
      '<div class="rule-block"><h4><span class="rn">◎</span>拉新绑定</h4><p>'+P.meta.bindRule+'。合伙人可查看一级绑定合伙人的数量、等级、晋升费用、企业席位数量、新增席位数量、续费席位数量、企业购买金额。</p></div>'+
      '<div class="rule-block"><h4><span class="rn">◷</span>基准日锁定</h4><p>'+P.meta.baseDateRule+'。客户当年满足活跃度要求，续费奖励于年底或次年年初统一发放。</p></div>'+
    '</div>'+

    '<div class="section-title mt24">六、业务口径与常见问题 <span class="small muted" style="font-weight:400">源自《服务商问题梳理》17 项 · 点击展开</span></div>'+
    '<div class="card"><div class="card-bd">'+
      faq.map((f,i)=>'<div class="faq"><div class="q" data-act="faq"><span>'+(i+1)+'. '+f.q+'</span><span class="tag '+(f.tag==='待总部确认'?'tag-orange':(f.tag==='系统实现'?'tag-blue':'tag-green'))+'">'+f.tag+'</span></div><div class="a hide">'+f.a+'</div></div>').join('')+
    '</div></div>'+

    '<div class="section-title mt24">七、系统补充能力 <span class="small muted" style="font-weight:400">产品经理补齐项</span></div>'+
    '<div class="card"><div class="card-bd"><div class="grid g4">'+P.extras.map((x,i)=>'<div class="row" style="align-items:flex-start;gap:9px"><span class="tag tag-blue" style="flex:0 0 auto">'+String(i+1).padStart(2,'0')+'</span><span class="small">'+x+'</span></div>').join('')+'</div></div></div>'+
    '<div class="notice warn mt18"><span class="ni">⚠</span><div><b>合规提示：</b>标注「待总部确认」的 '+pending+' 项口径尚未在正式政策中明确，系统当前采用的实现口径仅供业务演示，正式上线前须由总部书面确认后固化。'+P.meta.footnote+'</div></div>';
  }
};

/* ==================== 消息中心 ==================== */
PAGES.messages={
  head(){ return '<button class="btn btn-ghost btn-sm" data-act="markRead">全部标为已读</button>'; },
  html(a,st){
    const unread=D.NOTICES.filter(n=>n.unread&&!st.readNotices.includes(n.title)).length;
    return '<div class="grid g3">'+statCard('未读消息',unread+' <small style="font-size:13px;font-weight:500">条</small>','结算 / 政策 / 团队')+
      statCard('消息总数',D.NOTICES.length+' <small style="font-size:13px;font-weight:500">条</small>','近 30 天')+
      statCard('结算提醒','1 <small style="font-size:13px;font-weight:500">条</small>','10 月账单已生成','gold')+'</div>'+
    '<div class="section-title mt24">全部消息</div>'+
    '<div class="card"><div class="card-bd">'+
      D.NOTICES.map(n=>{const read=!n.unread||st.readNotices.includes(n.title);
        return '<div class="msg-item"><div class="msg-ico" style="background:'+n.color+'">'+n.icon+'</div><div style="flex:1"><div class="row"><b style="font-size:13px">'+n.title+'</b>'+(read?'':'<span class="tag tag-red">未读</span>')+'<span class="tag tag-gray" style="margin-left:auto">'+n.type+'</span></div>'+
        '<p class="small muted" style="margin-top:4px;line-height:1.7">'+n.desc+'</p><div class="small muted mt6">'+n.date+'</div></div></div>';}).join('')+
    '</div></div>'+
    '<div class="card mt18">'+cardHead('通知设置')+'<div class="card-bd">'+
      '<div class="kv"><span>账单生成 / 自动结算提醒</span><b style="color:var(--down)">✓ 已开启</b></div>'+
      '<div class="kv"><span>团队晋升与推荐奖励</span><b style="color:var(--down)">✓ 已开启</b></div>'+
      '<div class="kv"><span>政策更新与协议年审</span><b style="color:var(--down)">✓ 已开启</b></div>'+
    '</div></div>';
  }
};

/* ==================== 账户设置 ==================== */
PAGES.settings={
  html(a){
    return '<div class="grid g2" style="grid-template-columns:1.2fr 1fr">'+
      '<div class="card">'+cardHead('主体资料','入驻登记信息')+'<div class="card-bd">'+
        '<div class="form-grid">'+
        '<label class="field"><span>联系人姓名</span><input class="input" value="'+esc(a.name)+'"></label>'+
        '<label class="field"><span>登录手机号</span><input class="input" value="'+esc(a.phone)+'"></label>'+
        '<label class="field full"><span>'+(U.isCorp(a.subject)?'企业名称':'身份证号')+'</span><input class="input" value="'+esc(a.company||a.name)+'"></label>'+
        '<label class="field"><span>主体类型</span><input class="input" value="'+esc(a.subject)+'" readonly></label>'+
        '<label class="field"><span>合伙人编号</span><input class="input" value="'+a.id+'" readonly></label>'+
        '<label class="field full"><span>签约区域</span><input class="input" value="'+esc(a.region)+'"></label>'+
        '</div><button class="btn btn-primary btn-sm" data-act="toast" data-v="资料变更已提交，需总部审核后生效">保存变更</button>'+
      '</div></div>'+
      '<div><div class="card">'+cardHead('合作身份','支持一人多身份','<button class="btn-text" data-act="identityModal">切换 ›</button>')+'<div class="card-bd">'+
        App.accounts().map(x=>'<div class="kv"><span>'+x.label+'<br><small class="muted">'+x.sub+'</small></span>'+(x.k===App.state.accountKey?'<b style="color:var(--brand)">当前身份</b>':'<button class="btn-text" data-act="switchIdentity" data-v="'+x.k+'">切换</button>')+'</div>').join('')+
      '</div></div>'+
      '<div class="card mt18">'+cardHead('结算与安全')+'<div class="card-bd">'+
        '<div class="kv"><span>结算账户</span><b>'+esc(a.bank)+'</b></div>'+
        '<div class="kv"><span>开票方式</span><b>'+(U.isCorp(a.subject)?'上传发票 · 财务审核':'线上自动开票')+'</b></div>'+
        '<div class="kv"><span>登录密码</span><button class="btn-text" data-act="toast" data-v="密码重置链接已发送至绑定手机号">修改 ›</button></div>'+
        '<div class="kv"><span>渠道合作协议</span><button class="btn-text" data-act="contract">查看 ›</button></div>'+
      '</div></div></div></div>'+

    '<div class="section-title mt24">其他操作</div>'+
    '<div class="card"><div class="card-bd"><div class="row wrap">'+
      '<button class="btn btn-ghost btn-sm" data-act="replay">↺ 重走加盟流程</button>'+
      '<button class="btn btn-ghost btn-sm" data-act="nav" data-v="rules">查看政策与规则</button>'+
      '<button class="btn btn-ghost btn-sm" data-act="toast" data-v="个人信息导出申请已提交">导出个人信息</button>'+
      '<button class="btn btn-ghost btn-sm" style="color:var(--up);border-color:#F3CFCB" data-act="logout">退出登录</button>'+
    '</div></div></div>'+
    '<div class="notice mt14"><span class="ni">ℹ</span><div>本系统为可交互业务原型，所有数据为演示数据，不产生真实交易与扣款。政策口径以公司正式发布文件为准，'+P.meta.footnote+'</div></div>';
  }
};

/* 页面级 action 兜底 */
PAGES._handle=function(act,v,t,e,App){
  switch(act){
    case 'gotoSource': App.state.filters.source=v; App.state.page=1; App.go('income'); return false;
    case 'orderStatus': App.state.filters.orderStatus=v; App.state.page=1; App.render(); return false;
  }
};
window.PAGES=PAGES;
})();
