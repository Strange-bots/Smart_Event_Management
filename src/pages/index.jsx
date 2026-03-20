import Navbar from "../components/layout/navbar.jsx";
import HeroSection from "../components/common/utility/heroSection.jsx";
import Footer from "../components/layout/footer.jsx";
import CategoriesSection from "../components/common/utility/categoriesSection.jsx";

function Index() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <CategoriesSection/>
      <Footer />
    </>
  );
}

export default Index;
