export type PublicNavItem = {
  label: string;
  href: string;
};

export const publicNavigation: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Amenities", href: "/amenities" },
  { label: "Attractions", href: "/attractions" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];
