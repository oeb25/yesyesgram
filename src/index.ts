const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
canvas.width = canvas.height =
  Math.min(window.innerWidth, window.innerHeight) - 100;

const gridContainer = document.querySelector("#grid")!;

gridContainer.appendChild(canvas);

type Grid = HTMLDivElement[][];

const buildGrid = (container: Element, size: number): Grid => {
  const grid: Grid = [];

  for (let i = 0; i < size; i++) {
    const rowEl = document.createElement("div");
    const row: HTMLDivElement[] = [];
    rowEl.className = "row";
    for (let j = 0; j < size; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      rowEl.appendChild(cell);
      row.push(cell);
    }
    container.appendChild(rowEl);
    grid.push(row);
  }

  return grid;
};

const setBoard = (grid: Grid, board: InitialBoard) => {
  grid.map((row, i) =>
    row.map((c, j) => {
      c.classList.toggle("set", board[i][j]);
    })
  );
};

type InitialBoard = boolean[][];

type Block = { offset: number; width: number; selected?: boolean };
type Line = Block[];
type Board = {
  rows: Line[];
  cols: Line[];
};

const buildBoard = (init: InitialBoard): Board => {
  const board: Board = {
    rows: [],
    cols: []
  };

  const size = init.length;
  for (let i = 0; i < size; i++) {
    {
      const line: Line = [];
      let next = 0;
      let width = 0;
      let isBlack = false;
      for (let j = 0; j < size; j++) {
        const c = init[i][j];
        if (c && !isBlack) {
          isBlack = true;
          width = 1;
        } else if (c && isBlack) {
          width++;
        } else if (!c && !isBlack) {
          continue;
        } else if (!c && isBlack) {
          isBlack = false;
          line.push({ width, offset: next });
          next += width + 1;
        }
      }
      if (isBlack) line.push({ width, offset: next });
      board.rows.push(line);
    }
    {
      const line: Line = [];
      let next = 0;
      let width = 0;
      let isBlack = false;
      for (let j = 0; j < size; j++) {
        const c = init[j][i];
        if (c && !isBlack) {
          isBlack = true;
          width = 1;
        } else if (c && isBlack) {
          width++;
        } else if (!c && !isBlack) {
          continue;
        } else if (!c && isBlack) {
          isBlack = false;
          line.push({ width, offset: next });
          next += width + 1;
        }
      }
      if (isBlack) line.push({ width, offset: next });
      board.cols.push(line);
    }
  }
  return board;
};

const drawBoard = (board: Board) => {
  let CELL_SIZE = canvas.width / b.rows.length;

  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.2)";

  let y = 0;
  for (const line of board.rows) {
    for (const block of line) {
      ctx.fillStyle = block.selected
        ? "rgba(200,90,90,0.7)"
        : "rgba(143, 188, 187, 0.7)"; //"rgba(200,200,255,0.7)";
      ctx.beginPath();
      ctx.fillRect(
        block.offset * CELL_SIZE,
        y * CELL_SIZE,
        (block.width * CELL_SIZE) / 1,
        CELL_SIZE / 1
      );
    }
    y++;
  }

  let x = 0;
  for (const line of board.cols) {
    for (const block of line) {
      ctx.fillStyle = block.selected
        ? "rgba(200,90,90,0.7)"
        : "rgba(94, 129, 172, 0.7)"; //"rgba(200,255,200,0.7)";
      ctx.beginPath();
      ctx.fillRect(
        x * CELL_SIZE,
        block.offset * CELL_SIZE,
        CELL_SIZE / 1,
        (block.width * CELL_SIZE) / 1
      );
    }
    x++;
  }

  ctx.fillStyle = "#4c566a";
  y = 0;
  for (const line of board.rows) {
    for (const block of line) {
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(
          block.offset * CELL_SIZE,
          y * CELL_SIZE + (i * CELL_SIZE) / 4,
          (block.width * CELL_SIZE) / 1,
          CELL_SIZE / 20
        );
      }
    }
    y++;
  }

  x = 0;
  for (const line of board.cols) {
    for (const block of line) {
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(
          x * CELL_SIZE + (i * CELL_SIZE) / 4,
          block.offset * CELL_SIZE,
          CELL_SIZE / 20,
          (block.width * CELL_SIZE) / 1
        );
      }
    }
    x++;
  }
};

