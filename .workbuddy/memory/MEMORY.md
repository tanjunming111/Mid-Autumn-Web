# 月满中秋 · 项目长期约定

## 发布流程（2026-09-25 21:16 最终定稿：只认旧链接）
- 发布方式：**直接对 `C:\Users\tanjunming\Desktop\AI\WorkBuddy\Mid-Autumn` 原文件夹调用发布工具**，不建中间目录、不跑任何同步脚本。
- ⚠️ **唯一线上链接（用户 21:15 明确要求，除非他改口）**：https://e45a2f4947634051a116603b6c812e46.app.workbuddy.host
- 目录决定链接：同一目录重复部署 = 同一沙箱 = 同一链接。**永远不要用其他目录部署**，那会产生新链接。
- 新链接 https://9bb1be55fa44495f9a96369a74150ba3.app.workbuddy.host **已于 21:16 下线**（unpublish 成功，实测 404），不再维护，以后也不要再往那个沙箱推东西。
- 连带后果（用户已接受）：`.workbuddy/` 在项目目录内，会一起上传，`/.workbuddy/` 线上可访问；用户说"多余内容无所谓"。
- 已作废、勿再使用：`Mid-Autumn-publish` 精简目录 + `sync-deploy.py` 同步脚本（磁盘上已删除）。
- 上线后必做：用 Python（urllib）逐个 GET 本地全部文件，确认 200 无遗漏再回报。
- ⚠️ **部署是「覆盖 + 新增」，不会删除已从本地移除的文件**（2026-09-25 22:05 实测）：本地删掉/移走 `assets/gallery/*.png` 后重新部署，线上那两个 PNG 仍 200 可访问且 `Last-Modified` 还是旧时间；用全新随机查询串绕开 CDN 仍 200 → 是**源站沙箱保留了旧文件**，不是缓存残留（对照：请求不存在的文件确实 404）。所以「删文件」只能达到「页面不再引用」，无法从服务器移除，对访客速度无影响。**清理线上旧文件的唯一手段是 `?v=` 换 key 或改名。**
- 原始图片备份（2026-09-25）：`C:/Users/tanjunming/Desktop/AI/WorkBuddy/Mid-Autumn-assets-backup/gallery-png-20260925/`（8 张 gallery 原 PNG，14.08 MB，项目外的同级目录，不会被部署）。

## 部署授权规则
- 只要我不修改项目文件，用户说「重新部署 / 部署」时直接推最新内容，无需逐次确认。
- 若我改过代码，必须先给用户看改动、等点头再上线。

## 静态资源版本号约定（用户 21:13 明确，必须遵守）
- 所有 HTML 里对 `css/style.css`、`js/*.js`、**站内页面链接 `<a href="*.html">`**、**本地图片 `<img src="assets/…">`** 的引用都带 `?v=<版本号>`，**格式 `YYYYMMDD-n`**。
- 语义：`YYYYMMDD` = 该次修改的日期；`n` = **全局递增计数，不按天重置**。
  例：20260925 第一版 `20260925-1`；同日再改 → `20260925-2`；`20260925-…-11` 之后**次日第一次改 → `20260926-12`**（日期换新、计数接着加。**已实际发生过一次**）。
- ⚠️ **每次修改都要递增版本号（用户 21:20 明确，不限 css/js）**：不只是改 `css/`、`js/` 时——改了 HTML 等任何站点文件也要递增，因为版本号还承担「这是第几版」的标记作用（author 页会显示出来供核对）。**要手改的一共 69 处 = 68 处 `?v=`（5 页）＋ `author.html` 兜底文字 1 处**（见下条）。另：`js/blessing.js` 的 2 处回退素材路径由 `assetURL()` 自动跟随，不必手改。别只改变动过的那个文件，否则 CDN 继续发旧副本。
  - 68 处的构成（**`20260926-12` 时点**，含 5 页新增的 favicon 引用）：css 5 + js 16（含 `bgm-boot.js` 5）+ 站内导航链接 33 + 本地图片/素材 9 + **favicon 5**。
  - 各页分布（同口径）：author 11 / blessing 14 / gallery 18 / index 13 / lantern 12。
  - 批量改法（文件全为 LF、无 BOM）：① 旧的 `?v=<上一版>` 全量替换为新版；② 正则 `href="([A-Za-z0-9_\-]+\.html)"` 补 `?v=`；③ 正则 `src="(assets/[^"?#]+)"` 补 `?v=`。`mailto:` / `https://` 外链不会匹配，安全。
