export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="card p-12 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 grid place-items-center mx-auto">
          <Icon size={24} />
        </div>
      )}
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      {message && (
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}