export function ComingSoonPage({ title }: { title: string }) {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-zinc-600">Coming in next tasks.</p>
    </section>
  );
}
