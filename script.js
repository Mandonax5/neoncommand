// Neon Command - script.js (quick links removed)
// Responsible for clock, greeting, search, notes, settings, and canvas particles.

// Simple storage wrapper using chrome.storage if available, otherwise localStorage fallback
const storage = {
  async get(key, fallback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      const res = await chrome.storage.sync.get([key]);
      return (res && res[key] !== undefined) ? res[key] : fallback;
    } else {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch(e){ return fallback; }
    }
  },
  async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      const obj = {}; obj[key] = value;
      return chrome.storage.sync.set(obj);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  async remove(key) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      return chrome.storage.sync.remove(key);
    } else {
      localStorage.removeItem(key);
    }
  }
};

// ---- UI references ----
const clockEl = document.getElementById('clock');
const greetingEl = document.getElementById('greeting');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const noteInput = document.getElementById('noteInput');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const themeColor = document.getElementById('themeColor');
const saveSettings = document.getElementById('saveSettings');
const resetSettings = document.getElementById('resetSettings');
const closeSettings = document.getElementById('closeSettings');

// ---- default config ----
const defaultConfig = {
  accent: "#00fff6",
  note: ""
};

// ---- initialize ----
(async function init(){
  const cfg = await storage.get('neon_cfg', defaultConfig);
  applyConfig(cfg);
  startClock();
  hookupEvents();
  initCanvas();
})();

// ---- apply configuration to UI ----
async function applyConfig(cfg){
  // Accent color
  document.documentElement.style.setProperty('--accent', cfg.accent || defaultConfig.accent);
  if (themeColor) themeColor.value = cfg.accent || defaultConfig.accent;

  // Notes
  if (noteInput) noteInput.value = cfg.note || '';
}

// ---- basic utilities ----
function escapeHtml(text){ return (text || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

// ---- clock and greeting ----
function startClock(){
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock(){
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');
  if (clockEl) clockEl.textContent = `${hh}:${mm}`;
  if (greetingEl) greetingEl.textContent = computeGreeting(now);
}

function computeGreeting(d){
  const h = d.getHours();
  if (h < 6) return "Working late? Here's your command center.";
  if (h < 12) return "Good morning — ready for launch.";
  if (h < 18) return "Good afternoon — stay focused.";
  return "Good evening — systems nominal.";
}

// ---- search handling ----
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;
  const url = q.startsWith('http') || q.includes('.') ? q : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  window.open(url, '_blank', 'noopener');
  searchInput.value = '';
});

// ---- notes saving ----
let noteSaveTimer = null;
noteInput.addEventListener('input', () => {
  if (noteSaveTimer) clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(async () => {
    const cfg = await storage.get('neon_cfg', defaultConfig);
    cfg.note = noteInput.value;
    await storage.set('neon_cfg', cfg);
  }, 700);
});

// ---- settings modal behavior ----
function hookupEvents(){
  settingsBtn.addEventListener('click', () => {
    settingsModal.setAttribute('aria-hidden', 'false');
  });
  closeSettings.addEventListener('click', () => {
    settingsModal.setAttribute('aria-hidden', 'true');
  });
  saveSettings.addEventListener('click', async () => {
    const cfg = await storage.get('neon_cfg', defaultConfig);
    cfg.accent = themeColor.value;
    cfg.note = noteInput.value;
    await storage.set('neon_cfg', cfg);
    applyConfig(cfg);
    settingsModal.setAttribute('aria-hidden', 'true');
  });
  resetSettings.addEventListener('click', async () => {
    await storage.set('neon_cfg', defaultConfig);
    applyConfig(defaultConfig);
  });

  // close modal on background click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.setAttribute('aria-hidden','true');
  });
}

// ---- Canvas: particle field for "tech" look ----
function initCanvas(){
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = innerWidth;
  let height = canvas.height = innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = innerWidth;
    height = canvas.height = innerHeight;
  });

  // particles
  const P = 120;
  const particles = [];
  for (let i=0;i<P;i++){
    particles.push({
      x: Math.random()*width,
      y: Math.random()*height,
      vx: (Math.random()-0.5)*0.6,
      vy: (Math.random()-0.5)*0.6,
      r: 0.5 + Math.random()*1.8,
      hue: 180 + Math.random()*60
    });
  }

  function frame(){
    ctx.clearRect(0,0,width,height);

    // faint vignette / scanline
    const grad = ctx.createLinearGradient(0,0,0,height);
    grad.addColorStop(0, 'rgba(0,0,0,0.12)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.02)');
    grad.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,width,height);

    // draw particles and connecting lines
    for (let i=0;i<particles.length;i++){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // draw particle
      ctx.beginPath();
      ctx.fillStyle = `rgba(0,255,246,0.08)`;
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();

      // connect nearby
      for (let j=i+1;j<particles.length;j++){
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 120) {
          ctx.beginPath();
          const alpha = 0.08 * (1 - d/120);
          ctx.strokeStyle = `rgba(0,255,246,${alpha})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(p2.x,p2.y);
          ctx.stroke();
        }
      }
    }

    // subtle scanning line effect
    const t = Date.now() * 0.0002;
    ctx.fillStyle = `rgba(0,255,246,0.02)`;
    ctx.fillRect(0, (Math.sin(t*4)+1)/2 * height, width, 2);

    requestAnimationFrame(frame);
  }

  frame();
}