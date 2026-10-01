# 月满中秋 · 项目转交报告

> 写给接手会话：本文档是「月满中秋」中秋主题网站的完整现状说明 + 修改指南。读完即可直接上手改动。
> 最后更新：2026-09-25

---

## 1. 项目概况

- **定位**：中秋主题互动网站（互动祝福/贺卡站 + 猜灯谜 + 图集），传统国风，多页标准版
- **技术**：纯前端多文件静态站，无后端、无构建工具，双击 `index.html` 即可运行；localStorage 做持久化
- **路径**：`C:\Users\tanjunming\Desktop\AI\WorkBuddy\Mid-Autumn`
- **部署状态**：未上线，仅本地运行。用户明确要求：只有他下达"重新部署"指令时才通过「发布应用」工具上线

## 2. 文件结构

```
Mid-Autumn/
├── index.html          首页：夜空月亮开场 + 三大功能入口
├── blessing.html       祝福贺卡编辑器（核心页，功能最重）
├── lantern.html        猜灯谜：15 条灯谜 + 积分统计
├── gallery.html        中秋图集：8 个意象卡片（AI 生成插画）
├── author.html         作者信息页（项目介绍 + 联系方式上下堆叠 + 动画月饼图案）
├── css/
│   └── style.css       全站共享样式（含贺卡编辑器三列布局）
├── js/
│   ├── common.js       全站共享背景动画：星星 + 孔明灯 + 桂花飘落
│   ├── data.js         RIDDLES（15条灯谜）+ BLESSINGS（8条祝福语）
│   ├── blessing.js     贺卡编辑器全部逻辑（约 800 行）
│   └── lantern.js      猜灯谜逻辑
├── assets/gallery/     8 张 AI 生成插画
└── assets/picture/     rabbit.jpg、mooncake.jpg（用户提供的原图）+ rabbit-cut.png、mooncake-cut.png（去白底的玉兔/月饼素材，贺卡与作者页在用）
```

**注意**：
- `assets/picture/rabbit.jpg` 是用户亲手放的玉兔原图，贺卡里的玉兔元素就是从它抠图来的，不要删。
- `assets/picture/mooncake.jpg` 是用户提供的月饼原图（白底），作者页用的是去白底后的 `mooncake-cut.png`（PIL 泛洪去白底 + 反解白底混色消光晕，911×998 透明底），原图同样保留不删。

## 3. 视觉规范

- 配色：深蓝天幕（`#0a1120` / `#101b33` / `#182444` 渐变）+ 暖金（`#d4a853` / `#e8c877`）+ 月白
- 标题字体：Georgia 衬线；正文系统字体
- 全站 header 顶部小字统一为「花好月圆」（已去除全部英文 MID-AUTUMN）
- 响应式：≤1100px 贺卡编辑器折叠为单列（画布置顶），≤860px 全站单列

## 4. 各页现状

### 4.1 首页 index.html
- 浮动月亮 + 共享背景动画 + 三个入口卡片（祝福贺卡/猜灯谜/中秋图集）
- 主视觉：标题「月满中秋」+ 诗句「但愿人长久，千里共婵娟」（原英文副题已删）

### 4.2 共享背景动画 js/common.js
- **星星**：网格 + 抖动均匀分布（每 6500px² 一颗，上限 320），闪烁
- **孔明灯**：钟形纸罩造型（暖黄渐变+褶皱+底部火光+光晕），"水平区段槽位"制——每盏灯固定占一个水平区段，飞走重生仍回原槽位，保证左右均匀
- **桂花**：飘落花瓣
- ⚠️ 此文件全站共享，改它会影响所有页面背景

### 4.3 祝福贺卡 blessing.html + js/blessing.js（核心）

**布局（三列）**：
| 左列 | 中列 | 右列 |
|---|---|---|
| 元素列表 | 画布（`.editor-col-canvas`）+ 生成PNG/重置 | 画布规格 → 写下你的祝福 → 添加元素 |

