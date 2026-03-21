import MainLayout from "@/components/layout/MainLayout";

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout mainClassName="bg-white scroll-smooth">{children}</MainLayout>;
}
