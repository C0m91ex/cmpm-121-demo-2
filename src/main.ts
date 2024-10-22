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

// Track whether the user is drawing
let isDrawing = false;

// Event listeners for drawing
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx?.beginPath();
  ctx?.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    ctx?.lineTo(e.offsetX, e.offsetY);
    ctx?.stroke();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx?.closePath();
});

// Create and append the clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
clearButton.addEventListener("click", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
});
app.appendChild(clearButton);