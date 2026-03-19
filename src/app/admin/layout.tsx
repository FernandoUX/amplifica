import MainLayout from "@/components/layout/MainLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout mainClassName="bg-neutral-50">{children}</MainLayout>;
}
