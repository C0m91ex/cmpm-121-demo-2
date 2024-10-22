import "./style.css";

const APP_NAME = "Etcha A Sketch Pad";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Set the title of the webpage
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