import React from 'react';

const DAYS = [
  { key: 'M', label: 'Monday' }, { key: 'T', label: 'Tuesday' },
  { key: 'W', label: 'Wednesday' }, { key: 'TH', label: 'Thursday' },
  { key: 'F', label: 'Friday' },
];

const TIME_SLOTS = ['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'];

const COLOR_PALETTE = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900' },
  { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900' },
  { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900' },
];

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [time, modifier] = timeStr.trim().split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return Math.max(0, (hours * 60 + minutes) - (7 * 60));
};

const parseDays = (dayStr) => {
  if (!dayStr) return [];
  const upper = dayStr.toUpperCase();
  const matched = [];
  if (upper.includes('TH')) matched.push('TH');
  if (upper.includes('M')) matched.push('M');
  if (upper.replaceAll('TH', '').includes('T')) matched.push('T');
  if (upper.includes('W')) matched.push('W');
  if (upper.includes('F')) matched.push('F');
  return matched;
};

export default function WeeklyTimetable({ subjects = [], selectedCourses = [], availableSubjects = [], onToggleSubject }) {
  const timetableSubjects = subjects.length ? subjects : selectedCourses;
  const gridSubjects = availableSubjects.length ? availableSubjects : timetableSubjects;
  const subjectColors = {};
  gridSubjects.forEach((sub, idx) => {
    subjectColors[sub.code] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
  });

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden font-sans">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 text-base">Weekly Timetable Subjects</h3>
        <span className="text-xs bg-gray-200 text-gray-700 font-medium px-2.5 py-1 rounded-full">Muted = available &bull; Bright = selected</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-6 border-b text-center text-xs font-semibold text-gray-600 bg-gray-100">
            <div className="p-2.5 border-r text-gray-400">Time</div>
            {DAYS.map((d) => <div key={d.key} className="p-2.5 border-r">{d.label}</div>)}
          </div>
          <div className="relative grid grid-cols-6 h-[728px]">
            <div className="col-span-1 border-r grid grid-rows-14 text-[11px] text-gray-400 font-medium">
              {TIME_SLOTS.map((slot, idx) => (
                <div key={idx} className="border-b p-1 pl-2">{slot}</div>
              ))}
            </div>
            {DAYS.map((d) => (
              <div key={d.key} className="relative col-span-1 border-r h-full">
                <div className="grid grid-rows-14 h-full absolute inset-0 pointer-events-none">
                  {TIME_SLOTS.map((_, idx) => <div key={idx} className="border-b h-full" />)}
                </div>
                {gridSubjects.map((subject) => {
                  const subjectDays = parseDays(subject.day);
                  if (!subjectDays.includes(d.key)) return null;
                  const [startTimeStr, endTimeStr] = (subject.time || '').split('-').map((s) => s.trim());
                  const startMins = timeToMinutes(startTimeStr);
                  const endMins = timeToMinutes(endTimeStr);
                  const topPx = startMins * 0.8;
                  const heightPx = Math.max(30, endMins - startMins) * 0.8;
                  const color = subjectColors[subject.code] || COLOR_PALETTE[0];
                  const selected = selectedCourses.some((course) => course.id === subject.id);
                  return (
                    <button
                      key={`${subject.id}-${d.key}`}
                      type="button"
                      onClick={() => onToggleSubject?.(subject)}
                      title={`${subject.code} - ${subject.title}. Click to remove from your timetable.`}
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      className={`absolute left-1 right-1 rounded-md p-1.5 border flex flex-col justify-between overflow-hidden text-xs z-10 transition ${color.bg} ${color.border} ${color.text} ${selected ? 'opacity-100 shadow-md ring-2 ring-blue-300' : 'opacity-40 hover:opacity-75'}`}
                    >
                      <div>
                        <div className="font-bold">{subject.code}</div>
                        <div className="text-[10px] opacity-80 truncate">{subject.title}</div>
                        <div className="text-[10px] opacity-80 truncate">{subject.section || 'Section TBA'} &bull; {subject.room || 'Room TBA'}</div>
                      </div>
                      <div className="text-[10px] font-medium opacity-90">{subject.time}</div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
        {availableSubjects.length > 0 && <div className="mt-5 border-t pt-4"><h4 className="text-sm font-bold text-gray-800 mb-3">Subjects by year level</h4><div className="space-y-4">{[1, 2, 3, 4].map((year) => { const yearSubjects = availableSubjects.filter((subject) => Number(subject.yearLevel || 1) === year); if (!yearSubjects.length) return null; return <div key={year}><p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Year {year}</p><div className="grid gap-2 sm:grid-cols-2">{yearSubjects.map((subject) => { const selected = selectedCourses.some((course) => course.id === subject.id); return <button type="button" key={subject.id} onClick={() => onToggleSubject?.(subject)} className={`text-left border rounded-lg p-3 transition ${selected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}><span className="block text-xs font-black text-blue-950">{subject.code} - {subject.title}</span><span className="block text-xs text-slate-500 mt-1">{subject.day} {subject.time} &bull; {subject.units} units</span><span className="block text-xs font-bold mt-2 text-blue-800">{selected ? 'Remove from timetable' : 'Add to timetable'}</span></button>; })}</div></div>; })}</div></div>}
        <div className="border-t p-4">
          <h4 className="text-sm font-bold text-gray-800 mb-2">Selected subjects and schedule</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {timetableSubjects.map((subject) => <button type="button" onClick={() => onToggleSubject?.(subject)} key={subject.id} className="text-left text-xs border rounded-lg p-2 hover:bg-slate-50"><strong>{subject.code}</strong> {subject.title}<span className="block text-gray-500">{subject.schedule || `${subject.day} ${subject.time}`} &bull; {subject.section || 'Section TBA'} &bull; {subject.room || 'Room TBA'}</span></button>)}
            {!timetableSubjects.length && <p className="text-xs text-gray-500">Choose subjects from the year-level list above to build your weekly timetable.</p>}
          </div>
        </div>
      </div>
  );
}