- 目的：规避 CDN 缓存 —— 见下方「CDN 缓存坑」。
- **页面上的版本号显示（作者信息页）**：`author.html` 联系方式卡片的月饼**右下角**有一行「版本号：xxxx」；该文字由 `js/common.js` **自动从 `css/style.css` 的 `?v=` 读出来填充**（元素带 `data-site-version` 属性），所以显示与实际加载版本恒定一致。HTML 里那份同名文字是**手写兜底**（JS 失效时显示）——**它不会自动跟随，必须每次升版本时同步改**，见下条。
  - ⚠️ **兜底文字必须每次升版本时同步（用户 22:48 明确选定方案 B，不采用中性文案）**：`author.html` 第 48 行 `<span class="site-version" data-site-version>` 里的文字是**手写的第二个来源**，不会自动跟随。用户仍想看到**具体数字**（万一 JS 失效，他也要靠这行判断线上新旧），所以**每次升版本号时，除了 68 处 `?v=` 引用，还要同步这一处（共 69 处）**。注意这处不匹配 `?v=`，批量替换碰不到，要单独处理。
  - **当前状态：引用与兜底已一致，均为 `20260926-13`**（00:50 删死代码 + 挪 favicon 时同步；**尚未部署**）。手改总数仍是 **69 处**（68 处 `?v=` + 兜底 1）。
  - **注意：只改兜底文字也算改站点文件，仍要走「获批 → 升版本号 → 部署」。**
  - 结构：`<span class="site-version" data-site-version>` 是 `.mooncake-art`（`position:relative`）的直接子元素，不用再包一层。
  - 样式：`.site-version{position:absolute;right:0;bottom:0;text-align:right;white-space:nowrap;font-size:12px;color:var(--muted)}` → **右对齐到卡片内容右边缘**，纵向与月饼底边齐平；`@media(max-width:860px)` 给 `.mooncake-art` 加 `padding-bottom:20px`，版本号落到月饼下方一行（仍右对齐）。
  - 用户用途：**部署后打开作者页看这行字，即可确认线上是否为最新版本**。

## CDN 缓存坑（2026-09-25 实测）
- 该静态站 CDN **按含查询串的完整 URL 作缓存 key**：加 `?v=…` 后连续请求均回源返回最新版（Age 0–4s）；不加则可能命中旧对象且长期不刷新。
- ⚠️ **HTML 页面同样会中招，不是只有 css/js**（21:22 实测）：裸网址 `/author.html` 返回 3694B、`Age=722`、Last-Modified 20:50 的**旧版**（无 `?v=`），而 `/author.html?probe=1` 返回 3720B、Last-Modified 21:13 的**最新版** —— 同一个部署，裸 URL 命中了 12 分钟前的旧缓存。所以**用户打开裸链接时可能看到旧页面**；排查办法是 `Ctrl+F5`，或在地址后随便加个查询串（`?x=1`）强制换缓存 key。用户看 author 页那行「版本号」即可判断自己手上是新是旧。
- 故障实例：旧链接的 `js/blessing.js` 被缓存成 19:30 旧版（48361B，含矢量月饼），而当前版是 54892B → 线上贺卡「加月饼」显示旧矢量图。新文件（新 URL）不受影响，只有 **同名被覆盖** 的文件会中招。
- 排查手法：`curl -s -D - -o 文件 URL` 看 `Last-Modified`/字节数/`Age`，与本地 `ls -l --time-style=+%H:%M:%S` 的 mtime 对齐；**同一 URL 连拉 6 次**可判断是否多边缘节点缓存不一致。响应头里没有 `Cache-Control`/`ETag`（`server: CloudStudio Gateway`），靠启发式缓存。
- `assets/**` 图片**自 `20260925-4` 起已带版本串**（gallery 8 张 + author 的 `mooncake-cut.png`）；`js/blessing.js` 里的回退素材路径由 `assetURL()` 自动拼接，无需手改。
- ⚠️ **裸 URL 缓存各自为政**（21:31 实测）：同一部署下 `/gallery.html`、`/lantern.html`、`/index.html` 的裸 key 已刷到最新，而 `/blessing.html`（19:49 版）、`/author.html`（20:50 版）仍是旧副本、1.7 小时未过期。**每个裸 key 的过期时间互相独立**，所以"部署了却看到旧页面"必须按 URL 逐个实测判断，不能一概而论。

