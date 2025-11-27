import React, {  useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

type FormValues = {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
};

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { fs, ai, kv } = usePuterStore();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Clear status on file change
  useEffect(() => {
    setStatusText("");
    setError(null);
  }, [file]);

  const handleFileSelect = useCallback((f: File | null) => {
    setFile(f);
  }, []);

  const analyze = async (values: FormValues, selectedFile: File) => {
    setIsProcessing(true);
    setError(null);

    const safeSetStatus = (s: string) => {
      setStatusText(s);
      console.info(s);
    };

    try {
      safeSetStatus("Uploading resume...");
      const uploadedFile = await fs.upload([selectedFile]);
      if (!uploadedFile || !("path" in uploadedFile) || !uploadedFile.path) {
        throw new Error("Failed to upload resume");
      }

      safeSetStatus("Converting PDF to image (for preview)...");
      const imgRes = await convertPdfToImage(selectedFile);
      if (!imgRes.file) throw new Error(imgRes.error || "PDF conversion failed");

      safeSetStatus("Uploading preview image...");
      const uploadedImage = await fs.upload([imgRes.file]);
      if (!uploadedImage || !("path" in uploadedImage) || !uploadedImage.path) {
        throw new Error("Failed to upload image");
      }

      safeSetStatus("Saving metadata...");
      const id = generateUUID();
      const data = {
        id,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName: values.companyName,
        jobTitle: values.jobTitle,
        jobDescription: values.jobDescription,
        feedback: null as unknown as any,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`resume:${id}`, JSON.stringify(data));

      safeSetStatus("Requesting AI analysis...");
      const aiResponse = await ai.feedback(uploadedFile.path, prepareInstructions({ jobTitle: values.jobTitle, jobDescription: values.jobDescription }));
      if (!aiResponse) throw new Error("AI analysis failed");

      const content = (aiResponse as any).message?.content;
      let feedbackText = "";
      if (typeof content === "string") feedbackText = content;
      else if (Array.isArray(content)) feedbackText = content.map((c: any) => c.text ?? "").join("\n");
      else feedbackText = JSON.stringify(content ?? "");

      // try to parse structured JSON feedback, fallback to raw text
      let parsedFeedback: any = null;
      try {
        parsedFeedback = JSON.parse(feedbackText);
      } catch (e) {
        parsedFeedback = { raw: feedbackText };
      }

      data.feedback = parsedFeedback;
      await kv.set(`resume:${id}`, JSON.stringify(data));

      safeSetStatus("Analysis complete — redirecting...");
      navigate(`/resume/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatusText("");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    if (!file) {
      setError("Please upload a PDF resume.");
      return;
    }

    const values: FormValues = {
      companyName: (fd.get("company-name") as string) ?? "",
      jobTitle: (fd.get("job-title") as string) ?? "",
      jobDescription: (fd.get("job-description") as string) ?? "",
    };

    analyze(values, file);
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section max-w-3xl mx-auto px-4 py-16">
        <div className="page-heading">
          <h1 className="text-3xl font-extrabold mb-2">Smart feedback for your dream job</h1>

          {isProcessing ? (
            <div className="mt-4">
              <h2 className="text-lg">{statusText}</h2>
              <div className="mt-4">
                <img src="/images/resume-scan.gif" alt="processing" className="w-full max-w-md mx-auto" />
              </div>
            </div>
          ) : (
            <h2 className="text-lg text-gray-600">Drop your resume for an ATS score and improvement tips</h2>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          )}

          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input id="company-name" name="company-name" className="input" placeholder="Company Name" />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input id="job-title" name="job-title" className="input" placeholder="Job Title" />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea id="job-description" name="job-description" rows={5} className="textarea" placeholder="Paste the job description here" />
              </div>

              <div className="form-div">
                <label>Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <div className="flex items-center gap-4">
                <button className="primary-button" type="submit">Analyze Resume</button>
                <button type="button" className="secondary-button" onClick={() => { setFile(null); setError(null); }}>Clear</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;




