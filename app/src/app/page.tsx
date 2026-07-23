'use client';

import Layout from '../components/layout/Layout';
import {
  NeuralNetworkCanvas,
  HeroSection,
  ValuePropsSection,
  HowItWorksSection,
  TrustStackSection,
  PrivacySection,
  FinalCTASection
} from '../components/landing';

export default function Home() {
  return (
    <Layout>
      {/* Neural Network Background */}
      <NeuralNetworkCanvas />

      {/* Hero Section */}
      <HeroSection />

      {/* Value Propositions */}
      <ValuePropsSection />

      {/* How It Works Timeline */}
      <HowItWorksSection />

      {/* 0G Infrastructure Trust */}
      <TrustStackSection />

      {/* Privacy Guarantee */}
      <PrivacySection />

      {/* Final Call to Action */}
      <FinalCTASection />
    </Layout>
  );
}