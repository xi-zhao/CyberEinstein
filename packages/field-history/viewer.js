import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const cytoscapeEntry = require.resolve('cytoscape');
const cytoscapeSource = readFileSync(
  path.join(path.dirname(cytoscapeEntry), 'cytoscape.min.js'),
  'utf8',
).replaceAll('</script', '<\\/script');

function serialized(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

export function renderFieldHistoryHtml(map, options = {}) {
  const title = options.title ?? map?.seed?.title ?? 'CyberEinstein Field History';
  const documentTitle = String(title).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${documentTitle} · CyberEinstein Field History</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #06101d;
      --panel: #0a1727;
      --panel-2: #0d1d30;
      --line: rgba(159, 190, 225, 0.16);
      --text: #e9f3ff;
      --muted: #8fa6bf;
      --seed: #ffb454;
      --foundation: #56cfe1;
      --branch: #b18cff;
      --derivative: #5d9dff;
      --frontier: #63dfae;
      --danger: #ff7b8a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 320px;
      min-height: 100vh;
      overflow: hidden;
      color: var(--text);
      background:
        radial-gradient(circle at 28% 12%, rgba(41, 118, 185, 0.16), transparent 30%),
        radial-gradient(circle at 72% 82%, rgba(65, 190, 157, 0.08), transparent 28%),
        var(--bg);
      font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    button, input { font: inherit; }
    button { color: inherit; }
    .app { height: 100vh; display: grid; grid-template-rows: auto auto minmax(0, 1fr); }
    .topbar {
      min-height: 74px;
      padding: 14px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 1px solid var(--line);
      background: rgba(6, 16, 29, 0.82);
      backdrop-filter: blur(18px);
    }
    .identity { min-width: 0; display: flex; align-items: center; gap: 13px; }
    .mark {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(86, 207, 225, 0.42);
      border-radius: 12px;
      color: var(--foundation);
      background: linear-gradient(145deg, rgba(86, 207, 225, 0.12), rgba(93, 157, 255, 0.05));
      font: 500 18px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .product { color: var(--muted); font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; }
    h1 { margin: 3px 0 0; max-width: 760px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 17px; font-weight: 500; }
    .metrics { display: flex; gap: 20px; color: var(--muted); font-size: 12px; white-space: nowrap; }
    .metrics strong { display: block; color: var(--text); font-size: 16px; font-weight: 500; text-align: right; }
    .toolbar {
      min-height: 52px;
      padding: 8px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--line);
      background: rgba(10, 23, 39, 0.74);
    }
    .search {
      width: min(300px, 31vw);
      min-width: 180px;
      padding: 8px 11px;
      color: var(--text);
      background: rgba(4, 13, 24, 0.78);
      border: 1px solid var(--line);
      border-radius: 8px;
      outline: none;
    }
    .search:focus { border-color: rgba(86, 207, 225, 0.62); box-shadow: 0 0 0 3px rgba(86, 207, 225, 0.08); }
    .filters { display: flex; align-items: center; gap: 5px; overflow-x: auto; scrollbar-width: none; }
    .filter, .action, .file-label {
      padding: 7px 10px;
      border: 1px solid transparent;
      border-radius: 7px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      white-space: nowrap;
      font-size: 12px;
    }
    .filter:hover, .action:hover, .file-label:hover { color: var(--text); background: rgba(143, 166, 191, 0.08); }
    .filter.active { color: var(--text); border-color: var(--line); background: rgba(143, 166, 191, 0.1); }
    .toolbar-spacer { flex: 1; }
    .file-label input { display: none; }
    .workspace { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 340px; }
    .canvas { position: relative; min-height: 0; overflow: hidden; }
    #graph { position: absolute; inset: 0; }
    .legend {
      position: absolute;
      left: 18px;
      bottom: 16px;
      z-index: 2;
      display: flex;
      flex-wrap: wrap;
      gap: 10px 14px;
      max-width: calc(100% - 36px);
      padding: 8px 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(6, 16, 29, 0.82);
      color: var(--muted);
      font-size: 11px;
      backdrop-filter: blur(12px);
      pointer-events: none;
    }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dot); }
    .timeline-hint {
      position: absolute;
      top: 14px;
      left: 18px;
      z-index: 2;
      color: rgba(143, 166, 191, 0.66);
      font-size: 11px;
      letter-spacing: 0.08em;
      pointer-events: none;
    }
    .details {
      min-height: 0;
      overflow: auto;
      padding: 22px 20px 28px;
      border-left: 1px solid var(--line);
      background: rgba(10, 23, 39, 0.8);
      scrollbar-color: rgba(143, 166, 191, 0.28) transparent;
    }
    .eyebrow { color: var(--muted); font-size: 11px; letter-spacing: 0.13em; text-transform: uppercase; }
    .details h2 { margin: 7px 0 11px; font-size: 19px; line-height: 1.36; font-weight: 500; }
    .byline { margin: 0 0 16px; color: var(--muted); font-size: 12px; line-height: 1.6; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
    .tag { padding: 4px 7px; border-radius: 5px; color: var(--tag-color); background: color-mix(in srgb, var(--tag-color) 12%, transparent); font-size: 11px; }
    .section { margin-top: 20px; }
    .section h3 { margin: 0 0 10px; color: var(--muted); font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; }
    .why-list { margin: 0; padding-left: 17px; color: #bfd0e2; font-size: 12px; line-height: 1.65; }
    .score { display: grid; grid-template-columns: 104px 1fr 34px; gap: 8px; align-items: center; margin: 7px 0; color: var(--muted); font-size: 11px; }
    .track { height: 4px; overflow: hidden; border-radius: 4px; background: rgba(143, 166, 191, 0.12); }
    .fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--foundation), var(--derivative)); }
    .score-value { color: var(--text); text-align: right; font-variant-numeric: tabular-nums; }
    .evidence-note { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: 11px; line-height: 1.55; }
    .evidence-note strong { color: var(--danger); font-weight: 500; }
    .history-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
    .history-item { padding: 8px; border: 1px solid var(--line); border-radius: 7px; color: var(--muted); font-size: 11px; }
    .history-item strong { display: block; margin-top: 3px; color: var(--text); font-size: 16px; font-weight: 500; }
    .paper-link { display: inline-block; margin-top: 13px; color: var(--foundation); font-size: 12px; text-decoration: none; }
    .paper-link:hover { text-decoration: underline; }
    .empty { color: var(--muted); font-size: 12px; line-height: 1.6; }
    #tooltip {
      position: absolute;
      z-index: 5;
      display: none;
      max-width: 300px;
      padding: 8px 10px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(5, 14, 25, 0.94);
      color: var(--text);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.34);
      font-size: 11px;
      line-height: 1.45;
      pointer-events: none;
    }
    @media (max-width: 800px) {
      body { overflow: auto; }
      .app { height: auto; min-height: 100vh; }
      .topbar { align-items: flex-start; }
      .metrics { display: none; }
      .toolbar { flex-wrap: wrap; }
      .search { width: 100%; }
      .toolbar-spacer { display: none; }
      .workspace { grid-template-columns: 1fr; grid-template-rows: 62vh auto; }
      .details { border-left: 0; border-top: 1px solid var(--line); overflow: visible; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="identity">
        <div class="mark" aria-hidden="true">CE</div>
        <div>
          <div class="product">CyberEinstein · Field History</div>
          <h1 id="map-title"></h1>
        </div>
      </div>
      <div class="metrics" aria-label="图谱统计">
        <div><strong id="map-status">—</strong>覆盖状态</div>
        <div><strong id="paper-count">0</strong>论文</div>
        <div><strong id="relation-count">0</strong>关系</div>
        <div><strong id="year-range">—</strong>时间跨度</div>
      </div>
    </header>
    <nav class="toolbar" aria-label="图谱控制">
      <input id="search" class="search" type="search" placeholder="搜索论文、作者或 DOI" aria-label="搜索论文、作者或 DOI" />
      <div class="filters" aria-label="论文角色筛选">
        <button class="filter active" type="button" data-role="all">全部</button>
        <button class="filter" type="button" data-role="backbone">历史主干</button>
        <button class="filter" type="button" data-role="foundation">奠基</button>
        <button class="filter" type="button" data-role="branch">分叉</button>
        <button class="filter" type="button" data-role="derivative">后续</button>
        <button class="filter" type="button" data-role="frontier">前沿</button>
      </div>
      <div class="toolbar-spacer"></div>
      <button id="fit" class="action" type="button">适应画布</button>
      <label class="file-label">载入图谱<input id="file" type="file" accept="application/json,.json" /></label>
    </nav>
    <section class="workspace">
      <div class="canvas">
        <div class="timeline-hint">较早研究 ← 时间 → 后续研究</div>
        <div id="graph" role="img" aria-label="论文引用与相关工作连接图"></div>
        <div class="legend" aria-label="图例">
          <span><i class="dot" style="--dot:var(--seed)"></i>种子</span>
          <span><i class="dot" style="--dot:var(--foundation)"></i>奠基</span>
          <span><i class="dot" style="--dot:var(--branch)"></i>分叉</span>
          <span><i class="dot" style="--dot:var(--derivative)"></i>后续</span>
          <span><i class="dot" style="--dot:var(--frontier)"></i>前沿</span>
          <span>粗边 · 历史主干</span>
          <span>点边查看关系类型</span>
        </div>
        <div id="tooltip" role="tooltip"></div>
      </div>
      <aside id="details" class="details" aria-live="polite"></aside>
    </section>
  </main>
  <script>${cytoscapeSource}</script>
  <script>
    const initialMap = ${serialized(map)};
    const roleLabels = { seed: '种子', foundation: '奠基', branch: '分叉', derivative: '后续', frontier: '前沿' };
    const roleColors = { seed: '#ffb454', foundation: '#56cfe1', branch: '#b18cff', derivative: '#5d9dff', frontier: '#63dfae' };
    const scoreLabels = { citationStrength: '引用强度', historicalSupport: '历史支持', sharedReferences: '共享参考', topicOverlap: '主题重合', recency: '时间新近', total: '综合排序' };
    const relevanceLabels = { textSimilarity: '标题与摘要', topicOverlap: '主题一致', citationProximity: '引用距离', graphConnectivity: '图结构', total: '相关性总分' };
    const relationLabels = { theoretical_extension: '理论继承', method_improvement: '方法改进', experimental_validation: '实验验证', engineering_application: '工程应用', review_citation: '综述引用', contradiction_or_debate: '反驳与争议', unclassified: '待核验' };
    const relationColors = { theoretical_extension: '#5d9dff', method_improvement: '#56cfe1', experimental_validation: '#63dfae', engineering_application: '#ffb454', review_citation: '#b18cff', contradiction_or_debate: '#ff7b8a', unclassified: '#8da5bf' };
    let currentMap;
    let cy;
    let activeRole = 'all';

    const byId = (id) => document.getElementById(id);
    const dominantRole = (node) => ['seed', 'frontier', 'derivative', 'foundation', 'branch'].find((role) => node.roles.includes(role)) || 'branch';
    const shortLabel = (title, maximum = 48) => title.length > maximum ? title.slice(0, maximum - 1) + '…' : title;
    const hash = (value) => [...value].reduce((total, char) => ((total << 5) - total + char.charCodeAt(0)) | 0, 0);

    function positions(nodes, seedYear) {
      const years = nodes.map((node) => node.year).filter(Number.isInteger);
      const minimum = Math.min(...years, seedYear || 2000);
      const maximum = Math.max(...years, seedYear || 2000);
      const span = Math.max(1, maximum - minimum);
      const buckets = new Map();
      for (const node of [...nodes].sort((a, b) => b.scores.total - a.scores.total)) {
        const year = Number.isInteger(node.year) ? node.year : seedYear;
        const index = buckets.get(year) || 0;
        buckets.set(year, index + 1);
        const direction = index === 0 ? 0 : index % 2 ? -1 : 1;
        const level = Math.ceil(index / 2);
        node.position = {
          x: 80 + ((year - minimum) / span) * 1120,
          y: 350 + direction * level * 82 + ((Math.abs(hash(node.id)) % 17) - 8),
        };
      }
    }

    function cytoscapeElements(map) {
      const nodes = structuredClone(map.nodes);
      positions(nodes, map.seed.year || new Date().getFullYear());
      const ranked = [...nodes].sort((a, b) => b.scores.total - a.scores.total);
      const labeled = new Set([map.seed.workId, ...ranked.slice(0, 14).map((node) => node.id)]);
      const counts = nodes.map((node) => Math.log1p(node.citationCount));
      const maximum = Math.max(1, ...counts);
      const backboneNodes = new Set(map.views.backbone || []);
      const backboneEdges = new Set(map.views.backboneEdges || []);
      return [
        ...nodes.map((node) => {
          const role = dominantRole(node);
          return {
            group: 'nodes',
            data: {
              id: node.id,
              label: labeled.has(node.id) ? shortLabel(node.title) : '',
              fullTitle: node.title,
              year: node.year || '未知',
              role,
              color: roleColors[role],
              size: 18 + 34 * (Math.log1p(node.citationCount) / maximum),
              backbone: backboneNodes.has(node.id),
              raw: node,
            },
            classes: backboneNodes.has(node.id) ? 'backbone' : '',
            position: node.position,
          };
        }),
        ...map.edges.map((edge) => ({
          group: 'edges',
          data: {
            ...edge,
            backbone: backboneEdges.has(edge.id),
            relationKind: edge.researchRelation.kind,
            relationColor: relationColors[edge.researchRelation.kind],
            raw: edge,
          },
          classes: backboneEdges.has(edge.id) ? 'backbone' : '',
        })),
      ];
    }

    function renderMap(map) {
      currentMap = map;
      const years = map.nodes.map((node) => node.year).filter(Number.isInteger);
      byId('map-title').textContent = map.seed.title;
      byId('map-status').textContent = map.status === 'partial' ? '数据不完整' : '有界完成';
      byId('map-status').style.color = map.status === 'partial' ? 'var(--danger)' : 'var(--frontier)';
      byId('paper-count').textContent = map.nodes.length;
      byId('relation-count').textContent = map.edges.length;
      byId('year-range').textContent = years.length ? Math.min(...years) + '–' + Math.max(...years) : '未知';
      if (cy) cy.destroy();
      cy = cytoscape({
        container: byId('graph'),
        elements: cytoscapeElements(map),
        layout: { name: 'preset', fit: true, padding: 72 },
        minZoom: 0.18,
        maxZoom: 3.5,
        wheelSensitivity: 0.22,
        style: [
          { selector: 'node', style: {
            'background-color': 'data(color)', 'width': 'data(size)', 'height': 'data(size)',
            'border-width': 2, 'border-color': '#dbeeff', 'border-opacity': 0.22,
            'label': 'data(label)', 'font-size': 10, 'font-family': 'Inter, system-ui, sans-serif',
            'font-weight': 400, 'color': '#dcecff', 'text-wrap': 'wrap', 'text-max-width': 150,
            'text-valign': 'bottom', 'text-margin-y': 8, 'text-background-color': '#06101d',
            'text-background-opacity': 0.8, 'text-background-padding': 3, 'overlay-opacity': 0,
            'transition-property': 'opacity, border-width, border-color', 'transition-duration': '160ms'
          }},
          { selector: 'node[role = "seed"]', style: { 'border-width': 4, 'border-color': '#ffca7a', 'border-opacity': 0.82, 'z-index': 10 } },
          { selector: 'node.backbone', style: { 'border-width': 3, 'border-opacity': 0.62 } },
          { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#f2f8ff', 'border-opacity': 0.95 } },
          { selector: 'edge', style: {
            'width': 1.2, 'line-color': 'data(relationColor)', 'target-arrow-color': 'data(relationColor)',
            'curve-style': 'bezier', 'opacity': 0.24, 'overlay-opacity': 0
          }},
          { selector: 'edge[type = "cites"]', style: { 'target-arrow-shape': 'triangle', 'arrow-scale': 0.65, 'opacity': 0.34 } },
          { selector: 'edge[type = "bibliographic_coupling"]', style: { 'line-style': 'dashed', 'line-color': '#56cfe1', 'opacity': 0.22 } },
          { selector: 'edge[type = "semantic_similarity"]', style: { 'line-style': 'dotted', 'line-color': '#b18cff', 'opacity': 0.24 } },
          { selector: 'edge.backbone', style: { 'width': 3.2, 'opacity': 0.72, 'z-index': 8 } },
          { selector: 'edge:selected', style: { 'width': 4, 'opacity': 1 } },
          { selector: '.dim', style: { 'opacity': 0.055, 'text-opacity': 0 } },
          { selector: '.search-hit', style: { 'border-width': 5, 'border-color': '#ffffff', 'border-opacity': 1, 'z-index': 20 } }
        ],
      });
      bindGraphEvents();
      showDetails(map.nodes.find((node) => node.id === map.seed.workId));
      applyFilter();
    }

    function bindGraphEvents() {
      const tooltip = byId('tooltip');
      cy.on('tap', 'node', (event) => showDetails(event.target.data('raw')));
      cy.on('tap', 'edge', (event) => showEdgeDetails(event.target.data('raw')));
      cy.on('mouseover', 'node', (event) => {
        const node = event.target.data('raw');
        tooltip.textContent = (node.year || '年份未知') + ' · ' + node.title;
        tooltip.style.display = 'block';
      });
      cy.on('mousemove', 'node', (event) => {
        const box = byId('graph').getBoundingClientRect();
        tooltip.style.left = Math.max(8, Math.min(box.width - 310, event.renderedPosition.x + 18)) + 'px';
        tooltip.style.top = Math.max(12, event.renderedPosition.y - 8) + 'px';
      });
      cy.on('mouseout', 'node', () => { tooltip.style.display = 'none'; });
    }

    function scoreRows(values, labels) {
      const scores = document.createElement('div');
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'included' || key === 'reasons' || typeof value !== 'number') return;
        const row = document.createElement('div');
        row.className = 'score';
        const label = document.createElement('span');
        label.textContent = labels[key] || key;
        const track = document.createElement('div');
        track.className = 'track';
        const fill = document.createElement('div');
        fill.className = 'fill';
        fill.style.width = Math.round(value * 100) + '%';
        track.append(fill);
        const number = document.createElement('span');
        number.className = 'score-value';
        number.textContent = value.toFixed(2);
        row.append(label, track, number);
        scores.append(row);
      });
      return scores;
    }

    function showDetails(node) {
      if (!node) return;
      const details = byId('details');
      details.replaceChildren();
      const eyebrow = document.createElement('div');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = (node.year || '年份未知') + ' · ' + (node.venue || '来源未知');
      const heading = document.createElement('h2');
      heading.textContent = node.title;
      const byline = document.createElement('p');
      byline.className = 'byline';
      byline.textContent = node.authors.map((author) => author.name).slice(0, 6).join(' · ') || '作者信息未收录';
      const tags = document.createElement('div');
      tags.className = 'tags';
      node.roles.forEach((role) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.style.setProperty('--tag-color', roleColors[role]);
        tag.textContent = roleLabels[role];
        tags.append(tag);
      });
      if (node.backbone.selected) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.style.setProperty('--tag-color', '#f2f8ff');
        tag.textContent = '历史主干';
        tags.append(tag);
      }
      details.append(eyebrow, heading, byline, tags);
      details.append(section('为什么进入这张图', list(node.why)));
      details.append(section('严格相关性过滤', scoreRows(node.relevance, relevanceLabels)));
      details.append(section('历史排序', scoreRows(node.scores, scoreLabels)));
      const history = document.createElement('div');
      history.className = 'history-grid';
      const historyLabels = { reproductionCaseIds: '复现案例', claimIds: 'Claims', runIds: 'Runs', failureLessonIds: '失败经验' };
      Object.entries(historyLabels).forEach(([key, label]) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = label;
        const count = document.createElement('strong');
        count.textContent = node.executableHistory[key].length;
        item.append(count);
        history.append(item);
      });
      details.append(section('可执行历史', history));
      const link = document.createElement('a');
      link.className = 'paper-link';
      link.href = node.doi || node.openAlexUrl;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = node.doi ? '打开 DOI ↗' : '打开 OpenAlex ↗';
      details.append(link);
      const warning = document.createElement('p');
      warning.className = 'evidence-note';
      const strong = document.createElement('strong');
      strong.textContent = '元数据线索，不是科研证据。';
      warning.append(strong, document.createTextNode(' 引用、相关性与排名只能用于发现候选论文，科学 Claim 仍需全文、运行证据与独立审查。'));
      details.append(warning);
    }

    function showEdgeDetails(edge) {
      if (!edge) return;
      const details = byId('details');
      details.replaceChildren();
      const source = currentMap.nodes.find((node) => node.id === edge.source);
      const target = currentMap.nodes.find((node) => node.id === edge.target);
      const eyebrow = document.createElement('div');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = edge.type === 'cites' ? '引用关系假设' : '图结构线索';
      const heading = document.createElement('h2');
      heading.textContent = relationLabels[edge.researchRelation.kind] || edge.researchRelation.kind;
      const byline = document.createElement('p');
      byline.className = 'byline';
      byline.textContent = (source?.title || edge.source) + ' → ' + (target?.title || edge.target);
      details.append(eyebrow, heading, byline);
      details.append(section('判定依据', list(edge.researchRelation.basis)));
      details.append(section('图关系依据', list(edge.basis)));
      const confidence = document.createElement('p');
      confidence.className = 'empty';
      confidence.textContent = '置信度 ' + edge.researchRelation.confidence.toFixed(2) + ' · ' + (edge.researchRelation.accessLevel === 'abstract' ? '标题与摘要' : '仅元数据');
      details.append(section('可核验状态', confidence));
      const warning = document.createElement('p');
      warning.className = 'evidence-note';
      const strong = document.createElement('strong');
      strong.textContent = '关系标签仍不是科研证据。';
      warning.append(strong, document.createTextNode(' 它用于安排全文核验优先级，不能代替对引用语境和实验结果的阅读。'));
      details.append(warning);
    }

    function section(title, content) {
      const wrapper = document.createElement('section');
      wrapper.className = 'section';
      const heading = document.createElement('h3');
      heading.textContent = title;
      wrapper.append(heading, content);
      return wrapper;
    }

    function list(items) {
      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = '暂无记录';
        return empty;
      }
      const list = document.createElement('ul');
      list.className = 'why-list';
      items.forEach((value) => {
        const item = document.createElement('li');
        item.textContent = value;
        list.append(item);
      });
      return list;
    }

    function applyFilter() {
      if (!cy) return;
      const query = byId('search').value.trim().toLocaleLowerCase();
      cy.batch(() => {
        cy.nodes().forEach((element) => {
          const node = element.data('raw');
          const searchable = [node.title, node.doi, ...node.authors.map((author) => author.name)].filter(Boolean).join(' ').toLocaleLowerCase();
          const roleMatch = activeRole === 'all' ||
            (activeRole === 'backbone' ? (currentMap.views.backbone || []).includes(node.id) : node.roles.includes(activeRole)) ||
            node.roles.includes('seed');
          const textMatch = !query || searchable.includes(query);
          element.toggleClass('dim', !(roleMatch && textMatch));
          element.toggleClass('search-hit', Boolean(query && textMatch));
        });
        cy.edges().forEach((edge) => {
          edge.toggleClass('dim', edge.source().hasClass('dim') || edge.target().hasClass('dim'));
        });
      });
    }

    document.querySelectorAll('.filter').forEach((button) => {
      button.addEventListener('click', () => {
        activeRole = button.dataset.role;
        document.querySelectorAll('.filter').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
        applyFilter();
      });
    });
    byId('search').addEventListener('input', applyFilter);
    byId('search').addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const first = cy.nodes().filter((node) => !node.hasClass('dim')).first();
      if (first.length) {
        cy.$(':selected').unselect();
        first.select();
        cy.animate({ center: { eles: first }, zoom: Math.max(cy.zoom(), 1.15) }, { duration: 280 });
        showDetails(first.data('raw'));
      }
    });
    byId('fit').addEventListener('click', () => cy.animate({ fit: { eles: cy.elements(), padding: 72 } }, { duration: 320 }));
    byId('file').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const map = JSON.parse(await file.text());
        if (!map.seed || !Array.isArray(map.nodes) || !Array.isArray(map.edges)) throw new Error('不是有效的 FieldHistoryMap');
        renderMap(map);
      } catch (error) {
        window.alert('无法载入图谱：' + error.message);
      } finally {
        event.target.value = '';
      }
    });
    renderMap(initialMap);
  </script>
</body>
</html>`;
}
