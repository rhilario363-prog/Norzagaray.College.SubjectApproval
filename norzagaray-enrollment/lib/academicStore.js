const SUBJECTS_KEY = 'norzagaray_academic_subjects';
const STUDENTS_KEY = 'norzagaray_academic_students';
const ACADEMIC_EVENT = 'norzagaray:academic-updated';

export const DEFAULT_SUBJECTS = [
  { id: '1', code: 'BEED101', title: 'Foundations of Education', units: 3, department: 'BEED', yearLevel: 1, section: 'BEED 1A', room: 'Room 201', day: 'MWF', time: '08:00 AM - 09:30 AM', schedule: 'MWF 08:00 AM - 09:30 AM', archived: false },
  { id: '2', code: 'BSED101', title: 'Principles of Teaching', units: 3, department: 'BSED', yearLevel: 1, section: 'BSED 1A', room: 'Room 202', day: 'TTH', time: '08:00 AM - 09:30 AM', schedule: 'TTH 08:00 AM - 09:30 AM', archived: false },
  { id: '3', code: 'BSHM101', title: 'Hospitality Operations', units: 1, department: 'BSHM', yearLevel: 1, section: 'BSHM 1A', room: 'Lab 1', day: 'MWF', time: '06:30 PM - 08:00 PM', schedule: 'MWF 06:30 PM - 08:00 PM', archived: false },
  { id: '4', code: 'CS101', title: 'Intro to Computing', units: 3, department: 'BSCS', yearLevel: 1, section: 'BSCS 1A', room: 'ICT Lab 1', day: 'MWF', time: '08:00 AM - 09:30 AM', schedule: 'MWF 08:00 AM - 09:30 AM', archived: false },
  { id: '5', code: 'ACT101', title: 'Computer Fundamentals', units: 3, department: 'ACT', yearLevel: 1, section: 'ACT 1A', room: 'ICT Lab 2', day: 'TTH', time: '06:30 PM - 08:00 PM', schedule: 'TTH 06:30 PM - 08:00 PM', archived: false },
];

export const DEFAULT_STUDENTS = [
  { id: 'NC-2024-0012', name: 'Juan Dela Cruz', program: 'BSCS', department: 'BSCS', yearLevel: 2, status: 'Active', studentType: 'TRANSFEREE', uniFastYearsUsed: 2 },
  { id: 'NC-2024-0045', name: 'Maria Santos', program: 'BSEd', department: 'BSED', yearLevel: 4, status: 'Not Enrolled', studentType: 'REGULAR', uniFastYearsUsed: 3 },
  { id: 'NC-2020-0007', name: 'Ana Reyes', program: 'BSHM', department: 'BSHM', yearLevel: 4, status: 'Graduated', studentType: 'REGULAR', uniFastYearsUsed: 4 },
  { id: 'NC-2025-0019', name: 'Paolo Garcia', program: 'ACT', department: 'ACT', yearLevel: 1, status: 'Transferee', studentType: 'TRANSFEREE', transferSchool: 'Bulacan State College', transferCredits: 12, uniFastYearsUsed: 1 },
];

function readCollection(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(key);
  if (!stored) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(stored);
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function saveCollection(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(ACADEMIC_EVENT));
}

export const getSubjects = () => readCollection(SUBJECTS_KEY, DEFAULT_SUBJECTS).map((subject) => ({
  ...subject,
  yearLevel: subject.yearLevel || 1,
  section: subject.section || 'Section TBA',
  room: subject.room || 'Room TBA',
}));
export const getStudents = () => readCollection(STUDENTS_KEY, DEFAULT_STUDENTS);
export const saveSubjects = (subjects) => saveCollection(SUBJECTS_KEY, subjects);
export const saveStudents = (students) => saveCollection(STUDENTS_KEY, students);

export function subscribeToAcademicData(callback) {
  if (typeof window === 'undefined') return () => {};
  const handleUpdate = () => callback({ subjects: getSubjects(), students: getStudents() });
  window.addEventListener(ACADEMIC_EVENT, handleUpdate);
  window.addEventListener('storage', handleUpdate);
  return () => {
    window.removeEventListener(ACADEMIC_EVENT, handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
}
