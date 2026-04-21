export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-xl" />
    </div>
  );
}
