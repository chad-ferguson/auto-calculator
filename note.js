// note.js

// -------------------- Global Variables --------------------
let drawingHistory = [];
window.drawingHistory = drawingHistory;

// -------------------- Canvas Setup --------------------
const gridCanvas = document.getElementById("grid-canvas");
const drawingCanvas = document.getElementById("drawing-canvas");
// We'll use the drawing canvas for our drawing operations.
const canvas = drawingCanvas;
const ctx = canvas.getContext("2d");

const toolButtons = document.querySelectorAll(".tool-button");
const sizeSlider = document.getElementById("size-slider");
const colorOptions = document.querySelectorAll(".color-option");
const clearCanvas = document.querySelector(".clear-canvas");
const currentColorDisplay = document.querySelector(".current-color");
const dragModeBtn = document.getElementById("drag-mode");

// -------------------- Panning Variables --------------------
let isDraggingCanvas = false;
let isDragMode = false;
let dragStartX = 0;
let dragStartY = 0;
let canvasOffsetX = 0;
let canvasOffsetY = 0;
const gridSize = 40;

// -------------------- Drawing Settings --------------------
let isDrawing = false;
let selectedTool = "brush";
let brushWidth = 5;
let selectedColor = "#000";
let recentColors = [];
let pendingColor = null;

// -------------------- Utility Functions --------------------
function getCanvasCoordinates(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function rgbToHex(rgb) {
  if (rgb === 'rgba(0, 0, 0, 0)') return null;
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return '#000000';
  return '#' + [match[1], match[2], match[3]]
    .map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function addToRecentColors(color) {
  if (!color) return;
  recentColors = recentColors.filter(c => c !== color);
  recentColors.unshift(color);
  if (recentColors.length > 3) recentColors.pop();
  updateRecentColors();
}

function updateRecentColors() {
  document.querySelectorAll('.recent-color').forEach((el, index) => {
    if (recentColors[index]) {
      el.style.backgroundColor = recentColors[index];
      el.dataset.hasColor = true;
    } else {
      el.style.backgroundColor = 'transparent';
      delete el.dataset.hasColor;
    }
  });
}

// -------------------- Redraw Function --------------------
// This redraws the drawing canvas only. The grid canvas remains unchanged except for its background position.
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawingHistory.forEach(stroke => {
    ctx.save();
    if (stroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach(pt => {
      ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  });
}

// -------------------- Color Picker Implementation --------------------
const pickr = Pickr.create({
  el: '.pickr-button',
  theme: 'classic',
  default: '#CC33AE',
  swatches: [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', 
    '#0000FF', '#FFFF00', '#FF00FF', '#FFA500', 
    '#800080', '#00FFFF', '#964B00'
  ],
  components: {
    preview: true,
    opacity: false,
    hue: true,
  },
  strings: { save: 'Apply' },
  container: '#color-display',
  position: 'bottom-start'
});

pickr.on('save', (color) => {
  if (color) {
    pendingColor = color.toHEXA().toString();
    selectedColor = pendingColor;
    currentColorDisplay.style.backgroundColor = selectedColor;
  }
});

pickr.on('change', (color) => {
  selectedColor = color.toHEXA().toString();
  currentColorDisplay.style.backgroundColor = selectedColor;
  pickr.applyColor();
});

// -------------------- Drawing Functions --------------------
// Each stroke is stored as: { color, width, points: [{x, y}], isEraser }
const startDraw = (e) => {
  if (isDragMode) return;
  const pos = getCanvasCoordinates(e.clientX, e.clientY);
  if (selectedTool === "brush" && pendingColor) {
    addToRecentColors(pendingColor);
    pendingColor = null;
  }
  isDrawing = true;
  const newStroke = {
    color: selectedTool === "eraser" ? "#fff" : selectedColor,
    width: brushWidth,
    points: [{ x: pos.x, y: pos.y }],
    isEraser: selectedTool === "eraser"
  };
  drawingHistory.push(newStroke);
};

const draw = (e) => {
  if (!isDrawing || isDragMode) return;
  const pos = getCanvasCoordinates(e.clientX, e.clientY);
  const currentStroke = drawingHistory[drawingHistory.length - 1];
  currentStroke.points.push({ x: pos.x, y: pos.y });
  redrawCanvas();
};

const stopDraw = () => {
  isDrawing = false;
  ctx.beginPath();
};

// -------------------- Canvas Event Handlers --------------------
// For drawing operations we use the drawingCanvas.
drawingCanvas.addEventListener('mousedown', (e) => {
  if (isDragMode) {
    isDraggingCanvas = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    drawingCanvas.style.cursor = 'grabbing';
  } else {
    startDraw(e);
  }
});

drawingCanvas.addEventListener('mousemove', (e) => {
  if (isDraggingCanvas) {
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    canvasOffsetX += deltaX;
    canvasOffsetY += deltaY;
    // Update grid canvas background so that the grid moves along
    gridCanvas.style.backgroundPosition = `${canvasOffsetX % gridSize}px ${canvasOffsetY % gridSize}px`;
    // Also update every point in drawing history (panning the drawing)
    drawingHistory.forEach(stroke => {
      stroke.points = stroke.points.map(pt => ({
        x: pt.x + deltaX,
        y: pt.y + deltaY
      }));
    });
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    redrawCanvas();
  } else {
    draw(e);
  }
});

drawingCanvas.addEventListener("mouseup", () => {
  stopDraw();
  if (isDraggingCanvas) {
    isDraggingCanvas = false;
    drawingCanvas.style.cursor = 'default';
  }
});
drawingCanvas.addEventListener("mouseout", stopDraw);
drawingCanvas.addEventListener("mouseleave", () => {
  stopDraw();
  if (isDraggingCanvas) {
    isDraggingCanvas = false;
    drawingCanvas.style.cursor = 'default';
  }
});

// Touch events for mobile devices (applied to drawingCanvas)
drawingCanvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  startDraw(touch);
});
drawingCanvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  draw(touch);
});
drawingCanvas.addEventListener("touchend", stopDraw);