## 图片资源现状（20260925-5 起）
- `assets/gallery/` 8 张已改为 **WebP q95、尺寸仍 1024×954**（14.08 MB → 3.13 MB，PSNR 39.8~41.9 dB）。HTML 引用已是 `*.webp?v=`。
- 同目录下**原 8 张 PNG 已于 22:05 移出**到项目外的备份目录（见上），目录内只剩 webp。
- `assets/picture/mooncake-cut.png`（934 KB）+ `assets/picture/rabbit-cut.png`（205 KB）**仍是 PNG 且带透明**，未转 WebP；`mooncake.jpg` / `rabbit.jpg` 是无人引用的孤儿文件。
- ⚠️ 批量替换版本串/扩展名时，**必须限定 `assets/gallery/` 前缀**，否则会误伤 `assets/picture/*.png`。
- 图片处理工具链：Pillow 只装在 `C:/Users/tanjunming/.workbuddy/binaries/python/envs/default/Scripts/python.exe`，**managed python 3.13.12 没有 PIL**；无 numpy（算 PSNR 要用 `ImageChops.difference` + `histogram()`）。

## 网站图标 favicon（自 `20260926-12`；`20260926-13` 起挪进 `assets/ico/`）
- 文件：**`assets/ico/favicon.ico`**（9555 B，纯透明背景，INCLUDE 16/32/48 三档）。素材＝作者页那张月饼 `assets/picture/mooncake-cut.png`（用户点名要它）。
  - ⚠️ **20260926-13（用户 00:47 要求）把它从项目根目录挪到新建的 `assets/ico/` 下**，五页引用同步改为 `assets/ico/favicon.ico?v=<版本串>`。根目录**不再有** `favicon.ico`。实测（http 与 `file://` 双模式）五页图标仍 200、零报错、零横向溢出；**因为五页都声明了 `<link rel="icon">`，浏览器不会再去裸探根目录 `/favicon.ico`，旧那条 404 不会回来**。
- 生成链（可复用）：按内容包围盒裁 2px 边 → 补正方形（左右居中）→ 四周留 **3%** 边距 → 一次 LANCZOS 降到 **256 母版** → `ImageFilter.UnsharpMask(radius=2, percent=55, threshold=2)` 补锐度（补救 16/32px 发糊）→ `master.save('favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48)])`（Pillow 12.3 内部按 LANCZOS 逐档缩）。
- 五页 `<head>` 各有一行（紧跟 css link 之后）：`<link rel="icon" href="assets/ico/favicon.ico?v=<版本串>" sizes="16x16 32x32 48x48">`。
- ⚠️ **`?v=` 不能省**：裸 `/favicon.ico` 早先已被 CDN 记下 404，靠版本串换缓存 key 才立刻拿到真文件。五页都要写，别只写首页。
- 效果核对：16px = 可辨的金色圆月饼；32px 起纹样清晰；透明底在浅色/深色标签栏都清楚。
- **尚未做**：`apple-touch-icon.png`（Safari / iOS 会另找这个位置，目前仍 404）。用户没要求，要加再说。
- 上线校验（00:09，`20260926-12`）：线上 `/favicon.ico?v=20260926-12` → **200**，那条 404 消失，五页控制台零报错。
- 验证 favicon 的**正确姿势**：`file://` 下别用 `fetch()` 去取（会被 CORS 拦成 `origin 'null'`，那是 fetch 的限制，**不代表图标加载失败**）；改用 playwright 的 `newCDPSession` + `Network.enable` 监听 `Network.responseReceived`，能看到真实的 200。走 http 时 `page.on('response')` 也能捕到。

