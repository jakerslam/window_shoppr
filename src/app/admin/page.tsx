import AdminDashboard from "@/features/admin/AdminDashboard";

export const metadata = {
  title: "Admin Dashboard | Window Shoppr",
  robots: { index: false, follow: false },
};

/**
 * Admin route stub for operations visibility.
 */
export default function AdminPage() {
  return <AdminDashboard />;
}
