import React, { useEffect, useMemo, useState } from "react";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const ALL_SKILLS = [
  { key: "waterComfort", name: "Water Comfort", yt: "https://www.youtube.com/watch?v=zdY0mN2rS5k", cat: "Beginner" },
  { key: "backFloat", name: "Back Float", yt: "https://www.youtube.com/watch?v=1FErpTR7j98", cat: "Beginner" },
  { key: "breathControl", name: "Breath Control", yt: "https://www.youtube.com/watch?v=l91pohjGZf4", cat: "Beginner" },
  { key: "frontGlide", name: "Front Glide", yt: "https://www.youtube.com/watch?v=bn5xJErH_7Q", cat: "Beginner" },
  { key: "flutterKick", name: "Flutter Kick", yt: "https://www.youtube.com/watch?v=8N9jg3zqbDU", cat: "Intermediate" },
  { key: "freestyleArms", name: "Freestyle Arms + Breathing", yt: "https://www.youtube.com/watch?v=dpzv2v8f_-k", cat: "Intermediate" },
  { key: "treading", name: "Treading Water", yt: "https://www.youtube.com/watch?v=OQ0_owTIr2M", cat: "Intermediate" },
  { key: "breaststroke", name: "Breaststroke", yt: "https://www.youtube.com/watch?v=CqkRjvZrC1Y", cat: "Advanced" },
  { key: "endurance25", name: "Endurance: 25y continuous", yt: "https://www.youtube.com/watch?v=Qq1k1u4k0H4", cat: "Advanced" }
];

const DRILLS: Record<string, { key: string; title: string; desc: string; yt?: string }[]> = {
  waterComfort: [
    { key: "bubble-party", title: "Bubble Party", desc: "Face in, blow bubbles 5s cycles", yt: "https://www.youtube.com/watch?v=l91pohjGZf4" },
    { key: "starfish-float", title: "Starfish Float (assisted)", desc: "Back float with support" }
  ],
  backFloat: [{ key: "ear-water", title: "Ears-in Water", desc: "Relax head back; ears under water 10s" }],
  breathControl: [{ key: "sink-downs", title: "Sink Downs", desc: "Exhale to sink; stand to breathe" }],
  frontGlide: [{ key: "superman-glide", title: "Superman Glide", desc: "Push & streamline for 3–5 yards" }],
  flutterKick: [{ key: "kickboard-kicks", title: "Kickboard Kicks", desc: "Small fast kicks, straight legs, 2×25y" }],
  freestyleArms: [{ key: "side-breath", title: "Side Breath Drill", desc: "1-arm free + side breath every 3 kicks" }],
  treading: [{ key: "eggbeater", title: "Eggbeater Basics", desc: "Alternating knee circles; tall chest" }],
  breaststroke: [{ key: "glide-count", title: "Glide Count", desc: "Pull-breathe-kick-glide; 2s glide" }],
  endurance25: [{ key: "pyramid", title: "Pyramid 25s", desc: "4×25 easy; 2×25 moderate; 1×25 strong" }]
};

const STATUS = ["Not Started", "In Progress", "Achieved"] as const;
type Status = typeof STATUS[number];

type LogItem = { id: string; type: "attempt" | "achieved"; date: string; cohortId: string | null; notes: string };

type SkillState = {
  status: Status;
  logs: LogItem[];
  achievedAt?: string;
  achievedCohortId?: string | null;
};

type PracticeItem = { id: string; skillKey: string; drillKey: string; title: string; due: string; notes: string; status: "Assigned" | "Done" };

type Student = {
  id: string;
  name: string;
  notes: { id: string; date: string; text: string }[];
  practice: PracticeItem[];
  cohortHistory: string[];
  currentCohortId: string | null;
  skills: Record<string, SkillState>;
};

type Cohort = { id: string; name: string; start: string; end: string };

function computeLevel(skillMap: Record<string, SkillState>) {
  const achieved = Object.values(skillMap || {}).filter((s) => s && s.status === "Achieved").length;
  if (achieved >= 8) return "Advanced";
  if (achieved >= 4) return "Intermediate";
  return "Beginner";
}

function defaultSkillMap(): Record<string, SkillState> {
  const base: Record<string, SkillState> = {};
  for (const s of ALL_SKILLS) base[s.key] = { status: "Not Started", logs: [] };
  return base;
}

