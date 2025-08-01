"use client";

import React, { useState } from "react";
import { Sidebar, TopBar } from "@/components/ui/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area - always takes full width on mobile, offset by sidebar on desktop */}
      <div className="min-h-screen lg:pl-64 transition-all duration-200">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
