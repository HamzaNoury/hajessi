export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-layout min-h-screen">{children}</div>;
}
