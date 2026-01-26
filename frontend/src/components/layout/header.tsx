'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center flex-1">
          <div className="max-w-md w-full lg:max-w-xs">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search cases..."
                type="search"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" />
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
