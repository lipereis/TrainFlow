import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const TESTIMONIALS = [
  { quote: "t1Quote", name: "t1Name", role: "t1Role" },
  { quote: "t2Quote", name: "t2Name", role: "t2Role" },
  { quote: "t3Quote", name: "t3Name", role: "t3Role" },
] as const;

export async function TestimonialsSection() {
  const t = await getTranslations("landing");

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("testimonialsTitle")}
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <Card key={item.name} className="flex flex-col p-6">
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                &ldquo;{t(item.quote)}&rdquo;
              </blockquote>
              <footer className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">{t(item.name)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(item.role)}</p>
              </footer>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">{t("testimonialsNote")}</p>
      </Container>
    </section>
  );
}
