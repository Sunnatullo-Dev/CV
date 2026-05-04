import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Github,
  Layout,
  Link2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from './shared/Button';
import { User } from '../types';

interface DashboardProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  projectsCount: number;
  onOpenWizard: () => void;
  onOpenPreview: () => void;
  onOpenAi: () => void;
}

interface GithubStats {
  followers: number;
  public_repos: number;
  public_gists: number;
  following: number;
}

export const Dashboard = ({
  user,
  setUser,
  projectsCount,
  onOpenWizard,
  onOpenPreview,
  onOpenAi,
}: DashboardProps) => {
  const [githubStats, setGithubStats] = useState<GithubStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isEditingGithub, setIsEditingGithub] = useState(false);
  const [tempGithub, setTempGithub] = useState(user.githubUsername || '');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    setTempGithub(user.githubUsername || '');
  }, [user.githubUsername]);

  useEffect(() => {
    if (!user.githubUsername) {
      setGithubStats(null);
      return;
    }

    let cancelled = false;
    setIsLoadingStats(true);

    fetch(`https://api.github.com/users/${user.githubUsername}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('GitHub user not found'))))
      .then((data) => {
        if (cancelled) return;
        setGithubStats({
          followers: data.followers,
          public_repos: data.public_repos,
          public_gists: data.public_gists,
          following: data.following,
        });
      })
      .catch((err) => {
        console.error('Error fetching github stats:', err);
        if (!cancelled) setGithubStats(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user.githubUsername]);

  const portfolioUrl = `devport.uz/${user.githubUsername || 'username'}`;
  const firstName = user.fullName.trim().split(/\s+/)[0] || 'Developer';
  const hasSocialLink = Boolean(
    user.socialLinks?.linkedin || user.socialLinks?.twitter || user.socialLinks?.website,
  );

  const readinessItems = useMemo(
    () => [
      { label: 'Profil nomi', done: user.fullName.trim().length > 2 },
      { label: 'Kuchli bio', done: user.bio.trim().length >= 80 },
      { label: 'GitHub ulangan', done: Boolean(user.githubUsername) },
      { label: 'Loyihalar import qilingan', done: projectsCount > 0 },
      { label: 'Aloqa linklari', done: hasSocialLink },
    ],
    [hasSocialLink, projectsCount, user.bio, user.fullName, user.githubUsername],
  );

  const completedCount = readinessItems.filter((item) => item.done).length;
  const readinessScore = Math.round((completedCount / readinessItems.length) * 100);

  const saveGithubUsername = () => {
    const username = tempGithub.trim().replace(/^@/, '');
    setUser((prev) => ({ ...prev, githubUsername: username }));
    setIsEditingGithub(false);
  };

  const copyPortfolioUrl = async () => {
    await navigator.clipboard.writeText(portfolioUrl);
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1800);
  };

  const stats = [
    {
      label: 'Tayyorlik',
      value: `${readinessScore}%`,
      icon: ShieldCheck,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Loyihalar',
      value: projectsCount,
      icon: BookOpen,
      tone: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    {
      label: 'Profil views',
      value: '1.2k',
      icon: BarChart3,
      tone: 'text-amber-700 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <section className="grid min-w-0 gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-900 text-2xl font-bold text-white shadow-sm">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  user.fullName?.[0] || 'D'
                )}
              </div>
              <div className="min-w-0">
                <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} />
                  Portfolio studio
                </p>
                <h1 className="break-words text-2xl font-semibold tracking-normal text-slate-950 md:text-4xl">
                  Salom, {firstName}. Profilni ish beruvchi ko'zi bilan tayyorlaymiz.
                </h1>
                <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-600 md:text-base">
                  Har bir bo'lim aniq natija, ishonchli link va tartibli vizual ko'rinishga xizmat qilishi kerak.
                  Quyidagi tayyorlik paneli qaysi nuqtalar hali kuchayishi kerakligini ko'rsatadi.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button
                onClick={onOpenWizard}
                className="h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Edit3 className="mr-2" size={16} />
                Tahrirlash
              </Button>
              <Button
                variant="outline"
                onClick={onOpenPreview}
                className="h-11 rounded-lg border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="mr-2" size={16} />
                Preview
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md border ${item.tone}`}>
                    <Icon size={18} />
                  </div>
                  <div className="text-2xl font-semibold tracking-normal text-slate-950">{item.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Tayyorlik nazorati</h2>
              <p className="mt-1 text-sm text-slate-500">{completedCount} / {readinessItems.length} bo'lim yakunlangan</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900">
              {readinessScore}%
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${readinessScore}%` }} />
          </div>

          <div className="mt-5 space-y-3">
            {readinessItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className={item.done ? 'font-medium text-slate-800' : 'text-slate-500'}>{item.label}</span>
                <span
                  className={
                    item.done
                      ? 'inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700'
                      : 'inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500'
                  }
                >
                  {item.done ? <CheckCircle2 size={13} /> : <TrendingUp size={13} />}
                  {item.done ? 'Tayyor' : 'Kerak'}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">GitHub signali</h2>
              <p className="mt-1 text-sm text-slate-500">Repo va ijtimoiy isbotlar profilingizga ishonch beradi.</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Github size={19} />
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <Github size={17} className="text-slate-500" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
              @{user.githubUsername || 'github_username'}
            </span>
            <button
              onClick={() => setIsEditingGithub(true)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              O'zgartirish
            </button>
          </div>

          {isEditingGithub && (
            <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="text"
                value={tempGithub}
                onChange={(e) => setTempGithub(e.target.value)}
                placeholder="GitHub username"
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
              <Button size="sm" onClick={saveGithubUsername} className="rounded-lg bg-slate-950 px-4 text-white hover:bg-slate-800">
                Saqlash
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingGithub(false);
                  setTempGithub(user.githubUsername || '');
                }}
                className="rounded-lg border-slate-200 px-4"
              >
                Bekor qilish
              </Button>
            </div>
          )}

          {isLoadingStats ? (
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : githubStats ? (
            <div className="grid grid-cols-4 gap-2">
              <GithubMetric icon={Users} label="Followers" value={githubStats.followers} />
              <GithubMetric icon={Users} label="Following" value={githubStats.following} />
              <GithubMetric icon={BookOpen} label="Repos" value={githubStats.public_repos} />
              <GithubMetric icon={TrendingUp} label="Gists" value={githubStats.public_gists} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-600">GitHub username kiriting va real statistikani ko'ring.</p>
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Keyingi professional qadamlar</h2>
              <p className="mt-1 text-sm text-slate-500">Eng muhim ishlar bir joyda.</p>
            </div>
            <Sparkles size={20} className="text-amber-600" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <ActionButton
              icon={Github}
              title="Loyihalarni import qilish"
              description="GitHub repolarni tortib olib, eng kuchli ishlarni tartiblang."
              onClick={onOpenWizard}
            />
            <ActionButton
              icon={Layout}
              title="Template tanlash"
              description="Rolingizga mos, toza va o'qilishi oson dizaynni tanlang."
              onClick={onOpenWizard}
            />
            <ActionButton
              icon={Sparkles}
              title="AI CV matni"
              description="Bio, skills va project bulletlarini ish beruvchi uslubida yozdiring."
              onClick={onOpenAi}
            />
            <ActionButton
              icon={ExternalLink}
              title="Natijani ko'rish"
              description="Preview orqali layout, bo'sh joy va linklarni tekshiring."
              onClick={onOpenPreview}
            />
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                <Link2 size={14} />
                Public portfolio
              </p>
              <h2 className="text-2xl font-semibold tracking-normal">Professional manzil tayyor.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Havola oddiy, esda qolarli va rekruterga yuborishga tayyor bo'lishi kerak.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={copyPortfolioUrl}
              className="h-11 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-slate-100"
            >
              <Copy size={16} className="mr-2" />
              {copyState === 'copied' ? 'Nusxalandi' : 'Havolani olish'}
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
            <span className="min-w-0 truncate text-sm font-semibold text-slate-200">{portfolioUrl}</span>
            <button onClick={onOpenPreview} className="rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <UserRound size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Profil pozitsiyasi</h2>
              <p className="text-sm text-slate-500">Sizning hozirgi headline matningiz.</p>
            </div>
          </div>
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {user.bio || "Bio hali kiritilmagan. Qisqa, natijaga yo'naltirilgan matn qo'shing."}
          </p>
        </div>
      </section>
    </div>
  );
};

const GithubMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
    <div className="mb-2 flex items-center justify-center gap-1 text-slate-500">
      <Icon size={12} />
      <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-lg font-semibold text-slate-950">{value}</p>
  </div>
);

const ActionButton = ({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex h-full min-h-[126px] items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition group-hover:border-blue-100 group-hover:text-blue-700">
      <Icon size={19} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-slate-950">{title}</span>
      <span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span>
    </span>
    <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
  </button>
);
