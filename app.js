const scene = document.querySelector('#scene');
const experience = document.querySelector('#experience');
const identity = document.querySelector('#identity');
const title = document.querySelector('#title');
const task = document.querySelector('#task');
const cloud = document.querySelector('#cloud-text');
const steps = [...document.querySelectorAll('.progress span')];
const primary = document.querySelector('#primary');
const secondary = document.querySelector('#secondary');
const detail = document.querySelector('#detail');
const panel = document.querySelector('#panel');
const bot = document.querySelector('#bot');
const prop = document.querySelector('#stage-prop');
const tabs = [...document.querySelectorAll('.agent-tab')];
const themeToggle = document.querySelector('#theme-toggle');
const themeSymbol = document.querySelector('#theme-symbol');

function setTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeSymbol.textContent = dark ? '☾' : '☼';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#101a2b' : '#f8f9f5';
  try { localStorage.setItem('ziki-theme', dark ? 'dark' : 'light'); } catch {}
}

let savedTheme = 'light';
try { savedTheme = localStorage.getItem('ziki-theme') || 'light'; } catch {}
setTheme(savedTheme);
themeToggle.addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

const agents = {
  atlas: {
    id: 'atlas', name: 'Atlas', role: 'Contributor', task: 'Fix login timeout', time: '30 min',
    state: 'asking', workIndex: 0, timer: null, planNote: '', revising: false,
    plan: ['Find', 'Patch', 'Check'],
    work: [
      ['Finding the bug', 'Checking the timeout', 'looking closely'],
      ['Making the fix', 'Patching token refresh', 'making progress'],
      ['Checking it', 'Running 47 checks', 'almost there']
    ],
    proof: ['47 checks passed', 'Token refresh no longer times out.'],
    done: 'Login timeout fixed', accept: 'Accept fix'
  },
  nova: {
    id: 'nova', name: 'Nova', role: 'Contributor', task: 'Fix mobile menu', time: '20 min',
    state: 'working', workIndex: 0, timer: null, planNote: '', revising: false,
    plan: ['Reproduce', 'Fix', 'Check'],
    work: [
      ['Finding the glitch', 'Opening the mobile menu', 'investigating'],
      ['Making the fix', 'Tuning the menu', 'making progress'],
      ['Checking it', 'Running 18 checks', 'almost there']
    ],
    proof: ['18 checks passed', 'The mobile menu opens and closes correctly.'],
    done: 'Mobile menu fixed', accept: 'Accept fix'
  },
  moss: {
    id: 'moss', name: 'Moss', role: 'Reviewer', task: 'Review retry logic', time: '15 min',
    state: 'review', workIndex: 0, timer: null, planNote: '', revising: false,
    plan: ['Inspect', 'Verify', 'Report'],
    work: [
      ['Reading the change', 'Inspecting retry logic', 'looking closely'],
      ['Trying edge cases', 'Checking failed requests', 'making progress'],
      ['Writing a verdict', 'Running 12 checks', 'almost there']
    ],
    proof: ['12 checks passed', 'Retries stop safely after three attempts.'],
    done: 'Review accepted', accept: 'Accept review'
  }
};

let activeId = 'atlas';
let panelKind = '';
let boopTimer = null;
let switchTimer = null;
const statusLabels = { asking: 'Needs OK', working: 'Working', paused: 'Paused', review: 'Review', done: 'Done' };
const statusProps = { asking: '✉', working: '⚙', paused: '☾', review: '✓', done: '✿' };
const activeAgent = () => agents[activeId];

function closePanel() {
  panel.hidden = true;
  panel.replaceChildren();
  panelKind = '';
  detail.setAttribute('aria-expanded', 'false');
}

function updateTabs() {
  tabs.forEach(tab => {
    const agent = agents[tab.dataset.agent];
    const selected = agent.id === activeId;
    tab.dataset.state = agent.state;
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-pressed', String(selected));
    tab.setAttribute('aria-label', agent.name + ', ' + statusLabels[agent.state]);
    tab.querySelector('.tab-status').textContent = statusLabels[agent.state];
  });
}

function setProgress(index) {
  steps.forEach((step, i) => {
    step.classList.toggle('done', i < index);
    step.classList.toggle('current', i === index && index < steps.length);
  });
}

