/* ============================================================
 * 民匠有约 · 合伙人后台 — 政策规则配置 + 演示数据
 * 规则来源：
 *  A.《民匠有约招商政策（2026版）》（综合版_优化版-20261022）
 *  B.《金银铜合伙人分佣体系补充说明（终版）》
 *  C.《服务商问题梳理》（业务口径待明确项）
 * 所有分润、奖励、结算口径均配置化，页面不硬编码业务数字。
 * ============================================================ */
(function () {
'use strict';

/* ---------------- 一、政策规则 ---------------- */
const POLICY = {
  meta: {
    version: '2026 综合版',
    effective: '自发布之日起执行',
    scope: '中心城市服务商 · 地级城市服务商 · 金牌/银牌/铜牌城市合伙人',
    settlement: { billDay: '次月 1 日出账单', payDay: '次月 25 日系统自动结算', note: '所有佣金、奖励系统自动结算，无需线下对账' },
    invoiceRule: '自然人合伙人结算须走线上开票；企业合伙人须上传发票并经财务审核后方可提现',
    bindRule: '金银铜合伙人均需通过系统完成拉新绑定，分销层级限定两级，超出两级不再产生分佣',
    baseDateRule: '以客户首次购买第一个席位的日期作为该客户后续所有新增、续费业务的统一基准起算日，基准日锁定后不因增购/换购改变',
    footnote: '本政策自发布之日起执行，最终解释权归公司所有。'
  },

  products: ['安心云', '如意宝', '福运宝'],
  retail: { '安心云': 698, note: '补充说明：安心云统一零售价 698 元/席位；拉新奖励 350 元、落地服务佣金 60 元' },

  /* 表5 三级合伙人政策对比表 */
  levels: {
    gold: {
      key:'gold', name:'金牌合伙人', short:'金', fee:69800, active:400, color:'#B8862B', soft:'#FBF3E2',
      desc:'交付权益包 · 不限区域、可全国开发',
      products:{
        '安心云': { first:350, firstLabel:'350 元/单', renew:[0.5,0.3,0.2,0.1], renewLabel:['175 元','105 元','70 元','35 元'], type:'fixed' },
        '如意宝': { first:240, firstLabel:'240 元/单', renew:[0.5,0.3,0.2,0.1], renewLabel:['120 元','72 元','48 元','24 元'], type:'fixed' },
        '福运宝': { first:'4‰', firstLabel:'结算流水 4‰', rates:['4‰','2‰','1.2‰','0.8‰','0.4‰'], type:'flow' }
      },
      packValue:'20 万+'
    },
    silver: {
      key:'silver', name:'银牌合伙人', short:'银', fee:6980, active:100, color:'#7C8B9E', soft:'#F0F3F7',
      desc:'轻投入起步 · 不限区域、可全国开发',
      products:{
        '安心云': { first:200, firstLabel:'200 元/单', renew:[0.5,0.3,0.2,0.1], renewLabel:['100 元','60 元','40 元','20 元'], type:'fixed' },
        '如意宝': { first:180, firstLabel:'180 元/单', renew:[0.5,0.3,0.2,0.1], renewLabel:['90 元','54 元','36 元','18 元'], type:'fixed' },
        '福运宝': { first:'3‰', firstLabel:'结算流水 3‰', rates:['3‰','1.5‰','0.9‰','0.6‰','0.3‰'], type:'flow' }
      },
      packValue:'10 万+'
    },
    bronze: {
      key:'bronze', name:'铜牌合伙人', short:'铜', fee:0, active:10, color:'#B26A38', soft:'#FAF0E8',
      desc:'零代理费 · 全员营销及个人亦可申请',
      products:{
        '安心云': { first:130, firstLabel:'130 元/单', renew:[0.5,0.3,0.2,0.1], renewLabel:['65 元','39 元','26 元','13 元'], type:'fixed' },
        '如意宝': { first:130, firstLabel:'130 元/单', renew:[0.5,0.3,0.2,0.1], renewLabel:['65 元','39 元','26 元','13 元'], type:'fixed' },
        '福运宝': { first:'2‰', firstLabel:'结算流水 2‰', rates:['2‰','1‰','0.6‰','0.4‰','0.2‰'], type:'flow' }
      },
      packValue:'2 万+'
    }
  },

  /* 表5 城市服务商 */
  providers: {
    center: { key:'center', name:'中心城市服务商', fee:500000, city:'一线城市和省会城市（1 位主城 + 最多 4 位副城）',
      note:'副城 2025 年 GDP 不超过 3000 亿元，或中国地级市排名 100 以外', target:'3 万单',
      products:{ '安心云':410, '如意宝':300, '福运宝':'5‰' },
      renew:'第二年起统一按首年 50%（安心云 205 元 / 如意宝 150 元 / 福运宝 2.5‰）',
      packValue:'100 万+', expected:'1672.4 万+' },
    local: { key:'local', name:'地级城市服务商', fee:200000, city:'中国地级市排名 100 以内的城市', target:'1 万单',
      products:{ '安心云':410, '如意宝':300, '福运宝':'5‰' },
      renew:'第二年起统一按首年 50%', packValue:'50 万+', expected:'609.4 万+' }
  },

  /* 表1 / 表3 城市服务商收益测算（万元） */
  providerIncome: {
    center: [
      { item:'加盟收益', desc:'招募中心级服务商 10%、地级服务商 10%、金牌合伙人 20%、银牌合伙人 20%', value:'52.4 万+', calc:'2×5万 + 12×2万 + 12×13960 + 12×1396', note:'按一年招募 2 个中心级、12 个地级、12 个金牌、12 个银牌测算' },
      { item:'推广收益', desc:'主动开发订单：累计 1000 单（含）以内 240 元/席/年；超过 1000 单部分 300 元/席/年', value:'900 万', calc:'300 × 3 万单', note:'中心城市任务 3 万单' },
      { item:'民匠天眼', desc:'主动开发 120–200 元/路/年，预估 5000 路/年', value:'80 万', calc:'160 × 5000', note:'中心城市 5000 路' },
      { item:'民匠商城', desc:'区域企业客户成交按成交额 5‰ 奖励', value:'50 万', calc:'1000 家 × 10 万 × 5‰', note:'按 1000 家企业、每家每年 10 万平台采购额' },
      { item:'国通项目', desc:'供应链外包 3000 人，每人每小时 0.5 元，每天 10 小时', value:'540 万', calc:'3000×0.5×10×30×12', note:'3000 人外包' },
      { item:'其他业务', desc:'技能培训、船舶制造、中安特检、EAC 认证、大宗贸易等，一事一议', value:'50 万', calc:'平均计算', note:'按合作项目一事一议' },
      { item:'收费阶段', desc:'收费 + 续费收益', value:'—', calc:'—', note:'按实际发生' },
      { item:'上市阶段', desc:'收购 + 收编收益', value:'—', calc:'—', note:'按实际发生' }
    ],
    local: [
      { item:'加盟收益', desc:'招募中心级服务商 10%、地级服务商 10%、金牌合伙人 20%、银牌合伙人 20%', value:'52.4 万', calc:'2×5万 + 12×2万 + 12×13960 + 12×1396', note:'按一年招募 2 个中心级、12 个地级、12 个金牌、12 个银牌测算' },
      { item:'推广收益', desc:'累计 1000 单（含）以内 240 元/席/年；超 1000 单部分 300 元/席/年', value:'300 万', calc:'300 × 1 万单', note:'地级城市任务 1 万单' },
      { item:'民匠天眼', desc:'主动开发 120–200 元/路/年，预估 2000 路/年', value:'32 万', calc:'160 × 2000', note:'地级城市 2000 路' },
      { item:'民匠商城', desc:'区域企业客户成交按成交额 5‰ 奖励', value:'25 万', calc:'500 家 × 10 万 × 5‰', note:'按 500 家企业测算' },
      { item:'国通项目', desc:'供应链外包 1000 人，每人每小时 0.5 元，每天 10 小时', value:'180 万', calc:'1000×0.5×10×30×12', note:'1000 人外包' },
      { item:'其他业务', desc:'技能培训、船舶制造、中安特检、EAC 认证、大宗贸易等', value:'20 万', calc:'平均计算', note:'按合作项目一事一议' }
    ]
  },

  /* 表7 金银铜合伙人加盟增值包 */
  valuePack: [
    { mod:'系统支持', name:'城市服务商管理系统', gold:'1 套', silver:'1 套', bronze:'1 套', value:'/' },
    { mod:'系统支持', name:'民匠有约数字营销系统工具支持', gold:'1 套', silver:'1 套', bronze:'0 套', value:'10 万' },
    { mod:'数据支持', name:'当地工商主体数据支持', gold:'5 万条', silver:'1 万条', bronze:'完成 5 个席位后 1000 条', value:'金 1 万 / 银 2000 元' },
    { mod:'物料支持', name:'品牌宣传手册', gold:'500 册', silver:'300 册', bronze:'10 册', value:'/' },
    { mod:'物料支持', name:'专属工装', gold:'5 套（夏季）', silver:'1 套（夏季）', bronze:'0 套', value:'/' },
    { mod:'物料支持', name:'品牌授权牌', gold:'1 块', silver:'1 块', bronze:'—', value:'300 元' },
    { mod:'物料支持', name:'标准化拓客物料包', gold:'5 套', silver:'2 套', bronze:'100 元/套，或完成 5 席位送 1 套', value:'/' },
    { mod:'设计支持', name:'门店/办公场地全套视觉设计方案', gold:'✓', silver:'✓', bronze:'—', value:'3 万', note:'门头、前台背景墙、团队文化、玻璃腰封、logo 等全套方案与素材' },
    { mod:'市场赋能', name:'专属城市服务经理服务', gold:'✓', silver:'✓', bronze:'✓', value:'2 万' },
    { mod:'市场赋能', name:'总部管家团队专属对接', gold:'1 人', silver:'1 人', bronze:'—', value:'2 万' },
    { mod:'市场赋能', name:'长期运营指导交流（线上/线下）', gold:'不限次数', silver:'不限次数', bronze:'不限次数', value:'2 万' },
    { mod:'市场赋能', name:'总部招商讲师上门支持', gold:'按需沟通', silver:'按需沟通', bronze:'按需沟通', value:'/' },
    { mod:'培训支持', name:'城市合伙人启航培训（2.5 天）', gold:'✓', silver:'✓', bronze:'✓', value:'5000 元' },
    { mod:'培训支持', name:'新员工入职总部轮训（2.5 天）', gold:'✓', silver:'✓', bronze:'✓', value:'5000 元' }
  ],
  packTotal: { gold:'20 万+', silver:'10 万+', bronze:'2 万+' },

  /* 表2 / 表4 服务商加盟增值包 */
  providerPack: [
    { mod:'系统支持', name:'城市服务商管理系统', center:'1 套', local:'1 套', value:'/' },
    { mod:'系统支持', name:'数字营销系统工具支持', center:'1 套', local:'1 套', value:'10 万' },
    { mod:'数据支持', name:'当地工商主体数据支持', center:'100 万条', local:'50 万条', value:'中心 20 万 / 地级 10 万' },
    { mod:'物料支持', name:'品牌宣传手册', center:'5000 册', local:'3000 册', value:'中心 15000 / 地级 10000' },
    { mod:'物料支持', name:'专属工装', center:'50 套', local:'30 套', value:'中心 5000 / 地级 3000' },
    { mod:'物料支持', name:'品牌授权牌', center:'1 块', local:'1 块', value:'300 元' },
    { mod:'物料支持', name:'标准化拓客物料包', center:'50 套', local:'30 套', value:'中心 7500 / 地级 4500' },
    { mod:'设计支持', name:'门店/办公场地全套视觉设计方案', center:'✓', local:'✓', value:'/' },
    { mod:'设计支持', name:'招商大会全流程物料设计', center:'1 次/季度', local:'1 次/季度', value:'/' },
    { mod:'市场赋能', name:'专属城市服务经理驻场陪跑', center:'3 个月', local:'3 个月', value:'中心 10 万+ / 地级 5 万+' },
    { mod:'市场赋能', name:'总部管家团队专属对接', center:'1 人', local:'1 人', value:'/' },
    { mod:'培训支持', name:'启航培训 / 新员工总部轮训', center:'各 2.5 天', local:'各 2.5 天', value:'/' }
  ],

  /* 表6 晋升渠道 */
  upgrades: [
    { from:'铜牌合伙人', to:'银牌合伙人', conditions:['自身 + 直推团队累计成交席位 ≥ 150 个席位','或累计推荐银牌合伙人 2 位、金牌合伙人 1 位'], free:'免费晋升' },
    { from:'银牌合伙人', to:'金牌合伙人', conditions:['自身 + 直推团队累计成交席位 ≥ 300 个席位','或累计推荐银牌合伙人 5 位、金牌合伙人 2 位'], free:'免费晋升' }
  ],
  /* 补充说明：交钱晋升（补差价） */
  paidUpgrade: [
    { path:'铜 → 银', fee:6980, reward:1396, note:'一次性缴纳 6,980 元；推荐人按 20% 得 1,396 元' },
    { path:'银 → 金', fee:62820, reward:12564, note:'补齐 69,800 − 6,980 = 62,820 元差价；推荐人按差价 × 20% 得 12,564 元' }
  ],
  upgradeRule: '合伙人晋升后，历史已购席位继续按原等级分佣标准结算；晋升生效后产生的新增席位、续费业务按新等级标准执行。',

  /* 表11 席位成交奖金 */
  seatAward: {
    gold: { step:1000, amount:20000, label:'每累计成交 1000 个席位，奖励 2 万元' },
    silver:{ step:100, amount:2000, label:'每累计成交 100 个席位，奖励 2000 元' },
    bronze:{ step:0, amount:0, label:'铜牌合伙人暂无席位成交奖金' },
    cap:'金牌、银牌合伙人累计奖励 4 次截止'
  },

  /* 四、招商奖励政策 */
  referral: {
    partnerFeeRate:0.2, partnerFeeNote:'任意合伙人推荐新合伙人，获得被推荐方代理费的 20% 分成（晋升按差价口径）',
    seatShareRate:0.05, seatShareNote:'额外享有被推荐方新增席位开发收益 5% 的分成权益，该席位后续续费同样按 5% 计发；与区域被动收益权益不可同时享受',
    matrix:[
      ['金牌合伙人','金牌合伙人','20%'],['金牌合伙人','银牌合伙人','20%'],
      ['银牌合伙人','银牌合伙人','20%'],['银牌合伙人','金牌合伙人','20%'],
      ['铜牌合伙人','金牌合伙人','20%'],['铜牌合伙人','银牌合伙人','20%']
    ]
  },
  serviceRecruit: [
    { target:'推荐中心城市服务商 1 位', amount:50000 },
    { target:'推荐地级城市服务商 1 位', amount:20000 },
    { target:'推荐金牌合伙人 1 位', amount:13960 },
    { target:'推荐银牌合伙人 1 位', amount:1396 }
  ],
  advisor: {
    chief:{ direct:'15%', indirect:'5%', note:'总顾问自己资源团队中的招商城市拿统提 5%；直接推荐拿 15%；介绍的其他顾问推荐的招商城市拿 5%' },
    other:{ direct:'10%', indirect:'无', note:'其他顾问开发推荐成功城市服务商，享受招商额 10% 奖励；顾问推荐招商只分设两级，超出两级由第二级顾问负责' },
    partner:'顾问招募城市合伙人，享受加盟费 20% 推荐奖励；额外享有被推荐方新增席位开发收益 5% 分成（含续费），与区域被动收益不可同时享受',
    example:'总顾问甲直招 A 城（地级服务商 20 万）拿 15% = 3 万元；甲介绍的顾问乙招商 B 城（20 万），甲拿 5% = 1 万元，乙拿 10% = 2 万元'
  },
  employee: {
    note:'全公司所有在职员工享有铜牌合伙人权益',
    rewards:[{ target:'推荐中心城市服务商', amount:25000 },{ target:'推荐地级城市服务商', amount:10000 }]
  },

  /* 五、城市服务商被动收益权益 */
  passive: {
    intro:'城市服务商在其签约管辖城市范围内，由其他城市服务商及金、银、铜牌合伙人开发的新增席位计发被动收益（本人自主开发的席位不计入核算）',
    rows:[
      { product:'安心云', rule:'新增 1 席，收益 60 元' },
      { product:'如意宝', rule:'新增 1 席，收益 80 元' },
      { product:'福运宝', rule:'按该席位流水的 1‰ 计发收益' }
    ]
  },

  /* 收益来源类型（系统结算口径） */
  sources: [
    { key:'new_seat', name:'新增席位分润', color:'#2D6BC0', desc:'安心云 / 如意宝首年按等级固定单价分润' },
    { key:'renew_seat', name:'续费分润', color:'#5A94E6', desc:'按首年分润 × 第 N 年折扣（50%/30%/20%/10%），需满足年活跃度' },
    { key:'fuyun_flow', name:'福运宝流水分润', color:'#7E6BC8', desc:'按结算流水 × 等级比例（金 4‰ / 银 3‰ / 铜 2‰）' },
    { key:'referral_fee', name:'推荐代理费分成', color:'#B8862B', desc:'被推荐方代理费或晋升差价的 20%' },
    { key:'seat_share', name:'团队席位 5% 分成', color:'#C89B4A', desc:'被推荐方新增席位及后续续费收益的 5%' },
    { key:'seat_award', name:'席位成交奖金', color:'#D5483F', desc:'金：每 1000 席 2 万；银：每 100 席 2000 元，累计 4 次截止' },
    { key:'recruit_reward', name:'招商推荐奖励', color:'#189A6B', desc:'服务商/顾问/员工推荐城市或合伙人的定额奖励' },
    { key:'advisor_service', name:'总顾问招商奖励（服务商）', color:'#0E8A76', desc:'四、1(1)：资源团队统提 5%、直接推荐 15%、介绍其他顾问推荐拿 5%；仅分两级' },
    { key:'advisor_partner', name:'总顾问推荐奖励（合伙人）', color:'#C2913A', desc:'四、1(2)：合伙人加盟费 20% 推荐奖励，另享被推荐方新增及续费席位 5% 分成' },
    { key:'passive_region', name:'区域被动收益', color:'#3FA38A', desc:'服务商管辖区域内他人开发席位：安心云 60 元/席、如意宝 80 元/席、福运宝流水 1‰' },
    { key:'other', name:'其他业务收益', color:'#8A97A8', desc:'技能培训、船舶制造、中安特检、EAC 认证、大宗贸易等，一事一议' }
  ],

  /* 结算状态机 */
  statusFlow:['账单中','待结算','已结算'],
  settlementItems:[
    { type:'新增席位佣金', bill:'次月 1 号', pay:'次月 25 日' },
    { type:'20% 推荐人奖励', bill:'次月 1 号', pay:'次月 25 日' },
    { type:'合伙人席位成交奖金（新增+续费）', bill:'次月 1 号', pay:'次月 25 日' },
    { type:'合伙人邀合伙人 5% 被动收益', bill:'次月 1 号', pay:'次月 25 日' }
  ],
  /* 按月 / 按年拆分：金牌与在职员工·铜牌权益身份下，席位成交奖金的新增按月、续费按年 */
  settlementSplit:[
    { type:'新增席位佣金', bill:'次月 1 号', pay:'次月 25 日', cycle:'月' },
    { type:'20% 推荐人奖励', bill:'次月 1 号', pay:'次月 25 日', cycle:'月' },
    { type:'合伙人席位成交奖金 · 新增', bill:'次月 1 号', pay:'次月 25 日', cycle:'月' },
    { type:'合伙人席位成交奖金 · 续费', bill:'次年 1 月 1 号', pay:'次年 1 月 25 日', cycle:'年' },
    { type:'合伙人邀合伙人 5% 被动收益', bill:'次月 1 号', pay:'次月 25 日', cycle:'月' }
  ],

  /* 业务口径 FAQ —— 源自《服务商问题梳理》17 项，系统已明确实现口径 */
  faq:[
    { q:'个人能否申请成为合伙人？', a:'可以。补充说明已开放个人主体，企业/个人合伙人均通过系统自动结算；自然人结算须线上开票，企业须上传发票经财务审核后提现。系统登录与入驻资料均支持「企业 / 个人」两种主体类型。', tag:'已明确' },
    { q:'一人多身份（既是合伙人又是服务商）如何操作？', a:'支持。后台右上角/侧栏身份卡可一键切换，不同身份的权益、分润规则、收益账本相互独立；同一手机号下多身份共用一次登录。', tag:'系统实现' },
    { q:'新增与续费如何定义？', a:'以客户「首次购买第一个席位」日期为统一基准起算日并锁定；基准日所在自然年内首次成交计为新增，此后同一客户的席位购买（含次年续费、增购）按对应年度折扣计为续费分润。基准日不因增购、换购改变。', tag:'系统口径' },
    { q:'第二年购买席位比第一年少，是否全算续费？', a:'系统按「客户 × 基准日 × 年度」建账：不超过首年席位数的部分计续费，超出部分计新增；每年独立核算，不做跨年抵扣。', tag:'系统口径' },
    { q:'企业自己购买的席位能否拿奖励？', a:'合伙人本人主体自购席位不参与自身分润核算（对应服务商被动收益条款「本人自主开发的席位不计入本收益核算」）；通过邀请码绑定、由合伙人推销成交的席位计入该合伙人的新增业绩。', tag:'待总部确认' },
    { q:'是否支持不拉新、只用邀请码绑定席位？', a:'支持。「邀请码 / 拉新绑定」提供专属二维码与邀请链接，客户下单时自动绑定推荐关系；分销层级限定两级，超出两级不再产生分佣。', tag:'系统实现' },
    { q:'续费分润按首年金额还是按当年折扣？', a:'按「对应产品首年分润 × 折扣比例」：第 2 年 50%、第 3 年 30%、第 4 年 20%、第 5 年及以后 10%（如银牌安心云第 2 年为 200×50% = 100 元，而非 175 元）。福运宝按结算流水比例，非固定金额。', tag:'已明确' },
    { q:'年活跃度不达标会怎样？', a:'金 ≥400 单/年、银 ≥100 单/年、铜 ≥10 单/年；未达标当年不触发续费奖励，奖励在当年年底或次年年初统一发放。系统在工作台实时显示活跃度进度与预警。', tag:'已明确' },
    { q:'晋升后历史订单如何结算？', a:'历史已购席位继续按原等级标准结算，不受晋升影响；晋升生效后新增席位、续费业务按新等级标准执行。系统按订单锁定分佣快照，可逐单追溯。', tag:'已明确' },
    { q:'「直推团队」如何界定？铜牌能否直接跳升金牌？', a:'直推团队 = 本人一级绑定合伙人及其带来的企业席位；晋升条件按表 6 逐级执行（铜→银→金），跨级晋升需总部审批，系统默认不允许跳级。', tag:'待总部确认' },
    { q:'席位成交奖金的「累计」是否含续费与团队席位？', a:'表 11 口径为「新增 + 续费」均计入累计，拉新企业购买的席位计入邀请人名下累计；每达标一次发放一次，金/银各封顶 4 次。系统在「晋升中心」展示累计进度与已发放次数。', tag:'系统口径' },
    { q:'晋升前达标未发完的奖金如何处理？', a:'系统采用「先结算、后晋升」：等级变更触发前先统计并发放晋升前已达标的全部奖励，再按新等级重新起算累计。', tag:'系统口径' },
    { q:'收益何时计算、以什么方式打款？', a:'次月 1 日出账单、次月 25 日系统自动结算；结算至绑定的银行账户，企业需上传发票、个人需线上开票，财务审核通过后可在「收益结算」发起提现。', tag:'已明确' },
    { q:'退费与中途退出的分润如何处理？', a:'政策未明确。系统预留「退出/退费申请」入口，提交后进入总部人工审核，已结算收益不回滚，未结算账单冻结待审。具体退款口径以双方签署的渠道合作协议为准。', tag:'待总部确认' },
    { q:'收费方式、合同与加盟协议在哪里？', a:'入驻流程第 3 步在线签署《渠道合作协议》（双方签字盖章后生效），第 4 步在线支付代理费，系统生成电子回执与合同编号，归档于「我的权益 → 合同与凭证」。', tag:'系统实现' },
    { q:'席位是否区分民匠平台与安心云？', a:'补充说明明确：金银铜合伙人体系纳入分佣的产品范围仅「安心云」一款（统一零售价 698 元/席位）；本系统同时保留主政策表 5 中的如意宝、福运宝口径供服务商与历史账本查询，以总部最终发布的产品清单为准。', tag:'待总部确认' },
    { q:'企业入驻时间与首购基准日以哪个计算自然年？', a:'合伙人业绩年度以「客户首个席位购买日」为基准日；合伙人自身的活跃度年度以「合伙人协议生效日」起算自然年，两套年度独立展示。', tag:'系统口径' }
  ],

  /* 系统补充能力（用户未提及、由产品经理补齐） */
  extras:[
    '身份切换：一人多身份，权益/账本隔离',
    '消息中心：结算、团队晋升、协议、审核结果实时提醒（活跃度进度在工作台展示）',
    '邀请码与拉新绑定：两级分销关系链可视化',
    '结算与提现：账单周期、发票/开票校验、提现流水',
    '晋升中心：免费晋升与补差价晋升双通道',
    '政策与口径中心：全部规则可查、待确认项显式标注',
    '数据导出：收益明细、订单、团队数据 CSV 导出',
    '操作留痕：分佣快照、状态流转、合同与凭证归档'
  ]
};

/* ---------------- 二、演示数据 ---------------- */
function rng(seed){ let s=seed; return function(){ s=(s*9301+49297)%233280; return s/233280; }; }

/* 收益记录 / 团队看板共用：把「席位」按业务口径拆成新增席位、续费席位
 * 新增席位分润、续费分润按来源直接归集；团队分成与区域被动收益含两类席位，
 * 按 65% / 35% 估算拆分；流水、推荐、奖金等非席位类收益两类均记 0。 */
function seatSplit(source, seats){
  const s=Number(seats)||0;
  if(source==='new_seat') return {newSeats:s, renewSeats:0};
  if(source==='renew_seat') return {newSeats:0, renewSeats:s};
  if(source==='seat_share'||source==='passive_region'){
    const n=Math.round(s*0.65);
    return {newSeats:n, renewSeats:s-n};
  }
  return {newSeats:0, renewSeats:0};
}
const CUSTOMERS=['杭州云栖科技有限公司','宁波海创制造有限公司','绍兴恒信餐饮管理','嘉兴智联物流有限公司','温州伯特利电气','苏州新元信息技术','合肥安泰特检设备','无锡锦程供应链','常州鼎盛精工','南京华辰教育科技','义乌市商城贸易集团','台州正泰机电设备'];
const PRODUCTS=['安心云','如意宝','福运宝'];

/* 主身份：金牌合伙人 —— 手写明细，保证业务真实感 */
const goldRecords=[
  ['2026-11-09','new_seat','安心云','杭州云栖科技有限公司',18,6300,'账单中','首年新增 18 席 × 350 元'],
  ['2026-11-07','new_seat','安心云','宁波海创制造有限公司',12,4200,'账单中','首年新增 12 席 × 350 元'],
  ['2026-11-05','fuyun_flow','福运宝','义乌市商城贸易集团',0,3360,'账单中','结算流水 84 万 × 4‰'],
  ['2026-11-03','referral_fee','—','赵文博（晋升银→金）',0,12564,'账单中','晋升差价 62,820 × 20%'],
  ['2026-11-02','seat_share','安心云','团队 · 陈立 名下客户',24,420,'账单中','被推荐方席位分润 8,400 × 5%'],
  ['2026-10-28','new_seat','安心云','苏州新元信息技术',26,9100,'待结算','首年新增 26 席 × 350 元'],
  ['2026-10-26','renew_seat','安心云','嘉兴智联物流有限公司',30,5250,'待结算','第 2 年续费 30 席 × 175 元'],
  ['2026-10-22','new_seat','如意宝','合肥安泰特检设备',14,3360,'待结算','首年新增 14 席 × 240 元'],
  ['2026-10-19','renew_seat','如意宝','无锡锦程供应链',20,2400,'待结算','第 2 年续费 20 席 × 120 元'],
  ['2026-10-16','fuyun_flow','福运宝','常州鼎盛精工',0,2400,'待结算','结算流水 60 万 × 4‰'],
  ['2026-10-12','referral_fee','—','林晓（新签金牌合伙人）',0,13960,'待结算','代理费 69,800 × 20%'],
  ['2026-10-09','seat_award','安心云','累计成交 1000 席位达标',0,20000,'待结算','第 1 次 / 上限 4 次'],
  ['2026-10-06','seat_share','安心云','团队 · 王倩 名下客户',36,630,'待结算','被推荐方席位分润 12,600 × 5%'],
  ['2026-10-03','new_seat','安心云','南京华辰教育科技',9,3150,'待结算','首年新增 9 席 × 350 元'],
  ['2026-09-27','new_seat','安心云','台州正泰机电设备',22,7700,'已结算','首年新增 22 席 × 350 元'],
  ['2026-09-24','renew_seat','安心云','绍兴恒信餐饮管理',16,1680,'已结算','第 3 年续费 16 席 × 105 元'],
  ['2026-09-20','fuyun_flow','福运宝','温州伯特利电气',0,1920,'已结算','结算流水 48 万 × 4‰'],
  ['2026-09-15','seats','如意宝','常州鼎盛精工',11,2640,'已结算','首年新增 11 席 × 240 元'],
  ['2026-09-11','referral_fee','—','周敏（新签银牌合伙人）',0,1396,'已结算','代理费 6,980 × 20%'],
  ['2026-09-06','seat_share','福运宝','团队 · 陈立 名下客户',0,860,'已结算','被推荐方流水分润 × 5%'],
  ['2026-08-29','new_seat','安心云','温州伯特利电气',31,10850,'已结算','首年新增 31 席 × 350 元'],
  ['2026-08-22','renew_seat','安心云','宁波海创制造有限公司',25,2625,'已结算','第 3 年续费 25 席 × 105 元'],
  ['2026-08-18','other','—','中安特检合作项目',0,12000,'已结算','一事一议，按项目结算'],
  ['2026-08-12','seat_award','安心云','累计成交 2000 席位达标',0,20000,'已结算','第 2 次 / 上限 4 次'],
  ['2026-08-05','new_seat','安心云','义乌市商城贸易集团',20,7000,'已结算','首年新增 20 席 × 350 元'],
  ['2026-07-28','fuyun_flow','福运宝','苏州新元信息技术',0,2880,'已结算','结算流水 72 万 × 4‰'],
  ['2026-07-19','renew_seat','安心云','杭州云栖科技有限公司',40,4200,'已结算','第 3 年续费 40 席 × 105 元'],
  ['2026-07-08','referral_fee','—','吴昊（新签金牌合伙人）',0,13960,'已结算','代理费 69,800 × 20%']
].map((r,i)=>Object.assign({
  id:'MJ'+(2026110001+i), date:r[0], source:r[1]==='seats'?'new_seat':r[1], product:r[2], customer:r[3],
  seats:r[4], amount:r[5], status:r[6], note:r[7], settle:'次月 25 日'
}, seatSplit(r[1]==='seats'?'new_seat':r[1], r[4])));

/* 其他身份：按来源权重生成明细 */
function genRecords(seed, n, weights, scale, monthsBack){
  const rand=rng(seed), out=[], keys=Object.keys(weights), cum=[]; let t=0;
  keys.forEach(k=>{t+=weights[k];cum.push([k,t]);});
  const today=new Date(2026,10,11);
  for(let i=0;i<n;i++){
    const d=new Date(today); d.setDate(d.getDate()-Math.floor(rand()*monthsBack*30));
    const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const r=rand()*t, key=cum.find(c=>r<=c[1])[0];
    const product=key==='fuyun_flow'?'福运宝':(rand()>.35?'安心云':'如意宝');
    const seats=[0,6,9,12,18,24,30][Math.floor(rand()*7)];
    let amount=Math.round((300+rand()*2600)*scale/10)*10;
    if(key==='seat_award') amount=key==='seat_award'?(scale>2?50000:2000):amount;
    if(key==='referral_fee') amount=[1396,13960,12564,20000,50000][Math.floor(rand()*5)];
    if(key==='recruit_reward') amount=[1396,13960,20000,50000,25000,10000][Math.floor(rand()*6)];
    const m=d.getMonth(), y=d.getFullYear();
    const settleStatus=(y===2026&&m===10)?'账单中':((y===2026&&m===9)?'待结算':'已结算');
    out.push(Object.assign({ id:'MJ'+(seed*100000+i+1), date:ds, source:key, product,
      customer:key==='referral_fee'||key==='recruit_reward'?'推荐加盟 / 招商落地':CUSTOMERS[Math.floor(rand()*CUSTOMERS.length)],
      seats, amount, status:settleStatus, settle:'次月 25 日',
      note:key==='passive_region'?'管辖区域内他人开发席位':(key==='new_seat'?'按等级首年单价分润':'按政策口径自动计发') }, seatSplit(key, seats)));
  }
  return out.sort((a,b)=>b.date.localeCompare(a.date));
}
const centerRecords=genRecords(21,26,{new_seat:3,renew_seat:2,fuyun_flow:1,passive_region:4,recruit_reward:3,other:1},3.2,7);
/* 高级总顾问（城市服务商）：招商额 15% / 5%，资源团队统提 5%，仅两级 */
const advisorServiceRecords=[
  ['2026-11-06','advisor_service','—','A 城市 · 中心城市服务商',30000,'账单中','直接推荐地级城市招商额 20 万 × 15%'],
  ['2026-11-01','advisor_service','—','B 城市 · 地级城市服务商',10000,'账单中','介绍顾问乙招商地级城市 20 万 × 5%'],
  ['2026-10-24','advisor_service','—','C 城市 · 地级城市服务商',20000,'待结算','直接推荐地级城市招商额 20 万 × 15%'],
  ['2026-10-18','advisor_service','—','D 城市 · 中心城市服务商',25000,'待结算','资源团队招商额 50 万 × 统提 5%'],
  ['2026-10-11','advisor_service','—','E 城市 · 地级城市服务商',10000,'待结算','介绍顾问丙招商地级城市 20 万 × 5%'],
  ['2026-09-29','advisor_service','—','F 城市 · 中心城市服务商',75000,'已结算','直接推荐中心城市招商额 50 万 × 15%'],
  ['2026-09-20','advisor_service','—','G 城市 · 地级城市服务商',10000,'已结算','资源团队招商额 20 万 × 统提 5%'],
  ['2026-09-08','advisor_service','—','H 城市 · 地级城市服务商',20000,'已结算','直接推荐地级城市招商额 20 万 × 15%'],
  ['2026-08-26','advisor_service','—','I 城市 · 中心城市服务商',25000,'已结算','介绍顾问丁招商中心城市 50 万 × 5%'],
  ['2026-08-14','advisor_service','—','J 城市 · 地级城市服务商',10000,'已结算','资源团队招商额 20 万 × 统提 5%']
].map((r,i)=>Object.assign({
  id:'AG'+(2026100001+i), date:r[0], source:r[1], product:r[2], customer:r[3],
  seats:0, amount:r[4], status:r[5], note:r[6], settle:'次月 25 日'
}, seatSplit(r[1],0)));

/* 高级总顾问（城市合伙人）：加盟费 20% 推荐奖励 + 席位 5% 分成（含续费），与区域被动收益互斥 */
const advisorPartnerRecords=[
  ['2026-11-08','advisor_partner','安心云','陈立（新签金牌合伙人）',0,13960,'账单中','代理费 69,800 × 20% 推荐奖励'],
  ['2026-11-05','seat_share','安心云','陈立 名下客户 · 新增席位',18,630,'账单中','被推荐方新增席位收益 12,600 × 5%（续费同样计发）'],
  ['2026-10-30','advisor_partner','安心云','周敏（新签银牌合伙人）',0,1396,'待结算','代理费 6,980 × 20% 推荐奖励'],
  ['2026-10-22','seat_share','安心云','王倩 名下客户 · 续费席位',24,420,'待结算','被推荐方续费席位收益 8,400 × 5%'],
  ['2026-10-15','advisor_partner','安心云','赵文博（银→金晋升）',0,12564,'待结算','晋升差价 62,820 × 20% 推荐奖励'],
  ['2026-09-27','advisor_partner','安心云','郑楠（新签铜牌合伙人）',0,0,'已结算','铜牌零代理费，无代理费分成'],
  ['2026-09-19','seat_share','如意宝','林晓 名下客户 · 新增席位',30,720,'已结算','被推荐方新增席位收益 14,400 × 5%'],
  ['2026-09-06','advisor_partner','安心云','林晓（新签金牌合伙人）',0,13960,'已结算','代理费 69,800 × 20% 推荐奖励'],
  ['2026-08-21','seat_share','安心云','吴昊 名下客户 · 续费席位',20,350,'已结算','被推荐方续费席位收益 7,000 × 5%']
].map((r,i)=>Object.assign({
  id:'AP'+(2026090001+i), date:r[0], source:r[1], product:r[2], customer:r[3],
  seats:r[4], amount:r[5], status:r[6], note:r[7], settle:'次月 25 日'
}, seatSplit(r[1],r[4])));

const bronzeRecords=genRecords(53,18,{new_seat:4,renew_seat:2,referral_fee:2,seat_share:1},0.55,7);

/* 月度趋势（近 12 个月：2025-12 ~ 2026-11） */
const MONTHS=['2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11'];
const goldMonthly=[48620,52340,41880,61750,68420,72380,79640,82460,91840,86320,96480,86420];
const centerMonthly=[186200,204800,168400,231600,258400,276800,298600,312400,338200,321600,352800,318600];
const advisorServiceMonthly=[48200,53600,45100,62400,69800,75200,82600,88400,96200,91800,102400,88000];
const advisorPartnerMonthly=[18600,22400,19800,28600,33200,31600,37800,41200,46800,43600,52400,45000];
const bronzeMonthly=[2380,2860,2140,3420,3860,4120,4680,5240,5820,5460,6180,5640];

/* 席位 / 订单 */
function genOrders(seed,n,scale){
  const rand=rng(seed), out=[];
  for(let i=0;i<n;i++){
    const y=2024+Math.floor(rand()*3), m=1+Math.floor(rand()*12), d=1+Math.floor(rand()*28);
    const base=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const seats=[3,6,8,12,18,24,30,40][Math.floor(rand()*8)];
    const type=rand()>.42?'新增':'续费';
    const product=PRODUCTS[Math.floor(rand()*3)];
    const yearNo=rand()>.6?1:(rand()>.5?2:3);
    out.push({ id:'DD2026'+String(1000+i), customer:CUSTOMERS[Math.floor(rand()*CUSTOMERS.length)], product,
      seats, type, baseDate:base, yearNo, status:rand()>.15?'已成交':'已失效',
      amount:Math.round(seats*(product==='安心云'?698:(product==='如意宝'?498:380))*scale) });
  }
  return out;
}

/* 一级绑定合伙人看板（补充说明第 7 条） */
const team=[
  {name:'陈立',level:'金牌合伙人',fee:69800,seats:186,newSeats:132,renewSeats:54,amount:129828,date:'2025-06-12',active:'达标'},
  {name:'王倩',level:'银牌合伙人',fee:6980,seats:124,newSeats:86,renewSeats:38,amount:86552,date:'2025-09-03',active:'达标'},
  {name:'林晓',level:'金牌合伙人',fee:69800,seats:98,newSeats:71,renewSeats:27,amount:68404,date:'2026-01-18',active:'达标'},
  {name:'赵文博',level:'金牌合伙人',fee:62820,seats:76,newSeats:52,renewSeats:24,amount:53048,date:'2026-02-25',active:'达标'},
  {name:'周敏',level:'银牌合伙人',fee:6980,seats:64,newSeats:43,renewSeats:21,amount:44672,date:'2026-03-09',active:'达标'},
  {name:'吴昊',level:'金牌合伙人',fee:69800,seats:52,newSeats:31,renewSeats:21,amount:36296,date:'2026-04-16',active:'预警'},
  {name:'郑楠',level:'铜牌合伙人',fee:0,seats:18,newSeats:18,renewSeats:0,amount:12564,date:'2026-06-21',active:'达标'},
  {name:'孙浩',level:'银牌合伙人',fee:6980,seats:12,newSeats:9,renewSeats:3,amount:8376,date:'2026-08-04',active:'预警'}
];

/* 账单 */
const bills=[
  {period:'2026-10', amount:58510, status:'待结算', billDate:'2026-11-01', payDate:'2026-11-25', count:9},
  {period:'2026-09', amount:57930, status:'已结算', billDate:'2026-10-01', payDate:'2026-10-25', count:12},
  {period:'2026-08', amount:64780, status:'已结算', billDate:'2026-09-01', payDate:'2026-09-25', count:11},
  {period:'2026-07', amount:55320, status:'已结算', billDate:'2026-08-01', payDate:'2026-08-25', count:10}
];

/* 账户（一人多身份） */
const ACCOUNTS={
  gold:{
    id:'PT20240318001', name:'张明远', phone:'13800008888', subject:'企业主体',
    company:'杭州明远企业服务有限公司', role:'金牌合伙人', roleKey:'partner', level:'gold',
    region:'浙江省 · 杭州市（不限区域，可全国开发）', joinDate:'2024-03-18', contract:'MJ-QD-2024-0318-0087',
    seats:1286, activeYear:428, activeTarget:400, teamCount:8, awardTimes:2,
    bank:'招商银行杭州分行 · **** 6821', records:goldRecords, monthly:goldMonthly, orders:genOrders(11,24,1), team:team, bills:bills,
    upgradeNext:'—', levelFee:69800
  },
  center:{
    id:'SP20240220002', name:'张明远', phone:'13800008888', subject:'企业主体',
    company:'杭州明远企业服务有限公司', role:'中心城市服务商', roleKey:'provider', level:'center',
    region:'签约管辖：杭州市（主城）', joinDate:'2024-02-20', contract:'MJ-FW-2024-0220-0012',
    seats:8642, activeYear:8642, activeTarget:30000, teamCount:16, awardTimes:0,
    bank:'招商银行杭州分行 · **** 6821', records:centerRecords, monthly:centerMonthly, orders:genOrders(29,24,2.4), team:team, bills:bills,
    upgradeNext:'—', levelFee:500000
  },
  advisorService:{
    id:'AD20240110003', name:'张明远', phone:'13800008888', subject:'个人主体',
    company:'高级总顾问（城市服务商）', role:'高级总顾问（城市服务商）', roleKey:'advisorService', level:'advisorService',
    region:'全国 · 城市服务商招商', joinDate:'2024-01-10', contract:'MJ-GW-S-2024-0110-0003',
    seats:0, activeYear:0, activeTarget:0, teamCount:6, awardTimes:0,
    bank:'招商银行杭州分行 · **** 6821', records:advisorServiceRecords, monthly:advisorServiceMonthly, orders:[], team:team.slice(0,6), bills:bills,
    upgradeNext:'—', levelFee:0
  },
  advisorPartner:{
    id:'AD20240110004', name:'张明远', phone:'13800008888', subject:'个人主体',
    company:'高级总顾问（城市合伙人）', role:'高级总顾问（城市合伙人）', roleKey:'advisorPartner', level:'advisorPartner',
    region:'全国 · 城市合伙人推荐', joinDate:'2024-01-10', contract:'MJ-GW-P-2024-0110-0004',
    seats:0, activeYear:0, activeTarget:0, teamCount:6, awardTimes:0,
    bank:'招商银行杭州分行 · **** 6821', records:advisorPartnerRecords, monthly:advisorPartnerMonthly, orders:[], team:team.slice(0,6), bills:bills,
    upgradeNext:'—', levelFee:0
  },
  bronze:{
    id:'EM20250101004', name:'张明远', phone:'13800008888', subject:'个人主体',
    company:'全员营销 · 在职员工', role:'在职员工（铜牌权益）', roleKey:'employee', level:'bronze',
    region:'全国', joinDate:'2025-01-01', contract:'MJ-YG-2025-0101-0044',
    seats:96, activeYear:96, activeTarget:10, teamCount:2, awardTimes:0,
    bank:'招商银行杭州分行 · **** 6821', records:bronzeRecords, monthly:bronzeMonthly, orders:genOrders(71,12,.8), team:team.slice(0,2), bills:bills,
    upgradeNext:'银牌合伙人', levelFee:0
  }
};

const NOTICES=[
  {type:'结算',icon:'¥',color:'#EAF1FB',title:'2026 年 10 月账单已生成',desc:'账单金额 ¥58,510，将于 11 月 25 日自动结算，请及时核对。',date:'2026-11-01 09:20',unread:true},
  {type:'团队',icon:'↑',color:'#E7F6EF',title:'赵文博已完成银→金晋升',desc:'晋升差价 62,820 元，你的 20% 推荐奖励 ¥12,564 已进入本期账单。',date:'2026-11-03 10:42',unread:true},
  {type:'政策',icon:'文',color:'#F0EBFB',title:'《金银铜合伙人分佣体系补充说明》已发布',desc:'安心云统一零售价 698 元/席位，明确基准日、两级分销与结算时间。',date:'2026-10-22 16:30',unread:false}
];

const TODOS=[
  {t:'10 月账单待确认',d:'9 笔收益 · ¥58,510，11 月 25 日结算',tag:'待处理'},
  {t:'企业发票待上传',d:'提现前需完成发票上传与财务审核',tag:'需补件'},
  {t:'2 位团队成员活跃度预警',d:'吴昊、孙浩 年度席位未达标，建议跟进',tag:'关注'},
  {t:'渠道合作协议年审',d:'协议有效期至 2027-03-17，可提前发起续签',tag:'提醒'}
];

window.POLICY=POLICY;
window.DEMO={ ACCOUNTS, MONTHS, NOTICES, TODOS, CUSTOMERS, PRODUCTS };
})();
