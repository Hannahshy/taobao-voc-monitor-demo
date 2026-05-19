const STORAGE_KEY = "taobaoVocMonitor.v1";

const defaultSettings = {
  maxPages: 3,
  maxProducts: 5,
  scanInterval: 8,
  negativeKeywords: ["坏了", "掉色", "破损", "异味", "描述不符", "客服差", "物流慢", "不耐用", "掉毛", "开裂", "漏发", "色差"],
  painPointCategories: ["质量做工", "尺寸规格", "描述不符", "物流包装", "客服售后", "使用体验", "耐用度", "其他"]
};

const demoMonitors = [
  {
    id: "m-1001",
    productId: "746492018001",
    url: "https://item.taobao.com/item.htm?id=746492018001",
    label: "宠物凉感垫",
    shop: "湖蓝家居旗舰店",
    category: "宠物用品",
    platform: "淘宝",
    enabled: true
  }
];

const sampleReviews = [
  {
    productId: "746492018001",
    label: "宠物凉感垫",
    sku: "颜色: 雾蓝; 尺寸: M",
    ratingType: "差评",
    reviewTime: "2026-05-16 21:30",
    content: "用了不到一周边缘就开线了，垫子里面还有一股异味，猫不愿意趴。",
    followUp: "客服回复很慢，说只能补偿几块钱。",
    imageCount: 2
  },
  {
    productId: "746492018001",
    label: "宠物凉感垫",
    sku: "颜色: 灰色; 尺寸: L",
    ratingType: "中评",
    reviewTime: "2026-05-15 10:12",
    content: "尺寸比页面写的小一点，包装压得比较皱，整体还可以但不值这个价格。",
    followUp: "",
    imageCount: 1
  },
  {
    productId: "746492018001",
    label: "宠物凉感垫",
    sku: "颜色: 雾蓝; 尺寸: S",
    ratingType: "关键词命中",
    reviewTime: "2026-05-13 18:44",
    content: "快递很慢，收到的时候外包装破损，里面垫子也有轻微污渍。",
    followUp: "洗了之后还是有点味道。",
    imageCount: 3
  },
  {
    productId: "746492018001",
    label: "宠物凉感垫",
    sku: "",
    ratingType: "低星",
    reviewTime: "2026-05-11 08:55",
    content: "没有想象中凉，描述有点夸张，夏天用起来效果一般。",
    followUp: "",
    imageCount: 0
  },
  {
    productId: "746492018001",
    label: "宠物凉感垫",
    sku: "颜色: 米白; 尺寸: XL",
    ratingType: "差评",
    reviewTime: "2026-05-10 14:07",
    content: "洗了一次就掉色，表面还起球，耐用度不行。",
    followUp: "",
    imageCount: 1
  }
];

let state = loadState();

