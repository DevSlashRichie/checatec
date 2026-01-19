import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuth } from '../../lib/auth'

export const Route = createFileRoute('/admin/_layout')({
    beforeLoad: ({ context, location }) => {
        // We can't easily access AuthContext here in beforeLoad without passing it via context
        // So we'll handle the redirect in the component or rely on context injection if we set it up in root.
        // For simplicity, we'll do a Client-side check in the component wrapper or use a loader if we pass auth context.
        // Let's rely on the component check for this prototype to avoid complex router context setup.
    },
    component: AdminLayout,
})

function AdminLayout() {
    const { user, loading } = useAuth()

    // Redirect if not authenticated
    if (!loading && !user) {
        throw redirect({
            to: '/login',
            search: {
                // Use the current location to redirect back after login
                redirect: location.pathname,
            },
        })
    }

    if (loading) {
        return <div className="p-8 text-center">Checking authentication...</div>
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200">
                <div className="h-16 flex items-center justify-center border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">Micro-Form Admin</h1>
                </div>
                <nav className="p-4 space-y-2">
                    {/* TODO: Add Navigation Links */}
                    <div className="block px-4 py-2 text-gray-700 bg-gray-50 rounded font-medium">Dashboard</div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    )
}
