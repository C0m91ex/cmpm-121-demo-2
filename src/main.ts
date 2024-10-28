import "./style.css";

const APP_NAME = "Sketch Pad";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// Create a header for the app name
const header = document.createElement("h1");
header.innerText = APP_NAME;
app.appendChild(header);

// Create a container for the canvas and position it above the buttons
const canvasContainer = document.createElement("div");
canvasContainer.style.marginBottom = "10px"; // Adds space below the canvas to separate it from buttons

// Canvas setup
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.border = "1px solid black";
canvas.style.borderRadius = "8px";
canvas.style.boxShadow = "0px 0px 5px 2px rgba(0, 0, 0, 0.5)";
canvasContainer.appendChild(canvas); // Add canvas to the container
app.appendChild(canvasContainer);    // Add container to the app

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

// Initial sticker set, represented by an array of emoji strings
let stickerSet = ["💞", "✨", "🐱"];
const stickerButtons: HTMLButtonElement[] = [];

// Function to create sticker buttons from the stickerSet array
function createStickerButtons() {
  stickerButtons.forEach((btn) => app.removeChild(btn));
  stickerButtons.length = 0;

  stickerSet.forEach((sticker) => {
    const btn = document.createElement("button");
    btn.innerText = sticker;
    btn.addEventListener("click", () => selectSticker(sticker));
    stickerButtons.push(btn);
    app.appendChild(btn);
  });
}

// Initialize sticker buttons
createStickerButtons();

// Add custom sticker button
const customStickerButton = document.createElement("button");
customStickerButton.innerText = "Add Custom Sticker";
customStickerButton.addEventListener("click", () => {
  const customSticker = prompt("Enter a new sticker (emoji or text):", "🎨");
  if (customSticker) {
    stickerSet.push(customSticker);
    createStickerButtons(); // Refresh buttons to include new custom sticker
  }
});
app.appendChild(customStickerButton);

// Export button
const exportButton = document.createElement("button");
exportButton.innerText = "Export";
exportButton.addEventListener("click", exportCanvasAsPNG);
app.appendChild(exportButton);

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

// Base Command interface
interface Command {
  draw(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void; // Optional drag method
}

// MarkerCommand class
class MarkerCommand implements Command {
  points: { x: number; y: number }[] = [];
  thickness: number;
  color: string;

  constructor(thickness: number, color: string) {
    this.thickness = thickness;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.lineWidth = this.thickness;
    ctx.strokeStyle = this.color;
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
  rotation: number;

  constructor(sticker: string, rotation: number) {
    this.sticker = sticker;
    this.rotation = rotation;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.font = "48px serif";
    ctx.fillText(this.sticker, 0, 0);
    ctx.restore();
  }
}

// Handle mouse events
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  if (currentTool === "thin" || currentTool === "thick") {
    const thickness = currentTool === "thick" ? 8 : 2;
    const color = getRandomColor(); // Get a random color for the marker
    currentCommand = new MarkerCommand(thickness, color);
  } else {
    const rotation = getRandomRotation(); // Get a random rotation for the sticker
    currentCommand = new StickerCommand(currentTool, rotation);
  }
  currentCommand?.drag(e.offsetX, e.offsetY); // Safe navigation to check if currentCommand is defined
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentCommand) {
    currentCommand.drag?.(e.offsetX, e.offsetY); // Safe navigation here
    fireDrawingChangedEvent();
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

// Tool selection logic
function selectTool(tool: string) {
  currentTool = tool;
  currentCommand = null;
}

// Function to get a random color
function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Function to get a random rotation in radians
function getRandomRotation(): number {
  return Math.random() * 2 * Math.PI; // Random angle between 0 and 2π radians
}

// Export function
function exportCanvasAsPNG() {
  const link = document.createElement("a");
  link.download = "sketch.png";
  link.href = canvas.toDataURL();
  link.click();
}

// Function to select a sticker and use it as the current tool
function selectSticker(sticker: string) {
  currentTool = sticker; // Set the current tool to the sticker
  currentCommand = null; // Reset current command
}