const els = {
  storageStatus: document.querySelector("#storageStatus"),
  tabs: document.querySelectorAll(".tab"),
  panels: document.querySelectorAll(".tab-panel"),
  monitorForm: document.querySelector("#monitorForm"),
  productUrl: document.querySelector("#productUrl"),
  productLabel: document.querySelector("#productLabel"),
  shopName: document.querySelector("#shopName"),
  category: document.querySelector("#category"),
  monitorRows: document.querySelector("#monitorRows"),
  enabledCount: document.querySelector("#enabledCount"),
  newCount: document.querySelector("#newCount"),
  totalReviewCount: document.querySelector("#totalReviewCount"),
  runScan: document.querySelector("#runScan"),
  progressBar: document.querySelector("#progressBar"),
  scanMessage: document.querySelector("#scanMessage"),
  csvInput: document.querySelector("#csvInput"),
  htmlSnapshot: document.querySelector("#htmlSnapshot"),
  importSnapshot: document.querySelector("#importSnapshot"),
  scanLogRows: document.querySelector("#scanLogRows"),
  filterProduct: document.querySelector("#filterProduct"),
  filterRating: document.querySelector("#filterRating"),
  filterPainPoint: document.querySelector("#filterPainPoint"),
  filterStatus: document.querySelector("#filterStatus"),
  filterKeyword: document.querySelector("#filterKeyword"),
  exportVoc: document.querySelector("#exportVoc"),
  vocRows: document.querySelector("#vocRows"),
  reportScanSelect: document.querySelector("#reportScanSelect"),
  regenerateReport: document.querySelector("#regenerateReport"),
  exportReportMd: document.querySelector("#exportReportMd"),
  exportReportExcel: document.querySelector("#exportReportExcel"),
  reportOutput: document.querySelector("#reportOutput"),
  maxPages: document.querySelector("#maxPages"),
  maxProducts: document.querySelector("#maxProducts"),
  scanInterval: document.querySelector("#scanInterval"),
  negativeKeywords: document.querySelector("#negativeKeywords"),
  painPointCategories: document.querySelector("#painPointCategories"),
  saveSettings: document.querySelector("#saveSettings"),
  resetDemo: document.querySelector("#resetDemo")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        monitors: parsed.monitors?.length ? parsed.monitors : demoMonitors,
        reviews: parsed.reviews || [],
        scans: parsed.scans || [],
        scansLog: parsed.scansLog || [],
        importedReviews: parsed.importedReviews || [],
        settings: { ...defaultSettings, ...parsed.settings }
      };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    monitors: demoMonitors,
    reviews: [],
    scans: [],
    importedReviews: [],
    settings: defaultSettings
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function boot() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  els.monitorForm.addEventListener("submit", handleAddMonitor);
  els.runScan.addEventListener("click", runDemoScan);
  els.csvInput.addEventListener("change", handleCsvImport);
  els.importSnapshot.addEventListener("click", handleSnapshotImport);
  els.exportVoc.addEventListener("click", exportVoc);
  els.regenerateReport.addEventListener("click", regenerateLatestReport);
  els.exportReportMd.addEventListener("click", exportReportMarkdown);
  els.exportReportExcel.addEventListener("click", exportReportExcel);
  els.saveSettings.addEventListener("click", saveSettings);
  els.resetDemo.addEventListener("click", resetDemoData);

  [els.filterProduct, els.filterRating, els.filterPainPoint, els.filterStatus, els.filterKeyword].forEach((el) => {
    el.addEventListener("input", renderVoc);
  });
  els.reportScanSelect.addEventListener("change", renderReport);

  renderAll();
}

function activateTab(tabName) {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  els.panels.forEach((panel) => panel.classList.toggle("active", panel.id === tabName));
}

function handleAddMonitor(event) {
  event.preventDefault();
  const url = els.productUrl.value.trim();
  const productId = extractProductId(url);
  const monitor = {
    id: crypto.randomUUID(),
    productId,
    url,
    label: els.productLabel.value.trim(),
    shop: els.shopName.value.trim() || "未填写",
    category: els.category.value.trim() || "未分类",
    platform: url.includes("tmall") ? "天猫" : "淘宝",
    enabled: true
  };
  state.monitors.unshift(monitor);
  saveState();
  els.monitorForm.reset();
  renderAll();
}

function extractProductId(url) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id") || parsed.pathname.split("/").filter(Boolean).pop() || `item-${Date.now()}`;
  } catch {
    return `item-${Date.now()}`;
  }
}

function toggleMonitor(id) {
  state.monitors = state.monitors.map((monitor) =>
    monitor.id === id ? { ...monitor, enabled: !monitor.enabled } : monitor
  );
  saveState();
  renderAll();
}

function removeMonitor(id) {
  state.monitors = state.monitors.filter((monitor) => monitor.id !== id);
  saveState();
  renderAll();
}

async function runDemoScan() {
  const enabled = state.monitors.filter((monitor) => monitor.enabled).slice(0, state.settings.maxProducts);
  if (!enabled.length) {
    logScan("扫描失败", "没有启用中的商品，请先添加或启用监控项。");
    renderScan();
    return;
  }

  els.runScan.disabled = true;
  els.progressBar.style.width = "8%";
  els.scanMessage.textContent = "打开评价页并检查登录状态...";
  await wait(420);
  els.progressBar.style.width = "35%";
  els.scanMessage.textContent = "读取中差评、追评、SKU 和图片数量...";
  await wait(520);
  els.progressBar.style.width = "68%";
  els.scanMessage.textContent = "标准化评论并进行痛点分类...";
  await wait(520);

  const scanId = `scan-${Date.now()}`;
  const sourceRows = state.importedReviews.length ? state.importedReviews.splice(0) : buildSampleRows(enabled);
  const normalized = normalizeReviews(sourceRows, enabled, scanId);
  const before = state.reviews.length;
  const existingKeys = new Set(state.reviews.map(reviewKey));
  const deduped = normalized.filter((review) => !existingKeys.has(reviewKey(review)));
  state.reviews.unshift(...deduped);

  const scan = {
    id: scanId,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    productCount: enabled.length,
    newCount: state.reviews.length - before,
    reviewIds: deduped.map((review) => review.id)
  };
  state.scans.unshift(scan);
  logScan("扫描完成", `扫描 ${enabled.length} 个商品，新增 ${scan.newCount} 条 VOC。`);

  els.progressBar.style.width = "100%";
  els.scanMessage.textContent = `扫描完成：新增 ${scan.newCount} 条 VOC。`;
  els.runScan.disabled = false;
  saveState();
  renderAll();
}

