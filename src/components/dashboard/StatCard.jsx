export default function StatCard({ title, value, helper, tone = 'default', icon: Icon }) {
  const tones = {
    default: 'border-slate-200 bg-white text-blue-700',
    positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    negative: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-lg border p-4 shadow-soft sm:p-5 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 break-words text-xl font-bold tracking-tight text-ink sm:mt-3 sm:text-2xl">{value}</p>
        </div>
        {Icon ? (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/80 shadow-sm sm:h-11 sm:w-11">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-2 text-xs font-medium text-slate-500 sm:mt-3">{helper}</p> : null}
    </div>
  );
}
