import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const FEATURES = [
  { title: "featWorkout", body: "featWorkoutBody" },
  { title: "featClients", body: "featClientsBody" },
  { title: "featLibrary", body: "featLibraryBody" },
  { title: "featTemplates", body: "featTemplatesBody" },
  { title: "featAi", body: "featAiBody" },
  { title: "featPdf", body: "featPdfBody" },
  { title: "featExcel", body: "featExcelBody" },
  { title: "featNotes", body: "featNotesBody" },
  { title: "featFast", body: "featFastBody" },
  { title: "featResponsive", body: "featResponsiveBody" },
  { title: "featCloud", body: "featCloudBody" },
] as const;

export async function FeaturesSection() {
  const t = await getTranslations("landing");

  return (
    <section id="features" className="py-20 sm:py-24">
      <Container>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("featuresTitle")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("featuresSubtitle")}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => (
            <Card key={feat.title} className="p-5">
              <h3 className="font-medium text-foreground">{t(feat.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(feat.body)}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
