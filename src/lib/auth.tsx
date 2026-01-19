import { createContext, useContext, useEffect, useState } from "react";
import { type User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase";

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                // Check if user is admin
                try {
                    // We import api here to avoid circular dep if possible, or just use direct firestore
                    // To keep it clean, let's assume we can use api or direct firebase
                    // For now, let's use the api helper we will create next, or just inline it for simplicity to avoid deps
                    // Inline check for now:
                    const { doc, getDoc, getFirestore } = await import("firebase/firestore");
                    const db = getFirestore();
                    const adminRef = doc(db, "admins", u.uid);
                    const adminSnap = await getDoc(adminRef);
                    setIsAdmin(adminSnap.exists());
                } catch (e) {
                    console.error("Error checking admin status", e);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
