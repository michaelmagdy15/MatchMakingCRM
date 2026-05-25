/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useAppContext } from './context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import Clients from './Clients';
import AuditLogs from './AuditLogs';
import Tasks from './Tasks';
import Settings from './Settings';
import Login from './Login';
import Reports from './Reports';
import Portal from './Portal';
import { 
  Activity, 
  Users, 
  UserPlus, 
  CreditCard, 
  LogOut, 
  Calendar as CalendarIcon, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Package, 
  Search, 
  Scan, 
  History, 
  BarChart3, 
  Sun, 
  Moon,
  MoreHorizontal,
  ChevronRight,
  Menu,
  X,
  User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from './components/NotificationCenter';

function AppContent() {
  const { currentUser, logout, isAuthReady, previewRole, setPreviewRole, searchQuery, setSearchQuery, branding, canAccessSettings, canViewGlobalDashboard, canDeletePayments, isManagerOrAdmin } = useAppContext();

  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('crm-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [showProfileDrawer, setShowProfileDrawer] = React.useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = React.useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = React.useState(false);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('crm-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPortal = window.location.pathname.startsWith('/portal');
  if (isPortal) {
    return <Portal />;
  }

  if (!currentUser) {
    return <Login />;
  }

  // Filtered navigation list based on permissions
  const navigationItems = [
    { value: 'dashboard', label: 'Match Control', icon: Activity },
    { value: 'clients', label: 'Profiles Directory', icon: Users },
    ...(currentUser.role !== 'admin' ? [
      { value: 'tasks', label: 'Match Progress', icon: CheckSquare }
    ] : []),
    ...(isManagerOrAdmin ? [
      { value: 'reports', label: 'Match Reports', icon: BarChart3 }
    ] : []),
    ...(canAccessSettings ? [
      { value: 'audit', label: 'Audit Logs', icon: History },
      { value: 'settings', label: 'System Settings', icon: SettingsIcon }
    ] : [])
  ];

  const hasOverflow = navigationItems.length > 5;
  const primaryItems = hasOverflow ? navigationItems.slice(0, 4) : navigationItems;
  const overflowItems = hasOverflow ? navigationItems.slice(4) : [];

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[oklch(0.98_0.01_250)] via-[oklch(0.96_0.01_220)] to-[oklch(0.97_0.02_280)] dark:from-[oklch(0.12_0.02_250)] dark:via-[oklch(0.08_0.01_220)] dark:to-[oklch(0.14_0.03_280)] text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* Sleek collapsible glassmorphic header */}
      <header className="border-b border-black/5 dark:border-white/5 bg-card/75 backdrop-blur-xl shadow-sm sticky top-0 z-40 transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={branding.companyName} 
                  className="h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <h1 className="text-xl sm:text-2xl font-extralight tracking-[0.2em] uppercase text-primary font-logo">
                  {branding.companyName}
                </h1>
              )}
            </div>
            
            {/* Inline search bar hidden on mobile */}
            <div className="hidden md:flex relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, phone, or ID..."
                className="w-full pl-9 bg-muted/50 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Desktop-only Role Preview select */}
            {currentUser.email === "michaelmitry13@gmail.com" && (
              <div className="hidden md:flex items-center space-x-2 h-8">
                <Select 
                  value={previewRole || "none"} 
                  onValueChange={(v) => setPreviewRole(v === "none" ? null : v as any)}
                >
                  <SelectTrigger className={`h-8 w-[150px] text-xs ${previewRole ? 'border-amber-500 text-amber-600 font-medium' : ''}`}>
                    <div className="flex items-center">
                       {previewRole ? <Eye className="h-3.5 w-3.5 mr-2" /> : <EyeOff className="h-3.5 w-3.5 mr-2" />}
                       <SelectValue placeholder="Preview Role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Exit Preview</SelectItem>
                    <SelectItem value="crm_admin">CRM Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="rep">Sales Rep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
            {/* Mobile Search Toggle */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileSearchVisible(!mobileSearchVisible)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Theme Toggle - Desktop only inside header */}
            <div className="hidden md:block">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-amber-400" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-400" />
                )}
              </Button>
            </div>

            <NotificationCenter />

            {/* Desktop User Info & Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground flex flex-col items-end">
                <span className="font-bold text-foreground truncate max-w-[120px] sm:max-w-none">{currentUser.name}</span>
                <span className={`text-[10px] sm:text-xs uppercase tracking-wider ${previewRole ? 'text-amber-500 font-bold' : ''}`}>
                  {previewRole ? `PREVIEW: ${previewRole}` : currentUser.role}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="h-10 w-10">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile User Profile Menu Button - Collapses user controls elegantly */}
            <div className="md:hidden">
              <button 
                onClick={() => setShowProfileDrawer(true)} 
                className="flex items-center justify-center rounded-full bg-muted border border-border w-8 h-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="User profile menu"
              >
                <User className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search input panel */}
      {mobileSearchVisible && (
        <div className="md:hidden bg-card/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 p-3 sticky top-16 z-30 animate-in slide-in-from-top-4 duration-200">
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, phone, or ID..."
              className="w-full pl-9 bg-muted/50 border-none rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile Glassmorphic Profile Drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200" onClick={() => setShowProfileDrawer(false)} />
      )}
      <div className={`fixed inset-y-0 right-0 z-50 w-80 max-w-full bg-card/95 backdrop-blur-2xl border-l border-black/10 dark:border-white/10 shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:hidden ${showProfileDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">My Profile</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowProfileDrawer(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* User Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 bg-muted/40 p-4 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-foreground truncate">{currentUser.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Assigned Role:</span>
                <Badge variant="outline" className="uppercase tracking-wider font-semibold text-[10px]">
                  {currentUser.role}
                </Badge>
              </div>
              
              {previewRole && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Active Preview:</span>
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase tracking-wider font-semibold text-[10px]">
                    {previewRole}
                  </Badge>
                </div>
              )}
            </div>

            {/* Mobile-only Role Preview select */}
            {currentUser.email === "michaelmitry13@gmail.com" && (
              <div className="space-y-1.5 pt-4 border-t border-black/5 dark:border-white/5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role Preview Selector</label>
                <Select 
                  value={previewRole || "none"} 
                  onValueChange={(v) => {
                    setPreviewRole(v === "none" ? null : v as any);
                    setShowProfileDrawer(false);
                  }}
                >
                  <SelectTrigger className={`w-full text-xs h-10 ${previewRole ? 'border-amber-500 text-amber-600 font-medium' : ''}`}>
                    <div className="flex items-center">
                       {previewRole ? <Eye className="h-3.5 w-3.5 mr-2" /> : <EyeOff className="h-3.5 w-3.5 mr-2" />}
                       <SelectValue placeholder="Preview Role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="none">Exit Preview</SelectItem>
                    <SelectItem value="crm_admin">CRM Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="rep">Sales Rep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mobile Theme Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5 text-xs">
              <span className="text-muted-foreground">Color Mode:</span>
              <Button 
                variant="outline" 
                onClick={toggleTheme} 
                className="h-9 px-3 text-xs flex items-center gap-2 rounded-xl"
              >
                {theme === 'dark' ? (
                  <><Sun className="h-4 w-4 text-amber-400" /> Light Mode</>
                ) : (
                  <><Moon className="h-4 w-4 text-indigo-400" /> Dark Mode</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Logout Button */}
        <Button 
          variant="destructive" 
          onClick={() => {
            logout();
            setShowProfileDrawer(false);
          }} 
          className="w-full h-10 font-bold rounded-xl flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 pb-24 md:pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          {/* Desktop Navigation Tab Bar */}
          <div className="hidden md:block overflow-x-auto pb-2 no-scrollbar">
            <TabsList className="flex w-max sm:w-full bg-muted/50 rounded-lg p-1 justify-start sm:justify-center">
              {navigationItems.map(item => (
                <TabsTrigger 
                  key={item.value} 
                  value={item.value} 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 text-xs sm:text-sm flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="m-0 animate-in fade-in-50 duration-500">
            <Dashboard />
          </TabsContent>

          <TabsContent value="clients" className="m-0 animate-in fade-in-50 duration-500">
            <Clients />
          </TabsContent>

          {currentUser.role !== 'admin' && (
            <TabsContent value="tasks" className="m-0 animate-in fade-in-50 duration-500">
              <Tasks />
            </TabsContent>
          )}

          {isManagerOrAdmin && (
            <TabsContent value="reports" className="m-0 animate-in fade-in-50 duration-500">
              <Reports />
            </TabsContent>
          )}

          {canAccessSettings && (
            <>
              <TabsContent value="audit" className="m-0 animate-in fade-in-50 duration-500">
                <AuditLogs />
              </TabsContent>
              <TabsContent value="settings" className="m-0 animate-in fade-in-50 duration-500">
                <Settings />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      {/* Gorgeous Glassmorphic Mobile Bottom Dock */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto">
        <div className="bg-card/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl p-2.5 flex justify-around items-center">
          {primaryItems.map(item => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label.split(' ')[0]}</span>
                {isActive && (
                  <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}

          {hasOverflow && (
            <button
              onClick={() => setShowMoreDrawer(true)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                overflowItems.some(item => item.value === activeTab) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">More</span>
              {overflowItems.some(item => item.value === activeTab) && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile More Options Slide-Up Drawer */}
      {showMoreDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200" onClick={() => setShowMoreDrawer(false)} />
      )}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-black/10 dark:border-white/10 rounded-t-3xl p-6 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${showMoreDrawer ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">More Pages</h3>
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
          {overflowItems.map(item => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => {
                  setActiveTab(item.value);
                  setShowMoreDrawer(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-primary/10 border-primary/20 text-primary font-bold shadow-sm'
                    : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
