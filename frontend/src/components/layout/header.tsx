'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileNav } from './mobile-nav';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Keyboard shortcut for search (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cases?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          {/* Mobile Navigation */}
          <MobileNav />

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center w-full h-10 px-3 py-2 text-sm text-muted-foreground bg-muted/50 border rounded-lg hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left">Search cases...</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
          </div>

          {/* Search Button - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
              {/* Notification dot */}
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch}>
            <div className="flex items-center border-b px-4">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                placeholder="Search cases by name, client, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-14 px-4 text-base bg-transparent border-0 outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground">
                ESC
              </kbd>
            </div>
          </form>
          <div className="max-h-96 overflow-y-auto p-2">
            {searchQuery ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>Press Enter to search for &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>Start typing to search cases...</p>
                <p className="mt-2 text-xs">
                  Search by case name, client name, or status
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
