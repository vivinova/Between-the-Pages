export default function JournalLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="h-9 w-40 animate-pulse rounded bg-wood-400/20" />
      <div className="h-10 w-full max-w-sm animate-pulse rounded bg-wood-400/20" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-md bg-wood-400/10" />
        ))}
      </div>
      <span className="sr-only">Loading your journal…</span>
    </div>
  );
}
