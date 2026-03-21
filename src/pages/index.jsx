import Navbar from "../components/layout/navbar.jsx";
import HeroSection from "../components/common/utility/heroSection.jsx";
import FeaturesSection from "../components/common/utility/featuresSection.jsx";
import CategoriesSection from "../components/common/utility/categoriesSection.jsx";
import FeaturedEventsSection from "../components/common/utility/featuresEvents.jsx";
import AIRecommendationsSection from "../components/common/utility/aiRecomendationSection.jsx";
import TestimonialsSection from "../components/common/utility/testomonialSection.jsx";
import CTASection from "../components/common/utility/CTASection.jsx";
import Footer from "../components/layout/footer.jsx";

function Index() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CategoriesSection />
      <FeaturedEventsSection />
      <AIRecommendationsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  );
}

export default Index;
