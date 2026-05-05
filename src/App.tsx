/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { SimpleStudio } from './components/SimpleStudio';
import { PortfolioPreview } from './components/preview/PortfolioPreview';
import { ResumePreview } from './components/preview/ResumePreview';
import { AppLanguage, Project, PublishedPortfolio, User } from './types';
import { cn } from './lib/utils';
import { LANGUAGE_LABELS } from './lib/resume';
import { Download, Eye, FileText, Home } from 'lucide-react';
import { useTelegram } from './hooks/useTelegram';

type AppView = 'studio' | 'portfolio' | 'resume';

type SavedWorkspace = {
  user?: User;
  projects?: Project[];
  selectedTemplate?: string;
  language?: AppLanguage;
  savedAt?: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const STORAGE_KEY = 'devport.workspace.v1';

const NAV_ITEMS: Array<{ id: AppView; label: string; icon: React.ElementType }> = [
  { id: 'studio', label: 'Studio', icon: Home },
  { id: 'portfolio', label: 'Portfolio', icon: Eye },
  { id: 'resume', label: 'CV', icon: FileText },
];

const DEFAULT_USER: User = {
  id: '1',
  fullName: '',
  bio: '',
  experienceSummary: '',
  githubUsername: '',
  socialLinks: {
    linkedin: '',
    twitter: '',
    website: '',
  },
};

const loadSavedWorkspace = (): SavedWorkspace | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedWorkspace;

    return {
      ...parsed,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      language: parsed.language && LANGUAGE_LABELS[parsed.language] ? parsed.language : 'uz',
    };
  } catch {
    return null;
  }
};

export default function App() {
  const { tg, user: tgUser } = useTelegram();
  const savedWorkspace = useMemo(() => loadSavedWorkspace(), []);
  const [view, setView] = useState<AppView>('studio');
  const [selectedTemplate, setSelectedTemplate] = useState(savedWorkspace?.selectedTemplate || 'premium-developer');
  const [language, setLanguage] = useState<AppLanguage>(savedWorkspace?.language || 'uz');
  const publishedSlug = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const match = window.location.pathname.match(/^\/p\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }, []);
  const [publicPortfolio, setPublicPortfolio] = useState<PublishedPortfolio | null>(null);
  const [publicPortfolioState, setPublicPortfolioState] = useState<'loading' | 'ready' | 'missing'>(
    publishedSlug ? 'loading' : 'ready',
  );
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const [user, setUser] = useState<User>(() => ({
    ...DEFAULT_USER,
    ...savedWorkspace?.user,
    socialLinks: {
      ...DEFAULT_USER.socialLinks,
      ...savedWorkspace?.user?.socialLinks,
    },
  }));

  const [projects, setProjects] = useState<Project[]>(savedWorkspace?.projects || []);

  useEffect(() => {
    if (!publishedSlug) return;

    let cancelled = false;
    setPublicPortfolioState('loading');

    fetch(`/api/portfolio/${publishedSlug}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Portfolio not found'))))
      .then((payload) => {
        if (cancelled) return;
        setPublicPortfolio(payload.data);
        setPublicPortfolioState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setPublicPortfolioState('missing');
      });

    return () => {
      cancelled = true;
    };
  }, [publishedSlug]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (tgUser && !savedWorkspace?.user) {
      setUser((prev) => ({
        ...prev,
        fullName: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        githubUsername: tgUser.username || prev.githubUsername,
      }));
    }
  }, [tgUser]);

  useEffect(() => {
    const workspace: SavedWorkspace = {
      user,
      projects,
      selectedTemplate,
      language,
      savedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      const lightweightWorkspace: SavedWorkspace = {
        ...workspace,
        user: user.avatarUrl ? { ...user, avatarUrl: undefined } : user,
        projects: projects.map((project) => ({ ...project, image: undefined })),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightWorkspace));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [language, projects, selectedTemplate, user]);

  useEffect(() => {
    tg.MainButton.hide();
    if (view === 'studio') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }

    const onBack = () => setView('studio');
    tg.onEvent('backButtonClicked', onBack);
    return () => tg.offEvent('backButtonClicked', onBack);
  }, [view, tg]);

  const activeTitle = useMemo(() => {
    if (view === 'portfolio') return 'Portfolio preview';
    if (view === 'resume') return 'CV preview';
    return 'Simple CV studio';
  }, [view]);

  const handleNavigate = (target: AppView) => {
    setView(target);
  };

  const handleResetWorkspace = () => {
    setUser(DEFAULT_USER);
    setProjects([]);
    setSelectedTemplate('premium-developer');
    setLanguage('uz');
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage access can fail in restricted browsers.
    }
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (publishedSlug) {
    if (publicPortfolioState === 'loading') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-950">
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Portfolio yuklanmoqda...</p>
          </div>
        </div>
      );
    }

    if (!publicPortfolio) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-950">
          <div className="max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-950">Portfolio topilmadi</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Link eskirgan yoki hali publish qilinmagan bo'lishi mumkin.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="portfolio-preview-shell bg-white">
        <PortfolioPreview
          user={publicPortfolio.user}
          projects={publicPortfolio.projects}
          templateId={publicPortfolio.templateId}
          language={publicPortfolio.language}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 md:px-6">
          <button onClick={() => handleNavigate('studio')} className="flex min-w-0 items-center gap-3 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              DP
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none text-slate-950">DevPort</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{activeTitle}</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                isActive={view === item.id}
                onClick={() => handleNavigate(item.id)}
              />
            ))}
          </nav>

          <LanguageToggle language={language} onChange={setLanguage} />
        </div>
      </header>

      <main className="pb-28 md:pb-8">
        {view === 'studio' && (
          <SimpleStudio
            user={user}
            setUser={setUser}
            projects={projects}
            onProjectsSynced={(syncedProjects) => setProjects(syncedProjects)}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            language={language}
            onOpenPortfolio={() => handleNavigate('portfolio')}
            onOpenCv={() => handleNavigate('resume')}
            onResetWorkspace={handleResetWorkspace}
          />
        )}

        {view === 'portfolio' && (
          <div className="portfolio-preview-shell bg-white">
            <PortfolioPreview user={user} projects={projects} templateId={selectedTemplate} language={language} />
          </div>
        )}

        {view === 'resume' && (
          <ResumePreview user={user} projects={projects} language={language} />
        )}
      </main>

      {installPrompt && (
        <button
          onClick={handleInstallApp}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-50 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-xl shadow-slate-900/15 md:bottom-8 md:right-8"
        >
          <Download size={15} />
          Install
        </button>
      )}

      <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-3 rounded-lg border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={view === item.id}
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
  item: { id: AppView; label: string; icon: React.ElementType };
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
        compact ? 'h-12 flex-col gap-1 px-1 text-[10px]' : 'h-10 px-3',
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
  <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
    {(Object.keys(LANGUAGE_LABELS) as AppLanguage[]).map((item) => (
      <button
        key={item}
        onClick={() => onChange(item)}
        className={cn(
          'h-8 rounded-md px-2 text-[11px] font-bold transition sm:h-9 sm:px-3 sm:text-xs',
          language === item ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900',
        )}
      >
        {LANGUAGE_LABELS[item]}
      </button>
    ))}
  </div>
);