function buildSampleRows(enabledMonitors) {
  return enabledMonitors.flatMap((monitor, index) => {
    return sampleReviews.map((review, reviewIndex) => ({
      ...review,
      productId: monitor.productId,
      label: monitor.label,
      productUrl: monitor.url,
      platform: monitor.platform,
      sku: review.sku || (reviewIndex % 2 ? "规格: 默认" : ""),
      reviewTime: bumpDate(review.reviewTime, index)
    }));
  });
}

function bumpDate(dateString, offsetDays) {
  const date = new Date(dateString.replace(" ", "T"));
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function normalizeReviews(rows, monitors, scanId) {
  const monitorById = new Map(monitors.map((monitor) => [monitor.productId, monitor]));
  const fallbackMonitor = monitors[0];
  return rows.map((row) => {
    const productId = row.productId || row["商品ID"] || fallbackMonitor.productId;
    const monitor = monitorById.get(productId) || fallbackMonitor;
    const content = row.content || row["评价正文"] || row["正文"] || "";
    const followUp = row.followUp || row["追评"] || "";
    const ratingType = row.ratingType || row["评分/评价类型"] || row["评价类型"] || inferRatingType(content, followUp);
    const painPoint = classifyPainPoint(`${content} ${followUp}`);
    const severity = inferSeverity(ratingType, `${content} ${followUp}`, painPoint);
    return {
      id: crypto.randomUUID(),
      scanId,
      crawlDate: new Date().toISOString().slice(0, 10),
      productId,
      productUrl: row.productUrl || row["商品链接"] || monitor.url,
      label: row.label || row["商品标签"] || monitor.label,
      sku: row.sku || row["SKU/规格"] || "未识别",
      platform: row.platform || row["平台"] || monitor.platform,
      ratingType,
      reviewTime: row.reviewTime || row["评价时间"] || "未知",
      content: content || "未识别到评价正文",
      followUp,
      imageCount: Number(row.imageCount ?? row["图片数"] ?? 0),
      sentiment: "负向",
      painPoint,
      severity,
      status: "待处理"
    };
  });
}

function inferRatingType(content, followUp) {
  const text = `${content} ${followUp}`;
  if (/差评|一星|1星/.test(text)) return "差评";
  if (/中评|二星|2星|三星|3星/.test(text)) return "中评";
  if (state.settings.negativeKeywords.some((word) => text.includes(word))) return "关键词命中";
  return "低星";
}

function classifyPainPoint(text) {
  const rules = [
    ["物流包装", ["物流", "快递", "包装", "破损", "压", "漏发"]],
    ["客服售后", ["客服", "售后", "退款", "补偿", "回复"]],
    ["尺寸规格", ["尺寸", "尺码", "规格", "大小", "偏小", "偏大"]],
    ["描述不符", ["描述", "页面", "图片", "色差", "夸张", "不符"]],
    ["耐用度", ["耐用", "开线", "坏了", "起球", "掉色", "开裂", "断了"]],
    ["质量做工", ["质量", "做工", "异味", "污渍", "掉毛", "粗糙"]],
    ["使用体验", ["不好用", "不舒服", "效果", "不凉", "体验"]]
  ];
  const hit = rules.find(([, words]) => words.some((word) => text.includes(word)));
  return hit?.[0] || "其他";
}

function inferSeverity(ratingType, text, painPoint) {
  const highWords = ["坏了", "破损", "开线", "客服差", "退款", "异味", "开裂", "断了"];
  if (ratingType === "差评" || highWords.some((word) => text.includes(word))) return "高";
  if (ratingType === "中评" || ["物流包装", "描述不符", "耐用度"].includes(painPoint)) return "中";
  return "低";
}

function reviewKey(review) {
  return [review.productId, review.reviewTime, review.content.slice(0, 60), review.sku].join("|");
}

function logScan(event, result) {
  state.scansLog = state.scansLog || [];
  state.scansLog.unshift({
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    event,
    result
  });
  state.scansLog = state.scansLog.slice(0, 30);
  saveState();
}

async function handleCsvImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const rows = parseCsv(text);
  state.importedReviews.push(...rows);
  logScan("导入 CSV", `已读取 ${rows.length} 条评价，下一次扫描将优先使用。`);
  saveState();
  renderAll();
  event.target.value = "";
}

