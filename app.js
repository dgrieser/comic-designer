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
  togglePanelBtn: document.getElementById('togglePanelBtn'),
  panel: document.querySelector('.panel'),
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
const bubbleNodes = new Map();

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

function cloneBubble(bubble) {
  return {
    ...bubble,
    id: state.nextId++,
    x: bubble.x + 26,
    y: bubble.y + 26,
  };
}

function getSelectedBubble() {
  return state.bubbles.find((b) => b.id === state.selectedId);
}

function setSelected(id) {
  state.selectedId = id;
  const index = state.bubbles.findIndex((bubble) => bubble.id === id);
  if (index > -1 && index !== state.bubbles.length - 1) {
    const [bubble] = state.bubbles.splice(index, 1);
    state.bubbles.push(bubble);
    render();
    return;
  }
  updateSelectionUI();
  syncControls();
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
  return 'none';
}

function bubbleSvgPath(shape) {
  if (shape !== 'scream') return '';
  return 'M 12 20 L 26 12 L 37 20 L 50 9 L 63 20 L 76 10 L 89 21 L 102 8 L 116 22 L 132 12 L 138 26 L 152 23 L 150 38 L 164 44 L 153 54 L 162 66 L 148 71 L 151 84 L 137 86 L 134 100 L 120 94 L 113 108 L 101 99 L 90 111 L 78 99 L 66 110 L 57 97 L 43 106 L 36 92 L 22 96 L 20 82 L 6 80 L 11 66 L 0 56 L 14 48 L 4 36 L 18 31 L 12 20 Z M 103 97 L 126 134 L 103 118 L 85 140 L 89 113 L 64 122 L 82 101 Z';
}

function styleBubbleElement(node, bubble) {
  node.style.left = `${bubble.x}px`;
  node.style.top = `${bubble.y}px`;
  node.style.width = `${bubble.width}px`;
  node.style.height = `${bubble.height}px`;
  const isScream = bubble.shape === 'scream';
  node.classList.toggle('scream', isScream);
  node.style.border = isScream ? 'none' : `${bubble.lineWidth}px solid ${bubble.lineColor}`;
  node.style.backgroundColor = isScream ? 'transparent' : hexToRgba(bubble.bgColor, bubble.bgOpacity);
  node.style.borderRadius = bubble.shape === 'intro' ? '20px' : '24px';
  node.style.clipPath = bubbleClipPath(bubble.shape);

  const textEl = node.querySelector('.text');
  textEl.style.color = bubble.fontColor;
  textEl.style.fontSize = `${bubble.fontSize}px`;
  textEl.style.fontFamily = bubble.fontFamily;
  textEl.style.textAlign = bubble.textAlign;

  const tail = node.querySelector('.tail');
  const tailOutline = node.querySelector('.tail-outline');
  if (bubble.shape === 'speech-left' || bubble.shape === 'speech-right') {
    tail.style.display = 'block';
    tailOutline.style.display = 'block';
    tailOutline.style.borderTop = `${Math.max(18, bubble.lineWidth * 4.8)}px solid ${bubble.lineColor}`;
    tailOutline.style.borderLeft = `${Math.max(16, bubble.lineWidth * 4.6)}px solid transparent`;
    tailOutline.style.borderRight = `${Math.max(16, bubble.lineWidth * 4.6)}px solid transparent`;
    tailOutline.style.borderBottom = '0';
    tailOutline.style.bottom = `${-Math.max(18, bubble.lineWidth * 3.6)}px`;

    tail.style.borderTop = `${Math.max(16, bubble.lineWidth * 4)}px solid ${hexToRgba(bubble.bgColor, bubble.bgOpacity)}`;
    tail.style.borderLeft = `${Math.max(14, bubble.lineWidth * 4)}px solid transparent`;
    tail.style.borderRight = `${Math.max(14, bubble.lineWidth * 4)}px solid transparent`;
    tail.style.borderBottom = '0';
    tail.style.bottom = `${-Math.max(15, bubble.lineWidth * 3)}px`;
    if (bubble.shape === 'speech-left') {
      tail.style.left = '20px';
      tail.style.right = 'auto';
      tailOutline.style.left = '18px';
      tailOutline.style.right = 'auto';
    } else {
      tail.style.right = '20px';
      tail.style.left = 'auto';
      tailOutline.style.right = '18px';
      tailOutline.style.left = 'auto';
    }
  } else {
    tail.style.display = 'none';
    tailOutline.style.display = 'none';
  }

  const shapePath = node.querySelector('.shape-path');
  if (shapePath) {
    shapePath.setAttribute('d', bubbleSvgPath(bubble.shape));
    shapePath.setAttribute('fill', hexToRgba(bubble.bgColor, bubble.bgOpacity));
    shapePath.setAttribute('stroke', bubble.lineColor);
    shapePath.setAttribute('stroke-width', String(bubble.lineWidth));
  }
}

