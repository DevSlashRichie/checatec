import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../../lib/auth";

export const Route = createFileRoute("/admin/_layout")({
  beforeLoad: ({ }) => {
    // We can't easily access AuthContext here in beforeLoad without passing it via context
    // So we'll handle the redirect in the component or rely on context injection if we set it up in root.
    // For simplicity, we'll do a Client-side check in the component wrapper or use a loader if we pass auth context.
    // Let's rely on the component check for this prototype to avoid complex router context setup.
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  // Debug logging
  console.log("AdminLayout State:", { user: user?.email, isAdmin, loading });

  const navigate = useNavigate();
  const { logout } = useAuth(); // Destructure logout from hook

  // Redirect if not authenticated OR not admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log("Redirecting to /login");
        navigate({
          to: "/login",
          search: {
            redirect: location.pathname,
          },
        });
      } else if (!isAdmin) {
        console.log("Redirecting to / due to non-admin");
        navigate({ to: "/" });
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (!loading && (!user || !isAdmin)) {
    // Don't render outlet while redirecting
    return null;
  }

  if (loading) {
    return <div className="p-8 text-center">Checking authentication...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Micro-Form Admin</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {/* TODO: Add Navigation Links */}
          <div className="block px-4 py-2 text-gray-700 bg-gray-50 rounded font-medium">
            Dashboard
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-900 mb-2 truncate" title={user?.email || ''}>
            {user?.email}
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate({ to: "/login" });
            }}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-12">
        <Outlet />
      </main>
    </div>
  );
}
