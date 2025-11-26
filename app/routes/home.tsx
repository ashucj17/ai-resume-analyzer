import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import { resumes } from "../../constants/index";
import ResumeCard from "~/components/ResumeCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
  <Navbar />

  <section className="main-section">
    <div className="page-heading py-16 text-center">
      <h1 className="text-4xl font-bold">Track Job Applications & Resume Assessment</h1>
      <h2 className="text-lg text-gray-700 mt-2">
        Evaluate your submission with automated AI feedback.
      </h2>
    </div>

    {resumes.length > 0 && (
      <div className="resumes-section grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 pb-10">
        {resumes.map((resume) => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}
      </div>
    )}
  </section>
</main>

  );
}