**画布规格**：2 个比例按钮 `RATIOS = { '3:4':[600,800], '4:3':[800,600] }`，默认 3:4（9:16、16:9 已按用户要求删除）。**已去掉大小调节滑杆**。
- 显示面积相等：`updateDisplaySize()` 取长边上限 `L = min(中间列宽, 74vh)`，竖版/横版显示面积一致
- 严格比例方案：`#cardCanvas` CSS 为 `width/height:auto + max-width:100% + max-height:74vh`，JS 在 `applyCanvasSize()` 里设 `canvas.style.aspectRatio = CW/CH`；`updateDisplaySize()` 再按中间列宽与 74vh 动态写 `canvas.style.maxWidth`（窗口缩放时重算）
- **默认元素「位置」自适应比例、「尺寸」不随比例变**（2026-09-25）：`defaultElements()` 用 `ky = CH/800`、`kx = CW/600` 换算**位置**（不能写死 600×800 的绝对坐标——否则在 4:3 下点「重置」时远山/落款会落到画布下边界之外，看起来像「元素消失」）；但 `size`/`boxW` 这类**尺寸刻意不乘系数**——竖版与横版下初始大小完全相等（月亮半径都是 90，标题 35、祝福语 25、落款 20，框宽 300/420），这是用户明确要求。`healOutOfBounds()` + `DEFAULT_Y`（标签→纵向比例映射）在 `initCard()` 时自愈历史遗留的越界默认元素（**只处理没有 `added` 标记的默认元素**，且仅在 y<0 或 y>CH 时纠正）

