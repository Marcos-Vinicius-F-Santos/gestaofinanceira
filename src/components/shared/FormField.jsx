export default function FormField({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
