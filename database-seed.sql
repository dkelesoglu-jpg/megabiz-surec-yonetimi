import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, getProfile } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '../lib/supabase';

interface ProfileData {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    employee_id: string | null;
    is_active: boolean;
    employees: any | null;
}

interface AuthContextType {
    user: User | null;
    profile: ProfileData | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadProfile();
            } else {
                setLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadProfile();
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (error) {
            console.error('Profil yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setProfile(null);
    };

    const hasRole = (role: string): boolean => {
        if (!profile) return false;
        const levels: Record<string, number> = {
            system_admin: 7,
            board_chairman: 6,
            general_manager: 5,
            deputy_general_manager: 4,
            department_manager: 3,
            human_resources: 2,
            employee: 1,
        };
        return (levels[profile.role] || 0) >= (levels[role] || 0);
    };

    const value = { user, profile, loading, signIn, signOut, hasRole };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
