'use client';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function GuestJoin({ onClick }: { onClick?: () => void }) {
  const router = useRouter();

  const handleGuestJoin = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/join-event');
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      color="logo"
      size="lg"
      fullWidth
      onClick={handleGuestJoin}
    >
      Join an event as a guest
    </Button>
  );
}
