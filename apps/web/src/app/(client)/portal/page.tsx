import { getTranslations } from "next-intl/server";

export default async function ClientPortalPage() {
  const t = await getTranslations("portal");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {t("title")}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
    </section>
  );
}
