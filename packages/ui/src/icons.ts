/**
 * Lucide icon map for dynamic icon rendering.
 * Components that accept icon names as strings use this map
 * to resolve the corresponding Lucide React component.
 */
import {
  Search,
  X,
  XCircle,
  Check,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Menu,
  Settings,
  User,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Heart,
  Star,
  Home,
  Bell,
  ShoppingCart,
  Trash2,
  Pencil,
  Copy,
  Share2,
  Link,
  Globe,
  MapPin,
  Map,
  Calendar,
  Clock,
  Camera,
  Image,
  FileText,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Info,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  Zap,
  Moon,
  Sun,
  Palette,
  List,
  LayoutGrid,
  Layers,
  Rocket,
  BarChart3,
  TrendingUp,
  Tag,
  CreditCard,
  Key,
  ShieldCheck,
  FlaskConical,
  BookOpen,
  Terminal,
  GitBranch,
  Building,
  Compass,
  Sparkles,
  Play,
  Square,
  MessageCircle,
  CloudOff,
  Smartphone,
  Monitor,
  Fingerprint,
  Maximize2,
  Minimize2,
  LogOut,
  LogIn,
  MoreHorizontal,
  MoreVertical,
  Flag,
  Filter,
  SlidersHorizontal,
  Navigation,
  ArrowLeftRight,
  Puzzle,
  Hourglass,
  Languages,
  type LucideIcon,
} from 'lucide-react-native'

/**
 * Map of Ionicons-style icon names to Lucide icon components.
 * Used for backward compatibility where icon names are passed as strings.
 */
export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  // Search
  'search': Search,
  'search-outline': Search,

  // Close / X
  'close': X,
  'close-outline': X,
  'close-circle': XCircle,
  'close-circle-outline': XCircle,

  // Check
  'checkmark': Check,
  'checkmark-circle': CheckCircle2,
  'checkmark-circle-outline': CheckCircle2,

  // Arrows
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,

  // Chevrons
  'chevron-back': ChevronLeft,
  'chevron-forward': ChevronRight,
  'chevron-forward-outline': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-down-outline': ChevronDown,
  'chevron-up': ChevronUp,

  // Add / Remove
  'add': Plus,
  'remove': Minus,

  // Menu
  'menu': Menu,
  'menu-outline': Menu,

  // Settings
  'settings': Settings,
  'settings-outline': Settings,
  'construct-outline': Settings,

  // People
  'person': User,
  'person-outline': User,
  'people': Users,
  'people-outline': Users,

  // Communication
  'mail': Mail,
  'mail-outline': Mail,
  'chatbubble-outline': MessageCircle,

  // Security
  'lock-closed': Lock,
  'lock-closed-outline': Lock,
  'key': Key,
  'key-outline': Key,
  'shield-checkmark': ShieldCheck,
  'shield-checkmark-outline': ShieldCheck,
  'finger-print-outline': Fingerprint,

  // Eye
  'eye': Eye,
  'eye-outline': Eye,
  'eye-off': EyeOff,
  'eye-off-outline': EyeOff,

  // Favorites
  'heart': Heart,
  'heart-outline': Heart,
  'star': Star,
  'star-outline': Star,

  // Navigation
  'home': Home,
  'home-outline': Home,
  'compass': Compass,
  'compass-outline': Compass,
  'navigate-outline': Navigation,
  'location': MapPin,
  'location-outline': MapPin,
  'map': Map,
  'map-outline': Map,

  // Notifications
  'notifications': Bell,
  'notifications-outline': Bell,

  // Shopping
  'cart': ShoppingCart,
  'cart-outline': ShoppingCart,
  'pricetag-outline': Tag,
  'pricetags-outline': Tag,
  'card': CreditCard,
  'card-outline': CreditCard,

  // Edit / Delete
  'trash': Trash2,
  'trash-outline': Trash2,
  'create-outline': Pencil,
  'pencil-outline': Pencil,
  'copy-outline': Copy,

  // Share
  'share-outline': Share2,
  'share-social-outline': Share2,
  'link': Link,
  'link-outline': Link,

  // Web / Globe
  'globe': Globe,
  'globe-outline': Globe,
  'language-outline': Languages,

  // Time / Calendar
  'calendar': Calendar,
  'calendar-outline': Calendar,
  'time': Clock,
  'time-outline': Clock,
  'hourglass-outline': Hourglass,

  // Media
  'camera': Camera,
  'camera-outline': Camera,
  'image': Image,
  'image-outline': Image,
  'play': Play,
  'stop': Square,

  // Files / Documents
  'document-text-outline': FileText,
  'book-outline': BookOpen,

  // Cloud / Storage
  'cloud': Cloud,
  'cloud-outline': Cloud,
  'cloud-upload-outline': Upload,
  'cloud-offline-outline': CloudOff,
  'download-outline': Download,
  'upload-outline': Upload,

  // Refresh / Sync
  'refresh': RefreshCw,
  'refresh-outline': RefreshCw,
  'sync-outline': RefreshCw,

  // Info / Help / Alerts
  'information-circle': Info,
  'information-circle-outline': Info,
  'help-circle': HelpCircle,
  'help-circle-outline': HelpCircle,
  'warning-outline': AlertTriangle,
  'alert-circle': AlertCircle,
  'alert-circle-outline': AlertCircle,

  // Theme
  'moon': Moon,
  'moon-outline': Moon,
  'sunny': Sun,
  'sunny-outline': Sun,
  'color-palette-outline': Palette,

  // Layout
  'list': List,
  'list-outline': List,
  'grid-outline': LayoutGrid,
  'layers': Layers,
  'layers-outline': Layers,

  // Tech
  'flash-outline': Zap,
  'rocket': Rocket,
  'rocket-outline': Rocket,
  'terminal-outline': Terminal,
  'git-network-outline': GitBranch,
  'flask-outline': FlaskConical,
  'sparkles': Sparkles,
  'sparkles-outline': Sparkles,
  'extension-puzzle': Puzzle,
  'extension-puzzle-outline': Puzzle,

  // Charts
  'bar-chart-outline': BarChart3,
  'stats-chart-outline': TrendingUp,
  'trending-up': TrendingUp,

  // Business
  'business-outline': Building,

  // Device
  'phone-portrait-outline': Smartphone,
  'desktop-outline': Monitor,

  // Window
  'expand-outline': Maximize2,
  'contract-outline': Minimize2,

  // Auth
  'log-out-outline': LogOut,
  'log-in-outline': LogIn,

  // More
  'ellipsis-horizontal': MoreHorizontal,
  'ellipsis-vertical': MoreVertical,

  // Misc
  'flag': Flag,
  'flag-outline': Flag,
  'funnel-outline': Filter,
  'options-outline': SlidersHorizontal,
  'swap-horizontal': ArrowLeftRight,
}

export type LucideIconName = keyof typeof LUCIDE_ICON_MAP

/**
 * Resolves an icon name string to a Lucide icon component.
 * Falls back to HelpCircle if name is not found.
 */
export function getLucideIcon(name: string): LucideIcon {
  return LUCIDE_ICON_MAP[name] ?? HelpCircle
}

export type { LucideIcon }
