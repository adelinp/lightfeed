import { AppShell } from "@/components/app-shell";
import { ArchiveLinkSettingsControl } from "@/components/archive-link-settings-control";
import { ThemeSettingsControl } from "@/components/theme-settings-control";
import Link from "next/link";
import { PlusCircle } from "lucide";
import LucideIcon from "@/components/lucide-icon";

export const metadata = {
  title: "Settings",
  description: "Manage application preferences and reading behavior.",
};

export default function SettingsPage() {
  return (
    <AppShell>
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
            Settings
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700 dark:text-stone-300">
            Global application controls will live here. The current view is a structural placeholder for privacy, refresh, and default-feed behavior.
          </p>
        </div>

        <Link
          href="/settings/feeds/new"
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-md bg-stone-900 px-4 text-sm font-bold text-stone-50 no-underline transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          <LucideIcon icon={PlusCircle} />
          Create Feed
        </Link>
      </section>

      <section className="mb-6">
        <ThemeSettingsControl />
      </section>

      <section className="mb-6">
        <ArchiveLinkSettingsControl />
      </section>
    </AppShell>
  );
}