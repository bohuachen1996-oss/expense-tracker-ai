'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/expenses/add', label: 'Add Expense', icon: PlusCircle },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200 px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 mb-8">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">Expensify</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname === '/'
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
        <p className="text-xs font-medium text-indigo-700">Expense Tracker</p>
        <p className="text-xs text-indigo-500 mt-0.5">Data stored locally</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar for mobile */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">Expensify</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-64 bg-white h-full flex flex-col px-4 py-6 shadow-xl">
            <div className="flex items-center justify-between px-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={14} className="text-white" />
                </div>
                <span className="font-bold text-gray-900">Expensify</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  active={
                    item.href === '/dashboard'
                      ? pathname === '/dashboard' || pathname === '/'
                      : pathname.startsWith(item.href)
                  }
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom nav for mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
