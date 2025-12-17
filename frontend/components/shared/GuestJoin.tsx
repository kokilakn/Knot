import { Button } from '@/components/ui';

export default function GuestJoin({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="secondary"
      color="logo"
      size="lg"
      fullWidth
      onClick={onClick}
    >
      Join an event as a guest
    </Button>
  );
}
