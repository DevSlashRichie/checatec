import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../lib/auth'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function LoginPage() {
    const [error, setError] = useState('')
    const { signInWithGoogle } = useAuth()
    const navigate = useNavigate()

    const handleGoogleSignIn = async () => {
        setError('')
        try {
            await signInWithGoogle()
            navigate({ to: '/admin' })
        } catch (err: any) {
            setError('Failed to sign in with Google. Check console for details.')
            console.error(err)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Admin Login</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-left">
                        {error}
                    </div>
                )}

                <p className="text-gray-600 mb-8">
                    Access the admin dashboard to manage forms and view responses.
                </p>

                <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Sign in with Google
                </button>
            </div>
        </div>
    )
}
