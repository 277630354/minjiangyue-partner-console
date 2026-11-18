/* ============================================================
 * 民匠有约 · 合伙人后台 — 核心框架
 * 登录 / 加盟引导 / 路由 / 会话 / 通用组件 / 图表引擎
 * ============================================================ */
(function () {
'use strict';
const P = window.POLICY, D = window.DEMO;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

/* ---------------- 工具 ---------------- */
const U = {
  fmt(n){ return '¥' + Number(n || 0).toLocaleString('zh-CN'); },
  num(n){ return Number(n || 0).toLocaleString('zh-CN'); },
  pct(a, b){ return b ? (a / b * 100).toFixed(1) : '0.0'; },
  esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  src(key){ return P.sources.find(s => s.key === key) || { name:'其他业务收益', color:'#8A97A8', desc:'—' }; },
  tag(status){
    const m = { '已结算':'tag-green', '待结算':'tag-orange', '账单中':'tag-blue', '已成交':'tag-green', '已失效':'tag-gray', '达标':'tag-green', '预警':'tag-orange' };
    return '<span class="tag ' + (m[status] || 'tag-gray') + '">' + U.esc(status) + '</span>';
  },
  /* 账号主体存的是「企业主体 / 个人主体」，入驻表单里是「企业 / 个人」，统一按前缀判断 */
  isCorp(s){ return /^企业/.test(String(s || '')); },
  /* 高级总顾问两类账号：在「我的收益」里按角色直接展示对应账本 */
  isAdvisor(a){ return !!a && (a.level==='advisorService'||a.level==='advisorPartner'); },
  levelTag(level){
    const m = { gold:'tag-gold', silver:'tag-silver', bronze:'tag-bronze', center:'tag-blue', local:'tag-blue', advisor:'tag-blue', advisorService:'tag-blue', advisorPartner:'tag-blue' };
    const name = P.levels[level] ? P.levels[level].name : (P.providers[level] ? P.providers[level].name : (level==='advisorService'?'高级总顾问（城市服务商）':(level==='advisorPartner'?'高级总顾问（城市合伙人）':'高级总顾问')));
    return '<span class="tag ' + (m[level] || 'tag-gray') + '">' + name + '</span>';
  },
  today(){ return '2026-11-11'; },
  csv(filename, headers, rows){
    const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const txt = '\ufeff' + [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type:'text/csv;charset=utf-8' }));
    a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    U.toast('已导出 ' + filename);
  },
  toast(msg){
    const t = $('#toast'); if(!t) return;
    t.textContent = msg; t.classList.remove('hide');
    clearTimeout(U._tt); U._tt = setTimeout(() => t.classList.add('hide'), 2300);
  },
  copy(text){
    navigator.clipboard && navigator.clipboard.writeText(text).catch(()=>{});
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
    ta.select(); try { document.execCommand('copy'); } catch(e){} ta.remove();
    U.toast('已复制：' + text);
  },
  modal(title, body, footer){
    /* 弹窗与抽屉互斥，避免两层遮罩叠加后无法关闭 */
    $('#drawer').classList.add('hide'); $('#drawerMask').classList.add('hide');
    $('#modal').innerHTML = '<div class="modal-hd"><span>' + title + '</span><button class="close-x" data-act="closeModal">×</button></div>' +
      '<div class="modal-bd">' + body + '</div>' + (footer ? '<div class="modal-ft">' + footer + '</div>' : '');
    $('#modal').classList.remove('hide'); $('#modalMask').classList.remove('hide');
  },
  drawer(title, body, footer){
    $('#drawer').innerHTML = '<div class="drawer-hd"><span>' + title + '</span><button class="close-x" data-act="closeDrawer">×</button></div>' +
      '<div class="drawer-bd">' + body + '</div>' + (footer ? '<div class="drawer-ft">' + footer + '</div>' : '');
    $('#drawer').classList.remove('hide'); $('#drawerMask').classList.remove('hide');
  },
  /* 页面注解条：所有页面共用的统一注入点，内容取自 annotations.js */
  annotBar(key, compact){
    const A=window.ANNOT; const d=A&&A[key]; if(!d) return '';
    const M=window.ANNOT_META||{}, esc=U.esc, rs=d.r||[], ns=d.n||[];
    const refs=rs.slice(0,4).map(x=>'<span class="annot-ref">'+esc(x)+'</span>').join('')+
      (rs.length>4?'<span class="annot-ref">+'+(rs.length-4)+' 项</span>':'');
    const peek=compact?'':'<div class="annot-peek">'+ns.slice(0,2).map(x=>
      '<div class="annot-peek-item"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span><i>'+esc(x[2])+'</i></div>').join('')+'</div>';
    return '<div class="annot-bar'+(compact?' compact':'')+'" data-annot="'+esc(key)+'">'+
      '<div class="annot-main"><span class="annot-ico">注</span>'+
      '<div class="annot-txt"><div class="annot-head"><b>'+esc(d.t)+'</b>'+
      '<span class="annot-src">依据 '+esc(M.doc||'招商政策 2026 版')+'</span></div>'+
      (compact?'':'<p>'+esc(d.i)+'</p><div class="annot-refs">'+refs+'</div>')+'</div>'+
      '<div class="annot-ops"><button class="btn btn-sm btn-soft" data-act="openAnnot" data-v="'+esc(key)+'">查看全部 '+ns.length+' 条注解</button>'+
      '<button class="btn-text" data-act="toggleAnnot">隐藏注解</button></div></div>'+peek+'</div>';
  },
  sum(records, filter){ return records.filter(filter || (()=>true)).reduce((s, r) => s + r.amount, 0); },
  byMonth(records){ const m = {}; records.forEach(r => { const k = r.date.slice(0,7); m[k] = (m[k]||0)+r.amount; }); return m; },
  qr(seed){
    let s = seed, out = ''; const n = 21;
    const rnd = () => { s = (s*9301+49297)%233280; return s/233280; };
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const finder = (x<7&&y<7)||(x>n-8&&y<7)||(x<7&&y>n-8);
      let on = rnd() > .52;
      if (finder){
        const cx = x>n-8 ? n-4 : 3, cy = y>n-8 ? n-4 : 3;
        const dx = Math.abs(x-cx), dy = Math.abs(y-cy);
        on = (dx===3&&dy===3)||(dx<=3&&dy<=3&&(dx===3||dy===3||dx===1&&dy===1))||(dx<=1&&dy<=1);
        if (dx>3||dy>3) on = false;
      }
      if (on) out += '<rect x="'+x+'" y="'+y+'" width="1" height="1"/>';
    }
    return '<svg viewBox="-2 -2 25 25" width="132" height="132" fill="#182334" style="background:#fff;border:1px solid #E6EBF2;border-radius:8px">'+out+'</svg>';
  }
};
window.U = U;

