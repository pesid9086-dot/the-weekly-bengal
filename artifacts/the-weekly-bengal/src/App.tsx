import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Bookmark, BookmarkCheck, Check, ChevronRight, Clock3, Copy, FileEdit, Globe2, Instagram, Link as LinkIcon, LogOut, Mail, Menu, Moon, Newspaper, PenLine, Plus, Search, Share2, ShieldCheck, Sun, Trash2, UserRound, UsersRound, X, Zap } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';

type NewsStatus = 'published' | 'pending';
type UserRole = 'admin' | 'reporter';
type Category = typeof CATEGORIES[number];

type News = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  image_url: string;
  status: NewsStatus;
  author_name: string;
  author_id: string;
  created_at: string;
  reading_time?: number;
  photographer?: string;
};

type User = { id: string; name: string; email: string; password: string; role: UserRole; active?: boolean };
type Session = { userId: string; name: string; email: string; role: UserRole };

const CATEGORIES = ['জাতীয়', 'আন্তর্জাতিক', 'রাজনীতি', 'অর্থনীতি', 'খেলাধুলা', 'ই-স্পোর্টস ও গেমিং', 'প্রযুক্তি', 'বিনোদন', 'সম্পাদকীয় ও মতামত', 'ফিচার ও জীবনযাপন'] as const;
const ADMIN_EMAIL = 'nafiualif379@gmail.com';

