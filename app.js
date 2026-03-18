// ============================================================
//  Smart Timetable Generator — NLP
//  app.js
//  NLP Techniques: NER | Intent Detection | Constraint Parsing
// ============================================================

const DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = [
  '8:00–9:00', '9:00–10:00', '10:00–11:00',
  'BREAK',
  '11:15–12:15', '12:15–1:15',
  'LUNCH',
  '2:00–3:00', '3:00–4:00'
];
const BREAK_SLOTS = ['BREAK', 'LUNCH'];

// ── Default data ─────────────────────────────────────────────
let subjects = [
  { name: 'Mathematics',      hours: 5 },
  { name: 'Physics',          hours: 4 },
  { name: 'Chemistry',        hours: 4 },
  { name: 'English',          hours: 4 },
  { name: 'Computer Science', hours: 3 }
];

let teachers = [
  { name: 'Dr. Sharma', subject: 'Mathematics'      },
  { name: 'Prof. Rao',  subject: 'Physics'           },
  { name: 'Ms. Priya',  subject: 'Chemistry'         },
  { name: 'Mr. Suresh', subject: 'English'           },
  { name: 'Ms. Anita',  subject: 'Computer Science'  }
];

let constraints = [];

// ── Colour helper ─────────────────────────────────────────────
function subjectColor(name) {
  if (!name) return '';
  const n = name.toLowerCase();
  if (n.includes('math'))                        return 'background:#E1F5EE;color:#27500A;';
  if (n.includes('physics') || n.includes('science')) return 'background:#E6F1FB;color:#0C447C;';
  if (n.includes('chem'))                        return 'background:#FAECE7;color:#712B13;';
  if (n.includes('english') || n.includes('lang')) return 'background:#EEEDFE;color:#3C3489;';
  if (n.includes('computer') || n.includes('cs')) return 'background:#EAF3DE;color:#27500A;';
  return 'background:#FAEEDA;color:#633806;';
}

// ── Render helpers ────────────────────────────────────────────
function renderSubjects() {
  document.getElementById('subjectList').innerHTML = subjects.map((s, i) => `
    <div class="list-item">
      <span>${s.name} <span style="color:var(--text-secondary)">(${s.hours} hrs/wk)</span></span>
      <span class="del-btn" onclick="subjects.splice(${i},1);renderSubjects()">×</span>
    </div>`).join('');
}

function renderTeachers() {
  document.getElementById('teacherList').innerHTML = teachers.map((t, i) => `
    <div class="list-item">
      <span>${t.name} <span style="color:var(--text-secondary)">— ${t.subject}</span></span>
      <span class="del-btn" onclick="teachers.splice(${i},1);renderTeachers()">×</span>
    </div>`).join('');
}

function renderConstraints() {
  document.getElementById('constraintList').innerHTML = constraints.map((c, i) => `
    <div class="list-item">
      <span class="nlp-tag tag-constraint">${c.type}</span>
      <span style="font-size:13px;margin-left:6px">${c.detail}</span>
      <span class="del-btn" onclick="constraints.splice(${i},1);renderConstraints();renderChips()">×</span>
    </div>`).join('');
}

function renderChips() {
  document.getElementById('constraintChips').innerHTML = constraints.map((c, i) => `
    <span class="chip">
      <span class="nlp-tag tag-constraint" style="font-size:10px">${c.type}</span>
      ${c.detail}
      <span class="chip-remove" onclick="constraints.splice(${i},1);renderConstraints();renderChips()">×</span>
    </span>`).join('');
}

// ── Add helpers ───────────────────────────────────────────────
function addSubject() {
  const n = document.getElementById('subjectInput').value.trim();
  const h = parseInt(document.getElementById('hoursInput').value) || 3;
  if (!n) return;
  subjects.push({ name: n, hours: h });
  document.getElementById('subjectInput').value = '';
  document.getElementById('hoursInput').value   = '';
  renderSubjects();
}

