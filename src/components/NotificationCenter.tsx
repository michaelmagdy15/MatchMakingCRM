import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Gift, CheckSquare, Clock, User as UserIcon, X, Check, Heart, Image as ImageIcon, Sparkles } from 'lucide-react';
import { differenceInDays, isSameDay, isSameMonth, parseISO, isToday, isBefore, isAfter, startOfDay } from 'date-fns';

export type NotificationType = 
  | 'lead_stale' 
  | 'member_expiring' 
  | 'birthday' 
  | 'task_due'
  | 'match_stalled'
  | 'mutual_text_approved'
  | 'mutual_photo_approved'
  | 'match_success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  date: Date;
  recordName: string;
  recordId: string;
}

export function NotificationCenter() {
  const { clients, matches, tasks, currentUser, setSearchQuery } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load dismissed notifications from localStorage on mount
  useEffect(() => {
    if (currentUser?.id) {
      const stored = localStorage.getItem(`crm_notifications_dismissed_${currentUser.id}`);
      if (stored) {
        try {
          setDismissedIds(new Set(JSON.parse(stored)));
        } catch (e) {
          console.error("Failed to parse dismissed notifications", e);
        }
      }
    }
  }, [currentUser?.id]);

  // Save dismissed notifications to localStorage when changed
  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) return;
    
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(`crm_notifications_dismissed_${currentUser.id}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const dismissAll = () => {
    if (!currentUser?.id) return;
    const allIds = notifications.map(n => n.id);
    setDismissedIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      localStorage.setItem(`crm_notifications_dismissed_${currentUser.id}`, JSON.stringify(Array.from(next)));
      return next;
    });
    setIsOpen(false);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate notifications
  useEffect(() => {
    const today = startOfDay(new Date());
    const generated: AppNotification[] = [];

    // 1. Leads not contacted in 7+ days & Birthdays today
    clients.forEach(client => {
      // Birthdays
      if (client.dateOfBirth) {
        const dob = parseISO(client.dateOfBirth);
        if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
          generated.push({
            id: `bday_${client.id}_${today.getFullYear()}`,
            type: 'birthday',
            title: 'Birthday Today!',
            description: `${client.name} is celebrating their birthday today.`,
            date: today,
            recordName: client.name,
            recordId: client.id
          });
        }
      }

      if (client.status === 'Lead') {
        // Stale leads
        if (client.lastContactDate) {
          const lastContact = parseISO(client.lastContactDate);
          const daysPassed = differenceInDays(today, startOfDay(lastContact));
          if (daysPassed >= 7) {
            generated.push({
              id: `lead_stale_${client.id}_${lastContact.toISOString()}`,
              type: 'lead_stale',
              title: 'Stale Lead',
              description: `${client.name} hasn't been contacted in ${daysPassed} days.`,
              date: lastContact,
              recordName: client.name,
              recordId: client.id
            });
          }
        }
      }
    });

    // 2. Match Progress & Stalling Notifications
    matches.forEach(match => {
      if (match.status === 'UNMATCHED') return;

      const lastUpdate = parseISO(match.updatedAt || match.createdAt);
      const daysSinceUpdate = differenceInDays(today, startOfDay(lastUpdate));

      // Match Stalling (No progress for 2+ days)
      if (daysSinceUpdate >= 2 && match.status !== 'MATCH_ACTIVE' && match.status !== 'PENDING_FEEDBACK') {
        generated.push({
          id: `match_stalled_${match.id}_${match.updatedAt}`,
          type: 'match_stalled',
          title: 'Stalled Match Proposal',
          description: `Match between ${match.gentlemanCode} and ${match.ladyCode} is pending for ${daysSinceUpdate} days.`,
          date: lastUpdate,
          recordName: match.gentlemanCode || 'Gentleman',
          recordId: match.id
        });
      }

      // Mutual Description Approved
      if (match.maleProfileApproved && match.femaleProfileApproved && match.status === 'PENDING_PHOTO_APPROVAL') {
        generated.push({
          id: `mutual_text_${match.id}`,
          type: 'mutual_text_approved',
          title: 'Descriptions Approved!',
          description: `Gentleman ${match.gentlemanCode} and Lady ${match.ladyCode} approved descriptions. Photo swap open.`,
          date: lastUpdate,
          recordName: match.gentlemanCode || 'Gentleman',
          recordId: match.id
        });
      }

      // Mutual Photo Swapped Approved
      if (match.malePhotoApproved && match.femalePhotoApproved && match.status === 'PENDING_CONTACT_SHARE') {
        generated.push({
          id: `mutual_photo_${match.id}`,
          type: 'mutual_photo_approved',
          title: 'Photos Swapped!',
          description: `Gentleman ${match.gentlemanCode} and Lady ${match.ladyCode} approved photos. Ready to share contact info.`,
          date: lastUpdate,
          recordName: match.gentlemanCode || 'Gentleman',
          recordId: match.id
        });
      }

      // Mutual Success Match
      if (match.status === 'MATCH_ACTIVE') {
        generated.push({
          id: `match_success_${match.id}`,
          type: 'match_success',
          title: 'Match Connection Live! 🎉',
          description: `Gentleman ${match.gentlemanCode} and Lady ${match.ladyCode} have exchanged contact details.`,
          date: lastUpdate,
          recordName: match.gentlemanCode || 'Gentleman',
          recordId: match.id
        });
      }
    });

    // 3. Tasks due today or overdue
    tasks.forEach(task => {
      if (task.status !== 'Completed') {
        const dueDate = parseISO(task.dueDate);
        const startOfDue = startOfDay(dueDate);
        
        if (isBefore(startOfDue, today) || isSameDay(startOfDue, today)) {
          const isOverdue = isBefore(startOfDue, today);
          generated.push({
            id: `task_${task.id}_${dueDate.toISOString()}`,
            type: 'task_due',
            title: isOverdue ? 'Overdue Task' : 'Task Due Today',
            description: task.title,
            date: dueDate,
            recordName: task.title,
            recordId: task.id
          });
        }
      }
    });

    // Sort by date (newest first)
    generated.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    setNotifications(generated);
  }, [clients, matches, tasks]);

  const activeNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  const handleNotificationClick = (notification: AppNotification) => {
    setSearchQuery(notification.recordName);
    setIsOpen(false);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'birthday': return <Gift className="h-4 w-4 text-pink-500" />;
      case 'lead_stale': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'task_due': return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case 'match_stalled': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'mutual_text_approved': return <CheckSquare className="h-4 w-4 text-indigo-400" />;
      case 'mutual_photo_approved': return <ImageIcon className="h-4 w-4 text-pink-400" />;
      case 'match_success': return <Heart className="h-4 w-4 text-emerald-400 fill-emerald-500/20 animate-pulse" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {activeNotifications.length > 0 && (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-1 ring-background">
            {activeNotifications.length > 99 ? '99+' : activeNotifications.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-md border bg-card shadow-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {activeNotifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" onClick={dismissAll}>
                Dismiss all <Check className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {activeNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                <Bell className="h-8 w-8 opacity-20 mb-2" />
                <p>You have no new notifications.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className="flex flex-col p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-background p-1.5 shadow-sm border">
                          {getIcon(notification.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none mb-1 flex items-center gap-1.5">
                            {notification.title}
                            {notification.type === 'match_success' && <Sparkles className="h-3 w-3 text-amber-400" />}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 ml-2" 
                        onClick={(e) => dismissNotification(notification.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
