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

// Store the user's drawing data (each line is an array of points)
let drawing: { x: number; y: number }[][] = [];
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
  currentLine = [{ x: e.offsetX, y: e.offsetY }]; 
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    currentLine.push({ x: e.offsetX, y: e.offsetY });
    dispatchDrawingChangedEvent(); 
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing) {
    drawing.push(currentLine); 
    isDrawing = false;
    dispatchDrawingChangedEvent(); 
  }
});

// Observer for "drawing-changed" event to redraw the canvas
canvas.addEventListener("drawing-changed", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height); 

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
  drawing = []; 
  dispatchDrawingChangedEvent(); 
});
app.appendChild(clearButton);