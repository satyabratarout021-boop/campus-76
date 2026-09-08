import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import * as faceapi from "@vladmandic/face-api";
import {
  LayoutDashboard, QrCode, Map, History, AlertTriangle, Bell, Settings,
  LogOut, Menu, X, Users, Activity, CalendarDays, Search, Plus,
  CheckCircle2, Camera, ShieldCheck, Download, Printer, Clock3,
  Navigation, Wifi, Building2, ChevronRight, Moon, Sun, Trash2,
  UserRound, BarChart3, ClipboardList, RefreshCw, CreditCard, Receipt, CircleDollarSign,
  Bot, Send, Sparkles
} from "lucide-react";

const locations = [
  ["Main Library","Central Block","Ground","Academic", "3 min"],
  ["CSE Lab","B-Block","2nd","Lab", "5 min"],
  ["Canteen","Student Activity Center","Ground","Food", "4 min"],
  ["Principal Office","Admin Block","1st","Admin", "7 min"],
  ["Sports Complex","East Wing","Ground","Sports", "8 min"],
  ["Academic Block","Central Block","1st","Academic", "2 min"],
  ["Admin Block","Admin Block","Ground","Admin", "6 min"],
  ["Parking","North Gate","Ground","Transport", "9 min"],
  ["Main Gate","Entrance","Ground","Security", "1 min"]
];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function uid(prefix="ID") { return `${prefix}-${Math.floor(10000 + Math.random()*89999)}`; }
function initials(name) { return name.split(/\s+/).filter(Boolean).map(part=>part[0]).join("").slice(0,2).toUpperCase() || "ST"; }
function studentDataKey(studentId) { return `cc_student_record_${studentId}`; }
function readStudentAttendance(studentId) { return load(studentDataKey(studentId),[]); }
function paymentDataKey(studentId) { return `cc_student_payments_${studentId}`; }
function readStudentPayments(studentId) { return load(paymentDataKey(studentId),[]); }
function timetableBranchKey(branch) { return String(branch||"").trim().toUpperCase().replace(/\s+/g,"_"); }

const demoTimetableSchedule = {
  Monday: [
    { start: "09:00 AM - 10:00 AM", subject: "Mathematics", faculty: "Prof. Sharma", room: "Room 101", id: "MON-1" },
    { start: "10:00 AM - 11:00 AM", subject: "Programming", faculty: "Prof. Kumar", room: "Lab 1", id: "MON-2" },
    { start: "11:30 AM - 12:30 PM", subject: "Database Management", faculty: "Dr. Nair", room: "Room 204", id: "MON-3" },
    { start: "01:30 PM - 02:30 PM", subject: "Web Development", faculty: "Mr. Singh", room: "Room 105", id: "MON-4" }
  ],
  Tuesday: [
    { start: "09:00 AM - 10:00 AM", subject: "Data Structures", faculty: "Prof. Rao", room: "Room 102", id: "TUE-1" },
    { start: "10:00 AM - 11:00 AM", subject: "Java Programming", faculty: "Dr. Verma", room: "Lab 2", id: "TUE-2" },
    { start: "11:30 AM - 12:30 PM", subject: "Computer Networks", faculty: "Prof. Iyer", room: "Room 203", id: "TUE-3" },
    { start: "01:30 PM - 02:30 PM", subject: "Mathematics", faculty: "Prof. Sharma", room: "Room 101", id: "TUE-4" }
  ],
  Wednesday: [
    { start: "09:00 AM - 10:00 AM", subject: "Python", faculty: "Dr. Patel", room: "Lab 1", id: "WED-1" },
    { start: "10:00 AM - 11:00 AM", subject: "Operating Systems", faculty: "Prof. Joshi", room: "Room 202", id: "WED-2" },
    { start: "11:30 AM - 12:30 PM", subject: "Database Management", faculty: "Dr. Nair", room: "Room 204", id: "WED-3" },
    { start: "01:30 PM - 02:30 PM", subject: "Web Development", faculty: "Mr. Singh", room: "Room 105", id: "WED-4" }
  ],
  Thursday: [
    { start: "09:00 AM - 10:00 AM", subject: "Java Programming", faculty: "Dr. Verma", room: "Lab 2", id: "THU-1" },
    { start: "10:00 AM - 11:00 AM", subject: "Data Structures", faculty: "Prof. Rao", room: "Room 102", id: "THU-2" },
    { start: "11:30 AM - 12:30 PM", subject: "Computer Networks", faculty: "Prof. Iyer", room: "Room 203", id: "THU-3" },
    { start: "01:30 PM - 02:30 PM", subject: "Artificial Intelligence", faculty: "Dr. Khan", room: "Room 301", id: "THU-4" }
  ],
  Friday: [
    { start: "09:00 AM - 10:00 AM", subject: "Mathematics", faculty: "Prof. Sharma", room: "Room 101", id: "FRI-1" },
    { start: "10:00 AM - 11:00 AM", subject: "Python", faculty: "Dr. Patel", room: "Lab 1", id: "FRI-2" },
    { start: "11:30 AM - 12:30 PM", subject: "Software Engineering", faculty: "Dr. Sen", room: "Room 205", id: "FRI-3" },
    { start: "01:30 PM - 02:30 PM", subject: "Project Work", faculty: "Mr. Das", room: "Lab 3", id: "FRI-4" }
  ],
  Saturday: [
    { start: "09:00 AM - 10:00 AM", subject: "Programming", faculty: "Prof. Kumar", room: "Lab 1", id: "SAT-1" },
    { start: "10:00 AM - 11:00 AM", subject: "Data Structures", faculty: "Prof. Rao", room: "Room 102", id: "SAT-2" },
    { start: "11:30 AM - 12:30 PM", subject: "Web Development", faculty: "Mr. Singh", room: "Room 105", id: "SAT-3" },
    { start: "01:30 PM - 02:30 PM", subject: "Project Work", faculty: "Mr. Das", room: "Lab 3", id: "SAT-4" }
  ]
};

const demoTimetableBranches = {
  CSE: demoTimetableSchedule,
  ECE: demoTimetableSchedule,
  EEE: demoTimetableSchedule,
  MECHANICAL: demoTimetableSchedule,
  CIVIL: demoTimetableSchedule
};

const demoFeedback = [
  { id: "FB-101", studentId: "STU-DEMO-1", studentName: "Demo Student", category: "Subject", subject: "Mathematics", teacher: "Prof. Sharma", rating: 5, comment: "Excellent teaching and clear explanations during the weekly problem-solving session.", anonymous: false, status: "Submitted", createdAt: "2026-09-03T09:45:00.000Z" },
  { id: "FB-102", studentId: "STU-DEMO-2", studentName: "Neha Kapoor", category: "Teacher", subject: "Programming", teacher: "Prof. Kumar", rating: 4, comment: "Very helpful during lab sessions and encouraged students to explore more concepts.", anonymous: false, status: "Reviewed", createdAt: "2026-09-04T11:20:00.000Z" },
  { id: "FB-103", studentId: "STU-DEMO-3", studentName: "Anonymous", category: "Campus Service", subject: "Campus Support", teacher: "Campus Office", rating: 3, comment: "The support desk was polite but the response time could be faster.", anonymous: true, status: "Submitted", createdAt: "2026-09-05T14:00:00.000Z" },
  { id: "FB-104", studentId: "STU-DEMO-4", studentName: "Aman Deep", category: "Subject", subject: "Web Development", teacher: "Mr. Singh", rating: 5, comment: "The project-based learning style helped me understand front-end development better.", anonymous: false, status: "Reviewed", createdAt: "2026-09-06T15:30:00.000Z" }
];

const demoAttendanceSummary = {
  overall: 82,
  lectures: 120,
  present: 98,
  absent: 18,
  late: 4,
  subjects: [
    ["Mathematics", 85, "17/20"],
    ["Java Programming", 90, "18/20"],
    ["Database Management", 80, "16/20"],
    ["Web Development", 75, "15/20"],
    ["Data Structures", 85, "17/20"],
    ["Computer Networks", 75, "15/20"]
  ]
};

const demoAttendanceRecords = [
  { date: "2026-09-05", subject: "Computer Networks", teacher: "Prof. Iyer", time: "11:30 AM - 12:30 PM", room: "Room 203", status: "Present", session: "DEMO-NET-0905" },
  { date: "2026-09-04", subject: "Web Development", teacher: "Mr. Singh", time: "01:30 PM - 02:30 PM", room: "Room 105", status: "Late", session: "DEMO-WEB-0904" },
  { date: "2026-09-04", subject: "Database Management", teacher: "Dr. Nair", time: "11:30 AM - 12:30 PM", room: "Room 204", status: "Present", session: "DEMO-DB-0904" },
  { date: "2026-09-03", subject: "Java Programming", teacher: "Dr. Verma", time: "10:00 AM - 11:00 AM", room: "Lab 2", status: "Absent", session: "DEMO-JAVA-0903" },
  { date: "2026-09-03", subject: "Data Structures", teacher: "Prof. Rao", time: "09:00 AM - 10:00 AM", room: "Room 102", status: "Present", session: "DEMO-DS-0903" },
  { date: "2026-09-02", subject: "Mathematics", teacher: "Prof. Sharma", time: "09:00 AM - 10:00 AM", room: "Room 101", status: "Present", session: "DEMO-MATH-0902" },
  { date: "2026-09-01", subject: "Computer Networks", teacher: "Prof. Iyer", time: "11:30 AM - 12:30 PM", room: "Room 203", status: "Late", session: "DEMO-NET-0901" },
  { date: "2026-08-31", subject: "Web Development", teacher: "Mr. Singh", time: "01:30 PM - 02:30 PM", room: "Room 105", status: "Present", session: "DEMO-WEB-0831" }
];

function ensureDemoTimetables() {
  const stored = load("cc_timetables", {});
  const merged = { ...demoTimetableBranches };
  Object.keys(stored).forEach((branchKey) => {
    merged[branchKey] = { ...(merged[branchKey] || {}), ...(stored[branchKey] || {}) };
  });
  if (JSON.stringify(stored) !== JSON.stringify(merged)) {
    save("cc_timetables", merged);
  }
  return merged;
}

function readStudentTimetable(branch) {
  const branchKey = timetableBranchKey(branch || "CSE");
  const allTimetables = ensureDemoTimetables();
  const branchData = allTimetables[branchKey] || allTimetables[branchKey.replace(/_/g, " ")] || allTimetables[Object.keys(allTimetables).find((key)=>key.toUpperCase()===branchKey)] || demoTimetableSchedule;
  if(!branchData)return null;
  return Object.fromEntries(Object.entries(branchData).map(([day,entries])=>[day,entries.map(entry=>[entry.start,entry.subject,entry.faculty,entry.room,entry.id])]));
}
async function hashPassword(value) { return bcrypt.hash(value, 10); }
async function verifyPassword(value, hash) { return bcrypt.compare(value, hash); }
async function legacyHashPassword(value) {
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

function SceneParticles() {
  const groupRef = useRef(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(240 * 3);
    for (let index = 0; index < positions.length; index += 3) {
      positions[index] = (Math.random() - 0.5) * 14;
      positions[index + 1] = (Math.random() - 0.5) * 9;
      positions[index + 2] = (Math.random() - 0.5) * 6;
    }
    return positions;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.012;
    groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.08) * 0.035;
  });

  return <group ref={groupRef}>
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[particles, 3]} /></bufferGeometry>
      <pointsMaterial color="#74dfff" size={0.035} transparent opacity={0.42} sizeAttenuation />
    </points>
    <mesh position={[-3.6, 1.6, -2.5]} rotation={[0.3, 0.5, 0]}>
      <icosahedronGeometry args={[1.15, 1]} />
      <meshBasicMaterial color="#27c7ff" wireframe transparent opacity={0.08} />
    </mesh>
    <mesh position={[3.4, -1.8, -3]} rotation={[0.5, 0.2, 0.4]}>
      <octahedronGeometry args={[1.35, 0]} />
      <meshBasicMaterial color="#6378ff" wireframe transparent opacity={0.09} />
    </mesh>
  </group>;
}

