import { useEffect, useState } from 'react';
import RoleGuard from '../../components/RoleGuard';
import Header from '../../components/Header';
import GeminiChatWidget from '../../components/GeminiChatWidget';
import { getSubjects, saveSubjects, subscribeToAcademicData } from '../../lib/academicStore';
import { getApplications, subscribeToApplications, syncApplications } from '../../lib/enrollmentStore';

const emptySubject = { code: '', title: '', units: 3, department: 'BEED', yearLevel: 1, section: '', room: '', days: [], startTime: '08:00', endTime: '09:30' };
const DAYS = [['M', 'Monday'], ['T', 'Tuesday'], ['W', 'Wednesday'], ['TH', 'Thursday'], ['F', 'Friday']];

const getSubjectDays = (day = '') => {
  const upper = day.toUpperCase();
  const withoutThursday = upper.replaceAll('TH', '');
  return DAYS.map(([key]) => key).filter((key) => key === 'TH' ? upper.includes('TH') : withoutThursday.includes(key));
};

const formatTime = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  return `${String(hours % 12 || 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${modifier}`;
};

const timeToInput = (value = '08:00 AM') => {
  const [clock, modifier] = value.trim().split(' ');
  let [hours, minutes] = clock.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

function AdviserDashboardContent() {
  const [subjects, setSubjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [scanFiles, setScanFiles] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scannedSubjects, setScannedSubjects] = useState([]);
  const [scanDepartment, setScanDepartment] = useState('BEED');

  useEffect(() => {
    const storedProfile = window.localStorage.getItem('norzagaray_user_profile');
    const departmentTimer = window.setTimeout(() => {
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          if (profile.department) setScanDepartment(profile.department);
        } catch {
          setScanDepartment('BEED');
        }
      }
    }, 0);
    const subjectTimer = window.setTimeout(() => {
      fetch('/api/courses').then((response) => response.ok ? response.json() : Promise.reject(new Error('Subjects could not be loaded.'))).then(({ courses }) => setSubjects(courses)).catch(() => setSubjects(getSubjects()));
    }, 0);
    const applicationTimer = window.setTimeout(() => setApplications(getApplications()), 0);
    const unsubscribeSubjects = subscribeToAcademicData(({ subjects: nextSubjects }) => setSubjects(nextSubjects));
    const unsubscribeApplications = subscribeToApplications(setApplications);
    syncApplications().then(setApplications);
    return () => {
      window.clearTimeout(subjectTimer);
      window.clearTimeout(applicationTimer);
      window.clearTimeout(departmentTimer);
      unsubscribeSubjects();
      unsubscribeApplications();
    };
  }, []);

  const updateSubject = (key, value) => setSubjectForm((current) => ({ ...current, [key]: value }));
  const toggleDay = (day) => updateSubject('days', subjectForm.days.includes(day) ? subjectForm.days.filter((item) => item !== day) : [...subjectForm.days, day]);

  const submitSubjectRequest = async (subject) => {
    const response = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subject) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Subject request could not be submitted.');
    return data.course;
  };

  const scanSubjectImages = async () => {
    if (!scanFiles.length) {
      setNotice('Choose one or more subject photos first.');
      return;
    }
    setScanning(true);
    setNotice('Reading subject photos...');
    try {
      if (scanFiles.some((file) => !file.type.startsWith('image/') || file.size > 8 * 1024 * 1024)) {
        throw new Error('Use image files smaller than 8 MB each.');
      }
      const images = await Promise.all(scanFiles.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ mimeType: file.type, data: String(reader.result).split(',')[1] });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })));
      const response = await fetch('/api/ai/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Subject photos could not be read (HTTP ${response.status}).`);
      if (!Array.isArray(data.subjects) || !data.subjects.length) throw new Error('No subjects were detected. Use a clear photo showing the subject code, title, and units.');
      const scanned = data.subjects.map((subject) => ({ ...subject, id: `SUB-${Date.now()}-${Math.random().toString(36).slice(2)}`, code: subject.code.trim().toUpperCase(), title: subject.title.trim(), yearLevel: subject.yearLevel || 1, section: subject.section || 'Section TBA', room: subject.room || 'Room TBA', days: getSubjectDays(subject.day), day: subject.day || '', time: subject.time || '', schedule: subject.day && subject.time ? `${subject.day} ${subject.time}` : 'Schedule TBA', archived: false }));
      setScannedSubjects(scanned);
      setScanFiles([]);
      setNotice(`${scanned.length} subject${scanned.length === 1 ? '' : 's'} detected. Confirm the department before submitting.`);
    } catch (scanError) {
      setNotice(scanError.message);
    } finally {
      setScanning(false);
    }
  };

  const confirmScannedSubjects = async () => {
    setScanning(true);
    try {
      const submitted = await Promise.all(scannedSubjects.map((subject) => submitSubjectRequest({ ...subject, department: scanDepartment })));
      setSubjects((current) => [...current, ...submitted]);
      setScannedSubjects([]);
      setNotice(`${submitted.length} subject${submitted.length === 1 ? '' : 's'} submitted for admin approval.`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setScanning(false);
    }
  };

  const addSubject = async (event) => {
    event.preventDefault();
    if (!subjectForm.code.trim() || !subjectForm.title.trim() || !subjectForm.days.length) {
      setNotice('Choose at least one class day before adding the subject.');
      return;
    }
    const time = `${formatTime(subjectForm.startTime)} - ${formatTime(subjectForm.endTime)}`;
    const day = subjectForm.days.join('');
    const subject = { ...subjectForm, id: `SUB-${Date.now()}`, code: subjectForm.code.trim().toUpperCase(), title: subjectForm.title.trim(), units: Number(subjectForm.units), yearLevel: Number(subjectForm.yearLevel), section: subjectForm.section.trim() || 'Section TBA', room: subjectForm.room.trim() || 'Room TBA', day, time, schedule: `${day} ${time}`, archived: false };
    try {
      if (editingId) throw new Error('Editing an existing subject is disabled while it is under admin review.');
      const created = await submitSubjectRequest(subject);
      setSubjects((current) => [...current, created]);
      setSubjectForm(emptySubject);
      setNotice(`${subject.code} was submitted for admin approval.`);
    } catch (error) {
      setNotice(error.message);
    }
  };

  const editSubject = (subject) => {
    const [start, end] = (subject.time || '08:00 AM - 09:30 AM').split(' - ');
    setEditingId(subject.id);
    setSubjectForm({ code: subject.code, title: subject.title, units: subject.units, department: subject.department, yearLevel: subject.yearLevel || 1, section: subject.section || '', room: subject.room || '', days: getSubjectDays(subject.day), startTime: timeToInput(start), endTime: timeToInput(end) });
  };

  const toggleArchive = () => setNotice('Subject archiving will be available after admin approval workflow is complete.');

  const activeSubjects = subjects.filter((subject) => !subject.archived);
  const enrollmentRows = applications.flatMap((application) => (application.subjects || []).map((subject) => ({ application, subject })));

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header title="Academic Adviser Workspace" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[['Active subjects', activeSubjects.length], ['Archived subjects', subjects.length - activeSubjects.length], ['Student enrollments', enrollmentRows.length], ['Submitted loads', applications.length]].map(([label, value]) => <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lift-on-hover"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="text-3xl font-black text-blue-950 mt-2">{value}</p></div>)}
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5"><div><h2 className="text-lg font-bold text-blue-950">Subject Catalog</h2><p className="text-xs text-slate-500">Add subjects manually or scan one or more subject photos with AI.</p></div><span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">Academic subjects only</span></div>
          <div className="mb-6 rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4"><div className="flex flex-col sm:flex-row sm:items-center gap-3"><div className="flex-1"><label className="block text-sm font-bold text-blue-950">Scan subject photo(s)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setScanFiles(Array.from(event.target.files || []).slice(0, 8))} className="mt-2 block w-full text-sm text-slate-600" /></label><p className="mt-1 text-xs text-slate-500">Upload up to 8 clear JPG, PNG, or WebP photos. Each file must be smaller than 8 MB.</p></div><button type="button" onClick={scanSubjectImages} disabled={scanning || !scanFiles.length} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-yellow-400 disabled:opacity-50">{scanning ? 'Scanning...' : 'Scan photos'}</button></div>{scannedSubjects.length > 0 && <div className="mt-4 border-t border-blue-200 pt-4"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-sm font-bold text-blue-950">{scannedSubjects.length} detected subject{scannedSubjects.length === 1 ? '' : 's'}</p><p className="text-xs text-slate-600">Review the detected rows, confirm the department, then send them to admin.</p></div><div className="flex gap-2"><select aria-label="Confirmed subject department" value={scanDepartment} onChange={(event) => setScanDepartment(event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="BEED">BEED</option><option value="BSED">BSEd</option><option value="BSHM">BSHM</option><option value="BSCS">BSCS</option><option value="ACT">ACT</option></select><button type="button" onClick={confirmScannedSubjects} disabled={scanning} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Confirm and submit</button><button type="button" onClick={() => setScannedSubjects([])} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Clear</button></div></div><div className="mt-3 space-y-1">{scannedSubjects.map((subject) => <p key={subject.id} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700"><strong>{subject.code}</strong> - {subject.title} ({subject.units} units)</p>)}</div></div>}</div>
          <form onSubmit={addSubject} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
            <input aria-label="Subject code" value={subjectForm.code} onChange={(event) => updateSubject('code', event.target.value)} placeholder="Code" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" required />
            <input aria-label="Subject title" value={subjectForm.title} onChange={(event) => updateSubject('title', event.target.value)} placeholder="Subject title" className="border border-slate-300 rounded-lg px-3 py-2 text-sm md:col-span-2" required />
            <input aria-label="Units" type="number" min="1" max="6" value={subjectForm.units} onChange={(event) => updateSubject('units', event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" required />
            <select aria-label="Department" value={subjectForm.department} onChange={(event) => updateSubject('department', event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="BEED">BEED</option><option value="BSED">BSEd</option><option value="BSHM">BSHM</option><option value="BSCS">BSCS</option><option value="ACT">ACT</option></select>
            <select aria-label="Year level" value={subjectForm.yearLevel} onChange={(event) => updateSubject('yearLevel', event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option></select>
            <input aria-label="Section" value={subjectForm.section} onChange={(event) => updateSubject('section', event.target.value)} placeholder="Section" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <input aria-label="Room" value={subjectForm.room} onChange={(event) => updateSubject('room', event.target.value)} placeholder="Room" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <div className="md:col-span-2 flex flex-wrap gap-2">{DAYS.map(([key, label]) => <label key={key} className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"><input type="checkbox" checked={subjectForm.days.includes(key)} onChange={() => toggleDay(key)} />{label}</label>)}</div>
            <div className="grid grid-cols-2 gap-2"><input aria-label="Class start time" type="time" value={subjectForm.startTime} onChange={(event) => updateSubject('startTime', event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" /><input aria-label="Class end time" type="time" value={subjectForm.endTime} onChange={(event) => updateSubject('endTime', event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <button className="bg-blue-950 text-yellow-400 font-bold rounded-lg px-4 py-2 text-sm" type="submit">{editingId ? 'Save changes' : 'Add subject'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setSubjectForm(emptySubject); }} className="border border-slate-300 text-blue-950 font-bold rounded-lg px-4 py-2 text-sm">Cancel</button>}
          </form>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><th className="p-3">Code</th><th className="p-3">Title</th><th className="p-3">Department</th><th className="p-3">Year</th><th className="p-3">Units</th><th className="p-3">Day / time</th><th className="p-3">Room</th><th className="p-3">Approval</th></tr></thead><tbody className="divide-y divide-slate-100">{subjects.map((subject) => <tr key={subject.id} className={subject.archived ? 'opacity-60' : ''}><td className="p-3 font-black text-blue-950">{subject.code}</td><td className="p-3 font-semibold">{subject.title}<span className="block text-xs text-slate-500">{subject.section || 'Section TBA'}</span></td><td className="p-3">{subject.department}</td><td className="p-3">Year {subject.yearLevel || 1}</td><td className="p-3">{subject.units}</td><td className="p-3 text-slate-500">{subject.day} {subject.time}</td><td className="p-3 text-slate-500">{subject.room || 'Room TBA'}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${subject.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : subject.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{subject.status || 'LOCAL'}</span></td></tr>)}</tbody></table></div>
        </section>

        <section className="print-section bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5"><div><h2 className="text-lg font-bold text-blue-950">Student Subject Enrollments</h2><p className="text-xs text-slate-500">Students who selected each subject.</p></div><button type="button" onClick={() => window.print()} className="print-hide bg-blue-950 text-yellow-400 font-bold rounded-lg px-4 py-2 text-sm">Print roster</button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><th className="p-3">Student</th><th className="p-3">Student ID</th><th className="p-3">Program</th><th className="p-3">Subject</th><th className="p-3">Schedule</th><th className="p-3">Load status</th></tr></thead><tbody className="divide-y divide-slate-100">{enrollmentRows.map(({ application, subject }, index) => <tr key={`${application.id}-${subject.id || subject.code}-${index}`}><td className="p-3 font-semibold">{application.studentName}</td><td className="p-3">{application.idNo}</td><td className="p-3">{application.course}</td><td className="p-3 font-bold text-blue-950">{subject.code} - {subject.title}</td><td className="p-3 text-slate-500">{subject.schedule || `${subject.day} ${subject.time}`}</td><td className="p-3">{application.status}</td></tr>)}{!enrollmentRows.length && <tr><td colSpan="6" className="p-6 text-center text-sm text-slate-500">No students have selected a subject yet.</td></tr>}</tbody></table></div></section>
        {notice && <p className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-950 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold">{notice}</p>}
      </main>
      <GeminiChatWidget studentContext={{ role: 'professor', department: subjects[0]?.department || 'your department', subjectCount: subjects.length }} />
    </div>
  );
}

export default function AdviserDashboard() {
  return <RoleGuard allowedRole="adviser"><AdviserDashboardContent /></RoleGuard>;
}
