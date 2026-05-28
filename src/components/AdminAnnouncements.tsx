import React, { useState } from 'react';
import { useAppContext } from '../context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Trash2, Megaphone, Calendar, User } from 'lucide-react';

export default function AdminAnnouncements() {
  const { announcements, addAnnouncement, deleteAnnouncement, currentUser } = useAppContext();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await addAnnouncement(title.trim(), content.trim());
      setTitle('');
      setContent('');
      alert('Announcement broadcasted successfully to all GUC candidates!');
    } catch (error) {
      alert('Failed to publish announcement: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-pink-500" /> Announcements Broadcast
          </h2>
          <p className="text-sm text-zinc-400">
            Publish global announcements, instructions, or match rules directly to all candidate dashboards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Broadcast Form */}
        <Card className="bg-zinc-950 border-zinc-800/80 text-white md:col-span-1 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-pink-400">
              <Sparkles className="h-4.5 w-4.5" /> New Broadcast
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Write a message to show at the top of the GUC Client Portal feed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">Announcement Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Round 2 Approvals Underway!"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">Content Message</Label>
                <Textarea
                  id="content"
                  placeholder="Type your global broadcast message here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs rounded-xl min-h-[140px]"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 shadow-lg font-semibold hover:from-pink-600 hover:to-purple-700"
              >
                {isSubmitting ? 'Broadcasting...' : 'Publish Announcement'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Announcements */}
        <Card className="bg-zinc-950 border-zinc-800/80 text-white md:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-zinc-200">
              Broadcast History ({announcements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-2 border border-dashed border-zinc-800 rounded-2xl">
                <Megaphone className="h-8 w-8 text-zinc-700" />
                <p className="text-sm font-semibold text-zinc-400">No Active Broadcasts</p>
                <p className="text-xs text-zinc-500">Global announcements you publish will be listed here.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {announcements.map(ann => (
                  <div
                    key={ann.id}
                    className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-3 relative group hover:border-zinc-800/80 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-pink-400">{ann.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> By {ann.createdByName || 'Staff'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Megaphone className="h-3 w-3" /> {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this announcement? It will immediately disappear from the Client Portal.')) {
                            deleteAnnouncement(ann.id);
                          }
                        }}
                        className="h-8 w-8 text-zinc-550 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
