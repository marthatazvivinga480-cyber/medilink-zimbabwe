export default function LoadingState({ label = "Loading your information…" }: { label?: string }) {
  return <div role="status" aria-live="polite" aria-busy="true" className="mx-auto w-full max-w-7xl px-5 py-10">
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
      <div className="h-7 w-2/3 rounded bg-slate-200" />
      <div className="h-4 w-1/2 rounded bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-slate-100" />)}</div>
    </div>
  </div>;
}