**元素体系**（`state.elements` 数组）：
- 默认元素顺序（`defaultElements()`）：`stars`(满天星) → `hills`(远山 y=0.825CH) → `moon`(月亮，正中央 `y=0.5CH`) → `textbox`(标题 y=0.1125CH) → `textbox`(祝福语 y=0.845CH，落在山峦上、落款上方一点) → `textbox`(落款 y=0.92CH)；月亮半径基准 90。**标题/落款也都是 `textbox`**（因此与普通文本框一样不可旋转），见下方「文字元素统一为 textbox」一条。**数组顺序 = 创建时间顺序 = 元素列表顺序**；**绘制层级由元素上的 `z` 决定**（2026-09-25 起，见下方「选中置顶」一条），所以月亮排第三位才能让列表前两位是满天星、远山（月亮在画布中心，与远山不重叠）；`normalizeOrder()`（`initCard` 调用）会把旧存档里按旧层级排列的默认元素稳定重排回来，用户添加的元素保持原有先后并统一排在默认元素之后
- **元素列表成员规则**（`renderElList`，两个标记二选一）：`deletable` → 进列表**且**带「删除」按钮（用户添加的元素、默认月亮）；`listable` → 进列表但**不给删除按钮**（满天星/远山：可以点选、移动，删掉没有入口再加回来，所以只列表不可删）；两个都没有 → 不进列表（标题/祝福语/落款），但它们在画布上仍可点选、拖动、四角缩放。列表项只显示元素名称（**不再附加「（类型）」括号**，`typeName()` 已随之移除），顺序按创建时间从早到晚，即直接遍历 `state.elements`，不做任何重排
- 可添加元素（`PALETTE`）：`moon` `rabbit` `skylantern` `branch` `mooncake` `textbox`，可重复添加、可删除；加出来的元素带 **`added: true`**（`healOutOfBounds` 不会去纠正它的坐标）和 `z: zTop++`（新元素在最上层）
- **选中即置顶（绘制层级 `z`）**（2026-09-25，用户要求「在元素列表中选中一个元素时，这个元素要置于最上层，使得我点击元素能够选中它」）：**数组顺序留给元素列表（创建顺序）**，绘制层级改由元素上的 **`z`** 决定——`drawOrder()` 按 z 升序返回副本，`redraw()` / `exportPNG()` / `hitTest()` / `onDown()` 的从上往下查找全部改用它；`selectEl()` 选中时把该元素 `e.z = zTop++` 提到最上层（`zTop` 由 `syncZ()` 维护，`initCard` / `resetCard` 都会调用；旧的没有 `z` 的存档按数组下标补齐，所以初始层级与改动前一致）。⚠️ **满天星 / 远山不参与置顶**（`BACKGROUND_TYPES`）——它们的包围盒覆盖整张画布，否则点一下空白处就会把星空提到最上面盖住月亮
- 编号规则：`syncAddCounter()` 按已有同类可删元素给「＋添加元素」续号（默认中央已有一个月亮 → 再点「＋月亮」得「月亮·2」），`initCard()` 与 `resetCard()` 都会调用
- 画布右键菜单只对 `deletable` 元素弹出（满天星/远山不可删、包围盒又覆盖整张画布，因此右键空白处不会弹菜单）
- 交互：点击选中 → 拖拽移动；选中后四角有金色手柄，**拖动四角＝旋转＋缩放，缩放始终绕元素自身中心进行（对角会一起缩放）**（`rotBaseAngle`/`rotBaseRadius` 解算：抓角时记下「角→中心」的初始半径，拖动中 `k = 鼠标到中心距离 ÷ 该半径`）。⚠️ 曾试过「对角锚点固定」的写法（`rotAnchor` 解算＋缩放后整体平移补偿），但会让元素在缩放/旋转时抖动，用户反馈后已回退，**不要再改回锚点方案**；**所有文字元素（标题 / 祝福语 / 落款 / 用户添加的文本框）都是 `textbox`，一律禁止旋转**（四角只缩放，`onMove` 里 rotation 恒置 0）；**右键弹菜单（镜像在上 / 删除在下）**，镜像＝左右翻转（`flip`）；元素列表右侧「删除」按钮（仅 `deletable` 元素有）
- **文字元素统一为 `textbox`（2026-09-25，用户要求「标题和落款也是文本框，不能旋转」）**：标题/落款的 `type` 由 `text` 改为 `textbox`，`onMove` 里「`textbox` → `rotation` 恒置 0」的规则因此自动覆盖它们。类型换了但外观必须原样：① `drawTextBox()` 新增三个**可选**字段 `align`（left 默认 / center / right，控制每行在框内对齐）、`spacing`（字距，逐字绘制）、`bold`（加粗）——不设时行为与最早的左对齐文本框逐像素一致，所以现有的普通文本框不受影响；`autoBoxH()` 同样按 `bold`/`spacing` 参与测量，否则换行点/行数与绘制对不上。② 两种类型的锚点语义不同：`text` 的 `e.x` 由 `align` 决定（center＝文字中心 / right＝文字右端）、`e.y` 是文字垂直中心；`textbox` 的 `e.x`/`e.y` 是**框中心**、文字基线是 `top`（比 `text` 的绘制低约 **0.35×字号**）。因此标题保持 `e.x=CH 中心` 不变（align=center），落款的 `e.x` **左移半个框宽**以维持右端仍距右缘 52px，两者的 `y` 统一 **+0.35×字号**把垂直位置补回来；框宽取 `300×kx`。③ `migrateTextBoxes()`（`initCard` 里紧跟 `normalizeOrder()` 调用）把旧存档里的标题/落款一次性迁移过来（已设过 `boxW` 就沿用，否则取「默认框宽」与「文字宽 +40」的较大者，避免字号被调大过导致迁移后换行）；`healOutOfBounds()` 回位时也对 `textbox` 补 0.35×字号的垂直偏移。④ 代码里 `text` 类型与 `drawTextEl`/`drawSpacedText` 保留不再使用（`EDGE_TYPES`/`HANDLE_TYPES` 仍含 `text` 以备兼容）
- **`textbox` 的字号与框尺寸彻底解耦**（2026-09-25）：列表里「字体大小：xxpx + 滑杆」放在**文字输入框上面**——**滑杆规格与「祝福语」滑杆完全一致**（`min=14 max=48 step=1`，样式沿用 `.size-val` + 金色滑块，见 CSS `.el-item-size`）。① 拖滑杆**只改 `size`**：首次拖动时把当前框尺寸固化（`if (!e.boxH) e.boxH = boxHOf(ctx, e)`），所以文本框宽高保持不变；② 画布上拖四条边改框宽高时字号不变（原有行为）；③ 画布上拖四角**只等比缩放 `boxW`/`boxH`，不再改 `size`**（`onDown` 抓角时把未设高度的文本框显式化 `rotStartBoxH = se.boxH || boxHOf(ctx, se)`，否则缩放基准为 0 拖不动）；④ 新建文本框初始字号 25px（`PALETTE.textbox.size`），与祝福语一致
- **文字类元素四条边可拖动改宽高**（2026-09-25 新增，`EDGE_TYPES = ['textbox','text']`）：选中文本框 / 标题 / 落款后，四条边中点显示**金色**圆点手柄（与四角方块同色；四角＝`text` 旋转＋缩放 / `textbox` 只缩放框；缩放一律绕元素自身中心、不做对角固定）。拖左右边改 `boxW`、拖上下边改 `boxH`，**被抓的边跟随鼠标、对边固定**（`edgeResizing`/`edgeWhich`/`edgeStart`/`edgeGrab`）。水平锚点按元素对齐方式：`text` 用其 `align`（center 居中于 `e.x` / right 右端在 `e.x` / left 左端在 `e.x`），`textbox` 恒为 center。⚠️ 四个坑：① 边手柄判定必须在四角之后（四角优先）；② 拖动位移要用 `unrotatePoint`（只反旋转、**不反镜像**）算「视觉方位」坐标，否则镜像后视觉上被拖的是左/右边，实际会反过来；③ 镜像时边索引要互换（`edgeWhich` 的 1↔3）；④ `edgeStart` 存的是 `boundsOf` 还原出的**真实框**（去掉 ±6 余白），不能再假定框以 `e.x` 对称——`text` 的 right/left 对齐框就不是对称的
- **`text` 的框模型（历史遗留，默认元素已不再产生 `text`）**：在把标题/落款改成 `textbox` 之前，曾给 `text` 类型加过与 `textbox` 同款的框模型。`textLinesOf()` 在 `boxW` 存在时按框宽换行（未设 `boxW` 则完全不换行、排版与旧版逐像素一致）；`wrapLines()` 的 `spacing` 参数（字距计入行宽，否则换行点会偏）与 `align` 版 `drawSpacedText()`（原实现只支持居中）后来都被 `drawTextBox` 复用。代码保留作兼容
- **框高模型**：`boxH` 显式高度优先，未设置时按行数自适应——`textbox` 走 `boxHOf`/`autoBoxH`（行高 1.7×size），`text` 走 `boxH || 行数×1.6×size`（沿用原基线间距）。默认元素都不带 `boxH`（行为与旧版一致），用户一旦拖上下边即由用户接管；四角缩放时 `boxW`/`boxH` 同比缩放（`text` 适用；`textbox` 四角只缩放框、字号由滑杆单独控制），**切比例时框宽高不变**（2026-09-25 起，只迁移位置）
- **「重置」按钮无确认弹窗**（点即重置，2026-09-25 按用户要求去掉 `confirm`）
- **⚠️ 四角旋转的基准角必须按镜像轴折算**（2026-09-25 修）：`onDown` 抓角时 `lx = base.x - se.x`，镜像状态下要把它翻到视觉一侧——**正确写法 `lx = 2 * (flipAxisX(se) - se.x) - lx`**，不能写成 `lx = -lx`（后者只在镜像轴恰好等于 `e.x` 时才成立）。桂枝的镜像轴是图形自身中心（`e.x + 70×size`），用 `-lx` 会算出错误的 `rotBaseAngle`（连带缩放基准半径也错），表现为**镜像后的桂枝拖角旋转时方向乱掉**
- 默认尺寸（**竖版 / 横版完全相同**，不乘 `ky`/`kx`）：标题 35 / 祝福语 25 / 落款 20 / 新建文本框 25 / 中央月亮半径 90 / 远山 70 / 标题与落款的框宽 300、祝福语 420。**切换比例时只迁移位置**（`x×fx`、`y×fy`、`stars.maxY×fy`），`size`/`boxW`/`boxH` 一律不变
- **属性编辑面板已移除**，位置靠拖拽、旋转靠四角手柄、颜色等需改代码
- **选框跟随旋转**：`redraw()` 绘制虚线框与手柄前套用与 `drawElement` 相同的变换；`transformPoint`（正＝先镜像后旋转，逆＝先反旋后反镜像）、`handlePointsFor`、`elementHit` 三者配合，保证旋转后点击/手柄判定仍准确。⚠️ `boundsOf` 的 branch 分支**不含 flip**（镜像统一由变换负责，避免双重翻转）
- **玉兔是图片元素**：`rabbitImg` 异步加载 `assets/picture/rabbit-cut.png`（700×657 透明底，从 `assets/picture/rabbit.jpg` AI 抠图而来），`drawRabbit` 用 drawImage，宽 200×size、高按图片纵横比（`rabbitAR()` 动态算）。玉兔不显示颜色选项
- **月饼也是图片元素**（2026-09-25 由矢量绘制改成图片）：`mooncakeImg` 加载 `assets/picture/mooncake-cut.png`（与作者页同一张去白底图），宽 104×size、高按纵横比 1.0964。⚠️ 玉兔与月饼都**优先用内嵌 data URI**（`js/rabbit-data.js`、`js/mooncake-data.js`，各在 HTML 主脚本前引入），因为 `file://` 下 `drawImage` 本地图片会污染 canvas 导致导出 PNG 抛 `SecurityError`；新增图片类元素时务必照这个模式内嵌

