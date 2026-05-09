import { type FC } from 'react';

export const iconConfig = {
  primary:   { size: 24, strokeWidth: 1.5, className: 'text-primary' },
  secondary: { size: 20, strokeWidth: 1.5, className: 'text-muted-foreground' },
  muted:     { size: 16, strokeWidth: 1.5, className: 'text-muted-foreground/60' },
  success:   { size: 20, strokeWidth: 1.5, className: 'text-success' },
  error:     { size: 20, strokeWidth: 1.5, className: 'text-destructive' },
  white:     { size: 20, strokeWidth: 1.5, className: 'text-primary-foreground' },
} as const;

export type IconVariant = keyof typeof iconConfig;

// Re-export commonly used Lucide icons for convenience
export {
  Music4, Disc3, Clapperboard, Video, Award, Verified, ShieldCheck, Ban,
  Banknote, ThumbsUp, Eye, Bot, XCircle, AlertTriangle,
  Building, Upload, FileMusic, Users, CheckCircle, CreditCard, Star,
  PieChart, ArrowRight, ChevronDown, Wallet, BarChart3, ListMusic, Rocket,
  Shuffle, RefreshCw, Cpu, TrendingDown, Search, PenTool, TrendingUp,
  Calculator, Settings, LogOut, LayoutDashboard, ClipboardCheck,
  Music, Play, Radio, Headphones, Mic, Volume2,
  User, Menu, X, Plus, Minus, ArrowLeft,
  Sparkles,
} from 'lucide-react';