function DashboardBackdrop() {
  return <div className="dashboard-backdrop" aria-hidden="true">
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 8], fov: 55 }} gl={{ antialias: false, alpha: true }}>
      <SceneParticles />
    </Canvas>
  </div>;
}

function assistantDateLabel(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function assistantSchedule(branch) {
  const schedule = readStudentTimetable(branch) || {};
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return { schedule, day, today: schedule[day] || schedule.Monday || [] };
}

function buildAssistantReply(question, { role, profile, attendance, feedback }) {
  const query = question.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin" || !isStudent && !isTeacher;
  const demoAttendance = attendance.some(item => String(item.session || "").startsWith("DEMO-"));
  const summary = demoAttendance ? demoAttendanceSummary : {
    overall: attendance.length ? Math.round((attendance.filter(item => item.status === "Present").length / attendance.length) * 100) : 0,
    lectures: attendance.length,
    present: attendance.filter(item => item.status === "Present").length,
    absent: attendance.filter(item => item.status === "Absent").length,
    late: attendance.filter(item => item.status === "Late").length
  };
  const { schedule, day, today } = assistantSchedule(profile.branch || profile.department);
  const profiles = Object.values(load("cc_face_profiles", {}));
  const studentProfiles = profiles.filter(item => item.role === "student");
  const teacherProfiles = profiles.filter(item => item.role === "teacher");
  const lowSubjects = (demoAttendance ? demoAttendanceSummary.subjects : []).filter(item => item[1] < 80);
  const formatClasses = entries => entries.length ? entries.slice(0, 5).map(item => `• ${item[1]} · ${item[0]} · ${item[3]}`).join("\n") : "No classes are scheduled.";
  const recent = attendance.slice(0, 5).map(item => `• ${assistantDateLabel(item.date)} · ${item.subject} · ${item.status} · ${item.room}`).join("\n");
  const feedbackForUser = feedback.filter(item => item.studentId === profile.studentId);
  const feedbackSummary = feedbackForUser.length ? feedbackForUser.map(item => `• ${item.subject}: ${item.status}, ${item.rating}/5`).join("\n") : "No feedback submitted under this profile yet.";
  const classAverage = demoAttendance ? `${demoAttendanceSummary.overall}%` : summary.overall ? `${summary.overall}%` : "No attendance records yet";
  const studentCount = studentProfiles.length || 4;
  const teacherCount = teacherProfiles.length;

  if (isStudent) {
    if (query.includes("low attendance") || query.includes("below 75") || query.includes("weak subject")) return lowSubjects.length ? `Subjects below 80% attendance:\n${lowSubjects.map(item => `• ${item[0]}: ${item[1]}% (${item[2]})`).join("\n")}` : "No low-attendance subjects found in your current records.";
    if (query.includes("feedback")) return `Your feedback status:\n${feedbackSummary}`;
    if (query.includes("study") || query.includes("suggestion") || query.includes("improve")) return lowSubjects.length ? `Study suggestion: prioritize ${lowSubjects.map(item => item[0]).join(" and ")}. Review missed topics, attend the next sessions, and target at least 75% in each subject.` : `Study suggestion: your attendance is ${summary.overall}%. Keep a weekly revision block and maintain attendance above the 75% requirement.`;
    if (query.includes("history") || query.includes("recent attendance")) return recent ? `Recent attendance history:\n${recent}` : "No attendance history is available yet.";
    if (query.includes("timetable") || query.includes("schedule") || query.includes("class")) return query.includes("next") ? `Your next class on ${day}:\n${today[0] ? `• ${today[0][1]} · ${today[0][0]} · ${today[0][3]}` : "No upcoming class is scheduled."}` : `Your ${day} timetable:\n${formatClasses(today)}`;
    if (query.includes("attendance") || query.includes("overall") || query.includes("present") || query.includes("absent")) return `Your attendance is ${summary.overall}%: ${summary.present}/${summary.lectures} classes attended, ${summary.absent} absent, and ${summary.late} late.`;
  }
  if (isTeacher) {
    if (query.includes("feedback")) return `Recent student feedback:\n${feedback.slice(0, 4).map(item => `• ${item.subject}: ${item.rating}/5 · ${item.status}`).join("\n") || "No feedback is available."}`;
    if (query.includes("below 75") || query.includes("low attendance")) return `Students below 75%:\n${studentProfiles.map(student => `• ${student.name}: attendance record not available`).join("\n") || "No student roster is available."}`;
    if (query.includes("average") || query.includes("performance") || query.includes("summary")) return `Class performance summary: average attendance is ${classAverage}. Recent records show ${summary.present} present, ${summary.absent} absent, and ${summary.late} late entries.`;
    if (query.includes("timetable") || query.includes("schedule") || query.includes("class")) return `Your ${day} classes:\n${formatClasses(today)}`;
  }
  if (isAdmin) {
    if (query.includes("teacher")) return `There are ${teacherCount} registered teacher account${teacherCount === 1 ? "" : "s"} in the current local records.`;
    if (query.includes("student")) return `There are ${studentCount} registered student account${studentCount === 1 ? "" : "s"} in the current local records.`;
    if (query.includes("feedback")) return `Feedback summary: ${feedback.length} total entries, average rating ${(feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / Math.max(feedback.length, 1)).toFixed(1)}/5.`;
    if (query.includes("low attendance") || query.includes("below 75")) return `Low-attendance view: the demo subject records below 75% are Web Development and Computer Networks at 75%. Student-level records can be reviewed from Student Records when available.`;
    if (query.includes("statistics") || query.includes("attendance")) return `Attendance statistics: demo average ${demoAttendanceSummary.overall}%, ${demoAttendanceSummary.present} present, ${demoAttendanceSummary.absent} absent, and ${demoAttendanceSummary.late} late entries.`;
    if (query.includes("activity") || query.includes("campus")) return `Campus activity summary: ${studentCount} students, ${teacherCount} teachers, ${feedback.length} feedback entries, and ${today.length} classes on today's timetable.`;
  }
  return `I can help with ${isStudent ? "attendance, timetable, feedback, and study suggestions" : isTeacher ? "classes, attendance performance, and feedback" : "student counts, attendance statistics, feedback, and campus activity"}. Try one of the suggested questions below.`;
}

function AIAssistant({ role, profile, attendance, feedback, onClose }) {
  const [messages, setMessages] = useState([{ from: "assistant", text: `Hello ${profile.name || "there"}. I can help you with your ${role === "student" ? "attendance and timetable" : "campus data"}.` }]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const suggestions = role === "student" ? ["What is my attendance?", "What is my timetable today?", "Which subjects have low attendance?", "Give me a study suggestion"] : role === "teacher" ? ["What are my classes today?", "What is the class average attendance?", "Show recent student feedback"] : ["How many students are registered?", "Show attendance statistics", "Give me a campus activity summary"];
  const sendQuestion = (value=question) => {
    const trimmed=value.trim();
    if(!trimmed||loading)return;
    setQuestion("");setMessages(current=>[...current,{from:"user",text:trimmed}]);setLoading(true);
    window.setTimeout(()=>{setMessages(current=>[...current,{from:"assistant",text:buildAssistantReply(trimmed,{role,profile,attendance,feedback})}]);setLoading(false)},280);
  };
  return <motion.aside className="ai-assistant" initial={{opacity:0,y:18,scale:.98}} animate={{opacity:1,y:0,scale:1}}><div className="ai-head"><div><span className="ai-mark"><Sparkles size={15}/></span><div><b>Campus AI Assistant</b><small>{role === "student" ? "Student support" : role === "teacher" ? "Teacher support" : "Admin support"}</small></div></div><button className="icon-btn" onClick={onClose} aria-label="Close assistant">{<X/>}</button></div><div className="ai-messages">{messages.map((message,index)=><div className={`ai-message ${message.from}`} key={`${message.from}-${index}`}><span>{message.from === "assistant" ? <Bot size={14}/> : "You"}</span><p>{message.text}</p></div>)}{loading&&<div className="ai-message assistant"><span><Bot size={14}/></span><p className="ai-typing"><i/><i/><i/></p></div>}</div><div className="ai-suggestions">{suggestions.map(item=><button key={item} onClick={()=>sendQuestion(item)}>{item}</button>)}</div><form className="ai-input" onSubmit={event=>{event.preventDefault();sendQuestion()}}><input value={question} onChange={event=>setQuestion(event.target.value)} placeholder="Ask Campus AI..." aria-label="Ask Campus AI"/><button className="primary" type="submit" aria-label="Send question"><Send size={16}/></button></form></motion.aside>;
}

function App(){
  const [role,setRole]=useState(load("cc_role","student"));
  const [page,setPage]=useState("dashboard");
  const [logged,setLogged]=useState(false);
  const [mobile,setMobile]=useState(false);
  const [theme,setTheme]=useState(load("cc_theme","dark"));
  const [attendance,setAttendance]=useState([]);
  const [issues,setIssues]=useState(load("cc_issues",[]));
  const [notifications,setNotifications]=useState(load("cc_notifications",[
    {id:1,title:"New Announcement",text:"Final exams timetable published.",read:false},
    {id:2,title:"Attendance Ready",text:"Your attendance dashboard is updated.",read:false}
  ]));
  const [session,setSession]=useState(load("cc_session",null));
  const [profile,setProfile]=useState(load("cc_profile",{name:"Student"}));
  const [payments,setPayments]=useState([]);
  const [feedback,setFeedback]=useState(load("cc_feedback",demoFeedback));
  const [assistantOpen,setAssistantOpen]=useState(false);

  useEffect(()=>{
    if(logged&&profile.studentId)save(studentDataKey(profile.studentId),attendance);
  },[attendance,logged,profile.studentId]);
  useEffect(()=>{
    if(logged&&profile.studentId)save(paymentDataKey(profile.studentId),payments);
  },[payments,logged,profile.studentId]);
  useEffect(()=>save("cc_issues",issues),[issues]);
  useEffect(()=>save("cc_notifications",notifications),[notifications]);
  useEffect(()=>save("cc_session",session),[session]);
  useEffect(()=>save("cc_profile",profile),[profile]);
  useEffect(()=>save("cc_feedback",feedback),[feedback]);
  useEffect(()=>{try{localStorage.removeItem("cc_logged")}catch{}},[]);
  useEffect(()=>{
    const holidays=[
      {id:"holiday-founders-2026",title:"Founders Day Holiday",text:"Campus will remain closed on September 18, 2026."},
      {id:"holiday-break-2026",title:"Mid-Semester Break",text:"No classes are scheduled from October 12 to October 16, 2026."},
      {id:"holiday-diwali-2026",title:"Diwali Holiday",text:"Campus offices and classes will be closed on November 9, 2026."}
    ];
    setNotifications(current=>[...holidays.filter(holiday=>!current.some(item=>item.id===holiday.id)),...current]);
  },[]);
  useEffect(()=>{save("cc_theme",theme); document.body.dataset.theme=theme},[theme]);

  if(!logged) return <Login role={role} setRole={setRole} onLogin={(nextProfile)=>{if(!nextProfile?.studentId)return;save("cc_profile",nextProfile);setProfile(nextProfile);const storedAttendance=readStudentAttendance(nextProfile.studentId);setAttendance(storedAttendance.length?storedAttendance:role==="student"?demoAttendanceRecords:[]);setPayments(readStudentPayments(nextProfile.studentId));setPage("dashboard");setLogged(true)}} />;

  const logout=()=>{setLogged(false);try{localStorage.removeItem("cc_logged")}catch{}setPage("dashboard")};
  const studentNav=[
    ["dashboard","Dashboard",LayoutDashboard],["attendance","Mark Attendance",QrCode],
    ["history","Attendance History",History],["map","Campus Map",Map],["issue","Report Issue",AlertTriangle],
      ["timetable","Daily Timetable",CalendarDays],["feedback","Feedback",ClipboardList], ["payments","Payment History",Receipt],
    ["settings","Settings",Settings]
  ];
  const adminNav=[
    ["dashboard","Dashboard",LayoutDashboard],["create","Create Session",QrCode],
    ["monitor","Live Monitoring",Activity],["students","Student Records",Users],["marks","Student Marks",ClipboardList],["map","Campus Map",Map],["issue","Issue Reports",AlertTriangle],
    ["manage","Manage Campus",Building2],["salary","Teacher Salaries",CircleDollarSign],["feedback","Feedback",ClipboardList],["settings","Settings",Settings]
  ];
  const nav=role==="student"?studentNav:adminNav;
  const registeredStudents=Object.values(load("cc_face_profiles",{})).filter(student=>student.role==="student"&&student.studentId);

  return <div className="app-shell">
    <DashboardBackdrop />
    {assistantOpen&&<AIAssistant role={role} profile={profile} attendance={attendance} feedback={feedback} onClose={()=>setAssistantOpen(false)}/>} 
    <aside className={`sidebar ${mobile?"open":""}`}>
      <div className="brand"><div className="brand-orb"><Building2 size={22}/></div><div><b>CAMPUS</b><span>CONNECT 3D</span></div><button className="icon-btn mobile-close" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="prototype">PROTOTYPE MODE</div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?"nav active":"nav"} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <button className="nav ai-nav" onClick={()=>setAssistantOpen(true)}><Bot size={19}/><span>Campus AI Assistant</span></button>
        <button className="nav" onClick={()=>setPage("notifications")}><Bell size={19}/><span>Notifications</span>{notifications.some(n=>!n.read)&&<i/>}</button>
        <button className="nav" onClick={logout}><LogOut size={19}/><span>Logout</span></button>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="icon-btn" onClick={()=>setMobile(true)}><Menu/></button>
        <div className="crumb"><span>Campus Connect</span><ChevronRight size={14}/><b>{nav.find(x=>x[0]===page)?.[1] || "Notifications"}</b></div>
        <div className="top-actions">
          <button className="icon-btn" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Sun/>:<Moon/>}</button>
          <button className="notification-btn" onClick={()=>setPage("notifications")}><Bell size={19}/>{notifications.some(n=>!n.read)&&<i/>}</button>
          <button className="notification-btn ai-top-btn" onClick={()=>setAssistantOpen(true)} aria-label="Open Campus AI Assistant"><Bot size={19}/></button>
          <div className="user-chip"><div className="avatar">{initials(profile.name)}</div><div><b>{profile.name}</b><small>{role==="student"?"Student":"Teacher / Admin"}</small></div></div>
        </div>
      </header>
      <div className="page-wrap">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}>
            {page==="dashboard" && (role==="student"
              ? <StudentDashboard go={setPage} attendance={attendance} payments={payments} studentName={profile.name} studentId={profile.studentId} branch={profile.branch||profile.department}/>
              : <AdminDashboard go={setPage} attendance={attendance} session={session} students={registeredStudents}/>) }
            {page==="attendance" && <Scanner attendance={attendance} setAttendance={setAttendance} session={session} studentName={profile.name} />}
            {page==="create" && <Generator session={session} setSession={setSession} />}
            {page==="history" && <HistoryPage attendance={attendance}/>}
            {page==="timetable" && <Timetable branch={profile.branch||profile.department}/>}
            {page==="feedback" && <FeedbackPage role={role} profile={profile} feedback={feedback} setFeedback={setFeedback} />}
            {page==="payments" && <PaymentHistory payments={payments}/>} 
            {page==="map" && <CampusMap/>}
            {page==="issue" && <IssuePage role={role} issues={issues} setIssues={setIssues}/>}
            {page==="monitor" && <Monitor attendance={attendance} session={session}/>}
            {page==="students" && <StudentRecords/>}
            {page==="marks" && <StudentMarks/>}
            {page==="manage" && <Manage/>}
            {page==="salary" && <TeacherSalaries/>}
            {page==="notifications" && <Notifications data={notifications} setData={setNotifications}/>}
            {page==="settings" && <SettingsPage theme={theme} setTheme={setTheme} logout={logout} profile={profile}/>} 
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  </div>
}

