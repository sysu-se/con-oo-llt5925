// Sudoku 领域对象 - 管理盘面状态
export class Sudoku {
  constructor(grid) {
    this.grid = this._copyGrid(grid);
  }

  _copyGrid(grid) {
    return grid.map(row => [...row]);
  }

  getGrid() {
    return this._copyGrid(this.grid);
  }

  guess({ row, col, value }) {
    if (row < 0 || row >= 9 || col < 0 || col >= 9) return;
    this.grid[row][col] = value === 0 ? null : value;
  }

  clone() {
    return new Sudoku(this.getGrid());
  }

  toJSON() {
    return { grid: this.getGrid() };
  }

  toString() {
    return this.grid.map(row => row.map(n => n ?? '.').join(' ')).join('\n');
  }

  isComplete() {
    return this.grid.every(row => row.every(cell => cell !== null));
  }
}

// Game 领域对象 - 管理游戏会话与撤销重做
export class Game {
  constructor({ sudoku }) {
    this.current = sudoku.clone();
    this.history = [this.current.clone()];
    this.historyIndex = 0;
  }

  getSudoku() {
    return this.current.clone();
  }

  guess(move) {
    this.current.guess(move);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.current.clone());
    this.historyIndex++;
  }

  undo() {
    if (!this.canUndo()) return;
    this.historyIndex--;
    this.current = this.history[this.historyIndex].clone();
  }

  redo() {
    if (!this.canRedo()) return;
    this.historyIndex++;
    this.current = this.history[this.historyIndex].clone();
  }

  canUndo() {
    return this.historyIndex > 0;
  }

  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  toJSON() {
    return {
      current: this.current.toJSON(),
      history: this.history.map(s => s.toJSON()),
      historyIndex: this.historyIndex
    };
  }
}

// 统一评分接口
export function createSudoku(input) {
  return new Sudoku(input);
}

export function createSudokuFromJSON(json) {
  return new Sudoku(json.grid);
}

export function createGame({ sudoku }) {
  return new Game({ sudoku });
}

export function createGameFromJSON(json) {
  const game = new Game({ sudoku: createSudokuFromJSON(json.current) });
  game.history = json.history.map(createSudokuFromJSON);
  game.historyIndex = json.historyIndex;
  game.current = createSudokuFromJSON(json.current);
  return game;
}

// Svelte Store 适配层 - 作业2核心接入
export function createGameStore(initialSudoku) {
  let game = createGame({ sudoku: initialSudoku });
  let subscribers = [];

  function notify() {
    const state = {
      grid: game.getSudoku().getGrid(),
      canUndo: game.canUndo(),
      canRedo: game.canRedo(),
      isComplete: game.getSudoku().isComplete()
    };
    subscribers.forEach(fn => fn(state));
  }

  return {
    subscribe(fn) {
      subscribers.push(fn);
      notify();
      return () => {
        subscribers = subscribers.filter(s => s !== fn);
      };
    },
    guess(move) {
      game.guess(move);
      notify();
    },
    undo() {
      game.undo();
      notify();
    },
    redo() {
      game.redo();
      notify();
    },
    reset(newSudoku) {
      game = createGame({ sudoku: newSudoku });
      notify();
    }
  };
}