const RAW_SEED_NEWS: Omit<News, 'content'>[] = [
  { id: 'wb-001', title: 'পদ্মার ওপারে নতুন দিনের মানচিত্র আঁকছে যে শহর', excerpt: 'নদী, রেল আর মানুষের অনবরত যাতায়াতের ভেতর দিয়ে বদলে যাচ্ছে দক্ষিণের জনপদ। উন্নয়নের গল্পটি কেবল সেতুর নয়—এটি অপেক্ষারও।', category: 'জাতীয়', image_url: 'https://images.pexels.com/photos/2403851/pexels-photo-2403851.jpeg?auto=compress&cs=tinysrgb&w=1400', status: 'published', author_name: 'মেহেদী হাসান', author_id: 'u-reporter', created_at: '2025-02-17T08:30:00.000Z', reading_time: 8, photographer: 'সাদিয়া ইসলাম' },
  { id: 'wb-002', title: 'নতুন বাণিজ্যপথে এশিয়ার পুরনো শহরগুলোর ফিরে দেখা', excerpt: 'বন্দর থেকে বাজার—আঞ্চলিক অর্থনীতি যখন নতুন সংযোগের ভাষা শিখছে, তখন ইতিহাসও নিজের পুরনো খাতা খুলে বসেছে।', category: 'আন্তর্জাতিক', image_url: 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'তানভীর আহমেদ', author_id: 'u-editor', created_at: '2025-02-16T10:00:00.000Z', reading_time: 6, photographer: 'রয়টার্স' },
  { id: 'wb-003', title: 'শহরের বাজেটে নাগরিকের কণ্ঠ কোথায়?', excerpt: 'একটি বাজেট কীভাবে ফুটপাত, বাসস্টপ এবং পাড়ার পাঠাগার হয়ে ওঠে—তার হিসাব খুঁজেছে আমাদের নগর ডেস্ক।', category: 'রাজনীতি', image_url: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'নাবিলা নূর', author_id: 'u-reporter', created_at: '2025-02-15T07:45:00.000Z', reading_time: 7 },
  { id: 'wb-004', title: 'ক্ষুদ্র সঞ্চয়ের শক্তি দিয়ে ঘুরছে গ্রামীণ অর্থনীতির চাকা', excerpt: 'দোকানের খাতা, মোবাইল ওয়ালেট আর নারীদের সমবায়—নগদের বাইরে আরেক অর্থনীতির স্পন্দন।', category: 'অর্থনীতি', image_url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'মেহেদী হাসান', author_id: 'u-reporter', created_at: '2025-02-14T09:15:00.000Z', reading_time: 5 },
  { id: 'wb-005', title: 'শেষ ওভারের আগে: একটি দলের ভেতরের গল্প', excerpt: 'স্কোরবোর্ডে রান, ড্রেসিংরুমে অপেক্ষা; জয়ের যে অংশ দর্শক দেখতে পান না, তার কাছেই গিয়েছিলাম আমরা।', category: 'খেলাধুলা', image_url: 'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'আরিফুল করিম', author_id: 'u-editor', created_at: '2025-02-13T11:30:00.000Z', reading_time: 4 },
  { id: 'wb-006', title: 'গেমিং আর কেবল খেলা নেই—তরুণদের নতুন কর্মক্ষেত্র', excerpt: 'স্ট্রিমিং, ডিজাইন এবং প্রতিযোগিতা মিলিয়ে তৈরি হচ্ছে এক নতুন পেশাজগত। রাজধানীর বাইরে তার সম্ভাবনা আরও বড়।', category: 'ই-স্পোর্টস ও গেমিং', image_url: 'https://images.pexels.com/photos/7915357/pexels-photo-7915357.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'শাওন কবির', author_id: 'u-reporter', created_at: '2025-02-12T13:20:00.000Z', reading_time: 6 },
  { id: 'wb-007', title: 'কৃত্রিম বুদ্ধিমত্তার যুগে বাংলা ভাষার নিজের সফটওয়্যার', excerpt: 'ভাষার সূক্ষ্মতা ধরে রাখতে গবেষকরা তৈরি করছেন ডেটাসেট, কিবোর্ড এবং নতুন পাঠ-প্রযুক্তি।', category: 'প্রযুক্তি', image_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'তানভীর আহমেদ', author_id: 'u-editor', created_at: '2025-02-11T08:10:00.000Z', reading_time: 7 },
  { id: 'wb-008', title: 'আলোর ভেতর যে শহর: সিনেমার সেট থেকে বাস্তবের গল্প', excerpt: 'নতুন নির্মাতাদের চোখে দেশের চলচ্চিত্র বদলাচ্ছে—বড় পর্দার ঝলক নয়, মানুষই তাদের কেন্দ্র।', category: 'বিনোদন', image_url: 'https://images.pexels.com/photos/7991378/pexels-photo-7991378.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'সাবিহা রহমান', author_id: 'u-editor', created_at: '2025-02-10T14:25:00.000Z', reading_time: 5 },
  { id: 'wb-009', title: 'মত প্রকাশের জায়গা সংকুচিত হলে সমাজ কী হারায়', excerpt: 'সম্পাদকীয়: ভিন্নমতকে জায়গা দেওয়ার সংস্কৃতি কোনো বিলাসিতা নয়; গণতন্ত্রের দৈনন্দিন ব্যায়াম।', category: 'সম্পাদকীয় ও মতামত', image_url: 'https://images.pexels.com/photos/261949/pexels-photo-261949.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'সম্পাদকমণ্ডলী', author_id: 'u-editor', created_at: '2025-02-09T06:50:00.000Z', reading_time: 4 },
  { id: 'wb-010', title: 'ছাদের বাগান, পাড়ার রান্নাঘর আর ধীর জীবনের পাঠ', excerpt: 'ব্যস্ত শহরে জীবনকে একটু ধীরে নেওয়ার ছোট ছোট উপায় খুঁজেছেন আমাদের ফিচার লেখক।', category: 'ফিচার ও জীবনযাপন', image_url: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'সাবিহা রহমান', author_id: 'u-editor', created_at: '2025-02-08T10:45:00.000Z', reading_time: 6 },
  { id: 'wb-011', title: 'উপকূলের স্কুলগুলোতে বই পৌঁছানোর নতুন উদ্যোগ', excerpt: 'একটি নৌকা, কয়েকজন শিক্ষক এবং পাঠের জন্য অপেক্ষা করা একদল শিশু—উদ্যোগটির দিনলিপি।', category: 'জাতীয়', image_url: 'https://images.pexels.com/photos/8613312/pexels-photo-8613312.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'pending', author_name: 'রাফি আজাদ', author_id: 'u-reporter', created_at: '2025-02-18T09:15:00.000Z', reading_time: 5 },
  { id: 'wb-012', title: 'সীমান্ত পেরিয়ে সহযোগিতার নতুন নকশা', excerpt: 'জলবায়ু, বাণিজ্য ও মানুষের চলাচল—দক্ষিণ এশিয়ার নতুন আলোচনায় পুরনো সীমারেখাগুলো নতুন অর্থ পাচ্ছে।', category: 'আন্তর্জাতিক', image_url: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'নাবিলা নূর', author_id: 'u-reporter', created_at: '2025-02-07T09:30:00.000Z', reading_time: 6 },
  { id: 'wb-013', title: 'পাড়ার সভা থেকে নীতির টেবিলে', excerpt: 'স্থানীয় মানুষের ছোট পরামর্শ কীভাবে শহরের বড় সিদ্ধান্তকে বদলে দিতে পারে, তার অনুসন্ধান।', category: 'রাজনীতি', image_url: 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'আরিফুল করিম', author_id: 'u-editor', created_at: '2025-02-06T11:10:00.000Z', reading_time: 5 },
  { id: 'wb-014', title: 'চায়ের দোকানের ডিজিটাল খাতা', excerpt: 'মোবাইল পেমেন্টের সহজ ব্যবহার বদলে দিচ্ছে ছোট ব্যবসার দৈনন্দিন হিসাব এবং আস্থার সম্পর্ক।', category: 'অর্থনীতি', image_url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'মেহেদী হাসান', author_id: 'u-reporter', created_at: '2025-02-05T08:00:00.000Z', reading_time: 4 },
  { id: 'wb-015', title: 'মাঠের বাইরে খেলাটির আরেক জীবন', excerpt: 'কোচ, স্বেচ্ছাসেবক ও পরিবারের অবদানে একটি স্থানীয় মাঠ হয়ে উঠছে নতুন প্রজন্মের স্কুল।', category: 'খেলাধুলা', image_url: 'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'শাওন কবির', author_id: 'u-reporter', created_at: '2025-02-04T12:40:00.000Z', reading_time: 5 },
  { id: 'wb-016', title: 'স্ক্রিনের ভেতর দলগত স্বপ্ন', excerpt: 'প্রতিযোগিতামূলক গেমিংয়ের আড়ালে তৈরি হচ্ছে বন্ধুত্ব, নেতৃত্ব আর নতুন ধরনের প্রশিক্ষণ সংস্কৃতি।', category: 'ই-স্পোর্টস ও গেমিং', image_url: 'https://images.pexels.com/photos/7915357/pexels-photo-7915357.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'শাওন কবির', author_id: 'u-reporter', created_at: '2025-02-03T15:20:00.000Z', reading_time: 6 },
  { id: 'wb-017', title: 'বাংলা কণ্ঠের জন্য তৈরি হচ্ছে নতুন কম্পিউটিং', excerpt: 'স্থানীয় উচ্চারণ ও শব্দভাণ্ডারকে প্রযুক্তিতে জায়গা দিতে গবেষকদের দীর্ঘ পথচলার গল্প।', category: 'প্রযুক্তি', image_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'তানভীর আহমেদ', author_id: 'u-editor', created_at: '2025-02-02T07:20:00.000Z', reading_time: 7 },
  { id: 'wb-018', title: 'মঞ্চের আলো নেমে এলে যে কাজ থেকে যায়', excerpt: 'নাট্যদলের মহড়াঘর, শহরের ছোট মঞ্চ এবং দর্শকের সঙ্গে নতুন করে সম্পর্ক গড়ার চেষ্টা।', category: 'বিনোদন', image_url: 'https://images.pexels.com/photos/7991378/pexels-photo-7991378.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'সাবিহা রহমান', author_id: 'u-editor', created_at: '2025-02-01T14:00:00.000Z', reading_time: 5 },
  { id: 'wb-019', title: 'ভিন্নমতের পাশে দাঁড়ানোর দৈনন্দিন অনুশীলন', excerpt: 'মত প্রকাশের স্বাধীনতা শুধু শিরোনাম নয়—এটি শ্রবণ, প্রশ্ন এবং দায়িত্বের সম্মিলিত অভ্যাস।', category: 'সম্পাদকীয় ও মতামত', image_url: 'https://images.pexels.com/photos/261949/pexels-photo-261949.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'সম্পাদকমণ্ডলী', author_id: 'u-editor', created_at: '2025-01-31T06:30:00.000Z', reading_time: 4 },
  { id: 'wb-020', title: 'বারান্দার বিকেল থেকে প্রতিবেশীর গল্প', excerpt: 'একটু ধীর সময়, ভাগ করে নেওয়া রান্না এবং পাশের বাড়ির মানুষের সঙ্গে নতুন করে পরিচিত হওয়ার নোটবুক।', category: 'ফিচার ও জীবনযাপন', image_url: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=1000', status: 'published', author_name: 'সাবিহা রহমান', author_id: 'u-editor', created_at: '2025-01-30T10:30:00.000Z', reading_time: 5 },
];

const SEED_NEWS: News[] = RAW_SEED_NEWS.map((article) => ({
  ...article,
  content: `${article.excerpt}\n\nএই প্রতিবেদনের জন্য আমাদের প্রতিবেদক কথা বলেছেন স্থানীয় মানুষ, গবেষক এবং সংশ্লিষ্ট নীতিনির্ধারকদের সঙ্গে। মাঠের নোটে উঠে এসেছে বদলে যাওয়া সময়ের ভেতরে মানুষের ছোট ছোট সিদ্ধান্ত, যা বড় ছবিটিকে বুঝতে সাহায্য করে।\n\n${article.title}—এই গল্পের মূল প্রশ্নটি তাই কেবল আজকের নয়; আগামী দিনের জন্যও এটি আমাদের ভাবতে শেখায়। তথ্য যাচাই করে, মানুষের অভিজ্ঞতার পাশে রেখে, সম্পূর্ণ ছবিটি পাঠকের সামনে তুলে ধরাই এই প্রতিবেদনের উদ্দেশ্য।`,
}));

const SEED_USERS: User[] = [
  { id: 'u-admin', name: 'নাফিউল আলী', email: ADMIN_EMAIL, password: 'bengal-admin', role: 'admin', active: true },
  { id: 'u-reporter', name: 'মেহেদী হাসান', email: 'mehedi@weeklybengal.com', password: 'bengal-reporter', role: 'reporter', active: true },
  { id: 'u-editor', name: 'তানভীর আহমেদ', email: 'tanvir@weeklybengal.com', password: 'bengal-editor', role: 'reporter', active: true },
];

function readStore<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch { return fallback; }
}
function writeStore<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }
function dateInBengali(date: string) { return new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date)); }
function englishDate(date: string) { return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)); }
function initials(name: string) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2); }
function generateExcerpt(content: string) {
  const trimmed = content.trim();
  return trimmed.length > 100 ? `${trimmed.slice(0, 100).trim()}…` : trimmed;
}
function readImageFile(file: File, onRead: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') onRead(reader.result);
  };
  reader.readAsDataURL(file);
}

const translations = {
  bn: { search: 'খুঁজুন', latest: 'সর্বশেষ', picks: 'সম্পাদকের পছন্দ', more: 'আরও পড়ুন', home: 'প্রচ্ছদ', signIn: 'প্রবেশ করুন', signOut: 'বেরিয়ে যান', save: 'সংরক্ষণ', saved: 'সংরক্ষিত', share: 'শেয়ার', copy: 'লিংক কপি', admin: 'অ্যাডমিন', workspace: 'রিপোর্টার ডেস্ক', read: 'মিনিট পড়ুন' },
  en: { search: 'Search', latest: 'Latest', picks: 'Editor picks', more: 'Read more', home: 'Home', signIn: 'Sign in', signOut: 'Sign out', save: 'Save', saved: 'Saved', share: 'Share', copy: 'Copy link', admin: 'Admin', workspace: 'Reporter desk', read: 'min read' },
};

function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStore(key, fallback));
  const update = useCallback((next: T | ((previous: T) => T)) => {
    setValue((previous) => {
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next;
      writeStore(key, resolved);
      return resolved;
    });
  }, [key]);
  return [value, update] as const;
}

