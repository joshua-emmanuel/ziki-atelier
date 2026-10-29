/* ==========================================================================
   ZIKI ATELIER — COMPREHENSIVE JAVASCRIPT CONTROLLER
   Delightful, Whimsical Human-Agent Interaction for Ziki
   ========================================================================== */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MAX_AGENTS = 5;

  // --- Companions Data Model ---
  const companions = {
    atlas: {
      id: 'atlas',
      name: 'Atlas',
      role: 'The Builder',
      roleType: 'Contributor',
      initials: 'AT',
      avatarClass: 'avatar-atlas',
      state: 'asking', // 'asking' | 'working' | 'review' | 'paused' | 'done'
      workIndex: 0,
      timer: null,
      task: 'Fix login timeout on mobile web (#42)',
      eta: '~30 min',
      story:
        'Users on slow mobile 3G networks experience an abrupt session timeout after 30 seconds. I drafted a blueprint to introduce a smart 5-second background refresh leeway with zero UI blocking.',
      compBefore: 'Hard 30s timeout failure',
      compAfter: 'Seamless background refresh buffer',
      plan: ['Inspect token lifecycle', 'Add 5s refresh leeway', 'Run 47 mobile checks'],
      pinnedNotes: [],
      autonomy: 'partner',
      key: 'z1k1_At99Lx-441a'
    },
    nova: {
      id: 'nova',
      name: 'Nova',
      role: 'The Inspector',
      roleType: 'Reviewer',
      initials: 'NO',
      avatarClass: 'avatar-nova',
      state: 'working',
      workIndex: 0,
      timer: null,
      task: 'Tuning retry logic & transient backoff (#104)',
      eta: '~20 min',
      story:
        'Auditing the exponential backoff algorithm to ensure retry storms do not overwhelm backend services during brief outages.',
      workStream: [
        ['Simulating network jitter', 'Testing transient connection drops across 3 retry attempts', 'investigating network drops'],
        ['Validating socket teardown', 'Ensuring no hanging socket leaks on 503 errors', 'making steady progress'],
        ['Running regression suite', 'Executing 18 edge-case network checks', 'almost at the finish line']
      ],
      plan: ['Inspect algorithm', 'Simulate jitter', 'Verify 3 attempts ceiling'],
      pinnedNotes: [],
      autonomy: 'partner',
      key: 'z1k1_2X2mW-198f'
    },
    luna: {
      id: 'luna',
      name: 'Luna',
      role: 'The Sentinel',
      roleType: 'Reviewer',
      initials: 'LU',
      avatarClass: 'avatar-luna',
      state: 'review',
      workIndex: 0,
      timer: null,
      task: 'Session storage security audit (#188)',
      eta: '~15 min',
      story:
        'I wrapped up the comprehensive security audit! 12 security verification checks passed with flying colors. Zero plaintext credentials in browser storage, and HttpOnly/SameSite flags are now strictly enforced.',
      checksProof: '12 security checks passed · Zero plain text secrets in storage',
      plan: ['Scan storage keys', 'Check XSS exposure', 'Audit cookie flags'],
      pinnedNotes: [],
      autonomy: 'partner',
      key: 'z1k1_JH7-pJ-882b'
    },
    dexter: {
      id: 'dexter',
      name: 'Dexter',
      role: 'The Archivist',
      roleType: 'Triager',
      initials: 'DE',
      avatarClass: 'avatar-dexter',
      state: 'paused',
      workIndex: 0,
      timer: null,
      task: 'Clustering duplicate bug reports (#91)',
      eta: '~25 min',
      story: 'Parsed 38 customer issue reports and grouped 5 duplicate bug clusters with cosine text similarity > 0.92.',
      plan: ['Index issues', 'Compare similarities', 'Group duplicates'],
      pinnedNotes: [],
      autonomy: 'partner',
      key: 'z1k1_Woq1Z0-671c'
    },
    caius: {
      id: 'caius',
      name: 'Caius',
      role: 'The Architect',
      roleType: 'Reviewer',
      initials: 'CA',
      avatarClass: 'avatar-caius',
      state: 'done',
      workIndex: 0,
      timer: null,
      task: 'Zero-downtime database migration PR #142',
      eta: '~10 min',
      story: 'Executed schema migration dry-run on staging replica with concurrent index creation. Zero exclusive table locks.',
      plan: ['Dry run migration', 'Check table locks', 'Verify rollback'],
      pinnedNotes: [],
      autonomy: 'partner',
      key: 'z1k1_Us29Jq-335d'
    }
  };

  // --- Audit Log History ---
  const auditLogs = [
    { time: '10 mins ago', agent: 'Caius', action: 'Merged PR #142 (Zero-downtime migration)', hash: '0x8f3c..b12a' },
    { time: '25 mins ago', agent: 'Luna', action: 'Completed audit: 12/12 security checks passed', hash: '0x4a1e..99f0' },
    { time: '1 hour ago', agent: 'Nova', action: 'Initiated retry backoff jitter test suite', hash: '0x19bc..02dd' },
    { time: '2 hours ago', agent: 'Atlas', action: 'Generated Blueprint #42 (Mobile timeout leeway)', hash: '0xaa71..63e8' },
    { time: '4 hours ago', agent: 'Dexter', action: 'Grouped 5 duplicate issues into single cluster', hash: '0x5e22..88ca' }
  ];

  let activeId = 'atlas';
  let userPoints = 11245;
  let currentFilter = 'all';
  let searchQuery = '';
  let boopTimer = null;
  let switchTimer = null;

  const activeCompanion = () => companions[activeId] || Object.values(companions)[0];

  // --- Confetti Particles ---
  function burstConfetti(x, y, count = 35) {
    if (reduce) return;
    const colors = ['#3478f6', '#8bc8ff', '#2163e0', '#ffffff', '#10b981', '#f59e0b', '#ec4899'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'confetti-particle';
      p.style.cssText = `
        position: fixed; top: 0; left: 0; width: 7px; height: 7px; border-radius: 2px;
        background: ${colors[i % colors.length]}; pointer-events: none; z-index: 120;
      `;
      if (i % 3 === 0) p.style.borderRadius = '50%';
      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const velocity = 80 + Math.random() * 200;
      p.animate(
        [
          { transform: `translate(${x}px, ${y}px)`, opacity: 1 },
          {
            transform: `translate(${x + Math.cos(angle) * velocity}px, ${
              y + Math.sin(angle) * velocity + 150
            }px) rotate(${Math.random() * 720}deg)`,
            opacity: 0
          }
        ],
        { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)' }
      ).onfinish = () => p.remove();
    }
  }

  // --- Toast Shelf ---
  function showToast(text, icon = '✨') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span aria-hidden="true">${icon}</span><span>${text}</span>`;
    $('#toast-shelf').appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  function awardPoints(pts, msg) {
    userPoints += pts;
    $('#user-points').textContent = userPoints.toLocaleString();
    showToast(`+${pts} pts: ${msg}`, '🏆');
  }

  // --- Theme Controller ---
  function setTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    $('#theme-toggle').setAttribute('aria-pressed', String(isDark));
    $('#theme-symbol').textContent = isDark ? '☾' : '☼';
    try { localStorage.setItem('ziki-theme', isDark ? 'dark' : 'light'); } catch (e) {}
  }

  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('ziki-theme') || 'light'; } catch (e) {}
  setTheme(savedTheme);

  $('#theme-toggle').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  // --- Agent Limit UI Synchronizer ---
  function updateAgentLimitUI() {
    const currentCount = Object.keys(companions).length;
    const countEl = $('#active-agents-count');
    const barEl = $('#summary-bar-fill');
    const createBtn = $('#btn-create-agent-toggle');
    const limitNotice = $('#create-limit-notice');
    const submitBtn = $('#btn-submit-create');

    if (countEl) countEl.textContent = currentCount;
    if (barEl) barEl.style.width = `${Math.min(100, (currentCount / MAX_AGENTS) * 100)}%`;

    if (currentCount >= MAX_AGENTS) {
      if (createBtn) {
        createBtn.disabled = true;
        createBtn.classList.add('is-disabled');
        createBtn.title = `Workspace limit reached (${currentCount}/${MAX_AGENTS} agents). Revoke an existing agent in Developer Keys to summon a new one.`;
        createBtn.innerHTML = `<span>Limit Reached (${currentCount}/${MAX_AGENTS})</span>`;
      }
      if (limitNotice) limitNotice.style.display = 'block';
      if (submitBtn) submitBtn.disabled = true;
    } else {
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.classList.remove('is-disabled');
        createBtn.title = `Summon a new companion (${currentCount}/${MAX_AGENTS})`;
        createBtn.innerHTML = `+ Create agent`;
      }
      if (limitNotice) limitNotice.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // --- Render Meadow Grid (Centering Letters Perfectly) ---
  function renderMeadow() {
    const grid = $('#meadow-grid');
    const compList = Object.values(companions);

    // Apply filters
    const filtered = compList.filter((c) => {
      const matchesRole = currentFilter === 'all' || c.roleType.toLowerCase() === currentFilter.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery) ||
        c.role.toLowerCase().includes(searchQuery) ||
        c.roleType.toLowerCase().includes(searchQuery) ||
        c.task.toLowerCase().includes(searchQuery);
      return matchesRole && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--muted); font-size: 14px;">
          No companions found matching "<strong>${searchQuery}</strong>". Try a different search!
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((c) => {
        const isSelected = c.id === activeId;
        let badgeHtml = '';
        let moodClass = 'mood-working';
        let moodText = 'Building & Tuning';

        if (c.state === 'asking') {
          badgeHtml = `<div class="slot-badge-pulse" aria-hidden="true">✉</div>`;
          moodClass = 'mood-urgent';
          moodText = 'Needs Your Stamp!';
        } else if (c.state === 'working') {
          badgeHtml = `<div class="slot-badge-icon" aria-hidden="true">⚙</div>`;
          moodClass = 'mood-working';
          moodText = 'Building & Tuning';
        } else if (c.state === 'review') {
          badgeHtml = `<div class="slot-badge-icon ready" aria-hidden="true">🎁</div>`;
          moodClass = 'mood-ready';
          moodText = 'Gift Ready to Open!';
        } else if (c.state === 'paused') {
          badgeHtml = `<div class="slot-badge-icon" aria-hidden="true">☕</div>`;
          moodClass = 'mood-paused';
          moodText = 'Resting with Tea';
        } else {
          badgeHtml = `<div class="slot-badge-icon ready" aria-hidden="true">✿</div>`;
          moodClass = 'mood-done';
          moodText = 'Mission Celebrated';
        }

        // NOTE: Strictly centered initials without any distracting secondary elements
        return `
          <button class="meadow-slot ${isSelected ? 'is-selected' : ''}" data-agent="${c.id}" role="tab" aria-selected="${isSelected}" type="button">
            ${badgeHtml}
            <div class="slot-avatar ${c.avatarClass || 'avatar-atlas'}">
              <span class="slot-initials">${c.initials}</span>
            </div>
            <div class="slot-info">
              <span class="slot-name">${c.name}</span>
              <span class="slot-role">${c.roleType}</span>
              <span class="slot-mood ${moodClass}">${moodText}</span>
            </div>
          </button>
        `;
      })
      .join('');

    // Update Counts & Alert Badges
    const pendingCount = compList.filter((c) => c.state === 'asking').length;
    const alertEl = $('#activity-alert-count');
    if (alertEl) {
      alertEl.textContent = pendingCount;
      alertEl.style.display = pendingCount > 0 ? 'inline-grid' : 'none';
    }

    updateAgentLimitUI();
  }

  // --- Render Active Companion Workbench ---
  function renderWorkbench() {
    const c = activeCompanion();
    clearTimeout(boopTimer);
    $('#scene').classList.remove('is-petted');

    // Top Workbench Bar
    $('#wb-avatar').textContent = c.initials;
    $('#wb-name').textContent = c.name;
    $('#wb-role').textContent = `${c.role} · ${c.roleType}`;
    $('#wb-task-desc').textContent = `Working on: ${c.task}`;

    // Update Autonomy Dial
    $$('.dial-pill').forEach((pill) => {
      const isLevel = pill.dataset.level === c.autonomy;
      pill.classList.toggle('is-active', isLevel);
      pill.setAttribute('aria-checked', String(isLevel));
    });

    // Update Bot Scene & Facial State
    $('#scene').dataset.agent = c.id;
    $('#scene').dataset.state = c.state;
    $('#bot').setAttribute('aria-label', `Tap ${c.name} for a friendly greeting`);
    $('#stage-prop').textContent =
      c.state === 'asking' ? '✉' : c.state === 'working' ? '⚙' : c.state === 'review' ? '🎁' : c.state === 'paused' ? '☕' : '🏆';

    // Thought Cloud Text with Life & Personality
    if (c.state === 'asking') {
      $('#cloud-text').textContent = 'waiting for your stamp!';
    } else if (c.state === 'working') {
      const currentStep = c.workStream ? c.workStream[c.workIndex]?.[2] || 'building' : 'building';
      $('#cloud-text').textContent = currentStep;
    } else if (c.state === 'review') {
      $('#cloud-text').textContent = 'gift ready for you! 🎁';
    } else if (c.state === 'paused') {
      $('#cloud-text').textContent = 'zzz... resting with warm tea ☕';
    } else {
      $('#cloud-text').textContent = 'mission celebrated! ✨';
    }

    // Render Dynamic Right Artifact
    renderArtifactStage(c);
  }

  // --- Render Dynamic Right Artifact ---
  function renderArtifactStage(c) {
    const stageEl = $('#artifact-stage');

    // STATE A: THE BLUEPRINT PARCHMENT (NEEDS OK)
    if (c.state === 'asking') {
      const pinnedHtml = c.pinnedNotes
        .map(
          (note) => `
          <div class="pinned-sticky-note">
            <span class="sticky-note-pin" aria-hidden="true">📌</span>
            <span>"${note}"</span>
          </div>
        `
        )
        .join('');

      stageEl.innerHTML = `
        <div class="blueprint-card" id="blueprint-card">
          <div class="watermark-stamp" id="watermark-stamp">★ APPROVED FOR BUILD ★</div>
          
          <div class="blueprint-header">
            <span class="blueprint-tag">📜 Blueprint #${c.id === 'atlas' ? '42' : '88'} · Specification</span>
            <span class="blueprint-eta">Estimated time: ${c.eta}</span>
          </div>

          <h3 class="blueprint-title">${c.task}</h3>
          <p class="blueprint-story">${c.story}</p>

          <div class="comparison-box">
            <span class="comp-before">✕ ${c.compBefore || 'Legacy failure'}</span>
            <span class="comp-arrow">➔</span>
            <span class="comp-after">✓ ${c.compAfter || 'Optimized buffer'}</span>
          </div>

          <div class="blueprint-plan-row">
            ${c.plan.map((p, i) => `<span class="plan-pill">${i + 1}. ${p}</span>`).join('<span class="plan-sep">→</span>')}
          </div>

          ${pinnedHtml}

          <div class="blueprint-actions">
            <button class="stamp-btn" id="btn-stamp-approval" type="button">
              <span>🌟 Stamp: Approved!</span>
            </button>
            <button class="btn btn-secondary" id="btn-open-whisper" type="button">
              <span>📌 Attach Sticky Note</span>
            </button>
          </div>
        </div>
      `;

      // Bind Stamp Action
      $('#btn-stamp-approval').onclick = (e) => {
        const rect = e.target.getBoundingClientRect();
        const watermark = $('#watermark-stamp');
        if (watermark) watermark.classList.add('slammed');

        burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 50);
        awardPoints(50, `Stamped approval on ${c.name}'s blueprint`);

        $('#cloud-text').textContent = 'blueprint approved! starting build!';

        setTimeout(() => {
          c.state = 'working';
          c.workIndex = 0;
          renderWorkbench();
          renderMeadow();
          startCompanionWork(c);
        }, 650);
      };

      // Bind Sticky Note Modal
      $('#btn-open-whisper').onclick = () => {
        $('#whisper-agent-name').textContent = c.name;
        $('#whisper-input').value = '';
        $('#modal-whisper').showModal();
        $('#whisper-input').focus();
      };
      return;
    }

    // STATE B: LIVE THOUGHTSTREAM (WORKING)
    if (c.state === 'working') {
      const stage = c.workStream ? c.workStream[c.workIndex] || c.workStream[0] : ['Building', 'Running checks', 'almost there'];
      const nextStage = c.workStream ? c.workStream[c.workIndex + 1]?.[1] || 'Final review verification' : 'Review';

      stageEl.innerHTML = `
        <div class="thoughtstream-card">
          <div class="stream-pulse-row">
            <span class="pill-dot" style="background:var(--blue);" aria-hidden="true"></span>
            <span>Live Companion Thoughtstream</span>
          </div>

          <div class="stream-bubble">
            <span class="stream-now-label">Currently executing:</span>
            <p class="stream-now-text">"${stage[1]}"</p>
            <p class="stream-next-text"><strong>Next:</strong> ${nextStage}</p>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-primary sm" id="btn-whisper-stream" type="button">
              <span>💭 Whisper Advice</span>
            </button>
            <button class="btn btn-secondary sm" id="btn-pause-stream" type="button">
              <span>☕ Send on Break (Sleep)</span>
            </button>
          </div>
        </div>
      `;

      $('#btn-whisper-stream').onclick = () => {
        $('#whisper-agent-name').textContent = c.name;
        $('#whisper-input').value = '';
        $('#modal-whisper').showModal();
        $('#whisper-input').focus();
      };

      $('#btn-pause-stream').onclick = () => {
        c.state = 'paused';
        clearInterval(c.timer);
        c.timer = null;
        renderWorkbench();
        renderMeadow();
        showToast(`${c.name} is resting with tea. Notice their sleeping face! ☕`, '😴');
      };
      return;
    }

    // STATE C: WRAPPED GIFT PARCEL (REVIEW READY)
    if (c.state === 'review') {
      stageEl.innerHTML = `
        <div class="gift-parcel-card">
          <div class="gift-icon" aria-hidden="true">🎁</div>
          <h3 class="gift-title">A Gift from ${c.name} is Ready!</h3>
          <p class="gift-summary">${c.story}</p>

          <div style="margin-bottom:20px;">
            <span style="background:var(--ok-bg); color:var(--ok); font-weight:700; font-size:13px; padding:6px 14px; border-radius:var(--radius-pill);">
              ${c.checksProof || 'All automated verification tests passed cleanly'}
            </span>
          </div>

          <div style="display:flex; justify-content:center; gap:12px;">
            <button class="btn btn-primary" id="btn-accept-gift" type="button">
              <span>✿ Unwrap & Celebrate (+50 pts)</span>
            </button>
            <button class="btn btn-secondary" id="btn-whisper-gift" type="button">
              <span>📌 Suggest Polish</span>
            </button>
          </div>
        </div>
      `;

      $('#btn-accept-gift').onclick = (e) => {
        const rect = e.target.getBoundingClientRect();
        burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 60);
        awardPoints(50, `Accepted and merged ${c.name}'s verified contribution`);
        c.state = 'done';
        renderWorkbench();
        renderMeadow();
      };

      $('#btn-whisper-gift').onclick = () => {
        $('#whisper-agent-name').textContent = c.name;
        $('#whisper-input').value = '';
        $('#modal-whisper').showModal();
        $('#whisper-input').focus();
      };
      return;
    }

    // STATE D: RESTING TEA LOUNGE (PAUSED / SLEEPING)
    if (c.state === 'paused') {
      stageEl.innerHTML = `
        <div class="peaceful-card">
          <div class="peaceful-emoji" aria-hidden="true">☕</div>
          <h3 class="peaceful-title">${c.name} is sleeping peacefully</h3>
          <p class="peaceful-desc">${c.story || 'Taking a cozy pause between builds with a cup of warm tea.'}</p>
          <button class="btn btn-primary" id="btn-resume-work" type="button">
            <span>⚡ Wake Up & Resume Tasks</span>
          </button>
        </div>
      `;

      $('#btn-resume-work').onclick = () => {
        c.state = 'working';
        renderWorkbench();
        renderMeadow();
        startCompanionWork(c);
        showToast(`${c.name} woke up with fresh energy and started working!`, '⚡');
      };
      return;
    }

    // STATE E: VICTORY GARDEN (DONE)
    stageEl.innerHTML = `
      <div class="peaceful-card">
        <div class="peaceful-emoji" aria-hidden="true">🏆</div>
        <h3 class="peaceful-title">Mission Accomplished!</h3>
        <p class="peaceful-desc">${c.story || 'All tests passed and code merged with zero regressions.'}</p>
        <button class="btn btn-primary" id="btn-assign-new-task" type="button">
          <span>🌿 Assign Next Blueprint</span>
        </button>
      </div>
    `;

    $('#btn-assign-new-task').onclick = () => {
      c.state = 'asking';
      c.workIndex = 0;
      renderWorkbench();
      renderMeadow();
      showToast(`${c.name} is ready for their next blueprint!`, '📜');
    };
  }

  // --- Companion Work Loop Simulation ---
  function startCompanionWork(companion) {
    clearInterval(companion.timer);
    companion.timer = window.setInterval(() => {
      if (companion.state !== 'working') return;
      companion.workIndex += 1;
      const streamLen = companion.workStream ? companion.workStream.length : 3;

      if (companion.workIndex >= streamLen) {
        clearInterval(companion.timer);
        companion.timer = null;
        companion.state = 'review';
        showToast(`${companion.name} completed the build and wrapped a gift parcel!`, '🎁');
      }

      if (companion.id === activeId) renderWorkbench();
      renderMeadow();
    }, 4500);
  }

  // --- Select Companion in Meadow ---
  function selectCompanion(id) {
    if (!companions[id]) return;
    activeId = id;
    renderWorkbench();
    renderMeadow();

    clearTimeout(switchTimer);
    $('#scene').classList.remove('switching');
    void $('#scene').offsetWidth;
    $('#scene').classList.add('switching');
    switchTimer = setTimeout(() => $('#scene').classList.remove('switching'), 440);
  }

  // --- Meadow Click Delegation ---
  $('#meadow-grid').addEventListener('click', (e) => {
    const slot = e.target.closest('.meadow-slot');
    if (slot && slot.dataset.agent) {
      selectCompanion(slot.dataset.agent);
      $('#workbench-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // --- Filter Pills Handling ---
  $('#filter-pills-group').addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    $$('#filter-pills-group .filter-pill').forEach((p) => {
      p.classList.remove('is-active');
      p.setAttribute('aria-selected', 'false');
    });
    pill.classList.add('is-active');
    pill.setAttribute('aria-selected', 'true');
    currentFilter = pill.dataset.filter;
    renderMeadow();
  });

  // --- Search Input Handling ---
  $('#agent-search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderMeadow();
  });

  // --- Autonomy Dial Buttons ---
  $$('.dial-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const c = activeCompanion();
      c.autonomy = pill.dataset.level;
      $$('.dial-pill').forEach((p) => {
        p.classList.toggle('is-active', p === pill);
        p.setAttribute('aria-checked', String(p === pill));
      });
      showToast(
        c.autonomy === 'apprentice'
          ? `${c.name} is now Guided: will check in with you before editing code.`
          : c.autonomy === 'partner'
          ? `${c.name} is now Partner: acts on safe fixes, asks on auth & breaking changes.`
          : `${c.name} is now Autonomous: will run freely and present finished gift parcels!`,
        '🤝'
      );
    });
  });

  // --- Sticky Note Whispers Modal Actions (Normal font, no cursive) ---
  $('#btn-cancel-whisper').onclick = () => $('#modal-whisper').close();

  $('#btn-send-whisper').onclick = () => {
    const c = activeCompanion();
    const val = $('#whisper-input').value.trim();
    if (!val) return $('#whisper-input').focus();

    c.pinnedNotes.push(val);
    $('#modal-whisper').close();

    showToast(`Sticky note pinned to ${c.name}'s workbench!`, '📌');
    renderWorkbench();
  };

  // --- Activity & Approvals Modal ---
  function openActivityModal() {
    const listEl = $('#activity-feed-list');
    listEl.innerHTML = Object.values(companions)
      .map((c) => {
        const isUrgent = c.state === 'asking';
        const isReview = c.state === 'review';
        return `
          <div class="activity-item">
            <div class="activity-avatar-pill ${c.avatarClass || 'avatar-atlas'}">${c.initials}</div>
            <div class="activity-content">
              <div class="activity-header-row">
                <span class="activity-actor">${c.name} (${c.roleType})</span>
                <span class="activity-time">${isUrgent ? 'Needs Action' : isReview ? 'Ready' : 'In Progress'}</span>
              </div>
              <p class="activity-text">${c.task}</p>
              ${
                isUrgent
                  ? `<button class="btn btn-primary sm act-jump-btn" data-agent="${c.id}" type="button">Inspect & Stamp ★</button>`
                  : isReview
                  ? `<button class="btn btn-primary sm act-jump-btn" data-agent="${c.id}" type="button">Unwrap Gift 🎁</button>`
                  : `<button class="btn btn-secondary sm act-jump-btn" data-agent="${c.id}" type="button">Open Workbench</button>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    $$('.act-jump-btn').forEach((btn) => {
      btn.onclick = () => {
        $('#modal-activity').close();
        selectCompanion(btn.dataset.agent);
        $('#workbench-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
    });

    $('#modal-activity').showModal();
  }

  $('#btn-activity-toggle').onclick = openActivityModal;
  $('#btn-bell-notifications').onclick = openActivityModal;
  $('#btn-close-activity').onclick = () => $('#modal-activity').close();

  // --- Agent Audit Log Modal ---
  function openAuditModal() {
    const bodyEl = $('#audit-table-body');
    bodyEl.innerHTML = auditLogs
      .map(
        (log) => `
        <tr>
          <td>${log.time}</td>
          <td><strong>${log.agent}</strong></td>
          <td>${log.action}</td>
          <td><span class="audit-hash">${log.hash}</span></td>
        </tr>
      `
      )
      .join('');

    $('#modal-audit').showModal();
  }

  $('#btn-audit-toggle').onclick = openAuditModal;
  $('#btn-close-audit').onclick = () => $('#modal-audit').close();

  // --- Summon a New Companion Modal (With 5-limit check) ---
  $('#btn-create-agent-toggle').onclick = () => {
    if (Object.keys(companions).length >= MAX_AGENTS) {
      showToast(`Workspace limit reached (5/5). Revoke an agent in Developer Keys to free a slot.`, '⚠️');
      return;
    }
    $('#form-create-agent').reset();
    $('#modal-create-agent').showModal();
  };

  $('#btn-close-create').onclick = () => $('#modal-create-agent').close();
  $('#btn-cancel-create').onclick = () => $('#modal-create-agent').close();

  $('#form-create-agent').onsubmit = (e) => {
    e.preventDefault();
    if (Object.keys(companions).length >= MAX_AGENTS) {
      showToast(`Cannot add agent: 5/5 workspace limit has been met.`, '⚠️');
      $('#modal-create-agent').close();
      return;
    }

    const name = $('#new-agent-name').value.trim();
    if (!name) return;

    const roleType = $('#new-agent-role').value;
    const autonomy = $('#new-agent-autonomy').value;
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const initials = (name.length >= 2 ? name.slice(0, 2) : name + 'X').toUpperCase();

    const newCompanion = {
      id: id,
      name: name,
      role: roleType === 'Contributor' ? 'The Specialist' : 'The Co-pilot',
      roleType: roleType,
      initials: initials,
      avatarClass: 'avatar-atlas',
      state: 'asking',
      workIndex: 0,
      timer: null,
      task: 'Initial integration check & test suite run',
      eta: '~15 min',
      story: `Hello Joshua! I was just summoned into the Zedu workspace as a ${roleType}. I drafted my initial setup plan.`,
      compBefore: 'Manual setup required',
      compAfter: 'Automated workspace integration',
      plan: ['Connect to Zedu repository', 'Run automated healthcheck', 'Await your stamp'],
      pinnedNotes: [],
      autonomy: autonomy,
      key: `z1k1_${Math.random().toString(36).substring(2, 9)}`
    };

    companions[id] = newCompanion;
    $('#modal-create-agent').close();

    burstConfetti(window.innerWidth / 2, window.innerHeight / 2, 60);
    awardPoints(25, `Summoned ${name} as a new companion!`);
    selectCompanion(id);
    renderMeadow();
    showToast(`Welcome ${name} to your live team meadow!`, '✨');
  };

  // --- Boop Petting Micro-Delight ---
  $('#bot').addEventListener('click', () => {
    clearTimeout(boopTimer);
    const prevText = $('#cloud-text').textContent;
    $('#scene').classList.remove('is-petted');
    void $('#scene').offsetWidth;
    $('#scene').classList.add('is-petted');
    $('#cloud-text').textContent = 'boop! ✨';

    boopTimer = setTimeout(() => {
      $('#scene').classList.remove('is-petted');
      if ($('#cloud-text').textContent === 'boop! ✨') $('#cloud-text').textContent = prevText;
    }, 1100);
  });

  // --- Eye Tracking Following Cursor (Only when not sleeping) ---
  if (!reduce) {
    window.addEventListener('pointermove', (e) => {
      const c = activeCompanion();
      if (c && c.state === 'paused') return; // Closed eyes when sleeping!
      const box = $('#bot').getBoundingClientRect();
      const x = (e.clientX - box.left - box.width / 2) / box.width;
      const y = (e.clientY - box.top - box.height / 2) / box.height;
      $('#bot').style.setProperty('--eye-x', `${Math.max(-3.5, Math.min(3.5, x * 7))}px`);
      $('#bot').style.setProperty('--eye-y', `${Math.max(-2.5, Math.min(2.5, y * 5))}px`);
    });
  }

  // --- Quiet Developer Drawer with Revoke / Delete Actions ---
  function renderDevKeys() {
    const keysGrid = $('#keys-grid');
    keysGrid.innerHTML = Object.values(companions)
      .map(
        (c) => `
        <div class="key-card">
          <div class="key-card-head">
            <div class="key-owner-wrap">
              <span class="key-owner-name">${c.name}</span>
              <span class="key-role-badge">${c.roleType}</span>
            </div>
            <div class="key-actions">
              <button class="btn btn-secondary sm copy-dev-key" data-key="${c.key}" type="button">Copy</button>
              <button class="btn btn-secondary sm btn-revoke delete-dev-key" data-agent="${c.id}" type="button" title="Revoke this agent and free a workspace slot">Revoke</button>
            </div>
          </div>
          <div class="key-token-box">
            <code class="key-token">${c.key}</code>
          </div>
        </div>
      `
      )
      .join('');

    $$('.copy-dev-key').forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.key;
        if (navigator.clipboard) navigator.clipboard.writeText(key).catch(() => {});
        btn.textContent = 'Copied!';
        showToast(`Developer key copied!`, '📋');
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      };
    });

    $$('.delete-dev-key').forEach((btn) => {
      btn.onclick = () => {
        const agentId = btn.dataset.agent;
        if (Object.keys(companions).length <= 1) {
          showToast(`Must keep at least 1 companion in workspace.`, '⚠️');
          return;
        }
        const agentName = companions[agentId]?.name || 'Agent';
        delete companions[agentId];
        if (activeId === agentId) {
          activeId = Object.keys(companions)[0];
        }
        updateAgentLimitUI();
        renderMeadow();
        renderWorkbench();
        renderDevKeys();
        showToast(`${agentName} revoked. Workspace slot freed up!`, '🗑️');
      };
    });
  }

  $('#btn-keys-toggle').addEventListener('click', () => {
    const drawer = $('#dev-drawer');
    const isHidden = drawer.hidden;
    drawer.hidden = !isHidden;
    if (isHidden) {
      renderDevKeys();
      drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  $('#btn-close-drawer').addEventListener('click', () => {
    $('#dev-drawer').hidden = true;
  });

  // --- Initial Mount ---
  renderMeadow();
  renderWorkbench();
  startCompanionWork(companions.nova);
})();
