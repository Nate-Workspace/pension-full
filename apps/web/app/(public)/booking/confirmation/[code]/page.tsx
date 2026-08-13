import { PublicBookingConfirmation } from "@/components/public/public-booking-confirmation";

type BookingConfirmationPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function BookingConfirmationPage({
  params,
}: BookingConfirmationPageProps) {
  const { code } = await params;

  return <PublicBookingConfirmation code={decodeURIComponent(code)} />;
}
