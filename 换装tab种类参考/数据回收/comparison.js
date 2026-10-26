function renderComparison(mode, funnelSortKey = null) {
  const source = REPORT_COMPARISON;
  const d = mode === 'funnel' ? {...source,outfit:source.funnel.outfit} : source;
  const n = value => value.toLocaleString('zh-CN', {maximumFractionDigits:0});
  const decimal = value => value.toLocaleString('zh-CN', {minimumFractionDigits:1,maximumFractionDigits:1});
  const pct = value => (value*100).toFixed(1)+'%';
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const date = value => `${value.slice(4,6)}.${value.slice(6,8)}`;
  const period = item => `${date(item.start)}—${date(item.end)}（${item.days} 天）`;
  const note = body => `<p class="report-note">${body}</p>`;
  const panel = (title, body) => `<section class="report-panel"><h2>${title}</h2>${body}</section>`;
  const table = (heads, rows) => `<div class="report-table-wrap"><table class="report-table"><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const kpis = rows => `<div class="report-kpis">${rows.map(([label,value,caption])=>`<div><small>${label}</small><strong>${value}</strong><p>${caption}</p></div>`).join('')}</div>`;
  if (mode === 'funnel') {
    const paywall = d.failureRows.find(row=>row.code==='Paywall').count;
    const technical = d.failureRows.filter(row=>row.kind==='技术').reduce((sum,row)=>sum+row.count,0);
    const stages = [
      ['点击效果',d.outfit.clicks,'100% · 点击事件作为起点'],
      ['预览成功',d.preview,`占点击 ${pct(d.preview/d.outfit.clicks)}`],
      ['保存效果',d.outfit.saves,`占点击 ${pct(d.outfit.rate)} · 占预览成功 ${pct(d.outfit.saves/d.preview)}`]
    ];
    const funnel = `<div class="funnel-stages">${stages.map(([title,count,caption],index)=>`<div class="funnel-stage"><div class="funnel-stage-top"><span>${index+1} · ${title}</span><strong>${n(count)}</strong></div><div class="funnel-stage-track"><i style="width:${count/d.outfit.clicks*100}%"></i></div><small>${caption}</small></div>`).join('')}</div>`;
    const reconciliation = `<div class="event-reconcile" role="img" aria-label="预览成功 ${pct(d.preview/d.outfit.clicks)}，已记录失败 ${pct(d.failures/d.outfit.clicks)}，未匹配到预览记录 ${pct(d.unmatched/d.outfit.clicks)}"><span class="success" style="width:${d.preview/d.outfit.clicks*100}%"></span><span class="failure" style="width:${d.failures/d.outfit.clicks*100}%"></span><span class="unknown" style="width:${d.unmatched/d.outfit.clicks*100}%"></span></div><div class="event-legend"><span>预览成功 ${n(d.preview)}（${pct(d.preview/d.outfit.clicks)}）</span><span>已记录失败 ${n(d.failures)}（${pct(d.failures/d.outfit.clicks)}）</span><span>未匹配到预览记录 ${n(d.unmatched)}（${pct(d.unmatched/d.outfit.clicks)}）</span></div>`;
    const failures = table(['失败原因','事件数','占失败事件','占点击事件','埋点含义'], d.failureRows.map(row=>[
      `<b>${escape(row.name)}</b><small class="parameter">${escape(row.key)}</small>`,n(row.count),pct(row.count/d.failures),pct(row.count/d.outfit.clicks),escape(row.description)
    ]));
    const toolNames = {Outfit:'换装',Hairstyle:'发型',Makeup:'妆容',Skin:'皮肤',Enhance:'增强',Impression:'印象',HairColor:'发色',Age:'年龄',Shoot:'拍摄',Smile:'微笑',Tone:'肤色',Headshot:'写真',Makeover:'变装'};
    const funnelMetrics = [
      ['clicks','点击数'],['preview','预览成功数'],['saves','保存数'],
      ['previewRate','点击 → 预览'],['previewSaveRate','预览 → 保存'],['saveRate','点击 → 保存']
    ];
    const activeSort = funnelMetrics.find(([key])=>key===funnelSortKey);
    const comparedTools = activeSort ? [...d.funnel.tools].sort((a,b)=>b[funnelSortKey]-a[funnelSortKey] || b.clicks-a.clicks || a.tool.localeCompare(b.tool)) : d.funnel.tools;
    const comparisonOrder = activeSort ? `按${activeSort[1]}降序` : '换装置顶，其余按点击数降序';
    const metricHeaders = funnelMetrics.map(([key,label])=>{
      const selected = activeSort && key===funnelSortKey;
      return `<th scope="col" aria-sort="${selected?'descending':'none'}"><button type="button" class="funnel-sort-button${selected?' selected':''}" data-funnel-sort="${key}" aria-label="按${label}降序排列" aria-pressed="${!!selected}"><span class="funnel-sort-circle" aria-hidden="true">${selected?'⬇️':''}</span><span>${label}</span></button></th>`;
    }).join('');
    const toolComparison = `<div class="funnel-tool-comparison report-table-wrap"><table class="report-table"><thead><tr><th scope="col">工具</th><th scope="col">预览来源</th>${metricHeaders}</tr></thead><tbody>${comparedTools.map(row=>`<tr data-tool="${row.tool}"${row.tool==='Outfit'?' class="outfit-benchmark-row"':''}><td><b>${escape(toolNames[row.tool]||row.tool)}</b><small class="parameter">${escape(row.tool)}</small></td><td>${escape(row.sources.map(source=>source==='Local'?'本地':'服务器').join(' + '))}</td>${[n(row.clicks),n(row.preview),n(row.saves),pct(row.previewRate),pct(row.previewSaveRate),pct(row.saveRate)].map(value=>`<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return panel('换装点击—预览—保存漏斗', `<p class="report-lead">2026.${period(d.outfit)} · 事件数口径</p><div class="report-callout">本页漏斗使用 10.11—10.22 的完整 12 天数据；与前两个对比页的 10.11—10.18（8 天）不同。当前缺少 8 天预览和失败明细，因此未将 8 天点击与 12 天预览混算。</div>${kpis([
      ['点击 → 预览成功',pct(d.preview/d.outfit.clicks),`${n(d.preview)} / ${n(d.outfit.clicks)}`],
      ['预览成功 → 保存',pct(d.outfit.saves/d.preview),`${n(d.outfit.saves)} / ${n(d.preview)}`],
      ['点击 → 保存',pct(d.outfit.rate),`${n(d.outfit.saves)} / ${n(d.outfit.clicks)}`]
    ])}${funnel}${note('EffectPreview 是预览成功事件：同一效果每次点击后最多计一次成功预览，重复滑动滑竿或档位不重复计入。这里用汇总事件相除，并非同一批用户或请求逐条追踪的真实转化漏斗。漏斗保留原始 12 天总数，不折算事件。')}`)
    + panel('换装与其他工具漏斗对比', `<p class="report-lead">2026.10.11—10.22 · 同期完整 12 天 · ${comparisonOrder}</p>${toolComparison}${note('从点击量看，换装有较强的尝试吸引力：12 天内产生 66,875 次点击，在这 13 个工具中按点击量位居前列。但最终仅产生 15,176 次保存，点击到保存的事件比为 22.7%，约每 4.4 次点击对应 1 次保存，说明点击兴趣尚未充分转化为保存。后续可重点优化生成效果与预览后的保存体验；点击量反映尝试规模，实际点击意愿还需结合曝光量判断。')}`)
    + panel('点击与预览记录核对', `${reconciliation}${note(`成功预览 + 已记录失败 = ${n(d.preview+d.failures)}，比点击少 ${n(d.unmatched)}（${pct(d.unmatched/d.outfit.clicks)}）。这是汇总事件数的差额，不是 Unknown 失败事件；当前导出没有 Outfit_…_Unknown 记录，不能直接判定这部分为失败；预览成功与失败也可能发生在不同重试中，缺少请求 ID，无法逐次闭合。`)}`)
    + panel('预览失败原因', `${failures}${note('原因定义取自“预览和换装失败数据埋点结构.png”。Paywall 表示弹出付费拦截后未付费，UserCancel 表示完成前主动取消，不能统称为技术失败。当前 Outfit 的预览和失败参数来源均为 Server。')}`)
    + panel('建议优先检查', `<div class="report-findings"><p><b>付费拦截优先：</b>${pct(paywall/d.failures)} 的失败事件来自付费页。结合付费点击、订阅完成与返回预览事件，检查付费页之后的流失，不能直接把这些事件视为服务器异常。</p><p><b>预览后的保存：</b>预览成功到保存的事件比为 ${pct(d.outfit.saves/d.preview)}。建议按付费/免费和素材质量进一步拆分，但当前预览导出仅有工具级参数，暂时无法得到每个素材的预览保存率。</p><p><b>补齐链路：</b>增加请求 ID、重试标记和结束状态，核对 ${n(d.unmatched)} 次未匹配到预览记录差额，并关联取消、成功和保存事件。</p></div>`)
    ;
  }
  const a = d.outfit;
  const b = mode === 'makeover' ? d.makeover : d.makeup;
  const isBefore = mode === 'makeover';
  const clickRatio = a.clicks/b.clicks;
  const saveRatio = a.saves/b.saves;
  const ratePP = (a.rate-b.rate)*100;
  const title = isBefore ? 'Outfit 对比更新前 Makeover' : 'Outfit 对比同期 Makeup';
  const comparisonDates = isBefore ? 'Outfit：2026年10月11日到10月18日；Makeover：2026年10月3日到10月10日' : '2026年10月11日到10月18日';
  const summary = isBefore
    ? `实际 8 天数据中，Outfit 点击量为 Makeover 的 ${clickRatio.toFixed(2)} 倍，保存量为 ${saveRatio.toFixed(2)} 倍；事件保存率高 ${ratePP.toFixed(1)} 个百分点。跨工具、跨时期比较，不能直接归因为本次上新。`
    : `同期 8 天中，Outfit 点击量为 Makeup 的 ${pct(a.clicks/b.clicks)}，保存量为 ${pct(a.saves/b.saves)}；事件保存率高 ${ratePP.toFixed(1)} 个百分点。工具曝光、入口和素材数量不同，不能据此推断用户偏好或收入。`;
  const comparison = table(['工具 / 实际统计周期','点击数','保存数','事件保存率'],[a,b].map(item=>[
    `<b>${item.tool}</b><small class="parameter">2026.${period(item)}</small>`,n(item.clicks),n(item.saves),`<b class="accent-text">${pct(item.rate)}</b>`
  ]));
  const barMetric = (label,first,second,format) => {
    const max=Math.max(first,second);
    return `<div class="comparison-bar-group"><h3>${label}</h3>${[[a.tool,first],[b.tool,second]].map(([name,value],index)=>`<div class="comparison-bar-row"><span>${name}</span><div class="comparison-bar-track"><i class="${index?'benchmark':'outfit'}" style="width:${value/max*100}%"></i></div><b>${format(value)}</b></div>`).join('')}</div>`;
  };
  const bars = `<div class="comparison-bars">${barMetric('点击数',a.clicks,b.clicks,n)}${barMetric('保存数',a.saves,b.saves,n)}${barMetric('事件保存率',a.rate,b.rate,pct)}</div>`;
  return panel(title, `<p class="report-lead">实际 8 天对比 · ${comparisonDates}</p><div class="report-callout">${summary}</div>${kpis([
    ['点击量比',clickRatio.toFixed(2)+' 倍',`Outfit / ${b.tool}`],
    ['保存量比',saveRatio.toFixed(2)+' 倍',`Outfit / ${b.tool}`],
    ['保存率差',`+${ratePP.toFixed(1)} 个百分点`,`${pct(a.rate)} − ${pct(b.rate)}`]
  ])}${comparison}${bars}${note('两组同一指标的比例条使用相同尺度，从 0 起。统计的是事件次数，不是去重用户转化率。')}`);
}
