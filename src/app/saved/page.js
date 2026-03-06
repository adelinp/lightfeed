import { AppShell } from "@/components/app-shell";
import { SavedArticlesList } from "@/components/saved-articles-list";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Saved Articles",
  description: "Articles you bookmarked for later reading.",
};

export default function SavedArticlesPage() {
  return (
    <AppShell>
      <SavedArticlesList />
    </AppShell>
  );
}