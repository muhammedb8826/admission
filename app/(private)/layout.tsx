export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Private layout - no header/footer, dashboard will have its own sidebar
  return <>{children}</>;
}

