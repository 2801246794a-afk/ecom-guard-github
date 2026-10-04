const riskyRules = [
  { level: 'P0', terms: ['全网最低', '全网第一', '销量第一', '绝对', '顶级', '国家级', '100%', '纯羊绒', '零风险', '最好'], title: '高风险绝对化 / 纯度表达', advice: '优先删除绝对化词和未经检测支持的纯度表述；如果是材质宣传，改成可被资料证明的具体成分。' },
  { level: 'P1', terms: ['抗菌', '防螨', '医用', '治疗', '防癌', '不掉毛', '不起球', '永久保暖'], title: '功效或性能需要资质', advice: '只有在有对应检测、认证或可举证资料时才使用；否则改成主观体验或工艺描述。' },
  { level: 'P2', terms: ['山羊绒', '羊绒', '天然', '柔软亲肤', '保暖'], title: '材质 / 体验需要证据边界', advice: '可以保留经营口径，但不要在无报告时扩写成“100%”“纯”或具体百分比。' }
];

const $ = (id) => document.getElementById(id);
const money = (value) => `¥${Number(value).toFixed(2)}`;

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab));
    document.querySelectorAll('.panel').forEach((panel) => panel.classList.toggle('active-panel', panel.id === tab.dataset.tab));
  });
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => { $('copyText').value = chip.dataset.example; scanCopy(); });
});

function scanCopy() {
  const text = $('copyText').value.trim();
  const evidence = $('evidenceStatus').value;
  const result = $('complianceResult');
  if (!text) { result.innerHTML = '<div class="result-empty"><div class="empty-mark">!</div><h3>还没有文案</h3><p>先粘贴一段商品文案再扫描。</p></div>'; return; }

  const findings = [];
  riskyRules.forEach((rule) => {
    const hits = rule.terms.filter((term) => text.includes(term));
    if (hits.length) findings.push({ ...rule, hits });
  });
  if (evidence !== 'report' && text.includes('山羊绒')) {
    const existing = findings.find((item) => item.level === 'P2');
    if (existing) existing.advice += evidence === 'pending' ? ' 当前还未取得书面资料，建议先标记“待确认”。' : ' 当前仅有供应商 / 项目口径，不能直接写成检测已证实。';
  }

  const p0 = findings.filter((item) => item.level === 'P0').length;
  const p1 = findings.filter((item) => item.level === 'P1').length;
  const score = Math.max(0, 100 - p0 * 35 - p1 * 18 - findings.filter((item) => item.level === 'P2').length * 8);
  const scoreClass = score >= 85 ? 'good' : score >= 65 ? 'warn' : 'bad';
  const status = score >= 85 ? '可继续人工复核' : score >= 65 ? '建议修改后复核' : '建议暂停发布';
  const evidenceText = evidence === 'report' ? '已选择“有对应检测报告”：仍请确认报告对应货号、款式和成分。' : evidence === 'supplier' ? '当前是“仅供应商 / 项目口径”：不要宣传“100%”“纯羊绒”或具体成分百分比。' : '当前材质状态为“待确认”：建议先取得书面成分或检测资料，再定稿。';
  const findingsHtml = findings.length ? findings.map((item) => `<div class="finding ${item.level.toLowerCase()}"><span class="level ${item.level.toLowerCase()}">${item.level}</span><div><strong>${item.title}：${item.hits.join('、')}</strong><p>${item.advice}</p></div></div>`).join('') : '<div class="finding safe"><span class="level p2">OK</span><div><strong>暂未命中内置风险词</strong><p>仍建议人工核对材质、功能、价格和售后承诺是否有资料支撑。</p></div></div>';
  result.innerHTML = `<div class="score-row"><div><span class="score-label">自查评分</span><div class="score ${scoreClass}">${score} <small>/ 100</small></div></div><strong>${status}</strong></div>${findingsHtml}<div class="callout">证据提醒：${evidenceText}</div>`;
}

function calculatePrice() {
  const cost = Number($('cost').value) || 0;
  const price = Number($('price').value) || 0;
  const shipping = Number($('shipping').value) || 0;
  const packaging = Number($('packaging').value) || 0;
  const platformFee = (Number($('platformFee').value) || 0) / 100;
  const adRatio = (Number($('adRatio').value) || 0) / 100;
  const creatorRatio = (Number($('creatorRatio').value) || 0) / 100;
  const returnRate = (Number($('returnRate').value) || 0) / 100;
  const variableFee = platformFee + adRatio + creatorRatio;
  const returnPressure = shipping * (1 + returnRate);
  const profit = price * (1 - variableFee) - cost - packaging - returnPressure;
  const margin = price ? profit / price : 0;
  const breakEven = (cost + packaging + returnPressure) / Math.max(.01, 1 - variableFee);
  const good = profit > 0;
  const result = $('pricingResult');
  result.innerHTML = `<div class="score-row"><div><span class="score-label">单均预估净利</span><div class="score ${good ? 'good' : 'bad'}">${money(profit)}</div></div><strong>${good ? '有利润空间' : '当前价格会亏损'}</strong></div><div class="metric-grid"><div class="metric main"><span class="metric-label">预估净利率</span><span class="metric-value ${good ? 'positive' : 'negative'}">${(margin * 100).toFixed(1)}%</span></div><div class="metric"><span class="metric-label">建议保本售价</span><span class="metric-value">${money(breakEven)}</span></div></div><div class="metric-label">售价中预计留存比例</div><div class="bar"><span style="width:${Math.max(0, Math.min(100, (1 - variableFee) * 100))}%"></span></div><div class="breakdown"><strong>成本拆解</strong><br />货品 ${money(cost)} · 包材 ${money(packaging)} · 物流压力 ${money(returnPressure)} · 平台 / 投放 / 达人 ${(variableFee * 100).toFixed(1)}%</div><div class="callout">这只是估算：真实结果还会受退款规则、优惠券、运费险、售后补发、税费和活动补贴影响。建议把商家后台实际费率替换进来。</div>`;
}

$('scanBtn').addEventListener('click', scanCopy);
$('calculateBtn').addEventListener('click', calculatePrice);
['cost', 'price', 'shipping', 'packaging', 'platformFee', 'adRatio', 'creatorRatio', 'returnRate'].forEach((id) => $(id).addEventListener('input', calculatePrice));
scanCopy();
calculatePrice();
