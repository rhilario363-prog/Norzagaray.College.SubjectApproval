const APPLICATIONS_KEY = 'norzagaray_enrollment_applications';
const APPLICATIONS_EVENT = 'norzagaray:applications-updated';

export const INITIAL_APPLICATIONS = [
  {
    id: 'APP-101',
    studentName: 'Juan Dela Cruz',
    idNo: 'NC-2024-0012',
    course: 'BSCS',
    units: 18,
    uniFast: 'Eligible',
    status: 'Pending',
    adviserStatus: 'Approved',
    subjects: [],
  },
  {
    id: 'APP-102',
    studentName: 'Maria Santos',
    idNo: 'NC-2024-0045',
    course: 'BSCS',
    units: 21,
    uniFast: 'Eligible',
    status: 'Pending',
    adviserStatus: 'Approved',
    subjects: [],
  },
];

export function getApplications() {
  if (typeof window === 'undefined') return INITIAL_APPLICATIONS;

  const stored = window.localStorage.getItem(APPLICATIONS_KEY);
  if (!stored) {
    window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    return INITIAL_APPLICATIONS;
  }

  try {
    return JSON.parse(stored);
  } catch {
    window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    return INITIAL_APPLICATIONS;
  }
}

export function saveApplications(applications) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
  window.dispatchEvent(new CustomEvent(APPLICATIONS_EVENT));
}

export function subscribeToApplications(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => callback(getApplications());
  window.addEventListener(APPLICATIONS_EVENT, handleUpdate);
  window.addEventListener('storage', handleUpdate);
  return () => {
    window.removeEventListener(APPLICATIONS_EVENT, handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
}

export function createApplication({ studentName, idNo, subjects, program = 'BEED', department = 'GENERAL' }) {
  const applications = getApplications();
  const existing = applications.find((application) => application.idNo === idNo);
  const application = {
    id: existing?.id || `APP-${Date.now().toString().slice(-6)}`,
    studentName,
    idNo,
    course: program,
    department,
    units: subjects.reduce((total, subject) => total + subject.units, 0),
    uniFast: 'Eligible',
    status: 'Pending',
    adviserStatus: 'Pending',
    subjects,
  };

  const nextApplications = existing
    ? applications.map((item) => item.id === existing.id ? application : item)
    : [...applications, application];
  saveApplications(nextApplications);
  if (typeof window !== 'undefined') {
    fetch('/api/applications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, studentIdNo: idNo, program, department, subjects }),
    }).then(async (response) => {
      if (!response.ok) return;
      const { application } = await response.json();
      const synced = getApplications().map((item) => item.idNo === application.studentIdNo ? {
        ...item,
        id: application.applicationNo,
        studentName: application.studentName,
        course: application.program,
        department: application.department,
        units: application.units,
        status: application.status === 'PENDING' ? 'Pending' : application.status === 'APPROVED' ? 'Approved' : 'Rejected',
        adviserStatus: application.adviserStatus,
        subjects: application.subjects,
      } : item);
      saveApplications(synced);
    }).catch(() => {});
  }
  return application;
}

export async function syncApplications(studentIdNo) {
  if (typeof window === 'undefined') return [];
  const query = studentIdNo ? `?studentIdNo=${encodeURIComponent(studentIdNo)}` : '';
  try {
    const response = await fetch(`/api/applications${query}`, { credentials: 'include' });
    if (!response.ok) return getApplications();
    const { applications } = await response.json();
    const normalized = applications.map((application) => ({
      id: application.applicationNo,
      studentName: application.studentName,
      idNo: application.studentIdNo,
      course: application.program,
      department: application.department,
      units: application.units,
      uniFast: application.uniFast,
      status: application.status === 'PENDING' ? 'Pending' : application.status === 'APPROVED' ? 'Approved' : 'Rejected',
      adviserStatus: application.adviserStatus,
      subjects: application.subjects,
    }));
    saveApplications(normalized);
    return normalized;
  } catch {
    return getApplications();
  }
}

export async function updateApplicationReview(id, changes) {
  if (typeof window === 'undefined') return;
  try {
    await fetch(`/api/applications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
  } catch {
    // Keep the optimistic browser state if the server is temporarily unavailable.
  }
}
