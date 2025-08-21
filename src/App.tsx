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
  backFloat: [{ key: "ear-water", title: "Ears-in Water", desc: "Relax head back; ears under water 10s" }]
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
        const practice