function handleSnapshotImport() {
  const text = els.htmlSnapshot.value.trim();
  if (!text) return;
  const rows = extractRowsFromSnapshot(text);
  state.importedReviews.push(...rows);
  logScan("导入快照", `已从快照提取 ${rows.length} 条疑似负向评价。`);
  els.htmlSnapshot.value = "";
  saveState();
  renderAll();
}

function extractRowsFromSnapshot(text) {
  const clean = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\s+/g, " ");
  const sentences = clean
    .split(/[。！？!?]\s*/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);
  const negative = sentences.filter((sentence) =>
    state.settings.negativeKeywords.some((word) => sentence.includes(word))
  );
  return (negative.length ? negative : sentences.slice(0, 5)).slice(0, 20).map((content) => ({
    content,
    ratingType: inferRatingType(content, ""),
    reviewTime: new Date().toISOString().slice(0, 16).replace("T", " "),
    imageCount: 0
  }));
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (current || row.length) {
        row.push(current);
        rows.push(row);
        row = [];
        current = "";
      }
      if (char === "\r" && next === "\n") i += 1;
    } else {
      current += char;
    }
  }
  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }
  const [headers = [], ...body] = rows;
  return body
    .filter((line) => line.some(Boolean))
    .map((line) =>
      Object.fromEntries(headers.map((header, index) => [header.trim(), (line[index] || "").trim()]))
    );
}

function renderAll() {
  renderWatchlist();
  renderScan();
  renderFilters();
  renderVoc();
  renderReportSelect();
  renderReport();
  renderSettings();
  els.storageStatus.textContent = `${state.monitors.length} 个商品 / ${state.reviews.length} 条 VOC`;
}

function renderWatchlist() {
  if (!state.monitors.length) {
    els.monitorRows.innerHTML = `<tr class="empty-row"><td colspan="7">监控列表为空。先添加一个淘宝商品链接试试。</td></tr>`;
    return;
  }
  els.monitorRows.innerHTML = state.monitors
    .map(
      (monitor) => `
        <tr>
          <td>${escapeHtml(monitor.productId)}</td>
          <td><strong>${escapeHtml(monitor.label)}</strong><br><small>${escapeHtml(monitor.url)}</small></td>
          <td>${escapeHtml(monitor.shop)}</td>
          <td>${escapeHtml(monitor.category)}</td>
          <td>${escapeHtml(monitor.platform)}</td>
          <td>${monitor.enabled ? "启用" : "停用"}</td>
          <td>
            <div class="row-actions">
              <button class="link-button" data-toggle="${monitor.id}">${monitor.enabled ? "停用" : "启用"}</button>
              <button class="link-button" data-remove="${monitor.id}">删除</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  els.monitorRows.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => toggleMonitor(button.dataset.toggle));
  });
  els.monitorRows.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeMonitor(button.dataset.remove));
  });
}

function renderScan() {
  els.enabledCount.textContent = String(state.monitors.filter((monitor) => monitor.enabled).length);
  els.newCount.textContent = String(state.scans[0]?.newCount || 0);
  els.totalReviewCount.textContent = String(state.reviews.length);
  const rows = state.scansLog || [];
  els.scanLogRows.innerHTML = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.time)}</td>
              <td>${escapeHtml(row.event)}</td>
              <td>${escapeHtml(row.result)}</td>
            </tr>
          `
        )
        .join("")
    : `<tr class="empty-row"><td colspan="3">暂无扫描日志。</td></tr>`;
}

