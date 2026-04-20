import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";

function ReportIssue() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        <div className="bg-[#1f4e79] py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-4 text-center lg:px-12">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
              Report an Issue
            </h1>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-16 text-center lg:px-8">
          <p className="text-lg text-gray-600">
            Our issue reporting tool is coming soon. To report a problem right
            now, please email us at{" "}
            <a
              href="mailto:events@koi.edu.au"
              className="text-[#f36f21] underline hover:opacity-80"
            >
              events@koi.edu.au
            </a>{" "}
            with details about the issue you encountered.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ReportIssue;
