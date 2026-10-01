/* ========== 中秋贺卡编辑器：单画布 + 自由添加元素 + 高清渲染 ========== */

var SCALE = 2; // 2 倍渲染，保证文字清晰

/* 画布比例与大小（默认 3:4，1.0 倍） */
var RATIOS = {
  '3:4':  [600, 800],
  '4:3':  [800, 600]
};
var CW = 600, CH = 800; // 画布逻辑尺寸（随比例/大小调整）

var canvas = document.getElementById('cardCanvas');
var ctx = canvas.getContext('2d');
canvas.width = CW * SCALE;
canvas.height = CH * SCALE;

/* 站点版本串：从 css/style.css 的 ?v= 读出，用于给「回退素材路径」自动补版本串，
   避免 CDN 继续发旧图；读不到时退化为裸路径（file:// 下同样安全）。
   这样以后升级版本号时，这里无需再手动改。 */
var SITE_V = (function () {
  var l = document.querySelector('link[rel="stylesheet"][href*="?v="]');
  var m = l && /[?&]v=([^&"'#\s]+)/.exec(l.getAttribute('href') || '');
  return m ? decodeURIComponent(m[1]) : '';
})();
function assetURL(p) { return SITE_V ? (p + '?v=' + SITE_V) : p; }

/* 玉兔图片素材（AI 抠图，透明背景；与月饼一样放在 assets/picture/） */
var rabbitImg = new Image();
var rabbitReady = false;
rabbitImg.onload = function () { rabbitReady = true; redraw(); };
/* 优先用内嵌的 data URI（js/rabbit-data.js）：file:// 下加载本地图片会「污染」canvas，
   使「生成 PNG 贺卡」抛 SecurityError；没有该文件时回退到原始素材路径 */
rabbitImg.src = (typeof RABBIT_DATA_URI === 'string' && RABBIT_DATA_URI)
  ? RABBIT_DATA_URI : assetURL('assets/picture/rabbit-cut.png');
function rabbitAR() { return rabbitReady ? (rabbitImg.height / rabbitImg.width) : 1.6; }

/* 月饼图片素材：与作者信息页用的是同一张去白底图（assets/picture/mooncake-cut.png）。
   同样优先走内嵌 data URI，避免 file:// 下污染 canvas 导致导出 PNG 失败 */
var mooncakeImg = new Image();
var mooncakeReady = false;
mooncakeImg.onload = function () { mooncakeReady = true; redraw(); };
mooncakeImg.src = (typeof MOONCAKE_DATA_URI === 'string' && MOONCAKE_DATA_URI)
  ? MOONCAKE_DATA_URI : assetURL('assets/picture/mooncake-cut.png');
function mooncakeAR() { return mooncakeReady ? (mooncakeImg.height / mooncakeImg.width) : 1.0964; }

/* ---------- 基础绘制 ---------- */

function drawStars(c, e) {
  var rnd = mulberry(e.seed || 7);
  c.save();
  for (var i = 0; i < (e.count || 70); i++) {
    var x = rnd() * CW, y = rnd() * (e.maxY || 520);
    c.globalAlpha = 0.25 + rnd() * 0.65;
    c.fillStyle = '#fdf6e0';
    c.beginPath();
    c.arc(x, y, 0.6 + rnd() * 1.3, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawMoon(c, e) {
  var r = e.size;
  c.save();
  var glow = c.createRadialGradient(e.x, e.y, r * 0.6, e.x, e.y, r * 2.2);
  glow.addColorStop(0, 'rgba(243,227,179,0.35)');
  glow.addColorStop(1, 'rgba(243,227,179,0)');
  c.fillStyle = glow;
  c.beginPath(); c.arc(e.x, e.y, r * 2.2, 0, Math.PI * 2); c.fill();

  var g = c.createRadialGradient(e.x - r * 0.3, e.y - r * 0.3, r * 0.1, e.x, e.y, r);
  g.addColorStop(0, '#fdf6e0');
  g.addColorStop(0.55, '#f3e3b3');
  g.addColorStop(1, e.color || '#e0c07c');
  c.fillStyle = g;
  c.beginPath(); c.arc(e.x, e.y, r, 0, Math.PI * 2); c.fill();

  c.globalAlpha = 0.16;
  c.fillStyle = '#a8863c';
  c.beginPath(); c.arc(e.x + r * 0.28, e.y + r * 0.18, r * 0.16, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(e.x - r * 0.22, e.y + r * 0.34, r * 0.1, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(e.x + r * 0.1, e.y - r * 0.38, r * 0.08, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawHills(c, e) {
  c.save();
  c.fillStyle = e.color || '#0b1322';
  c.beginPath();
  c.moveTo(0, e.y);
  var amp = e.size || 60;
  c.bezierCurveTo(CW * 0.18, e.y - amp, CW * 0.3, e.y - amp * 0.4, CW * 0.45, e.y - amp * 0.7);
  c.bezierCurveTo(CW * 0.6, e.y - amp * 1.1, CW * 0.72, e.y - amp * 0.3, CW * 0.85, e.y - amp * 0.8);
  c.bezierCurveTo(CW * 0.94, e.y - amp, CW, e.y - amp * 0.5, CW, e.y - amp * 0.6);
  c.lineTo(CW, CH);
  c.lineTo(0, CH);
  c.closePath();
  c.fill();
  c.restore();
}

/* 玉兔（AI 抠图素材，唯美插画兔） */
function drawRabbit(c, e) {
  if (!rabbitReady) return;
  var w = 200 * e.size;
  var h = w * rabbitAR();
  c.save();
  c.drawImage(rabbitImg, e.x - w / 2, e.y - h / 2, w, h);
  c.restore();
}

/* 孔明灯（天灯） */
function drawSkyLantern(c, e) {
  c.save();
  c.translate(e.x, e.y);
  c.scale(e.size, e.size);
  var glow = c.createRadialGradient(0, 4, 2, 0, 4, 44);
  glow.addColorStop(0, 'rgba(255,196,110,0.55)');
  glow.addColorStop(1, 'rgba(255,196,110,0)');
  c.fillStyle = glow;
  c.beginPath(); c.arc(0, 4, 44, 0, Math.PI * 2); c.fill();

  var g = c.createLinearGradient(0, -26, 0, 16);
  g.addColorStop(0, '#fcdf9c');
  g.addColorStop(0.65, e.color || '#f0a858');
  g.addColorStop(1, '#ce743a');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-14, 12);
  c.bezierCurveTo(-21, -2, -15, -23, 0, -26);
  c.bezierCurveTo(15, -23, 21, -2, 14, 12);
  c.closePath();
  c.fill();

  c.strokeStyle = 'rgba(190,120,60,0.35)';
  c.lineWidth = 1;
  [-7, 0, 7].forEach(function (dx) {
    c.beginPath();
    c.moveTo(dx * 1.6, 11);
    c.quadraticCurveTo(dx, -8, dx * 0.6, -22);
    c.stroke();
  });
  c.fillStyle = 'rgba(110,52,24,0.85)';
  c.beginPath(); c.ellipse(0, 12, 14, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,232,168,0.95)';
  c.beginPath(); c.ellipse(0, 11, 5.5, 2.8, 0, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawBranch(c, e) {
  c.save();
  c.translate(e.x, e.y);
  c.scale(e.size, e.size);
  c.strokeStyle = '#4a3423';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(70, 18, 130, 66);
  c.stroke();
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(60, 14);
  c.quadraticCurveTo(96, 6, 118, -14);
  c.stroke();
  c.fillStyle = '#2e4632';
  [[34, 8, 0.5], [70, 22, -0.4], [98, 42, 0.3], [112, -6, -0.8], [122, 58, 0.6]].forEach(function (p) {
    c.save();
    c.translate(p[0], p[1]);
    c.rotate(p[2]);
    c.beginPath();
    c.ellipse(10, 0, 12, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  });
  c.fillStyle = e.color || '#e8c877';
  [[48, 16], [86, 34], [110, 10], [118, 52], [64, 4]].forEach(function (p) {
    for (var i = 0; i < 5; i++) {
      var ang = i / 5 * Math.PI * 2;
      c.beginPath();
      c.arc(p[0] + Math.cos(ang) * 5, p[1] + Math.sin(ang) * 5, 3, 0, Math.PI * 2);
      c.fill();
    }
  });
  c.restore();
}

/* 月饼 */
/* 月饼：直接用作者信息页那张去白底图（图片元素，不再矢量绘制） */
function drawMooncake(c, e) {
  if (!mooncakeReady) return;
  var w = 104 * e.size;
  var h = w * mooncakeAR();
  c.save();
  c.drawImage(mooncakeImg, e.x - w / 2, e.y - h / 2, w, h);
  c.restore();
}

var FONT_STACK = 'Georgia, "STZhongsong", "SimSun", serif';

/* 单行/多行文字（标题、落款）；设了 boxW 就按框宽自动换行，未设则沿用原来的自由排版 */
function textLinesOf(c, e) {
  if (!e.boxW) return (e.text || '').split('\n');
  c.save();
  c.font = (e.bold ? '600 ' : '') + e.size + 'px ' + FONT_STACK;
  var lines = wrapLines(c, e.text, e.boxW, e.spacing);
  c.restore();
  return lines;
}

function drawTextEl(c, e) {
  c.save();
  c.fillStyle = e.color || '#e8c877';
  c.textBaseline = 'middle';
  var lines = textLinesOf(c, e);
  var lh = e.size * 1.6;
  var y0 = e.y - (lines.length - 1) * lh / 2;
  var align = e.align || 'center';
  for (var i = 0; i < lines.length; i++) {
    c.font = (e.bold ? '600 ' : '') + e.size + 'px ' + FONT_STACK;
    drawSpacedText(c, lines[i], e, align, y0 + i * lh);
  }
  c.restore();
}

/* 按对齐方式绘制一行（带字距时逐字绘制），锚点为 e.x：
   center→以 e.x 居中；right→右端对齐 e.x；left→左端对齐 e.x */
function drawSpacedText(c, text, e, align, y) {
  var chs = text.split(''), i;
  if (e.spacing) {
    var widths = [], total = 0;
    for (i = 0; i < chs.length; i++) {
      var w = c.measureText(chs[i]).width;
      widths.push(w);
      total += w + e.spacing;
    }
    total -= e.spacing;
    var x = align === 'right' ? e.x - total : (align === 'left' ? e.x : e.x - total / 2);
    c.textAlign = 'left';
    for (i = 0; i < chs.length; i++) {
      c.fillText(chs[i], x, y);
      x += widths[i] + e.spacing;
    }
    return;
  }
  c.textAlign = align;
  c.fillText(text, e.x, y);
}

/* 自动换行。spacing 为字距（绘制时字距也算进行宽，否则换行点会对不上） */
function wrapLines(c, text, maxW, spacing) {
  var sp = spacing || 0;
  var lines = [];
  (text || '').split('\n').forEach(function (para) {
    if (!para) { lines.push(''); return; }
    var cur = '';
    for (var i = 0; i < para.length; i++) {
      var ch = para[i];
      if (cur && c.measureText(cur + ch).width + sp * cur.length > maxW) {
        lines.push(cur);
        cur = ch;
      } else {
        cur += ch;
      }
    }
    lines.push(cur);
  });
  return lines;
}

/* 文本框高度：优先用显式 boxH（用户拖动上下边设定），未设定时按文字行数自适应。
   这样默认行为与旧版完全一致，用户一旦拖动上下边就由用户接管高度。 */
function autoBoxH(c, e) {
  c.save();
  /* 字重与字距都要参与测量，否则换行点/行数与实际绘制对不上 */
  c.font = (e.bold ? '600 ' : '') + e.size + 'px ' + FONT_STACK;
  var lines = wrapLines(c, e.text, e.boxW, e.spacing);
  c.restore();
  return lines.length * e.size * 1.7;
}
function boxHOf(c, e) {
  return e.boxH > 0 ? e.boxH : autoBoxH(c, e);
}

/* 可移动文本框：自动换行，文字从框顶部往下排。
   e.x / e.y 是「框中心」；`align`（left 默认 / center / right）控制行在框内如何对齐，
   `spacing` 是字距、`bold` 是加粗 —— 都是可选字段，不设时行为和最早的左对齐文本框完全一致。
   标题与落款也是本类型（align=center / right），靠这三个可选字段保持原来的外观。 */
function drawTextBox(c, e) {
  c.save();
  c.fillStyle = e.color || '#e8d9b0';
  c.font = (e.bold ? '600 ' : '') + e.size + 'px ' + FONT_STACK;
  c.textAlign = 'left';
  c.textBaseline = 'top';
  var lines = wrapLines(c, e.text, e.boxW, e.spacing);
  var lh = e.size * 1.7;
  var left = e.x - e.boxW / 2;
  var top = e.y - boxHOf(c, e) / 2;
  var align = e.align || 'left';
  var sp = e.spacing || 0;
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i], k;
    if (sp) {
      /* 带字距：逐字绘制（行宽含字距），行首按 align 落在框内 */
      var ws = [], total = 0;
      for (k = 0; k < ln.length; k++) {
        var w = c.measureText(ln[k]).width;
        ws.push(w); total += w + sp;
      }
      if (total) total -= sp;
      var sx = align === 'right' ? left + e.boxW - total
             : (align === 'center' ? left + (e.boxW - total) / 2 : left);
      for (k = 0; k < ln.length; k++) {
        c.fillText(ln[k], sx, top + i * lh);
        sx += ws[k] + sp;
      }
    } else {
      var tw = c.measureText(ln).width;
      var tx = align === 'right' ? left + e.boxW - tw
             : (align === 'center' ? left + (e.boxW - tw) / 2 : left);
      c.fillText(ln, tx, top + i * lh);
    }
  }
  c.restore();
}

/* ---------- 伪随机 ---------- */
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- 背景 ---------- */
function drawBackground(c) {
  var g = c.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, '#0a1120');
  g.addColorStop(0.55, '#101b33');
  g.addColorStop(1, '#182444');
  c.fillStyle = g;
  c.fillRect(0, 0, CW, CH);
}

/* ---------- 默认画布元素 ----------
   ⚠️ 「位置」按当前画布尺寸的比例换算，不能写死 600×800 的绝对坐标。
   否则在 4:3 横版（800×600）下点「重置」时，远山(y=660)、落款(y=736) 会落到
   画布下边界之外，看上去就像「重置后这些元素消失了」。
   ⚠️ 「尺寸」则相反——不乘任何系数：竖版与横版下初始大小必须完全相等
   （月亮半径都是 90、标题字号都是 35…），切换比例时也不会被改动。
   布局：标题在顶部 → 月亮在正中央 → 祝福语落在山峦上（落款「中秋快乐」上方一点）。
   ⚠️ 数组顺序 = 创建时间顺序 = 「元素列表」顺序，同时也是绘制层级（后面的盖住前面的）。
   因此默认元素固定为：满天星 → 远山 → 月亮 → 标题 → 祝福语 → 落款
   （月亮排在第三位，列表前两位才是满天星、远山；月亮在画布中心，与远山并不重叠）。
   列表成员：月亮 deletable（能删，也能从「添加元素」再加回来）；
   满天星/远山 listable（出现在列表里可点选，但不给删除按钮——删了没有入口再加回来）。 */
function defaultElements() {
  var ky = CH / 800;   // 纵向「位置」系数（相对 3:4 基准高度 800）
  var kx = CW / 600;   // 横向「位置」系数（相对 3:4 基准宽度 600）
  /* ⚠️ size / boxW 这类「尺寸」刻意不乘 ky、kx：
     竖版与横版下同一元素的初始大小必须完全相等（月亮半径都是 90），
     且切换比例时不改变。乘系数的只有「位置」。 */
  var TW = 300;        // 标题/落款的初始框宽
  /* 标题与落款也是 `textbox`（因此和普通文本框一样不能旋转）：
     - e.x 是「框中心」→ 标题居中不变；落款要右对齐，故 e.x 左移半个框宽，右端仍落在距右缘 52px 处
     - textbox 的文字基线是 top、以框中心为垂直中心，比旧的 text 绘制低约 0.35×字号 → y 补回来 */
  return [
    { type: 'stars', label: '满天星', count: 80, maxY: Math.round(CH * 0.70), seed: 11, visible: true, listable: true },
    { type: 'hills', label: '远山', x: Math.round(CW / 2), y: Math.round(CH * 0.825), size: 70, color: '#0b1322', visible: true, listable: true },
    { type: 'moon', label: '月亮', x: Math.round(CW / 2), y: Math.round(CH * 0.5), size: 90, color: '#e0c07c', visible: true, deletable: true },
    { type: 'textbox', label: '标题', x: Math.round(CW / 2), y: Math.round(CH * 0.1125 + 35 * 0.35), size: 35, boxW: TW, color: '#e8c877', text: '花好月圆', bold: true, spacing: 12, align: 'center', visible: true },
    { type: 'textbox', label: '祝福语', x: Math.round(CW / 2), y: Math.round(CH * 0.845), size: 25, boxW: 420, color: '#e8d9b0', text: '但愿人长久，千里共婵娟', visible: true },
    { type: 'textbox', label: '落款', x: Math.round(CW - 52 * kx - TW / 2), y: Math.round(CH * 0.92 + 20 * 0.35), size: 20, boxW: TW, color: '#9aa5bd', text: '—— 中秋快乐', align: 'right', spacing: 2, visible: true }
  ];
}

/* 可添加的元素原型 */
var PALETTE = {
  moon:       { type: 'moon',       base: '月亮',   size: 90,  color: '#e0c07c' },
  rabbit:     { type: 'rabbit',     base: '玉兔',   size: 1,   color: '#f7f2e7' },
  skylantern: { type: 'skylantern', base: '孔明灯', size: 1.2, color: '#f0a858' },
  branch:     { type: 'branch',     base: '桂枝',   size: 1.2, color: '#e8c877' },
  mooncake:   { type: 'mooncake',   base: '月饼',   size: 1,   color: '#b4833c' },
  textbox:    { type: 'textbox',    base: '文本框', size: 25,  color: '#e8d9b0', boxW: 300, text: '请输入文字' }
};

var DRAWERS = {
  stars: drawStars, moon: drawMoon, hills: drawHills,
  rabbit: drawRabbit, skylantern: drawSkyLantern,
  branch: drawBranch, mooncake: drawMooncake,
  text: drawTextEl, textbox: drawTextBox
};

/* 镜像轴的水平位置：默认是元素锚点 e.x（图形本来就关于它对称）；
   桂枝（branch）的图形是从 e.x 向右延伸 140×size、锚点在最左端，
   若也绕 e.x 翻转，整枝会翻到选框外面去（看起来像「绕选框边线镜像」），
   所以让它绕图形自身的水平中心（e.x + 70×size）翻转，镜像后仍在选框内。 */
function flipAxisX(e) {
  return e.type === 'branch' ? e.x + 70 * e.size : e.x;
}

/* 旋转中心 = 虚线选框的正中心（boundsOf 的中心）。
   ⚠️ 多数元素的包围盒本来就以 (e.x, e.y) 为中心，但并非全部：
   - 桂枝：图形从 e.x 向右延伸、锚点在最左端，框中心是 (e.x + 70×size, e.y + 24×size)
   - 孔明灯：包围盒向上多出 4×size，框中心比 e.y 高 4×size
   旋转必须绕「框中心」，否则拖角旋转时元素会绕着框外某个点打转（桂枝最明显）。
   镜像轴 flipAxisX 也始终穿过框中心，所以镜像不会让框位移，与绕框中心旋转自洽。 */
function pivotOf(e) {
  var b = boundsOf(ctx, e);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/* 锚点 → 框中心 的单位 size 偏移量（与 boundsOf 完全对应）。
   拖角时用它把「框中心」钉在拖拽起始位置：锚点 = 框中心 − 偏移×size。 */
var PIVOT_OFFSET = { branch: { x: 70, y: 24 }, skylantern: { x: 0, y: -4 } };
function anchorToPivot(e) {
  return PIVOT_OFFSET[e.type] || { x: 0, y: 0 };
}

/* 统一绘制：应用旋转（rotation）与左右镜像（flip） */
function drawElement(c, e) {
  var d = DRAWERS[e.type];
  if (!d) return;
  if (!e.rotation && !e.flip) { d(c, e); return; }
  var mx = flipAxisX(e);
  var pv = pivotOf(e);                // 旋转绕虚线框正中心
  c.save();
  c.translate(pv.x, pv.y);
  if (e.rotation) c.rotate(e.rotation);
  c.translate(-pv.x, -pv.y);
  if (e.flip) {                       // 镜像绕 mx（mx === e.x 时与旧实现完全等价）
    c.translate(mx, e.y);
    c.scale(-1, 1);
    c.translate(-mx, -e.y);
  }
  d(c, e);
  c.restore();
}

/* 元素尺寸调节范围 */
var SIZE_RANGE = {
  moon: [40, 220], rabbit: [0.4, 2.4], skylantern: [0.4, 2.4],
  branch: [0.5, 2.2], hills: [20, 140], mooncake: [0.4, 2.2],
  text: [12, 72], textbox: [14, 48]
};
var BOXW_RANGE = [160, 540];

/* ---------- 编辑器状态 ---------- */
var state = { elements: [], selected: -1, ratio: '3:4' };
var addCounter = {};
/* 绘制层级：数组顺序 = 创建顺序（＝元素列表顺序），另用元素上的 `z` 决定谁盖住谁，
   这样「在列表里选中某元素时把它提到最上层」不会打乱列表顺序。
   铺底的满天星/远山不参与置顶（永远压在下面）。 */
var zTop = 1;
var BACKGROUND_TYPES = ['stars', 'hills'];   // 铺底元素，不置顶

function syncZ() {
  state.elements.forEach(function (e, i) { if (typeof e.z !== 'number') e.z = i; });
  var mx = 0;
  state.elements.forEach(function (e) { if (e.z > mx) mx = e.z; });
  zTop = mx + 1;
}
/* 按 z 升序返回绘制顺序（不可原地改 state.elements，数组顺序要留给元素列表） */
function drawOrder() {
  return state.elements.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); });
}

/* ---------- 画布规格：严格按长宽比例渲染 ---------- */
function applyCanvasSize() {
  canvas.width = CW * SCALE;
  canvas.height = CH * SCALE;
  updateDisplaySize();
}

/* 统一长边上限，使竖版/横版显示面积相等 */
function updateDisplaySize() {
  canvas.style.aspectRatio = CW + ' / ' + CH;
  var col = document.querySelector('.editor-col-canvas');
  var colW = col ? col.clientWidth : canvas.clientWidth;
  var maxH = window.innerHeight * 0.74;
  var L = Math.max(200, Math.min(colW, maxH));
  canvas.style.maxWidth = L + 'px';
  canvas.style.maxHeight = L + 'px';
}

function updateSizeLabel() {
  document.getElementById('sizeVal').textContent = CW + ' × ' + CH;
}

function resizeCard(ratio) {
  var dims = RATIOS[ratio] || RATIOS['3:4'];
  var nw = dims[0], nh = dims[1];
  var fx = nw / CW, fy = nh / CH;
  /* 切比例：只迁移「位置」（保持元素在画布中的相对位置），
     元素尺寸（size / boxW / boxH）与文本框字号**一律不变**。
     满天星的 maxY 是铺底范围，跟随高度走。 */
  state.elements.forEach(function (e) {
    if (e.x !== undefined) e.x = Math.round(e.x * fx);
    if (e.y !== undefined) e.y = Math.round(e.y * fy);
    if (e.maxY) e.maxY = Math.round(e.maxY * fy);
  });
  CW = nw;
  CH = nh;
  state.ratio = ratio;
  applyCanvasSize();
  updateSizeLabel();
  renderElList();
  redraw();
}

/* ---------- 画布内容持久化（离开页面后再回来不丢失） ---------- */
var STORE_KEY = 'ma_card_state';
var persistTimer = null;

function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(function () {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        v: 2,
        ratio: state.ratio,
        elements: state.elements
      }));
    } catch (err) { /* ignore */ }
  }, 250);
}

/* 兼容修复：旧版「重置」在非 3:4 画布下会写入越界坐标（远山/落款跑到画布下方，
   看起来像凭空消失）；若之后又切回 3:4，坐标还会被再次放大、继续留在画布外。
   这里按元素身份把它搬回「该在的位置」：
   - 只处理默认元素（用 `added` 标记区分「＋添加元素」加出来的，后者不动）
   - 只有明显不在画布内（y<0 或 y>CH）才纠正，避免打断用户正常的摆放
   - 纵向位置直接取规范比例，因此无论怎么被缩放坏都能一次修好 */
var DEFAULT_Y = { '满天星': 0.70, '月亮': 0.5, '远山': 0.825, '标题': 0.1125, '祝福语': 0.845, '落款': 0.92 };

function healOutOfBounds() {
  state.elements.forEach(function (e) {
    if (e.added) return;   // 「添加元素」加出来的不动
    var frac = DEFAULT_Y[e.label];
    if (frac === undefined) return;
    if (e.type === 'stars') {
      if (e.maxY === undefined || e.maxY > CH) e.maxY = Math.round(CH * frac);
      return;
    }
    if (e.y !== undefined && (e.y > CH || e.y < 0)) {
      /* textbox 的文字基线是 top，其「视觉中心」比 e.y 低 0.35×字号，回位时补上 */
      e.y = Math.round(CH * frac + (e.type === 'textbox' ? e.size * 0.35 : 0));
    }
  });
}

/* 列表顺序 = 创建时间顺序（即 state.elements 的顺序）。旧存档里的默认元素还是按
   旧的绘制层级排的（满天星→月亮→远山），这里按 defaultElements() 的顺序做一次稳定重排：
   - 默认元素（非 added）回到既定顺序 → 列表前两位是满天星、远山，月亮第三位
   - 用户「＋添加」的元素（added）保持原有先后，统一排在默认元素之后（层级也在最上） */
function normalizeOrder() {
  var ord = {};
  defaultElements().forEach(function (e, i) { ord[e.label] = i; });
  var defaults = [], added = [];
  state.elements.forEach(function (e) {
    if (!e.added && ord[e.label] !== undefined) defaults.push(e);
    else added.push(e);
  });
  defaults.sort(function (a, b) { return ord[a.label] - ord[b.label]; });
  state.elements = defaults.concat(added);
}

/* 迁移：标题/落款早年是 `text` 类型（那时可以旋转），现统一成不可旋转的 `textbox`。
   两种类型的锚点含义不同，这里一次性换算，保证外观与位置不变：
   - `text`：e.x 由 align 决定（center＝文字中心 / right＝文字右端），e.y 是文字垂直中心
   - `textbox`：e.x/e.y 是「框中心」，文字基线 top（比 text 的绘制低约 0.35×字号）
   所以右对齐的元素要把 e.x 左移半个框宽，纵向统一补 +0.35×字号。 */
var MIGRATE_TEXTBOX = { '标题': 'center', '落款': 'right' };

/* 单行文字宽度（含字距），用来给标题/落款定一个「装得下又不换行」的初始框宽 */
function textWidthOf(c, e) {
  c.save();
  c.font = (e.bold ? '600 ' : '') + e.size + 'px ' + FONT_STACK;
  var t = e.text || '';
  var w = c.measureText(t).width + (e.spacing || 0) * t.length;
  c.restore();
  return w;
}

function migrateTextBoxes() {
  state.elements.forEach(function (e) {
    if (e.type !== 'text' || !MIGRATE_TEXTBOX[e.label]) return;
    /* 用户拖过边就用他自己的框宽；否则取「默认框宽」与「文字宽 +40」的较大者，
       避免存档里字号被调大过、迁移后框装不下而换行（外观会变） */
    var boxW = e.boxW ||
      Math.max(Math.round(300 * (CW / 600)), Math.round(textWidthOf(ctx, e) + 40));
    e.type = 'textbox';
    e.boxW = boxW;
    e.align = MIGRATE_TEXTBOX[e.label];
    if (e.align === 'right') e.x = Math.round(e.x - boxW / 2);
    e.y = Math.round(e.y + e.size * 0.35);
    e.rotation = 0;   // 文本框不可旋转，清掉历史残留
  });
}

function initCard() {
  var restored = false;
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      var arr = Array.isArray(data) ? data : (data && data.elements);
      if (Array.isArray(arr) && arr.length) {
        state.elements = arr;
        if (!Array.isArray(data) && data.ratio && RATIOS[data.ratio]) {
          state.ratio = data.ratio;
          var dims = RATIOS[state.ratio];
          CW = dims[0];
          CH = dims[1];
        }
        restored = true;
      }
    }
  } catch (err) { /* ignore */ }
  if (!restored) state.elements = defaultElements();
  normalizeOrder();
  migrateTextBoxes();
  syncAddCounter();
  healOutOfBounds();
  syncZ();   // 补齐绘制层级（旧存档没有 z 字段）
  /* 文本框禁止旋转：清掉历史存档里可能残留的旋转角 */
  state.elements.forEach(function (e) { if (e.type === 'textbox') e.rotation = 0; });
  state.selected = -1;
  applyCanvasSize();
  updateSizeLabel();
  // 恢复规格面板的选中态
  document.querySelectorAll('#ratioBar .tpl-btn').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-ratio') === state.ratio);
  });
  renderElList();
  syncQuickInputs();
  redraw();
}