function render() {
  const agent = activeAgent();
  clearTimeout(boopTimer);
  scene.classList.remove('is-petted');
  closePanel();
  scene.dataset.agent = activeId;
  scene.dataset.state = agent.state;
  experience.dataset.agent = activeId;
  identity.textContent = agent.name.toUpperCase() + ' · ' + agent.role.toUpperCase();
  bot.setAttribute('aria-label', 'Tap ' + agent.name + ' for a little surprise');
  prop.textContent = statusProps[agent.state];
  secondary.hidden = false;
  detail.hidden = false;

  if (agent.state === 'asking') {
    title.textContent = agent.revising ? 'Ready to revise' : 'Needs your OK';
    task.textContent = agent.task + (agent.planNote ? ' · plan changed' : ' · ' + agent.time);
    cloud.textContent = agent.revising ? 'waiting for direction' : 'waiting for you';
    primary.textContent = 'Go ahead';
    secondary.textContent = 'Change plan';
    detail.textContent = 'What will you do?';
    setProgress(0);
  } else if (agent.state === 'working') {
    const stage = agent.work[agent.workIndex];
    title.textContent = stage[0];
    task.textContent = stage[1];
    cloud.textContent = stage[2];
    primary.textContent = 'Pause';
    secondary.textContent = 'Ask ' + agent.name;
    detail.textContent = 'See activity';
    setProgress(1);
  } else if (agent.state === 'paused') {
    title.textContent = 'Taking a break';
    task.textContent = agent.work[agent.workIndex][1];
    cloud.textContent = 'paused by you';
    primary.textContent = 'Resume';
    secondary.textContent = 'Ask ' + agent.name;
    detail.textContent = 'See activity';
    setProgress(1);
  } else if (agent.state === 'review') {
    title.textContent = 'Ready for you';
    task.textContent = agent.proof[0];
    cloud.textContent = 'waiting for review';
    primary.textContent = agent.accept;
    secondary.textContent = 'Send back';
    detail.textContent = 'See proof';
    setProgress(2);
  } else {
    title.textContent = 'All done!';
    task.textContent = agent.done;
    cloud.textContent = 'happy to help';
    primary.textContent = 'Try again';
    secondary.hidden = true;
    detail.hidden = true;
    setProgress(4);
  }
  updateTabs();
}

function startWork(agent) {
  clearInterval(agent.timer);
  agent.timer = window.setInterval(() => {
    if (agent.state !== 'working') return;
    agent.workIndex += 1;
    if (agent.workIndex >= agent.work.length) {
      clearInterval(agent.timer);
      agent.timer = null;
      agent.state = 'review';
    }
    if (agent.id === activeId) render();
    else updateTabs();
  }, 3400);
}

function showPanel(kind, html) {
  if (panelKind === kind && !panel.hidden) {
    closePanel();
    return false;
  }
  panelKind = kind;
  panel.innerHTML = html;
  panel.hidden = false;
  detail.setAttribute('aria-expanded', String(['plan', 'activity', 'proof'].includes(kind)));
  panel.setAttribute('aria-label', kind === 'plan' ? 'Agent plan' : kind === 'activity' ? 'Agent activity' : kind === 'proof' ? 'Work proof' : 'Agent response');
  return true;
}

function changePlan() {
  const agent = activeAgent();
  if (!showPanel('change', '<label for="edit">Tell ' + agent.name + ' what to change</label><textarea id="edit" placeholder="e.g. Check mobile too"></textarea><div class="panel-row"><button id="send" type="button">Send change</button><button id="cancel" type="button">Cancel</button></div>')) return;
  const input = document.querySelector('#edit');
  input.focus();
  document.querySelector('#send').onclick = () => {
    const value = input.value.trim();
    if (!value) return input.focus();
    agent.planNote = value;
    agent.revising = false;
    closePanel();
    cloud.textContent = 'plan updated';
    task.textContent = agent.task + ' · plan changed';
  };
  document.querySelector('#cancel').onclick = closePanel;
}

function askAgent() {
  const agent = activeAgent();
  if (!showPanel('question', '<label for="ask">Ask ' + agent.name + '</label><input id="ask" placeholder="What do you need to know?"><div class="panel-row"><button id="send" type="button">Ask</button><button id="cancel" type="button">Cancel</button></div><p class="reply" id="reply" hidden></p>')) return;
  const input = document.querySelector('#ask');
  const reply = document.querySelector('#reply');
  input.focus();
  const answer = () => {
    const question = input.value.trim().toLowerCase();
    if (!question) return input.focus();
    reply.textContent = question.includes('time') ? 'About ' + agent.time + '. I will ask before changing anything else.' :
      question.includes('risk') || question.includes('safe') ? 'I will check the result before you review it.' :
      question.includes('plan') ? 'I will ' + agent.plan.join(', ').toLowerCase() + '.' :
      agent.state === 'review' ? agent.proof[0] + '. ' + agent.proof[1] :
      agent.state === 'paused' ? 'I am paused. You can resume me when ready.' :
      'I am working on ' + agent.task.toLowerCase() + '.';
    reply.hidden = false;
  };
  document.querySelector('#send').onclick = answer;
  input.onkeydown = event => { if (event.key === 'Enter') answer(); };
  document.querySelector('#cancel').onclick = closePanel;
}

