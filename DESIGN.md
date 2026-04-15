# DESIGN

## A. 领域对象如何被消费

### 1. View 层直接消费的是什么？

当前 `src/App.svelte` 并不是直接消费领域对象 `Game` 或 `Sudoku`，而是消费一个 store / adapter。

- View 层直接消费 `createGameStore` 返回的 store
- 该 store 在 `src/domain/index.js` 中封装了 `Game` 和 `Sudoku`
- `Game` 与 `Sudoku` 保持为内部领域对象

### 2. View 层拿到的数据是什么？

View 层得到的状态包括：

- grid：当前数独棋盘的二维数组
- canUndo：是否可以撤销
- canRedo：是否可以重做
- isComplete：是否已完成

当前实现没有直接暴露 invalidCells 或 won，View 层只能读取 store 的这些核心字段。

### 3. 用户操作如何进入领域对象？

用户操作通过事件处理函数进入领域对象。

- 点击格子：调用 selectCell(row, col)，仅更新选中状态
- 输入数字：调用 setValue(value)，内部执行 game.guess({ row, col, value })
- 清空格子：调用 clearCell()，等同于 setValue(0)，触发 game.guess(...)
- 撤销：点击 Undo 按钮后调用 undo()，内部执行 game.undo() 并刷新 store
- 重做：点击 Redo 按钮后调用 redo()，内部执行 game.redo() 并刷新 store

这些方法最终都作用于 `src/domain/index.js` 中的 `Game` 实例。

### 4. 领域对象变化后，Svelte 为什么会更新？

Svelte 更新是因为 store 的通知机制。

- store 的 subscribe(fn) 注册订阅函数
- guess、undo、redo、reset 调用后，notify() 会生成新的状态对象
- 新状态对象传给所有订阅者
- Svelte 自动订阅 $game，收到新状态后重新渲染

因此更新依赖的是 adapter 生成的新状态对象，而不是直接依赖领域对象内部的可变属性。

## B. 响应式机制说明

### 1. 你依赖的是 store、$:、重新赋值，还是其他机制？

当前方案依赖 Svelte store 机制。

- createGameStore 是自定义 store
- App.svelte 通过 $game 访问 store 数据
- 组件内部没有使用 $: 追踪 Game，而是让 store 发出新状态

### 2. 你的方案中，哪些数据是响应式暴露给 UI 的？

响应式数据包括：

- $game.grid
- $game.canUndo
- $game.canRedo
- $game.isComplete

这些字段来自 store 返回的状态对象。

### 3. 哪些状态留在领域对象内部？

内部状态包括：

- Game.current
- Game.history
- Game.historyIndex
- Sudoku.grid

这些状态不直接暴露给 View，而是通过 getSudoku().getGrid() 输出。

### 4. 如果不用你的方案，而是直接 mutate 内部对象，会出现什么问题？

直接修改内部对象会导致：

- Svelte 无法检测对象内部深层变化
- 组件不会自动刷新
- 绕过 store 通知机制
- 撤销/重做历史可能不一致
- 领域对象与 UI 状态边界模糊

## C. 改进说明

### 1. 相比 HW1，你改进了什么？

改进包括：

- View 不直接使用领域对象类，而是使用 store / adapter
- 所有领域操作进入统一通知流程
- View 数据依赖 store 输出的纯状态

### 2. 为什么 HW1 中的做法不足以支撑真实接入？

如果让 View 直接消费领域对象：

- UI 与领域模型过度耦合
- 对象内部可变数据变动不可见
- 缺少标准通知机制
- 渲染会不同步
- 扩展与维护变得困难

### 3. 你的新设计有哪些 trade-off？

改进设计 trade-off：

- 优点
  - 领域与 UI 分层更清晰
  - UI 只消费稳定状态
  - 领域逻辑保留在内部

- 缺点
  - 增加适配层代码
  - 需要手动维护状态映射
  - 如果要暴露更多状态，如 invalidCells、won，还要扩展 store

总之，这个方案让 Svelte 与领域对象之间有明确桥接，避免直接对领域实例做深层可变绑定。