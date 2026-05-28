import React, { useState } from 'react';
import { useAppContext } from './context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Heart, Lock, AlertCircle } from 'lucide-react';
import { isFirebaseConfigured } from './firebase';

export default function Login() {
  const { login, changePassword, isAuthReady } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mustReset, setMustReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await login(email, password);
      if (res && res.mustChange) {
        setMustReset(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please verify.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await changePassword(email, newPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
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
          GUC Matchmaking
        </h1>
        <p className="text-sm font-medium text-zinc-400 mt-2 tracking-widest uppercase">
          Matchmaking & Dating Platform
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800/80">
          <span className={`h-2 w-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'} animate-ping`} />
          <span className="text-zinc-300">
            {isFirebaseConfigured ? 'Live Firestore Database Connected' : 'Local Sandbox Mode (Safe)'}
          </span>
        </div>
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-md border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md shadow-2xl text-white rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            {mustReset ? 'Secure Password Reset' : 'Admin Portal Access'}
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs px-4">
            {mustReset 
              ? 'This is your first login. To secure your account, you must choose a new personalized password before proceeding.'
              : 'Sign in with your pre-authorized matchmaker staff credentials to manage candidates.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 px-6 pb-6">

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-2xl flex items-start gap-2 text-xs leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {mustReset ? (
            /* Force Reset Password Form */
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-500">Email Account</label>
                  <Input
                    type="email"
                    className="bg-zinc-900 border-zinc-800 text-zinc-400 placeholder-zinc-650 h-11 rounded-xl cursor-not-allowed"
                    value={email}
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Choose New Password</label>
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-pink-500 h-11 rounded-xl"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="Re-enter your password"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-pink-500 h-11 rounded-xl"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full h-11 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-none shadow-lg shadow-pink-500/10 transition-all rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'Saving secure hash...' : (
                  <>
                    <Lock className="h-4 w-4" /> Save Password & Sign In
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Secure Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Staff Email</label>
                  <Input
                    type="email"
                    placeholder="e.g. Eman.matchhub@gmail.com"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-pink-500 h-11 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your account password"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-pink-500 h-11 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-11 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-none shadow-lg shadow-pink-500/10 transition-all rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'Authenticating credentials...' : 'Sign In as Staff'}
              </Button>
            </form>
          )}

        </CardContent>
      </Card>
      
      <p className="text-zinc-400 text-xs mt-6 flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-zinc-400" /> Security-locked system. Data accesses are strictly logged.
      </p>
    </div>
  );
}