primary.onclick = () => {
  const agent = activeAgent();
  if (agent.state === 'asking') {
    agent.state = 'working';
    agent.workIndex = 0;
    agent.revising = false;
    render();
    startWork(agent);
  } else if (agent.state === 'working') {
    agent.state = 'paused';
    clearInterval(agent.timer);
    agent.timer = null;
    render();
  } else if (agent.state === 'paused') {
    agent.state = 'working';
    render();
    startWork(agent);
  } else if (agent.state === 'review') {
    agent.state = 'done';
    render();
  } else {
    agent.state = 'asking';
    agent.workIndex = 0;
    agent.planNote = '';
    agent.revising = false;
    render();
  }
};

secondary.onclick = () => {
  const agent = activeAgent();
  if (agent.state === 'asking') return changePlan();
  if (agent.state === 'review') {
    agent.state = 'asking';
    agent.workIndex = 0;
    agent.revising = true;
    render();
    return changePlan();
  }
  if (agent.state === 'working') {
    agent.state = 'paused';
    clearInterval(agent.timer);
    agent.timer = null;
    render();
  }
  askAgent();
};

detail.onclick = () => {
  const agent = activeAgent();
  if (agent.state === 'asking') {
    const flow = agent.plan.map(part => '<span>' + part + '</span>').join('<i>→</i>');
    if (!showPanel('plan', '<div class="flow">' + flow + '</div>')) return;
    if (agent.planNote) {
      const note = document.createElement('p');
      note.style.marginTop = '12px';
      note.textContent = 'Also: ' + agent.planNote;
      panel.append(note);
    }
    const row = document.createElement('div');
    const askButton = document.createElement('button');
    row.className = 'panel-row';
    askButton.type = 'button';
    askButton.textContent = 'Ask ' + agent.name;
    askButton.onclick = askAgent;
    row.append(askButton);
    panel.append(row);
  } else if (agent.state === 'review') {
    showPanel('proof', '<p><strong>✓ ' + agent.proof[0] + '</strong></p><p>' + agent.proof[1] + '</p>');
  } else {
    const next = agent.work[agent.workIndex + 1]?.[1] || 'Your review';
    showPanel('activity', '<p><strong>Now:</strong> ' + agent.work[agent.workIndex][1] + '</p><p>Next: ' + next + '</p>');
  }
};

tabs.forEach(tab => tab.addEventListener('click', () => {
  if (tab.dataset.agent === activeId) return;
  activeId = tab.dataset.agent;
  render();
  clearTimeout(switchTimer);
  scene.classList.remove('switching');
  void scene.offsetWidth;
  scene.classList.add('switching');
  switchTimer = setTimeout(() => scene.classList.remove('switching'), 440);
}));

bot.addEventListener('click', () => {
  clearTimeout(boopTimer);
  const previous = cloud.textContent;
  scene.classList.remove('is-petted');
  void scene.offsetWidth;
  scene.classList.add('is-petted');
  cloud.textContent = 'boop! ✨';
  boopTimer = setTimeout(() => {
    scene.classList.remove('is-petted');
    if (cloud.textContent === 'boop! ✨') cloud.textContent = previous;
  }, 1100);
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  scene.addEventListener('pointermove', event => {
    const box = bot.getBoundingClientRect();
    const x = (event.clientX - box.left - box.width / 2) / box.width;
    const y = (event.clientY - box.top - box.height / 2) / box.height;
    bot.style.setProperty('--eye-x', Math.max(-3, Math.min(3, x * 7)) + 'px');
    bot.style.setProperty('--eye-y', Math.max(-2, Math.min(2, y * 5)) + 'px');
  });
  scene.addEventListener('pointerleave', () => {
    bot.style.setProperty('--eye-x', '0px');
    bot.style.setProperty('--eye-y', '0px');
  });
}

render();
startWork(agents.nova);
