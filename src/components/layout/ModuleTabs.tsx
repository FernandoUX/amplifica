"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type TabDef = {
  label: string;
  shortLabel?: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};

type ModuleTabsProps = {
  tabs: TabDef[];
};

export default function ModuleTabs({ tabs }: ModuleTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-neutral-200 overflow-x-auto overflow-y-hidden scrollbar-hide">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || (tab.href !== tabs[0]?.href && pathname.startsWith(tab.href + "/"));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-300 whitespace-nowrap flex-shrink-0 ${
              isActive
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 ${isActive ? "text-primary-500" : "text-neutral-600"}`} />}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.shortLabel && <span className="sm:hidden">{tab.shortLabel}</span>}
            {!tab.shortLabel && <span className="sm:hidden">{tab.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}