function Login({role,setRole,onLogin}){
  const [step,setStep]=useState("choose");
  const [authMethod,setAuthMethod]=useState("face");
  const [name,setName]=useState("");
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [showPasswordDialog,setShowPasswordDialog]=useState(false);
  const [cameraRef]=useState(()=>({current:null}));
  const [cam,setCam]=useState(null);
  const [cameraReady,setCameraReady]=useState(false);
  const [faceCount,setFaceCount]=useState(0);
  const [descriptor,setDescriptor]=useState(null);
  const [mode,setMode]=useState("login");
  const [modelsReady,setModelsReady]=useState(false);
  const [error,setError]=useState("");
  const profileKey=()=>`${role}:${name.trim().toLowerCase()}`;
  const completePasswordLogin=()=>{
    const profiles=load("cc_face_profiles",{});
    const key=profileKey();
    const profile=profiles[key]||{name:name.trim(),role,createdAt:new Date().toISOString()};
    const studentId=profile.studentId||uid("STU");
    if(!profiles[key]||!profile.studentId){profiles[key]={...profile,studentId};save("cc_face_profiles",profiles)}
    setPassword("");setConfirmPassword("");setShowPasswordDialog(false);onLogin({name:profile.name,studentId,branch:profile.branch||profile.department});
  };
  const createPassword=async()=>{
    if(!name.trim())return setError("Enter your registered name first.");
    if(password.length<6)return setError("Password must be at least 6 characters.");
    if(password!==confirmPassword)return setError("Passwords do not match.");
    const passwordProfiles=load("cc_password_profiles",{});
    passwordProfiles[profileKey()]={hash:await hashPassword(password),updatedAt:new Date().toISOString()};
    save("cc_password_profiles",passwordProfiles);
    completePasswordLogin();
  };
  const startPasswordLogin=async()=>{
    if(!name.trim())return setError("Enter your registered name first.");
    const stored=load("cc_password_profiles",{})[profileKey()];
    if(!stored){setError("");setConfirmPassword("");setShowPasswordDialog(true);return;}
    if(!password)return setError("Enter your password.");
    const validPassword=await verifyPassword(password,stored.hash).catch(()=>false);
    const legacyPassword=!validPassword&&stored.hash===(await legacyHashPassword(password));
    if(!validPassword&&!legacyPassword)return setError("Incorrect password.");
    if(legacyPassword){const passwordProfiles=load("cc_password_profiles",{});passwordProfiles[profileKey()]={hash:await hashPassword(password),updatedAt:new Date().toISOString()};save("cc_password_profiles",passwordProfiles)}
    completePasswordLogin();
  };
  const stopCamera=()=>{cam?.getTracks().forEach(track=>track.stop());if(cameraRef.current)cameraRef.current.srcObject=null;setCam(null);setCameraReady(false);setFaceCount(0);setDescriptor(null)};
  const completeFaceLogin=(nextProfile)=>{stopCamera();setStep("choose");setError("");setPassword("");onLogin(nextProfile)};
  const startCamera=async()=>{
    setError("");setCameraReady(false);setFaceCount(0);setDescriptor(null);stopCamera();
    if(!name.trim())return setError("Enter your name before starting face verification.");
    setMode(load("cc_face_profiles",{})[profileKey()]?"login":"enroll");setStep("loading");
    try {
      if(!modelsReady){
        await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri("/models"),faceapi.nets.faceLandmark68Net.loadFromUri("/models"),faceapi.nets.faceRecognitionNet.loadFromUri("/models")]);
        setModelsReady(true);
      }
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});
      setCam(stream);setStep("verify");
    } catch { stopCamera();setError("Face models or camera could not be started. No login was performed.");setStep("choose"); }
  };
  const finishVerification=async()=>{
    const streamActive=cam?.getVideoTracks().some(track=>track.readyState==="live");
    if(!cameraReady||!streamActive)return setError("Live camera is required.");
    if(faceCount!==1||!descriptor)return setError(faceCount===0?"No face detected.":"Show exactly one face to continue.");
    const profiles=load("cc_face_profiles",{});
    const key=profileKey();
    if(mode==="enroll"){
      if(password&&password.length<6)return setError("Password must be at least 6 characters.");
      const studentId=uid("STU");
      profiles[key]={name:name.trim(),role,studentId,descriptor,createdAt:new Date().toISOString()};save("cc_face_profiles",profiles);
      if(password){
        const passwordProfiles=load("cc_password_profiles",{});passwordProfiles[key]={hash:await hashPassword(password),updatedAt:new Date().toISOString()};save("cc_password_profiles",passwordProfiles);
      }
      completeFaceLogin({name:name.trim(),studentId,branch:profiles[key].branch||profiles[key].department});return;
    }
    const registered=profiles[key];
    if(!registered)return setError("No registered face exists for this name. Start again to enroll it.");
    const distance=faceapi.euclideanDistance(new Float32Array(descriptor),new Float32Array(registered.descriptor));
    if(!Number.isFinite(distance)||distance>0.52){stopCamera();setError("Face does not match the registered student.");setStep("choose");return;}
    const studentId=registered.studentId||uid("STU");
    if(!registered.studentId){profiles[key]={...registered,studentId};save("cc_face_profiles",profiles)}
    if(password){
      if(password.length<6)return setError("Password must be at least 6 characters.");
      const passwordProfiles=load("cc_password_profiles",{});passwordProfiles[key]={hash:await hashPassword(password),updatedAt:new Date().toISOString()};save("cc_password_profiles",passwordProfiles);
    }
    completeFaceLogin({name:name.trim(),studentId,branch:registered.branch||registered.department});
  };
  useEffect(()=>()=>cam?.getTracks().forEach(track=>track.stop()),[cam]);
  useEffect(()=>{if(cameraRef.current&&cam){cameraRef.current.srcObject=cam;cameraRef.current.play().catch(()=>setError("Live camera preview could not start."));}},[cam]);
  useEffect(()=>{
    if(step!=="choose")return;
    const card=document.querySelector(".login-card");
    const inputs=card?.querySelectorAll("input")||[];
    const labels=card?.querySelectorAll("label")||[];
    inputs.forEach((input,index)=>{
      const id=index===0?"login-name":"login-password";
      input.id=id;
      input.name=index===0?"name":"password";
      labels[index]?.setAttribute("for",id);
    });
    const added=[];
    const roleTabs=card?.querySelector(".role-tabs");
    if(roleTabs&&!roleTabs.querySelector(".teacher-role")){
      const teacherButton=document.createElement("button");
      teacherButton.type="button";teacherButton.className=`teacher-role ${role==="teacher"?"selected":""}`;teacherButton.innerHTML="<span>Teacher</span>";teacherButton.onclick=()=>setRole("teacher");roleTabs.appendChild(teacherButton);added.push(teacherButton);
    }
    const demoNote=card?.querySelector(".demo-note");
    if(demoNote&&!card.querySelector(".register-link")){
      const registerButton=document.createElement("button");
      registerButton.type="button";registerButton.className="text-btn register-link";registerButton.textContent="Create Account / Register";registerButton.onclick=()=>{setError("");setStep("register")};demoNote.after(registerButton);added.push(registerButton);
    }
    return ()=>added.forEach(element=>element.remove());
  },[step,authMethod,role]);
  useEffect(()=>{
    if(step!=="verify"||!cameraReady||!cameraRef.current)return;
    let active=true;
    const check=async()=>{try{const results=await faceapi.detectAllFaces(cameraRef.current,new faceapi.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.6})).withFaceLandmarks().withFaceDescriptors();if(!active)return;setFaceCount(results.length);setDescriptor(results.length===1?Array.from(results[0].descriptor):null)}catch{if(active){setFaceCount(0);setDescriptor(null)}}};
    check();const timer=setInterval(check,700);return()=>{active=false;clearInterval(timer)};
  },[step,cameraReady]);
  if(step==="register")return <Registration role={role} onBack={()=>{setError("");setStep("choose")}} onRegistered={registeredRole=>{setRole(registeredRole);setName("");setPassword("");setConfirmPassword("");setAuthMethod("password");setError("Account created successfully. Log in with your name and password.");setStep("choose")}}/>;
    return <div className="login-page"><div className="login-grid"/><div className="floating-building b1"/><div className="floating-building b2"/><div className="floating-building b3"/><div className="login-hero"><div className="hero-badge"><ShieldCheck size={15}/> SMART CAMPUS PLATFORM</div><h1>CAMPUS<br/><span>PLUS</span></h1><p>Smart Campus. Smarter Connections.</p></div><div className="login-card"><div className="card-glow"/>{step==="choose"&&<><div className="eyebrow">WELCOME BACK</div><h2>Enter your campus</h2><p className="muted">Choose one independent login method.</p><div className="role-tabs"><button className={role==="student"?"selected":""} onClick={()=>setRole("student")}><UserRound/><span>Student</span></button><button className={role==="admin"?"selected":""} onClick={()=>setRole("admin")}><ShieldCheck/><span>Teacher / Admin</span></button></div><div className="login-methods"><button className={authMethod==="face"?"selected":""} onClick={()=>{setAuthMethod("face");setError("")}}><Camera/><span>Face login</span></button><button className={authMethod==="password"?"selected":""} onClick={()=>{setAuthMethod("password");setError("")}}><ShieldCheck/><span>Password login</span></button></div><label>Name / Identity</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Registered full name"/>{authMethod==="password"&&<><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your registered password" autoComplete="current-password"/>{showPasswordDialog&&<div className="password-dialog"><div className="eyebrow">CREATE PASSWORD</div><p className="muted">No password exists for this account yet.</p><label>New Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password"/><label>Confirm Password</label><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password"/><button className="primary big" onClick={createPassword}><ShieldCheck/> Create Password</button></div>}</>}{authMethod==="face"?<button className="primary big" onClick={startCamera}><Camera/> Start face verification</button>:!showPasswordDialog&&<button className="primary big" onClick={startPasswordLogin}><ShieldCheck/> Sign in with password</button>}{error&&<div className="login-error">{error}</div>}<div className="demo-note">Face and password authentication are independent methods. Password login works only after a password has been registered.</div></>}{step==="loading"&&<div className="verify"><h3>Preparing face authentication</h3><p>Loading local face models and requesting the camera…</p><div className="verify-line"><span/><span/><span/></div></div>}{step==="verify"&&<div className="verify"><div className="camera-frame"><video ref={cameraRef} autoPlay muted playsInline onCanPlay={()=>setCameraReady(true)}/><div className="scan-corners"/></div><h3>{mode==="enroll"?"Register Face":"Verify Face"}</h3><p>{faceCount===0?"No face detected. Position one face inside the frame.":faceCount>1?"Multiple faces detected. Only one person may be present.":mode==="enroll"?"One face detected. Register this face to continue.":"Face detected. Checking against the registered face…"}</p><div className="verify-line"><span/><span/><span/></div><button className="primary big" disabled={!cameraReady||faceCount!==1||!descriptor} onClick={finishVerification}>{mode==="enroll"?<><ShieldCheck/> Register face</>:<><CheckCircle2/> Confirm face</>}</button><button className="ghost fallback-btn" onClick={()=>{stopCamera();setStep("choose")}}>Cancel</button></div>}</div></div>;
}

