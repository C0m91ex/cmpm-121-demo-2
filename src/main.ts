import "./style.css";

const APP_NAME = "Sketch Pad";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// Canvas setup
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.border = "1px solid black";
canvas.style.borderRadius = "8px";
canvas.style.boxShadow = "0px 0px 5px 2px rgba(0, 0, 0, 0.5)";
app.appendChild(canvas);

const ctx = canvas.getContext("2d")!;

// Buttons for thin, thick, and clear tools
const toolButtons = {
  thin: document.createElement("button"),
  thick: document.createElement("button"),
  clear: document.createElement("button"),
};

toolButtons.thin.innerText = "Thin Marker";
toolButtons.thick.innerText = "Thick Marker";
toolButtons.clear.innerText = "Clear";

app.appendChild(toolButtons.thin);
app.appendChild(toolButtons.thick);
app.appendChild(toolButtons.clear);

// Sticker array and function to render buttons
let stickers = ["💞", "✨", "🐱"];
const renderStickerButtons = () => {
  // Clear existing buttons if any
  document.querySelectorAll(".sticker-btn").forEach((btn) => btn.remove());

  stickers.forEach((sticker) => {
    const btn = document.createElement("button");
    btn.innerText = sticker;
    btn.className = "sticker-btn"; 
    btn.addEventListener("click", () => selectSticker(sticker));
    app.appendChild(btn);
  });
};

// Initial render of sticker buttons
renderStickerButtons();

// Add a button to create custom stickers
const customStickerButton = document.createElement("button");
customStickerButton.innerText = "Create Custom Sticker";
customStickerButton.addEventListener("click", () => {
  const customSticker = prompt("Enter a custom sticker:", "🙂");
  if (customSticker) {
    stickers.push(customSticker);
    renderStickerButtons(); 
  }
});
app.appendChild(customStickerButton);

// Undo/Redo buttons
const undoButton = document.createElement("button");
undoButton.innerText = "Undo";
app.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.innerText = "Redo";
app.appendChild(redoButton);

// Drawing-related variables
let isDrawing = false;
let currentTool: string = "thin";
let displayList: Command[] = [];
const redoStack: Command[] = []; 
let currentCommand: Command | null = null;
let toolPreview: ToolPreview | StickerPreview | null = null;

// Base Command interface
interface Command {
  draw(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void; // Optional drag method
}

// MarkerCommand class
class MarkerCommand implements Command {
  points: { x: number; y: number }[] = [];
  thickness: number;

  constructor(thickness: number) {
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (const point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}

// StickerCommand class
class StickerCommand implements Command {
  x: number = 0;
  y: number = 0;
  sticker: string;

  constructor(sticker: string) {
    this.sticker = sticker;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = "48px serif";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// ToolPreview class for markers
class ToolPreview {
  x: number = 0;
  y: number = 0;
  thickness: number;

  constructor(thickness: number) {
    this.thickness = thickness;
  }

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// StickerPreview class for stickers
class StickerPreview {
  x: number = 0;
  y: number = 0;
  sticker: string;

  constructor(sticker: string) {
    this.sticker = sticker;
  }

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = "48px serif";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// Handle mouse events
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  if (currentTool === "thin" || currentTool === "thick") {
    currentCommand = new MarkerCommand(currentTool === "thick" ? 8 : 2);
  } else {
    currentCommand = new StickerCommand(currentTool);
  }
  currentCommand?.drag(e.offsetX, e.offsetY); 
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentCommand) {
    currentCommand.drag?.(e.offsetX, e.offsetY); 
    fireDrawingChangedEvent();
  }
  if (!isDrawing && toolPreview) {
    toolPreview.move(e.offsetX, e.offsetY);
    fireToolMovedEvent();
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentCommand) {
    displayList.push(currentCommand);
    currentCommand = null;
    isDrawing = false;
    fireDrawingChangedEvent();
  }
});
// Handle tool selection
toolButtons.thin.addEventListener("click", () => selectTool("thin"));
toolButtons.thick.addEventListener("click", () => selectTool("thick"));
toolButtons.clear.addEventListener("click", () => {
  displayList = [];
  fireDrawingChangedEvent();
});

// Undo/Redo logic
undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    const command = displayList.pop()!;
    redoStack.push(command);
    fireDrawingChangedEvent();
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const command = redoStack.pop()!;
    displayList.push(command);
    fireDrawingChangedEvent();
  }
});

// Fire events
function fireDrawingChangedEvent() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of displayList) {
    command.draw(ctx);
  }
}

function fireToolMovedEvent() {
  fireDrawingChangedEvent();
  if (toolPreview) {
    toolPreview.draw(ctx);
  }
}

// Tool selection logic
function selectTool(tool: string) {
  currentTool = tool;
  currentCommand = null;
  toolPreview = new ToolPreview(tool === "thick" ? 8 : 2);
  fireToolMovedEvent();
}

// Sticker selection logic
function selectSticker(sticker: string) {
  currentTool = sticker;
  currentCommand = null;
  toolPreview = new StickerPreview(sticker);
  fireToolMovedEvent();
}

const titleElement = document.createElement("h1");
titleElement.innerText = APP_NAME;
app.prepend(titleElement);