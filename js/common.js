/* ========== 共享背景动画：星空 + 飘升灯笼 + 飘落桂花 ========== */
(function () {
  var cv = document.createElement('canvas');
  cv.id = 'sky';
  document.body.prepend(cv);
  var ctx = cv.getContext('2d');

  var W, H, stars = [], lanterns = [], petals = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
    stars = [];
    // 网格 + 抖动，保证星星分布均匀
    var n = Math.min(320, Math.floor(W * H / 6500));
    var cols = Math.max(4, Math.round(Math.sqrt(n * W / (H * 0.9))));
    var rows = Math.max(3, Math.ceil(n / cols));
    var cw = W / cols, ch = (H * 0.9) / rows;
    for (var r = 0; r < rows; r++) {
      for (var cI = 0; cI < cols; cI++) {
        stars.push({
          x: cI * cw + cw * 0.5 + rand(-cw * 0.3, cw * 0.3),
          y: r * ch + ch * 0.5 + rand(-ch * 0.3, ch * 0.3),
          r: rand(0.5, 1.6),
          base: rand(0.25, 0.9),
          sp: rand(0.4, 1.4),
          ph: rand(0, Math.PI * 2)
        });
      }
    }
    lanterns = [];
    var ln = W > 760 ? 6 : 3;
    for (var j = 0; j < ln; j++) lanterns.push(newLantern(j, ln, true));
    petals = [];
    var pn = W > 760 ? 22 : 12;
    for (var k = 0; k < pn; k++) petals.push(newPetal(true));
  }

  function newLantern(slot, total, anyY) {
    // 每盏孔明灯分配一个水平区段，保证左右分布均匀
    var seg = W / total;
    return {
      x: slot * seg + seg * 0.5 + rand(-seg * 0.22, seg * 0.22),
      y: anyY ? rand(H * 0.3, H * 1.1) : H + 60,
      s: rand(0.5, 1.1),
      sp: rand(0.15, 0.4),
      sway: rand(0.4, 1.2),
      ph: rand(0, Math.PI * 2),
      a: rand(0.35, 0.8)
    };
  }

  function newPetal(anyY) {
    return {
      x: rand(0, W),
      y: anyY ? rand(0, H) : -12,
      s: rand(2.2, 4),
      vy: rand(0.35, 0.9),
      vx: rand(-0.25, 0.25),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.02, 0.02),
      a: rand(0.4, 0.85)
    };
  }

  function drawLantern(l, t) {
    var swayX = Math.sin(t * 0.001 * l.sway + l.ph) * 14;
    var x = l.x + swayX, y = l.y, s = l.s;
    ctx.save();
    ctx.globalAlpha = l.a;
    ctx.translate(x, y);
    ctx.scale(s, s);
    // 暖光晕
    var glow = ctx.createRadialGradient(0, 4, 2, 0, 4, 36);
    glow.addColorStop(0, 'rgba(255,196,110,0.5)');
    glow.addColorStop(1, 'rgba(255,196,110,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 4, 36, 0, Math.PI * 2); ctx.fill();
    // 孔明灯罩（钟形纸罩）
    var g = ctx.createLinearGradient(0, -26, 0, 16);
    g.addColorStop(0, 'rgba(252,222,152,0.96)');
    g.addColorStop(0.65, 'rgba(240,168,88,0.93)');
    g.addColorStop(1, 'rgba(206,116,58,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-14, 12);
    ctx.bezierCurveTo(-21, -2, -15, -23, 0, -26);
    ctx.bezierCurveTo(15, -23, 21, -2, 14, 12);
    ctx.closePath();
    ctx.fill();
    // 罩面褶皱纹理
    ctx.strokeStyle = 'rgba(190,120,60,0.35)';
    ctx.lineWidth = 1;
    [-7, 0, 7].forEach(function (dx) {
      ctx.beginPath();
      ctx.moveTo(dx * 1.6, 11);
      ctx.quadraticCurveTo(dx, -8, dx * 0.6, -22);
      ctx.stroke();
    });
    // 底部开口
    ctx.fillStyle = 'rgba(110,52,24,0.85)';
    ctx.beginPath(); ctx.ellipse(0, 12, 14, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    // 开口处火光
    ctx.fillStyle = 'rgba(255,232,168,0.95)';
    ctx.beginPath(); ctx.ellipse(0, 11, 5.5, 2.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPetal(p) {
    ctx.save();
    ctx.globalAlpha = p.a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = 'rgba(232,200,119,0.9)';
    // 四瓣小花
    for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -p.s * 0.62, p.s * 0.42, p.s * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(Math.PI / 2);
    }
    ctx.restore();
  }

  var last = 0;
  function loop(t) {
    ctx.clearRect(0, 0, W, H);
    // 星
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      var tw = st.base * (0.55 + 0.45 * Math.sin(t * 0.001 * st.sp + st.ph));
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#fdf6e0';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // 灯笼
    for (var j = 0; j < lanterns.length; j++) {
      var l = lanterns[j];
      l.y -= l.sp;
      if (l.y < -70) { lanterns[j] = newLantern(j, lanterns.length, false); continue; }
      drawLantern(l, t);
    }
    // 桂花
    for (var k = 0; k < petals.length; k++) {
      var p = petals[k];
      p.y += p.vy;
      p.x += p.vx + Math.sin(t * 0.001 + p.rot) * 0.2;
      p.rot += p.vr;
      if (p.y > H + 14) { petals[k] = newPetal(false); continue; }
      drawPetal(p);
    }
    last = t;
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();

/* ========== 站点版本号显示（作者信息页月饼右下角） ==========
   直接读 css/style.css 引用的 ?v= 值，保证「页面显示的版本号」与
   「实际加载的资源版本」永远一致 —— 升级版本串时不必再手动改 HTML，
   否则两处容易不一致，反而会让部署核对得出错误结论。 */
(function () {
  var el = document.querySelector('[data-site-version]');
  if (!el) return;
  var link = document.querySelector('link[rel="stylesheet"][href*="?v="]');
  if (!link) return;
  var m = /[?&]v=([^&"'#\s]+)/.exec(link.getAttribute('href') || '');
  if (m) el.textContent = '版本号：' + decodeURIComponent(m[1]);
})();

/* ========== 背景音乐（BGM）：导航栏按钮 + 停止 / 继续 ==========
   音频实例与「尽早开始加载」由 js/bgm-boot.js 在 <head> 里完成
   （这样跳页时的静音空档最短）；本模块只负责界面与用户意图：
   按钮外观、停止/继续、状态与进度持久化、被浏览器拦截后的首次交互兜底。
   若 bgm-boot.js 没加载到（例如某页漏了 script 标签），这里会兜底自建实例。 */
(function () {
  var SRC = 'assets/MP3/1282473302-1-96.mp3';   /* 兜底值，主来源在 bgm-boot.js */
  var VOLUME = 0.5;          /* 背景音量（0~1），bgm-boot.js 里也有同名常量，改音量请两处一起改 */
  var KEY = 'ma_bgm_state';  /* sessionStorage 键：仅本次浏览有效 */

  /* 读页面实际加载的版本串（与上面版本号显示同源） */
  function readVersion() {
    var link = document.querySelector('link[rel="stylesheet"][href*="?v="]');
    var m = link && /[?&]v=([^&"'#\s]+)/.exec(link.getAttribute('href') || '');
    return m ? decodeURIComponent(m[1]) : '';
  }

  /* 优先复用 <head> 里已经预热、可能已在加载或播放的实例 */
  var preheated = !!window.__maBgm;
  var audio = preheated ? window.__maBgm : new Audio();
  if (!preheated) {
    var ver = readVersion();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = VOLUME;
    audio.src = (window.__maBgmSrc || SRC) + (ver ? '?v=' + ver : '');
    window.__maBgm = audio;
  }

  /* 恢复本次会话的开关与进度（boot 已解析过就直接沿用，省一次解析） */
  var saved = window.__maBgmSaved;
  if (!saved) {
    saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  }

  var wantPlay = saved.off !== true;   /* 用户意图：默认播放 */
  var blocked = window.__maBgmBlocked === true;  /* 自动播放是否已被浏览器拦下 */
  var armed = false;                   /* 是否已挂上「首次交互就起播」的监听 */
  var lastSaved = saved.t || 0;        /* 最近写入的进度，给 timeupdate 节流用 */

  /* ---------- 按钮：插进导航栏，紧跟「作者信息」 ---------- */
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'bgmBtn';
  btn.className = 'bgm-btn';
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<g class="bgm-note" fill="none" stroke="currentColor" stroke-width="1.7" ' +
        'stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M9.6 18.4V6.2l8.8-1.9v12.1"/>' +
        '<ellipse cx="7" cy="18.4" rx="2.6" ry="2.2"/>' +
        '<ellipse cx="15.8" cy="16.4" rx="2.6" ry="2.2"/>' +
      '</g>' +
      '<path class="bgm-slash" d="M5.4 4.8 19 19.4" fill="none" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linecap="round"/>' +
    '</svg>';

  var nav = document.querySelector('.nav');
  var authorLink = nav && nav.querySelector('a[href^="author.html"]');
  if (authorLink) {
    authorLink.insertAdjacentElement('afterend', btn);   /* 桌面端在「作者信息」右侧，窄屏换行后落下一行 */
  } else {
    btn.classList.add('is-floating');                    /* 兜底：没有导航时仍固定在右下角 */
    document.body.appendChild(btn);
  }

  function sync() {
    btn.classList.toggle('is-off', !wantPlay);
    btn.title = wantPlay ? '背景音乐：播放中（点击停止）' : '背景音乐：已停止（点击继续）';
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('aria-pressed', wantPlay ? 'true' : 'false');
  }

  function saveState() {
    lastSaved = audio.currentTime || 0;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ off: !wantPlay, t: lastSaved }));
    } catch (e) { /* 隐私模式下写不了，忽略 */ }
  }

  /* 记住进度：站内跳页时下一张页面接着放，而不是从头开始。
     预热过（bgm-boot.js 已在 <head> 里跳好）就不必再跳一次。 */
  function restorePos() {
    if (!(saved.t > 0)) return;
    var seek = function () {
      try { audio.currentTime = saved.t; } catch (e) { /* 不支持跳转就从 0 播 */ }
      audio.removeEventListener('loadedmetadata', seek);
    };
    if (audio.readyState >= 1) seek();
    else audio.addEventListener('loadedmetadata', seek);
  }

  /* ---------- 起播 / 首次交互兜底 ---------- */
  function detachGesture() {
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (t) {
      document.removeEventListener(t, onGesture, OPTS);
    });
    armed = false;
  }
  function onGesture(e) {
    if (btn.contains(e.target)) return;  /* 点的是按钮本身，交给按钮逻辑 */
    detachGesture();
    play();
  }
  var OPTS = { capture: true, passive: true };

  function armGesture() {
    if (armed) return;
    armed = true;
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (t) {
      document.addEventListener(t, onGesture, OPTS);
    });
  }

  function play() {
    if (!wantPlay) return;
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () {
        /* 被浏览器拦截：等用户第一次交互 */
        blocked = true;
        armGesture();
      });
    }
  }

  audio.addEventListener('playing', function () { blocked = false; detachGesture(); });
  audio.addEventListener('pause', function () { if (wantPlay) saveState(); });

  /* 播放中持续记进度（每秒最多写一次）：万一 pagehide 没赶上，
     新页面也最多退回不到 1 秒，接续更顺 */
  audio.addEventListener('timeupdate', function () {
    if (!wantPlay || audio.paused) return;
    if (Math.abs((audio.currentTime || 0) - lastSaved) < 1) return;
    saveState();
  });

  /* ---------- 按钮交互 ---------- */
  btn.addEventListener('click', function () {
    /* 还没出过声（被拦截）：这一次点击用来启动，而不是切到停止 */
    if (blocked && wantPlay) {
      blocked = false;
      play();
      return;
    }
    wantPlay = !wantPlay;
    if (wantPlay) play(); else audio.pause();
    sync();
    saveState();
  });

  /* 离开页面（跳页 / 关闭）时记下进度 */
  window.addEventListener('pagehide', saveState);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') saveState();
  });

  sync();
  if (!preheated) restorePos();   /* 预热过就不必再跳一次，boot 已在 <head> 里跳过 */
  play();
})();
