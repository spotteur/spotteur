import AuthLayout from "@/components/layout/AuthLayout"

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthLayout>{children}</AuthLayout>
}
