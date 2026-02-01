'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  /** Optional custom items to override auto-generation */
  items?: BreadcrumbItem[];
  /** Show home icon */
  showHome?: boolean;
  /** Custom class name */
  className?: string;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  cases: 'Cases',
  new: 'New Case',
  settings: 'Settings',
  help: 'Help',
  documents: 'Documents',
  generate: 'Generate Letter',
  edit: 'Edit',
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Check if it's a dynamic segment (like a case ID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    const isNumericId = /^\d+$/.test(segment);

    let label = routeLabels[segment] || segment;

    if (isUuid || isNumericId) {
      // For case IDs, show a truncated version or "Case Details"
      label = 'Case Details';
    }

    items.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: isLast ? undefined : currentPath,
    });
  });

  return items;
}

export function Breadcrumbs({
  items: customItems,
  showHome = true,
  className,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const items = customItems || generateBreadcrumbs(pathname);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center gap-1.5">
        {showHome && (
          <>
            <li>
              <Link
                href="/dashboard"
                className="flex items-center hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4" />
            </li>
          </>
        )}
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