function normalizeStudent(st: Partial<Student>): Student {
  const skills = { ...defaultSkillMap(), ...(st.skills || {}) };
  for (const key of Object.keys(skills)) {
    const val: any = (skills as any)[key];
    if (val == null || typeof val === "string") {
      (skills as any)[key] = { status: val || "Not Started", logs: [] };
    } else {
      if (!("status" in val)) val.status = "Not Started";
      if (!Array.isArray(val.logs)) val.logs = [];
    }
  }
  return {
    id: st.id || genId(),
    name: st.name || "Unnamed",
    notes: Array.isArray(st.notes) ? st.notes : [],
    practice: Array.isArray(st.practice) ? st.practice : [],
    cohortHistory: Array.isArray(st.cohortHistory) ? st.cohortHistory : [],
    currentCohortId: st.currentCohortId ?? null,
    skills
  } as Student;
}

function sixWeeksFrom(dateStr: string) {
  const d = new Date(dateStr);
  const end = new Date(d.getTime() + 1000 * 60 * 60 * 24 * 42);
  return end.toISOString();
}

const SAMPLE_COHORTS: Cohort[] = [
  { id: genId(), name: "Summer A", start: new Date().toISOString(), end: sixWeeksFrom(new Date().toISOString()) },
  { id: genId(), name: "Summer B", start: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), end: sixWeeksFrom(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()) }
];

const SAMPLE_STUDENTS: Student[] = [
  {
    id: genId(),
    name: "Lilly Johnson",
    notes: [],
    practice: [],
    cohortHistory: [],
    currentCohortId: null,
    skills: {
      ...defaultSkillMap(),
      waterComfort: { status: "Achieved", logs: [{ id: genId(), type: "achieved", date: new Date().toISOString(), cohortId: null, notes: "Comfortable in shallow end" }] },
      backFloat: { status: "In Progress", logs: [] }
    } as any
  },
  {
    id: genId(),
    name: "Ryan Patel",
    notes: [],
    practice: [],
    cohortHistory: [],
    currentCohortId: null,
    skills: {
      ...defaultSkillMap(),
      flutterKick: { status: "Achieved", logs: [{ id: genId(), type: "achieved", date: new Date().toISOString(), cohortId: null, notes: "" }] },
      freestyleArms: { status: "In Progress", logs: [] }
    } as any
  }
].map(normalizeStudent);

function useLocalState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState] as const;
}