function App() {
  return <QueryClientProvider client={new QueryClient()}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

function Router() {
  const [news, setNews] = usePersistentState<News[]>('wb_news', SEED_NEWS);
  const [users, setUsers] = usePersistentState<User[]>('wb_users', SEED_USERS);
  const [session, setSession] = usePersistentState<Session | null>('wb_session', null);
  const [bookmarks, setBookmarks] = usePersistentState<string[]>('wb_bookmarks', []);
  const [dark, setDark] = useState(() => localStorage.getItem('wb_theme') === 'dark');
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [toast, setToast] = useState('');
  const t = translations[language];

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('wb_theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key || localStorage.getItem('wb_news')) return;
    fetch(`${url}/rest/v1/news?status=eq.published&order=created_at.desc`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
      .then((response) => response.ok ? response.json() as Promise<News[]> : Promise.reject(new Error('remote unavailable')))
      .then((remote) => { if (Array.isArray(remote) && remote.length) setNews(remote); }).catch(() => undefined);
  }, [setNews]);
  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); }, []);
  const login = useCallback((next: Session) => { setSession(next); notify(language === 'bn' ? 'স্বাগতম। আপনার ডেস্ক প্রস্তুত।' : 'Welcome back. Your desk is ready.'); }, [language, notify, setSession]);
  const logout = useCallback(() => { setSession(null); notify(language === 'bn' ? 'আপনি নিরাপদে বেরিয়ে গেছেন।' : 'You have signed out safely.'); }, [language, notify, setSession]);
  const toggleBookmark = useCallback((id: string) => setBookmarks((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]), [setBookmarks]);
  const syncNews = useCallback(async (article: News | string, operation: 'upsert' | 'delete') => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const endpoint = operation === 'delete' ? `${url}/rest/v1/news?id=eq.${encodeURIComponent(typeof article === 'string' ? article : article.id)}` : `${url}/rest/v1/news`;
    const payload = typeof article === 'string' ? null : {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      image_url: article.image_url,
      status: article.status,
      author_name: article.author_name,
      author_id: article.author_id,
      created_at: article.created_at,
    };
    try {
      await fetch(endpoint, {
        method: operation === 'delete' ? 'DELETE' : 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: operation === 'upsert' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal' },
        body: payload ? JSON.stringify(payload) : undefined,
      });
    } catch {
      // Local storage remains the source of truth when the optional remote is unavailable.
    }
  }, []);
  return <div className="wb-shell wb-grain">
    <Header dark={dark} language={language} setDark={setDark} setLanguage={setLanguage} session={session} logout={logout} t={t} />
    <Switch>
      <Route path="/" component={() => <Home news={news} bookmarks={bookmarks} toggleBookmark={toggleBookmark} t={t} />} />
      <Route path="/article/:id" component={() => <Article news={news} bookmarks={bookmarks} toggleBookmark={toggleBookmark} notify={notify} t={t} />} />
      <Route path="/search" component={() => <SearchPage news={news} bookmarks={bookmarks} toggleBookmark={toggleBookmark} t={t} />} />
      <Route path="/category/:category" component={() => <CategoryPage news={news} bookmarks={bookmarks} toggleBookmark={toggleBookmark} t={t} />} />
      <Route path="/login" component={() => <Login users={users} setUsers={setUsers} login={login} t={t} />} />
      <Route path="/admin" component={() => <Protected session={session} role="admin" t={t}><Admin news={news} setNews={setNews} users={users} setUsers={setUsers} notify={notify} syncNews={syncNews} /></Protected>} />
      <Route path="/reporter" component={() => <Protected session={session} role="reporter" t={t}><Reporter news={news} setNews={setNews} session={session} notify={notify} syncNews={syncNews} /></Protected>} />
      <Route component={() => <NotFound t={t} />} />
    </Switch>
    {toast && <div className="wb-toast" role="status" data-testid="status-toast">{toast}</div>}
  </div>;
}