const flip = (a: "x" | "y"): "x" | "y" => (a == "x" ? "y" : "x");

const getBlockId = (board: Board, dir: "x" | "y", pos: V2): BlockId | null => {
  const b = Math.floor(pos[dir]);
  const a = Math.floor(pos[flip(dir)]);

  const q = dir == "x" ? "rows" : "cols";

  const asdf = board[q];
  const line = asdf[a];

  let i = 0;
  for (const block of line) {
    if (block.offset <= b && block.offset + block.width > b) return [q, a, i];
    i++;
  }

  return null;
};
const getBlock = (board: Board, id: BlockId): Block | null =>
  board[id[0]][id[1]][id[2]] || null;

const boardSrc = `
001000010000100
000100001000010
100101001010010
001110011100111
001100011000110
001000010000100
000100001000010
100101001010010
001110011100111
001100011000110
001000010000100
000100001000010
100101001010010
001110011100111
001100011000110
`.trim();
// const boardSrc = `
// 0010000
// 0001000
// 1001010
// 0011100
// 0011000
// 0010000
// 0001000
//   `.trim();

const parseBoard = (src: string): InitialBoard =>
  src.split("\n").map(x => x.split("").map(x => Math.random() < 0.6));

const board1 = parseBoard(boardSrc);
const b = buildBoard(board1);
drawBoard(b);

type V2 = { x: number; y: number };

type BlockId = ["rows" | "cols", number, number];

type Input =
  | { state: "released" }
  | { state: "just-down"; start: V2 }
  | {
      state: "dragging";
      start: V2;
      block: BlockId | null;
      startOffset: number | null;
      dir: "x" | "y";
      current: V2;
    };

let mouse: Input = { state: "released" };

canvas.onmousedown = e => {
  const CELL_SIZE = canvas.width / b.rows.length;

  mouse = {
    state: "just-down",
    start: {
      x: e.offsetX / CELL_SIZE,
      y: e.offsetY / CELL_SIZE
    }
  };
};
window.addEventListener("mouseup", e => {
  if (mouse.state == "dragging" && mouse.block) {
    const block = getBlock(b, mouse.block)!;
    block.selected = false;
    block.offset = Math.max(Math.round(block.offset), 0);
  }
  mouse = { state: "released" };

  drawBoard(b);
});
canvas.onmousemove = e => {
  if (mouse.state != "dragging" && mouse.state != "just-down") return;

  const CELL_SIZE = canvas.width / b.rows.length;

  const pos = {
    x: e.offsetX / CELL_SIZE,
    y: e.offsetY / CELL_SIZE
  };

  const delta = {
    x: pos.x - mouse.start.x,
    y: pos.y - mouse.start.y
  };

  if (mouse.state == "just-down") {
    if (Math.abs(delta.x) < 0.1 && Math.abs(delta.y) < 0.1) return;

    const moveDir = Math.abs(delta.x) > Math.abs(delta.y) ? "x" : "y";
    const block = getBlockId(b, moveDir, mouse.start);

    mouse = {
      state: "dragging",
      block,
      current: pos,
      dir: moveDir,
      start: mouse.start,
      startOffset:
        block && getBlock(b, block) ? getBlock(b, block)!.offset : null
    };
  }

  if (mouse.state == "dragging" && mouse.block) {
    const left = getBlock(b, [
      mouse.block[0],
      mouse.block[1],
      mouse.block[2] - 1
    ]);
    const right = getBlock(b, [
      mouse.block[0],
      mouse.block[1],
      mouse.block[2] + 1
    ]);
    const block = getBlock(b, mouse.block);

    if (!block) return;

    const min = left ? left.offset + left.width + 1 : 0;
    const max = right
      ? right.offset - 1 - block.width
      : b.rows.length - block.width;

    block.selected = true;
    block.offset = Math.max(
      min,
      Math.min(max, mouse.startOffset! + delta[mouse.dir])
    );
  }

  drawBoard(b);
};
