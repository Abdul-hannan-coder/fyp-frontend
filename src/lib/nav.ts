import {
  LayoutDashboard,
  Users,
  Building2,
  BedDouble,
  Wallet,
  UserCog,
  Boxes,
  UtensilsCrossed,
  Megaphone,
  BarChart3,
  CalendarCheck,
  DoorOpen,
  Footprints,
  LifeBuoy,
  FileText,
  GraduationCap,
  Shield,
  Sparkles,
  Layers,
  LayoutGrid,
  RotateCcw,
  ArrowLeftRight,
  Package,
  type LucideIcon,
} from "lucide-react";

export type Role = "admin" | "warden" | "student";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
};

export type NavSection = {
  heading?: string;
  items: NavItem[];
};

export const ROLE_META: Record<
  Role,
  { label: string; home: string; description: string }
> = {
  admin: {
    label: "Administrator",
    home: "/admin",
    description: "Full control of the hostel",
  },
  warden: {
    label: "Warden",
    home: "/warden",
    description: "Day-to-day operations",
  },
  student: {
    label: "Resident",
    home: "/student",
    description: "Your stay, simplified",
  },
};

export const NAV: Record<Role, NavSection[]> = {
  admin: [
    {
      items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
    },
    {
      heading: "Management",
      items: [
        {
          label: "Users",
          href: "/admin/users",
          icon: Users,
          children: [
            { label: "Applications", href: "/admin/users", icon: FileText },
            { label: "Students", href: "/admin/users/students", icon: GraduationCap },
            { label: "Wardens", href: "/admin/users/wardens", icon: Shield },
            { label: "Staff", href: "/admin/users/staff", icon: UserCog },
          ],
        },
        {
          label: "Hostel Setup",
          href: "/admin/setup",
          icon: Building2,
          children: [
            { label: "Overview", href: "/admin/setup", icon: LayoutGrid },
            { label: "Amenities", href: "/admin/setup/amenities", icon: Sparkles },
            { label: "Blocks", href: "/admin/setup/blocks", icon: Building2 },
            { label: "Floors", href: "/admin/setup/floors", icon: Layers },
            { label: "Rooms & Types", href: "/admin/setup/rooms", icon: DoorOpen },
            { label: "Packages", href: "/admin/setup/packages", icon: Package },
          ],
        },
        { label: "Allocations", href: "/admin/allocations", icon: BedDouble },
        { label: "Transfers", href: "/admin/transfers", icon: ArrowLeftRight },
        { label: "Finance", href: "/admin/finance", icon: Wallet },
        { label: "Refunds", href: "/admin/refunds", icon: RotateCcw },
        { label: "Staff", href: "/admin/staff", icon: UserCog },
        { label: "Assets", href: "/admin/assets", icon: Boxes },
      ],
    },
    {
      heading: "Engagement",
      items: [
        { label: "Mess", href: "/admin/mess", icon: UtensilsCrossed },
        {
          label: "Announcements",
          href: "/admin/announcements",
          icon: Megaphone,
        },
        { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      ],
    },
  ],
  warden: [
    {
      items: [{ label: "Dashboard", href: "/warden", icon: LayoutDashboard }],
    },
    {
      heading: "Operations",
      items: [
        { label: "Allocation", href: "/warden/allocation", icon: BedDouble },
        { label: "Transfers", href: "/warden/transfers", icon: ArrowLeftRight },
        {
          label: "Attendance & Leave",
          href: "/warden/attendance",
          icon: CalendarCheck,
        },
        { label: "Visitors", href: "/warden/visitors", icon: Footprints },
        { label: "Support", href: "/warden/support", icon: LifeBuoy },
        { label: "Rooms", href: "/warden/rooms", icon: DoorOpen },
      ],
    },
    {
      heading: "Community",
      items: [
        {
          label: "Announcements",
          href: "/warden/announcements",
          icon: Megaphone,
        },
        { label: "Mess", href: "/warden/mess", icon: UtensilsCrossed },
        { label: "Fees", href: "/warden/fees", icon: Wallet },
      ],
    },
  ],
  student: [
    {
      items: [{ label: "Dashboard", href: "/student", icon: LayoutDashboard }],
    },
    {
      heading: "My stay",
      items: [
        { label: "My Room", href: "/student/room", icon: BedDouble },
        { label: "Room Transfer", href: "/student/transfers", icon: ArrowLeftRight },
        { label: "Fees", href: "/student/fees", icon: Wallet },
        { label: "Refunds", href: "/student/refunds", icon: RotateCcw },
        { label: "Mess", href: "/student/mess", icon: UtensilsCrossed },
      ],
    },
    {
      heading: "Services",
      items: [
        {
          label: "Attendance & Leave",
          href: "/student/attendance",
          icon: CalendarCheck,
        },
        { label: "Visitors", href: "/student/visitors", icon: Footprints },
        { label: "Support", href: "/student/support", icon: LifeBuoy },
        {
          label: "Notices",
          href: "/student/announcements",
          icon: Megaphone,
        },
      ],
    },
  ],
};