function Header({ dark, language, setDark, setLanguage, session, logout, t }: { dark: boolean; language: 'bn' | 'en'; setDark: (value: boolean) => void; setLanguage: (value: 'bn' | 'en') => void; session: Session | null; logout: () => void; t: typeof translations.bn }) {
  const [drawer, setDrawer] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [, navigate] = useLocation();
  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  return <>
    <header className="wb-header">
      <div className="wb-container wb-topline"><span>{dateInBengali(clock.toISOString())}</span><span className="wb-hide-mobile">ঢাকার নির্ভরযোগ্য সাপ্তাহিক সংবাদপত্র</span><span className="wb-mono">{clock.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
      <div className="wb-container wb-masthead">
        <div className="wb-header-side"><button className="wb-icon-button" onClick={() => setDrawer(true)} aria-label="মেনু খুলুন" data-testid="button-open-menu"><Menu size={17} /></button><button className="wb-icon-button" onClick={() => navigate('/search')} aria-label={t.search} data-testid="button-open-search"><Search size={16} /></button></div>
        <Link href="/" className="wb-brand wb-display wb-link" data-testid="link-masthead">The Weekly Bengal<span>সত্যের পাশে, মানুষের কাছে</span></Link>
        <div className="wb-header-side">
          <button className="wb-button wb-button-quiet wb-text-action" onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} data-testid="button-language-toggle"><Globe2 size={14} /> {language === 'bn' ? 'EN' : 'বাং'}</button>
          <button className="wb-icon-button" onClick={() => setDark(!dark)} aria-label="থিম বদলান" data-testid="button-theme-toggle">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          {session ? <button className="wb-icon-button" onClick={logout} aria-label={t.signOut} data-testid="button-logout"><LogOut size={16} /></button> : <Link href="/login" className="wb-button wb-button-primary wb-text-action" data-testid="link-login"><UserRound size={14} /> {t.signIn}</Link>}
        </div>
      </div>
      <div className="wb-container wb-nav"><nav className="wb-nav-links">{CATEGORIES.map((category) => <Link key={category} href={`/category/${encodeURIComponent(category)}`} className="wb-link" data-testid={`link-category-${category}`}>{category}</Link>)}</nav><Link href="/search" className="wb-link" aria-label={t.search} data-testid="link-search"><Search size={16} /></Link></div>
      <div className="wb-ticker"><div className="wb-ticker-track">{[...Array(2)].flatMap(() => ['আজকের নির্বাচিত খবর', 'উপকূলে বই পৌঁছানোর নতুন উদ্যোগ', 'বিশ্বজুড়ে বদলাচ্ছে বাণিজ্যের মানচিত্র', 'শেষ ওভারের আগে: একটি দলের ভেতরের গল্প']).map((item, index) => <div className="wb-ticker-item" key={`${item}-${index}`}><strong>সরাসরি</strong><span>{item}</span><Zap size={12} /></div>)}</div></div>
    </header>
    {drawer && <><div className="wb-overlay" onClick={() => setDrawer(false)} /><aside className="wb-mobile-drawer" aria-label="সব বিভাগ"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="wb-kicker">বিভাগসমূহ</span><button className="wb-icon-button" onClick={() => setDrawer(false)} aria-label="বন্ধ করুন" data-testid="button-close-menu"><X size={17} /></button></div><Link href="/" className="wb-brand wb-display wb-link" onClick={() => setDrawer(false)} data-testid="link-drawer-masthead">The Weekly Bengal<span>সত্যের পাশে, মানুষের কাছে</span></Link><div style={{ display: 'grid', gap: '.2rem' }}>{CATEGORIES.map((category, index) => <Link href={`/category/${encodeURIComponent(category)}`} key={category} onClick={() => setDrawer(false)} className="wb-serif wb-link" style={{ padding: '.9rem 0', borderBottom: '1px solid hsl(var(--border))', fontSize: '1.3rem' }} data-testid={`link-drawer-category-${index}`}>{category}<ChevronRight size={16} style={{ float: 'right', marginTop: '.4rem' }} /></Link>)}</div></aside></>}
  </>;
}

function Meta({ article, t }: { article: News; t: typeof translations.bn }) {
  return <div className="wb-meta"><span>{article.author_name}</span><span className="wb-meta-dot" /><span>{dateInBengali(article.created_at)}</span><span className="wb-meta-dot" /><span>{article.reading_time || 5} {t.read}</span></div>;
}

function StoryCard({ article, small = false, featured = false, bookmarked, toggleBookmark }: { article: News; small?: boolean; featured?: boolean; bookmarked: boolean; toggleBookmark: (id: string) => void }) {
  return <article className={`wb-story-card ${small ? 'small' : ''} ${featured ? 'featured' : ''} wb-reveal`} data-testid={`card-story-${article.id}`}>
    <Link href={`/article/${article.id}`} data-testid={`link-story-${article.id}`}><img src={article.image_url} alt={article.title} loading="lazy" /></Link>
    <div className="wb-kicker">{article.category}</div>
    <h3 className="wb-serif"><Link href={`/article/${article.id}`} className="wb-link" data-testid={`link-title-${article.id}`}>{article.title}</Link></h3>
    <p>{article.excerpt}</p>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.7rem' }}><Meta article={article} t={translations.bn} /><button className="wb-icon-button" onClick={() => toggleBookmark(article.id)} aria-label={bookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'} data-testid={`button-bookmark-${article.id}`}>{bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button></div>
  </article>;
}

function Home({ news, bookmarks, toggleBookmark, t }: { news: News[]; bookmarks: string[]; toggleBookmark: (id: string) => void; t: typeof translations.bn }) {
  const published = news.filter((article) => article.status === 'published');
  const lead = published[0];
  const picks = published.slice(1, 4);
  return <><main className="wb-container">
    <section className="wb-hero wb-reveal"><div><div className="wb-kicker">সপ্তাহের প্রধান প্রতিবেদন</div><h1 className="wb-serif wb-hero-title"><Link href={`/article/${lead.id}`} className="wb-link" data-testid="link-lead-story">{lead.title}</Link></h1><p className="wb-excerpt">{lead.excerpt}</p><div style={{ margin: '1.3rem 0' }}><Meta article={lead} t={t} /></div><Link href={`/article/${lead.id}`} className="wb-button wb-button-primary" data-testid="button-read-lead">{t.more}<ChevronRight size={14} /></Link></div><Link href={`/article/${lead.id}`} data-testid="link-lead-image"><img className="wb-hero-image" src={lead.image_url} alt={lead.title} /></Link></section>
    <section><div className="wb-section-head"><h2 className="wb-serif">{t.picks}</h2><Link href="/search" className="wb-link" data-testid="link-all-latest">{t.latest} <ChevronRight size={14} style={{ verticalAlign: 'middle' }} /></Link></div><div className="wb-picks">{picks.map((article, index) => <StoryCard key={article.id} article={article} featured={index === 0} small={index > 0} bookmarked={bookmarks.includes(article.id)} toggleBookmark={toggleBookmark} />)}</div></section>
    <section><div className="wb-section-head"><h2 className="wb-serif">দশ দিগন্ত, এক কণ্ঠ</h2><p>বিষয়ভিত্তিক নির্বাচিত পাঠ</p></div>{CATEGORIES.map((category) => { const articles = published.filter((article) => article.category === category).slice(0, 3); return <div className="wb-category-block" key={category}><div className="wb-category-label"><h2 className="wb-serif">{category}</h2><p><Link href={`/category/${encodeURIComponent(category)}`} className="wb-link" data-testid={`link-category-more-${category}`}>সব প্রতিবেদন <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></Link></p></div><div className="wb-category-stories">{articles.length ? articles.map((article) => <StoryCard key={`${category}-${article.id}`} article={article} small bookmarked={bookmarks.includes(article.id)} toggleBookmark={toggleBookmark} />) : <div className="wb-empty" style={{ gridColumn: '1 / -1', padding: '2rem' }}><Newspaper size={25} /><p>এই বিভাগের প্রথম প্রতিবেদনটি শিগগিরই আসছে।</p></div>}</div></div>; })}</section>
  </main><Footer /></>;
}

