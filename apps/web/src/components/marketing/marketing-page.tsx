import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Hero } from "@/components/marketing/hero";
import { WhatSection } from "@/components/marketing/what-section";
import { HowSection } from "@/components/marketing/how-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { CompareSection } from "@/components/marketing/compare-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export async function MarketingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <main>
        <Hero />
        <WhatSection />
        <HowSection />
        <FeaturesSection />
        <CompareSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
