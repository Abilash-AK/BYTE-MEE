import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, githubProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

const PROFILE_KEY = 'colearn_profile';

const loadProfile = () => {
    try {
        return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    } catch (e) {
        console.warn('Failed to load profile', e);
        return null;
    }
};

const saveProfile = (profile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(loadProfile());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const hydratedProfile = saveProfile({
                    name: currentUser.displayName || profile?.name || 'Learner',
                    email: currentUser.email || profile?.email || 'demo@colearn.dev',
                    photoURL: currentUser.photoURL || profile?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoLearn',
                    github: profile?.github || '',
                });
                setProfile(hydratedProfile);
            }
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const nextProfile = saveProfile({
                name: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL,
                github: profile?.github || '',
            });
            setProfile(nextProfile);
            return result.user;
        } catch (error) {
            console.error('Login error:', error);
            const mockUser = {
                uid: 'demo-user-' + Date.now(),
                displayName: 'Demo User',
                email: 'demo@colearn.dev',
                photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo'
            };
            setUser(mockUser);
            const nextProfile = saveProfile({
                name: mockUser.displayName,
                email: mockUser.email,
                photoURL: mockUser.photoURL,
                github: profile?.github || '',
            });
            setProfile(nextProfile);
            return mockUser;
        }
    };

    const registerWithEmail = async ({ name, email, dob, phone, tasks }) => {
        // Demo: store locally and treat as authenticated session
        const mockUser = {
            uid: 'local-' + Date.now(),
            displayName: name,
            email,
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(name || 'CoLearn')
        };
        setUser(mockUser);
        const nextProfile = saveProfile({
            name,
            email,
            dob,
            phone,
            tasks,
            photoURL: mockUser.photoURL,
            github: profile?.github || '',
        });
        setProfile(nextProfile);
        return mockUser;
    };

    const loginWithGithub = async () => {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            const displayName = result.user.displayName || result.user.reloadUserInfo?.screenName || 'GitHub User';
            const email = result.user.email || profile?.email || 'github@colearn.dev';
            const username = result.user.reloadUserInfo?.screenName || result.user.providerData?.[0]?.uid || 'gh-user';
            const nextProfile = saveProfile({
                name: displayName,
                email,
                photoURL: result.user.photoURL || profile?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Octo',
                github: username,
            });
            setProfile(nextProfile);
            return result.user;
        } catch (error) {
            console.error('GitHub login error:', error);
            const mockUser = {
                uid: 'demo-github-' + Date.now(),
                displayName: 'GitHub Demo',
                email: 'github-demo@colearn.dev',
                photoURL: 'https://api.dicebear.com/7.x/identicon/svg?seed=github'
            };
            setUser(mockUser);
            const nextProfile = saveProfile({
                name: mockUser.displayName,
                email: mockUser.email,
                photoURL: mockUser.photoURL,
                github: 'demo-gh',
            });
            setProfile(nextProfile);
            return mockUser;
        }
    };

    const updateProfile = (payload) => {
        const next = saveProfile({ ...profile, ...payload });
        setProfile(next);
        return next;
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
        setProfile(null);
        localStorage.removeItem(PROFILE_KEY);
    };

    const value = {
        user,
        loading,
        loginWithGoogle,
        loginWithGithub,
        registerWithEmail,
        profile,
        updateProfile,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
