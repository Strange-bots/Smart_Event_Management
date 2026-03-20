import Navbar from "../components/layout/navbar.jsx";
import HeroSection from "../components/common/utility/heroSection.jsx";
import Footer from "../components/layout/footer.jsx";
import CategoriesSection from "../components/common/utility/categoriesSection.jsx";
import FeaturedEventsSection from "../components/common/utility/featuresEvents.jsx";

function Index() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <CategoriesSection/>
      <FeaturedEventsSection />
      <Footer />
    </>
  );
}

export default Index;
