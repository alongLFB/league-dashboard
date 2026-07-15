import { getTranslations } from 'next-intl/server';
import { getUserProfile } from '@/app/actions/user';
import { redirect } from 'next/navigation';
import { ProfileClient } from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const t = await getTranslations('Profile');
  const res = await getUserProfile();

  if (!res.success || !res.user) {
    redirect('/login');
  }

  // Pass down serializable user object
  const user = {
    username: res.user.username,
    nickname: res.user.nickname,
    email: res.user.email,
  };

  return (
    <main className="max-w-2xl mx-auto px-6 mt-16 pb-24 relative z-10">
      <div className="mb-10">
        <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500 uppercase">
          {t('title')}
        </h2>
      </div>
      
      <ProfileClient user={user} />
    </main>
  );
}
