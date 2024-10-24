import "./style.css";

const APP_NAME = "Sketch Pad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// Create and append the app title (h1)
const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

// Create and append the canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchCanvas";
app.appendChild(canvas);

const ctx = canvas.getContext("2d");

// MarkerLine class to represent lines with thickness
class MarkerLine {
  private points: { x: number; y: number }[];
  private thickness: number;

  constructor(initialPoint: { x: number; y: number }, thickness: number) {
    this.points = [initialPoint]; // Start with the initial point
    this.thickness = thickness;   // Set the thickness for the line
  }

  drag(x: number, y: number) {
    // Add the next point in the line as the mouse moves
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.lineWidth = this.thickness; // Set the line thickness
      ctx.stroke();
      ctx.closePath();
    }
  }
}

// ToolPreview class to display a preview of the tool (circle)
class ToolPreview {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2); // Draw a circle preview
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();
  }
}

// Store the user's drawing data and redo stack using MarkerLine instances
let drawing: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

// Track whether the user is drawing and the current line thickness
let isDrawing = false;
let currentThickness = 1; // Default thickness for "thin"
let toolPreview: ToolPreview | null = null; // Nullable reference for tool preview

// Function to dispatch the "drawing-changed" event
const dispatchDrawingChangedEvent = () => {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
};

// Event listeners for drawing
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = new MarkerLine({ x: e.offsetX, y: e.offsetY }, currentThickness); // Create a new MarkerLine with current thickness
  redoStack = []; // Clear the redo stack on new drawing action
  toolPreview = null; // Hide tool preview while drawing
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentLine) {
    currentLine.drag(e.offsetX, e.offsetY); // Extend the current line
    dispatchDrawingChangedEvent(); // Dispatch event on every new point
  } else {
    // Update tool preview when the mouse moves (if not drawing)
    if (!toolPreview) {
      toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness); // Create tool preview on first move
    } else {
      toolPreview.updatePosition(e.offsetX, e.offsetY); // Update position
    }
    dispatchToolMovedEvent(); // Dispatch tool-moved event
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentLine) {
    drawing.push(currentLine); // Save the completed line to the drawing
    isDrawing = false;
    currentLine = null; // Reset current line
    dispatchDrawingChangedEvent(); // Final event to signal drawing completed
  }
});

// Observer for "drawing-changed" event to redraw the canvas
canvas.addEventListener("drawing-changed", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Redraw all lines from the saved drawing data
  drawing.forEach((line) => {
    line.display(ctx!); // Call the display method on each MarkerLine
  });
});

// Function to dispatch the "tool-moved" event
const dispatchToolMovedEvent = () => {
  const event = new Event("tool-moved");
  canvas.dispatchEvent(event);
};

// Observer for "tool-moved" event to redraw the tool preview
canvas.addEventListener("tool-moved", () => {
  if (!isDrawing && toolPreview) {
    toolPreview.draw(ctx!); // Draw the tool preview circle if not drawing
  }
});

// Create and append the clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
clearButton.addEventListener("click", () => {
  drawing = []; // Clear the drawing data
  redoStack = []; // Clear the redo stack
  dispatchDrawingChangedEvent(); // Redraw the canvas (now empty)
});
app.appendChild(clearButton);

// Create and append the undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
  if (drawing.length > 0) {
    const lastLine = drawing.pop(); // Remove the most recent line
    redoStack.push(lastLine!); // Add the removed line to the redo stack
    dispatchDrawingChangedEvent(); // Redraw the canvas
  }
});
app.appendChild(undoButton);

// Create and append the redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const lastRedoLine = redoStack.pop(); // Remove the most recent line from the redo stack
    drawing.push(lastRedoLine!); // Add it back to the drawing
    dispatchDrawingChangedEvent(); // Redraw the canvas
  }
});
app.appendChild(redoButton);

// Create and append the "thin" button
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
thinButton.addEventListener("click", () => {
  currentThickness = 1; // Set thickness to 1 for thin marker
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});
app.appendChild(thinButton);

// Create and append the "thick" button
const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
thickButton.addEventListener("click", () => {
  currentThickness = 5; // Set thickness to 5 for thick marker
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});
app.appendChild(thickButton);