/* ---------------- SVG 图表引擎（无外部依赖，离线可用） ---------------- */
const Chart = {
  line(values, labels, opt){
    opt = opt || {}; const W=760,H=236,L=54,R=14,T=16,B=30;
    const max = Math.max.apply(null, values.concat([1])) * 1.18, min = 0;
    const x = i => L + i*(W-L-R)/Math.max(1,values.length-1);
    const y = v => T + (1-(v-min)/(max-min))*(H-T-B);
    let grid='', labelsY='';
    for(let i=0;i<=4;i++){
      const gy=T+i*(H-T-B)/4, v=max-(max-min)*i/4;
      grid += '<line class="grid-line" x1="'+L+'" y1="'+gy+'" x2="'+(W-R)+'" y2="'+gy+'"/>';
      labelsY += '<text class="axis-txt" x="'+(L-9)+'" y="'+(gy+4)+'" text-anchor="end">'+(v>=10000?(v/10000).toFixed(0)+'万':Math.round(v))+'</text>';
    }
    let xl=''; labels.forEach((l,i)=>{ if(i%2===0||i===labels.length-1) xl += '<text class="axis-txt" x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+l.slice(2)+'</text>'; });
    const pts = values.map((v,i)=>x(i)+','+y(v)).join(' ');
    const area = 'M '+x(0)+','+(H-B)+' L '+values.map((v,i)=>x(i)+','+y(v)).join(' L ')+' L '+x(values.length-1)+','+(H-B)+' Z';
    let dots=''; values.forEach((v,i)=>{ dots += '<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3.2" fill="#fff" stroke="'+(opt.color||'#2D6BC0')+'" stroke-width="2"/>'; });
    return '<div class="chart-wrap"><svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+
      '<defs><linearGradient id="lgArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+(opt.color||'#2D6BC0')+'" stop-opacity=".24"/><stop offset="100%" stop-color="'+(opt.color||'#2D6BC0')+'" stop-opacity="0"/></linearGradient></defs>'+
      grid+labelsY+xl+'<path d="'+area+'" fill="url(#lgArea)"/>'+
      '<polyline points="'+pts+'" fill="none" stroke="'+(opt.color||'#2D6BC0')+'" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'+dots+'</svg></div>';
  },
  bars(values, labels, opt){
    opt=opt||{}; const W=760,H=236,L=54,R=14,T=16,B=30;
    const max=Math.max.apply(null,values.concat([1]))*1.18;
    const bw=(W-L-R)/values.length*.58, gap=(W-L-R)/values.length;
    let grid='',ly='';
    for(let i=0;i<=4;i++){
      const gy=T+i*(H-T-B)/4, v=max-max*i/4;
      grid+='<line class="grid-line" x1="'+L+'" y1="'+gy+'" x2="'+(W-R)+'" y2="'+gy+'"/>';
      ly+='<text class="axis-txt" x="'+(L-9)+'" y="'+(gy+4)+'" text-anchor="end">'+(v>=10000?(v/10000).toFixed(0)+'万':Math.round(v))+'</text>';
    }
    let bars='',xl='';
    values.forEach((v,i)=>{
      const h=Math.max(2,(v/max)*(H-T-B)), bx=L+i*gap+(gap-bw)/2, by=T+(H-T-B)-h;
      bars+='<rect class="chart-bar" x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+h+'" rx="4" fill="'+(i===values.length-1?(opt.hi||'#B8862B'):(opt.color||'#2D6BC0'))+'" opacity="'+(i===values.length-1?1:.82)+'"><title>'+labels[i]+'：'+U.fmt(v)+'</title></rect>';
      if(i%2===0||i===values.length-1) xl+='<text class="axis-txt" x="'+(bx+bw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+labels[i].slice(2)+'</text>';
    });
    return '<div class="chart-wrap"><svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+ly+xl+bars+'</svg></div>';
  },
  donut(items, centerTop, centerSub){
    const total=items.reduce((s,i)=>s+i.value,0)||1;
    const r=68, c=2*Math.PI*r; let off=0, segs='';
    items.forEach(i=>{
      const len=c*i.value/total;
      segs+='<circle cx="100" cy="100" r="'+r+'" fill="none" stroke="'+i.color+'" stroke-width="22" stroke-dasharray="'+Math.max(0,len-2)+' '+(c-Math.max(0,len-2))+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 100 100)"/>';
      off+=len;
    });
    return '<div class="chart-wrap" style="max-width:220px;margin:0 auto"><svg viewBox="0 0 200 200">'+segs+
      '<text x="100" y="96" text-anchor="middle" style="font-size:17px;font-weight:800;fill:#182334">'+centerTop+'</text>'+
      '<text x="100" y="118" text-anchor="middle" style="font-size:11px;fill:#8492A6">'+centerSub+'</text></svg></div>';
  },
  spark(values,color){
    const W=76,H=28,max=Math.max.apply(null,values.concat([1]));
    const pts=values.map((v,i)=>(i*W/(values.length-1))+','+(H-2-(v/max)*(H-6))).join(' ');
    return '<svg class="mini-spark" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><polyline points="'+pts+'" fill="none" stroke="'+(color||'#2D6BC0')+'" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }
};
window.Chart = Chart;

/* ---------------- 导航配置 ---------------- */
const NAV=[
  { group:'工作概览', items:[ {k:'dashboard',t:'工作台',i:'▦'}, {k:'messages',t:'消息中心',i:'✉',badge:true} ] },
  { group:'权益与成长', items:[ {k:'benefits',t:'我的权益',i:'◆'}, {k:'upgrade',t:'晋升中心',i:'↑'}, {k:'team',t:'团队与邀请',i:'◎'} ] },
  { group:'收益中心', items:[ {k:'income',t:'我的收益',i:'¥'}, {k:'sources',t:'收益来源',i:'⊞'}, {k:'stats',t:'收益统计',i:'▤'}, {k:'settlement',t:'结算与提现',i:'⇄'} ] },
  { group:'业务管理', items:[ {k:'orders',t:'席位订单',i:'▣'} ] },
  { group:'支持与设置', items:[ {k:'rules',t:'政策与规则',i:'文'}, {k:'settings',t:'账户设置',i:'⚙'} ] },
  { group:'权益架构图', items:[ {k:'equityMap',t:'权益架构图',i:'◇'} ] }
];
const TITLES={dashboard:'工作台',messages:'消息中心',benefits:'我的权益',upgrade:'晋升中心',team:'团队与邀请',income:'我的收益',sources:'收益来源',stats:'收益统计',settlement:'结算与提现',orders:'席位订单',rules:'政策与规则',equityMap:'权益架构图',settings:'账户设置'};
const SUBTITLES={dashboard:'权益、收益与经营情况一屏掌握',income:'账单明细、结算状态与提现',sources:'每笔收益从哪来，按什么口径算',stats:'多维度趋势、结构与对比分析',benefits:'等级权益、分润规则与增值包',upgrade:'免费晋升与补差价晋升双通道',team:'一级绑定关系与团队业绩看板',orders:'客户席位、基准日与分润快照',settlement:'账单周期、自动结算与提现流水',rules:'2026 综合版政策全文口径与常见问题',equityMap:'城市合伙人及服务商权益体系一图总览',messages:'结算、政策、团队与审核通知',settings:'主体资料、结算账户与身份切换'};

/* ---------------- App ---------------- */
const App = {
  state:{
    logged:false, onboarded:true, accountKey:'gold', route:'dashboard',
    obStep:0, obData:{ identity:'partner', level:'gold', subject:'企业', pay:'对公转账', form:{} },
    custom:null, filters:{source:'',status:'',period:'',kw:''}, page:1,
    withdrawals:[], readNotices:[], chartMode:'line', statRange:12, annotOn:true, obReturn:'login',
    editMode:false, textEdits:{}
  },

  init(){
    this.restore();
    this.bindLogin(); this.bindGlobal();
    if (this.state.logged && this.session() === '1'){
      if (this.state.onboarded) this.showConsole(); else this.showOnboard(this.state.obStep||0);
    } else { this.showLogin(); }
  },
  session(){
    try { return sessionStorage.getItem('mjyy_session'); } catch(e){ return this._session||null; }
  },
  setSession(v){
    this._session=v;
    try { sessionStorage.setItem('mjyy_session',v); } catch(e){}
  },

  restore(){
    try{
      const s=JSON.parse(localStorage.getItem('mjyy_state')||'{}');
      Object.assign(this.state, s, {logged:false});
    }catch(e){}
    /* 文案覆盖：优先源码内置，其次本地保存 */
    const builtin=(window.MJYY_TEXT_EDITS&&Object.keys(window.MJYY_TEXT_EDITS).length)?window.MJYY_TEXT_EDITS:null;
    let local=null;
    try{ local=JSON.parse(localStorage.getItem('mjyy_text_edits')||'null'); }catch(e){}
    const edits=Object.assign({},builtin||{},local||{});
    Object.keys(edits).forEach(k=>{ if(!edits[k]) delete edits[k]; });
    this.state.textEdits=edits;
    this.state.editMode=false;
  },
  save(){
    const s=JSON.parse(JSON.stringify(this.state));
    delete s.logged;
    try{ localStorage.setItem('mjyy_state', JSON.stringify(s)); }catch(e){}
  },
  account(){ return this.state.custom && this.state.accountKey==='custom' ? this.state.custom : D.ACCOUNTS[this.state.accountKey]; },
  accounts(){
    const list=[{k:'gold',label:'金牌合伙人',sub:'合伙人主账本'},{k:'center',label:'中心城市服务商',sub:'杭州市（主城）'},{k:'advisorService',label:'高级总顾问（城市服务商）',sub:'招商奖励账本 · 15% / 5%'},{k:'advisorPartner',label:'高级总顾问（城市合伙人）',sub:'推荐分成账本 · 20% + 5%'},{k:'bronze',label:'在职员工 · 铜牌权益',sub:'全员营销账本'}];
    if(this.state.custom) list.push({k:'custom',label:this.state.custom.role,sub:'新签约 · '+this.state.custom.joinDate});
    return list;
  },

  /* --- 页面切换 --- */
  hideAll(){
    ['#loginPage','#onboardingPage','#consolePage'].forEach(s=>$(s).classList.add('hide'));
    /* 切换页面时强制收起弹层，防止遮罩残留导致页面点不动 */
    this.closeModal(); this.closeDrawer();
  },
  showLogin(){ this.hideAll(); $('#loginPage').classList.remove('hide'); this.renderLoginAnnot(); },
  renderLoginAnnot(){ const e=$('#loginAnnot'); if(e) e.innerHTML=this.state.annotOn?U.annotBar('login',true):''; },
  /* from: 'login' 注册入口 / 'settings' 账户设置「重走加盟流程」；不传则沿用上次来源 */
  showOnboard(step, from){
    this.hideAll(); $('#onboardingPage').classList.remove('hide');
    if(from) this.state.obReturn=from;
    this.state.obStep=step||0; this.renderOb(); this.save();
  },
  showConsole(){
    this.hideAll(); $('#consolePage').classList.remove('hide');
    this.renderShell();
    if(!location.hash || !TITLES[location.hash.slice(2)]) location.hash='#/dashboard';
    this.render(); this.save();
  },

  /* --- 登录 --- */
  bindLogin(){
    $('#togglePwd').addEventListener('click',()=>{
      const i=$('#loginPwd'); i.type=i.type==='password'?'text':'password';
      $('#togglePwd').textContent=i.type==='password'?'显示':'隐藏';
    });
    let cd=0;
    $('#sendSms').addEventListener('click',()=>{
      const ph=$('#loginPhone').value.trim();
      if(!/^1\d{10}$/.test(ph)) return U.toast('请输入正确的 11 位手机号');
      U.toast('验证码已发送（演示环境任意 6 位数字均可）');
      cd=60; const b=$('#sendSms'); b.disabled=true;
      const timer=setInterval(()=>{ b.textContent=(--cd)+'s 后重发'; if(cd<=0){clearInterval(timer);b.disabled=false;b.textContent='获取验证码';} },1000);
    });
    $('#loginForm').addEventListener('submit', e=>{
      e.preventDefault();
      const ph=$('#loginPhone').value.trim();
      const pwd=$('#loginPwd').value;
      const sms=$('#loginSms').value.trim();
      if(!/^1\d{10}$/.test(ph)) return U.toast('请输入正确的 11 位手机号');
      if(!pwd) return U.toast('请输入登录密码');
      if(!/^\d{6}$/.test(sms)) return U.toast('请输入 6 位短信验证码');
      if(!$('#agreeChk').checked) return U.toast('请先阅读并同意渠道合作协议');
      this.doLogin(ph==='13800008888'?'partner':'new');
    });
    $('#registerBtn').addEventListener('click',()=>this.register());
    $$('.demo-card').forEach(b=>b.addEventListener('click',()=>this.doLogin(b.dataset.demo)));
    $('#showAgreement').addEventListener('click',e=>{e.preventDefault();U.modal('渠道合作协议（摘要）',this.agreementHtml(),'<button class="btn btn-ghost" data-act="closeModal">我知道了</button>');});
    $('#showPrivacy').addEventListener('click',e=>{e.preventDefault();U.modal('隐私政策','<p style="font-size:13px;line-height:1.9;color:var(--text-2)">系统仅收集完成合伙人入驻、分润结算与开票所必需的信息，包括主体资料、联系方式、结算账户与业务订单数据。除法律法规要求或经您授权外，不会向第三方披露。您可在「账户设置」中查看、更正或申请导出个人信息。</p>','<button class="btn btn-ghost" data-act="closeModal">我知道了</button>');});
    $('#forgotPwd').addEventListener('click',e=>{e.preventDefault();U.toast('演示环境：请使用快速体验账号，或联系总部管家重置密码');});
  },
  doLogin(type){
    this.state.logged=true; this.setSession('1');
    if(type==='partner'){ this.state.onboarded=true; this.state.accountKey='gold'; U.toast('登录成功，欢迎回来，张明远'); this.showConsole(); }
    else { this.state.onboarded=false; this.state.obStep=0; this.state.obData={identity:'partner',level:'gold',subject:'企业',pay:'对公转账',form:{}}; U.toast('登录成功，请先完成合伙人入驻'); this.showOnboard(0,'login'); }
  },
  register(){
    /* 注册账号 = 重走加盟商入驻流程 */
    this.state.logged=true; this.setSession('1');
    this.state.onboarded=false; this.state.obStep=0;
    this.state.obData={identity:'partner',level:'gold',subject:'企业',pay:'对公转账',form:{}};
    U.toast('已进入加盟申请流程，请按步骤填写资料');
    this.showOnboard(0,'login');
  },
  exitOnboard(){
    if(this.state.obReturn==='settings'){
      /* 账户设置里发起的重走流程：取消入驻态，回后台账户设置页 */
      this.state.onboarded=true; this.state.obStep=0; this.state.route='settings';
      this.save(); this.showConsole(); this.go('settings'); this.save();
    } else { this.logout(); }
  },
  logout(){
    this.state.logged=false; this.state.onboarded=true;
    try { sessionStorage.removeItem('mjyy_session'); } catch(e){} this._session=null;
    location.hash=''; this.save(); this.showLogin();
    U.toast('已安全退出');
  },

  /* --- 加盟流程 --- */
  agreementHtml(){
    return '<div class="agreement-box"><h4>渠道合作协议（摘要）</h4>'+
      '<p>甲方：民匠有约平台运营方；乙方：申请入驻的合伙人（企业或个人主体）。</p>'+
      '<p>一、合作内容：乙方成为城市合伙人后，可在政策允许范围内开展产品推广、客户开发与合伙人推荐，甲方按《民匠有约招商政策（2026版）》及《金银铜合伙人分佣体系补充说明》计发收益。</p>'+
      '<p>二、分佣口径：安心云、如意宝按等级固定单价计发首年分润；续费分润 = 对应产品首年分润 × 折扣比例；福运宝按结算流水比例分润。年活跃度未达标者，当年不触发续费奖励。</p>'+
      '<p>三、结算方式：次月 1 日出账单、次月 25 日系统自动结算。自然人合伙人须线上开票，企业合伙人须上传发票并经财务审核后方可提现。</p>'+
      '<p>四、推荐关系：乙方须通过系统拉新绑定建立推荐—被推荐关系链，分销层级限定两级，超出两级不再产生分佣。</p>'+
      '<p>五、晋升：晋升后历史已购席位继续按原等级标准结算，新增及续费业务按新等级标准执行。</p>'+
      '<p>六、协议生效：双方签字盖章后生效，电子签署与纸质签署具同等效力。本政策自发布之日起执行，最终解释权归公司所有。</p></div>';
  },
  obSteps:['选择身份','选定等级','填写资料','签署协议','支付费用','入驻完成'],
  renderOb(){
    const st=this.state.obStep||0, d=this.state.obData;
    /* 右上角返回按钮按来源区分：注册入口回登录，账户设置入口回账户设置 */
    const backBtn=$('#obLogout');
    if(backBtn) backBtn.textContent=this.state.obReturn==='settings'?'返回账户设置':'已有账号，返回登录';
    $('#obSteps').innerHTML=this.obSteps.map((s,i)=>
      '<div class="ob-step '+(i===st?'active':(i<st?'done':''))+'"><span class="sn">'+(i<st?'✓':(i+1))+'</span>'+s+'</div>'+(i<this.obSteps.length-1?'<span class="sl"></span>':'')
    ).join('');
    let body='', footer='';
    /* Step 0 身份 */
    if(st===0){
      const cards=[
        {k:'partner',t:'城市合伙人',d:'金牌 / 银牌 / 铜牌三级，不限区域、可全国开发；个人与企业均可申请',n:'01'},
        {k:'provider',t:'城市服务商',d:'中心城市 50 万 / 地级城市 20 万，享有区域被动收益与招商奖励',n:'02'},
        {k:'advisorService',t:'高级总顾问（城市服务商）',d:'服务商招商：直接推荐 15%、间接 5%、资源团队统提 5%，层级限两级',n:'03'},
        {k:'advisorPartner',t:'高级总顾问（城市合伙人）',d:'合伙人推荐：加盟费 20% 奖励，另享新增及续费席位 5% 分成',n:'04'},
        {k:'employee',t:'在职员工',d:'全员营销，享有铜牌合伙人权益及员工招商奖励',n:'05'}
      ];
      body='<div class="ob-title"><h2>选择你的合作身份</h2><p>不同身份对应不同的权益包与分润规则，入驻后支持在后台一键切换多身份</p></div>'+
        '<div class="identity-grid">'+cards.map(c=>'<div class="identity-card '+(d.identity===c.k?'selected':'')+'" data-act="obIdentity" data-v="'+c.k+'"><div class="ic-num">'+c.n+'</div><div><div class="ic-t">'+c.t+'</div><div class="ic-d">'+c.d+'</div></div></div>').join('')+'</div>'+
        '<div class="notice"><span class="ni">ℹ</span><div><b>身份说明：</b>城市合伙人设金牌、银牌、铜牌三级，不限区域、可全国开发；城市服务商按中心城市 / 地级城市划分并享有签约管辖区域的被动收益权益。一人可同时具备多身份，账本独立核算。</div></div>'+
        '<div class="section-title mt24">政策速览 <span class="small muted" style="font-weight:400">2026 综合版 · 关键权益</span></div>'+
        '<div class="grid g4">'+
        [['◆','3 级合伙人体系','铜牌 0 元 / 银牌 6,980 元 / 金牌 69,800 元，不限区域、可全国开发'],
         ['¥','20% 推荐分成','推荐新合伙人享代理费 20% 分成，另有席位开发收益 5%'],
         ['◷','次月 25 日结算','次月 1 日出账单、25 日系统自动结算，无需线下对账'],
         ['↑','达标免费晋升','累计席位或推荐达标即可免费升级，增值包最高价值 20 万+']].map(x=>
          '<div class="card"><div class="card-bd"><div class="ent-ico" style="margin-bottom:9px">'+x[0]+'</div><b>'+x[1]+'</b><p class="small muted mt6" style="line-height:1.7">'+x[2]+'</p></div></div>').join('')+
        '</div>';
      footer='<span class="ftip">第 1 / 5 步 · 选择后可返回修改</span><button class="btn btn-primary" data-act="obNext">下一步：选定等级 →</button>';
    }
    /* Step 1 等级 */
    else if(st===1){
      const isProvider=d.identity==='provider';
      const isAdvisor=d.identity==='advisorService'||d.identity==='advisorPartner';
      const svc=d.identity==='advisorService';
      let cards='';
      if(isAdvisor){
        cards='<div class="level-card selected" style="grid-column:1/-1">'+
          '<div class="lv-ico" style="background:var(--brand-soft);color:var(--brand)">顾</div>'+
          '<h3>'+(svc?'高级总顾问 · 城市服务商':'高级总顾问 · 城市合伙人')+'</h3>'+
          '<div class="small muted">'+(svc?'按招商城市等级与推荐层级计发奖励，无需代理费':'按代理费 20% + 席位 5% 计发推荐分成，无需代理费')+'</div>'+
          '<div class="lv-fee">0 <small>/ 顾问身份无代理费</small></div>'+
          '<ul>'+(svc?
            '<li><span>直接推荐招商</span><b>招商额 15%</b></li><li><span>介绍其他顾问推荐</span><b>招商额 5%</b></li><li><span>资源团队招商</span><b>统提 5%</b></li><li><span>分销层级</span><b>仅两级</b></li>':
            '<li><span>代理费推荐</span><b>20%</b></li><li><span>新增席位分成</span><b>5%</b></li><li><span>续费席位分成</span><b>5%</b></li><li><span>互斥说明</span><b>不与区域被动收益同享</b></li>')+'</ul></div>';
      } else if(isProvider){
        cards=Object.values(P.providers).map(p=>'<div class="level-card '+(d.level===p.key?'selected':'')+'" data-act="obLevel" data-v="'+p.key+'" style="grid-column:span 1"><div class="lv-ico" style="background:var(--brand-soft);color:var(--brand)">城</div><h3>'+p.name+'</h3><div class="lv-fee">'+U.fmt(p.fee)+'<small> / 加盟费</small></div><div class="small muted">'+p.city+'</div><ul><li><span>年度任务</span><b>'+p.target+'</b></li><li><span>增值包价值</span><b>'+p.packValue+'</b></li><li><span>年收益测算</span><b>'+p.expected+'</b></li><li><span>安心云分润</span><b>410 元/单</b></li></ul></div>').join('');
      } else {
        cards=Object.values(P.levels).map(l=>'<div class="level-card lv-'+l.key+' '+(d.level===l.key?'selected':'')+'" data-act="obLevel" data-v="'+l.key+'">'+(l.key==='gold'?'<div class="ribbon">推荐</div>':'')+'<div class="lv-ico">'+l.short+'</div><h3>'+l.name+'</h3><div class="small muted">'+l.desc+'</div><div class="lv-fee">'+U.fmt(l.fee)+'<small> / 代理费</small></div><ul>'+
          '<li><span>安心云首年</span><b>'+l.products['安心云'].firstLabel+'</b></li>'+
          '<li><span>如意宝首年</span><b>'+l.products['如意宝'].firstLabel+'</b></li>'+
          '<li><span>福运宝首年</span><b>'+l.products['福运宝'].firstLabel+'</b></li>'+
          '<li><span>年活跃度要求</span><b>≥'+l.active+' 单/年</b></li>'+
          '<li><span>增值包价值</span><b>'+l.packValue+'</b></li></ul></div>').join('');
      }
      const cmp='<div class="card mt18"><div class="card-hd"><h3>政策对比 <span class="sub">表 5 · 三级合伙人政策对比表</span></h3><span class="small muted">来源：招商政策（2026版）</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>等级</th><th>代理费</th><th>安心云首年</th><th>第 2 年</th><th>第 3 年</th><th>第 4 年</th><th>第 5 年及以后</th><th>年活跃度</th></tr></thead><tbody>'+
        Object.values(P.levels).map(l=>'<tr><td><b>'+l.name+'</b></td><td>'+U.fmt(l.fee)+'</td><td>'+l.products['安心云'].firstLabel+'</td><td>'+l.products['安心云'].renewLabel[0]+'</td><td>'+l.products['安心云'].renewLabel[1]+'</td><td>'+l.products['安心云'].renewLabel[2]+'</td><td>'+l.products['安心云'].renewLabel[3]+'</td><td>≥'+l.active+' 单/年</td></tr>').join('')+
        '</tbody></table></div></div>';
      const advisorCmp='<div class="card mt18"><div class="card-hd"><h3>奖励口径 <span class="sub">四、招商奖励政策 · 表 8 / 表 10</span></h3><span class="small muted">来源：招商政策（2026版）</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>身份</th><th>直推</th><th>间推 / 分成</th><th>口径说明</th></tr></thead><tbody>'+
        (svc
          ? '<tr><td><b>总顾问 · 服务商线</b></td><td>15%</td><td>5%</td><td class="small">资源团队统提 5%；介绍的其他顾问推荐，总顾问 5%、顾问 10%；仅分两级</td></tr>'
          : '<tr><td><b>总顾问 · 合伙人线</b></td><td>20%</td><td>5%</td><td class="small">加盟费 20% 推荐奖励；新增及续费席位开发收益 5%；与区域被动收益不可同时享受</td></tr>')+
        '</tbody></table></div></div>';
      body='<div class="ob-title"><h2>选定合作等级</h2><p>'+(isAdvisor?(svc?'顾问身份按招商奖励比例计发':'顾问身份按推荐与席位分成计发'):(isProvider?'按城市级别选择服务商类型':'按投入与预期选择合伙人等级，后续达标可免费晋升'))+'</p></div>'+
        '<div class="level-grid" style="'+((isProvider||isAdvisor)?'grid-template-columns:repeat(2,1fr)':'')+'">'+cards+'</div>'+(isAdvisor?advisorCmp:cmp)+
        '<div class="notice mt14"><span class="ni">ℹ</span><div>'+(isAdvisor?(svc?'总顾问自己直接推荐的招商城市拿 15%；介绍的其他顾问推荐的招商城市，总顾问拿 5%、顾问拿 10%；顾问推荐招商只分设两级，超出两级由第二级顾问负责。':'合伙人推荐奖励为被推荐方代理费的 20%；额外享有被推荐方新增席位开发收益 5%，该席位后续续费同样按 5% 计发。该收益与区域被动收益权益不可同时享受。'):'续费分润 = 对应产品首年分润 × 折扣比例（第 2 年 50%、第 3 年 30%、第 4 年 20%、第 5 年及以后 10%）；未达年活跃度要求，当年不触发续费分润。福运宝按结算流水比例分润，非固定金额。')+'</div></div>';
      footer='<span class="ftip">第 2 / 5 步 · 等级后续可通过晋升中心调整</span><div class="row"><button class="btn btn-ghost" data-act="obPrev">上一步</button><button class="btn btn-primary" data-act="obNext">下一步：填写资料 →</button></div>';
    }
    /* Step 2 资料 */
    else if(st===2){
      const f=d.form;
      body='<div class="ob-title"><h2>填写入驻资料</h2><p>企业或个人主体均可申请，资料用于合同签署、开票与结算</p></div>'+
        '<div class="card"><div class="card-bd">'+
        '<div class="row mb18"><span style="width:96px;font-size:13px;font-weight:600;color:var(--text-2)">主体类型</span>'+
        ['企业','个人'].map(s=>'<button class="btn btn-sm '+(d.subject===s?'btn-soft':'btn-ghost')+'" data-act="obSubject" data-v="'+s+'">'+s+'主体</button>').join('')+'</div>'+
        '<div class="form-grid">'+
        '<label class="field"><span>联系人姓名 *</span><input class="input" id="obName" placeholder="请输入真实姓名" value="'+U.esc(f.name||'')+'"></label>'+
        '<label class="field"><span>手机号 *</span><input class="input" id="obPhone" maxlength="11" placeholder="用于登录与结算通知" value="'+U.esc(f.phone||'')+'"></label>'+
        '<label class="field"><span>'+(d.subject==='企业'?'企业名称 *':'身份证号 *')+'</span><input class="input" id="obCompany" placeholder="'+(d.subject==='企业'?'请输入营业执照上的全称':'请输入 18 位身份证号')+'" value="'+U.esc(f.company||'')+'"></label>'+
        '<label class="field"><span>所在城市 *</span><input class="input" id="obCity" placeholder="如：浙江省 杭州市" value="'+U.esc(f.city||'')+'"></label>'+
        '<label class="field"><span>推荐人邀请码（选填）</span><input class="input" id="obInvite" placeholder="填写后自动建立一级绑定关系" value="'+U.esc(f.invite||'')+'"></label>'+
        '<label class="field"><span>结算开户行</span><input class="input" id="obBank" placeholder="如：招商银行杭州分行" value="'+U.esc(f.bank||'')+'"></label>'+
        '<div class="field full"><span>资质材料上传</span><div class="upload" data-act="obUpload"><div class="up-ico">⇧</div><b id="obUploadTxt">'+(f.uploaded?'✓ '+(d.subject==='企业'?'营业执照':'身份证')+'已上传（模拟）':'点击上传 '+(d.subject==='企业'?'营业执照 / 法人身份证':'身份证正反面'))+'</b><span>支持 JPG / PNG / PDF，单个文件不超过 10MB</span></div></div>'+
        '</div></div></div>'+
        '<div class="notice mt14"><span class="ni">ℹ</span><div>补充说明已开放个人主体：企业、个人合伙人的所有佣金与奖励均通过系统自动结算，无需线下对账；自然人结算须线上开票，企业须上传发票经财务审核后方可提现。</div></div>';
      footer='<span class="ftip">第 3 / 5 步 · 带 * 为必填项</span><div class="row"><button class="btn btn-ghost" data-act="obPrev">上一步</button><button class="btn btn-primary" data-act="obNext">下一步：签署协议 →</button></div>';
    }
    /* Step 3 协议 */
    else if(st===3){
      body='<div class="ob-title"><h2>签署渠道合作协议</h2><p>所有等级合伙人在正式开展业务前，必须签署渠道合作协议</p></div>'+
        '<div class="card"><div class="card-bd">'+this.agreementHtml()+
        '<div class="row mt14 between" style="flex-wrap:wrap;gap:12px">'+
        '<label class="check"><input type="checkbox" id="obAgree" '+(d.agree?'checked':'')+'><span>我已完整阅读并同意《渠道合作协议》全部条款，同意电子签署</span></label>'+
        '<label class="field" style="margin:0;min-width:220px"><span>乙方签字（输入姓名视为签字）</span><input class="input" id="obSign" placeholder="请输入姓名" value="'+U.esc(d.sign||'')+'"></label></div>'+
        '</div></div>';
      footer='<span class="ftip">第 4 / 5 步 · 协议编号将自动生成并归档</span><div class="row"><button class="btn btn-ghost" data-act="obPrev">上一步</button><button class="btn btn-primary" data-act="obNext">下一步：支付费用 →</button></div>';
    }
    /* Step 4 支付 */
    else if(st===4){
      const fee=d.identity==='provider'?(P.providers[d.level]||P.providers.center).fee:(P.levels[d.level]||P.levels.gold).fee;
      const feeName=d.identity==='provider'?'加盟费':'代理费';
      body='<div class="ob-title"><h2>确认并支付' + feeName + '</h2><p>支付完成后系统即时开通对应等级权益与管理系统账号</p></div>'+
        '<div class="grid g2"><div class="card"><div class="card-hd"><h3>费用明细</h3></div><div class="card-bd"><div class="pay-summary">'+
        '<div class="ps-row"><span>合作身份</span><b>'+(d.identity==='provider'?'城市服务商':(d.identity==='partner'?'城市合伙人':(d.identity==='advisorService'?'高级总顾问（城市服务商）':(d.identity==='advisorPartner'?'高级总顾问（城市合伙人）':'在职员工'))))+'</b></div>'+
        '<div class="ps-row"><span>合作等级</span><b>'+(d.identity==='provider'?(P.providers[d.level]||P.providers.center).name:(P.levels[d.level]||P.levels.gold).name)+'</b></div>'+
        '<div class="ps-row"><span>主体类型</span><b>'+d.subject+'主体</b></div>'+
        '<div class="ps-row"><span>'+feeName+'</span><b>'+U.fmt(fee)+'</b></div>'+
        '<div class="ps-row"><span>权益包</span><b style="color:var(--down)">免费开通</b></div>'+
        '<div class="ps-row total"><span>应付金额</span><b>'+U.fmt(fee)+'</b></div></div>'+
        '<div class="pay-methods">'+['对公转账','在线支付','扫码支付'].map(m=>'<div class="pay-method '+(d.pay===m?'selected':'')+'" data-act="obPay" data-v="'+m+'">'+(m==='对公转账'?'🏦':(m==='在线支付'?'💳':'▣'))+'<br>'+m+'</div>').join('')+'</div>'+
        '<div class="notice mt14"><span class="ni">ℹ</span><div>演示环境不产生真实扣款。正式环境支持对公转账、在线支付、扫码支付，系统生成电子回执与合同编号并归档至「我的权益 → 合同与凭证」。</div></div>'+
        '</div></div>'+
        '<div class="card"><div class="card-hd"><h3>支付后即时开通</h3></div><div class="card-bd">'+
        P.extras.slice(0,6).map((x,i)=>'<div class="ent-item"><div class="ent-ico">'+['◆','✉','◎','⇄','↑','文'][i]+'</div><div><b>'+x.split('：')[0]+'</b><p>'+(x.split('：')[1]||'按政策口径自动生效')+'</p></div></div>').join('')+
        '</div></div></div>';
      footer='<span class="ftip">第 5 / 5 步 · 支付即完成入驻</span><div class="row"><button class="btn btn-ghost" data-act="obPrev">上一步</button><button class="btn btn-gold btn-lg" data-act="obFinish">确认支付并开通权益 →</button></div>';
    }
    /* Step 5 完成 */
    else if(st===5){
      const a=this.account();
      body='<div class="done-wrap"><div class="done-icon">✓</div><h2>入驻成功，欢迎加入民匠有约</h2>'+
        '<p>你的'+a.role+'权益已开通，合同编号 '+a.contract+'，可立即进入后台开展业务</p>'+
        '<div class="done-cards">'+
        '<div class="card"><div class="card-bd"><b>◆ 查看我的权益</b><span>分润规则、增值包配额、合同与凭证，一处可查</span></div></div>'+
        '<div class="card"><div class="card-bd"><b>¥ 收益与结算</b><span>每笔收益可追溯到订单，次月 25 日自动结算</span></div></div>'+
        '<div class="card"><div class="card-bd"><b>◎ 邀请码拉新</b><span>生成专属邀请码，自动建立两级绑定关系链</span></div></div>'+
        '</div><div class="mt24"><button class="btn btn-primary btn-lg" data-act="obEnter">进入合伙人后台 →</button></div></div>';
      footer='<span class="ftip">入驻流程已完成 · 可随时在「账户设置」重走流程</span><span></span>';
    }
    $('#obBody').innerHTML=(this.state.annotOn?U.annotBar('ob'+st):'')+body; $('#obFooter').innerHTML=footer;
  },
  obCollect(){
    const g=id=>{const e=$(id);return e?e.value.trim():'';};
    this.state.obData.form={name:g('#obName'),phone:g('#obPhone'),company:g('#obCompany'),city:g('#obCity'),invite:g('#obInvite'),bank:g('#obBank'),uploaded:this.state.obData.form.uploaded};
    const a=$('#obAgree'), s=g('#obSign');
    if(a) this.state.obData.agree=a.checked;
    if(s) this.state.obData.sign=s;
  },
  obNext(){
    const st=this.state.obStep, d=this.state.obData;
    if(st===2){
      this.obCollect(); const f=d.form;
      if(!f.name||!f.phone||!f.company||!f.city) return U.toast('请完整填写带 * 的必填资料');
      if(!/^1\d{10}$/.test(f.phone)) return U.toast('请输入正确的 11 位手机号');
    }
    if(st===3){
      this.obCollect();
      if(!d.agree) return U.toast('请先阅读并勾选同意渠道合作协议');
      if(!d.sign) return U.toast('请输入乙方签字姓名');
    }
    this.showOnboard(Math.min(5,st+1));
    $('.view-scroll') && $('.view-scroll').scrollTo && $('.view-scroll').scrollTo(0,0);
    window.scrollTo(0,0);
  },
  buildCustomAccount(){
    const d=this.state.obData, isAdvisor=d.identity==='advisorService'||d.identity==='advisorPartner';
    const src=isAdvisor?D.ACCOUNTS[d.identity]:D.ACCOUNTS.gold;
    const base=D.ACCOUNTS.gold;
    const lv=P.levels[d.level]||P.levels.gold, isProvider=d.identity==='provider';
    const pv=isProvider?(P.providers[d.level]||P.providers.center):null;
    const scale=d.level==='silver'?0.45:(d.level==='bronze'?0.2:(isProvider?2.4:1));
    const records=(isAdvisor?src.records:base.records).map(r=>Object.assign({},r,{amount:Math.max(10,Math.round(r.amount*scale/10)*10)}));
    const monthly=(isAdvisor?src.monthly:base.monthly).map(v=>Math.round(v*scale));
    const f=d.form||{};
    const role=isAdvisor?src.role:(isProvider?pv.name:lv.name);
    return {
      id:'PT20261111'+String(Math.floor(Math.random()*900+100)),
      name:f.name||'新合伙人', phone:f.phone||'13800008888', subject:d.subject+'主体',
      company:f.company||'—', role:role, roleKey:isAdvisor?d.identity:(isProvider?'provider':'partner'),
      level:isAdvisor?d.identity:(isProvider?'center':d.level), region:f.city||(isAdvisor?'全国':'全国（不限区域）'), joinDate:'2026-11-11',
      contract:'MJ-QD-2026-1111-'+String(Math.floor(Math.random()*9000+1000)),
      seats:isAdvisor?0:Math.round(base.seats*scale), activeYear:isAdvisor?0:Math.round(base.activeYear*scale),
      activeTarget:isAdvisor?0:(isProvider?30000:lv.active), teamCount:0, awardTimes:0,
      bank:(f.bank||'招商银行')+' · **** 6821',
      records, monthly, orders:isAdvisor?[]:base.orders.slice(0,10).map(o=>Object.assign({},o,{amount:Math.round(o.amount*scale)})),
      team:[], bills:src.bills, levelFee:isAdvisor?0:(isProvider?pv.fee:lv.fee),
      invite:f.invite||'', upgradeNext:'—'
    };
  },

  /* --- 后台框架 --- */
  renderShell(){
    const a=this.account();
    $('#sbIdentity').innerHTML='<div class="sbi-top"><div class="avatar gold">'+U.esc(a.name.slice(0,1))+'</div><div><div class="sbi-name">'+U.esc(a.name)+'</div><div class="sbi-lv">'+U.esc(a.role)+'</div></div></div>'+
      '<div class="sbi-sub"><span>'+U.esc(a.region.split('（')[0])+'</span><span>切换身份 ›</span></div>';
    const unread=D.NOTICES.filter(n=>n.unread&&!this.state.readNotices.includes(n.title)).length;
    $('#sbNav').innerHTML=NAV.map(g=>'<div class="nav-group-title">'+g.group+'</div>'+g.items.map(i=>'<button class="nav-item" data-act="nav" data-v="'+i.k+'"><span class="ni">'+i.i+'</span><span>'+i.t+'</span>'+(i.badge&&unread?'<span class="nb">'+unread+'</span>':'')+'</button>').join('')).join('');
    $('#tbUser').innerHTML='<div class="avatar gold">'+U.esc(a.name.slice(0,1))+'</div><div><div class="tu-name">'+U.esc(a.name)+'</div><div class="tu-role">'+U.esc(a.role)+'</div></div>';
    const badge=$('#msgBadge'); if(badge){ badge.textContent=unread; badge.classList.toggle('hide',!unread); }
    const sw=$('#annotToggle'); if(sw){ sw.classList.toggle('on',!!this.state.annotOn); sw.title=this.state.annotOn?'隐藏页面注解':'显示页面注解'; }
  },
  render(){
    let r=this.state.route||'dashboard'; if(!TITLES[r]) r='income'; /* 旧链接兼容：已下线的二级菜单回到我的收益 */
    const a=this.account(), adv=r==='income'&&U.isAdvisor(a);
    const sub=adv?(a.level==='advisorService'?'城市招商 15% / 5% · 统提 5% · 仅两级':'加盟费 20% + 新增及续费席位 5%'):SUBTITLES[r];
    const annotKey=adv?(a.level+'Income'):r;
    $$('#sbNav .nav-item').forEach(b=>b.classList.toggle('active',b.dataset.v===r));
    $('#crumb').innerHTML='民匠有约 <span style="margin:0 6px;color:#C4CEDB">/</span> <b>'+TITLES[r]+'</b>';
    const page=window.PAGES[r]||window.PAGES.dashboard;
    $('#view').innerHTML='<div class="page-head"><div><h2>'+TITLES[r]+'</h2><p>'+sub+'</p></div>'+(page.head?page.head(a,this.state):'')+'</div>'+
      (this.state.annotOn?U.annotBar(annotKey):'')+page.html(a,this.state);
    if(page.bind) page.bind(a,this.state);
    this.applyTextEdits();
    const vs=$('.view-scroll'); if(vs) vs.scrollTop=0;
  },
  go(r){ this.state.route=r; this.state.page=1; location.hash='#/'+r; this.render(); },

  /* --- 编辑模式：任意文案可改，保存后写回源码 --- */
  applyTextEdits(){
    /* 用文本节点遍历做原文→新文替换，避免 innerHTML 破坏结构与事件 */
    const edits=this.state.textEdits||{}, src=Object.keys(edits);
    if(!src.length) return;
    const w=document.createTreeWalker($('#view'),NodeFilter.SHOW_TEXT,null,false);
    const hits=[]; let n;
    while((n=w.nextNode())){
      const t=n.nodeValue.trim();
      if(edits[t]!==undefined && edits[t]!==t) hits.push([n,edits[t],t]);
    }
    hits.forEach(([node,val,orig])=>{
      const s=document.createElement('span'); s.className='tx-applied'; s.dataset.txFrom=orig;
      s.textContent=val; node.parentNode.replaceChild(s,node);
    });
  },
  toggleEdit(){
    this.state.editMode=!this.state.editMode;
    const bar=$('#editBar'), btn=$('#editToggle');
    if(bar) bar.classList.toggle('hide',!this.state.editMode);
    if(btn) btn.classList.toggle('on',!!this.state.editMode);
    document.body.classList.toggle('edit-mode',!!this.state.editMode);
    if(this.state.editMode){
      this.bindInlineEdit();
      this.save();
      U.toast('编辑模式已开启：点击页面文字即可修改');
    }else{
      this.save(); this.render();
      U.toast('已退出编辑模式');
    }
  },
  bindInlineEdit(){
    /* 逐个文本节点设为可编辑，避免整体 contenteditable 破坏交互 */
    const walk=document.createTreeWalker($('#view'),NodeFilter.SHOW_TEXT,null,false);
    const nodes=[]; let n;
    while((n=walk.nextNode())){
      const t=n.nodeValue.trim();
      if(!t||n.parentElement.closest('.annot-bar,.annot-main,.annot-peek,.edit-bar')) continue;
      if(n.parentElement.closest('script,style,input,button')) continue;
      nodes.push(n);
    }
    nodes.forEach(n=>{
      const s=document.createElement('span');
      s.className='tx-edit'; s.setAttribute('contenteditable','true'); s.setAttribute('spellcheck','false');
      s.dataset.tx=n.nodeValue.trim();
      n.parentNode.insertBefore(s,n); s.appendChild(n);
    });
  },
  saveEdits(){
    const edits=this.state.textEdits||(this.state.textEdits={});
    let count=0;
    $$('#view .tx-edit').forEach(s=>{
      const now=s.textContent.trim(), key=s.dataset.tx;
      if(now&&now!==key){ edits[key]=now; count++; }
    });
    this.save();
    if(!count){ U.toast('没有检测到改动'); return; }
    U.toast('已保存 '+count+' 处改动，正在生成源码文件');
    setTimeout(()=>this.exportSource(),400);
  },
  resetEdits(){
    if(!confirm('确定恢复全部默认文案？本地保存的改动将被清除。')) return;
    this.state.textEdits={}; this.save(); this.render();
    this.bindInlineEdit(); U.toast('已恢复默认文案');
  },
  exitEdit(){ this.toggleEdit(); },
  exportSource(){
    /* 把当前 DOM 的文案改动固化成一份新的单文件 HTML 供下载 */
    const edits=this.state.textEdits||{};
    const doc=document.documentElement.cloneNode(true);
    const body=doc.querySelector('body');
    if(body){
      Array.prototype.slice.call(body.querySelectorAll('.tx-edit')).forEach(s=>{ s.removeAttribute('contenteditable'); s.removeAttribute('spellcheck'); s.removeAttribute('data-tx'); s.classList.remove('tx-edit'); });
      const bar=body.querySelector('#editBar'); if(bar) bar.remove();
      body.classList.remove('edit-mode');
    }
    /* 只替换「文案覆盖表」脚本块：以 MJYY_TEXT_EDITS_DATA 标记识别，绝不触碰主程序 */
    const scripts=Array.prototype.slice.call(doc.querySelectorAll('script'));
    let patched=false;
    scripts.forEach(sc=>{
      if(!patched && !sc.src && sc.textContent && sc.textContent.indexOf('MJYY_TEXT_EDITS_DATA')>=0){
        sc.textContent='/* MJYY_TEXT_EDITS_DATA */ window.MJYY_TEXT_EDITS='+JSON.stringify(edits,null,2)+';';
        patched=true;
      }
    });
    /* 若这个版本没有独立覆盖表脚本（如旧单文件版），在 head 里插入一份 */
    if(!patched){
      const head=doc.querySelector('head');
      const sc=doc.createElement('script');
      sc.textContent='/* MJYY_TEXT_EDITS_DATA */ window.MJYY_TEXT_EDITS='+JSON.stringify(edits,null,2)+';';
      if(head) head.appendChild(sc);
    }
    let html='<!DOCTYPE html>\n'+doc.outerHTML;
    /* 运行期 localStorage 覆盖也写入，保证替换原文件后长期生效 */
    const ls='<script>try{localStorage.setItem("mjyy_text_edits",'+JSON.stringify(JSON.stringify(edits))+');}catch(e){}<\/script>';
    html=html.replace('</head>',()=>ls+'\n</head>');
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='民匠有约合伙人后台管理系统.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    U.toast('源码文件已生成并下载，请用它替换原 HTML');
  },

  /* --- 页面注解 --- */
  openAnnot(key){
    const A=window.ANNOT, d=A&&A[key]; if(!d) return;
    const M=window.ANNOT_META||{}, esc=U.esc, ns=d.n||[];
    const refs=(d.r||[]).map(x=>'<span class="annot-ref">'+esc(x)+'</span>').join('');
    const list=ns.map((x,i)=>'<div class="annot-d-item'+(x[3]?' pending':'')+'">'+
      '<div class="adi-hd"><span class="adi-n">'+String(i+1).padStart(2,'0')+'</span><b>'+esc(x[0])+'</b>'+
      (x[3]?'<span class="adi-pend">待总部确认</span>':'')+'</div>'+
      '<div class="adi-p">'+esc(x[1])+'</div>'+
      '<div class="adi-src">出处：'+esc(x[2])+'</div></div>').join('');
    U.drawer('页面注解 · '+esc(d.t),
      '<div class="annot-d-summary">'+esc(d.i)+'</div>'+
      '<div class="annot-d-refs">'+refs+'</div>'+
      '<div class="annot-d-list">'+list+'</div>'+
      '<div class="annot-d-foot">依据 '+esc(M.doc||'')+'。'+esc(M.note||'')+
      '<br>标注「待总部确认」的条目来自'+esc(M.pending||'文档待明确项')+'，上线前须总部书面确认；政策最终解释权归公司所有。</div>',
      '<button class="btn btn-ghost" data-act="closeDrawer">关闭</button>');
  },
  toggleAnnot(){
    this.state.annotOn=!this.state.annotOn; this.save(); this.refreshAnnot();
    U.toast(this.state.annotOn?'已显示页面注解':'已隐藏页面注解');
  },
  refreshAnnot(){
    const on=this.state.annotOn, sw=$('#annotToggle');
    if(sw){ sw.classList.toggle('on',on); sw.title=on?'隐藏页面注解':'显示页面注解'; }
    this.renderLoginAnnot();
    if(!$('#consolePage').classList.contains('hide')) this.render();
    else if(!$('#onboardingPage').classList.contains('hide')) this.renderOb();
  },

  /* --- 通用交互 --- */
  bindGlobal(){
    window.addEventListener('hashchange',()=>{
      const r=location.hash.slice(2);
      if(TITLES[r]&&this.state.logged&&this.state.onboarded){ this.state.route=r; this.render(); }
    });
    document.addEventListener('click',e=>{
      const src=e.target;
      if(!src || typeof src.closest!=='function') return;   /* 文本节点 / SVG 子节点保护 */
      const t=src.closest('[data-act]'); if(!t)return;
      if(/^(SELECT|OPTION|INPUT|TEXTAREA)$/.test(t.tagName) && t.dataset.act==='orderStatus') return;
      const act=t.dataset.act, v=t.dataset.v;
      let ret;
      try{ ret=this.handle(act,v,t,e); }
      catch(err){
        console.error('[action:'+act+']',err);
        this.closeModal(); this.closeDrawer();
        U.toast('操作未完成，已恢复页面，请重试');
      }
      if(ret===false) e.preventDefault();
    });
    /* 遮罩 / ESC 关闭，确保任何情况下都能退出弹层 */
    $('#modalMask').addEventListener('click',()=>this.closeModal());
    $('#drawerMask').addEventListener('click',()=>this.closeDrawer());
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){ this.closeModal(); this.closeDrawer(); }
    });
    $('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('collapsed'));
    $('#msgBtn').addEventListener('click',()=>this.go('messages'));
    $('#tbUser').addEventListener('click',()=>this.go('settings'));
    $('#sbIdentity').addEventListener('click',()=>this.identityModal());
    $('#replayOnboard').addEventListener('click',()=>{ this.state.obStep=0; this.showOnboard(0,'settings'); });
    $('#obLogout').addEventListener('click',()=>this.exitOnboard());
    $('#globalSearch').addEventListener('keydown',e=>{
      if(e.key==='Enter'){ this.state.filters.kw=e.target.value.trim(); this.go('income'); U.toast('已按「'+e.target.value.trim()+'」检索收益明细'); }
    });
    /* 页面筛选联动：下拉即时筛选、关键词输入防抖 */
    $('#view').addEventListener('change',e=>{
      const el=e.target;
      if(el.dataset && el.dataset.k && el.dataset.k!=='kw') this.setFilter(el);
    });
    $('#view').addEventListener('input',e=>{
      if(e.target.dataset.k!=='kw') return;
      const v=e.target.value;
      clearTimeout(this._kwTimer);
      this._kwTimer=setTimeout(()=>{
        this.state.filters.kw=v; this.state.page=1; this.render();
        const el=$('#view [data-k="kw"]');
        if(el){ el.focus(); try{ el.setSelectionRange(v.length,v.length); }catch(err){} }
      },380);
    });
  },
  handle(act,v,t,e){
    switch(act){
      case 'closeModal': this.closeModal(); return false;
      case 'closeDrawer': this.closeDrawer(); return false;
      case 'nav': this.go(v); return false;
      /* 入驻 */
      case 'obIdentity': this.state.obData.identity=v; if(v==='provider')this.state.obData.level='center'; else if(v==='employee')this.state.obData.level='bronze'; else if(v==='advisorService')this.state.obData.level='advisorService'; else if(v==='advisorPartner')this.state.obData.level='advisorPartner'; else if(['partner'].includes(v))this.state.obData.level='gold'; this.renderOb(); this.save(); return false;
      case 'obLevel': this.state.obData.level=v; this.renderOb(); this.save(); return false;
      case 'obSubject': this.obCollect(); this.state.obData.subject=v; this.renderOb(); return false;
      case 'obUpload': this.obCollect(); this.state.obData.form.uploaded=true; this.renderOb(); U.toast('材料上传成功（演示）'); return false;
      case 'obPay': this.state.obData.pay=v; this.renderOb(); return false;
      case 'obNext': this.obNext(); return false;
      case 'obPrev': this.showOnboard(Math.max(0,this.state.obStep-1)); return false;
      case 'obFinish':
        this.state.custom=this.buildCustomAccount(); this.state.accountKey='custom';
        this.state.onboarded=true; this.showOnboard(5); this.save(); U.toast('支付成功，权益已开通'); return false;
      case 'obEnter': this.showConsole(); return false;
      /* 后台通用 */
      case 'switchIdentity': this.closeModal(); this.state.accountKey=v; this.state.page=1; this.renderShell(); this.render(); this.save(); U.toast('已切换至：'+this.account().role); return false;
      case 'identityModal': this.identityModal(); return false;
      case 'export': this.exportData(v); return false;
      case 'withdraw': this.withdrawModal(); return false;
      case 'doWithdraw': this.doWithdraw(); return false;
      case 'copyInvite': U.copy('MJYY-'+this.account().id); return false;
      case 'copyLinkPartner': U.copy('https://partner.minjiangyue.com/i/MJYY-'+this.account().id); return false;
      case 'copyLinkCompany': U.copy('https://corp.minjiangyue.com/i/MJYY-'+this.account().id); return false;
      case 'copyLink': U.copy('https://partner.minjiangyue.com/i/MJYY-'+this.account().id); return false;
      case 'recordDetail': this.recordDetail(v); return false;
      case 'advisorDetail': this.advisorDetail(v); return false;
      case 'orderDetail': this.orderDetail(v); return false;
      case 'faq': this.faqToggle(t); return false;
      case 'markRead': this.state.readNotices=D.NOTICES.map(n=>n.title); this.save(); this.renderShell(); this.render(); U.toast('已全部标记为已读'); return false;
      case 'logout': this.logout(); return false;
      case 'replay': this.state.obStep=0; this.showOnboard(0,'settings'); return false;
      case 'contract': this.contractModal(); return false;
      case 'upgradeApply': this.upgradeModal(v); return false;
      case 'doUpgrade': this.doUpgrade(v); return false;
      case 'chartMode': this.state.chartMode=v; this.render(); return false;
      case 'statRange': this.state.statRange=Number(v); this.render(); return false;
      case 'setFilter': this.setFilter(t); return false;
      case 'page': this.state.page=Number(v); this.render(); return false;
      case 'toast': U.toast(v); return false;
      case 'openAnnot': this.openAnnot(v); return false;
      case 'toggleAnnot': this.toggleAnnot(); return false;
      case 'toggleEdit': this.toggleEdit(); return false;
      case 'saveEdits': this.saveEdits(); return false;
      case 'resetEdits': this.resetEdits(); return false;
      case 'exitEdit': this.exitEdit(); return false;
      case 'noop': return false;
      default: if(window.PAGES._handle) return window.PAGES._handle(act,v,t,e,this);
    }
  },
  closeModal(){
    const m=$('#modal'), k=$('#modalMask');
    if(m) m.classList.add('hide');
    if(k) k.classList.add('hide');
  },
  closeDrawer(){ const d=$('#drawer'), k=$('#drawerMask'); if(d) d.classList.add('hide'); if(k) k.classList.add('hide'); },
  setFilter(t){
    const k=t.dataset.k; this.state.filters[k]=t.value; this.state.page=1;
    /* 保留输入焦点：重渲染后回填 */
    const v=t.value; this.render();
    const el=$('#view [data-k="'+k+'"]'); if(el){ el.value=v; if(t.type==='text'){ el.focus(); el.setSelectionRange(v.length,v.length); } }
  },
  identityModal(){
    const body='<div class="small muted mb14">同一手机号下的多个合作身份，权益、分润规则与收益账本相互独立，切换后数据即时刷新。</div>'+
      this.accounts().map(x=>'<div class="identity-card '+(x.k===this.state.accountKey?'selected':'')+'" data-act="switchIdentity" data-v="'+x.k+'" style="margin-bottom:10px"><div class="ic-num">'+(x.k===this.state.accountKey?'✓':'⇄')+'</div><div><div class="ic-t">'+x.label+'</div><div class="ic-d">'+x.sub+'</div></div></div>').join('')+
      '<div class="notice mt10"><span class="ni">ℹ</span><div>来源《服务商问题梳理》第 11 项：合伙人功能与代理商系统并存，需支持登录后身份切换。</div></div>';
    U.modal('切换合作身份',body,'<button class="btn btn-ghost" data-act="closeModal">取消</button>');
  },
  contractModal(){
    const a=this.account();
    U.modal('渠道合作协议 · '+a.contract,
      this.agreementHtml()+'<div class="mt14"><div class="kv"><span>甲方</span><b>民匠有约平台运营方</b></div><div class="kv"><span>乙方</span><b>'+U.esc(a.company||a.name)+'（'+a.subject+'）</b></div><div class="kv"><span>合作身份</span><b>'+U.esc(a.role)+'</b></div><div class="kv"><span>协议生效日</span><b>'+a.joinDate+'</b></div><div class="kv"><span>合同编号</span><b>'+a.contract+'</b></div></div>',
      '<button class="btn btn-ghost" data-act="toast" data-v="电子回执已生成并归档">下载电子回执</button><button class="btn btn-primary" data-act="closeModal">完成</button>');
  },
  recordDetail(id){
    const a=this.account();
    /* 服务商顾问：工作台「最新收益」等通用入口也走按奖励比例展示的详情 */
    if(a.level==='advisorService') return this.advisorDetail(id);
    const r=a.records.find(x=>x.id===id); if(!r)return;
    const s=U.src(r.source);
    const renewDash=(a.level==='gold'||a.level==='bronze')&&r.source==='renew_seat';
    U.drawer('收益明细 · '+r.id,
      '<div class="card" style="box-shadow:none"><div class="card-bd"><div class="small muted">收益金额</div><div class="money" style="color:var(--brand);margin:6px 0 14px">'+U.fmt(r.amount)+'</div>'+(renewDash?'<span class="muted">-</span>':U.tag(r.status))+'</div></div>'+
      '<div class="section-title">基本信息</div>'+
      '<div class="kv"><span>收益来源</span><b>'+s.name+'</b></div><div class="kv"><span>发生日期</span><b>'+r.date+'</b></div>'+
      '<div class="kv"><span>关联产品</span><b>'+r.product+'</b></div><div class="kv"><span>客户 / 对象</span><b>'+U.esc(r.customer)+'</b></div>'+
      '<div class="kv"><span>新增席位</span><b>'+(r.newSeats||0)+' 席</b></div><div class="kv"><span>续费席位</span><b>'+(r.renewSeats||0)+' 席</b></div><div class="kv"><span>结算日</span><b>'+(renewDash?'次月 25 日自动结算（不包含续费分润）':r.settle)+'</b></div>'+
      '<div class="section-title">计算口径</div><div class="notice"><span class="ni">ƒ</span><div><b>'+U.esc(r.note)+'</b><br>'+s.desc+'</div></div>'+
      '<div class="section-title">状态流转</div><div class="timeline">'+
      P.statusFlow.map((st,i)=>{const idx=P.statusFlow.indexOf(r.status);return '<div class="tl-item '+(renewDash||i<=idx?'done':'')+'"><b>'+st+'</b><p>'+(renewDash?'不适用 · 续费分润不参与自动结算':(i<=idx?'已完成':'待进入')+(i===0?' · 次月 1 日出账单':'')+(i===2?' · 次月 25 日自动结算':''))+'</p></div>';}).join('')+'</div>',
      '<button class="btn btn-ghost" data-act="closeDrawer">关闭</button><button class="btn btn-primary" data-act="toast" data-v="已发起对账申请，总部管家将在 1 个工作日内响应">发起对账</button>');
  },
  advisorDetail(v){
    const acc=this.account(); if(!U.isAdvisor(acc)) return;
    const id=String(v||'').split('|').pop();
    const isSvc=acc.level==='advisorService';
    const r=acc.records.find(x=>x.id===id); if(!r)return;
    const s=U.src(r.source);
    const rule=isSvc
      ? '总顾问招商奖励：直接推荐 15%、介绍其他顾问推荐 5%、资源团队统提 5%，仅分两级。'
      : '总顾问推荐奖励：代理费 20% 分成 + 新增及续费席位 5% 分成；与区域被动收益不可同时享受。';
    const n=String(r.note||'');
    const svcType=n.indexOf('直接推荐')>=0?'直推招商':(n.indexOf('介绍顾问')>=0?'间推（介绍其他顾问）':(n.indexOf('资源团队')>=0?'资源团队统提':'招商奖励'));
    const svcRate=svcType==='直推招商'?'15%':'5%';
    const basic=isSvc
      ? '<div class="kv"><span>收益类型</span><b>'+svcType+'</b></div>'+
        '<div class="kv"><span>奖励比例</span><b>'+svcRate+'</b></div>'+
        '<div class="kv"><span>发生日期</span><b>'+r.date+'</b></div>'+
        '<div class="kv"><span>招商对象 / 城市</span><b>'+U.esc(r.customer)+'</b></div>'+
        '<div class="kv"><span>结算日</span><b>'+r.settle+'</b></div>'
      : '<div class="kv"><span>顾问身份</span><b>'+U.esc(acc.role)+'</b></div>'+
        '<div class="kv"><span>收益来源</span><b>'+s.name+'</b></div><div class="kv"><span>发生日期</span><b>'+r.date+'</b></div>'+
        '<div class="kv"><span>推荐对象 / 招商城市</span><b>'+U.esc(r.customer)+'</b></div>'+
        '<div class="kv"><span>关联产品</span><b>'+U.esc(r.product)+'</b></div>'+
        '<div class="kv"><span>新增席位</span><b>'+(r.newSeats||0)+' 席</b></div><div class="kv"><span>续费席位</span><b>'+(r.renewSeats||0)+' 席</b></div>'+
        '<div class="kv"><span>结算日</span><b>'+r.settle+'</b></div>';
    U.drawer('顾问收益详情 · '+r.id,
      '<div class="card" style="box-shadow:none"><div class="card-bd"><div class="small muted">收益金额</div>'+
      '<div class="money" style="color:var(--brand);margin:6px 0 14px">'+U.fmt(r.amount)+'</div>'+U.tag(r.status)+'</div></div>'+
      '<div class="section-title">基本信息</div>'+basic+
      '<div class="section-title">计算口径</div><div class="notice"><span class="ni">ƒ</span><div><b>'+U.esc(r.note)+'</b><br>'+rule+'</div></div>'+
      '<div class="section-title">状态流转</div><div class="timeline">'+
      P.statusFlow.map((st,i)=>{const idx=P.statusFlow.indexOf(r.status);return '<div class="tl-item '+(i<=idx?'done':'')+'"><b>'+st+'</b><p>'+(i<=idx?'已完成':'待进入')+(i===0?' · 次月 1 日出账单':'')+(i===2?' · 次月 25 日自动结算':'')+'</p></div>';}).join('')+'</div>',
      '<button class="btn btn-ghost" data-act="closeDrawer">关闭</button><button class="btn btn-primary" data-act="toast" data-v="已发起对账申请，总部管家将在 1 个工作日内响应">发起对账</button>');
  },
  orderDetail(id){
    const o=this.account().orders.find(x=>x.id===id); if(!o)return;
    const lv=P.levels[this.account().level]||P.levels.gold;
    const isFlow=o.product==='福运宝';
    const unit=isFlow?'按结算流水比例':(lv.products[o.product]?lv.products[o.product].firstLabel:'—');
    U.drawer('席位订单 · '+o.id,
      '<div class="kv"><span>客户名称</span><b>'+U.esc(o.customer)+'</b></div><div class="kv"><span>产品</span><b>'+o.product+'</b></div>'+
      '<div class="kv"><span>席位数</span><b>'+o.seats+' 席</b></div><div class="kv"><span>业务类型</span><b>'+o.type+'</b></div>'+
      '<div class="kv"><span>首购基准日</span><b>'+o.baseDate+'</b></div><div class="kv"><span>业绩年度</span><b>第 '+o.yearNo+' 年</b></div>'+
      '<div class="kv"><span>订单金额</span><b>'+U.fmt(o.amount)+'</b></div><div class="kv"><span>订单状态</span>'+U.tag(o.status)+'</div>'+
      '<div class="section-title">分润快照（下单时锁定）</div>'+
      '<div class="notice"><span class="ni">ƒ</span><div>当前等级：<b>'+lv.name+'</b>；首年口径：<b>'+unit+'</b>；'+
      (o.type==='续费'?'续费折扣：<b>第 '+o.yearNo+' 年按首年分润 × '+([50,50,30,20,10][o.yearNo]||10)+'%</b>；':'首年全额计发；')+
      '<br>基准日锁定后不因增购、换购改变；晋升后历史订单仍按原等级标准结算。</div></div>',
      '<button class="btn btn-primary" data-act="closeDrawer">关闭</button>');
  },
  withdrawModal(){
    const a=this.account(), settled=U.sum(a.records,r=>r.status==='已结算'), paid=this.state.withdrawals.reduce((s,w)=>s+w.amount,0);
    const avail=Math.max(0,settled-paid);
    U.modal('申请提现',
      '<div class="notice mb14"><span class="ni">ℹ</span><div>'+P.meta.invoiceRule+'</div></div>'+
      '<div class="kv"><span>已结算收益</span><b>'+U.fmt(settled)+'</b></div><div class="kv"><span>历史已提现</span><b>'+U.fmt(paid)+'</b></div>'+
      '<div class="kv"><span>本次可提现</span><b style="color:var(--brand);font-size:16px">'+U.fmt(avail)+'</b></div>'+
      '<label class="field mt18"><span>提现金额（元）</span><input class="input" id="wdAmount" type="number" min="1" max="'+avail+'" placeholder="请输入提现金额" value="'+Math.min(10000,avail)+'"></label>'+
      '<label class="field"><span>结算账户</span><input class="input" value="'+U.esc(a.bank)+'" readonly></label>'+
      '<label class="field"><span>开票 / 发票凭证</span><div class="upload" data-act="toast" data-v="凭证上传成功（演示）"><div class="up-ico">⇧</div><b>'+(U.isCorp(a.subject)?'点击上传增值税发票':'已开通线上开票，系统自动开具')+'</b><span>'+(U.isCorp(a.subject)?'上传后需财务审核通过':'自然人合伙人系统自动开票')+'</span></div></label>',
      '<button class="btn btn-ghost" data-act="closeModal">取消</button><button class="btn btn-primary" data-act="doWithdraw">提交提现申请</button>');
  },
  doWithdraw(){
    const a=this.account(), settled=U.sum(a.records,r=>r.status==='已结算'), paid=this.state.withdrawals.reduce((s,w)=>s+w.amount,0);
    const avail=Math.max(0,settled-paid), n=Number($('#wdAmount').value);
    if(!n||n<=0) return U.toast('请输入有效金额');
    if(n>avail) return U.toast('提现金额超出可提现余额');
    this.state.withdrawals.unshift({date:'2026-11-11',amount:n,bank:a.bank,status:'审核中'});
    this.save(); this.closeModal();
    U.toast('提现申请已提交：'+U.fmt(n)); this.render();
  },
  upgradeModal(kind){
    const a=this.account();
    const info=kind==='paid'?'<div class="section-title">补差价晋升</div>'+P.paidUpgrade.map(x=>'<div class="kv"><span>'+x.path+' · '+U.fmt(x.fee)+'</span><b>推荐人奖励 '+U.fmt(x.reward)+'</b></div>').join('')+
      '<p class="small muted mt10">推荐人按「被推荐人实际缴纳金额（含差价）× 20%」计发。</p>':
      '<div class="section-title">免费晋升通道（表 6）</div>'+P.upgrades.map(x=>'<div class="rule-block"><h4>'+x.from+' → '+x.to+'</h4><ul>'+x.conditions.map(c=>'<li>'+c+'</li>').join('')+'</ul></div>').join('');
    U.modal('晋升申请',info+'<div class="notice mt14"><span class="ni">ℹ</span><div>'+P.upgradeRule+'</div></div>',
      '<button class="btn btn-ghost" data-act="closeModal">取消</button><button class="btn btn-primary" data-act="doUpgrade" data-v="'+kind+'">提交申请</button>');
  },
  doUpgrade(kind){
    this.closeModal();
    U.toast(kind==='paid'?'补差价晋升申请已提交，待总部审核':'达标晋升申请已提交，系统将自动校验席位与推荐记录');
  },
  faqToggle(t){
    const a=t.nextElementSibling; if(a) a.classList.toggle('hide');
  },
  exportData(kind){
    const a=this.account();
    if(kind==='income'){
      if(U.isAdvisor(a)){
        const isSvc=a.level==='advisorService';
        if(isSvc){
          U.csv('顾问收益_服务商_'+a.id+'.csv',
            ['收益单号','日期','收益类型','招商对象','奖励比例','收益金额(元)','状态','结算日','计算依据'],
            a.records.map(r=>{
              const n=String(r.note||'');
              const t=n.indexOf('直接推荐')>=0?'直推招商':(n.indexOf('介绍顾问')>=0?'间推（介绍其他顾问）':(n.indexOf('资源团队')>=0?'资源团队统提':'招商奖励'));
              return [r.id,r.date,t,r.customer,t==='直推招商'?'15%':'5%',r.amount,r.status,r.settle,r.note];
            }));
        } else {
          U.csv('顾问收益_合伙人_'+a.id+'.csv',
            ['收益单号','日期','收益来源','推荐对象/招商城市','关联产品','新增席位','续费席位','金额(元)','状态','结算日','计算口径'],
            a.records.map(r=>[r.id,r.date,U.src(r.source).name,r.customer,r.product,r.newSeats||0,r.renewSeats||0,r.amount,r.status,r.settle,r.note]));
        }
      } else {
        const rd=(a.level==='gold'||a.level==='bronze');
        U.csv('收益明细_'+a.id+'.csv',['收益单号','日期','收益来源','产品','客户/对象','新增席位','续费席位','金额(元)','状态','结算日','计算口径'],
          a.records.map(r=>[r.id,r.date,U.src(r.source).name,r.product,r.customer,r.newSeats||0,r.renewSeats||0,r.amount,
            (rd&&r.source==='renew_seat')?'-':r.status,(rd&&r.source==='renew_seat')?'次月 25 日自动结算（不包含续费分润）':r.settle,r.note]));
      }
    } else if(kind==='orders'){
      U.csv('席位订单_'+a.id+'.csv',['订单号','客户','产品','席位','类型','首购基准日','业绩年度','订单金额(元)','状态'],
        a.orders.map(o=>[o.id,o.customer,o.product,o.seats,o.type,o.baseDate,'第 '+o.yearNo+' 年',o.amount,o.status]));
    } else if(kind==='team'){
      U.csv('团队看板_'+a.id+'.csv',['合伙人','等级','晋升费用(元)','企业席位数','新增席位数','续费席位数','企业购买金额(元)','绑定日期','活跃度'],
        a.team.map(t=>[t.name,t.level,t.fee,t.seats,t.newSeats||0,t.renewSeats||0,t.amount,t.date,t.active]));
    } else if(kind==='report'){
      U.csv('收益统计_'+a.id+'.csv',['月份','收益金额(元)'],a.monthly.map((v,i)=>[D.MONTHS[i],v]));
    } else if(kind==='bill'){
      U.csv('结算账单_'+a.id+'.csv',['账期','收益笔数','账单金额(元)','出账日','结算日','状态'],
        a.bills.map(b=>[b.period,b.count,b.amount,b.billDate,b.payDate,b.status]));
    }
  }
};
window.App=App;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>App.init());
else App.init();
})();
