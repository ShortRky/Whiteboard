const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d', { alpha: false });

const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const sizeDisplay = document.getElementById('sizeDisplay');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusMessage = document.getElementById('statusMessage');

let drawing = false;
let currentTool = 'pen';
let brushSize = 3;
let brushColor = '#00ff88';
let lastX = 0, lastY = 0;

// Undo
let undoStack = [];
const MAX_UNDO = 50;

function resize() {
    const parent = canvas.parentElement;
    if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
        const saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.putImageData(saved, 0, 0);
    }
}

function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
}

function start(e) {
    e.preventDefault();
    drawing = true;
    const p = getPos(e);
    lastX = p.x;
    lastY = p.y;
    
    if (undoStack.length >= MAX_UNDO) undoStack.shift();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    // Set drawing style based on tool
    if (currentTool === 'eraser') {
        ctx.strokeStyle = '#1a1f3a';
    } else {
        ctx.strokeStyle = brushColor;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw initial dot
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
}

function move(e) {
    if (!drawing) return;
    e.preventDefault();
    
    const p = getPos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    
    if (currentTool === 'eraser') {
        ctx.strokeStyle = '#1a1f3a';
        ctx.lineWidth = brushSize * 2;
    } else {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
    }
    
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
}

function stop(e) {
    if (!drawing) return;
    drawing = false;
}

function fillBg(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function clear() {
    undoStack = [];
    fillBg('#1a1f3a');
    setStatus('Cleared');
}

function save() {
    try {
        localStorage.setItem('wb-save', canvas.toDataURL('image/png'));
        setStatus('Saved ✓');
    } catch (e) {
        setStatus('Save failed');
    }
}

function load() {
    const data = localStorage.getItem('wb-save');
    if (data) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            setStatus('Loaded ✓');
        };
        img.src = data;
    } else {
        setStatus('Nothing saved');
    }
}

function download() {
    const a = document.createElement('a');
    a.download = `whiteboard-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    setStatus('Downloaded ✓');
}

function undo() {
    if (undoStack.length > 0) {
        const prev = undoStack.pop();
        ctx.putImageData(prev, 0, 0);
        setStatus('Undo');
    }
}

function setStatus(msg) {
    statusMessage.textContent = msg;
    setTimeout(() => updateStatusBar(), 1500);
}

function updateStatusBar() {
    statusMessage.textContent = `Tool: ${currentTool.toUpperCase()} | Color: ${brushColor} | Size: ${brushSize}px`;
}

function setTool(tool) {
    currentTool = tool;
    penBtn.classList.toggle('active', tool === 'pen');
    eraserBtn.classList.toggle('active', tool === 'eraser');
    updateStatusBar();
}

// Events
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', move);
canvas.addEventListener('mouseup', stop);
canvas.addEventListener('mouseleave', stop);

canvas.addEventListener('touchstart', start, { passive: false });
canvas.addEventListener('touchmove', move, { passive: false });
canvas.addEventListener('touchend', stop, { passive: false });

penBtn.onclick = () => setTool('pen');
eraserBtn.onclick = () => setTool('eraser');

colorPicker.oninput = (e) => {
    brushColor = e.target.value;
    if (currentTool === 'eraser') setTool('pen');
    updateStatusBar();
};

sizePicker.oninput = (e) => {
    brushSize = parseInt(e.target.value);
    sizeDisplay.textContent = brushSize;
    updateStatusBar();
};

clearBtn.onclick = clear;
saveBtn.onclick = save;
loadBtn.onclick = load;
downloadBtn.onclick = download;

window.addEventListener('resize', () => {
    clearTimeout(window.rs);
    window.rs = setTimeout(resize, 100);
});

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        save();
    }
});

// Init
resize();
fillBg('#1a1f3a');
updateStatusBar();
setTool('pen');