function createBubbleNode(bubble) {
  const node = document.createElement('div');
  node.className = 'bubble';
  node.dataset.id = bubble.id;
  node.innerHTML = `
    <div class="bubble-controls">
      <button class="bubble-control duplicate" type="button" title="Duplicate bubble">⧉</button>
      <button class="bubble-control remove" type="button" title="Remove bubble">✕</button>
    </div>
    <svg class="shape-svg" viewBox="0 0 164 140" preserveAspectRatio="none" aria-hidden="true">
      <path class="shape-path"></path>
    </svg>
    <div class="tail-outline"></div>
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

  const duplicateBtn = node.querySelector('.duplicate');
  duplicateBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    duplicateBubbleById(bubble.id);
  });

  const removeBtn = node.querySelector('.remove');
  removeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    removeBubbleById(bubble.id);
  });

  node.addEventListener('pointerdown', (event) => {
    if (event.target.classList.contains('resize')) return;
    if (event.target.closest('.bubble-controls')) return;
    if (event.target === textEl && document.activeElement === textEl) return;
    event.stopPropagation();
    setSelected(bubble.id);
    const activeNode = bubbleNodes.get(bubble.id) || node;

    const offsetX = event.clientX - bubble.x;
    const offsetY = event.clientY - bubble.y;

    const onMove = (moveEvent) => {
      bubble.x = Math.max(0, moveEvent.clientX - offsetX);
      bubble.y = Math.max(0, moveEvent.clientY - offsetY);
      activeNode.style.left = `${bubble.x}px`;
      activeNode.style.top = `${bubble.y}px`;
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
    const activeNode = bubbleNodes.get(bubble.id) || node;

    const startX = event.clientX;
    const startY = event.clientY;
    const baseW = bubble.width;
    const baseH = bubble.height;

    const onMove = (moveEvent) => {
      bubble.width = Math.max(90, baseW + (moveEvent.clientX - startX));
      bubble.height = Math.max(55, baseH + (moveEvent.clientY - startY));
      activeNode.style.width = `${bubble.width}px`;
      activeNode.style.height = `${bubble.height}px`;
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

function updateSelectionUI() {
  bubbleNodes.forEach((node, id) => {
    node.classList.toggle('selected', id === state.selectedId);
  });
}

function render() {
  const activeIds = new Set();
  state.bubbles.forEach((bubble) => {
    activeIds.add(bubble.id);
    let node = bubbleNodes.get(bubble.id);
    if (!node) {
      node = createBubbleNode(bubble);
      bubbleNodes.set(bubble.id, node);
    }
    styleBubbleElement(node, bubble);
    el.bubbleLayer.appendChild(node);
  });
  bubbleNodes.forEach((node, id) => {
    if (!activeIds.has(id)) {
      node.remove();
      bubbleNodes.delete(id);
    }
  });
  updateSelectionUI();
  syncControls();
}

function addBubble() {
  const bubble = bubbleDefaults();
  state.bubbles.push(bubble);
  state.selectedId = bubble.id;
  render();
}

function removeBubbleById(id) {
  const index = state.bubbles.findIndex((bubble) => bubble.id === id);
  if (index === -1) return;
  state.bubbles.splice(index, 1);
  if (state.selectedId === id) {
    state.selectedId = state.bubbles.at(-1)?.id ?? null;
  }
  render();
}

function duplicateBubbleById(id) {
  const bubble = state.bubbles.find((item) => item.id === id);
  if (!bubble) return;
  const duplicate = cloneBubble(bubble);
  state.bubbles.push(duplicate);
  state.selectedId = duplicate.id;
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
  const node = bubbleNodes.get(bubble.id);
  if (node) styleBubbleElement(node, bubble);
  syncControls();
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

function roundedSpeechPath(ctx, x, y, w, h, r, side, tailH) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

  if (side === 'left') {
    ctx.lineTo(x + 48, y + h);
    ctx.lineTo(x + 34, y + h + tailH);
    ctx.lineTo(x + 20, y + h);
  } else {
    ctx.lineTo(x + w - 20, y + h);
    ctx.lineTo(x + w - 34, y + h + tailH);
    ctx.lineTo(x + w - 48, y + h);
  }

  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function screamShapes(x, y, w, h) {
  const outer = [
    [12, 20], [26, 12], [37, 20], [50, 9], [63, 20], [76, 10], [89, 21], [102, 8], [116, 22],
    [132, 12], [138, 26], [152, 23], [150, 38], [164, 44], [153, 54], [162, 66], [148, 71], [151, 84],
    [137, 86], [134, 100], [120, 94], [113, 108], [101, 99], [90, 111], [78, 99], [66, 110], [57, 97],
    [43, 106], [36, 92], [22, 96], [20, 82], [6, 80], [11, 66], [0, 56], [14, 48], [4, 36], [18, 31],
  ];
  const tail = [[103, 97], [126, 134], [103, 118], [85, 140], [89, 113], [64, 122], [82, 101]];
  const scale = ([px, py]) => [x + (px / 164) * w, y + (py / 140) * h];
  return {
    outer: outer.map(scale),
    tail: tail.map(scale),
  };
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
    const { outer, tail } = screamShapes(x, y, w, h);
    ctx.beginPath();
    outer.forEach(([px, py], index) => {
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    tail.forEach(([px, py], index) => {
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    if (bubble.shape === 'speech-left' || bubble.shape === 'speech-right') {
      const tailH = Math.max(16, bubble.lineWidth * 4);
      roundedSpeechPath(ctx, x, y, w, h, 24, bubble.shape === 'speech-left' ? 'left' : 'right', tailH);
    } else {
      roundedRect(ctx, x, y, w, h, bubble.shape === 'intro' ? 20 : 24);
    }
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = bubble.fontColor;
  ctx.textAlign = bubble.textAlign;
  ctx.textBaseline = 'top';
  ctx.font = `${bubble.fontSize}px ${bubble.fontFamily}`;

  const lines = wrapTextLines(ctx, bubble.text, w - 28);
  const xText = bubble.textAlign === 'left' ? x + 14 : bubble.textAlign === 'right' ? x + w - 14 : x + w / 2;
  let yText = y + 14;
  lines.forEach((line) => {
    ctx.fillText(line, xText, yText);
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

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comic-design.png';
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

el.imageLoader.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) loadImage(file).catch((err) => console.error('Failed to load image:', err));
});

el.addBubbleBtn.addEventListener('click', addBubble);
el.exportBtn.addEventListener('click', exportPng);
el.togglePanelBtn.addEventListener('click', () => {
  const collapsed = el.panel.classList.toggle('collapsed');
  el.togglePanelBtn.textContent = collapsed ? 'Show controls' : 'Collapse controls';
  el.togglePanelBtn.setAttribute('aria-expanded', String(!collapsed));
});
controls.forEach((id) => {
  el[id].addEventListener('input', applyControlChange);
  el[id].addEventListener('change', applyControlChange);
});

el.bubbleLayer.addEventListener('pointerdown', () => {
  state.selectedId = null;
  render();
});

syncControls();
