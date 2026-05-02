export default function EmptyState({ title = 'Nenhum registro encontrado', description }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
      <p className="font-bold text-slate-700">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}