function Article({ news, bookmarks, toggleBookmark, notify, t }: { news: News[]; bookmarks: string[]; toggleBookmark: (id: string) => void; notify: (message: string) => void; t: typeof translations.bn }) {
  const params = useParams<{ id: string }>();
  const article = news.find((item) => item.id === params.id);
  const [copied, setCopied] = useState(false);
  if (!article) return <NotFound t={t} />;
  const copyLink = () => { void navigator.clipboard?.writeText(window.location.href); setCopied(true); notify('লিংক কপি হয়েছে।'); window.setTimeout(() => setCopied(false), 1800); };
  const share = () => { if (navigator.share) void navigator.share({ title: article.title, url: window.location.href }); else copyLink(); };
  return <main className="wb-container"><article className="wb-article wb-reveal"><div className="wb-kicker">{article.category}</div><h1 className="wb-serif" data-testid={`text-article-title-${article.id}`}>{article.title}</h1><p className="wb-article-deck">{article.excerpt}</p><div style={{ marginTop: '1.5rem' }}><Meta article={article} t={t} /></div><div className="wb-action-row"><button className="wb-button wb-button-quiet" onClick={() => toggleBookmark(article.id)} data-testid="button-article-bookmark">{bookmarks.includes(article.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {bookmarks.includes(article.id) ? t.saved : t.save}</button><button className="wb-button wb-button-quiet" onClick={share} data-testid="button-article-share"><Share2 size={15} /> {t.share}</button><button className="wb-button wb-button-quiet" onClick={copyLink} data-testid="button-article-copy"><Copy size={15} /> {copied ? 'কপি হয়েছে' : t.copy}</button></div><img className="wb-article-cover" src={article.image_url} alt={article.title} data-testid={`img-article-cover-${article.id}`} /><div className="wb-article-body">{(article.content || article.excerpt).split('\n\n').map((paragraph, index) => index === 1 ? <blockquote className="wb-pullquote" key={paragraph}>“{paragraph}”</blockquote> : <p key={paragraph} data-testid={`text-article-paragraph-${index}`}>{paragraph}</p>)}</div>{article.photographer && <p style={{ textAlign: 'center', fontSize: '.7rem', color: 'hsl(var(--muted-foreground))' }}>ছবি: {article.photographer}</p>}</article></main>;
}

function SearchPage({ news, bookmarks, toggleBookmark, t }: { news: News[]; bookmarks: string[]; toggleBookmark: (id: string) => void; t: typeof translations.bn }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'সব বিভাগ'>('সব বিভাগ');
  const results = useMemo(() => news.filter((article) => article.status === 'published' && (category === 'সব বিভাগ' || article.category === category) && (`${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(query.toLowerCase()))), [category, news, query]);
  return <main className="wb-container"><div className="wb-page-intro"><div className="wb-kicker">আর্কাইভ / SEARCH</div><h1 className="wb-serif">{t.search}</h1><p className="wb-excerpt">গল্পের ভেতর থেকে গল্প খুঁজে নিন। বিষয়, নাম বা একটি শব্দ দিয়ে শুরু করুন।</p></div><div style={{ paddingTop: '1.3rem' }}><label className="wb-search-bar"><Search size={18} color="hsl(var(--accent))" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="যেমন: নদী, বাজেট, সিনেমা" aria-label="খুঁজুন" data-testid="input-search" /></label><div className="wb-chips"><button className={`wb-chip ${category === 'সব বিভাগ' ? 'active' : ''}`} onClick={() => setCategory('সব বিভাগ')} data-testid="button-filter-all">সব বিভাগ</button>{CATEGORIES.map((item) => <button key={item} className={`wb-chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)} data-testid={`button-filter-${item}`}>{item}</button>)}</div></div><div className="wb-section-head"><h2 className="wb-serif">{results.length}টি প্রতিবেদন</h2><p>{query ? `“${query}” অনুসন্ধান` : 'সর্বশেষ প্রকাশিত'}</p></div>{results.length ? <div className="wb-list-grid">{results.map((article) => <StoryCard key={article.id} article={article} bookmarked={bookmarks.includes(article.id)} toggleBookmark={toggleBookmark} />)}</div> : <div className="wb-empty" style={{ margin: '2rem 0 4rem' }}><Search size={30} /><h2 className="wb-serif">কোনো প্রতিবেদন মেলেনি</h2><p>অন্য শব্দ বা বিভাগ দিয়ে আবার চেষ্টা করুন।</p></div>}</main>;
}

function CategoryPage({ news, bookmarks, toggleBookmark, t }: { news: News[]; bookmarks: string[]; toggleBookmark: (id: string) => void; t: typeof translations.bn }) {
  const params = useParams<{ category: string }>();
  const category = decodeURIComponent(params.category || '') as Category;
  const articles = news.filter((item) => item.status === 'published' && item.category === category);
  return <main className="wb-container"><div className="wb-page-intro"><div className="wb-kicker">বিভাগ / CATEGORY</div><h1 className="wb-serif">{CATEGORIES.includes(category) ? category : 'সব প্রতিবেদন'}</h1><p className="wb-excerpt">এই বিভাগের বাছাই করা প্রতিবেদন, মাঠের নোট এবং আমাদের নিজস্ব বিশ্লেষণ।</p></div>{articles.length ? <div className="wb-list-grid">{articles.map((article) => <StoryCard key={article.id} article={article} bookmarked={bookmarks.includes(article.id)} toggleBookmark={toggleBookmark} />)}</div> : <div className="wb-empty" style={{ margin: '2rem 0 4rem' }}><Newspaper size={30} /><h2 className="wb-serif">এই বিভাগে নতুন প্রতিবেদন আসছে</h2><p>সম্পাদকীয় ডেস্কে কাজ চলছে। অন্য বিভাগটি দেখে নিন।</p></div>}<div style={{ paddingBottom: '4rem' }}><Link href="/search" className="wb-button wb-button-primary" data-testid="button-browse-all">{t.latest}<ChevronRight size={14} /></Link></div></main>;
}

function Login({ users, setUsers, login, t }: { users: User[]; setUsers: (next: User[] | ((previous: User[]) => User[])) => void; login: (session: Session) => void; t: typeof translations.bn }) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [error, setError] = useState('');
  const [, navigate] = useLocation();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (resetMode) {
      if (!normalizedEmail || resetPassword.length < 6) {
        setError('ইমেইল দিন এবং অন্তত ৬ অক্ষরের নতুন পাসওয়ার্ড লিখুন।');
        return;
      }
      const existing = users.find((user) => user.email.toLowerCase() === normalizedEmail);
      if (!existing && normalizedEmail !== ADMIN_EMAIL) {
        setError('এই ইমেইলের কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
        return;
      }
      const updated: User = existing
        ? { ...existing, password: resetPassword, active: true, role: normalizedEmail === ADMIN_EMAIL ? 'admin' : existing.role }
        : { id: `u-${Date.now()}`, name: 'নাফিউল আলী', email: ADMIN_EMAIL, password: resetPassword, role: 'admin', active: true };
      setUsers((current) => existing ? current.map((user) => user.id === updated.id ? updated : user) : [...current, updated]);
      login({ userId: updated.id, name: updated.name, email: updated.email, role: updated.role });
      navigate(updated.role === 'admin' ? '/admin' : '/reporter');
      return;
    }
    if (tab === 'signup') {
      if (!name.trim() || !normalizedEmail || password.length < 6) {
        setError('নাম, সঠিক ইমেইল ও অন্তত ৬ অক্ষরের পাসওয়ার্ড দিন।');
        return;
      }
      const role: UserRole = normalizedEmail === ADMIN_EMAIL ? 'admin' : 'reporter';
      const existing = users.find((user) => user.email.toLowerCase() === normalizedEmail);
      const user: User = existing
        ? { ...existing, name: name.trim(), email: normalizedEmail, password, role, active: true }
        : { id: `u-${Date.now()}`, name: name.trim(), email: normalizedEmail, password, role, active: true };
      setUsers((current) => existing ? current.map((item) => item.id === user.id ? user : item) : [...current, user]);
      login({ userId: user.id, name: user.name, email: user.email, role: user.role });
      navigate(role === 'admin' ? '/admin' : '/reporter');
      return;
    }
    const user = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
    if (!user || user.password !== password) {
      setError('ভুল ইমেইল বা পাসওয়ার্ড।');
      return;
    }
    if (user.role === 'reporter' && user.active === false) {
      setError('আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে।');
      return;
    }
    login({ userId: user.id, name: user.name, email: user.email, role: user.role });
    navigate(user.role === 'admin' ? '/admin' : '/reporter');
  };
  return <main className="wb-auth-wrap"><section className="wb-auth-card wb-reveal"><div className="wb-kicker">THE WEEKLY BENGAL / DESK</div><h1 className="wb-serif" style={{ fontSize: '2.35rem', lineHeight: 1.1, margin: '.5rem 0' }}>{resetMode ? 'নতুন পাসওয়ার্ড সেট করুন' : tab === 'signin' ? 'আপনার ডেস্কে প্রবেশ করুন' : 'রিপোর্টার হিসেবে যোগ দিন'}</h1><p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.8rem', lineHeight: 1.8 }}>সংবাদ পড়া সবার জন্য। নিউজরুমে অবদান রাখতে একটি অ্যাকাউন্ট খুলুন।</p>{!resetMode && <div className="wb-tabs"><button className={`wb-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => setTab('signin')} data-testid="tab-signin">প্রবেশ</button><button className={`wb-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')} data-testid="tab-signup">নিবন্ধন</button></div>}<form className="wb-form-stack" onSubmit={submit}>{!resetMode && tab === 'signup' && <label className="wb-field">আপনার নাম<input value={name} onChange={(event) => setName(event.target.value)} placeholder="নাম লিখুন" autoComplete="name" data-testid="input-name" /></label>}<label className="wb-field">ইমেইল<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" data-testid="input-email" /></label><label className="wb-field">{resetMode ? 'নতুন পাসওয়ার্ড' : 'পাসওয়ার্ড'}<input type="password" value={resetMode ? resetPassword : password} onChange={(event) => resetMode ? setResetPassword(event.target.value) : setPassword(event.target.value)} placeholder="••••••••" autoComplete={resetMode || tab === 'signup' ? 'new-password' : 'current-password'} data-testid={resetMode ? 'input-reset-password' : 'input-password'} /></label>{error && <p style={{ color: 'hsl(var(--destructive))', fontSize: '.75rem', margin: 0 }} role="alert" data-testid="status-login-error">{error}</p>}<button className="wb-button wb-button-primary" type="submit" data-testid="button-submit-auth">{resetMode ? 'পাসওয়ার্ড আপডেট করুন' : tab === 'signin' ? 'প্রবেশ করুন' : 'অ্যাকাউন্ট খুলুন'} <ChevronRight size={15} /></button></form><button type="button" className="wb-link wb-auth-reset" onClick={() => { setResetMode((current) => !current); setError(''); }} data-testid="button-password-reset">{resetMode ? 'প্রবেশে ফিরে যান' : 'পাসওয়ার্ড রিসেট'}</button></section></main>;
}