function Registration({role,onBack,onRegistered}){
  const [registrationRole,setRegistrationRole]=useState(role==="student"?"student":role==="teacher"?"teacher":"admin");
  const [form,setForm]=useState({name:"",email:"",identifier:"",department:"",password:"",confirmPassword:""});
  const [error,setError]=useState("");
  const update=(field,value)=>setForm(current=>({...current,[field]:value}));
  const submit=async(event)=>{
    event.preventDefault();
    const name=form.name.trim(),email=form.email.trim().toLowerCase(),department=form.department.trim();
    if(!name||!email||!department||!form.password||!form.confirmPassword)return setError("Please complete all required fields.");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setError("Enter a valid email address.");
    if(form.password.length<6)return setError("Password must be at least 6 characters.");
    if(form.password!==form.confirmPassword)return setError("Passwords do not match.");
    const profiles=load("cc_face_profiles",{});
    if(Object.values(profiles).some(profile=>profile.email?.trim().toLowerCase()===email))return setError("An account with this email already exists.");
    const key=`${registrationRole}:${name.toLowerCase()}`;
    if(profiles[key])return setError("An account with this name and role already exists.");
    profiles[key]={name,email,role:registrationRole,department,studentId:form.identifier.trim()||undefined,createdAt:new Date().toISOString()};
    save("cc_face_profiles",profiles);
    const passwordProfiles=load("cc_password_profiles",{});
    passwordProfiles[key]={hash:await hashPassword(form.password),updatedAt:new Date().toISOString()};
    save("cc_password_profiles",passwordProfiles);
    onRegistered(registrationRole);
  };
  return <div className="login-page registration-page"><div className="login-grid"/><div className="floating-building b1"/><div className="floating-building b2"/><div className="floating-building b3"/><motion.form className="login-card registration-card" onSubmit={submit} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><div className="card-glow"/><button type="button" className="ghost registration-back" onClick={onBack}>Back to login</button><div className="eyebrow">CAMPUS PLUS ACCOUNT</div><h2>Create your account</h2><p className="muted">Register once to access your campus workspace.</p><div className="register-role-tabs"><button type="button" className={registrationRole==="student"?"selected":""} onClick={()=>setRegistrationRole("student")}><UserRound/><span>Student</span></button><button type="button" className={registrationRole==="teacher"?"selected":""} onClick={()=>setRegistrationRole("teacher")}><Users/><span>Teacher</span></button><button type="button" className={registrationRole==="admin"?"selected":""} onClick={()=>setRegistrationRole("admin")}><ShieldCheck/><span>Admin</span></button></div><div className="register-grid"><label>Full Name *<input value={form.name} onChange={event=>update("name",event.target.value)} placeholder="Your full name" autoComplete="name"/></label><label>Email *<input type="email" value={form.email} onChange={event=>update("email",event.target.value)} placeholder="you@example.com" autoComplete="email"/></label><label>Student / Employee ID <input value={form.identifier} onChange={event=>update("identifier",event.target.value)} placeholder="Optional"/></label><label>Department *<input value={form.department} onChange={event=>update("department",event.target.value)} placeholder="Department"/></label><label>Password *<input type="password" value={form.password} onChange={event=>update("password",event.target.value)} placeholder="At least 6 characters" autoComplete="new-password"/></label><label>Confirm Password *<input type="password" value={form.confirmPassword} onChange={event=>update("confirmPassword",event.target.value)} placeholder="Re-enter password" autoComplete="new-password"/></label></div>{error&&<div className="login-error">{error}</div>}<button className="primary big" type="submit"><CheckCircle2/> Create Account</button></motion.form></div>;
}

function PageTitle({eyebrow,title,desc,actions}){return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div><div className="title-actions">{actions}</div></div>}
function Stat({icon:Icon,label,value,sub}){
 const [tilt,setTilt]=useState({x:0,y:0});
 const handleTilt=(event)=>{const bounds=event.currentTarget.getBoundingClientRect();setTilt({x:-((event.clientY-bounds.top)/bounds.height-.5)*7,y:((event.clientX-bounds.left)/bounds.width-.5)*9})};
 return <motion.div className="stat-card" animate={{rotateX:tilt.x,rotateY:tilt.y}} whileHover={{scale:1.03,y:-4}} transition={{type:"spring",stiffness:260,damping:22}} onMouseMove={handleTilt} onMouseLeave={()=>setTilt({x:0,y:0})}><div className="stat-icon"><Icon/></div><div><small>{label}</small><motion.strong initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{duration:.45}}>{value}</motion.strong><span>{sub}</span></div></motion.div>}