function renderFilters() {
  const productOptions = [`<option value="">全部</option>`].concat(
    state.monitors.map((monitor) => `<option value="${escapeAttr(monitor.productId)}">${escapeHtml(monitor.label)}</option>`)
  );
  els.filterProduct.innerHTML = productOptions.join("");
  const currentProduct = els.filterProduct.dataset.value || "";
  els.filterProduct.value = currentProduct;

  const painOptions = [`<option value="">全部</option>`].concat(
    state.settings.painPointCategories.map((category) => `<option value="${escapeAttr(category)}">${escapeHtml(category)}</option>`)
  );
  els.filterPainPoint.innerHTML = painOptions.join("");
}

function getFilteredReviews() {
  const product = els.filterProduct.value;
  const rating = els.filterRating.value;
  const painPoint = els.filterPainPoint.value;
  const status = els.filterStatus.value;
  const keyword = els.filterKeyword.value.trim();
  return state.reviews.filter((review) => {
    const haystack = `${review.content} ${review.followUp} ${review.sku} ${review.label}`;
    return (
      (!product || review.productId === product) &&
      (!rating || review.ratingType === rating) &&
      (!painPoint || review.painPoint === painPoint) &&
      (!status || review.status === status) &&
      (!keyword || haystack.includes(keyword))
    );
  });
}

function renderVoc() {
  const rows = getFilteredReviews();
  if (!rows.length) {
    els.vocRows.innerHTML = `<tr class="empty-row"><td colspan="14">暂无匹配 VOC。可以先进入“立即扫描”跑一遍。</td></tr>`;
    return;
  }

  els.vocRows.innerHTML = rows
    .map(
      (review) => `
        <tr>
          <td>${escapeHtml(review.crawlDate)}</td>
          <td>${escapeHtml(review.productId)}</td>
          <td><a href="${escapeAttr(review.productUrl)}" target="_blank" rel="noreferrer">${escapeHtml(review.label)}</a></td>
          <td>${escapeHtml(review.sku)}</td>
          <td>${escapeHtml(review.platform)}</td>
          <td>${escapeHtml(review.ratingType)}</td>
          <td>${escapeHtml(review.reviewTime)}</td>
          <td>${escapeHtml(review.content)}</td>
          <td>${escapeHtml(review.followUp || "-")}</td>
          <td>${review.imageCount}</td>
          <td>${escapeHtml(review.sentiment)}</td>
          <td>${escapeHtml(review.painPoint)}</td>
          <td class="${severityClass(review.severity)}">${escapeHtml(review.severity)}</td>
          <td>
            <select class="status-select" data-review-status="${review.id}">
              ${["待处理", "跟进中", "已解决"].map((item) => `<option value="${item}" ${review.status === item ? "selected" : ""}>${item}</option>`).join("")}
            </select>
          </td>
        </tr>
      `
    )
    .join("");

  els.vocRows.querySelectorAll("[data-review-status]").forEach((select) => {
    select.addEventListener("change", () => {
      state.reviews = state.reviews.map((review) =>
        review.id === select.dataset.reviewStatus ? { ...review, status: select.value } : review
      );
      saveState();
      renderReport();
    });
  });
}

function severityClass(severity) {
  return severity === "高" ? "severity-high" : severity === "中" ? "severity-mid" : "severity-low";
}

function renderReportSelect() {
  if (!state.scans.length) {
    els.reportScanSelect.innerHTML = `<option value="">暂无扫描</option>`;
    return;
  }
  els.reportScanSelect.innerHTML = state.scans
    .map((scan) => `<option value="${scan.id}">${escapeHtml(scan.time)} · 新增 ${scan.newCount} 条</option>`)
    .join("");
}

function renderReport() {
  const selectedId = els.reportScanSelect.value || state.scans[0]?.id;
  const scan = state.scans.find((item) => item.id === selectedId) || state.scans[0];
  if (!scan) {
    els.reportOutput.innerHTML = `<div class="report-block">暂无报告。请先执行一次扫描。</div>`;
    return;
  }
  const reviews = state.reviews.filter((review) => review.scanId === scan.id);
  const report = buildReport(scan, reviews);
  els.reportOutput.innerHTML = reportToHtml(report);
}

