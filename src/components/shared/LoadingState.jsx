export default function LoadingState({ label = 'Carregando...', fullScreen = false }) {
  return (
    <div className={fullScreen ? 'grid min-h-screen place-items-center bg-slate-100' : 'rounded-lg border border-slate-200 bg-white py-10 text-center shadow-sm'}>
      <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        {label}
      </div>
    </div>
  );
}
