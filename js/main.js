document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Custom cursor (devices with a real mouse only) ---------- */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.documentElement.classList.add('has-custom-cursor');

  const cursorEl = document.getElementById('customCursor');
  // The dart is drawn pointing up-left (toward its hotspot at the top-left tip),
  // which corresponds to roughly -128 degrees in screen-space atan2 terms.
  const DRAWN_ANGLE = -128;

  let mouseX = -100;
  let mouseY = -100;
  let lastX = mouseX;
  let lastY = mouseY;
  let currentAngle = 0;
  let currentScale = 1;
  let isHoveringInteractive = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorEl.style.left = `${mouseX}px`;
    cursorEl.style.top = `${mouseY}px`;
  });

  document.addEventListener('mouseleave', () => {
    cursorEl.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursorEl.style.opacity = '1';
  });

  const isInteractive = (el) => Boolean(el && el.closest && el.closest('a, button'));

  document.addEventListener('mouseover', (e) => {
    if (isInteractive(e.target)) {
      isHoveringInteractive = true;
      cursorEl.classList.add('is-interactive');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (isInteractive(e.target) && !isInteractive(e.relatedTarget)) {
      isHoveringInteractive = false;
      cursorEl.classList.remove('is-interactive');
    }
  });

  function animateCursor() {
    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const speed = Math.hypot(dx, dy);

    if (!prefersReducedMotion) {
      if (speed > 1.2 && !isHoveringInteractive) {
        const movementAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const targetRotation = movementAngle - DRAWN_ANGLE;
        let diff = ((targetRotation - currentAngle + 180) % 360 + 360) % 360 - 180;
        currentAngle += diff * 0.18;
      }
      const targetScale = isHoveringInteractive ? 1.5 : Math.min(1 + speed * 0.012, 1.35);
      currentScale += (targetScale - currentScale) * 0.15;
      cursorEl.style.transform = `rotate(${currentAngle}deg) scale(${currentScale})`;
    }

    lastX = mouseX;
    lastY = mouseY;
    requestAnimationFrame(animateCursor);
  }

  requestAnimationFrame(animateCursor);
}

/* ---------- Sidebar toggle (mobile off-canvas) ---------- */
const navToggle = document.getElementById('navToggle');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const navLinks = document.getElementById('navLinks');

function openSidebar() {
  sidebar.classList.add('is-open');
  sidebarBackdrop.classList.add('is-open');
  navToggle.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  sidebar.classList.remove('is-open');
  sidebarBackdrop.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', () => {
  sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
});

sidebarBackdrop.addEventListener('click', closeSidebar);

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeSidebar);
});

/* ---------- Sidebar scroll-spy ---------- */
const spySections = Array.from(navLinks.querySelectorAll('a'))
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter((entry) => entry.section);

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const match = spySections.find((s) => s.section === entry.target);
      if (!match) return;
      spySections.forEach((s) => s.link.classList.remove('is-active'));
      match.link.classList.add('is-active');
    });
  },
  { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
);

spySections.forEach((s) => spyObserver.observe(s.section));

/* ---------- Theme toggle ---------- */
const themeToggles = document.querySelectorAll('.theme-toggle');

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {}
}

themeToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });
});

/* ---------- Scroll reveal ---------- */
const revealTargets = document.querySelectorAll('.project-card, .about-text, .skill-group');
revealTargets.forEach((el) => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealTargets.forEach((el) => revealObserver.observe(el));

/* ---------- Typewriter hero tagline ---------- */
const typewriterEl = document.getElementById('typewriter');
const typewriterPhrases = ['Data Scientist', 'Software Developer', 'Problem Solver'];

if (prefersReducedMotion) {
  typewriterEl.textContent = typewriterPhrases.join(' · ');
} else {
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function typeTick() {
    const phrase = typewriterPhrases[phraseIndex];

    if (!deleting) {
      charIndex++;
      typewriterEl.textContent = phrase.slice(0, charIndex);
      if (charIndex === phrase.length) {
        deleting = true;
        setTimeout(typeTick, 1400);
        return;
      }
    } else {
      charIndex--;
      typewriterEl.textContent = phrase.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % typewriterPhrases.length;
      }
    }

    setTimeout(typeTick, deleting ? 40 : 80);
  }

  typeTick();
}

