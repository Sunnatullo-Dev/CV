/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { PortfolioPreview } from './components/preview/PortfolioPreview';
import { PortfolioWizard } from './components/wizard/PortfolioWizard';
import { AppLanguage, Project, User } from './types';
import { cn } from './lib/utils';
import { LANGUAGE_LABELS } from './lib/resume';
import { Edit3, Eye, Home, Sparkles } from 'lucide-react';
import { useTelegram } from './hooks/useTelegram';

type AppView = 'dashboard' | 'wizard' | 'preview';

const NAV_ITEMS: Array<{ id: AppView | 'ai'; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Studio', icon: Home },
  { id: 'wizard', label: 'Builder', icon: Edit3 },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'ai', label: 'AI CV', icon: Sparkles },
];

export default function App() {
  const { tg, user: tgUser } = useTelegram();
  const [view, setView] = useState<AppView>('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState('minimalist');
  const [language, setLanguage] = useState<AppLanguage>('uz');
  const [showAiModal, setShowAiModal] = useState(false);

  const [user, setUser] = useState<User>({
    id: '1',
    fullName: 'Samandarov Sunnatulla',
    bio: "Full-stack Developer va Senior Solution Architect. Murakkab biznes jarayonlarini tez, ishonchli va oson kengayadigan raqamli mahsulotlarga aylantirishga ixtisoslashganman.",
    githubUsername: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      website: '',
    },
  });

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (tgUser) {
      setUser((prev) => ({
        ...prev,
        fullName: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        githubUsername: tgUser.username || prev.githubUsername,
      }));
    }
  }, [tgUser]);

  useEffect(() => {
    if (view === 'wizard') {
      tg.MainButton.text = 'SAQLASH VA DAVOM ETISH';
      tg.MainButton.show();
      tg.BackButton.show();
    } else {
      tg.MainButton.hide();
      tg.BackButton.hide();
    }

    const onBack = () => setView('dashboard');
    tg.onEvent('backButtonClicked', onBack);
    return () => tg.offEvent('backButtonClicked', onBack);
  }, [view, tg]);

  const activeTitle = useMemo(() => {
    if (view === 'wizard') return 'Portfolio builder';
    if (view === 'preview') return 'Live preview';
    return 'Professional studio';
  }, [view]);

  const openAiCv = () => {
    setView('wizard');
    setShowAiModal(true);
  };

  const handleNavigate = (target: AppView | 'ai') => {
    if (target === 'ai') {
      openAiCv();
      return;
    }
    setShowAiModal(false);
    setView(target);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-3 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              DP
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-slate-950">DevPort</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{activeTitle}</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                isActive={item.id === 'ai' ? showAiModal : view === item.id}
                onClick={() => handleNavigate(item.id)}
              />
            ))}
          </nav>

          <LanguageToggle language={language} onChange={setLanguage} />
        </div>
      </header>

      <main className="pb-28 md:pb-8">
        {view === 'dashboard' && (
          <Dashboard
            user={user}
            setUser={setUser}
            projectsCount={projects.length}
            onOpenWizard={() => handleNavigate('wizard')}
            onOpenPreview={() => handleNavigate('preview')}
            onOpenAi={openAiCv}
          />
        )}

        {view === 'wizard' && (
          <PortfolioWizard
            user={user}
            setUser={setUser}
            projects={projects}
            onProjectsSynced={(syncedProjects) => setProjects(syncedProjects)}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            language={language}
            isAiModalOpen={showAiModal}
            onAiModalClose={() => setShowAiModal(false)}
          />
        )}

        {view === 'preview' && (
          <div className="bg-white">
            <PortfolioPreview user={user} projects={projects} templateId={selectedTemplate} language={language} />
          </div>
        )}
      </main>

      <nav className="fixed inset-x-4 bottom-4 z-50 grid grid-cols-4 rounded-lg border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={item.id === 'ai' ? showAiModal : view === item.id}
            onClick={() => handleNavigate(item.id)}
            compact
          />
        ))}
      </nav>
    </div>
  );
}

const NavButton = ({
  item,
  isActive,
  onClick,
  compact = false,
}: {
  item: { id: AppView | 'ai'; label: string; icon: React.ElementType };
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
}) => {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex min-w-0 items-center justify-center gap-2 rounded-md text-sm font-semibold transition',
        compact ? 'h-12 flex-col gap-1 px-2 text-[11px]' : 'h-10 px-3',
        isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950',
      )}
    >
      <Icon size={compact ? 18 : 16} />
      <span className="truncate">{item.label}</span>
    </button>
  );
};

const LanguageToggle = ({
  language,
  onChange,
}: {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}) => (
  <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex">
    {(Object.keys(LANGUAGE_LABELS) as AppLanguage[]).map((item) => (
      <button
        key={item}
        onClick={() => onChange(item)}
        className={cn(
          'h-9 rounded-md px-3 text-xs font-bold transition',
          language === item ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900',
        )}
      >
        {LANGUAGE_LABELS[item]}
      </button>
    ))}
  </div>
);