function Protected({ session, role, t, children }: { session: Session | null; role: UserRole; t: typeof translations.bn; children: ReactNode }) {
  const [, navigate] = useLocation();
  useEffect(() => { if (!session || session.role !== role) navigate('/login'); }, [navigate, role, session]);
  if (!session || session.role !== role) return <div className="wb-empty" style={{ margin: '4rem auto', width: 'min(500px, calc(100% - 28px))' }}><ShieldCheck size={34} /><h2 className="wb-serif">অনুমতি প্রয়োজন</h2><p>{t.signIn} করে এই ডেস্কে প্রবেশ করুন।</p></div>;
  return <>{children}</>;
}

function Admin({ news, setNews, users, setUsers, notify, syncNews }: { news: News[]; setNews: (next: News[] | ((previous: News[]) => News[])) => void; users: User[]; setUsers: (next: User[] | ((previous: User[]) => User[])) => void; notify: (message: string) => void; syncNews: (article: News | string, operation: 'upsert' | 'delete') => Promise<void> }) {
  const [tab, setTab] = useState<'articles' | 'users'>('articles');
  const [editing, setEditing] = useState<News | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('জাতীয়');
  const [authorName, setAuthorName] = useState('সম্পাদকমণ্ডলী');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<NewsStatus>('published');
  const [editorOpen, setEditorOpen] = useState(false);
  const pending = news.filter((article) => article.status === 'pending');

  const resetEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setTitle('');
    setCategory('জাতীয়');
    setAuthorName('সম্পাদকমণ্ডলী');
    setContent('');
    setImageUrl('');
    setStatus('published');
  };
  const openEditor = (article?: News) => {
    if (!article) {
      setEditorOpen(true);
      setEditing(null);
      setTitle('');
      setCategory('জাতীয়');
      setAuthorName('সম্পাদকমণ্ডলী');
      setContent('');
      setImageUrl('');
      setStatus('published');
      return;
    }
    setEditorOpen(true);
    setEditing(article);
    setTitle(article.title);
    setCategory(article.category);
    setAuthorName(article.author_name);
    setContent(article.content);
    setImageUrl(article.image_url);
    setStatus(article.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const saveArticle = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !authorName.trim() || !content.trim()) return;
    const article: News = {
      id: editing?.id || `wb-${Date.now()}`,
      title: title.trim(),
      category,
      excerpt: generateExcerpt(content),
      content: content.trim(),
      image_url: imageUrl.trim() || 'https://images.pexels.com/photos/518245/pexels-photo-518245.jpeg?auto=compress&cs=tinysrgb&w=1200',
      status,
      author_name: authorName.trim(),
      author_id: editing?.author_id || 'u-admin',
      created_at: editing?.created_at || new Date().toISOString(),
      reading_time: Math.max(3, Math.ceil(content.trim().split(/\s+/).length / 180)),
    };
    setNews((current) => editing ? current.map((item) => item.id === article.id ? article : item) : [article, ...current]);
    void syncNews(article, 'upsert');
    notify(editing ? 'প্রতিবেদনটি আপডেট হয়েছে।' : 'নতুন প্রতিবেদন সংরক্ষণ হয়েছে।');
    resetEditor();
  };
  const moderate = (id: string, nextStatus: NewsStatus) => {
    const changed = news.find((article) => article.id === id);
    setNews((current) => current.map((article) => article.id === id ? { ...article, status: nextStatus } : article));
    if (changed) void syncNews({ ...changed, status: nextStatus }, 'upsert');
    notify(nextStatus === 'published' ? 'প্রতিবেদনটি প্রকাশিত হয়েছে।' : 'প্রতিবেদনটি খসড়ায় ফেরত পাঠানো হয়েছে।');
  };
  const deleteArticle = (id: string) => {
    if (!window.confirm('এই প্রতিবেদনটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
    setNews((current) => current.filter((article) => article.id !== id));
    void syncNews(id, 'delete');
    notify('প্রতিবেদনটি মুছে ফেলা হয়েছে।');
  };
  const toggleUser = (id: string) => {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, active: user.active === false } : user));
    notify('ব্যবহারকারীর অ্যাক্সেস আপডেট হয়েছে।');
  };
  const deleteUser = (id: string) => {
    setUsers((current) => current.filter((user) => user.id !== id || user.role === 'admin'));
    notify('রিপোর্টারটি সিস্টেম থেকে সরানো হয়েছে।');
  };
  const addUser = (name: string, email: string, password: string) => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setUsers((current) => [...current, { id: `u-${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase(), password, role: 'reporter', active: true }]);
    notify('নতুন রিপোর্টার যোগ হয়েছে।');
  };

  return <main className="wb-container wb-dashboard">
    <div className="wb-dashboard-head"><div><div className="wb-kicker">নিউজরুম / ADMIN</div><h1 className="wb-serif">সম্পাদনা ডেস্ক</h1><p style={{ color: 'hsl(var(--muted-foreground))', margin: 0 }}>প্রতিটি প্রকাশের আগে তথ্য, ভাষা এবং মানুষের কথা যাচাই করুন।</p></div><span className="wb-status"><ShieldCheck size={13} style={{ marginRight: '.3rem' }} /> নিরাপদ অ্যাক্সেস</span></div>
    <div className="wb-stat-grid"><div className="wb-stat">অপেক্ষমাণ প্রতিবেদন<strong>{pending.length}</strong></div><div className="wb-stat">প্রকাশিত প্রতিবেদন<strong>{news.filter((a) => a.status === 'published').length}</strong></div><div className="wb-stat">সক্রিয় রিপোর্টার<strong>{users.filter((u) => u.role === 'reporter' && u.active !== false).length}</strong></div></div>
    <div className="wb-tabs" style={{ maxWidth: 460 }}><button className={`wb-tab ${tab === 'articles' ? 'active' : ''}`} onClick={() => setTab('articles')} data-testid="tab-moderation">খবর ব্যবস্থাপনা</button><button className={`wb-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')} data-testid="tab-users">রিপোর্টার ও অ্যাক্সেস</button></div>
    {tab === 'articles' ? <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '1rem 0' }}><button className="wb-button wb-button-primary" onClick={() => openEditor()} data-testid="button-new-article"><Plus size={15} /> নতুন খবর</button></div>
      {editorOpen ? <form className="wb-form-stack" onSubmit={saveArticle} style={{ border: '1px solid hsl(var(--border))', padding: '1.2rem', marginBottom: '1.5rem' }}><div className="wb-section-head"><h2 className="wb-serif">{editing ? 'খবর সম্পাদনা' : 'নতুন খবর'}</h2><button type="button" className="wb-icon-button" onClick={resetEditor} aria-label="বন্ধ করুন"><X size={16} /></button></div><label className="wb-field">শিরোনাম<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label className="wb-field">বিভাগ<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="wb-field">প্রতিবেদকের নাম / বাইলাইন<input value={authorName} onChange={(event) => setAuthorName(event.target.value)} required /></label><label className="wb-field">খবরের ছবি / কাভার ইমেজ<div className="wb-image-attachment"><input value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." /><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) readImageFile(file, setImageUrl); }} /><div className="wb-image-preview">{imageUrl ? <img src={imageUrl} alt="কাভার প্রিভিউ" /> : <span>ছবির প্রিভিউ এখানে দেখা যাবে</span>}</div></div></label><label className="wb-field">বিস্তারিত খবর<textarea style={{ minHeight: 220 }} value={content} onChange={(event) => setContent(event.target.value)} required /></label><label className="wb-field">স্ট্যাটাস<select value={status} onChange={(event) => setStatus(event.target.value as NewsStatus)}><option value="published">প্রকাশিত</option><option value="pending">অপেক্ষমাণ</option></select></label><button className="wb-button wb-button-primary wb-submit-full" type="submit"><Check size={14} /> সংরক্ষণ করুন</button></form> : null}
      <ArticleTable articles={news} moderate={moderate} onEdit={openEditor} onDelete={deleteArticle} />
    </> : <UserTable users={users} toggleUser={toggleUser} deleteUser={deleteUser} addUser={addUser} />}
  </main>;
}

function ArticleTable({ articles, moderate, onEdit, onDelete }: { articles: News[]; moderate: (id: string, status: NewsStatus) => void; onEdit: (article: News) => void; onDelete: (id: string) => void }) {
  return <div className="wb-table-wrap"><table className="wb-table"><thead><tr><th>প্রতিবেদন</th><th>বিভাগ</th><th>স্ট্যাটাস</th><th>লেখক</th><th>কাজ</th></tr></thead><tbody>{articles.map((article) => <tr key={article.id} data-testid={`row-article-${article.id}`}><td><strong className="wb-serif" style={{ fontSize: '1rem' }}>{article.title}</strong></td><td>{article.category}</td><td><span className="wb-status">{article.status === 'pending' ? 'অপেক্ষমাণ' : 'প্রকাশিত'}</span></td><td>{article.author_name}</td><td style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>{article.status === 'pending' && <button className="wb-button wb-button-primary" onClick={() => moderate(article.id, 'published')} data-testid={`button-approve-${article.id}`}><Check size={14} /> অনুমোদন</button>}<button className="wb-button" onClick={() => onEdit(article)} data-testid={`button-edit-article-${article.id}`}><FileEdit size={14} /> এডিট</button><button className="wb-button" onClick={() => onDelete(article.id)} data-testid={`button-delete-article-${article.id}`}><Trash2 size={14} /> মুছুন</button></td></tr>)}</tbody></table></div>;
}

function UserTable({ users, toggleUser, deleteUser, addUser }: { users: User[]; toggleUser: (id: string) => void; deleteUser: (id: string) => void; addUser: (name: string, email: string, password: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); addUser(name, email, password); setName(''); setEmail(''); setPassword(''); };
  return <><form className="wb-form-stack" onSubmit={submit} style={{ border: '1px solid hsl(var(--border))', padding: '1.2rem', margin: '1rem 0 1.5rem' }}><h2 className="wb-serif" style={{ margin: 0 }}>নতুন রিপোর্টার যোগ করুন</h2><div className="wb-form-grid"><label className="wb-field">নাম<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label className="wb-field">ইমেইল<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="wb-field">অস্থায়ী পাসওয়ার্ড<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label></div><button className="wb-button wb-button-primary" type="submit"><Plus size={14} /> রিপোর্টার যোগ করুন</button></form><div className="wb-table-wrap"><table className="wb-table"><thead><tr><th>নাম</th><th>ইমেইল</th><th>ভূমিকা</th><th>অ্যাক্সেস</th><th>কাজ</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} data-testid={`row-user-${user.id}`}><td><strong>{user.name}</strong></td><td>{user.email}</td><td><span className="wb-status">{user.role}</span></td><td><button className="wb-button" onClick={() => toggleUser(user.id)} disabled={user.role === 'admin'} data-testid={`button-toggle-user-${user.id}`}>{user.active === false ? 'সক্রিয় করুন' : 'স্থগিত করুন'}</button></td><td><button className="wb-button" onClick={() => deleteUser(user.id)} disabled={user.role === 'admin'} data-testid={`button-delete-user-${user.id}`}><Trash2 size={14} /> মুছুন</button></td></tr>)}</tbody></table></div></>;
}

