<script>
	import { createSudoku, createGameStore } from './domain/index.js';

	const initialGrid = [
		[5, 3, null, null, 7, null, null, null, null],
		[6, null, null, 1, 9, 5, null, null, null],
		[null, 9, 8, null, null, null, null, 6, null],
		[8, null, null, null, 6, null, null, null, 3],
		[4, null, null, 8, null, 3, null, null, 1],
		[7, null, null, null, 2, null, null, null, 6],
		[null, 6, null, null, null, null, 2, 8, null],
		[null, null, null, 4, 1, 9, null, null, 5],
		[null, null, null, null, 8, null, null, 7, 9],
	];

	const game = createGameStore(createSudoku(initialGrid));
	let selected = { row: 0, col: 0 };

	function selectCell(row, col) {
		selected = { row, col };
	}

	function setValue(value) {
		if (selected.row === null || selected.col === null) return;
		game.guess({ row: selected.row, col: selected.col, value });
	}

	function clearCell() {
		setValue(0);
	}

	function resetGame() {
		game.reset(createSudoku(initialGrid));
	}

	function undo() {
		game.undo();
	}

	function redo() {
		game.redo();
	}
</script>

<main class="app-container">
	<section class="header">
		<h1>Sudoku</h1>
		<p>本地前端已连接 `src/domain/index.js`。</p>
	</section>

	<section class="board">
		{#if $game.grid}
			{#each $game.grid as row, rowIndex}
				<div class="board-row">
					{#each row as cell, colIndex}
						<button
							class:selected={selected.row === rowIndex && selected.col === colIndex}
							on:click={() => selectCell(rowIndex, colIndex)}
						>
							{cell ?? ''}
						</button>
					{/each}
				</div>
			{/each}
		{/if}
	</section>

	<section class="controls">
		<div class="actions">
			<button on:click={undo} disabled={!$game.canUndo}>Undo</button>
			<button on:click={redo} disabled={!$game.canRedo}>Redo</button>
			<button on:click={clearCell}>Clear</button>
			<button on:click={resetGame}>Reset</button>
		</div>

		<div class="keyboard">
			{#each Array(9) as _, index}
				<button on:click={() => setValue(index + 1)}>{index + 1}</button>
			{/each}
		</div>
	</section>

	{#if $game.isComplete}
		<section class="complete">
			<p>恭喜！数独已完成！</p>
		</section>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		background: #f3f4f6;
	}

	.app-container {
		max-width: 920px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.board {
		display: grid;
		gap: 0.25rem;
		background: #1f2937;
		padding: 0.5rem;
		border-radius: 1rem;
	}

	.board-row {
		display: grid;
		grid-template-columns: repeat(9, minmax(0, 1fr));
		gap: 0.25rem;
	}

	.board button {
		width: 100%;
		padding: 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		background: #f9fafb;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		color: #111827;
		cursor: pointer;
	}

	.board button.selected {
		background: #2563eb;
		color: white;
	}

	.controls {
		margin-top: 1rem;
	}

	.actions,
	.keyboard {
		display: grid;
		gap: 0.5rem;
	}

	.actions {
		grid-template-columns: repeat(4, 1fr);
		margin-bottom: 0.75rem;
	}

	.keyboard {
		grid-template-columns: repeat(9, 1fr);
	}

	.controls button {
		padding: 0.75rem;
		border: none;
		border-radius: 0.5rem;
		background: #111827;
		color: white;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.complete {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: #10b981;
		color: white;
		text-align: center;
	}
</style>