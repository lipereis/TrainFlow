import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";

export async function WhatSection() {
  const t = await getTranslations("landing");

  return (
    <section className="py-20 sm:py-24">
      <Container className="max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("whatTitle")}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t("whatBody")}</p>
      </Container>
    </section>
  );
}
