import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AuthProvider } from '../lib/auth'

export const Route = createRootRoute({
    component: () => (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
                <Outlet />
                <TanStackRouterDevtools />
            </div>
        </AuthProvider>
    ),
})
