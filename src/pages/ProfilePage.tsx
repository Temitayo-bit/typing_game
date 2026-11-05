import { ProfileForm } from '../components/ProfileForm';
import { SoundToggle } from '../components/SoundToggle';
import { ThemePicker } from '../components/ThemePicker';
import { Button, Card } from '../components/ui';
import { signOut } from '../lib/auth';
import type { Profile } from '../lib/profile';

export type Account = { userId: string; email: string; profile: Profile; setProfile: (p: Profile) => void };

export function ProfilePage({ account }: { account: Account | null }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 font-display text-[34px] font-semibold">{account ? account.profile.displayName : 'Settings'}</h1>
      {account && (
        <Card className="flex flex-col gap-4">
          <span className="font-bold">Your profile</span>
          <ProfileForm userId={account.userId} initial={account.profile} submitLabel="Save changes" onSaved={account.setProfile} />
        </Card>
      )}
      <Card className="flex flex-col gap-3">
        <span className="font-bold">Theme</span>
        <ThemePicker />
      </Card>
      <Card className="flex flex-col gap-3">
        <span className="font-bold">Sounds</span>
        <SoundToggle />
      </Card>
      {account && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted">
            Signed in as <strong className="text-ink">{account.email}</strong>
          </span>
          <Button kind="soft" onClick={() => void signOut()}>
            Sign out
          </Button>
        </Card>
      )}
    </div>
  );
}
