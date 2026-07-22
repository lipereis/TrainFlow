import { getTranslations } from "next-intl/server";

export async function ComingSoonPage({ title }: { title: string }) {
  const t = await getTranslations("common");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("comingSoon")}</p>
    </section>
  );
}
