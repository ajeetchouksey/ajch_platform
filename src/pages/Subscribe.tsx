import { Mail } from 'lucide-react';
import { GlassCard, SectionHeader } from '@/components/ui';
import { SubscribeForm } from '@/components/SubscribeForm';

export default function Subscribe() {
  const hasForm = !!import.meta.env.VITE_SUBSCRIBE_WORKER_URL;

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <SectionHeader
        title="Stay in the loop"
        icon={Mail}
        subtitle="Get AI learning updates, new exam guides, and tool releases — straight to your inbox. No spam, unsubscribe any time."
        as="h1"
        iconColor="text-violet-400"
      />
      <div className="mt-8">
        <GlassCard accent="violet">
          <div className="p-6 sm:p-8">
            {hasForm ? (
              <SubscribeForm />
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">
                Newsletter coming soon — check back later.
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
