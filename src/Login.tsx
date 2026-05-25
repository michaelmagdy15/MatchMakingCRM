import React, { useState } from 'react';
import { useAppContext } from './context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Heart, User, ChevronRight } from 'lucide-react';
import { isFirebaseConfigured } from './firebase';

export default function Login() {
  const { login, isAuthReady } = useAppContext();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setLoading(true);
    try {
      await login(customEmail, customName || customEmail.split('@')[0], 'rep');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, name: string, role: 'crm_admin' | 'manager' | 'rep') => {
    setLoading(true);
    try {
      await login(email, name, role);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-950 via-zinc-950 to-black text-white flex flex-col items-center justify-center p-4">
      
      {/* Branding Header */}
      <div className="mb-8 text-center flex flex-col items-center animate-in fade-in slide-in-from-top-10 duration-700">
        <div className="h-16 w-16 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-xl shadow-pink-500/20 mb-4 rotate-3">
          <Heart className="h-9 w-9 text-white fill-white animate-pulse" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
          PureMatch CRM
        </h1>
        <p className="text-sm font-medium text-zinc-400 mt-2 tracking-widest uppercase">
          Matchmaking & Dating Admin Dashboard
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800/80">
          <span className={`h-2 w-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'} animate-ping`} />
          <span className="text-zinc-300">
            {isFirebaseConfigured ? 'Live Firestore Database Connected' : 'Local Sandbox Mode (Safe)'}
          </span>
        </div>
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-lg border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md shadow-2xl text-white">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            Admin Portal Access
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Sign in as one of the pre-authorized matchmakers or enter a custom account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          
          {/* Quick Sign-In Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 text-center">
              Quick Authorized Access
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                disabled={loading}
                onClick={() => handleQuickLogin('sarah@datingcrm.com', 'Sarah', 'crm_admin')}
                className="group relative flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-pink-500/50 hover:bg-pink-950/10 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white">Matchmaker Sarah</h4>
                    <p className="text-xs text-zinc-500">CRM Admin / Supervisor</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleQuickLogin('youssef@datingcrm.com', 'Youssef', 'manager')}
                className="group relative flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-rose-500/50 hover:bg-rose-950/10 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white">Matchmaker Youssef</h4>
                    <p className="text-xs text-zinc-500">CRM Operations Manager</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-zinc-600 text-xs font-semibold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Custom Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Custom Matchmaker Sign-In
              </h3>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email (e.g. rep@datingcrm.com)"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-pink-500 h-11"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <Input
                  type="text"
                  placeholder="Enter your name (Optional)"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-pink-500 h-11"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !customEmail}
              className="w-full h-11 text-sm font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-none shadow-lg shadow-pink-500/10 transition-all"
            >
              {loading ? 'Authenticating...' : 'Sign In as Staff'}
            </Button>
          </form>

        </CardContent>
      </Card>
      
      <p className="text-zinc-600 text-xs mt-6 flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-zinc-500" /> Security-locked system. Data accesses are strictly logged.
      </p>
    </div>
  );
}
