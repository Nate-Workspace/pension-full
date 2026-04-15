export type NavItem = {
  label: string;
  href: string;
};

export const dashboardNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Rooms", href: "/rooms" },
  { label: "Bookings", href: "/bookings" },
  { label: "Payments", href: "/payments" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];