// -------------------- Additional UI Event Handlers --------------------

// Clear Canvas button: clears only the drawing layer.
clearCanvas.addEventListener("click", () => {
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  drawingHistory.length = 0;
  noteManager.saveNote();
});

// Brush Size Slider
sizeSlider.addEventListener("input", () => brushWidth = sizeSlider.value);

// Tool Buttons
toolButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector('.tool-button.active').classList.remove('active');
    btn.classList.add("active");
    selectedTool = btn.id;
  });
});

// Color Options
colorOptions.forEach(option => {
  option.addEventListener("click", (e) => {
    if (option.classList.contains('recent-color')) return;
    if (option.id !== 'custom-color-picker') {
      const newColor = getComputedStyle(option).backgroundColor;
      if (newColor === 'rgba(0, 0, 0, 0)') return;
      selectedColor = rgbToHex(newColor);
      currentColorDisplay.style.backgroundColor = selectedColor;
    } else {
      pickr.show();
    }
  });
});

// Color Dropdown Hover
let hoverTimeout;
document.querySelector('.color-display').addEventListener('mouseenter', () => {
  clearTimeout(hoverTimeout);
  document.querySelector('.color-dropdown').style.opacity = '1';
  document.querySelector('.color-dropdown').style.visibility = 'visible';
});
document.querySelector('.color-display').addEventListener('mouseleave', () => {
  hoverTimeout = setTimeout(() => {
    document.querySelector('.color-dropdown').style.opacity = '0';
    document.querySelector('.color-dropdown').style.visibility = 'hidden';
  }, 300);
});
document.querySelector('.color-dropdown').addEventListener('mouseenter', () => {
  clearTimeout(hoverTimeout);
});
document.querySelector('.color-dropdown').addEventListener('mouseleave', () => {
  hoverTimeout = setTimeout(() => {
    document.querySelector('.color-dropdown').style.opacity = '0';
    document.querySelector('.color-dropdown').style.visibility = 'hidden';
  }, 300);
});

// Recent Colors Click Handling
document.querySelectorAll('.recent-color').forEach((el, index) => {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (recentColors[index]) {
      const clickedColor = recentColors[index];
      recentColors = recentColors.filter(c => c !== clickedColor);
      recentColors.unshift(clickedColor);
      if (recentColors.length > 3) recentColors.pop();
      updateRecentColors();
    }
  });
});

// -------------------- Drag Mode Toggle --------------------
dragModeBtn.addEventListener("click", () => {
  isDragMode = !isDragMode;
  dragModeBtn.classList.toggle("active", isDragMode);
});

// -------------------- Canvas Initialization --------------------
window.addEventListener("load", () => {
  drawingCanvas.width = drawingCanvas.offsetWidth;
  drawingCanvas.height = drawingCanvas.offsetHeight;
  gridCanvas.width = gridCanvas.offsetWidth;
  gridCanvas.height = gridCanvas.offsetHeight;
});

window.addEventListener("resize", () => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = drawingCanvas.width;
  tempCanvas.height = drawingCanvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(drawingCanvas, 0, 0);
  drawingCanvas.width = drawingCanvas.offsetWidth;
  drawingCanvas.height = drawingCanvas.offsetHeight;
  ctx.drawImage(tempCanvas, 0, 0);
});

// -------------------- Note Manager --------------------
// All canvas and utility functions are now defined, so we define NoteManager.

class NoteManager {
  constructor() {
    this.noteId = new URLSearchParams(window.location.search).get('id');
    this.noteData = JSON.parse(localStorage.getItem(this.noteId)) || {
      id: this.noteId,
      title: 'Untitled Note',
      timestamp: new Date().toISOString(),
      drawingHistory: []
    };
    this.initialize();
  }

  initialize() {
    document.getElementById('noteTitle').value = this.noteData.title;
    document.getElementById('saveExitBtn').addEventListener('click', () => {
      this.saveNote();
      window.location.href = 'index.html';
    });
    setInterval(() => this.saveNote(), 5000);

    if (this.noteData.drawingHistory.length > 0) {
      window.drawingHistory = this.noteData.drawingHistory;
      drawingHistory = window.drawingHistory;
      redrawCanvas();
    } else {
      window.drawingHistory = [];
      drawingHistory = window.drawingHistory;
    }
  }

  saveNote() {
    this.noteData.title = document.getElementById('noteTitle').value;
    this.noteData.timestamp = new Date().toISOString();
    this.noteData.drawingHistory = window.drawingHistory || [];
    localStorage.setItem(this.noteId, JSON.stringify(this.noteData));
  }
}

window.addEventListener("load", () => {
  new NoteManager();
});
