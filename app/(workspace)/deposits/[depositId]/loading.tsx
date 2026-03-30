export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="h-8 w-48 animate-pulse rounded-full bg-[var(--color-panel-strong)]" />
        <div className="mt-4 h-12 w-72 animate-pulse rounded-full bg-[var(--color-panel-strong)]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="h-56 animate-pulse rounded-[24px] bg-[var(--color-panel-strong)]" />
        </div>
        <div className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="h-56 animate-pulse rounded-[24px] bg-[var(--color-panel-strong)]" />
        </div>
      </div>
      <div className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="h-72 animate-pulse rounded-[24px] bg-[var(--color-panel-strong)]" />
      </div>
    </div>
  );
}
