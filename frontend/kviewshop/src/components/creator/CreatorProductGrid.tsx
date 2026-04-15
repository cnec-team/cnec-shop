interface CreatorProductGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CreatorProductGrid({ children, className = '' }: CreatorProductGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 ${className}`}>
      {children}
    </div>
  );
}