function addTeacher() {
  const n = document.getElementById('teacherInput').value.trim();
  const s = document.getElementById('teacherSubject').value.trim();
  if (!n || !s) return;
  teachers.push({ name: n, subject: s });
  document.getElementById('teacherInput').value  = '';
  document.getElementById('teacherSubject').value = '';
  renderTeachers();
}

function addConstraintManual() {
  const t = document.getElementById('constraintType').value;
  const d = document.getElementById('constraintDetail').value.trim();
  if (!d) return;
  constraints.push({ type: t, detail: d });
  document.getElementById('constraintDetail').value = '';
  renderConstraints();
  renderChips();
}

// ── NLP PARSER ────────────────────────────────────────────────
/**
 * NLP Pipeline:
 *  1. NER  — extracts named entities: teacher titles, subject names,
 *            days, time expressions, room numbers
 *  2. Intent Detection — classifies the sentence intent:
 *            schedule | constraint_unavailable | constraint_preferred | constraint_room
 *  3. Constraint Parsing — converts extracted entities + intent
 *            into structured constraint objects
 */
function parseNLP() {
  const raw = document.getElementById('nlpInput').value.trim();
  if (!raw) return;

  const lower = raw.toLowerCase();
  const fb    = document.getElementById('nlpFeedback');

  // ── Step 1: NER ───────────────────────────────────────────
  // Entity: Days
  const dayPattern     = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
  // Entity: Time expressions
  const timePattern    = /(morning|afternoon|evening|8am|9am|10am|11am|noon|2pm|3pm|4pm|\d{1,2}:\d{2})/gi;
  // Entity: Room numbers
  const roomPattern    = /room\s*([a-z]?\d+)/gi;

  const days  = [...raw.matchAll(dayPattern)].map(m => m[0]);
  const times = [...raw.matchAll(timePattern)].map(m => m[0]);
  const rooms = [...raw.matchAll(roomPattern)].map(m => m[0]);

  // Entity: Teacher name (title-based NER)
  const teacherMatch = raw.match(/(Dr\.|Prof\.|Mr\.|Ms\.)\s+[A-Z][a-z]+/);
  const teacherName  = teacherMatch ? teacherMatch[0] : null;

  // Entity: Subject name (match against known subjects first)
  let matchedSubject = null;
  for (const s of subjects) {
    if (lower.includes(s.name.toLowerCase())) { matchedSubject = s.name; break; }
  }
  if (!matchedSubject) {
    // Fallback: pick the first meaningful word not in stop-list
    const stopWords = /(schedule|assign|add|put|place|with|on|in|room|morning|afternoon|monday|tuesday|wednesday|thursday|friday|dr\.|prof\.|mr\.|ms\.)/gi;
    const cleaned   = raw.replace(stopWords, '').trim();
    const words     = cleaned.split(/\s+/).filter(w => w.length > 3);
    if (words.length) matchedSubject = words[0];
  }

  // ── Step 2: Intent Detection ──────────────────────────────
  let intent = 'unknown';
  if (/schedule|add|assign|put|place/i.test(raw))                          intent = 'schedule';
  if (/not available|unavailable|absent|busy|off|free day|no class/i.test(raw)) intent = 'constraint_unavailable';
  if (/prefer|preferred|best|always|only/i.test(raw))                      intent = 'constraint_preferred';
  if (/room|lab|hall/i.test(raw) && intent !== 'schedule')                 intent = 'constraint_room';

  // ── Step 3: Highlight feedback ────────────────────────────
  let highlighted = raw;
  if (matchedSubject) {
    highlighted = highlighted.replace(
      new RegExp(matchedSubject, 'gi'),
      `<span class="nlp-tag tag-entity">$&</span>`
    );
  }
  if (teacherName) {
    highlighted = highlighted.replace(
      teacherName,
      `<span class="nlp-tag tag-entity">${teacherName}</span>`
    );
  }
  days.forEach(d => {
    highlighted = highlighted.replace(
      new RegExp(d, 'gi'),
      `<span class="nlp-tag tag-constraint">${d}</span>`
    );
  });
  times.forEach(t => {
    highlighted = highlighted.replace(
      new RegExp(t, 'gi'),
      `<span class="nlp-tag tag-constraint">${t}</span>`
    );
  });
  rooms.forEach(r => {
    highlighted = highlighted.replace(
      new RegExp(r, 'gi'),
      `<span class="nlp-tag tag-constraint">${r}</span>`
    );
  });
  highlighted = highlighted.replace(
    /(schedule|assign|add|not available|prefer)/gi,
    `<span class="nlp-tag tag-intent">$&</span>`
  );

  fb.innerHTML = `<strong>Parsed:</strong> ${highlighted}
    &nbsp;|&nbsp; <span class="nlp-tag tag-intent">intent: ${intent}</span>`;

  // ── Step 4: Auto-register new entities ───────────────────
  if (matchedSubject && !subjects.find(s => s.name.toLowerCase() === matchedSubject.toLowerCase())) {
    subjects.push({ name: matchedSubject, hours: 3 });
    renderSubjects();
  }
  if (teacherName && !teachers.find(t => t.name === teacherName)) {
    teachers.push({ name: teacherName, subject: matchedSubject || 'General' });
    renderTeachers();
  }

  // ── Step 5: Constraint Parsing ────────────────────────────
  if (intent === 'constraint_unavailable' && teacherName && days.length) {
    const detail = `${teacherName} unavailable on ${days.join(', ')}`;
    if (!constraints.find(c => c.detail === detail)) {
      constraints.push({ type: 'unavailable', detail });
      renderConstraints();
      renderChips();
    }
  } else if (intent === 'constraint_preferred' && matchedSubject && (days.length || times.length)) {
    const detail = [
      matchedSubject,
      'preferred',
      days.length  ? 'on ' + days.join(', ')  : '',
      times.length ? times.join(', ')          : ''
    ].filter(Boolean).join(' ').trim();
    constraints.push({ type: 'preferred', detail });
    renderConstraints();
    renderChips();
  } else if (rooms.length && matchedSubject) {
    const detail = `${matchedSubject} in ${rooms[0]}`;
    if (!constraints.find(c => c.detail === detail)) {
      constraints.push({ type: 'room', detail });
      renderConstraints();
      renderChips();
    }
  }

  document.getElementById('nlpInput').value = '';
}