export default function App() {
  const [cohorts, setCohorts] = useLocalState<Cohort[]>("swimsteps_cohorts", SAMPLE_COHORTS);
  const [studentsRaw, setStudents] = useLocalState<Student[]>("swimsteps_students", SAMPLE_STUDENTS);
  const students = useMemo(() => (Array.isArray(studentsRaw) ? studentsRaw : SAMPLE_STUDENTS).map(normalizeStudent), [studentsRaw]);
  const [selectedId, setSelectedId] = useLocalState<string | null>("swimsteps_selected", students[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"skills" | "notes" | "practice" | "cohorts" | "resources">("skills");
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    const exists = students.some((s) => s.id === selectedId);
    if (!exists) setSelectedId(students[0]?.id ?? null);
  }, [students, selectedId, setSelectedId]);

  const cohortsSafe = useMemo(() => (Array.isArray(cohorts) ? cohorts : []), [cohorts]);
  const filtered = useMemo(() => students.filter((st) => st.name.toLowerCase().includes(search.toLowerCase())), [students, search]);
  const selected = students.find((s) => s.id === selectedId) || null;

  function saveNewStudent() {
    const base = Array.isArray(studentsRaw) ? studentsRaw : [];
    const name = form?.name?.trim();
    if (!name) return;
    const newSt = normalizeStudent({ id: genId(), name, notes: [], practice: [], skills: defaultSkillMap(), cohortHistory: [], currentCohortId: null });
    setStudents([...base, newSt]);
    setSelectedId(newSt.id);
    setForm(null);
  }
  function removeStudent(id: string) {
    const base = Array.isArray(studentsRaw) ? studentsRaw : [];
    setStudents(base.filter((s) => s.id !== id));
  }
  function saveNewCohort() {
    const name = form?.name?.trim();
    if (!name) return;
    const startStr = form?.start || new Date().toISOString().slice(0, 10);
    const startISO = new Date(startStr).toISOString();
    const newC: Cohort = { id: genId(), name, start: startISO, end: sixWeeksFrom(startISO) };
    setCohorts([newC, ...cohortsSafe]);
    setForm(null);
  }
  function setStudentCohort(stuId: string, cid: string | null) {
    const base = Array.isArray(studentsRaw) ? studentsRaw : [];
    setStudents(
      base.map((s) => {
        if (s.id !== stuId) return s;
        const hist = new Set(s.cohortHistory || []);
        if (cid) hist.add(cid);
        return { ...s, currentCohortId: cid, cohortHistory: Array.from(hist) };
      })
    );
  }
  function updateSkillStatus(stuId: string, key: string, dir: number) {
    const base = Array.isArray(studentsRaw) ? studentsRaw : [];
    setStudents(
      base.map((s) => {
        if (s.id !== stuId) return s;
        const cur0 = (s.skills && s.skills[key]) || ({ status: "Not Started", logs: [] } as SkillState);
        const cur: SkillState = { ...cur0, logs: Array.isArray(cur0.logs) ? cur0.logs : [] };
        const idx = STATUS.indexOf(cur.status);
        const nextStatus = STATUS[Math.max(0, Math.min(STATUS.length - 1, idx + dir))];
        const next = { ...cur, status: nextStatus };
        return { ...s, skills: { ...(s.skills || {}), [key]: next } };
      })
    );
  }
  function addSkillLog(stuId: string, key: string, payload: Omit<LogItem, "id">) {
    const base = Array.isArray(studentsRaw) ? studentsRaw : [];
    setStudents(
      base.map((s) => {
        if (s.id !== stuId) return s;
        const cur0 = (s.skills && s.skills[key]) || ({ status: "Not Started", logs: [] } as SkillState);
        const cur: SkillState = { ...cur0, logs: Array.isArray(cur0.logs) ? cur0.logs : [] };
        const logs = [{ id: genId(), ...payload }, ...cur.logs];
        const next: SkillState = { ...cur, logs };
        if (payload.type === "achieved" && cur.status !== "Achieved") {
          next.status = "Achieved";
          next.achievedAt = payload.date;
          next.achievedCohortId = payload.cohortId || s.currentCohortId || null;
        }
        return { ...s, skills: { ...(s.skills || {}), [key]: next } };
      })
    );
    setForm(null);
  }
  function addPractice(stuId: string, { skillKey, drillKey, due, notes }: { skillKey: string; drillKey: string; due: string; notes: string }) {
    const base = Array.isArray(studentsRaw) ? studentsRaw : [];
    setStudents(
      base.map((s) => {
        if (s.id !== stuId) return s;
        const drill = (DRILLS[skillKey] || []).find((d) => d.key === drillKey);
        const title = drill ? `${ALL_SKILLS.find((x) => x.key === skillKey)?.name}: ${drill.title}` : ALL_SKILLS.find((x) => x.key === skillKey)?.name || "Practice";
        const item: PracticeItem = { id: genId(), skillKey, drillKey, title, due, notes: notes || "", status: "Assigned" };
        const practice = Array.isArray(s.practice) ? s.practice : [];
        return { ...s, practice: [item, ...practice] };
      })
    );
    setForm(null);
  }
  function togglePractice(stuId: string, pid: string) {
    const base = Array.isArray(studentsRaw) ? studentsRaw : [];
    setStudents(
      base.map((s) => {
        if (s.id !== stuId) return s;
        const practice = Array.isArray(s.practice) ? s.practice : [];
        return { ...s, practice: practice.map((p) => (p.id === pid ? { ...p, status: p.status === "Assigned" ? "Done" : "Assigned" } : p)) };
      })
    );
  }
  function removePractice(stuId: string, pid: string) {
    const base = Array.isArray(studentsRaw) ? studentsRaw : [];
    setStudents(base.map((s) => (s.id !== stuId ? s : { ...s, practice: (Array.isArray(s.practice) ? s.practice : []).filter((p) => p.id !== pid) })));
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  function openLogForm(mode: "attempt" | "achieved", skillKey: string) {
    setForm({ mode, skillKey, date: todayStr, cohortId: selected?.currentCohortId || "", notes: "" });
  }
  function openPracticeForm() {
    const firstSkill = ALL_SKILLS[0]?.key || "";
    const firstDrill = (DRILLS[firstSkill] || [])[0]?.key || "";
    setForm({ mode: "practice", skillKey: firstSkill, drillKey: firstDrill, due: todayStr, notes: "" });
  }

  return (
    <div style={{ minHeight: "100vh", padding: 16, background: "#f8fafc", color: "#0f172a" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Header title="SwimSteps – Fancy" />

        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setForm({ mode: "addStudent", name: "" })}>Add student</button>
            <button onClick={() => setForm({ mode: "addCohort", name: "", start: todayStr })}>Add cohort</button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify({ students: studentsRaw, cohorts: cohortsSafe }, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "swimsteps-data.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export JSON
            </button>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <span style={{ border: "1px solid #cbd5e1", padding: "6px 10px", borderRadius: 6 }}>Import JSON</span>
              <input
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => {
                    try {
                      const d = JSON.parse(r.result as string);
                      if (d && typeof d === "object") {
                        if (Array.isArray(d.students)) setStudents(d.students.map(normalizeStudent));
                        if (Array.isArray(d.cohorts)) setCohorts(d.cohorts);
                      }
                    } catch {
                      alert("Invalid file");
                    }
                  };
                  r.readAsText(f);
                }}
              />
            </label>
          </div>
          <input placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ fontSize: 14, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }} />
        </div>

        {form && form.mode === "addStudent" && (
          <Card>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student name" />
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button onClick={() => setForm(null)}>Cancel</button>
                <button onClick={saveNewStudent}>Save</button>
              </div>
            </div>
          </Card>
        )}

        {form && form.mode === "addCohort" && (
          <Card>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cohort name" />
              <input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button onClick={() => setForm(null)}>Cancel</button>
                <button onClick={saveNewCohort}>Save</button>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 16 }}>
          <Roster students={filtered} selectedId={selectedId} onSelect={setSelectedId} onRemove={selected ? () => removeStudent(selected.id) : undefined} />

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
            <h3 style={{ margin: 0 }}>{selected ? selected.name : "Select a student"}</h3>
            {selected && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <Badge>{computeLevel(selected.skills)}</Badge>
                <label style={{ fontSize: 14, color: "#334155", marginLeft: "auto" }}>Current cohort:</label>
                <select value={selected.currentCohortId || ""} onChange={(e) => setStudentCohort(selected.id, e.target.value || null)}>
                  <option value="">— none —</option>
                  {cohortsSafe.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({new Date(c.start).toLocaleDateString()} → {new Date(c.end).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!selected ? (
              <div style={{ color: "#475569", fontSize: 14, marginTop: 8 }}>Choose a student from the roster to view and update progress.</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {(["skills", "notes", "practice", "cohorts", "resources"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} style={{ borderRadius: 999, padding: "6px 10px", background: tab === t ? "#e2e8f0" : "#fff" }}>
                      {t}
                    </button>
                  ))}
                </div>

                {tab === "skills" && (
                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    {ALL_SKILLS.map((sk) => {
                      const base = selected.skills && selected.skills[sk.key];
                      const ss = base ? { logs: Array.isArray(base.logs) ? base.logs : [], status: base.status || "Not Started", achievedAt: base.achievedAt, achievedCohortId: base.achievedCohortId } : { status: "Not Started", logs: [] };
                      const achievedCohort = cohortsSafe.find((c) => c.id === ss.achievedCohortId);
                      const logs = Array.isArray(ss.logs) ? ss.logs : [];
                      return (
                        <Card key={sk.key}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{sk.name}</div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>{sk.cat}</div>
                            </div>
                            <Badge>{ss.status}</Badge>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                            <button onClick={() => updateSkillStatus(selected.id, sk.key, -1)}>-</button>
                            <button onClick={() => updateSkillStatus(selected.id, sk.key, +1)}>+</button>
                            <button onClick={() => openLogForm("attempt", sk.key)}>Log attempt</button>
                            <button onClick={() => openLogForm("achieved", sk.key)}>Mark achieved</button>
                            <a href={sk.yt} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", fontSize: 14, textDecoration: "underline" }}>
                              Watch
                            </a>
                          </div>
                          {ss.achievedAt && (
                            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
                              Achieved on <strong>{new Date(ss.achievedAt).toLocaleDateString()}</strong>
                              {achievedCohort && (
                                <>
                                  {" "}
                                  in <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 6 }}>{achievedCohort.name}</span>
                                </>
                              )}
                            </div>
                          )}
                          <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                            {logs.map((lg) => {
                              const c = cohortsSafe.find((x) => x.id === lg.cohortId);
                              return (
                                <li key={lg.id} style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                                  <strong>{lg.type === "achieved" ? "Achieved" : "Attempt"}</strong> · {new Date(lg.date).toLocaleDateString()} {c && (
                                    <>
                                      · <span style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 6 }}>{c.name}</span>
                                    </>
                                  )}{" "}
                                  {lg.notes ? `— ${lg.notes}` : ""}
                                </li>
                              );
                            })}
                          </ul>

                          {form && (form.mode === "attempt" || form.mode === "achieved") && form.skillKey === sk.key && (
                            <div style={{ marginTop: 10, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{form.mode === "attempt" ? "Log attempt" : "Mark achieved"}</div>
                              <div style={{ display: "grid", gap: 6 }}>
                                <label style={{ fontSize: 12 }}>
                                  Date: <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                                </label>
                                <label style={{ fontSize: 12 }}>
                                  Cohort:
                                  <select value={form.cohortId || ""} onChange={(e) => setForm({ ...form, cohortId: e.target.value })}>
                                    <option value="">— none —</option>
                                    {cohortsSafe.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label style={{ fontSize: 12 }}>
                                  Notes:
                                  <br />
                                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", height: 64 }} />
                                </label>
                                <div style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                  <button onClick={() => setForm(null)}>Cancel</button>
                                  <button
                                    onClick={() =>
                                      addSkillLog(selected.id, sk.key, {
                                        type: form.mode,
                                        date: new Date(form.date).toISOString(),
                                        cohortId: form.cohortId || null,
                                        notes: form.notes || ""
                                      })
                                    }
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}

                {tab === "notes" && (
                  <div style={{ marginTop: 12 }}>
                    <AddNote
                      onAdd={(t) =>
                        setStudents((Array.isArray(studentsRaw) ? studentsRaw : []).map((s) =>
                          s.id !== selected.id ? s : { ...s, notes: [{ id: genId(), date: new Date().toISOString(), text: t }, ...(Array.isArray(s.notes) ? s.notes : [])] }
                        ))
                      }
                    />
                    <ul style={{ marginTop: 12, paddingLeft: 16 }}>
                      {(Array.isArray(selected.notes) ? selected.notes : []).length === 0 && <li style={{ fontSize: 14, color: "#64748b" }}>No notes yet. Add your first lesson summary.</li>}
                      {(Array.isArray(selected.notes) ? selected.notes : []).map((n) => (
                        <li key={n.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, marginTop: 8 }}>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{new Date(n.date).toLocaleString()}</div>
                          <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{n.text}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tab === "practice" && (
                  <div style={{ marginTop: 12 }}>
                    <Card>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 600 }}>Assign practice</div>
                        <button onClick={openPracticeForm}>New assignment</button>
                      </div>

                      {form && form.mode === "practice" && (
                        <div style={{ marginTop: 8, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ fontSize: 12 }}>
                              Skill:
                              <select
                                value={form.skillKey}
                                onChange={(e) => {
                                  const skillKey = e.target.value;
                                  const firstDrill = (DRILLS[skillKey] || [])[0]?.key || "";
                                  setForm({ ...form, skillKey, drillKey: firstDrill });
                                }}
                              >
                                {ALL_SKILLS.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label style={{ fontSize: 12 }}>
                              Drill:
                              <select value={form.drillKey} onChange={(e) => setForm({ ...form, drillKey: e.target.value })}>
                                {(DRILLS[form.skillKey] || []).map((d) => (
                                  <option key={d.key} value={d.key}>
                                    {d.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label style={{ fontSize: 12 }}>
                              Due date: <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
                            </label>
                            <label style={{ fontSize: 12 }}>
                              Notes:
                              <br />
                              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", height: 64 }} />
                            </label>
                            <div style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button onClick={() => setForm(null)}>Cancel</button>
                              <button onClick={() => addPractice(selected.id, { skillKey: form.skillKey, drillKey: form.drillKey, due: new Date(form.due).toISOString(), notes: form.notes })}>Assign</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>

                    <Card style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 600 }}>Student practice list</div>
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        {(Array.isArray(selected.practice) ? selected.practice : []).length === 0 && <li style={{ fontSize: 14, color: "#64748b" }}>No assignments yet.</li>}
                        {(Array.isArray(selected.practice) ? selected.practice : []).map((p) => {
                          const drill = (DRILLS[p.skillKey] || []).find((d) => d.key === p.drillKey);
                          return (
                            <li key={p.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, marginTop: 8, fontSize: 14 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                                  <div style={{ fontSize: 12, color: "#64748b" }}>
                                    Due {new Date(p.due).toLocaleDateString()} · {p.status}
                                  </div>
                                  {drill && (
                                    <div style={{ fontSize: 12 }}>
                                      {drill.desc}{" "}
                                      {drill.yt && (
                                        <a href={drill.yt} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                                          Watch
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {p.notes && <div style={{ fontSize: 12, color: "#475569" }}>Notes: {p.notes}</div>}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button onClick={() => togglePractice(selected.id, p.id)}>{p.status === "Assigned" ? "Mark done" : "Mark assigned"}</button>
                                  <button onClick={() => removePractice(selected.id, p.id)} style={{ background: "#fee2e2" }}>
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  </div>
                )}

                {tab === "cohorts" && (
                  <div style={{ marginTop: 12 }}>
                    <Card>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Cohort history</div>
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        {(!selected.cohortHistory || selected.cohortHistory.length === 0) && <li style={{