function StudentDashboard({go,attendance,payments,studentName,studentId,branch}){
 const isDemoAttendance=attendance.some(item=>String(item.session||"").startsWith("DEMO-"));
 const present=isDemoAttendance?demoAttendanceSummary.present:attendance.filter(item=>item.status==="Present").length;
 const absent=isDemoAttendance?demoAttendanceSummary.absent:attendance.filter(item=>item.status==="Absent").length;
 const late=isDemoAttendance?demoAttendanceSummary.late:attendance.filter(item=>item.status==="Late").length;
 const lectures=isDemoAttendance?demoAttendanceSummary.lectures:attendance.length;
 const overall=isDemoAttendance?demoAttendanceSummary.overall:attendance.length?Math.round((present/attendance.length)*100):0;
 const safeStudentId=studentId||"";
 const studentSeed=[...safeStudentId].reduce((total,character)=>total+character.charCodeAt(0),0);
 const payment=payments[0];
 const schedule=readStudentTimetable(branch)?.Monday||[];
 return <><PageTitle eyebrow="STUDENT PORTAL" title={`Good evening, ${studentName}.`} desc="Here’s what is happening around your campus today." actions={<button className="primary" onClick={()=>go("attendance")}><QrCode/> Scan Attendance</button>}/>
 <div className="stats-grid"><Stat icon={Activity} label="Overall Attendance" value={`${overall}%`} sub="Semester average"/><Stat icon={CalendarDays} label="Total Lectures" value={lectures} sub="This semester"/><Stat icon={CheckCircle2} label="Classes Attended" value={`${present}/${lectures}`} sub={`${present} present classes`}/><Stat icon={Clock3} label="Late Entries" value={late} sub="Needs attention"/></div>
 <div className="dashboard-grid">
  <section className="panel"><div className="panel-head"><div><h3>Today’s Schedule</h3><p>Sunday · September 06, 2026</p></div><button className="ghost" onClick={()=>go("history")}>View history <ChevronRight/></button></div>
  {schedule.map((x,i)=><div className="class-row" key={x[0]}><div className="class-time">{x[3]}</div><div className="class-dot"/><div className="class-main"><b>{x[0]}</b><span>{x[1]} · {x[2]}</span></div><div className="class-code">{x[4]}</div><span className={`status ${i===0?"live":"upcoming"}`}>{i===0?"Live":"Upcoming"}</span></div>)}
  </section>
  <section className="panel fee"><div className="fee-icon"><ClipboardList/></div><div className="eyebrow">PAYMENT STATUS</div>{payment?<><h3>{payment.title}</h3><p>Total Fee <b>INR {Number(payment.total||0).toLocaleString("en-IN")}</b><br/>Paid Amount <b>INR {Number(payment.paid||0).toLocaleString("en-IN")}</b><br/>Due Amount <b>INR {Number(payment.due||0).toLocaleString("en-IN")}</b><br/>Status <b>{payment.status}</b><br/>Payment Date <b>{payment.date}</b></p></>:<><h3>No payment record found</h3><p>No fee details are available for this student ID.</p></>}<button className="ghost" onClick={()=>go("payments")}>View payment history <ChevronRight/></button></section>
 </div>
 <div className="bottom-grid"><section className="panel quick"><div className="panel-head"><h3>Quick Actions</h3></div><div className="quick-grid">{[[QrCode,"Scan Attendance","attendance"],[Map,"Campus Map","map"],[History,"Attendance History","history"],[AlertTriangle,"Report Issue","issue"]].map(([I,l,p])=><button key={l} onClick={()=>go(p)}><I/><span>{l}</span><ChevronRight/></button>)}</div></section>
 <section className="panel attendance-mini"><div className="panel-head"><div><h3>Attendance Overview</h3><p>Based on your recorded sessions</p></div><span className="percent">{overall}%</span></div><div className="progress"><i style={{width:`${overall}%`}}/></div><div className="mini-row"><span>Present <b>{present}</b></span><span>Absent <b>{absent}</b></span><span>Required <b>75%</b></span></div></section></div>
 {isDemoAttendance&&<><section className="panel attendance-subjects"><div className="panel-head"><div><h3>Subject-wise Attendance</h3><p>Current semester demo summary</p></div><span className="attendance-pill">{present}/{lectures} attended</span></div><div className="subject-attendance-grid">{demoAttendanceSummary.subjects.map(([subject,percent,record])=><div className="subject-attendance" key={subject}><div><b>{subject}</b><span>{record} classes</span></div><strong>{percent}%</strong><div className="progress"><i style={{width:`${percent}%`}}/></div></div>)}</div></section><section className="panel attendance-recent"><div className="panel-head"><div><h3>Recent Attendance History</h3><p>Latest demo classroom records</p></div><button className="ghost" onClick={()=>go("history")}>View all <ChevronRight/></button></div><div className="attendance-history-list">{demoAttendanceRecords.slice(0,5).map(record=><div className="attendance-history-row" key={record.session}><div><b>{record.subject}</b><span>{record.date} · {record.time} · {record.room}</span></div><span className={`status ${record.status.toLowerCase()}`}>{record.status}</span></div>)}</div></section></>}
 </>
}

function AdminDashboard({go,attendance,session,students}){
 return <><PageTitle eyebrow="ADMIN CONSOLE" title="Campus at a glance." desc="Monitor attendance and keep everyday operations moving." actions={<button className="primary" onClick={()=>go("create")}><Plus/> Create Session</button>}/>
 <div className="stats-grid"><Stat icon={Users} label="Total Students" value="1,240" sub="+32 this semester"/><Stat icon={QrCode} label="Active Sessions" value={session? "09":"08"} sub="Across campus"/><Stat icon={Activity} label="Today’s Attendance" value="92%" sub="↑ 3.1% vs yesterday"/><Stat icon={AlertTriangle} label="Pending Issues" value={14+0} sub="4 high priority"/></div>
 <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h3>Recent Attendance Sessions</h3><p>Live campus snapshot</p></div><button className="ghost" onClick={()=>go("monitor")}>Live monitoring <Activity/></button></div>
 {[["Data Structures","CSE-A","45 / 50","10:00 AM"],["Operating Systems","CSE-B","38 / 42","11:30 AM"],["DBMS","CSE-A","48 / 50","02:00 PM"]].map((x,i)=><div className="session-row" key={x[0]}><div className="subject-icon"><QrCode/></div><div className="session-main"><b>{x[0]}</b><span>{x[1]} · {x[3]}</span></div><div className="session-count"><b>{x[2]}</b><div className="progress tiny"><i style={{width:`${[90,90,96][i]}%`}}/></div></div><span className="status live">Active</span></div>)}
 </section><section className="panel admin-chart"><div className="panel-head"><div><h3>Weekly Attendance</h3><p>Average across departments</p></div><BarChart3/></div><div className="bars">{[74,81,78,92,88,94,87].map((v,i)=><div key={i}><span style={{height:v+"%"}}/><small>{["M","T","W","T","F","S","S"][i]}</small></div>)}</div></section></div>
 <section className="panel admin-actions"><div className="panel-head"><h3>Quick Management</h3></div><div className="admin-action-grid">{[[QrCode,"Create Attendance Session","create"],[Activity,"Live Monitoring","monitor"],[AlertTriangle,"Review Issues","issue"],[Map,"Open Campus Map","map"]].map(([I,l,p])=><button onClick={()=>go(p)} key={l}><I/><b>{l}</b><ChevronRight/></button>)}</div></section>
 <TimetableManagement/>
 <PaymentManagement students={students}/>
 </>;
}

function TimetableManagement(){
 const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
 const branches=["CSE","ECE","EEE","MECHANICAL","CIVIL"];
 const empty={subject:"",start:"",end:"",room:"",faculty:""};
 const [data,setData]=useState(()=>load("cc_timetables",{}));
 const [branch,setBranch]=useState("CSE");
 const [day,setDay]=useState("Monday");
 const [form,setForm]=useState(empty);
 const [editingId,setEditingId]=useState(null);
 const entries=data[branch]?.[day]||[];
 const updateField=(field,value)=>setForm({...form,[field]:value});
 const saveTimetable=()=>{
  if(!form.subject||!form.start||!form.end||!form.room||!form.faculty)return;
  const entry={...form,id:editingId||uid("TT")};
  const next={...data,[branch]:{...(data[branch]||{}),[day]:editingId?entries.map(item=>item.id===editingId?entry:item):[...entries,entry]}};
  setData(next);save("cc_timetables",next);setForm(empty);setEditingId(null);
 };
 const editEntry=entry=>{setForm({subject:entry.subject,start:entry.start,end:entry.end,room:entry.room,faculty:entry.faculty});setEditingId(entry.id)};
 const deleteEntry=id=>{const next={...data,[branch]:{...(data[branch]||{}),[day]:entries.filter(entry=>entry.id!==id)}};setData(next);save("cc_timetables",next);if(editingId===id){setEditingId(null);setForm(empty)}};
 return <section className="panel timetable-management"><div className="panel-head"><div><h3>Timetable Management</h3><p>Add and maintain branch-wise class schedules.</p></div><CalendarDays/></div><div className="timetable-management-grid"><label>Branch / Department<select value={branch} onChange={event=>{setBranch(event.target.value);setEditingId(null);setForm(empty)}}>{branches.map(item=><option key={item}>{item}</option>)}</select></label><label>Day<select value={day} onChange={event=>{setDay(event.target.value);setEditingId(null);setForm(empty)}}>{days.map(item=><option key={item}>{item}</option>)}</select></label><label>Subject<input value={form.subject} onChange={event=>updateField("subject",event.target.value)} placeholder="Subject"/></label><label>Start Time<input type="time" value={form.start} onChange={event=>updateField("start",event.target.value)}/></label><label>End Time<input type="time" value={form.end} onChange={event=>updateField("end",event.target.value)}/></label><label>Room / Lab<input value={form.room} onChange={event=>updateField("room",event.target.value)} placeholder="Room or lab"/></label><label>Faculty Name<input value={form.faculty} onChange={event=>updateField("faculty",event.target.value)} placeholder="Faculty name"/></label></div><button className="primary" onClick={saveTimetable}>{editingId?<><CheckCircle2/> Update entry</>:<><Plus/> Add entry</>}</button><div className="timetable-management-list">{entries.map(entry=><div className="timetable-management-row" key={entry.id}><div><b>{entry.subject}</b><span>{entry.start} - {entry.end} · {entry.room} · {entry.faculty}</span></div><button className="ghost" onClick={()=>editEntry(entry)}>Edit</button><button className="danger" onClick={()=>deleteEntry(entry.id)}>Delete</button></div>)}{!entries.length&&<div className="demo-note">No entries saved for {branch} on {day}.</div>}</div></section>;
}

function PaymentManagement({students}){
 const [selectedId,setSelectedId]=useState("");
 const [query,setQuery]=useState("");
 const [form,setForm]=useState({total:"",paid:"",status:"Pending"});
 const [saveMessage,setSaveMessage]=useState("");
 useEffect(()=>{
  if(!selectedId){setForm({total:"",paid:"",status:"Pending"});return;}
  const record=readStudentPayments(selectedId)[0];
  setForm(record?{total:String(record.total||""),paid:String(record.paid||""),status:record.status||"Pending"}:{total:"",paid:"",status:"Pending"});
 },[selectedId]);
 const total=Number(form.total)||0;
 const paid=Number(form.paid)||0;
 const due=Math.max(total-paid,0);
 const filteredStudents=students.filter(student=>`${student.studentId} ${student.name}`.toLowerCase().includes(query.toLowerCase()));
 const savePayment=()=>{
  if(!selectedId)return setSaveMessage("Select a student first.");
  if(total<=0)return setSaveMessage("Enter a total fee greater than zero.");
  if(paid<0||paid>total)return setSaveMessage("Paid amount must be between zero and the total fee.");
  const record={id:`FEE-${selectedId}`,date:new Date().toISOString().slice(0,10),title:"Student Fee",total,paid,due,amount:`INR ${due.toLocaleString("en-IN")}`,method:"Admin record",status:form.status};
  save(paymentDataKey(selectedId),[record]);
  const stored=readStudentPayments(selectedId)[0];
  if(stored?.total!==total||stored?.paid!==paid||stored?.due!==due||stored?.status!==form.status)return setSaveMessage("Payment could not be saved.");
  setForm({total:String(total),paid:String(paid),status:form.status});
  setSaveMessage(`Payment saved for ${selectedId}.`);
 };
 return <section className="panel payment-management"><div className="panel-head"><div><h3>Payment Management</h3><p>Update fee details for an individual student.</p></div><CreditCard/></div><div className="payment-management-grid"><label>Search Student ID<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search student ID or name"/></label><label>Student ID<select value={selectedId} onChange={event=>{setSelectedId(event.target.value);setSaveMessage("")}}><option value="">Select registered student</option>{filteredStudents.map(student=><option key={student.studentId} value={student.studentId}>{student.studentId} · {student.name}</option>)}</select></label><label>Total Fee<input type="number" min="0" value={form.total} onChange={event=>{setForm({...form,total:event.target.value});setSaveMessage("")}} placeholder="0"/></label><label>Paid Amount<input type="number" min="0" max={total} value={form.paid} onChange={event=>{setForm({...form,paid:event.target.value});setSaveMessage("")}} placeholder="0"/></label><label>Payment Status<select value={form.status} onChange={event=>setForm({...form,status:event.target.value})}><option>Paid</option><option>Partial</option><option>Pending</option></select></label></div><div className="payment-management-summary"><span>Total <b>INR {total.toLocaleString("en-IN")}</b></span><span>Paid <b>INR {paid.toLocaleString("en-IN")}</b></span><span>Due <b>INR {due.toLocaleString("en-IN")}</b></span><button className="primary" disabled={!selectedId||paid>total} onClick={savePayment}><Receipt/> Save payment details</button></div>{saveMessage&&<div className="success-box"><CheckCircle2/> {saveMessage}</div>}{!students.length&&<div className="demo-note">No registered student records are available yet.</div>}</section>;
}