**文字输入**：右列「写下你的祝福」三个输入框（标题/祝福语/落款）与画布双向同步（`findTextEl` + `syncQuickInputs`）；8 条预设祝福语默认折叠，点「常用祝福语 ▸」展开

**持久化**：`localStorage["ma_card_state"] = {v:2, ratio, elements}`，`redraw()` 后 250ms 防抖写入；`initCard()` 启动时恢复；「重置」清存储并恢复默认

**导出**：「生成 PNG 贺卡」按 SCALE=2 倍清晰度导出

**切换比例**：`resizeCard(ratio)` **只迁移位置**（x×fx、y×fy，满天星的 `maxY` 跟着高度走），**元素尺寸 `size`/`boxW`/`boxH` 与文本框字号一律不变**（用户要求：竖版/横版切换时元素大小、字体不变），**不会清空内容**

### 4.4 猜灯谜 lantern.html + js/lantern.js
- 15 条灯谜（`RIDDLES`，格式 `{q, hint, a}`）；**提示已直接拼在谜面后括号内**显示，如「十五天（打一字）」，「看提示」按钮已删除
- 按钮：看答案 / 下一题；答错断连对
- 统计存 `localStorage["ma_lantern_stats"]`：已答、正确、当前/最佳连对

### 4.5 中秋图集 gallery.html
- 8 个卡片：满月/玉兔/花灯/桂花/月饼/嫦娥/团圆/灯谜，对应 `assets/gallery/` 下同名 png（AI 生成，工笔画+水彩风，已裁掉底部"AI生成"水印 70px）
- 卡片图区 190px 高、`object-fit:cover`、hover 放大、底部渐变遮罩

