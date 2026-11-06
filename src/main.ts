import "./styles.css";

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
    cols: [],
  };

  const size = init.length;
  for (let i = 0; i < size; i++) {
    const q = (f: (i: number, j: number) => boolean) => {
      const line: Line = [];
      let next = 0;
      let width = 0;
      let isBlack = false;
      for (let j = 0; j < size; j++) {
        const c = f(i, j);
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
      return line;
    };

    board.rows.push(q((i, j) => init[i][j]));
    board.cols.push(q((i, j) => init[j][i]));
  }
  return board;
};

const drawBoard = (board: Board) => {
  let CELL_SIZE = getCellSize(canvas, b);

  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.2)";

  for (const [y, line] of enumerate(board.rows)) {
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
  }

  for (const [x, line] of enumerate(board.cols)) {
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
  }

  ctx.fillStyle = "#4c566a";
  for (const [y, line] of enumerate(board.rows)) {
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
  }

  for (const [x, line] of enumerate(board.cols)) {
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
  }
};

const enumerate = <T>(a: T[]): [number, T][] => a.map((x, i) => [i, x]);

const flip = (a: "x" | "y"): "x" | "y" => (a == "x" ? "y" : "x");

const getBlockId = (board: Board, dir: "x" | "y", pos: V2): BlockId | null => {
  const b = Math.floor(pos[dir]);
  const a = Math.floor(pos[flip(dir)]);

  const q = dir == "x" ? "rows" : "cols";

  const asdf = board[q];
  const line = asdf[a];

  for (const [i, block] of enumerate(line)) {
    if (block.offset <= b && block.offset + block.width > b) return [q, a, i];
  }

  return null;
};
const getBlock = (board: Board, id: BlockId): Block | null =>
  board[id[0]][id[1]][id[2]] || null;

const getCellSize = (canvas: HTMLCanvasElement, board: Board): number =>
  canvas.width / board.rows.length;

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

const parseBoard = (src: string): InitialBoard =>
  src.split("\n").map((x) => x.split("").map((x) => Math.random() < 0.6));

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

// let mouse: Input = { state: "released" };

const inputs: Record<string | number, Input> = {};
const handleDown = (name: string | number, x: number, y: number) => {
  console.log({ name, x, y });
  inputs[name] = { state: "just-down", start: { x, y } };
};
const handleUp = (name: string | number) => {
  const input = inputs[name];
  if (!input) return;

  if (input.state == "dragging" && input.block) {
    const block = getBlock(b, input.block)!;
    block.selected = false;
    block.offset = Math.max(Math.round(block.offset), 0);
  }
  inputs[name] = { state: "released" };

  drawBoard(b);
};

const handleMove = (name: string | number, x: number, y: number) => {
  let input = inputs[name];
  if (!input) return;

  if (input.state != "dragging" && input.state != "just-down") return;
  const CELL_SIZE = getCellSize(canvas, b);
  const pos = { x, y };

  const delta = {
    x: pos.x - input.start.x,
    y: pos.y - input.start.y,
  };

  if (input.state == "just-down") {
    if (Math.abs(delta.x) < 0.1 && Math.abs(delta.y) < 0.1) return;

    const moveDir = Math.abs(delta.x) > Math.abs(delta.y) ? "x" : "y";
    const block = getBlockId(b, moveDir, input.start);

    input = {
      state: "dragging",
      block,
      current: pos,
      dir: moveDir,
      start: input.start,
      startOffset: block ? getBlock(b, block)!.offset : null,
    };
  }

  if (input.state == "dragging" && input.block) {
    const left = getBlock(b, [
      input.block[0],
      input.block[1],
      input.block[2] - 1,
    ]);
    const right = getBlock(b, [
      input.block[0],
      input.block[1],
      input.block[2] + 1,
    ]);
    const block = getBlock(b, input.block)!;

    const min = left ? left.offset + left.width + 1 : 0;
    const max = right
      ? right.offset - 1 - block.width
      : b.rows.length - block.width;

    block.selected = true;
    block.offset = Math.max(
      min,
      Math.min(max, input.startOffset! + delta[input.dir])
    );
  }

  inputs[name] = input;

  drawBoard(b);
};

canvas.addEventListener("touchstart", (e) => {
  const CELL_SIZE = getCellSize(canvas, b);

  const rect = canvas.getBoundingClientRect();
  const { clientX, clientY } = e.touches[e.which]!;
  handleDown(
    e.which,
    (clientX - rect.left) / CELL_SIZE,
    (clientY - rect.top) / CELL_SIZE
  );
});
canvas.addEventListener("mousedown", (e) => {
  const CELL_SIZE = getCellSize(canvas, b);

  handleDown("mouse", e.offsetX / CELL_SIZE, e.offsetY / CELL_SIZE);
});
window.addEventListener("touchend", (e) => {
  handleUp(e.which);
});
window.addEventListener("mouseup", (e) => {
  handleUp("mouse");
});
window.addEventListener("touchmove", (e) => {
  const CELL_SIZE = getCellSize(canvas, b);

  const rect = canvas.getBoundingClientRect();
  const { clientX, clientY } = e.touches[e.which]!;
  handleMove(
    e.which,
    (clientX - rect.left) / CELL_SIZE,
    (clientY - rect.top) / CELL_SIZE
  );

  e.preventDefault();
});
window.addEventListener("mousemove", (e) => {
  const CELL_SIZE = getCellSize(canvas, b);
  handleMove(
    "mouse",
    (e.clientX - canvas.offsetLeft) / CELL_SIZE,
    (e.clientY - canvas.offsetTop) / CELL_SIZE
  );
});
