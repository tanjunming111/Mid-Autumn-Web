/* ========== BGM 预热（放在 <head> 里同步执行，越早越好） ==========
   目的：把「音频请求 + 起播准备」提前到页面刚开始解析时，不再等 body
   末尾的 common.js 跑完 —— 跳页时的静音空档因此明显变短。

   这里只做四件事：
     1) 建音频实例并立刻开始加载（preload='auto'）
     2) 设置循环 / 音量 / 带版本串的地址（版本串从 css/style.css 的 ?v= 读，升级版本号不用改本文件）
     3) 取出上次的播放进度，元数据一到就跳过去
     4) 尝试起播，并把实例挂到 window 上交给 common.js 复用

   按钮、停止/继续、状态持久化、自动播放兜底交互仍在 common.js 里，
   两处分工：本文件负责「尽早开始」，common.js 负责「界面与意图」。

   注意：脚本必须在 <link rel="stylesheet" href="css/style.css?v=..."> 之后，
   否则读不到版本串（读不到时会退化为不带版本串的地址，功能仍正常）。 */
(function () {
  var SRC = 'assets/MP3/1282473302-1-96.mp3';   /* 音频地址：全站唯一来源 */
  var VOLUME = 0.5;                             /* 背景音量，与 common.js 保持一致 */
  var KEY = 'ma_bgm_state';                     /* sessionStorage 键 */

  var saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }

  var ver = (function () {
    var link = document.querySelector('link[rel="stylesheet"][href*="?v="]');
    var m = link && /[?&]v=([^&"'#\s]+)/.exec(link.getAttribute('href') || '');
    return m ? decodeURIComponent(m[1]) : '';
  })();

  var audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = VOLUME;
  audio.src = SRC + (ver ? '?v=' + ver : '');

  /* 元数据一到就跳到上次的位置：此刻音频数据还在路上，跳转几乎不额外花时间 */
  if (saved.t > 0) {
    var seek = function () {
      try { audio.currentTime = saved.t; } catch (e) { /* 不支持跳转就从 0 播 */ }
      audio.removeEventListener('loadedmetadata', seek);
    };
    if (audio.readyState >= 1) seek();
    else audio.addEventListener('loadedmetadata', seek);
  }

  window.__maBgm = audio;
  window.__maBgmSaved = saved;
  window.__maBgmSrc = SRC;

  /* 提前尝试起播：promise 被拦时只做标记，真正的兜底交互在 common.js 里 */
  if (saved.off !== true) {
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () { window.__maBgmBlocked = true; });
    }
  }
})();
