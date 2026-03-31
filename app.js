const state = {
  image: null,
  imageUrl: null,
  bubbles: [],
  selectedId: null,
  nextId: 1,
};

const el = {
  imageLoader: document.getElementById('imageLoader'),
  addBubbleBtn: document.getElementById('addBubbleBtn'),
  exportBtn: document.getElementById('exportBtn'),
  bgImage: document.getElementById('bgImage'),
  workspace: document.getElementById('workspace'),
  bubbleLayer: document.getElementById('bubbleLayer'),
  shape: document.getElementById('shape'),
  lineWidth: document.getElementById('lineWidth'),
  lineColor: document.getElementById('lineColor'),
  bgColor: document.getElementById('bgColor'),
  bgOpacity: document.getElementById('bgOpacity'),
  fontColor: document.getElementById('fontColor'),
  fontSize: document.getElementById('fontSize'),
  fontFamily: document.getElementById('fontFamily'),
  textAlign: document.getElementById('textAlign'),
};

const controls = [
  'shape',
  'lineWidth',
  'lineColor',
  'bgColor',
  'bgOpacity',
  'fontColor',
  'fontSize',
  'fontFamily',
  'textAlign',
];

function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace('#', '');
  const chunk = cleanHex.length === 3
    ? cleanHex.split('').map((x) => `${x}${x}`).join('')
    : cleanHex;
  const int = Number.parseInt(chunk, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function bubbleDefaults() {
  return {
    id: state.nextId++,
    x: 48,
    y: 48,
    width: 260,
    height: 150,
    shape: 'speech-left',
    lineWidth: 3,
    lineColor: '#111111',
    bgColor: '#ffffff',
    bgOpacity: 1,
    fontColor: '#111111',
    fontSize: 28,
    fontFamily: "'Comic Sans MS', 'Comic Neue', cursive",
    textAlign: 'center',
    text: 'Double-click to edit',
  };
}

function getSelectedBubble() {
  return state.bubbles.find((b) => b.id === state.selectedId);
}

function setSelected(id) {
  state.selectedId = id;
  render();
}

function syncControls() {
  const bubble = getSelectedBubble();
  const disabled = !bubble;
  controls.forEach((id) => {
    el[id].disabled = disabled;
  });
  if (!bubble) return;

  el.shape.value = bubble.shape;
  el.lineWidth.value = bubble.lineWidth;
  el.lineColor.value = bubble.lineColor;
  el.bgColor.value = bubble.bgColor;
  el.bgOpacity.value = bubble.bgOpacity;
  el.fontColor.value = bubble.fontColor;
  el.fontSize.value = bubble.fontSize;
  el.fontFamily.value = bubble.fontFamily;
  el.textAlign.value = bubble.textAlign;
}

function bubbleClipPath(shape) {
  if (shape === 'scream') {
    return 'polygon(10% 0%, 20% 8%, 30% 0%, 40% 8%, 50% 0%, 60% 8%, 70% 0%, 80% 8%, 90% 0%, 100% 10%, 92% 20%, 100% 30%, 92% 40%, 100% 50%, 92% 60%, 100% 70%, 92% 80%, 100% 90%, 90% 100%, 80% 92%, 70% 100%, 60% 92%, 50% 100%, 40% 92%, 30% 100%, 20% 92%, 10% 100%, 0% 90%, 8% 80%, 0% 70%, 8% 60%, 0% 50%, 8% 40%, 0% 30%, 8% 20%, 0% 10%)';
  }
  return 'none';
}

function styleBubbleElement(node, bubble) {
  node.style.left = `${bubble.x}px`;
  node.style.top = `${bubble.y}px`;
  node.style.width = `${bubble.width}px`;
  node.style.height = `${bubble.height}px`;
  node.style.border = `${bubble.lineWidth}px solid ${bubble.lineColor}`;
  node.style.backgroundColor = hexToRgba(bubble.bgColor, bubble.bgOpacity);
  node.style.borderRadius = bubble.shape === 'scream' ? '0' : '24px';
  node.style.clipPath = bubbleClipPath(bubble.shape);

  const textEl = node.querySelector('.text');
  textEl.style.color = bubble.fontColor;
  textEl.style.fontSize = `${bubble.fontSize}px`;
  textEl.style.fontFamily = bubble.fontFamily;
  textEl.style.textAlign = bubble.textAlign;

  const tail = node.querySelector('.tail');
  if (bubble.shape === 'speech-left' || bubble.shape === 'speech-right') {
    tail.style.display = 'block';
    tail.style.borderTop = `${Math.max(16, bubble.lineWidth * 4)}px solid ${hexToRgba(bubble.bgColor, bubble.bgOpacity)}`;
    tail.style.borderLeft = `${Math.max(14, bubble.lineWidth * 4)}px solid transparent`;
    tail.style.borderRight = `${Math.max(14, bubble.lineWidth * 4)}px solid transparent`;
    tail.style.borderBottom = '0';
    tail.style.bottom = `${-Math.max(15, bubble.lineWidth * 3)}px`;
    if (bubble.shape === 'speech-left') {
      tail.style.left = '20px';
      tail.style.right = 'auto';
    } else {
      tail.style.right = '20px';
      tail.style.left = 'auto';
    }
  } else {
    tail.style.display = 'none';
  }
}

function createBubbleNode(bubble) {
  const node = document.createElement('div');
  node.className = 'bubble';
  node.dataset.id = bubble.id;
  node.innerHTML = `
    <div class="tail"></div>
    <div class="text" contenteditable="true"></div>
    <div class="resize" title="Resize"></div>
  `;

  const textEl = node.querySelector('.text');
  textEl.innerText = bubble.text;

  textEl.addEventListener('input', () => {
    bubble.text = textEl.innerText;
  });

  textEl.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
  });

  node.addEventListener('dblclick', () => {
    textEl.focus();
  });

  node.addEventListener('pointerdown', (event) => {
    if (event.target.classList.contains('resize')) return;
    if (event.target === textEl && document.activeElement === textEl) return;
    event.stopPropagation();
    setSelected(bubble.id);

    const offsetX = event.clientX - bubble.x;
    const offsetY = event.clientY - bubble.y;

    const onMove = (moveEvent) => {
      bubble.x = Math.max(0, moveEvent.clientX - offsetX);
      bubble.y = Math.max(0, moveEvent.clientY - offsetY);
      node.style.left = `${bubble.x}px`;
      node.style.top = `${bubble.y}px`;
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  const resize = node.querySelector('.resize');
  resize.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    setSelected(bubble.id);

    const startX = event.clientX;
    const startY = event.clientY;
    const baseW = bubble.width;
    const baseH = bubble.height;

    const onMove = (moveEvent) => {
      bubble.width = Math.max(90, baseW + (moveEvent.clientX - startX));
      bubble.height = Math.max(55, baseH + (moveEvent.clientY - startY));
      node.style.width = `${bubble.width}px`;
      node.style.height = `${bubble.height}px`;
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  return node;
}

function render() {
  el.bubbleLayer.innerHTML = '';
  state.bubbles.forEach((bubble) => {
    const node = createBubbleNode(bubble);
    styleBubbleElement(node, bubble);
    if (bubble.id === state.selectedId) {
      node.classList.add('selected');
    }
    el.bubbleLayer.appendChild(node);
  });
  syncControls();
}

function addBubble() {
  const bubble = bubbleDefaults();
  state.bubbles.push(bubble);
  state.selectedId = bubble.id;
  render();
}

function applyControlChange() {
  const bubble = getSelectedBubble();
  if (!bubble) return;

  bubble.shape = el.shape.value;
  bubble.lineWidth = Number(el.lineWidth.value);
  bubble.lineColor = el.lineColor.value;
  bubble.bgColor = el.bgColor.value;
  bubble.bgOpacity = Number(el.bgOpacity.value);
  bubble.fontColor = el.fontColor.value;
  bubble.fontSize = Number(el.fontSize.value);
  bubble.fontFamily = el.fontFamily.value;
  bubble.textAlign = el.textAlign.value;

  render();
}

async function loadImage(file) {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  const src = URL.createObjectURL(file);
  const img = new Image();

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });

  state.image = img;
  state.imageUrl = src;
  el.bgImage.src = src;
  el.bgImage.hidden = false;
  el.workspace.style.width = `${img.naturalWidth}px`;
  el.workspace.style.height = `${img.naturalHeight}px`;
  el.bubbleLayer.style.width = `${img.naturalWidth}px`;
  el.bubbleLayer.style.height = `${img.naturalHeight}px`;
  el.addBubbleBtn.disabled = false;
  el.exportBtn.disabled = false;
  if (state.bubbles.length === 0) addBubble();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function screamPoints(x, y, w, h) {
  const points = [
    [10, 0], [20, 8], [30, 0], [40, 8], [50, 0], [60, 8], [70, 0], [80, 8], [90, 0],
    [100, 10], [92, 20], [100, 30], [92, 40], [100, 50], [92, 60], [100, 70], [92, 80], [100, 90],
    [90, 100], [80, 92], [70, 100], [60, 92], [50, 100], [40, 92], [30, 100], [20, 92], [10, 100],
    [0, 90], [8, 80], [0, 70], [8, 60], [0, 50], [8, 40], [0, 30], [8, 20], [0, 10],
  ];
  return points.map(([px, py]) => [x + (px / 100) * w, y + (py / 100) * h]);
}

function wrapTextLines(ctx, text, maxWidth) {
  const wrapped = [];
  text.split('\n').forEach((line) => {
    if (!line) {
      wrapped.push('');
      return;
    }
    const tokens = line.split(/(\s+)/).filter(Boolean);
    let current = '';
    tokens.forEach((token) => {
      const next = `${current}${token}`;
      if (ctx.measureText(next).width <= maxWidth) {
        current = next;
        return;
      }
      if (current.trim()) {
        wrapped.push(current.trimEnd());
        current = '';
      }
      if (ctx.measureText(token).width <= maxWidth) {
        current = token.trimStart();
        return;
      }
      let fragment = '';
      Array.from(token).forEach((char) => {
        const candidate = `${fragment}${char}`;
        if (ctx.measureText(candidate).width > maxWidth && fragment) {
          wrapped.push(fragment);
          fragment = char;
        } else {
          fragment = candidate;
        }
      });
      current = fragment;
    });
    wrapped.push(current.trimEnd());
  });
  return wrapped;
}

function drawBubbleToCanvas(ctx, bubble) {
  const x = bubble.x;
  const y = bubble.y;
  const w = bubble.width;
  const h = bubble.height;

  ctx.lineWidth = bubble.lineWidth;
  ctx.strokeStyle = bubble.lineColor;
  ctx.fillStyle = hexToRgba(bubble.bgColor, bubble.bgOpacity);

  if (bubble.shape === 'scream') {
    const points = screamPoints(x, y, w, h);
    ctx.beginPath();
    points.forEach(([px, py], index) => {
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    roundedRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.stroke();

    if (bubble.shape === 'speech-left' || bubble.shape === 'speech-right') {
      const tailH = 22;
      ctx.beginPath();
      if (bubble.shape === 'speech-left') {
        ctx.moveTo(x + 26, y + h);
        ctx.lineTo(x + 8, y + h + tailH);
        ctx.lineTo(x + 50, y + h);
      } else {
        ctx.moveTo(x + w - 26, y + h);
        ctx.lineTo(x + w - 8, y + h + tailH);
        ctx.lineTo(x + w - 50, y + h);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.fillStyle = bubble.fontColor;
  ctx.textAlign = bubble.textAlign;
  ctx.textBaseline = 'top';
  ctx.font = `${bubble.fontSize}px ${bubble.fontFamily}`;

  const lines = wrapTextLines(ctx, bubble.text, w - 32);
  const xText = bubble.textAlign === 'left' ? x + 16 : bubble.textAlign === 'right' ? x + w - 16 : x + w / 2;
  let yText = y + 16;
  lines.forEach((line) => {
    ctx.fillText(line, xText, yText, w - 32);
    yText += bubble.fontSize * 1.2;
  });
}

function exportPng() {
  if (!state.image) return;
  const canvas = document.createElement('canvas');
  canvas.width = state.image.naturalWidth;
  canvas.height = state.image.naturalHeight;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(state.image, 0, 0);
  state.bubbles.forEach((bubble) => drawBubbleToCanvas(ctx, bubble));

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'comic-design.png';
  link.click();
}

el.imageLoader.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) loadImage(file);
});

el.addBubbleBtn.addEventListener('click', addBubble);
el.exportBtn.addEventListener('click', exportPng);
controls.forEach((id) => {
  el[id].addEventListener('input', applyControlChange);
  el[id].addEventListener('change', applyControlChange);
});

el.bubbleLayer.addEventListener('pointerdown', () => {
  state.selectedId = null;
  render();
});

syncControls();
