import React from 'react';
import { QUERY_TAB_OPTIONS } from '../data/mockData';
import { QueryTabKey } from '../types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Clock,
  Building2,
  Award,
  BarChart3,
  BookOpen,
} from 'lucide-react';

interface QueryTabsProps {
  activeTab: QueryTabKey;
  onSelectTab?: (tabKey: QueryTabKey) => void;
  resultCount: number;
}

export const QueryTabs: React.FC<QueryTabsProps> = ({
  activeTab,
  resultCount,
}) => {
  const activeOption = QUERY_TAB_OPTIONS.find((opt) => opt.key === activeTab) || QUERY_TAB_OPTIONS[0];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Clock':
        return <Clock className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Award':
        return <Award className="w-5 h-5" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  return (
    <div id="query-tabs-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mb-6">
      {/* Active Module Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            {getIcon(activeOption.iconName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-wide">
                {activeOption.label}
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                {resultCount} Kayıt
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {activeOption.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
