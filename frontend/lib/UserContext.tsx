'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch {
            return { success: false, error: 'Network error' };
        }
    };

    const register = async (email: string, password: string, name: string) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await res.json();

            if (res.ok) {
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch {
            return { success: false, error: 'Network error' };
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
        } catch {
            // Still clear local state even if request fails
            setUser(null);
        }
    };

    return (
        <UserContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