function buildReport(scan, reviews) {
  const painCounts = countBy(reviews, "painPoint");
  const severe = reviews.filter((review) => review.severity === "高");
  const topPainPoints = Object.entries(painCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const typical = reviews.slice(0, 6);
  return {
    scan,
    reviews,
    topPainPoints,
    severe,
    typical,
    improvements: buildImprovements(topPainPoints, severe),
    serviceTips: buildServiceTips(reviews)
  };
}

function buildImprovements(topPainPoints, severe) {
  const map = {
    质量做工: "复查原料、缝线、粘合和出厂质检标准，将易破损位置加入抽检清单。",
    尺寸规格: "统一页面尺码图、SKU 命名和实测尺寸，补充误差范围与适用场景。",
    描述不符: "更新主图、详情页和卖点描述，删除夸张表述，补充真实使用限制。",
    物流包装: "加固外包装与防压材料，针对高破损 SKU 调整发货检查流程。",
    客服售后: "设置差评优先响应话术和补偿边界，超时未回复自动升级给运营。",
    使用体验: "补充使用说明和适用条件，降低用户预期落差。",
    耐用度: "对高频损坏部位做材料替换或结构加强，并在详情页说明预期寿命。",
    其他: "对未归类评价人工复核，沉淀新的关键词和痛点分类。"
  };
  const selected = topPainPoints.map(([category]) => `${category}：${map[category] || map["其他"]}`);
  if (severe.length) {
    selected.unshift(`严重预警：${severe.length} 条高严重度评价需要优先联系用户并定位批次/物流/售后责任。`);
  }
  return selected.length ? selected : ["本次扫描暂无新增痛点。"];
}

function buildServiceTips(reviews) {
  const pending = reviews.filter((review) => review.status !== "已解决").length;
  const tips = [`优先处理 ${pending} 条未解决评价，按高严重度、追评、带图评价排序。`];
  if (reviews.some((review) => review.followUp)) tips.push("带追评用户通常仍在等待反馈，建议客服在 24 小时内二次跟进。");
  if (reviews.some((review) => review.painPoint === "物流包装")) tips.push("物流/包装问题可同步仓库复盘，记录破损图片和快递线路。");
  return tips;
}

function reportToHtml(report) {
  const total = report.reviews.length;
  const high = report.reviews.filter((review) => review.severity === "高").length;
  const pending = report.reviews.filter((review) => review.status !== "已解决").length;
  return `
    <section class="report-block">
      <h3>本次扫描概览</h3>
      <div class="summary-grid">
        <div class="summary-cell"><span>扫描时间</span><strong>${escapeHtml(report.scan.time)}</strong></div>
        <div class="summary-cell"><span>新增差评/VOC</span><strong>${total}</strong></div>
        <div class="summary-cell"><span>严重预警</span><strong>${high}</strong></div>
        <div class="summary-cell"><span>待处理</span><strong>${pending}</strong></div>
      </div>
    </section>
    <section class="report-block">
      <h3>高频痛点</h3>
      <ul>${(report.topPainPoints.length ? report.topPainPoints : [["暂无痛点", 0]]).map(([name, count]) => `<li>${escapeHtml(name)}：${count} 次</li>`).join("")}</ul>
    </section>
    <section class="report-block">
      <h3>严重预警</h3>
      <ul>${(report.severe.length ? report.severe : [{ label: "无", content: "本次没有高严重度评价。", painPoint: "-" }]).map((review) => `<li>${escapeHtml(review.label)} · ${escapeHtml(review.painPoint)}：${escapeHtml(review.content)}</li>`).join("")}</ul>
    </section>
    <section class="report-block">
      <h3>典型原文</h3>
      <ul>${(report.typical.length ? report.typical : [{ label: "无", content: "暂无原文。" }]).map((review) => `<li>${escapeHtml(review.label)}：${escapeHtml(review.content)}</li>`).join("")}</ul>
    </section>
    <section class="report-block">
      <h3>产品改进清单</h3>
      <ul>${report.improvements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
    <section class="report-block">
      <h3>客服/运营处理建议</h3>
      <ul>${report.serviceTips.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
  `;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {});
}

function renderSettings() {
  els.maxPages.value = state.settings.maxPages;
  els.maxProducts.value = state.settings.maxProducts;
  els.scanInterval.value = state.settings.scanInterval;
  els.negativeKeywords.value = state.settings.negativeKeywords.join("、");
  els.painPointCategories.value = state.settings.painPointCategories.join("、");
}

