export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex items-start justify-center">
      <div className="w-full max-w-[480px] min-h-screen relative">
        {children}
      </div>
    </div>
  )
}