## 猜灯谜页（`lantern.html` + `js/lantern.js`）行为约定（2026-09-25 22:58，用户明确，版本 `20260925-8`）
- **不持久化**：用户要求「刷新或换页面重进后全部清空」→ 已**移除 localStorage**（`ma_lantern_stats`），成绩/作答记录全部放**内存变量**，页面重新加载即归零。开头还留了一句 `localStorage.removeItem('ma_lantern_stats')` 清理早期版本遗留数据。
- **答题记录 `records`**：`题目原始索引 → { input, text, cls }`。回看已答题时用 `showRiddle()` 原样恢复「用户输入 + 反馈文字 + 反馈样式类」，并禁用输入框/「猜」/「看答案」。**已提交的结果不可修改**（`submit()` 与 `reveal()` 开头都 `if (records[idx]) return;`）。
- **三个导航按钮**：`上一题 | 看答案 | 下一题`（`#btnPrev` / `#btnReveal` / `#btnNext`），均为循环式（`(cursor±1+len)%len`），第 1 题往前到末题。新增的 `#btnPrev` **不加 `data-page-node-id`**（不伪造节点 id）。
- **「清空成绩重来」不要确认框**：用户明确要求直接重来 → `confirm()` 已删除；行为＝成绩归零 + `records` 清空 + `cursor = 0` 回到第 1 题（不重新洗牌）。
- ⚠️ 回看旧题**不重复计分**（`stats.answered/correct/streak` 只在首次提交时更新）；「看答案」只把 `streak` 归零，不计入 `answered`（沿用原逻辑）。

## 背景音乐（BGM，自 `20260925-9`）
- 音频：`assets/MP3/1282473302-1-96.mp3`（**目录名大写 `MP3`** 必须原样引用；**3,126,573 B ≈ 2.98 MB / 96kbps / 48000 Hz 立体声 / 260.5 秒**）。用户自己放入的，**版权由用户负责**，我不代取有版权的曲子。
  - 原始 192kbps 版（6,252,126 B）已移到项目外 `Mid-Autumn-assets-backup/mp3-20260925/`，**站点不再引用**。自 `20260925-9` 起文件名从 `-192` 变 `-96`，`js/common.js` 的 `SRC` 常量是唯一引用点。
  - 转码工具：managed venv 里的 **PyAV 18.1.0**（`pip install av`，自带 FFmpeg，**本机没有系统 ffmpeg**）。套路：`AudioResampler(format='s16p', layout=原, rate=原)` → `out.add_stream('libmp3lame', rate=48000)` + `ost.bit_rate = <目标码率>`。
  - ⚠️ 部署是「只增不删」，线上会同时留着 192/96 两份，换 key（改文件名）才是唯一清理手段。
- 代码位置（**自 `20260925-11` 起分成两块**）：
  - **`js/bgm-boot.js`（新）**：在 5 个 HTML 的 **`<head>` 里同步引入**（紧跟 `css/style.css` 的 link 之后，**必须在其后**，因为要读它的 `?v=`）。只做「尽早开始」：建 Audio 实例、`preload='auto'` 立刻发请求、按 sessionStorage 里的进度在 `loadedmetadata` 时 seek、提前 `play()`（被拦只设 `window.__maBgmBlocked`）、把实例挂到 `window.__maBgm / __maBgmSaved / __maBgmSrc`。**音频路径与音量常量的主来源在这里。**
  - **`js/common.js` 末尾的 BGM 模块**：只负责界面与用户意图（按钮、停止/继续、状态持久化、首次交互兜底），优先复用 `window.__maBgm`；**若 boot 没加载则自建实例兜底**（已实测该降级路径可用）。样式仍在 `css/style.css`（`.bgm-btn` 段，位于「滚动条」段之前）。
  - ⚠️ 改音频路径/音量要同时看这两处；两文件用 `window.__maBgmSrc` 串联，实际以 boot 为准。
  - 进度记录 = `timeupdate`（`lastSaved` 节流，**每秒最多写一次**）+ `pagehide` + `visibilitychange(hidden)` + `pause`。目的＝跳页最多退回不到 1 秒。
  - ⚠️ **跳页的静音空档只能压缩、不能消除**（整页重载必然销毁音频）。实测跳页续播连续（2.87s→3.77s，与等待时长一致）；音频实例创建比 DOMContentLoaded 早 13–44 ms（本地 file:// 页面小，线上更大）。真正无缝只能靠 PJAX 局部刷新或单页应用，用户当前选了「只压缩」。
