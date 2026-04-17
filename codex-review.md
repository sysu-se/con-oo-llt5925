# con-oo-llt5925 - Review

## Review 结论

当前实现有一个可工作的领域对象骨架，也尝试了通过 custom store 让 Svelte 消费它；但核心问题是，它没有真正接入现有游戏流程，而且 Sudoku/Game 还没有建模数独最关键的业务约束，因此整体上只能算“部分完成作业目标”，设计质量距离稳健实现还有明显差距。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | poor |
| OOD | poor |

## 缺点

### 1. Sudoku 没有承担合法性校验，完成条件被误建模

- 严重程度：core
- 位置：src/domain/index.js:15-34
- 原因：guess(...) 只检查坐标，不限制 1-9 取值，也不校验行、列、宫冲突；isComplete() 仅检查是否填满，因此一个填满但违规的盘面也会被判定为完成。这既违背数独业务，也没有满足作业要求中“提供校验能力”的职责。

### 2. 领域对象没有接入现有 Svelte 游戏主流程

- 严重程度：core
- 位置：src/App.svelte:45-88; src/components/Board/index.svelte:2-8; src/components/Controls/Keyboard.svelte:2-25; src/components/Header/Dropdown.svelte:2-23; src/components/Modal/Types/Welcome.svelte:2-24
- 原因：App.svelte 重新实现了一套简化棋盘和控制区，而仓库原有的棋盘渲染、键盘输入、新开局入口仍然直接依赖旧的 @sudoku/... store 和 @sudoku/game。这说明领域对象并没有成为现有 view 层的核心，而是旁路搭了一套新界面，不符合“接入真实 Svelte 游戏流程”的作业目标。

### 3. 题面 givens 与玩家输入没有被区分

- 严重程度：major
- 位置：src/domain/index.js:3-5,15-18; src/App.svelte:23-33
- 原因：Sudoku 只保存一个可写 grid，没有 fixed cell 或 original puzzle 概念；App.svelte 的输入和 Clear 对任意选中格都生效。这样初始题面数字也能被改写，既不符合数独业务，也让 UI 无法表达“题目数字不可编辑”的规则。

### 4. Undo/Redo 历史会记录空操作

- 严重程度：major
- 位置：src/domain/index.js:49-53
- 原因：Game.guess() 无论本次输入是否真正改变盘面，都会截断并追加一份历史快照。配合 Sudoku.guess() 对越界输入直接 return 的写法，会产生“没有变化但多了一步撤销”的伪历史，削弱 Game 作为操作边界的设计质量。

### 5. 领域层导出的状态与现有组件约定不兼容

- 严重程度：major
- 位置：src/domain/index.js:17,112-117; src/components/Board/index.svelte:48-51; src/components/Controls/Keyboard.svelte:12-24; src/components/Controls/ActionBar/Actions.svelte:38
- 原因：领域实现用 null 表示空格，只导出 grid、canUndo、canRedo、isComplete；而现有组件普遍以 0 判断空格，并依赖候选数、冲突格、提示等响应式状态。即使以后想把 store 接到现有组件上，也会因为值语义和视图状态模型不匹配而需要大改。

### 6. Store adapter 过于薄弱，视图模型没有成形

- 严重程度：minor
- 位置：src/domain/index.js:111-117
- 原因：notify() 每次都通过 getSudoku() 重建快照，且没有把 selected cell、invalid cells、fixed-cell metadata 等 UI 语义系统化为稳定的 view model。当前 adapter 更像“把 grid 包成可订阅对象”，离一个面向 Svelte 的完整适配层还有距离。

## 优点

### 1. 用防御性复制隔离内部状态

- 位置：src/domain/index.js:3-13,20-29
- 原因：构造函数、getGrid()、clone() 和 toJSON() 都返回拷贝，避免外部持有内部二维数组引用后直接篡改对象状态，这对快照式历史是有价值的。

### 2. Game 把历史管理集中在单一对象里

- 位置：src/domain/index.js:49-74
- 原因：guess() 会在新操作后截断 redo 分支，undo()/redo() 也通过 canUndo()/canRedo() 暴露能力边界，避免界面层自己拼装历史栈。

### 3. 已经尝试用 Svelte custom store 作为领域对象适配层

- 位置：src/domain/index.js:107-145; src/App.svelte:16-25,36-41,52-87
- 原因：createGameStore() 满足 subscribe 协议，App.svelte 通过 $game 渲染并调用 guess、undo、redo、reset，说明作者至少理解了“对象内部变更需要通过可订阅层驱动 Svelte 更新”这一关键点。

### 4. 考虑了序列化与重建接口

- 位置：src/domain/index.js:24-25,76-81,90-103
- 原因：toJSON()、createSudokuFromJSON()、createGameFromJSON() 为持久化、调试或状态恢复留下了接口，说明对象设计并非完全局限于一次性内存使用。

## 补充说明

- 本次结论仅基于静态审查：阅读了作业要求.md、src/domain/index.js、src/App.svelte 以及直接相关的 Svelte 组件；未运行测试，也未实际启动页面。
- “未接入现有 Svelte 游戏流程”的判断来自静态依赖关系：App.svelte 未消费现有 Board、Controls、Header、Modal 组件，而这些组件仍直接 import 旧的 @sudoku/... store 或 @sudoku/game。
- 为遵守评审范围，未对 src/node_modules/@sudoku/* 的内部实现做全面代码质量审查；只把它们当作现有流程依赖的线索来判断接入情况。
