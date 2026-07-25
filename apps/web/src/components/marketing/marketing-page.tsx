import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Hero } from "@/components/marketing/hero";
import { ProductRevealSection } from "@/components/marketing/product-reveal-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { HowSection } from "@/components/marketing/how-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { CompareSection } from "@/components/marketing/compare-section";
import { BuilderShowcaseSection } from "@/components/marketing/builder-showcase-section";
import { ExportShowcaseSection } from "@/components/marketing/export-showcase-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { BetaSection } from "@/components/marketing/beta-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export async function MarketingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <main>
        <Hero />
        <ProductRevealSection />
        <ProblemSection />
        <HowSection />
        <FeaturesSection />
        <CompareSection />
        <BuilderShowcaseSection />
        <ExportShowcaseSection />
        <PricingSection />
        <FaqSection />
        <BetaSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