## 5. 工具链（已装好，可直接用）

| 用途 | 工具 | 位置/用法 |
|---|---|---|
| JS 语法校验 | 受管 Node | `C:\Users\tanjunming\.workbuddy\binaries\node\versions\22.22.2-2\node.exe --check <file>` |
| Python 脚本 | 隔离 venv | `C:\Users\tanjunming\.workbuddy\binaries\python\envs\default\Scripts\python.exe`（已装 pillow、requests） |
| 浏览器验证 | playwright-cli + 系统 Edge | 装在 `C:\Users\tanjunming\.workbuddy\binaries\node\workspace`；`./node_modules/.bin/playwright-cli.cmd open --browser=msedge <url>`，免下载 Chromium |
| AI 生图 | ImageGen 工具 | 生成过 8 张图集插画 |
| AI 抠图 | buddy-image-processing 技能 | `matting` 操作，需先 connect_cloud_service 取 token |

**playwright-cli 使用要点**：
1. 先起本地服务：`python -m http.server 8377 --bind 127.0.0.1`（项目目录下）
2. ⚠️ **会话不跨 Bash 调用保持**——open/resize/eval/screenshot/close 必须串在**同一条** bash 命令里用 `&&` 连接
3. 全屏验证：`resize 1600 900`；截图存 `.workbuddy/` 下
4. 页面操作可用 `eval "() => { document.querySelector('[data-add=rabbit]').click(); return 1; }"` 注入点击

**图片处理流程**（玉兔抠图同款）：buddy-image-processing matting → PIL 按 alpha bbox 裁剪透明边 → 存 assets/gallery/

## 6. 协作纪律（用户硬性要求，务必遵守）

1. **改动前先获用户明确"批准"**——回答问题≠批准；用户说"直接修改"类指令才动手，且只做指明的那件
2. **禁止主动跑截图/校验脚本**，除非用户要求（本轮的浏览器验证是用户明确要求的）
3. **部署上线只能等用户明确下达"重新部署"指令**
4. tmp 产物（如 .workbuddy/tmp-*.png）只在用户明示时清理
5. 回复偏好：结构化表格 + ✓ 验证项；中文交流
6. 禁止主动提醒类内容（如缓存警告）

## 7. 迭代历史（简要）

1. **v1**：四页框架 + 5 套贺卡模板
2. **v2**：贺卡重构为单画布自由编辑器（添加元素/文本框/PNG 导出）
3. **v3**：图集 SVG 换 AI 插画；首页去英文；星空/孔明灯均匀分布；灯谜提示入谜面括号；祝福语折叠；画布状态持久化
4. **v4（最新）**：贺卡三列布局（列表/属性移到画布左侧）；画布严格比例（修 9:16 失效 bug）+ 去掉大小滑杆；四角拖拽缩放；玉兔换用户提供的 rabbit.jpg 抠图素材；元素出生点错位

## 8. 已知待办/可选项（用户未批准前不要动）

- 图集 8 张插画可复用为首页背景或贺卡背景（提过方案，用户未采纳）
- 网站未部署，等用户指令
