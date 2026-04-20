import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";

function FAQs() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        <div className="bg-[#1f4e79] py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-4 text-center lg:px-12">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
              Frequently Asked Questions
            </h1>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-16 text-center lg:px-8">
          <p className="text-lg text-gray-600">
            Our FAQs page is coming soon. If you have a question that
            can&apos;t wait, please contact us at{" "}
            <a
              href="mailto:events@koi.edu.au"
              className="text-[#f36f21] underline hover:opacity-80"
            >
              events@koi.edu.au
            </a>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default FAQs;
