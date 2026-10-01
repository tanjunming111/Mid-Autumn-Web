/* ========== 猜灯谜：答题 + 积分（仅本次浏览有效，不持久化） ========== */

var stats = freshStats();
var order = shuffle(RIDDLES.map(function (_, i) { return i; }));
var cursor = 0;
/* 已作答题目：题目原始索引 → { input, text, cls }，作答后不可再改 */
var records = {};

/* 清掉早期版本残留在本机的持久化数据（本页已不再使用 localStorage） */
try { localStorage.removeItem('ma_lantern_stats'); } catch (e) { /* ignore */ }

var elQ = document.getElementById('riddleQ');
var elMeta = document.getElementById('riddleMeta');
var elInput = document.getElementById('riddleInput');
var elFb = document.getElementById('riddleFeedback');
var btnSubmit = document.getElementById('btnSubmit');
var btnReveal = document.getElementById('btnReveal');
var btnPrev = document.getElementById('btnPrev');
var btnNext = document.getElementById('btnNext');

function freshStats() {
  return { answered: 0, correct: 0, streak: 0, best: 0, solved: [] };
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function currentRiddle() {
  return RIDDLES[order[cursor]];
}

function showRiddle() {
  var idx = order[cursor];
  var r = RIDDLES[idx];
  var rec = records[idx];

  elQ.textContent = r.q + '（' + r.hint + '）';
  elMeta.textContent = '第 ' + (cursor + 1) + ' / ' + order.length + ' 题';
  elFb.className = 'riddle-feedback';

  if (rec) {
    /* 已作答：原样恢复当时的输入、反馈与状态，且不可再修改 */
    elInput.value = rec.input || '';
    elFb.textContent = rec.text;
    elFb.className = rec.cls;
    elInput.disabled = true;
    btnSubmit.disabled = true;
    btnReveal.disabled = true;
  } else {
    elInput.value = '';
    elFb.textContent = '';
    elInput.disabled = false;
    btnSubmit.disabled = false;
    btnReveal.disabled = false;
    elInput.focus();
  }
}

function norm(s) {
  return (s || '').replace(/[\s，。！？,.!?"'“”‘’]/g, '').toLowerCase();
}

function submit() {
  var idx = order[cursor];
  if (records[idx]) return;
  var val = norm(elInput.value);
  if (!val) {
    elFb.textContent = '先写下你的谜底哦';
    elFb.className = 'riddle-feedback bad';
    return;
  }
  var r = RIDDLES[idx];
  var ok = r.a.some(function (a) { return norm(a) === val; });

  stats.answered++;
  elInput.disabled = true;
  btnSubmit.disabled = true;
  btnReveal.disabled = true;

  if (ok) {
    stats.correct++;
    stats.streak++;
    if (stats.streak > stats.best) stats.best = stats.streak;
    if (stats.solved.indexOf(idx) < 0) stats.solved.push(idx);
    elFb.textContent = '✓ 猜对了！谜底正是「' + r.a[0] + '」' + (stats.streak >= 3 ? '，连对 ' + stats.streak + ' 题！' : '');
    elFb.className = 'riddle-feedback ok';
  } else {
    stats.streak = 0;
    elFb.textContent = '✗ 可惜，谜底是「' + r.a[0] + '」';
    elFb.className = 'riddle-feedback bad';
  }
  records[idx] = { input: elInput.value, text: elFb.textContent, cls: elFb.className };
  renderStats();
  renderAll();
}

function next() {
  cursor = (cursor + 1) % order.length;
  showRiddle();
}

function prev() {
  cursor = (cursor - 1 + order.length) % order.length;
  showRiddle();
}

function renderStats() {
  document.getElementById('stAnswered').textContent = stats.answered;
  document.getElementById('stCorrect').textContent = stats.correct;
  document.getElementById('stRate').textContent =
    stats.answered ? Math.round(stats.correct / stats.answered * 100) + '%' : '--';
  document.getElementById('stStreak').textContent = stats.streak;
  document.getElementById('stBest').textContent = stats.best;
  document.getElementById('stProgress').textContent = stats.solved.length + '/' + RIDDLES.length;
}

/* ---------- 灯谜全览 ---------- */
var allVisible = false;

function renderAll() {
  var box = document.getElementById('riddleAll');
  box.innerHTML = '';
  RIDDLES.forEach(function (r, i) {
    var item = document.createElement('div');
    item.className = 'riddle-all-item';
    var solved = stats.solved.indexOf(i) >= 0;
    var q = document.createElement('div');
    q.className = 'q';
    q.textContent = (i + 1) + '. ' + r.q + '　（' + r.hint + '）' + (solved ? ' ✓' : '');
    if (solved) q.style.color = '#8fd6a0';
    var a = document.createElement('div');
    a.className = 'a';
    a.innerHTML = '<span class="tap">点击显示谜底</span>';
    a.onclick = function () {
      if (a.dataset.open) {
        a.innerHTML = '<span class="tap">点击显示谜底</span>';
        delete a.dataset.open;
      } else {
        a.textContent = '谜底：' + r.a[0];
        a.dataset.open = '1';
      }
    };
    item.appendChild(q);
    item.appendChild(a);
    box.appendChild(item);
  });
}

/* ---------- 事件 ---------- */
btnSubmit.onclick = submit;
elInput.addEventListener('keydown', function (ev) {
  if (ev.key === 'Enter') submit();
});
btnNext.onclick = next;
btnPrev.onclick = prev;
btnReveal.onclick = function () {
  var idx = order[cursor];
  if (records[idx]) return;
  var r = RIDDLES[idx];
  stats.streak = 0;
  elInput.disabled = true;
  btnSubmit.disabled = true;
  btnReveal.disabled = true;
  elFb.textContent = '谜底：「' + r.a[0] + '」';
  elFb.className = 'riddle-feedback';
  records[idx] = { input: elInput.value, text: elFb.textContent, cls: elFb.className };
  renderStats();
};
document.getElementById('btnToggleAll').onclick = function () {
  allVisible = !allVisible;
  document.getElementById('riddleAll').style.display = allVisible ? 'block' : 'none';
  this.textContent = allVisible ? '收起' : '展开';
};
document.getElementById('btnResetStat').onclick = function () {
  stats = freshStats();
  records = {};
  cursor = 0;
  renderStats();
  renderAll();
  showRiddle();
};

/* ---------- 启动 ---------- */
renderStats();
renderAll();
showRiddle();