function Scanner({attendance,setAttendance,session,studentName}){
 const [code,setCode]=useState(""); const [state,setState]=useState("idle"); const [message,setMessage]=useState("");
 const scan=()=>{if(!code.trim())return setMessage("Please enter a session ID for this demo scanner."); if(!code.startsWith("CAMPUS-ATT-")){setState("error");return setMessage("Invalid QR Code. Please scan the official classroom attendance QR.");}
 const sid=code.trim(); if(attendance.some(a=>a.session===sid)){setState("duplicate");return setMessage("Attendance already marked for this session.");}
 const next={date:new Date().toISOString().slice(0,10),subject:session?.subject||"Data Structures",teacher:"Dr. Sharma",time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),room:session?.room||"204",status:"Present",session:sid};
 setAttendance([next,...attendance]);setState("success");setMessage("Attendance Marked!");};
 return <><PageTitle eyebrow="SMART ATTENDANCE" title="Mark Attendance" desc="Scan the classroom QR code to record your presence."/>
 <div className="scanner-layout"><section className="panel scanner-panel"><div className="scanner-window"><div className="scanner-corners"/><QrCode size={72}/><div className="scan-line"/><span>CAMERA / QR SCANNER</span></div><div className="scanner-status"><Camera/><div><b>Camera ready</b><span>Position the official classroom QR inside the frame.</span></div></div><div className="demo-input"><label>Demo scanner input</label><div><input value={code} onChange={e=>setCode(e.target.value)} placeholder="CAMPUS-ATT-DS-58342"/><button className="primary" onClick={scan}>Scan QR</button></div></div><div className="demo-note">Browser camera scanning is supported by the installed html5-qrcode dependency. This demo also provides a session-ID fallback for reliable local testing.</div></section>
 <section className="panel how"><div className="eyebrow">HOW IT WORKS</div><h3>Three seconds to attendance.</h3>{[[QrCode,"Scan","Point your camera at the classroom QR."],[ShieldCheck,"Validate","The session ID and expiry are checked."],[CheckCircle2,"Confirm","Your attendance is saved locally."]].map(([I,t,d],i)=><div className="step" key={t}><div><I/></div><span><b>{i+1}. {t}</b>{d}</span></div>)}</section></div>
 {state!=="idle"&&<div className={`result ${state}`}><div>{state==="success"?<CheckCircle2/>:<AlertTriangle/>}</div><div><b>{message}</b>{state==="success"&&<span>Session: {code} · Student: {studentName} · Status: Present</span>}</div></div>}</>
}

function Generator({session,setSession}){
 const [form,setForm]=useState({subject:"Data Structures",section:"CSE-A",expiry:"30",room:"204"});const [qr,setQr]=useState("");
 const generate=async()=>{const id=`CAMPUS-ATT-${form.subject.split(" ")[0].slice(0,3).toUpperCase()}-${Math.floor(10000+Math.random()*89999)}`;const s={...form,id,created:new Date().toISOString(),present:0};setSession(s);setQr(await QRCode.toDataURL(id,{width:280,margin:2}));};
 const download=()=>{if(!qr)return;const a=document.createElement("a");a.href=qr;a.download=`${session?.id||"attendance-qr"}.png`;a.click()};
 return <><PageTitle eyebrow="ADMIN · ATTENDANCE" title="Create Attendance Session" desc="Generate a real, scannable QR session for a classroom."/>
 <div className="generator-layout"><section className="panel form-panel"><h3>Session details</h3><div className="form-grid"><label>Subject<select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>{["Data Structures","Operating Systems","DBMS","Computer Networks","Computer Lab"].map(x=><option key={x}>{x}</option>)}</select></label><label>Class / Section<select value={form.section} onChange={e=>setForm({...form,section:e.target.value})}>{["CSE-A","CSE-B","CSE-C"].map(x=><option key={x}>{x}</option>)}</select></label><label>Expiry duration<select value={form.expiry} onChange={e=>setForm({...form,expiry:e.target.value})}><option>15</option><option>30</option><option>60</option></select></label><label>Room<input value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></label></div><button className="primary big" onClick={generate}><QrCode/> Generate Unique QR</button></section>
 <section className="panel qr-card">{qr?<><div className="qr-wrap"><img src={qr}/></div><div className="eyebrow">ACTIVE SESSION</div><h3>{session.id}</h3><div className="qr-meta"><span>Subject <b>{session.subject}</b></span><span>Section <b>{session.section}</b></span><span>Room <b>{session.room}</b></span><span>Expiry <b>{session.expiry} min</b></span></div><div className="qr-buttons"><button className="primary" onClick={download}><Download/> Download</button><button className="ghost" onClick={()=>window.print()}><Printer/> Print</button><button className="danger" onClick={()=>{setSession(null);setQr("")}}>Close Session</button></div></>:<div className="empty-qr"><QrCode size={72}/><h3>Your QR appears here</h3><p>Fill the session details and generate a scannable QR.</p></div>}</section></div></>
}

function HistoryPage({attendance}){
 const [q,setQ]=useState("");const [filter,setFilter]=useState("All");const data=attendance.filter(x=>(x.subject+x.teacher).toLowerCase().includes(q.toLowerCase())&&(filter==="All"||x.status===filter));const isDemoAttendance=attendance.some(item=>String(item.session||"").startsWith("DEMO-"));const present=isDemoAttendance?demoAttendanceSummary.present:attendance.filter(x=>x.status==="Present").length;const absent=isDemoAttendance?demoAttendanceSummary.absent:attendance.filter(x=>x.status==="Absent").length;const overall=isDemoAttendance?demoAttendanceSummary.overall:attendance.length?Math.round((present/attendance.length)*100):0;
 return <><PageTitle eyebrow="STUDENT · RECORDS" title="Attendance History" desc="Search and review every recorded class session."/>
 <section className="panel"><div className="filters"><div className="search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search subject or teacher…"/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Present</option><option>Absent</option><option>Late</option></select><div className="attendance-pill">Overall <b>{overall}%</b></div></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Subject</th><th>Teacher</th><th>Time</th><th>Room</th><th>Status</th></tr></thead><tbody>{data.map((x,i)=><tr key={i}><td>{x.date}</td><td><b>{x.subject}</b></td><td>{x.teacher}</td><td>{x.time}</td><td>{x.room}</td><td><span className={`status ${x.status.toLowerCase()}`}>{x.status}</span></td></tr>)}</tbody></table></div></section>
 <div className="stats-grid lower"><Stat icon={CheckCircle2} label="Present" value={present} sub="Recorded sessions"/><Stat icon={AlertTriangle} label="Absent" value={absent} sub="Recorded sessions"/><Stat icon={Clock3} label="Late" value={isDemoAttendance?demoAttendanceSummary.late:attendance.filter(x=>x.status==="Late").length} sub="Recorded sessions"/><Stat icon={Activity} label="Attendance" value={`${overall}%`} sub="Above required 75%"/></div></>
}

function Timetable({branch}){
 const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
 const schedule=readStudentTimetable(branch);
 const [selected,setSelected]=useState("Monday");
 const selectedClasses=schedule?.[selected]||[];
 return <><PageTitle eyebrow="STUDENT · SCHEDULE" title="Daily Timetable" desc="Plan your classes, rooms and campus time at a glance." actions={<button className="primary" onClick={()=>window.print()}><Printer/> Print timetable</button>}/><section className="panel timetable-panel"><div className="day-tabs">{days.map(day=><button key={day} className={selected===day?"selected":""} onClick={()=>setSelected(day)}><span>{day.slice(0,3)}</span><b>{day}</b></button>)}</div><div className="timetable-head"><div><div className="eyebrow">{selected.toUpperCase()}</div><h3>{schedule && selectedClasses.length ? `${selectedClasses.length} classes scheduled` : `No timetable registered`}</h3></div><span className="attendance-pill"><CalendarDays/> September 2026</span></div><div className="timetable-list">{selectedClasses.length ? selectedClasses.map((item,index)=><div className="timetable-row" key={`${selected}-${item[1]}-${index}`}><div className="timetable-time"><b>{item[0]}</b><span>{index===0?"Morning":"Afternoon"}</span></div><div className="timetable-line"><i/></div><div className="timetable-class"><b>{item[1]}</b><span>{item[2]} · {item[3]}</span></div><div className="class-code">{item[4]}</div><span className={`status ${index===0&&selected==="Monday"?"live":"upcoming"}`}>{index===0&&selected==="Monday"?"Next":"Upcoming"}</span></div>) : <div className="demo-note">No timetable data is available for this day yet.</div>}</div></section></>;
}

function buildFeedbackStats(items){
  const total = items.length;
  const average = total ? (items.reduce((sum,item)=>sum + Number(item.rating || 0),0) / total).toFixed(1) : "0.0";
  const categories = ["Subject","Teacher","Campus Service"];
  const categoryRatings = categories.map(category => {
    const matches = items.filter(item => item.category === category);
    const avg = matches.length ? (matches.reduce((sum,item)=>sum + Number(item.rating || 0),0) / matches.length).toFixed(1) : "0.0";
    return { category, total: matches.length, avg: Number(avg) };
  });
  return { total, average: Number(average), categoryRatings };
}

function StarRatingInput({ value, onChange }) {
  return <div className="rating-stars">{[1,2,3,4,5].map(star => <button type="button" key={star} className={star <= value ? "star active" : "star"} onClick={()=>onChange(star)} aria-label={`Rate ${star} star${star>1?"s":""}`}>★</button>)}</div>;
}

