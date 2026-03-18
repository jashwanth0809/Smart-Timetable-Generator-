# Smart Timetable Generator, NLP

A **B.Tech undergraduate NLP project** that creates weekly timetables from natural language commands.

## NLP Techniques Used

| Technique | Purpose |
|---|---|
| **Named Entity Recognition (NER)** | Extracts teacher names, subject names, days, time slots, room numbers |
| **Intent Detection** | Classifies commands as: schedule, unavailable, preferred, room |
| **Constraint Parsing** | Converts detected entities and intent into scheduling rules |

---

## How to Run (No installation needed)

1. Download and unzip this project folder.
2. Open `index.html` in any web browser (Chrome, Firefox, Edge).
3. That's it. No server, npm, or Python required!

---

## Project Structure

```
smart-timetable-generator/
├── index.html   ← Main UI
├── style.css    ← Stylesheet
├── app.js       ← NLP engine and timetable generator
└── README.md    ← This file
```

---

## How to Use

### NLP Command Input
Type natural language commands such as:

| Command | What it does |
|---|---|
| `Schedule Math with Dr. Sharma on Monday morning in Room 101` | Adds subject, teacher, and room constraint |
| `Dr. Rao is not available on Friday` | Adds unavailability constraint |
| `Prefer Chemistry on Tuesday afternoon` | Sets preferred time slot |
| `Add Physics with Prof. Kumar in Lab 202` | Adds subject and room |

Press **Enter** or click **Parse ↗** to process the command.

### Manual Entry
- Use the **Subjects** panel to add subjects and weekly hours.
- Use the **Teachers** panel to assign teachers to subjects.
- Use the **Constraints** panel to add rules manually.

### Generate
Click **Generate Timetable** to create a weekly schedule that avoids conflicts.

---

## NLP Pipeline (app.js)

```
Input sentence
    │
    ▼
Step 1: NER
  ├── Teacher names  (title-based: Dr., Prof., Mr., Ms.)
  ├── Subject names  (matched against known subject list)
  ├── Days           (regex: Monday to Sunday)
  ├── Time slots     (regex: morning, afternoon, 9am, etc.)
  └── Room numbers   (regex: Room 101, Lab 202, etc.)
    │
    ▼
Step 2: Intent Detection
  ├── schedule             → place subject in timetable
  ├── constraint_unavailable → block teacher on that day
  ├── constraint_preferred   → prefer subject on that day
  └── constraint_room        → assign room to subject
    │
    ▼
Step 3: Constraint Parsing
  └── Structured constraint object added to constraint list
    │
    ▼
Step 4: Timetable Generation
  └── CSP-style greedy allocation that respects all constraints
```

---

## Technologies

- HTML5, CSS3, Vanilla JavaScript
- No external libraries or frameworks required
- Runs completely in the browser

---

## Sample NLP Commands to Try

```
Schedule Mathematics with Dr. Sharma on Monday morning in Room 101
Prof. Rao is not available on Friday
Prefer Chemistry on Tuesday afternoon
Add Computer Science with Ms. Anita in Lab 302
Dr. Kumar is not available on Wednesday
Schedule English with Mr. Suresh on Thursday
```

---

*Project developed for B.Tech, Natural Language Processing*