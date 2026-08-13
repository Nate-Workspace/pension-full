export type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

export const dashboardNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Rooms", href: "/dashboard/rooms" },
  { label: "Bookings", href: "/bookings" },
  { label: "Payments", href: "/payments" },
  { label: "Reports", href: "/reports", adminOnly: true },
  { label: "Website (CMS)", href: "/cms", adminOnly: true },
  { label: "Settings", href: "/settings", adminOnly: true },
];