function FeedbackPage({ role, profile, feedback, setFeedback }){
  const [form,setForm]=useState({ category:"Subject", subject:"Mathematics", teacher:"Prof. Sharma", rating:5, anonymous:false, comment:"" });
  const [message,setMessage]=useState("");
  const [filters,setFilters]=useState({ subject:"All", teacher:"All", category:"All", rating:"All" });

  const studentFeedback = role === "student" ? feedback.filter(item => item.studentId === (profile.studentId || "") || (item.studentName === profile.name && !item.anonymous)) : feedback;
  const filteredFeedback = role === "student" ? studentFeedback : feedback.filter(item => {
    const matchSubject = filters.subject === "All" || item.subject === filters.subject;
    const matchTeacher = filters.teacher === "All" || item.teacher === filters.teacher;
    const matchCategory = filters.category === "All" || item.category === filters.category;
    const matchRating = filters.rating === "All" || String(item.rating) === filters.rating;
    return matchSubject && matchTeacher && matchCategory && matchRating;
  });

  const stats = buildFeedbackStats(filteredFeedback);
  const subjects = [...new Set(feedback.map(item => item.subject))];
  const teachers = [...new Set(feedback.map(item => item.teacher))];
  const categories = ["Subject","Teacher","Campus Service"];

  const submitFeedback = (event) => {
    event.preventDefault();
    if(!form.comment.trim()) return setMessage("Please add a short comment before submitting your feedback.");
    const entry = {
      id: uid("FB"),
      studentId: profile.studentId || "STU-DEMO-1",
      studentName: form.anonymous ? "Anonymous" : (profile.name || "Student"),
      category: form.category,
      subject: form.subject,
      teacher: form.teacher,
      rating: Number(form.rating),
      comment: form.comment.trim(),
      anonymous: form.anonymous,
      status: "Submitted",
      createdAt: new Date().toISOString()
    };
    setFeedback(prev => [entry, ...prev]);
    setForm({ category:"Subject", subject:"Mathematics", teacher:"Prof. Sharma", rating:5, anonymous:false, comment:"" });
    setMessage("Feedback submitted successfully.");
  };

  if(role === "student") {
    return <><PageTitle eyebrow="STUDENT · FEEDBACK" title="Student Feedback" desc="Share your experience on subjects, teachers, and campus services."/><div className="feedback-grid"><section className="panel feedback-form-panel"><h3>Submit Feedback</h3><form onSubmit={submitFeedback}><div className="feedback-form-grid"><label>Category<select value={form.category} onChange={event=>setForm({...form,category:event.target.value})}><option>Subject</option><option>Teacher</option><option>Campus Service</option></select></label><label>Subject<input value={form.subject} onChange={event=>setForm({...form,subject:event.target.value})} placeholder="Mathematics" /></label><label>Teacher<input value={form.teacher} onChange={event=>setForm({...form,teacher:event.target.value})} placeholder="Prof. Sharma" /></label><label>Rating<div className="rating-wrap"><StarRatingInput value={form.rating} onChange={value=>setForm({...form,rating:value})} /></div></label></div><label className="check-row"><input type="checkbox" checked={form.anonymous} onChange={event=>setForm({...form,anonymous:event.target.checked})} /> Anonymous Feedback</label><label>Comments<textarea value={form.comment} onChange={event=>setForm({...form,comment:event.target.value})} placeholder="Tell us about your learning experience, campus services, or teaching quality…" /></label><button className="primary big" type="submit"><CheckCircle2/> Submit Feedback</button>{message&&<div className="success-box"><CheckCircle2/> {message}</div>}</form></section><section className="panel feedback-history-panel"><div className="panel-head"><div><h3>Your Feedback</h3><p>Recent submissions and review status</p></div><span className="attendance-pill">{studentFeedback.length} items</span></div>{studentFeedback.length ? <div className="feedback-list">{studentFeedback.map(item => <div className="feedback-item" key={item.id}><div className="feedback-top"><div><b>{item.subject}</b><small>{item.category} · {item.anonymous ? "Anonymous" : item.studentName}</small></div><span className="status present">{item.status}</span></div><div className="feedback-meta"><span>{item.teacher}</span><span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "Today"}</span></div><div className="rating-stars small">{[1,2,3,4,5].map(star => <span key={star} className={star <= Number(item.rating) ? "star active" : "star"}>★</span>)}</div><p>{item.comment}</p></div>)}</div> : <div className="feedback-empty"><div className="empty-icon"><ClipboardList/></div><h3>No feedback submitted yet</h3><p>Your feedback history will appear here once you submit your first response.</p></div>}</section></div></>;
  }

  return <><PageTitle eyebrow="ADMIN · FEEDBACK" title="Feedback Dashboard" desc="Monitor ratings and comments from students, teachers, and campus services."/><div className="stats-grid"><Stat icon={ClipboardList} label="Total feedback" value={stats.total} sub="Submitted entries"/><Stat icon={BarChart3} label="Average rating" value={stats.average.toFixed(1)} sub="Across all reviews"/><Stat icon={CheckCircle2} label="Positive score" value={stats.total ? `${Math.round((feedback.filter(item => item.rating >= 4).length / stats.total) * 100)}%` : "0%"} sub="4+ star reviews"/><Stat icon={Users} label="Categories" value={categories.length} sub="Tracked groups"/></div><section className="panel"><div className="feedback-filter-grid"><label>Subject<select value={filters.subject} onChange={event=>setFilters({...filters,subject:event.target.value})}><option value="All">All Subjects</option>{subjects.map(subject=><option key={subject} value={subject}>{subject}</option>)}</select></label><label>Teacher<select value={filters.teacher} onChange={event=>setFilters({...filters,teacher:event.target.value})}><option value="All">All Teachers</option>{teachers.map(teacher=><option key={teacher} value={teacher}>{teacher}</option>)}</select></label><label>Category<select value={filters.category} onChange={event=>setFilters({...filters,category:event.target.value})}><option value="All">All Categories</option>{categories.map(category=><option key={category} value={category}>{category}</option>)}</select></label><label>Rating<select value={filters.rating} onChange={event=>setFilters({...filters,rating:event.target.value})}><option value="All">All Ratings</option>{[5,4,3,2,1].map(rating=><option key={rating} value={String(rating)}>{rating} Stars</option>)}</select></label></div>{filteredFeedback.length ? <div className="table-wrap"><table><thead><tr><th>Student</th><th>Category</th><th>Subject</th><th>Teacher</th><th>Rating</th><th>Status</th><th>Comment</th></tr></thead><tbody>{filteredFeedback.map(item => <tr key={item.id}><td><b>{item.anonymous ? "Anonymous" : item.studentName}</b></td><td>{item.category}</td><td>{item.subject}</td><td>{item.teacher}</td><td><span className="rating-stars small"><span className="star active">★</span> {item.rating}</span></td><td><span className="status present">{item.status}</span></td><td>{item.comment}</td></tr>)}</tbody></table></div> : <div className="feedback-empty"><div className="empty-icon"><ClipboardList/></div><h3>No feedback matches the current filters</h3><p>Adjust the selections to view more student feedback and ratings.</p></div>}<div className="analytics-panel"><h3>Category-wise ratings</h3><div className="analytics-row">{stats.categoryRatings.map(item => <div className="analytics-card" key={item.category}><b>{item.category}</b><strong>{item.avg.toFixed(1)} / 5</strong><span>{item.total} responses</span></div>)}</div></div></section></>;
}

function PaymentHistory({payments}){
 if(!payments.length)return <><PageTitle eyebrow="STUDENT · FINANCE" title="Payment History" desc="Review your tuition, examination fees and upcoming payments."/><section className="panel empty-payment"><div className="fee-icon"><Receipt/></div><h3>No payment record found</h3><p>No payment or fee data is linked to this student ID.</p></section></>;
 const paid=payments.filter(payment=>payment.status==="Paid");
 const upcoming=payments.find(payment=>payment.status==="Upcoming");
 const paidTotal=paid.reduce((total,payment)=>total+Number(payment.paid||0),0);
 return <><PageTitle eyebrow="STUDENT · FINANCE" title="Payment History" desc="Review your tuition, examination fees and upcoming payments." actions={<button className="ghost" onClick={()=>window.print()}><Printer/> Print statement</button>}/><div className="stats-grid"><Stat icon={CheckCircle2} label="Paid transactions" value={paid.length} sub="Successfully completed"/><Stat icon={CreditCard} label="Paid total" value={`INR ${paidTotal.toLocaleString("en-IN")}`} sub="From this student record"/><Stat icon={Clock3} label="Next due" value={upcoming?.date||"None"} sub={upcoming?`Due INR ${Number(upcoming.due||0).toLocaleString("en-IN")}`:"No upcoming payment"}/><Stat icon={Receipt} label="Account status" value={upcoming?"Due":"Clear"} sub={upcoming?"Upcoming payment":"No pending payment"}/></div><section className="panel payment-panel"><div className="panel-head"><div><h3>Transaction history</h3><p>Student finance records stored in this prototype.</p></div><span className="attendance-pill">{paid.length} paid</span></div><div className="payment-list">{payments.map(payment=><div className="payment-row" key={payment.id}><div className={`payment-icon ${payment.status.toLowerCase()}`}><Receipt/></div><div className="payment-main"><b>{payment.title}</b><span>{payment.date} · {payment.method}</span></div><div className="payment-amount"><b>Total INR {Number(payment.total||0).toLocaleString("en-IN")}</b><span>Paid INR {Number(payment.paid||0).toLocaleString("en-IN")} · Due INR {Number(payment.due||0).toLocaleString("en-IN")} · {payment.id}</span></div><span className={`status ${payment.status==="Paid"?"present":payment.status==="Partial"?"upcoming":"absent"}`}>{payment.status}</span></div>)}</div></section></>;
}

function CampusMap(){
 const [selected,setSelected]=useState(locations[0]);const [q,setQ]=useState("");const filtered=locations.filter(x=>x[0].toLowerCase().includes(q.toLowerCase()));
 return <><PageTitle eyebrow="CAMPUS NAVIGATION" title="Explore Campus in 3D" desc="Interactive campus map with lightweight 3D-style buildings and demo navigation."/>
 <div className="map-layout"><section className="panel map-panel"><div className="map-toolbar"><div className="search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search campus location…"/></div><span><Map/> Drag · Zoom · Select</span></div><div className="campus-scene"><div className="sky-grid"/>{locations.map((l,i)=><button key={l[0]} className={`building building-${i} ${selected[0]===l[0]?"chosen":""}`} onClick={()=>setSelected(l)}><div className="roof"/><div className="tower"/><span>{l[0]}</span></button>)}<div className="road r1"/><div className="road r2"/><div className="tree t1"/><div className="tree t2"/><div className="tree t3"/><div className="map-compass">N</div></div></section>
 <section className="panel location-panel"><div className="eyebrow">SELECTED LOCATION</div><div className="location-big"><Building2/></div><h2>{selected[0]}</h2><p>{selected[3]} · {selected[1]}</p><div className="loc-details"><span>Floor <b>{selected[2]}</b></span><span>Category <b>{selected[3]}</b></span><span>Walk <b>{selected[4]}</b></span></div><button className="primary big"><Navigation/> Navigate</button><div className="route"><span className="route-dot"/><div><b>Demo route ready</b><small>Animated route from current location</small></div></div><div className="location-list">{filtered.slice(0,5).map(l=><button className={l[0]===selected[0]?"sel":""} onClick={()=>setSelected(l)} key={l[0]}><Building2 size={16}/>{l[0]}<ChevronRight/></button>)}</div></section></div></>
}

