import { useEffect, useState } from 'react';
import RoleGuard from '../../components/RoleGuard';
import Header from '../../components/Header';
import WeeklyTimetable from '../../components/WeeklyTimetable';
import GeminiChatWidget from '../../components/GeminiChatWidget';
import CertificateOfRegistration from '../../components/CertificateOfRegistration';
import { createApplication, getApplications, subscribeToApplications, syncApplications } from '../../lib/enrollmentStore';
import { DEFAULT_SUBJECTS, getSubjects, subscribeToAcademicData } from '../../lib/academicStore';

const DEFAULT_PROFILE = { userName: 'Juan Dela Cruz', idNo: 'NC-2024-0012', department: 'BSCS', program: 'Bachelor of Science in Computer Science' };
const RATE_PER_UNIT = 50;

const timeToMinutes = (value) => {
  const [time, modifier] = value.trim().split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const subjectConflicts = (first, second) => {
  const parseDays = (value = '') => { const upper = value.toUpperCase(); const withoutThursday = upper.replaceAll('TH', ''); return ['M', 'T', 'W', 'TH', 'F'].filter((day) => day === 'TH' ? upper.includes('TH') : withoutThursday.includes(day)); };
  const sharesDay = parseDays(first.day).some((day) => parseDays(second.day).includes(day));
  if (!sharesDay) return false;
  const [firstStart, firstEnd] = first.time.split('-').map((value) => timeToMinutes(value));
  const [secondStart, secondEnd] = second.time.split('-').map((value) => timeToMinutes(value));
  return firstStart < secondEnd && secondStart < firstEnd;
};

function StudentDashboardContent() {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState(DEFAULT_SUBJECTS);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [notice, setNotice] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const totalUnits = selectedCourses.reduce((acc, curr) => acc + curr.units, 0);
  const totalCost = totalUnits * RATE_PER_UNIT;

  useEffect(() => {
    const storedProfile = window.localStorage.getItem('norzagaray_user_profile');
    const nextProfile = storedProfile ? JSON.parse(storedProfile) : DEFAULT_PROFILE;
    const existing = getApplications().find((application) => application.idNo === nextProfile.idNo);
    const timer = window.setTimeout(() => {
      setProfile(nextProfile);
      fetch('/api/courses').then((response) => response.ok ? response.json() : Promise.reject(new Error('Subjects could not be loaded.'))).then(({ courses }) => setAvailableCourses(courses.filter((subject) => !subject.archived && subject.status === 'APPROVED' && (!nextProfile.department || subject.department === nextProfile.department)))).catch(() => setAvailableCourses(getSubjects().filter((subject) => !subject.archived && (!nextProfile.department || subject.department === nextProfile.department))));
      if (existing?.subjects?.length) setSelectedCourses(existing.subjects);
      if (existing && existing.status !== 'Pending') setNotice(`Your latest application is ${existing.status.toLowerCase()}.`);
    }, 0);
    const unsubscribe = subscribeToApplications((applications) => {
      const current = applications.find((application) => application.idNo === nextProfile.idNo);
      if (current && current.status !== 'Pending') setNotice(`Your latest application is ${current.status.toLowerCase()}.`);
    });
    const unsubscribeAcademic = subscribeToAcademicData(({ subjects }) => setAvailableCourses(subjects.filter((subject) => !subject.archived && subject.status !== 'PENDING' && (!nextProfile.department || subject.department === nextProfile.department))));
    syncApplications(nextProfile.idNo).then((applications) => {
      const current = applications.find((application) => application.idNo === nextProfile.idNo);
      if (current?.subjects?.length) setSelectedCourses(current.subjects);
      if (current && current.status !== 'Pending') setNotice(`Your latest application is ${current.status.toLowerCase()}.`);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      unsubscribeAcademic();
    };
  }, []);

  const toggleCourse = (course) => {
    if (selectedCourses.some((c) => c.id === course.id)) {
      setSelectedCourses(selectedCourses.filter((c) => c.id !== course.id));
    } else {
      const conflict = selectedCourses.find((selected) => subjectConflicts(selected, course));
      if (conflict) {
        setNotice(`${course.code} conflicts with ${conflict.code} on ${course.day} at ${course.time}. Choose another section or time.`);
        return;
      }
      if (totalUnits + course.units > 21) {
        alert('UniFAST Max Unit Limit Reached (21 Units Max).');
        return;
      }
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const visibleCourses = availableCourses.filter((course) => yearFilter === 'ALL' || String(course.yearLevel || 1) === yearFilter);

  const submitApplication = () => {
    if (!selectedCourses.length) {
      setNotice('Select at least one subject before submitting your load.');
      return;
    }
    createApplication({ studentName: profile.userName, idNo: profile.idNo, subjects: selectedCourses, program: profile.program, department: profile.department });
    setNotice('Load application submitted. It is now waiting for registrar approval.');
  };

  const applySuggestedCourses = (courses) => {
    const nextCourses = courses.reduce((selected, course) => {
      const units = selected.reduce((total, subject) => total + subject.units, 0);
      if (units + course.units <= 21 && !selected.some((subject) => subject.code === course.code)) {
        return [...selected, { ...course, schedule: course.schedule || `${course.day} ${course.time}` }];
      }
      return selected;
    }, []);
    setSelectedCourses(nextCourses);
    setNotice('The assistant loaded a schedule into your timetable. Review it before submitting.');
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header title="Student Load Selection & AI Scheduling" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Course Selection Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-blue-950">Available Course Subjects</h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg">Select up to 21 units</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Filter subjects by year">
              {['ALL', '1', '2', '3', '4'].map((year) => <button key={year} type="button" onClick={() => setYearFilter(year)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${yearFilter === year ? 'bg-blue-950 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>{year === 'ALL' ? 'All years' : `${year}${year === '1' ? 'st' : year === '2' ? 'nd' : year === '3' ? 'rd' : 'th'} year`}</button>)}
            </div>
            <div className="space-y-3">
              {visibleCourses.map((course) => {
                const isSelected = selectedCourses.some((c) => c.id === course.id);
                return (
                  <button type="button" key={course.id} onClick={() => toggleCourse(course)} className={`w-full text-left flex items-center justify-between p-4 border rounded-xl transition ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                    <div>
                      <p className="font-bold text-slate-900">{course.code} - {course.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Year {course.yearLevel || 1} &bull; {course.schedule} &bull; {course.units} Units</p>
                      <p className="text-xs text-slate-500">{course.section || 'Section TBA'} &bull; {course.room || 'Room TBA'}</p>
                    </div>
                    <span className={`px-4 py-2 text-xs font-bold rounded-xl transition shadow-sm ${
                        isSelected 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                          : 'bg-blue-900 hover:bg-blue-950 text-yellow-400'
                      }`}
                    >
                      {isSelected ? 'Remove' : 'Select Subject'}
                    </span>
                  </button>
                );
              })}
              {!visibleCourses.length && <p className="text-sm text-slate-500 py-4">No subjects are available for this year yet.</p>}
            </div>
          </div>

          <WeeklyTimetable selectedCourses={selectedCourses} availableSubjects={availableCourses} onToggleSubject={toggleCourse} />
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 sticky top-6">
            <h2 className="text-lg font-bold text-blue-950 mb-1">Enrollment Summary</h2>
            <p className="text-xs text-slate-500 mb-5">RA 10931 UniFAST Free Higher Education Program</p>
            
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-emerald-900">Status Eligibility:</span>
              <span className="text-xs font-extrabold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">Fully Eligible</span>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between font-bold text-slate-800 text-sm mb-6">
              <span>Total Units Selected:</span>
              <span className={`text-base ${totalUnits > 21 ? 'text-rose-600' : 'text-blue-950'}`}>{totalUnits} / 21</span>
            </div>

            <div className="flex items-center justify-between text-sm font-bold text-slate-800 mb-5">
              <span>Assessment ({RATE_PER_UNIT} PHP / unit):</span>
              <span className="text-blue-950">PHP {totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>

            <button 
              onClick={submitApplication}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-blue-950 font-extrabold py-3 rounded-xl shadow-md transition text-sm tracking-wide"
            >
              Submit Load Application
            </button>
            {notice && <p className="mt-3 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-3">{notice}</p>}
            <button type="button" onClick={() => window.print()} className="w-full mt-3 border border-blue-900 text-blue-900 font-bold py-2.5 rounded-xl transition hover:bg-blue-50 text-sm">
              Print Certificate of Registration
            </button>
          </div>

          <GeminiChatWidget
            studentContext={{ studentName: profile.userName, selectedCourses }}
            onAutoPopulate={applySuggestedCourses}
          />
        </div>
      </main>
      <CertificateOfRegistration profile={profile} subjects={selectedCourses} totalUnits={totalUnits} ratePerUnit={RATE_PER_UNIT} />
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <RoleGuard allowedRole="student">
      <StudentDashboardContent />
    </RoleGuard>
  );
}