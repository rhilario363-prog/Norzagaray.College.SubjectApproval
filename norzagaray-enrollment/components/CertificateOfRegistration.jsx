import Image from 'next/image';

const formatPesos = (amount) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function CertificateOfRegistration({ profile, subjects, totalUnits, ratePerUnit }) {
  return (
    <section className="cor-print-area hidden print:block bg-white text-slate-900 p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b-2 border-blue-950 pb-4">
        <Image src="/norzagaray-college-logo.png" alt="Norzagaray College Seal" width={72} height={72} className="object-contain" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest">Republic of the Philippines</p>
          <h1 className="text-2xl font-black text-blue-950">Norzagaray College</h1>
          <p className="text-sm">Office of the Registrar</p>
        </div>
      </div>
      <div className="text-center py-6">
        <h2 className="text-xl font-black uppercase tracking-wide">Certificate of Registration</h2>
        <p className="text-sm">Academic Year 2026-2027</p>
      </div>
      <div className="grid grid-cols-2 gap-3 border border-slate-300 p-4 text-sm mb-6">
        <p><strong>Student Name:</strong> {profile.userName}</p>
        <p><strong>Student ID:</strong> {profile.idNo}</p>
        <p><strong>Program:</strong> {profile.program || profile.department}</p>
        <p><strong>Registration Status:</strong> For Registrar Approval</p>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-950 text-white">
            <th className="border border-blue-950 p-3 text-left">Course</th>
            <th className="border border-blue-950 p-3 text-left">Description</th>
            <th className="border border-blue-950 p-3 text-left">Schedule</th>
            <th className="border border-blue-950 p-3 text-left">Section / Room</th>
            <th className="border border-blue-950 p-3 text-right">Units</th>
            <th className="border border-blue-950 p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.id}>
              <td className="border border-slate-300 p-3 font-bold">{subject.code}</td>
              <td className="border border-slate-300 p-3">{subject.title}</td>
              <td className="border border-slate-300 p-3">{subject.schedule || `${subject.day} ${subject.time}`}</td>
              <td className="border border-slate-300 p-3">{subject.section || 'TBA'}<br />{subject.room || 'TBA'}</td>
              <td className="border border-slate-300 p-3 text-right">{subject.units}</td>
              <td className="border border-slate-300 p-3 text-right">{formatPesos(subject.units * ratePerUnit)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4" className="border border-slate-300 p-3 text-right font-bold">Total</td>
            <td className="border border-slate-300 p-3 text-right font-bold">{totalUnits}</td>
            <td className="border border-slate-300 p-3 text-right font-bold">{formatPesos(totalUnits * ratePerUnit)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-5 text-xs text-slate-600">Assessment rate: {formatPesos(ratePerUnit)} per credit unit. This document is a printable enrollment preview.</p>
      <div className="grid grid-cols-2 gap-12 mt-20 text-center text-sm">
        <div className="border-t border-slate-700 pt-2">Student Signature</div>
        <div className="border-t border-slate-700 pt-2">Registrar Signature</div>
      </div>
    </section>
  );
}