function IssuePage({role,issues,setIssues}){
 const [form,setForm]=useState({category:"Electrical / Wi-Fi",location:"Academic Block",description:""});const [done,setDone]=useState(null);
 const submit=e=>{e.preventDefault();if(!form.description.trim())return;const ticket=uid("CMP");const item={...form,id:ticket,date:new Date().toISOString().slice(0,10),status:"Open"};setIssues([item,...issues]);setDone(ticket);setForm({...form,description:""})};
 return <><PageTitle eyebrow={role==="admin"?"ADMIN · ISSUES":"CAMPUS SERVICES"} title={role==="admin"?"Issue Reports":"Report an Issue"} desc={role==="admin"?"Review campus reports submitted by students.":"Help improve your campus by reporting a problem."}/>
 {role==="student"?<section className="panel issue-form"><form onSubmit={submit}><div className="form-grid"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Electrical / Wi-Fi","Cleanliness","Furniture","Water Supply","Other"].map(x=><option key={x}>{x}</option>)}</select></label><label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label></div><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the issue clearly…"/></label><label className="upload"><input type="file" accept="image/*" capture="environment"/><Camera/> Add photo / camera capture</label><button className="primary big"><AlertTriangle/> Submit Issue</button></form>{done&&<div className="success-box"><CheckCircle2/> Issue Reported Successfully · Ticket #{done}</div>}</section>:<section className="panel"><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Category</th><th>Location</th><th>Description</th><th>Status</th></tr></thead><tbody>{issues.length?issues.map(x=><tr key={x.id}><td><b>#{x.id}</b></td><td>{x.category}</td><td>{x.location}</td><td>{x.description}</td><td><span className="status live">{x.status}</span></td></tr>):<tr><td colSpan="5">No submitted reports yet.</td></tr>}</tbody></table></div></section>}</>
}

function Monitor({attendance,session}){const present=attendance.filter(x=>x.status==="Present").length;return <><PageTitle eyebrow="ADMIN · LIVE" title="Live Attendance Monitoring" desc="Real-time-looking monitoring built from locally stored attendance records." actions={<button className="ghost"><RefreshCw/> Refresh</button>}/><div className="stats-grid"><Stat icon={QrCode} label="Active Session" value={session?"01":"00"} sub={session?.id||"No active QR session"}/><Stat icon={Users} label="Total Students" value="50" sub="Current class"/><Stat icon={CheckCircle2} label="Present" value={present} sub="Verified records"/><Stat icon={Activity} label="Attendance" value="92%" sub="Live estimate"/></div><section className="panel"><div className="panel-head"><div><h3>Presence Feed</h3><p>Students verified in the current demo environment</p></div><span className="live-dot">LIVE</span></div><div className="feed">{["Neha Kapoor","Aman Deep","Priya Singh","Sohan Lal"].map((n,i)=><div className="feed-row" key={n}><div className="avatar small">{["NK","AD","PS","SL"][i]}</div><div><b>{n}</b><span>CSE2026-10{24+i} · {i%2?"CSE-A":"CSE-B"}</span></div><span className="verified-label"><CheckCircle2/> Verified</span><small>{i+1} min ago</small></div>)}</div></section></>}
function StudentRecords(){
 const [query,setQuery]=useState("");
 const students=[
  ["CSE2026-1024","Neha Kapoor","CSE-A","3rd Year","Present","94%"],
  ["CSE2026-1025","Aman Deep","CSE-A","3rd Year","Present","89%"],
  ["CSE2026-1026","Priya Singh","CSE-B","3rd Year","Present","92%"],
  ["CSE2026-1027","Sohan Lal","CSE-B","3rd Year","Absent","76%"],
  ["CSE2026-1028","Kavya Nair","CSE-C","3rd Year","Present","96%"],
  ["CSE2026-1029","Arjun Rao","CSE-C","3rd Year","Present","84%"]
 ];
 const filtered=students.filter(student=>student.join(" ").toLowerCase().includes(query.toLowerCase()));
 return <><PageTitle eyebrow="ADMIN · STUDENTS" title="Student Records" desc="View enrollment details and academic attendance records." actions={<button className="ghost" onClick={()=>window.print()}><Printer/> Print records</button>}/><div className="stats-grid"><Stat icon={Users} label="Total students" value="1,240" sub="Across all departments"/><Stat icon={CheckCircle2} label="Active students" value="1,198" sub="Currently enrolled"/><Stat icon={Activity} label="Average attendance" value="91%" sub="This semester"/><Stat icon={Clock3} label="Needs attention" value="42" sub="Below 75% attendance"/></div><section className="panel student-records-panel"><div className="filters"><div className="search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search name, ID or section..."/></div><span className="attendance-pill">Showing <b>{filtered.length}</b> of 1,240</span></div><div className="table-wrap"><table><thead><tr><th>Student ID</th><th>Name</th><th>Section</th><th>Year</th><th>Today</th><th>Attendance</th></tr></thead><tbody>{filtered.map(student=><tr key={student[0]}><td><b>{student[0]}</b></td><td>{student[1]}</td><td>{student[2]}</td><td>{student[3]}</td><td><span className={`status ${student[4]==="Present"?"present":"absent"}`}>{student[4]}</span></td><td><b>{student[5]}</b></td></tr>)}</tbody></table></div></section></>;
}
function StudentMarks(){
 const [query,setQuery]=useState("");
 const subjects=["Data Structures","Operating Systems","DBMS","Computer Networks","Computer Lab"];
 const students=[
  ["CSE2026-1024","Neha Kapoor",[88,91,86,94,96]],
  ["CSE2026-1025","Aman Deep",[79,84,81,88,90]],
  ["CSE2026-1026","Priya Singh",[92,95,89,91,94]],
  ["CSE2026-1027","Sohan Lal",[68,74,71,79,76]],
  ["CSE2026-1028","Kavya Nair",[96,93,98,95,97]],
  ["CSE2026-1029","Arjun Rao",[82,78,85,80,87]]
 ];
 const filtered=students.filter(student=>student.join(" ").toLowerCase().includes(query.toLowerCase()));
 const average=students.flatMap(student=>student[2]).reduce((total,mark)=>total+mark,0)/(students.length*subjects.length);
 return <><PageTitle eyebrow="ADMIN · ACADEMICS" title="Student Marks" desc="Review marks for every student across every registered subject." actions={<button className="ghost" onClick={()=>window.print()}><Printer/> Print marks</button>}/><div className="stats-grid"><Stat icon={ClipboardList} label="Subjects" value={subjects.length} sub="Current semester"/><Stat icon={Users} label="Students graded" value={students.length} sub="Records available"/><Stat icon={BarChart3} label="Class average" value={`${average.toFixed(1)}%`} sub="All subjects"/><Stat icon={CheckCircle2} label="Passing records" value="94%" sub="Above 40 marks"/></div><section className="panel marks-panel"><div className="filters"><div className="search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search student or ID..."/></div><span className="attendance-pill">{subjects.length} subjects</span></div><div className="table-wrap"><table><thead><tr><th>Student</th>{subjects.map(subject=><th key={subject}>{subject}</th>)}<th>Total</th><th>Average</th><th>Grade</th></tr></thead><tbody>{filtered.map(student=>{const total=student[2].reduce((sum,mark)=>sum+mark,0);const avg=total/subjects.length;const grade=avg>=90?"A+":avg>=80?"A":avg>=70?"B":"C";return <tr key={student[0]}><td><b>{student[1]}</b><small className="marks-id">{student[0]}</small></td>{student[2].map((mark,index)=><td key={subjects[index]}><b>{mark}</b></td>)}<td><b>{total}/500</b></td><td><b>{avg.toFixed(1)}%</b></td><td><span className="status present">{grade}</span></td></tr>})}</tbody></table></div></section></>;
}
function Manage(){return <><PageTitle eyebrow="ADMIN · CAMPUS" title="Manage Campus" desc="Manage the campus directory used by the interactive map."/><section className="panel"><div className="manage-grid">{locations.map(x=><div className="manage-card" key={x[0]}><Building2/><div><b>{x[0]}</b><span>{x[1]} · {x[2]}</span></div><button className="icon-btn"><ChevronRight/></button></div>)}</div></section></>}
function TeacherSalaries(){
 const teachers=[
  ["Dr. Amit Singh","HOD · CSE","EMP-001","INR 125,000","Paid","2026-09-01"],
  ["Dr. Sharma","Associate Professor","EMP-014","INR 98,000","Paid","2026-09-01"],
  ["Prof. Verma","Assistant Professor","EMP-022","INR 82,500","Processing","2026-09-01"],
  ["Dr. Mehta","Assistant Professor","EMP-031","INR 86,000","Paid","2026-09-01"],
  ["Dr. Gupta","Lab Coordinator","EMP-044","INR 68,500","Pending","2026-09-01"]
 ];
 return <><PageTitle eyebrow="ADMIN · PAYROLL" title="Teacher Salary Details" desc="Review monthly salary records and payroll status for teaching staff." actions={<button className="ghost" onClick={()=>window.print()}><Printer/> Print payroll</button>}/><div className="stats-grid"><Stat icon={CircleDollarSign} label="Monthly payroll" value="INR 460K" sub="Current month"/><Stat icon={Users} label="Teaching staff" value={teachers.length} sub="Active records"/><Stat icon={CheckCircle2} label="Paid records" value={teachers.filter(x=>x[4]==="Paid").length} sub="This pay cycle"/><Stat icon={Clock3} label="Pending review" value={teachers.filter(x=>x[4]!=="Paid").length} sub="Needs attention"/></div><section className="panel salary-panel"><div className="panel-head"><div><h3>Monthly salary register</h3><p>September 2026 payroll overview</p></div><span className="attendance-pill">September 2026</span></div><div className="table-wrap"><table><thead><tr><th>Teacher</th><th>Role</th><th>Employee ID</th><th>Net salary</th><th>Pay date</th><th>Status</th></tr></thead><tbody>{teachers.map(teacher=><tr key={teacher[2]}><td><b>{teacher[0]}</b></td><td>{teacher[1]}</td><td>{teacher[2]}</td><td><b>{teacher[3]}</b></td><td>{teacher[5]}</td><td><span className={`status ${teacher[4]==="Paid"?"present":teacher[4]==="Processing"?"upcoming":"absent"}`}>{teacher[4]}</span></td></tr>)}</tbody></table></div></section></>;
}
function Notifications({data,setData}){return <><PageTitle eyebrow="CAMPUS CONNECT" title="Notifications" desc="Announcements and important campus updates." actions={<button className="ghost" onClick={()=>setData(data.map(n=>({...n,read:true})))}>Mark all read</button>}/><section className="panel notification-list">{data.map(n=><div className={`notification ${n.read?"read":""}`} key={n.id}><div className="notif-icon"><Bell/></div><div><b>{n.title}</b><p>{n.text}</p></div>{!n.read&&<button className="ghost" onClick={()=>setData(data.map(x=>x.id===n.id?{...x,read:true}:x))}>Mark read</button>}</div>)}</section></>}
function SettingsPage({theme,setTheme,logout,profile}){return <><PageTitle eyebrow="PREFERENCES" title="Settings" desc="Control your Campus Connect prototype experience."/><section className="panel settings"><div className="setting-row"><div><b>Profile</b><span>{profile.name} · Face verified student</span></div><UserRound/></div><div className="setting-row"><div><b>Theme preference</b><span>Switch between light and dark interface.</span></div><button className="toggle" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Moon/>:<Sun/>}<span>{theme==="dark"?"Dark":"Light"}</span></button></div><div className="setting-row"><div><b>Camera permission</b><span>Camera is requested only during demo identity verification and QR scanning.</span></div><Camera/></div><div className="setting-row"><div><b>Prototype storage</b><span>Attendance, issues and settings are stored in this browser using localStorage.</span></div><ShieldCheck/></div><button className="danger big" onClick={logout}><LogOut/> Logout</button></section></>}

export default App;