function Reporter({ news, setNews, session, notify, syncNews }: { news: News[]; setNews: (next: News[] | ((previous: News[]) => News[])) => void; session: Session | null; notify: (message: string) => void; syncNews: (article: News | string, operation: 'upsert' | 'delete') => Promise<void> }) {
  const own = news.filter((article) => article.author_id === session?.userId);
  const [editing, setEditing] = useState<News | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('জাতীয়');
  const [authorName, setAuthorName] = useState(session?.name || '');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const startNew = () => { setEditing(null); setTitle(''); setCategory('জাতীয়'); setAuthorName(session?.name || ''); setContent(''); setImageUrl(''); };
  const edit = (article: News) => { setEditing(article); setTitle(article.title); setCategory(article.category); setAuthorName(article.author_name); setContent(article.content || ''); setImageUrl(article.image_url); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !authorName.trim() || !content.trim()) return;
    const article: News = editing ? { ...editing, title: title.trim(), category, excerpt: generateExcerpt(content), content: content.trim(), image_url: imageUrl || editing.image_url, author_name: authorName.trim(), reading_time: Math.max(3, Math.ceil(content.split(/\s+/).length / 180)) } : { id: `wb-${Date.now()}`, title: title.trim(), category, excerpt: generateExcerpt(content), content: content.trim(), image_url: imageUrl || 'https://images.pexels.com/photos/518245/pexels-photo-518245.jpeg?auto=compress&cs=tinysrgb&w=1200', status: 'pending', author_name: authorName.trim(), author_id: session?.userId || '', created_at: new Date().toISOString(), reading_time: Math.max(3, Math.ceil(content.split(/\s+/).length / 180)) };
    if (editing) setNews((current) => current.map((item) => item.id === article.id ? article : item)); else setNews((current) => [article, ...current]);
    void syncNews(article, 'upsert');
    notify(editing ? 'খসড়া আপডেট হয়েছে।' : 'প্রতিবেদনটি সম্পাদনা ডেস্কে পাঠানো হয়েছে.');
    startNew();
  };
  return <main className="wb-container wb-dashboard"><div className="wb-dashboard-head"><div><div className="wb-kicker">রিপোর্টার ডেস্ক / WORKSPACE</div><h1 className="wb-serif">আপনার খাতা</h1><p style={{ color: 'hsl(var(--muted-foreground))', margin: 0 }}>ভাবনা থেকে প্রতিবেদন—সম্পাদনা ডেস্কে পাঠানোর আগে একবার পড়ে নিন।</p></div><button className="wb-button wb-button-primary" onClick={startNew} data-testid="button-new-submission"><PenLine size={15} /> নতুন প্রতিবেদন</button></div><section className="wb-reporter-layout"><form className="wb-form-stack" onSubmit={save}><h2 className="wb-serif" style={{ margin: 0 }}>{editing ? 'খবর সম্পাদনা' : 'নতুন প্রতিবেদন'}</h2><label className="wb-field">শিরোনাম<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="একটি স্পষ্ট, সংক্ষিপ্ত শিরোনাম" data-testid="input-submission-title" required /></label><label className="wb-field">বিভাগ<select value={category} onChange={(event) => setCategory(event.target.value as Category)} data-testid="select-submission-category">{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="wb-field">প্রতিবেদকের নাম / বাইলাইন<input value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="নামের বানান লিখুন" data-testid="input-submission-author" required /></label><label className="wb-field">খবরের ছবি / কাভার ইমেজ<div className="wb-image-attachment"><input value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." data-testid="input-submission-image-url" /><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) readImageFile(file, setImageUrl); }} data-testid="input-submission-image-file" /><div className="wb-image-preview">{imageUrl ? <img src={imageUrl} alt="কাভার প্রিভিউ" /> : <span>ছবির প্রিভিউ এখানে দেখা যাবে</span>}</div></div></label><label className="wb-field">বিস্তারিত খবর<textarea style={{ minHeight: 260 }} value={content} onChange={(event) => setContent(event.target.value)} placeholder="অনুচ্ছেদ আলাদা করতে খালি লাইন ব্যবহার করুন" data-testid="input-submission-content" required /></label><button className="wb-button wb-button-primary wb-submit-full" type="submit" data-testid="button-submit-submission">{editing ? 'খসড়া সংরক্ষণ' : 'সম্পাদনা ডেস্কে পাঠান'} <ChevronRight size={14} /></button></form><aside><div className="wb-section-head"><h2 className="wb-serif">আপনার প্রতিবেদন</h2><span>{own.length}টি</span></div>{own.length ? own.map((article) => <div key={article.id} style={{ padding: '1rem 0', borderBottom: '1px solid hsl(var(--border))' }}><span className="wb-status">{article.status === 'pending' ? 'পর্যালোচনায়' : 'প্রকাশিত'}</span><h3 className="wb-serif" style={{ margin: '.45rem 0', fontSize: '1.1rem' }}>{article.title}</h3><button className="wb-button" onClick={() => edit(article)} data-testid={`button-edit-submission-${article.id}`}><FileEdit size={14} /> সম্পাদনা</button></div>) : <div className="wb-empty" style={{ marginTop: '1rem' }}><PenLine size={25} /><p>আপনার প্রথম প্রতিবেদনটি লিখুন।</p></div>}</aside></section></main>;
}