- 按钮 `#bgmBtn` 由 JS 动态创建（同 `#sky` 画布风格），**自 `20260925-10` 起插在导航栏「作者信息」之后**：`nav.querySelector('a[href^="author.html"]').insertAdjacentElement('afterend', btn)`；`flex:0 0 auto; align-self:center; 32×32` 圆形描边按钮、图标 18px。找不到导航时加 `.is-floating` 退回右下角固定（`fixed; right/bottom:22px; 48×48; 圆+毛玻璃`，窄屏 44×44）——**兜底样式要留着**。停止态加 `.is-off` → 变灰 + 斜杠；播放态金色 + 呼吸动画。**不写进 HTML**，改样式只动 css。
- ⚠️ **页头高度约定**：`.site-header .inner` 是 `min-height:64px; padding:8px 20px`（**不是** `height:64px`）。因为导航里多了按钮，窄屏换行时导航会变两三行，固定高会让内容溢出页头压住正文。实测页头高：≥768px = 65px（与改前一致）、520px = 89px、375px = 128px。**别再改回固定 height。**
- 语义（用户 23:20 指定）：默认播放；点一下停止；再点从停止处继续。`volume = 0.5`（背景音量，用户未指定，可调）。
- `sessionStorage['ma_bgm_state'] = {off, t}`：跳页**续播不从头**、停止态**跨页保持**；关标签页重置。
- ⚠️ **浏览器禁止带声自动播放**：`play()` 被 reject 时挂 document 级首次交互监听起播；**若第一次点的就是按钮本身，那一刻是"启动"而不是"切成停止"**（靠 `btn.contains(e.target)` 区分）。改动这段逻辑时别把这个特例弄丢。
- 音频 URL 也带 `?v=<版本串>`（从 `css/style.css?v=` 读出），所以**升版本号会一并刷新音频缓存**。
- 实测手段：playwright 里 `addInitScript` 劫持 `window.Audio` 把实例存到 `window.__audios`，才能检查 `paused/currentTime/duration`（`new Audio()` 不进 DOM，`querySelector('audio')` 查不到）。

