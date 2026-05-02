export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:gap-4 sm:pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-500 sm:mt-2 sm:leading-6">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
