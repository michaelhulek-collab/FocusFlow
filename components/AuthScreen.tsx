import React, { useState } from 'react';
import { getFirebaseAuth, saveConfig, FirebaseConfig } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { CheckCircle2, Loader2, Settings, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
    onLoginSuccess: () => void;
    onGuestAccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onGuestAccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    
    // Config State
    const [apiKey, setApiKey] = useState('');
    const [authDomain, setAuthDomain] = useState('');
    const [projectId, setProjectId] = useState('');

    const auth = getFirebaseAuth();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!auth) {
            setError("Server not configured. Please click 'Configure Server' below.");
            setLoading(false);
            return;
        }

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess();
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError("Invalid email or password.");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("Email already in use.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError(err.message || "Authentication failed.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = () => {
        if (!apiKey || !authDomain || !projectId) {
            setError("All fields are required.");
            return;
        }
        const config: FirebaseConfig = { apiKey, authDomain, projectId };
        saveConfig(config);
    };

    if (showConfig) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 animate-in fade-in zoom-in-95 duration-300">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                            <Settings className="text-slate-600 dark:text-slate-300" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Configure Server</h2>
                     </div>

                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        To enable cloud sync, create a free project at <a href="https://console.firebase.google.com" target="_blank" className="text-indigo-600 hover:underline">Firebase Console</a>. 
                        Enable <b>Email/Password Auth</b> and <b>Firestore Database</b>. 
                        Then copy the config keys from Project Settings.
                     </p>
                     
                     {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
                            {error}
                        </div>
                     )}

                     <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">API Key</label>
                            <input 
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Auth Domain</label>
                            <input 
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                                value={authDomain}
                                onChange={e => setAuthDomain(e.target.value)}
                                placeholder="project-id.firebaseapp.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Project ID</label>
                            <input 
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                                placeholder="my-project-id"
                            />
                        </div>
                     </div>

                     <div className="flex gap-3 mt-8">
                        <button 
                            onClick={() => setShowConfig(false)}
                            className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveConfig}
                            className="flex-1 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Save Configuration
                        </button>
                     </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
            <div className="w-full max-w-md">
                
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4">
                        <CheckCircle2 className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">FocusFlow</h1>
                    <p className="text-slate-500 dark:text-slate-400">Master your week, one habit at a time.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-2">
                             <span className="mt-0.5 block w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                             {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 ml-1">Email</label>
                            <input 
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 ml-1">Password</label>
                            <input 
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? <ShieldCheck size={20} /> : <ArrowRight size={20} />)}
                            {isRegistering ? 'Sign Up' : 'Log In'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 text-center">
                        <button 
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            {isRegistering ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                        </button>
                        
                        <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
                             <button onClick={onGuestAccess} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                 Continue as Guest
                             </button>
                             <span>•</span>
                             <button onClick={() => setShowConfig(true)} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
                                 <Settings size={12} /> Configure Server
                             </button>
                        </div>
                    </div>
                </div>
                
                <p className="text-center text-xs text-slate-400 mt-8">
                    &copy; {new Date().getFullYear()} FocusFlow. Sync your life anywhere.
                </p>
            </div>
        </div>
    );
};
