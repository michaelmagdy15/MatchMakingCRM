import React, { useState, useEffect } from 'react';
import { useAppContext } from './context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Building2, Users, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import UsersManagement from './Users';

export default function Settings() {
  const { branding, updateBranding, currentUser, wipeSystem, canAccessSettings } = useAppContext();
  const [companyName, setCompanyName] = useState(branding.companyName);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isWipeDialogOpen, setIsWipeDialogOpen] = useState(false);
  const [wipeStep, setWipeStep] = useState(1);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  const canWipe = canAccessSettings || currentUser?.email === 'michaelmitry13@gmail.com';

  useEffect(() => {
    setCompanyName(branding.companyName);
    setLogoUrl(branding.logoUrl);
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBranding({ companyName, logoUrl });
    } finally {
      setIsSaving(false);
    }
  };

  if (!canAccessSettings) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 text-white">
        <ShieldAlert className="h-16 w-16 text-destructive opacity-25" />
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="text-zinc-400 max-w-md">
          This section is exclusively managed by system administrators. 
          Please contact Youssef (Manager) for permission requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-zinc-900/30 backdrop-blur-lg border border-white/10 p-1 rounded-xl shadow-lg shadow-black/30">
          <TabsTrigger value="branding" className="flex items-center gap-2 px-4 py-2 font-semibold">
            <Building2 className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 px-4 py-2 font-semibold">
            <Users className="h-4 w-4" />
            Matchmaker Permissions
          </TabsTrigger>
          {canWipe && (
            <TabsTrigger value="danger" className="flex items-center gap-2 text-rose-500 data-[state=active]:bg-rose-600 data-[state=active]:text-white px-4 py-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          )}
        </TabsList>

        {/* Branding Configurations */}
        <TabsContent value="branding" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="bg-gradient-to-br from-zinc-900/40 via-zinc-950/20 to-zinc-900/40 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl max-w-xl shadow-black/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-pink-400" />
                CRM Branding Customize
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Customize your CRM's appearance with your brand name and logo asset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-zinc-400">Company / Brand Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter brand name"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl" className="text-zinc-400">Logo Asset URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-zinc-900 border-zinc-800"
                />
                <p className="text-xs text-zinc-500">
                  Provide a direct image URL. Transparent PNGs with high contrast are recommended.
                </p>
              </div>

              {logoUrl && (
                <div className="mt-4 p-4 border border-white/5 rounded-xl bg-zinc-900/40 flex flex-col items-center justify-center space-y-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Logo Preview</span>
                  <img 
                    src={logoUrl} 
                    alt="Logo Preview" 
                    className="max-h-12 object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <Button 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 border-none font-bold text-white hover:opacity-90 h-10 mt-2" 
                onClick={handleSave} 
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Brand Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matchmaker Users Administration */}
        <TabsContent value="users" className="animate-in fade-in-50 duration-500">
          <UsersManagement />
        </TabsContent>

        {/* Reset System Danger Zone */}
        {canWipe && (
          <TabsContent value="danger" className="animate-in fade-in-50 duration-500">
            <Card className="border-rose-500/20 bg-rose-950/10 shadow-2xl rounded-2xl max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-500 font-bold">
                  <ShieldAlert className="h-5 w-5" />
                  CRM Reset Area
                </CardTitle>
                <CardDescription className="text-rose-400 font-semibold">
                  Highly destructive options. Irreversible database changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-rose-500/20 rounded-xl bg-zinc-950/30 backdrop-blur-md space-y-3">
                  <h4 className="font-bold text-rose-400 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Wipe Candidate & Match Records
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Permanently delete all Candidates, Matches, Interaction logs, Comments, and Tasks. 
                    Administrators, Roles, and Branding settings are fully preserved.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="font-bold bg-rose-600 hover:bg-rose-700 h-9"
                    onClick={() => {
                      setWipeStep(1);
                      setIsWipeDialogOpen(true);
                    }}
                  >
                    Reset CRM Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Wipe Database Dialog triggers */}
      <Dialog open={isWipeDialogOpen} onOpenChange={setIsWipeDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-900/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl shadow-black/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500 font-bold">
              <AlertTriangle className="h-5 w-5" />
              {wipeStep === 1 ? 'Verify CRM Reset' : 'Final Step Reset'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              {wipeStep === 1 
                ? 'Are you completely sure you want to wipe all records? This action is absolutely permanent.' 
                : 'To confirm system deletion, type "RESET SYSTEM" exactly in the box below.'}
            </DialogDescription>
          </DialogHeader>
          
          {wipeStep === 2 && (
            <div className="py-4">
              <Input 
                value={wipeConfirmText} 
                onChange={(e) => setWipeConfirmText(e.target.value.toUpperCase())}
                placeholder="RESET SYSTEM"
                className="font-mono text-center tracking-widest bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsWipeDialogOpen(false)} disabled={isWiping} className="border-white/10 text-white hover:bg-zinc-900">
              Cancel
            </Button>
            {wipeStep === 1 ? (
              <Button variant="destructive" onClick={() => setWipeStep(2)} className="bg-rose-600 hover:bg-rose-700">
                Continue Reset
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                disabled={wipeConfirmText !== 'RESET SYSTEM' || isWiping}
                onClick={async () => {
                  setIsWiping(true);
                  try {
                    await wipeSystem();
                    setIsWipeDialogOpen(false);
                    window.location.reload(); 
                  } catch (e) {
                    alert("Reset failed: " + (e as Error).message);
                    setIsWiping(false);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {isWiping ? 'Resetting...' : 'Wipe Database Content'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