function saveSettings() {
  state.settings = {
    maxPages: Number(els.maxPages.value) || defaultSettings.maxPages,
    maxProducts: Number(els.maxProducts.value) || defaultSettings.maxProducts,
    scanInterval: Number(els.scanInterval.value) || defaultSettings.scanInterval,
    negativeKeywords: splitChineseList(els.negativeKeywords.value),
    painPointCategories: splitChineseList(els.painPointCategories.value)
  };
  saveState();
  renderAll();
}

function splitChineseList(value) {
  return value
    .split(/[、,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function regenerateLatestReport() {
  if (!state.scans.length) {
    logScan("报告生成失败", "暂无扫描批次。");
    renderAll();
    return;
  }
  logScan("重跑 AI 报告", "已基于最新 VOC 重新生成站内报告。");
  renderAll();
  activateTab("report");
}

function exportVoc() {
  const rows = getFilteredReviews();
  const headers = ["抓取日期", "商品ID", "商品链接", "商品标签", "SKU/规格", "平台", "评分/评价类型", "评价时间", "评价正文", "追评", "图片数", "情绪", "痛点分类", "严重度", "处理状态"];
  const data = rows.map((review) => [
    review.crawlDate,
    review.productId,
    review.productUrl,
    review.label,
    review.sku,
    review.platform,
    review.ratingType,
    review.reviewTime,
    review.content,
    review.followUp,
    review.imageCount,
    review.sentiment,
    review.painPoint,
    review.severity,
    review.status
  ]);
  downloadExcelLike("淘宝VOC明细.xls", headers, data);
}

function exportReportMarkdown() {
  const report = getCurrentReport();
  if (!report) return;
  const md = reportToMarkdown(report);
  downloadBlob("淘宝差评监控AI报告.md", md, "text/markdown;charset=utf-8");
}

function exportReportExcel() {
  const report = getCurrentReport();
  if (!report) return;
  const headers = ["模块", "内容"];
  const rows = [
    ["本次扫描概览", `时间：${report.scan.time}；新增：${report.reviews.length}；严重预警：${report.severe.length}`],
    ["高频痛点", report.topPainPoints.map(([name, count]) => `${name}: ${count}`).join("；")],
    ["严重预警", report.severe.map((review) => `${review.label}: ${review.content}`).join("；") || "无"],
    ["产品改进清单", report.improvements.join("；")],
    ["客服/运营处理建议", report.serviceTips.join("；")]
  ];
  downloadExcelLike("淘宝AI报告.xls", headers, rows);
}

function getCurrentReport() {
  const selectedId = els.reportScanSelect.value || state.scans[0]?.id;
  const scan = state.scans.find((item) => item.id === selectedId) || state.scans[0];
  if (!scan) return null;
  return buildReport(scan, state.reviews.filter((review) => review.scanId === scan.id));
}

function reportToMarkdown(report) {
  return [
    "# 淘宝差评监控 AI 报告",
    "",
    `- 扫描时间：${report.scan.time}`,
    `- 新增差评/VOC：${report.reviews.length}`,
    `- 严重预警：${report.severe.length}`,
    "",
    "## 高频痛点",
    ...report.topPainPoints.map(([name, count]) => `- ${name}：${count} 次`),
    "",
    "## 严重预警",
    ...(report.severe.length ? report.severe.map((review) => `- ${review.label}：${review.content}`) : ["- 无"]),
    "",
    "## 典型原文",
    ...report.typical.map((review) => `- ${review.label}：${review.content}`),
    "",
    "## 产品改进清单",
    ...report.improvements.map((item) => `- ${item}`),
    "",
    "## 客服/运营处理建议",
    ...report.serviceTips.map((item) => `- ${item}`)
  ].join("\n");
}

function downloadExcelLike(filename, headers, rows) {
  const html = `
    <html>
      <head><meta charset="UTF-8"></head>
      <body>
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </body>
    </html>
  `;
  downloadBlob(filename, html, "application/vnd.ms-excel;charset=utf-8");
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  state = {
    monitors: demoMonitors,
    reviews: [],
    scans: [],
    importedReviews: [],
    scansLog: [],
    settings: defaultSettings
  };
  saveState();
  renderAll();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

boot();