/* ---------- Project card cursor-following spotlight ---------- */
if (!prefersReducedMotion) {
  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
      card.style.setProperty('--my', `${(y / rect.height) * 100}%`);
    });
  });
}

/* ---------- Live dashboard embed (Northwind) ---------- */
// Paste your Data Studio "Embed report" URL here to show a live, interactive
// dashboard instead of the fallback card. In Data Studio: File -> Embed report
// -> Enable embedding, then copy the embed URL (not the regular share link).
const DASHBOARD_EMBED_URL = '';

if (DASHBOARD_EMBED_URL) {
  const embedContainer = document.getElementById('northwindEmbed');
  if (embedContainer) {
    embedContainer.innerHTML = `<iframe src="${DASHBOARD_EMBED_URL}" loading="lazy" allowfullscreen title="Northwind ETL live dashboard"></iframe>`;
  }
}

/* ---------- Terminal easter egg ---------- */
const terminalLauncher = document.getElementById('terminalLauncher');
const terminalPanel = document.getElementById('terminalPanel');
const terminalClose = document.getElementById('terminalClose');
const terminalOutput = document.getElementById('terminalOutput');
const terminalForm = document.getElementById('terminalForm');
const terminalInput = document.getElementById('terminalInput');

const sectionIds = ['top', 'about', 'data-projects', 'dev-projects', 'skills', 'contact'];

function termPrint(text, className) {
  const line = document.createElement('p');
  line.className = className || 'term-resp';
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function openTerminal() {
  terminalPanel.hidden = false;
  terminalLauncher.setAttribute('aria-expanded', 'true');
  if (terminalOutput.children.length === 0) {
    termPrint("Welcome. Type 'help' to see what I respond to.");
  }
  // Only auto-focus on devices with a real keyboard/mouse (desktop). On touch
  // devices, focusing immediately would pop the on-screen keyboard before the
  // visitor has chosen to type anything -- let them tap the input when ready.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    terminalInput.focus();
  }
}

function closeTerminal() {
  terminalPanel.hidden = true;
  terminalLauncher.setAttribute('aria-expanded', 'false');
}

terminalLauncher.addEventListener('click', () => {
  terminalPanel.hidden ? openTerminal() : closeTerminal();
});
terminalClose.addEventListener('click', closeTerminal);

const commands = {
  help() {
    termPrint('Available commands: help, whoami, projects, skills, contact, theme, ls, cd <section>, clear, exit');
  },
  whoami() {
    termPrint("You're a visitor on Tamsyn Evezard's portfolio. Scroll around — there's good stuff here.");
  },
  projects() {
    termPrint('Data: Northwind ETL · StreamFlow Forecast · Titanic Survival Prediction · Neural Networks');
    termPrint('Software: Stock Simulator App · Meal Master');
    termPrint("Try: cd data-projects  or  cd dev-projects");
  },
  skills() {
    termPrint('Python, TensorFlow, Pandas, scikit-learn, SQL, BigQuery, JavaScript, TypeScript, Angular, React Native, Docker, CI/CD, Git');
  },
  contact() {
    termPrint('See the Contact section below — cd contact to jump there.');
  },
  theme() {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    termPrint(`Theme switched to ${getTheme()}.`);
  },
  ls() {
    termPrint(sectionIds.join('  '));
  },
  clear() {
    terminalOutput.innerHTML = '';
  },
  exit: closeTerminal,
  close: closeTerminal,
};

function runCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  termPrint(trimmed, 'term-cmd');

  const [cmd, ...args] = trimmed.split(/\s+/);
  const lower = cmd.toLowerCase();

  if (lower === 'sudo') {
    termPrint("Nice try. Permission denied (this isn't that kind of terminal).");
    return;
  }

  if (lower === 'cd') {
    const target = (args[0] || '').toLowerCase();
    if (sectionIds.includes(target)) {
      document.getElementById(target).scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      termPrint(`Jumped to #${target}.`);
    } else {
      termPrint(`cd: no such section: ${args[0] || ''}. Try 'ls' to see available sections.`);
    }
    return;
  }

  if (commands[lower]) {
    commands[lower]();
    return;
  }

  termPrint(`command not found: ${cmd}. Type 'help' to see what I respond to.`);
}

terminalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = terminalInput.value;
  terminalInput.value = '';
  runCommand(value);
});