// Enter key support
document.getElementById('nlpInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') parseNLP();
});

// ── TIMETABLE GENERATOR ───────────────────────────────────────
function generateTimetable() {
  const teachableSlots = SLOTS.filter(s => !BREAK_SLOTS.includes(s));

  // Initialise grid
  const grid = {};
  DAYS.forEach(day => {
    grid[day] = {};
    SLOTS.forEach(slot => {
      grid[day][slot] = BREAK_SLOTS.includes(slot) ? 'BREAK' : null;
    });
  });

  // Build unavailability map from constraints
  const unavailMap = {};
  constraints.filter(c => c.type === 'unavailable').forEach(c => {
    const parts = c.detail.toLowerCase();
    DAYS.forEach(day => {
      if (parts.includes(day.toLowerCase())) {
        if (!unavailMap[day]) unavailMap[day] = [];
        const tMatch = c.detail.match(/(Dr\.|Prof\.|Mr\.|Ms\.)\s+[A-Z][a-z]+/);
        if (tMatch) unavailMap[day].push(tMatch[0]);
      }
    });
  });

  // Build preferred-day map from constraints
  const preferMap = {};
  constraints.filter(c => c.type === 'preferred').forEach(c => {
    const parts = c.detail.toLowerCase();
    DAYS.forEach(day => {
      if (parts.includes(day.toLowerCase())) {
        const sMatch = subjects.find(s => parts.includes(s.name.toLowerCase()));
        if (sMatch) {
          if (!preferMap[sMatch.name]) preferMap[sMatch.name] = [];
          preferMap[sMatch.name].push(day);
        }
      }
    });
  });

  // Build room map from constraints
  const roomMap = {};
  constraints.filter(c => c.type === 'room').forEach(c => {
    const rMatch = c.detail.match(/Room\s*([A-Z]?\d+)/i);
    const sMatch = subjects.find(s => c.detail.toLowerCase().includes(s.name.toLowerCase()));
    if (rMatch && sMatch) roomMap[sMatch.name] = rMatch[0];
  });

  // Place subjects
  const remaining = subjects.map(s => ({ ...s }));
  remaining.sort((a, b) => b.hours - a.hours);   // most hours first

  let conflicts = 0;

  for (const subj of remaining) {
    let placed = 0;
    const teacher = teachers.find(
      t => t.subject.toLowerCase() === subj.name.toLowerCase() ||
           t.name.toLowerCase().includes(subj.name.toLowerCase().slice(0, 4))
    );

    const shuffledDays = [...DAYS].sort(() => Math.random() - 0.5);
    const preferred    = preferMap[subj.name] || [];
    const orderedDays  = [
      ...preferred.filter(d => DAYS.includes(d)),
      ...shuffledDays.filter(d => !preferred.includes(d))
    ];

    outer:
    for (const day of orderedDays) {
      for (const slot of teachableSlots) {
        if (placed >= subj.hours) break outer;
        if (grid[day][slot]) continue;

        // Respect unavailability constraints
        const blocked = unavailMap[day] || [];
        if (teacher && blocked.includes(teacher.name)) continue;

        grid[day][slot] = {
          subject: subj.name,
          teacher: teacher ? teacher.name : 'TBA',
          room:    roomMap[subj.name] || `R${101 + Math.floor(Math.random() * 8)}`
        };
        placed++;
      }
    }

    if (placed < subj.hours) conflicts += (subj.hours - placed);
  }

  // ── Render HTML table ─────────────────────────────────────
  let html = '<tr><th style="min-width:90px">Time</th>' +
    DAYS.map(d => `<th>${d}</th>`).join('') + '</tr>';

  for (const slot of SLOTS) {
    html += '<tr>';
    html += `<td style="font-size:11px;color:var(--text-secondary);white-space:nowrap;padding:6px 8px;">${slot}</td>`;

    for (const day of DAYS) {
      const cell = grid[day][slot];
      if (slot === 'BREAK' || slot === 'LUNCH') {
        html += `<td class="cell-break">${slot === 'BREAK' ? 'Break' : 'Lunch'}</td>`;
      } else if (!cell) {
        html += `<td class="cell-free">—</td>`;
      } else {
        html += `<td style="${subjectColor(cell.subject)}border-radius:4px;padding:6px 4px;">
          <div class="cell-subject">${cell.subject}</div>
          <div class="cell-teacher">${cell.teacher}</div>
          <div class="cell-room">${cell.room}</div>
        </td>`;
      }
    }
    html += '</tr>';
  }

  document.getElementById('timetableTable').innerHTML = html;

  // Status message
  const total = subjects.reduce((a, s) => a + s.hours, 0);
  const statusEl = document.getElementById('statusMsg');
  if (conflicts === 0) {
    statusEl.innerHTML = `<div class="status status-ok">
      Timetable generated successfully. All ${total} periods scheduled with no conflicts.
    </div>`;
  } else {
    statusEl.innerHTML = `<div class="status status-warn">
      ${conflicts} period(s) could not be placed due to constraints or slot limitations.
      Try relaxing constraints or adding more slots.
    </div>`;
  }

  const out = document.getElementById('outputSection');
  out.style.display = 'block';
  out.scrollIntoView({ behavior: 'smooth' });
}

// ── Init ──────────────────────────────────────────────────────
renderSubjects();
renderTeachers();