function Footer() {
  return <footer className="wb-footer"><div className="wb-container wb-footer-grid"><div><div className="wb-footer-brand wb-display">The Weekly<br />Bengal</div><p style={{ maxWidth: 320, color: 'hsl(var(--primary-foreground) / .65)', fontSize: '.8rem', lineHeight: 1.8 }}>প্রতিদিনের তাড়াহুড়োর বাইরে, প্রতি সপ্তাহে বেছে নেওয়া কিছু জরুরি গল্প।</p></div><div><h3>পাঠের পথ</h3><div style={{ display: 'grid', gap: '.55rem' }}><Link href="/" className="wb-link" data-testid="link-footer-home">প্রচ্ছদ</Link><Link href="/search" className="wb-link" data-testid="link-footer-search">আর্কাইভ</Link><Link href="/login" className="wb-link" data-testid="link-footer-login">রিপোর্টার হন</Link></div></div><div><h3>যোগাযোগ</h3><div style={{ display: 'grid', gap: '.55rem' }}><a href="mailto:desk@weeklybengal.com" className="wb-link" data-testid="link-footer-email"><Mail size={13} style={{ verticalAlign: 'middle' }} /> desk@weeklybengal.com</a><span style={{ color: 'hsl(var(--primary-foreground) / .65)', fontSize: '.78rem' }}>ঢাকা · বাংলাদেশ</span><span><Instagram size={15} /></span></div></div></div><div className="wb-container wb-footer-bottom"><span>© ২০২৫ The Weekly Bengal</span><span>একটি স্বাধীন সম্পাদকীয় উদ্যোগ</span></div></footer>;
}

function NotFound({ t }: { t: typeof translations.bn }) {
  return <main className="wb-container"><div className="wb-empty" style={{ margin: '6rem 0' }}><Newspaper size={38} /><div className="wb-kicker">৪০৪ / NOT FOUND</div><h1 className="wb-serif">এই পাতাটি ছাপা হয়নি</h1><p>ঠিকানাটি বদলে গেছে, অথবা গল্পটি এখনও সম্পাদকীয় ডেস্কে।</p><Link href="/" className="wb-button wb-button-primary" data-testid="button-not-found-home">{t.home}<ChevronRight size={14} /></Link></div></main>;
}

export default App;