## 其他技术约定
- 纯静态多页站（index / lantern / gallery / blessing / author）。**只有贺卡页（`js/blessing.js`）用 localStorage 持久化**（key `STORE_KEY`）；灯谜页自 `20260925-8` 起已改为纯内存、不持久化。贺卡的玉兔、月饼用内嵌 data URI（`js/rabbit-data.js`、`js/mooncake-data.js`）以规避 `file://` 下 canvas 被污染（否则导出 PNG 抛 SecurityError）。
- 用户主要用法是**双击 HTML 走 `file://`**，改动后要保证该场景可用（实测 `file://` 下带查询串的 script/link/**`<a href>` 页面跳转**在 Edge 均正常）。
- **快速验证法（免截图）**：Edge headless `msedge.exe --headless=new --dump-dom "file:///…/author.html?v=<版本>"`，一次确认①页面能打开、②DOM 里 href/src 都带版本串、③`data-site-version` 显示的是当前版本。

## 可移植性（2026-09-26 00:22 全面体检，**结论：换台电脑可完全一致**）
- **站点实体 = 28 个正式文件**（约 7.9 MB，**不含 `.workbuddy/`**；实测不复制 `.workbuddy/` 也能完整运行）。清单：5 个 HTML + `css/style.css` + `js/` 7 个 + `assets/gallery/*.webp` 8 张 + `assets/ico/favicon.ico` 1 个 + `assets/picture/` 4 张（2 张在用、2 张孤儿）+ `assets/MP3/*.mp3` + `HANDOVER.md`。
- **零绝对路径、零外部网络依赖**（唯一外链是 author 页的 GitHub 超链接，是文本链接不是资源）→ **断网可用、放任意路径可用**（实测放到含**空格+中文**的路径下功能全通）。
- **路径大小写与磁盘逐段一致**（`assets/MP3` 这类大写目录引用也是大写）→ 拷到 **macOS/Linux 大小写敏感文件系统也不会断链**。文件名**全 ASCII**，全站 UTF-8 无 BOM。
- 换机后**唯一会变的三处**（非"本地依赖"，但影响体感）：① **字体**——另一台 Windows 完全一致，Mac/Linux 会回退（缺 `SimSun`/`Microsoft YaHei`/`Georgia`）；② **贺卡 `localStorage` 存档不跟随**（换机后草稿为空；灯谜已不持久化、音乐走 sessionStorage 本就只活在单个标签页）；③ **BGM 自动播放策略**受浏览器/设置影响。
- 体检手法（可复用）：`audit.py` 抽取全部 `src/href/url()` 引用 → 去重后逐个核对存在性 + **逐段 `os.listdir` 比对真实大小写** → 统计字体/存储键/非 ASCII/BOM/CRLF；再用 playwright 在**项目副本**上跑一遍全功能（含贺卡导出 PNG、灯谜答题链路）。

## 环境坑记录
- Git Bash 的 `ln -s` 符号链接读不到内容（0 字节）、环境无 rsync —— 别用符号链接或 rsync 做同步。
- ⚠️ **本机没有可用的回收站接口**（2026-09-25 实测）：PowerShell 里 `Add-Type -AssemblyName Microsoft.VisualBasic` 被安全策略拒绝（"compiles and loads .NET code at runtime"），改用 `[System.Reflection.Assembly]::LoadWithPartialName` 也被拒绝（同等禁止）。**要"可逆删除"只能 `mv` 到临时目录**，永久删除只能 `rm`。所以清理文件时：先移到 `C:/Users/tanjunming/AppData/Local/Temp/<项目>-cleanup-<日期>/`，向用户二次确认后再永久删。
- `.workbuddy/` 里只有 `memory/` 需要长期保留（跨会话上下文）；调试截图等临时产物一律命名 `tmp-*.png` 便于日后识别与清理，且**默认会被一起部署上传**（线上 `/.workbuddy/` 可访问）。
- 校验二进制资源请用 Python（urllib）逐个 GET，别用 curl 管道（Git Bash 下 curl 遇二进制会报 null byte、exit 23）；本环境 `curl -o /dev/null` 也会 exit 23，改写临时文件再 `stat -c%s`。
- 🧹 **临时产物用完即删（用户 2026-09-25 23:35 明确要求，别占 C 盘）**：所有中间产物统一放 `C:/Users/tanjunming/AppData/Local/Temp/<任务名>/`，**任务一结束就 `rm -rf` 掉**，别留在盘上。
  - ⚠️ **最大元凶是 playwright**：每次 `chromium.launch()` 都会在 Temp 建一个 `playwright_chromiumdev_profile-*` 目录（每个十几 MB），`browser.close()` **不会**自动清 —— 一天下来 22 个 = **263 MB**。**跑完校验必须手动 `rm -rf "$TMP"/playwright_chromiumdev_profile-*`。**
  - 一次性脚本（`*.cjs` / `*.py`）和历史 `verify_deploy*.py` 同样即时清；只保留项目内的正式文件。
  - 清理时**只删自己产生的那批**（明确列出文件名），别碰 `NotifyIconGeneratedAumid_*.png` 等系统/其他程序的临时文件。
- **要起本地 http 服务做校验时**（如 `python -m http.server 8099 --bind 127.0.0.1`，**别绑 0.0.0.0**）：必须用 `run_in_background=true` 启动，否则命令一结束服务就被回收，下一步浏览器会 `ERR_CONNECTION_REFUSED`。
- **停进程别用 `taskkill //PID`**（Git Bash 里 `//PID` 会被转义成 `//`，报"无效参数"）；也**别从 Bash 调 `powershell`**（被安全策略拦）。正确做法：用 PowerShell 工具跑 `Stop-Process -Id <pid> -Force`（PID 从 `netstat -ano | grep ":<端口>" | grep LISTENING | awk '{print $5}'` 取）。
  - 项目外的素材备份 `Mid-Autumn-assets-backup/`（21 MB）**不是临时产物，属不可再生素材，删前必须问用户**。

