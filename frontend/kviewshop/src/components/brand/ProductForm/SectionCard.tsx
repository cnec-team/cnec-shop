import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function SectionCard({ title, subtitle, children, className, id }: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-3xl border border-gray-100 bg-white p-6 sm:p-8',
        className,
      )}
    >
      <header className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