/* 「添加元素」的编号：接着已有同类元素往下排，避免标签重复
   （例：默认中央已有一个月亮，再「＋月亮」就是「月亮·2」） */
function syncAddCounter() {
  Object.keys(PALETTE).forEach(function (key) {
    var max = 0;
    state.elements.forEach(function (e) {
      if (e.type !== PALETTE[key].type || !e.deletable) return;
      max++;
      var m = (e.label || '').match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    addCounter[key] = max;
  });
}

function resetCard() {
  state.elements = defaultElements();
  state.selected = -1;
  addCounter = {};
  syncAddCounter();
  syncZ();
  renderElList();
  syncQuickInputs();
  redraw();
}

function redraw() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  drawBackground(ctx);
  drawOrder().forEach(function (e) {
    if (!e.visible) return;
    drawElement(ctx, e);
  });
  if (state.selected >= 0) {
    var e = state.elements[state.selected];
    if (e && e.visible) {
      var b = boundsOf(ctx, e);
      ctx.save();
      /* 与 drawElement 同一变换，使虚线框与四角手柄跟随旋转/镜像 */
      var fmx = flipAxisX(e);
      var fpv = pivotOf(e);            // 与 drawElement 一致：旋转绕框中心
      ctx.translate(fpv.x, fpv.y);
      if (e.rotation) ctx.rotate(e.rotation);
      ctx.translate(-fpv.x, -fpv.y);
      if (e.flip) {
        ctx.translate(fmx, e.y);
        ctx.scale(-1, 1);
        ctx.translate(-fmx, -e.y);
      }
      ctx.strokeStyle = 'rgba(232,200,119,0.85)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.setLineDash([]);
      // 四角旋转手柄（文本框四角只缩放）
      if (HANDLE_TYPES.indexOf(e.type) >= 0) {
        handlePoints(b).forEach(function (p) {
          ctx.fillStyle = '#e8c877';
          ctx.strokeStyle = '#1a2332';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.rect(p.x - 4.5, p.y - 4.5, 9, 9);
          ctx.fill();
          ctx.stroke();
        });
      }
      // 文字类元素：四条边中点加手柄，拖动可改宽/高
      if (EDGE_TYPES.indexOf(e.type) >= 0) {
        edgePoints(b).forEach(function (p) {
          ctx.fillStyle = '#e8c877';
          ctx.strokeStyle = '#1a2332';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
      ctx.restore();
    }
  }
  persist();
}

/* 可四角缩放的元素类型 */
var HANDLE_TYPES = ['moon', 'rabbit', 'skylantern', 'branch', 'mooncake', 'text', 'textbox'];
/* 可拖四条边改宽高的元素类型（标题/落款也是文本框） */
var EDGE_TYPES = ['textbox', 'text'];

function handlePoints(b) {
  return [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x, y: b.y + b.h },
    { x: b.x + b.w, y: b.y + b.h }
  ];
}

/* 元素变换（与 drawElement 一致）：先关于镜像轴 flipAxisX 镜像，再绕框中心（pivotOf）旋转 */
function transformPoint(px, py, e, inverse) {
  var rot = e.rotation || 0, cs, sn, tx;
  var mx = flipAxisX(e);
  var pv = pivotOf(e);
  var dx = px - pv.x, dy = py - pv.y;
  if (inverse) {
    /* 逆变换：先反向旋转（绕框中心），再反向镜像（关于镜像轴） */
    if (rot) {
      cs = Math.cos(-rot); sn = Math.sin(-rot);
      tx = dx * cs - dy * sn;
      dy = dx * sn + dy * cs;
      dx = tx;
    }
    var qx = pv.x + dx;
    if (e.flip) qx = 2 * mx - qx;
    return { x: qx, y: pv.y + dy };
  }
  /* 正变换：先镜像（只翻水平方向），再旋转 */
  dx = (e.flip ? (2 * mx - px) : px) - pv.x;
  if (rot) {
    cs = Math.cos(rot); sn = Math.sin(rot);
    tx = dx * cs - dy * sn;
    dy = dx * sn + dy * cs;
    dx = tx;
  }
  return { x: pv.x + dx, y: pv.y + dy };
}

/* 旋转/镜像后的四角手柄位置 */
function handlePointsFor(e) {
  var pts = handlePoints(boundsOf(ctx, e));
  if (!e.rotation && !e.flip) return pts;
  return pts.map(function (p) { return transformPoint(p.x, p.y, e, false); });
}

/* 四条边的中点手柄：0=上 1=右 2=下 3=左（文本框用，拖动改宽/高） */
function edgePoints(b) {
  return [
    { x: b.x + b.w / 2, y: b.y },
    { x: b.x + b.w, y: b.y + b.h / 2 },
    { x: b.x + b.w / 2, y: b.y + b.h },
    { x: b.x, y: b.y + b.h / 2 }
  ];
}
function edgePointsFor(e) {
  var pts = edgePoints(boundsOf(ctx, e));
  if (!e.rotation && !e.flip) return pts;
  return pts.map(function (p) { return transformPoint(p.x, p.y, e, false); });
}

/* 仅反向旋转（不处理镜像）——四条边拖动专用。
   在「视觉方位」下计算，镜像后拖动的边依然跟随鼠标、固定的也是视觉上的对边。 */
function unrotatePoint(px, py, e) {
  var rot = e.rotation || 0;
  if (!rot) return { x: px, y: py };
  var pv = pivotOf(e);
  var dx = px - pv.x, dy = py - pv.y;
  var cs = Math.cos(-rot), sn = Math.sin(-rot);
  return { x: pv.x + dx * cs - dy * sn, y: pv.y + dx * sn + dy * cs };
}

/* 命中判定：把点反变换回元素本地坐标，再与未变换的包围盒比较 */
function elementHit(p, e) {
  var b = boundsOf(ctx, e);
  var lp = (e.rotation || e.flip) ? transformPoint(p.x, p.y, e, true) : p;
  return lp.x >= b.x && lp.x <= b.x + b.w && lp.y >= b.y && lp.y <= b.y + b.h;
}

function boundsOf(c, e) {
  switch (e.type) {
    case 'moon': return { x: e.x - e.size, y: e.y - e.size, w: e.size * 2, h: e.size * 2 };
    case 'rabbit': return { x: e.x - 100 * e.size, y: e.y - 100 * e.size * rabbitAR(), w: 200 * e.size, h: 200 * e.size * rabbitAR() };
    case 'skylantern': return { x: e.x - 30 * e.size, y: e.y - 34 * e.size, w: 60 * e.size, h: 60 * e.size };
    case 'mooncake': {
      /* 图片元素：宽 104×size，高按素材纵横比（比旧矢量图形略高） */
      var mh = 104 * e.size * mooncakeAR();
      return { x: e.x - 52 * e.size, y: e.y - mh / 2, w: 104 * e.size, h: mh };
    }
    case 'branch': return { x: e.x, y: e.y - 26 * e.size, w: 140 * e.size, h: 100 * e.size };
    case 'hills': return { x: 0, y: e.y - (e.size || 60) * 1.2, w: CW, h: CH - e.y + (e.size || 60) * 1.2 };
    case 'stars': return { x: 0, y: 0, w: CW, h: CH };
    case 'textbox': {
      var bh = boxHOf(c, e);
      return { x: e.x - e.boxW / 2 - 6, y: e.y - bh / 2 - 6, w: e.boxW + 12, h: bh + 12 };
    }
    case 'text': {
      c.save();
      c.font = (e.bold ? '600 ' : '') + e.size + 'px ' + FONT_STACK;
      var tlines = textLinesOf(c, e);
      var w = 0;
      tlines.forEach(function (ln) { w = Math.max(w, c.measureText(ln).width + (e.spacing || 0) * ln.length); });
      c.restore();
      if (e.boxW) w = e.boxW;                 // 拖过左右边：用显式框宽
      var th = e.boxH || tlines.length * e.size * 1.6;
      if (e.align === 'right') return { x: e.x - w - 6, y: e.y - th / 2 - 6, w: w + 12, h: th + 12 };
      if (e.align === 'left') return { x: e.x - 6, y: e.y - th / 2 - 6, w: w + 12, h: th + 12 };
      return { x: e.x - w / 2 - 6, y: e.y - th / 2 - 6, w: w + 12, h: th + 12 };
    }
    default: return { x: e.x - 20, y: e.y - 20, w: 40, h: 40 };
  }
}

/* ---------- 元素列表 ---------- */
function removeElement(idx) {
  state.elements.splice(idx, 1);
  if (state.selected === idx) state.selected = -1;
  else if (state.selected > idx) state.selected -= 1;
  renderElList();
  redraw();
}

function renderElList() {
  var list = document.getElementById('elList');
  list.innerHTML = '';
  /* 顺序 = 创建时间从早到晚，也就是 state.elements 的顺序（默认元素在前，用户添加的依次 push 在后）；
     绘制层级与列表顺序一致（后面的元素盖住前面的），所以这里不做任何重排 */
  state.elements.forEach(function (e, i) {
    /* 列表成员：deletable（可删）或 listable（只列表、不给删除按钮）；
       标题 / 祝福语 / 落款两个标记都没有，不进列表 */
    if (!e.deletable && !e.listable) return;
    var item = document.createElement('div');
    item.className = 'el-item' + (i === state.selected ? ' active' : '');
    var row = document.createElement('div');
    row.className = 'el-item-row';
    var name = document.createElement('span');
    name.textContent = e.label;   // 只显示名称，不再附加「（类型）」
    row.appendChild(name);
    if (e.deletable) {
      var del = document.createElement('button');
      del.className = 'el-del';
      del.textContent = '删除';
      del.onclick = function (ev) {
        ev.stopPropagation();
        removeElement(i);
      };
      row.appendChild(del);
    }
    item.appendChild(row);
    // 文本框：第二行「字体大小」滑杆（在上），第三行文字输入（在下）
    // （滑杆规格与「写下你的祝福」中的「祝福语」滑杆完全一致：14–48、步进 1，带「字体大小：xxpx」字样）
    if (e.type === 'textbox') {
      var sizeRow = document.createElement('div');
      sizeRow.className = 'el-item-size';
      var sizeVal = document.createElement('span');
      sizeVal.className = 'size-val';
      sizeVal.textContent = '字体大小：' + Math.round(e.size) + 'px';
      var rng = document.createElement('input');
      rng.type = 'range';
      rng.min = 14; rng.max = 48; rng.step = 1;
      rng.value = Math.round(e.size);
      rng.title = '文本框字体大小';
      rng.oninput = function () {
        /* 只改字号：先把当前框尺寸固化下来（boxW 已是显式值，未设高度时按当前行高固化），
           这样拖动滑杆时文本框的宽高保持不变 */
        if (!e.boxW) e.boxW = 300;
        if (!e.boxH) e.boxH = Math.round(boxHOf(ctx, e) * 10) / 10;
        e.size = parseFloat(rng.value);
        sizeVal.textContent = '字体大小：' + Math.round(e.size) + 'px';
        redraw();
      };
      rng.onclick = function (ev) { ev.stopPropagation(); };
      sizeRow.appendChild(sizeVal);
      sizeRow.appendChild(rng);
      item.appendChild(sizeRow);

      var edit = document.createElement('div');
      edit.className = 'el-item-edit';
      var txt = document.createElement('input');
      txt.type = 'text';
      txt.value = e.text;
      txt.oninput = function () { e.text = txt.value; redraw(); };
      txt.onclick = function (ev) { ev.stopPropagation(); };
      edit.appendChild(txt);
      item.appendChild(edit);
    }
    item.onclick = function () { selectEl(i); };
    list.appendChild(item);
  });
}

function selectEl(i) {
  state.selected = i;
  /* 选中即置顶：重叠时后画的盖住先画的，置顶后点击才能命中它。
     满天星/远山是铺底，不参与置顶（否则点一下画布空白处就把星空提到最上面）。 */
  if (i >= 0) {
    var e = state.elements[i];
    if (e && BACKGROUND_TYPES.indexOf(e.type) < 0) e.z = zTop++;
  }
  renderElList();
  redraw();
  var active = document.querySelector('#elList .el-item.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

/* ---------- 画布规格控件 ---------- */
document.querySelectorAll('#ratioBar [data-ratio]').forEach(function (btn) {
  btn.onclick = function () {
    document.querySelectorAll('#ratioBar .tpl-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    resizeCard(btn.getAttribute('data-ratio'));
  };
});

/* ---------- 添加元素 ---------- */
document.querySelectorAll('#paletteBar [data-add]').forEach(function (btn) {
  btn.onclick = function () {
    var key = btn.getAttribute('data-add');
    var proto = PALETTE[key];
    if (!proto) return;
    addCounter[key] = (addCounter[key] || 0) + 1;
    var n = addCounter[key];
    // 出生点随画布尺寸自适应，并按已添加总数错位，避免元素叠在一起
    var total = state.elements.filter(function (e) { return e.deletable; }).length;
    var el = {
      type: proto.type,
      label: proto.base + (n > 1 ? '·' + n : ''),
      x: Math.round(CW / 2 + ((total % 3) - 1) * CW * 0.16),
      y: Math.round(CH * 0.42 + (total % 2) * CH * 0.09),
      size: proto.size,
      color: proto.color,
      visible: true,
      deletable: true,
      added: true,  // 用户添加的（healOutOfBounds 不会去纠正它的坐标）
      z: zTop++     // 新加的元素放在最上层
    };
    // 复制原型额外字段（如文本框的 boxW、text）
    Object.keys(proto).forEach(function (k) {
      if (['type', 'base', 'size', 'color'].indexOf(k) < 0) el[k] = proto[k];
    });
    if (key === 'branch') el.flip = n % 2 === 0; // 第二根桂枝自动镜像
    state.elements.push(el);
    selectEl(state.elements.length - 1);
  };
});

/* ---------- 快速文字输入区（标题 / 祝福语 / 落款） ---------- */
function findTextEl() {
  var labels = Array.prototype.slice.call(arguments);
  for (var k = 0; k < labels.length; k++) {
    for (var i = 0; i < state.elements.length; i++) {
      var e = state.elements[i];
      if ((e.type === 'text' || e.type === 'textbox') && e.label === labels[k] && e.visible) return e;
    }
  }
  for (var m = 0; m < labels.length; m++) {
    for (var j = 0; j < state.elements.length; j++) {
      var e2 = state.elements[j];
      if ((e2.type === 'text' || e2.type === 'textbox') && e2.label === labels[m]) return e2;
    }
  }
  return null;
}

function syncQuickInputs() {
  var title = findTextEl('标题');
  var bless = findTextEl('祝福语');
  var sign = findTextEl('落款');
  if (title) {
    document.getElementById('quickTitle').value = title.text;
    document.getElementById('quickTitleSize').value = title.size;
    document.getElementById('quickTitleSizeVal').textContent = '字体大小：' + Math.round(title.size) + 'px';
  }
  if (bless) {
    document.getElementById('quickBless').value = bless.text;
    document.getElementById('quickBlessSize').value = bless.size;
    document.getElementById('quickBlessSizeVal').textContent = '字体大小：' + Math.round(bless.size) + 'px';
  }
  if (sign) {
    document.getElementById('quickSign').value = sign.text;
    document.getElementById('quickSignSize').value = sign.size;
    document.getElementById('quickSignSizeVal').textContent = '字体大小：' + Math.round(sign.size) + 'px';
  }
}

function bindQuickInput(id, finder) {
  document.getElementById(id).addEventListener('input', function () {
    var e = finder();
    if (!e) return;
    e.text = this.value;
    if (!e.visible) { e.visible = true; renderElList(); }
    redraw();
  });
}

bindQuickInput('quickTitle', function () { return findTextEl('标题'); });
bindQuickInput('quickBless', function () { return findTextEl('祝福语'); });
bindQuickInput('quickSign', function () { return findTextEl('落款'); });

function bindQuickSize(id, valId, finder) {
  document.getElementById(id).addEventListener('input', function () {
    var e = finder();
    if (!e) return;
    e.size = parseFloat(this.value);
    document.getElementById(valId).textContent = '字体大小：' + Math.round(this.value) + 'px';
    redraw();
  });
}
bindQuickSize('quickTitleSize', 'quickTitleSizeVal', function () { return findTextEl('标题'); });
bindQuickSize('quickBlessSize', 'quickBlessSizeVal', function () { return findTextEl('祝福语'); });
bindQuickSize('quickSignSize', 'quickSignSizeVal', function () { return findTextEl('落款'); });

(function () {
  var box = document.getElementById('quickPreset');
  BLESSINGS.forEach(function (b) {
    var chip = document.createElement('button');
    chip.className = 'preset-chip';
    chip.textContent = b;
    chip.onclick = function () {
      var e = findTextEl('祝福语');
      if (!e) return;
      e.text = b;
      if (!e.visible) { e.visible = true; renderElList(); }
      document.getElementById('quickBless').value = b;
      redraw();
    };
    box.appendChild(chip);
  });
  // 祝福语预设：点击展开 / 收起
  var tog = document.getElementById('presetToggle');
  var arrow = document.getElementById('presetArrow');
  tog.onclick = function () {
    var hidden = box.style.display === 'none';
    box.style.display = hidden ? '' : 'none';
    arrow.textContent = hidden ? '▾' : '▸';
  };
})();

/* ---------- 画布交互：点选 + 拖拽 ---------- */
function canvasPos(ev) {
  var rect = canvas.getBoundingClientRect();
  var cx = (ev.touches ? ev.touches[0].clientX : ev.clientX);
  var cy = (ev.touches ? ev.touches[0].clientY : ev.clientY);
  return {
    x: (cx - rect.left) * (CW / rect.width),
    y: (cy - rect.top) * (CH / rect.height)
  };
}

var dragging = false, dragOffset = { x: 0, y: 0 };
var rotating = false;
/* 四角拖动时的手柄基准 */
var rotBaseRadius = 1, rotStartSize = 1, rotStartBoxW = 0, rotStartBoxH = 0;
/* 拖角时冻结的「虚线框正中心」＝ 旋转与缩放的共同基准点，整个拖拽过程不动 */
var rotC0 = { x: 0, y: 0 }, rotAngle0 = 0;
/* 锚点 → 框中心 的单位 size 偏移（拖角时用来把框中心钉在 rotC0） */
var rotU = { x: 0, y: 0 };
/* 文本框四条边拖动改宽高：edgeWhich 0=上 1=右 2=下 3=左 */
var edgeResizing = false, edgeWhich = -1, edgeStart = null, edgeGrab = null;

function onDown(ev) {
  var p = canvasPos(ev);
  // 优先检测已选元素的四角手柄（跟随旋转后的实际位置）
  if (state.selected >= 0) {
    var se = state.elements[state.selected];
    if (se && se.visible && HANDLE_TYPES.indexOf(se.type) >= 0) {
      var pts = handlePointsFor(se);
      for (var h = 0; h < pts.length; h++) {
        if (Math.abs(p.x - pts[h].x) <= 10 && Math.abs(p.y - pts[h].y) <= 10) {
          var base = handlePoints(boundsOf(ctx, se))[h];
          var pv = pivotOf(se);
          /* 旋转与缩放的共同基准点＝拖角那一刻的虚线框正中心，整个拖拽过程冻结。
             ⚠️ 不能每帧重算：桂枝的框中心由 size 决定，若随 size 一起动，
             旋转/缩放会互相反馈，手感发飘。 */
          rotC0.x = pv.x; rotC0.y = pv.y;
          var u = anchorToPivot(se);
          rotU.x = u.x; rotU.y = u.y;
          /* 把「本地角」翻到视觉一侧：镜像轴是 flipAxisX(se)
             —— 桂枝是图形自身中心（e.x + 70×size），其余元素是 e.x。
             ⚠️ 不能一律写成 `lx = -lx`：那只有轴等于 e.x 时才成立，
             桂枝镜像后会算出错误的基准角，导致旋转方向乱掉。 */
          var vx = se.flip ? (2 * flipAxisX(se) - base.x) : base.x;
          var vy = base.y;
          /* 基准角/基准半径都相对「框中心」——角相对框中心转多少、离框中心多远 */
          rotAngle0 = Math.atan2(vy - pv.y, vx - pv.x);
          rotBaseRadius = Math.max(1, Math.hypot(vx - pv.x, vy - pv.y));
          rotStartSize = se.size;
          rotStartBoxW = se.boxW || 0;
          /* 文本框未显式设过高时，先把当前自适应高度固化，拖角才有稳定的缩放基准 */
          rotStartBoxH = se.boxH || (se.type === 'textbox' ? Math.round(boxHOf(ctx, se) * 10) / 10 : 0);
          rotating = true;
          ev.preventDefault();
          return;
        }
      }
    }
    // 文字/文本框：四条边中点手柄 → 拖动改宽/高（对边保持不动）
    if (se && se.visible && EDGE_TYPES.indexOf(se.type) >= 0) {
      var eps = edgePointsFor(se);
      for (var q = 0; q < eps.length; q++) {
        if (Math.abs(p.x - eps[q].x) <= 10 && Math.abs(p.y - eps[q].y) <= 10) {
          var lp0 = unrotatePoint(p.x, p.y, se);
          var eb = boundsOf(ctx, se), PAD = 6;   // bounds 含 ±6 余白，这里还原成真实框
          edgeResizing = true;
          /* 镜像后本地左/右边对应视觉上的右/左边，索引需互换 */
          edgeWhich = se.flip ? (q === 1 ? 3 : (q === 3 ? 1 : q)) : q;
          edgeGrab = { x: lp0.x, y: lp0.y };
          edgeStart = {
            x0: eb.x + PAD, x1: eb.x + eb.w - PAD,
            y0: eb.y + PAD, y1: eb.y + eb.h - PAD,
            /* 水平锚点：center 居中于 e.x / right 右端在 e.x / left 左端在 e.x */
            anchor: se.type === 'text' ? (se.align || 'center') : 'center'
          };
          ev.preventDefault();
          return;
        }
      }
    }
  }
  // 从上往下找（z 大的在上层，也就是后画的）
  var ord = drawOrder();
  for (var i = ord.length - 1; i >= 0; i--) {
    var e = ord[i];
    if (!e.visible) continue;
    if (elementHit(p, e)) {
      selectEl(state.elements.indexOf(e));
      if (e.type !== 'stars') {
        dragging = true;
        dragOffset.x = p.x - e.x;
        dragOffset.y = p.y - e.y;
      }
      ev.preventDefault();
      return;
    }
  }
  selectEl(-1);
}

function onMove(ev) {
  /* 文字类元素四条边拖动：被抓的那条边跟随鼠标，对边固定不动 */
  if (edgeResizing && state.selected >= 0) {
    var te = state.elements[state.selected];
    if (!te || EDGE_TYPES.indexOf(te.type) < 0) { edgeResizing = false; }
    else {
      var mp = canvasPos(ev);
      var lp = unrotatePoint(mp.x, mp.y, te);
      var ddx = lp.x - edgeGrab.x, ddy = lp.y - edgeGrab.y;
      var x0 = edgeStart.x0, x1 = edgeStart.x1, y0 = edgeStart.y0, y1 = edgeStart.y1;
      var MINW = 40, MINH = Math.max(24, te.size * 1.2);
      /* 水平锚点：center 时两边对称于 e.x；right 时右边固定为 e.x；left 时左边固定为 e.x */
      var anchorX = function (a0, a1) {
        return edgeStart.anchor === 'right' ? a1 : (edgeStart.anchor === 'left' ? a0 : (a0 + a1) / 2);
      };
      if (edgeWhich === 1) {          /* 右边：左边缘固定 */
        var nr1 = Math.max(x0 + MINW, x1 + ddx);
        te.boxW = Math.round((nr1 - x0) * 10) / 10;
        te.x = anchorX(x0, nr1);
      } else if (edgeWhich === 3) {   /* 左边：右边缘固定 */
        var nl0 = Math.min(x1 - MINW, x0 + ddx);
        te.boxW = Math.round((x1 - nl0) * 10) / 10;
        te.x = anchorX(nl0, x1);
      } else if (edgeWhich === 2) {   /* 下边：上边缘固定，接管高度 */
        var nb1 = Math.max(y0 + MINH, y1 + ddy);
        te.boxH = Math.round((nb1 - y0) * 10) / 10;
        te.y = (y0 + nb1) / 2;
      } else if (edgeWhich === 0) {   /* 上边：下边缘固定，接管高度 */
        var nt0 = Math.min(y1 - MINH, y0 + ddy);
        te.boxH = Math.round((y1 - nt0) * 10) / 10;
        te.y = (y1 + nt0) / 2;
      }
      redraw();
      ev.preventDefault();
      return;
    }
  }
  if (rotating && state.selected >= 0) {
    var re = state.elements[state.selected];
    var rp = canvasPos(ev);
    /* 一切都以「冻结的框中心」为基准：旋转绕它转，缩放是相对它的等比放缩。
       （锚点本身不是框中心的元素——桂枝、孔明灯——下面会把框中心钉回 rotC0） */
    var rdx = rp.x - rotC0.x, rdy = rp.y - rotC0.y;
    /* 旋转：让被抓的那个角指向鼠标 —— 文本框禁止旋转，只能缩放 */
    if (re.type === 'textbox') {
      re.rotation = 0;
    } else {
      var rot = Math.atan2(rdy, rdx) - rotAngle0;
      var PI2 = Math.PI * 2;
      rot = ((rot + Math.PI) % PI2 + PI2) % PI2 - Math.PI; // 归一到 (-π, π]
      re.rotation = rot;
    }
    /* 缩放：比例＝鼠标到框中心的距离 ÷ 起始的角到框中心距离。
       框中心被钉住不动，所以这就是「绕框中心等比放缩」，被抓的角始终贴住光标，
       且沿框中心的圆周拖动只旋转、不会顺带改变大小。 */
    var k = Math.hypot(rdx, rdy) / rotBaseRadius;
    if (isFinite(k) && k > 0.02) {
      if (re.type === 'textbox') {
        /* 文本框：拖角只缩放「框」的尺寸，字号保持不变（字号只由「字体大小」滑杆控制） */
        if (rotStartBoxW) re.boxW = Math.max(40, Math.round(rotStartBoxW * k * 10) / 10);
        if (rotStartBoxH) re.boxH = Math.max(24, Math.round(rotStartBoxH * k * 10) / 10);
      } else {
        var ns = Math.round(rotStartSize * k * 1000) / 1000;
        re.size = ns;
        if (re.type === 'text') {
          if (rotStartBoxW) re.boxW = Math.round(rotStartBoxW * k * 10) / 10;
          if (rotStartBoxH) re.boxH = Math.round(rotStartBoxH * k * 10) / 10;
        }
        /* 框中心钉在 rotC0：锚点 = 框中心 − 偏移×size。
           偏移为 0 的元素（月亮/玉兔/月饼/文本框）位置完全不变，与旧手感一致。 */
        if (rotU.x || rotU.y) {
          re.x = Math.round((rotC0.x - rotU.x * ns) * 10) / 10;
          re.y = Math.round((rotC0.y - rotU.y * ns) * 10) / 10;
        }
      }
    }
    redraw();
    ev.preventDefault();
    return;
  }
  if (!dragging || state.selected < 0) return;
  var e = state.elements[state.selected];
  var p = canvasPos(ev);
  e.x = Math.round(p.x - dragOffset.x);
  e.y = Math.round(p.y - dragOffset.y);
  redraw();
  ev.preventDefault();
}

function onUp() { dragging = false; rotating = false; edgeResizing = false; edgeWhich = -1; }

function hitTest(p) {
  var ord = drawOrder();                 // z 大的在上层，从上层往下找
  for (var i = ord.length - 1; i >= 0; i--) {
    var e = ord[i];
    if (!e.visible) continue;
    if (elementHit(p, e)) return state.elements.indexOf(e);
  }
  return -1;
}

canvas.addEventListener('mousedown', onDown);
canvas.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
canvas.addEventListener('touchend', onUp);
var ctxMenuEl = null;
function hideContextMenu() {
  if (ctxMenuEl) { ctxMenuEl.remove(); ctxMenuEl = null; }
}
function mirrorElement(idx) {
  var e = state.elements[idx];
  e.flip = !e.flip;
  redraw();
}
function showContextMenu(x, y, idx) {
  hideContextMenu();
  var menu = document.createElement('div');
  menu.className = 'ctx-menu';
  var mirrorBtn = document.createElement('button');
  mirrorBtn.className = 'ctx-item';
  mirrorBtn.textContent = '镜像';
  mirrorBtn.onclick = function () { mirrorElement(idx); hideContextMenu(); };
  var delBtn = document.createElement('button');
  delBtn.className = 'ctx-item';
  delBtn.textContent = '删除';
  delBtn.onclick = function () { removeElement(idx); hideContextMenu(); };
  menu.appendChild(mirrorBtn);
  menu.appendChild(delBtn);
  document.body.appendChild(menu);
  var left = Math.min(x, window.innerWidth - menu.offsetWidth - 8);
  var top = Math.min(y, window.innerHeight - menu.offsetHeight - 8);
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  ctxMenuEl = menu;
}
canvas.addEventListener('contextmenu', function (ev) {
  ev.preventDefault();
  var idx = hitTest(canvasPos(ev));
  /* 满天星/远山不可删，且包围盒覆盖整张画布 —— 右键空白处命中它们时不会弹菜单 */
  if (idx >= 0 && state.elements[idx].deletable) {
    showContextMenu(ev.clientX, ev.clientY, idx);
  } else if (idx < 0 && state.selected >= 0 && state.elements[state.selected].deletable) {
    showContextMenu(ev.clientX, ev.clientY, state.selected);
  }
});
document.addEventListener('mousedown', function (ev) {
  if (ctxMenuEl && !ctxMenuEl.contains(ev.target)) hideContextMenu();
});
canvas.addEventListener('dblclick', function (ev) {
  var idx = hitTest(canvasPos(ev));
  if (idx < 0) return;
  var e = state.elements[idx];
  if (e.type !== 'textbox') return;
  var val = prompt('请输入文字内容：', e.text);
  if (val === null) return;
  e.text = val;
  redraw();
  renderElList();
  syncQuickInputs();
});

/* ---------- PNG 导出（2 倍清晰度） ---------- */
function exportPNG() {
  var out = document.createElement('canvas');
  out.width = CW * SCALE;
  out.height = CH * SCALE;
  var oc = out.getContext('2d');
  oc.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  drawBackground(oc);
  drawOrder().forEach(function (e) {
    if (!e.visible) return;
    drawElement(oc, e);
  });
  var fail = function (err) {
    alert('生成 PNG 失败：' + (err && err.message ? err.message : err));
  };
  var save = function (href, revoke) {
    var a = document.createElement('a');
    a.download = '中秋贺卡.png';
    a.href = href;
    document.body.appendChild(a);   // 个别浏览器要求链接在文档里才会响应 click
    a.click();
    a.remove();
    if (revoke) setTimeout(function () { URL.revokeObjectURL(href); }, 3000);
  };
  try {
    /* 优先 toBlob：不受 data URL 长度限制（大画布下 data URL 可能超浏览器上限而静默失败） */
    if (out.toBlob) {
      out.toBlob(function (blob) {
        try {
          if (blob) save(URL.createObjectURL(blob), true);
          else save(out.toDataURL('image/png'));
        } catch (err) { fail(err); }
      }, 'image/png');
      return;
    }
    save(out.toDataURL('image/png'));
  } catch (err) {
    /* 画布被跨源图片「污染」时 toDataURL/toBlob 会抛 SecurityError，这里给出明确提示 */
    fail(err);
  }
}

document.getElementById('btnExport').onclick = exportPNG;
document.getElementById('btnReset').onclick = function () {
  try { localStorage.removeItem(STORE_KEY); } catch (err) { /* ignore */ }
  resetCard();   // 点即重置，不再弹确认框
};

/* ---------- 启动 ---------- */
window.addEventListener('resize', updateDisplaySize);
initCard();
