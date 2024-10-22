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

// Store the user's drawing data and redo stack
let drawing: { x: number; y: number }[][] = [];
let redoStack: { x: number; y: number }[][] = [];
let currentLine: { x: number; y: number }[] = [];

// Track whether the user is drawing
let isDrawing = false;

// Function to dispatch the "drawing-changed" event
const dispatchDrawingChangedEvent = () => {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
};

// Event listeners for drawing
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = [{ x: e.offsetX, y: e.offsetY }]; // Start a new line
  redoStack = []; // Clear the redo stack on new drawing action
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    currentLine.push({ x: e.offsetX, y: e.offsetY });
    dispatchDrawingChangedEvent(); // Dispatch event on every new point
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing) {
    drawing.push(currentLine); // Save the completed line to the drawing
    isDrawing = false;
    dispatchDrawingChangedEvent(); // Final event to signal drawing completed
  }
});

// Observer for "drawing-changed" event to redraw the canvas
canvas.addEventListener("drawing-changed", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Redraw all lines from the saved drawing data
  drawing.forEach((line) => {
    ctx?.beginPath();
    ctx?.moveTo(line[0].x, line[0].y);
    for (let i = 1; i < line.length; i++) {
      ctx?.lineTo(line[i].x, line[i].y);
    }
    ctx?.stroke();
    ctx?.closePath();
  });
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