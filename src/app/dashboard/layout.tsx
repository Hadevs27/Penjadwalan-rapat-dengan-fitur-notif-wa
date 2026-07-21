"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, 
  LogOut, 
  Menu, 
  Settings, 
  Users, 
  Building2,
  X,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Sliders
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full"
        />
      </div>
    );
  }

  const isAdmin = session.user.role === 'admin';

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Data Rapat', href: '/dashboard/meetings', icon: Calendar },
    { name: 'Manajemen Ruangan', href: '/dashboard/rooms', icon: Building2, adminOnly: true },
    { name: 'Manajemen Pegawai', href: '/dashboard/users', icon: Users, adminOnly: true },
    { name: 'Pengaturan Profil', href: '/dashboard/profile', icon: Settings },
    { name: 'Pengaturan Sistem', href: '/dashboard/settings', icon: Sliders, adminOnly: true },
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-all duration-300 transform ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 md:static md:inset-0 print:hidden`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white font-heading">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="tracking-wide">BAPENDA</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="block relative group">
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-brand-600 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100 group-hover:bg-slate-800/50'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:w-full print:block">
        {/* Header */}
        <header className="h-16 glass-panel z-30 sticky top-0 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200/50 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold font-heading heading-gradient hidden sm:block">
              Sistem Penjadwalan Rapat
            </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 rounded-full text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors relative group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:border-brand-50 transition-colors"></span>
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-1 sm:mx-2"></div>
            
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-100 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold uppercase shadow-sm">
                  {(session.user?.name || "U").charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{session.user?.name || "User"}</p>
                  <p className="text-xs text-slate-500 font-medium">{session.user?.role === 'admin' ? 'Super Admin' : session.user?.bidang}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 origin-top-right"
                  >
                    <div className="px-4 py-2 border-b border-slate-50 mb-2 md:hidden">
                      <p className="text-sm font-semibold text-slate-800">{session.user?.name}</p>
                      <p className="text-xs text-slate-500">{session.user?.role === 'admin' ? 'Super Admin' : session.user?.bidang}</p>
                    </div>
                    
                    <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                      <Settings className="w-4 h-4" />
                      Pengaturan Akun
                    </Link>
                    <button 
                      onClick={() => signOut()} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
