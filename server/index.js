import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, createHashRouter, UNSAFE_withComponentProps, RouterProvider, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, Link, useNavigate, useLocation, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import routes$1 from "@react-router/dev/routes";
import { create } from "zustand";
import { useEffect, useState, useCallback, useMemo, useRef, createContext, useContext } from "react";
import { useNavigate as useNavigate$1 } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const getPuter = () => typeof window !== "undefined" && window.puter ? window.puter : null;
const usePuterStore = create((set, get) => {
  const setError = (msg) => {
    set({
      error: msg,
      isLoading: false,
      auth: {
        user: null,
        isAuthenticated: false,
        signIn: get().auth.signIn,
        signOut: get().auth.signOut,
        refreshUser: get().auth.refreshUser,
        checkAuthStatus: get().auth.checkAuthStatus,
        getUser: get().auth.getUser
      }
    });
  };
  const checkAuthStatus = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return false;
    }
    set({ isLoading: true, error: null });
    try {
      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        set({
          auth: {
            user,
            isAuthenticated: true,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => user
          },
          isLoading: false
        });
        return true;
      } else {
        set({
          auth: {
            user: null,
            isAuthenticated: false,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => null
          },
          isLoading: false
        });
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to check auth status";
      setError(msg);
      return false;
    }
  };
  const signIn = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await puter.auth.signIn();
      await checkAuthStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setError(msg);
    }
  };
  const signOut = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await puter.auth.signOut();
      set({
        auth: {
          user: null,
          isAuthenticated: false,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => null
        },
        isLoading: false
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign out failed";
      setError(msg);
    }
  };
  const refreshUser = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const user = await puter.auth.getUser();
      set({
        auth: {
          user,
          isAuthenticated: true,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => user
        },
        isLoading: false
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refresh user";
      setError(msg);
    }
  };
  const init = () => {
    const puter = getPuter();
    if (puter) {
      set({ puterReady: true });
      checkAuthStatus();
      return;
    }
    const interval = setInterval(() => {
      if (getPuter()) {
        clearInterval(interval);
        set({ puterReady: true });
        checkAuthStatus();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      if (!getPuter()) {
        setError("Puter.js failed to load within 10 seconds");
      }
    }, 1e4);
  };
  const write = async (path, data) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.write(path, data);
  };
  const readDir = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.readdir(path);
  };
  const readFile = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.read(path);
  };
  const upload2 = async (files) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.upload(files);
  };
  const deleteFile = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.delete(path);
  };
  const chat = async (prompt, imageURL, testMode, options) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.chat(prompt, imageURL, testMode, options);
  };
  const feedback = async (path, message) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.chat(
      [
        {
          role: "user",
          content: [
            {
              type: "file",
              puter_path: path
            },
            {
              type: "text",
              text: message
            }
          ]
        }
      ],
      { model: "claude-3-7-sonnet" }
    );
  };
  const img2txt = async (image, testMode) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.img2txt(image, testMode);
  };
  const getKV = async (key) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.get(key);
  };
  const setKV = async (key, value) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.set(key, value);
  };
  const deleteKV = async (key) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.delete(key);
  };
  const listKV = async (pattern, returnValues) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    if (returnValues === void 0) {
      returnValues = false;
    }
    return puter.kv.list(pattern, returnValues);
  };
  const flushKV = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.flush();
  };
  return {
    isLoading: true,
    error: null,
    puterReady: false,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      refreshUser,
      checkAuthStatus,
      getUser: () => get().auth.user
    },
    fs: {
      write: (path, data) => write(path, data),
      read: (path) => readFile(path),
      readDir: (path) => readDir(path),
      upload: (files) => upload2(files),
      delete: (path) => deleteFile(path)
    },
    ai: {
      chat: (prompt, imageURL, testMode, options) => chat(prompt, imageURL, testMode, options),
      feedback: (path, message) => feedback(path, message),
      img2txt: (image, testMode) => img2txt(image, testMode)
    },
    kv: {
      get: (key) => getKV(key),
      set: (key, value) => setKV(key, value),
      delete: (key) => deleteKV(key),
      list: (pattern, returnValues) => listKV(pattern, returnValues),
      flush: () => flushKV()
    },
    init,
    clearError: () => set({ error: null })
  };
});
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  const {
    init
  } = usePuterStore();
  useEffect(() => {
    init();
  }, [init]);
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx("script", {
        src: "https://js.puter.com/v2/"
      }), children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const router = createHashRouter(routes$1);
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(RouterProvider, {
    router
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const Navbar = () => {
  return /* @__PURE__ */ jsxs("nav", { className: "navbar", children: [
    /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx("p", { className: "text-2xl  font-bold text-gradient", children: "CareerForge" }) }),
    /* @__PURE__ */ jsx(Link, { to: "/upload", className: "primary-button w-fit cursor-pointer", children: "Upload Resume" })
  ] });
};
const ScoreCircle = ({ score = 75 }) => {
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);
  return /* @__PURE__ */ jsxs("div", { className: "relative w-[100px] h-[100px]", children: [
    /* @__PURE__ */ jsxs(
      "svg",
      {
        height: "100%",
        width: "100%",
        viewBox: "0 0 100 100",
        className: "transform -rotate-90",
        children: [
          /* @__PURE__ */ jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: normalizedRadius,
              stroke: "#f0f0f0",
              strokeWidth: stroke,
              fill: "transparent"
            }
          ),
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "grad", x1: "0", y1: "0", x2: "1", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#10b981" }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#06b6d4" })
          ] }) }),
          /* @__PURE__ */ jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: normalizedRadius,
              stroke: "url(#grad)",
              strokeWidth: stroke,
              fill: "transparent",
              strokeDasharray: circumference,
              strokeDashoffset,
              strokeLinecap: "round"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm", children: `${score}/100` }) })
  ] });
};
const ResumeCard = ({ resume: resume2 }) => {
  const { fs } = usePuterStore();
  const [imageUrl, setImageUrl] = useState("");
  useEffect(() => {
    const loadImage = async () => {
      if (!resume2.imagePath) return;
      const imageBlob = await fs.read(resume2.imagePath);
      if (!imageBlob) return;
      const url = URL.createObjectURL(new Blob([imageBlob]));
      setImageUrl(url);
    };
    loadImage();
  }, [resume2.imagePath]);
  return /* @__PURE__ */ jsxs(Link, { to: `/resume/${resume2.id}`, className: "resume-card animate-in fade-in duration-1000", children: [
    /* @__PURE__ */ jsxs("div", { className: "resume-card-header", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        resume2.companyName && /* @__PURE__ */ jsx("h2", { className: "!text-black font-bold break-words", children: resume2.companyName }),
        resume2.jobTitle && /* @__PURE__ */ jsx("h3", { className: "text-lg break-words text-gray-500", children: resume2.jobTitle }),
        !resume2.companyName && !resume2.jobTitle && /* @__PURE__ */ jsx("h2", { className: "!text-black font-bold", children: "Resume" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(ScoreCircle, { score: resume2.feedback.overallScore }) })
    ] }),
    imageUrl && /* @__PURE__ */ jsx("div", { className: "gradient-border animate-in fade-in duration-1000", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full", children: /* @__PURE__ */ jsx(
      "img",
      {
        src: imageUrl,
        alt: "resume",
        className: "w-full h-[350px] max-sm:h-[200px] object-cover object-top rounded-xl"
      }
    ) }) })
  ] });
};
function meta$2({}) {
  return [{
    title: "Resumind"
  }, {
    name: "description",
    content: "Smart feedback for your dream job!"
  }];
}
const home = UNSAFE_withComponentProps(function Home() {
  const {
    auth: auth2,
    kv
  } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  useEffect(() => {
    if (!auth2.isAuthenticated) navigate("/auth?next=/");
  }, [auth2.isAuthenticated]);
  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      const resumes2 = await kv.list("resume:*", true);
      const parsedResumes = resumes2?.map((resume2) => JSON.parse(resume2.value));
      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    };
    loadResumes();
  }, []);
  return /* @__PURE__ */ jsxs("main", {
    className: "bg-[url('/images/bg-main.svg')] bg-cover",
    children: [/* @__PURE__ */ jsx(Navbar, {}), /* @__PURE__ */ jsxs("section", {
      className: "main-section",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "page-heading py-16",
        children: [/* @__PURE__ */ jsx("h1", {
          children: "Track Your Applications & Resume Ratings"
        }), !loadingResumes && resumes?.length === 0 ? /* @__PURE__ */ jsx("h2", {
          children: "No resumes found. Upload your first resume to get feedback."
        }) : /* @__PURE__ */ jsx("h2", {
          children: "Review your submissions and check AI-powered feedback."
        })]
      }), loadingResumes && /* @__PURE__ */ jsx("div", {
        className: "flex flex-col items-center justify-center",
        children: /* @__PURE__ */ jsx("img", {
          src: "/images/resume-scan-2.gif",
          className: "w-[200px]"
        })
      }), !loadingResumes && resumes.length > 0 && /* @__PURE__ */ jsx("div", {
        className: "resumes-section",
        children: resumes.map((resume2) => /* @__PURE__ */ jsx(ResumeCard, {
          resume: resume2
        }, resume2.id))
      }), !loadingResumes && resumes?.length === 0 && /* @__PURE__ */ jsx("div", {
        className: "flex flex-col items-center justify-center mt-10 gap-4",
        children: /* @__PURE__ */ jsx(Link, {
          to: "/upload",
          className: "primary-button w-fit text-xl font-semibold",
          children: "Upload Resume"
        })
      })]
    })]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
const meta$1 = () => [{
  title: "Resumind | Auth"
}, {
  name: "description",
  content: "Log into your account"
}];
const Auth = () => {
  const {
    isLoading,
    auth: auth2
  } = usePuterStore();
  const location = useLocation();
  const next = location.search.split("next=")[1];
  const navigate = useNavigate();
  useEffect(() => {
    if (auth2.isAuthenticated) navigate(next);
  }, [auth2.isAuthenticated, next]);
  return /* @__PURE__ */ jsx("main", {
    className: "bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center",
    children: /* @__PURE__ */ jsx("div", {
      className: "gradient-border shadow-lg",
      children: /* @__PURE__ */ jsxs("section", {
        className: "flex flex-col gap-8 bg-white rounded-2xl p-10",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex flex-col items-center gap-2 text-center",
          children: [/* @__PURE__ */ jsx("h1", {
            children: "Welcome"
          }), /* @__PURE__ */ jsx("h2", {
            children: "Log In to Continue Your Job Journey"
          })]
        }), /* @__PURE__ */ jsx("div", {
          children: isLoading ? /* @__PURE__ */ jsx("button", {
            className: "auth-button animate-pulse",
            children: /* @__PURE__ */ jsx("p", {
              children: "Signing you in..."
            })
          }) : /* @__PURE__ */ jsx(Fragment, {
            children: auth2.isAuthenticated ? /* @__PURE__ */ jsx("button", {
              className: "auth-button",
              onClick: auth2.signOut,
              children: /* @__PURE__ */ jsx("p", {
                children: "Log Out"
              })
            }) : /* @__PURE__ */ jsx("button", {
              className: "auth-button",
              onClick: auth2.signIn,
              children: /* @__PURE__ */ jsx("p", {
                children: "Log In"
              })
            })
          })
        })]
      })
    })
  });
};
const auth = UNSAFE_withComponentProps(Auth);
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: auth,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
const generateUUID = () => crypto.randomUUID();
const FileUploader = ({ onFileSelect, maxSizeMB = 20 }) => {
  const maxSize = maxSizeMB * 1024 * 1024;
  const onDrop = useCallback((accepted) => {
    const f = accepted[0] ?? null;
    onFileSelect?.(f);
  }, [onFileSelect]);
  const { getRootProps, getInputProps, acceptedFiles, isDragActive, fileRejections } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize
  });
  const file = acceptedFiles[0] ?? null;
  const rejectionMessage = useMemo(() => {
    if (!fileRejections || fileRejections.length === 0) return null;
    const r = fileRejections[0];
    const reason = r.errors?.[0]?.message ?? "File rejected";
    return reason;
  }, [fileRejections]);
  return /* @__PURE__ */ jsx("div", { className: "w-full gradient-border", children: /* @__PURE__ */ jsxs("div", { ...getRootProps(), className: "p-4 cursor-pointer", children: [
    /* @__PURE__ */ jsx("input", { ...getInputProps() }),
    file ? /* @__PURE__ */ jsxs("div", { className: "uploader-selected-file flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("img", { src: "/images/pdf.png", alt: "pdf", className: "w-10 h-10" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium truncate", children: file.name }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: formatSize(file.size) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
        e.stopPropagation();
        onFileSelect?.(null);
      }, className: "p-2", children: /* @__PURE__ */ jsx("img", { src: "/icons/cross.svg", alt: "remove", className: "w-4 h-4" }) }) })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-16 h-16 flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx("img", { src: "/icons/info.svg", alt: "upload", className: "w-10 h-10" }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("strong", { children: "Click to upload" }),
        " or drag and drop"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
        "PDF (max ",
        formatSize(maxSize),
        ")"
      ] }),
      isDragActive && /* @__PURE__ */ jsx("p", { className: "text-xs", children: "Drop file to upload" }),
      rejectionMessage && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500", children: rejectionMessage })
    ] })
  ] }) });
};
let pdfjsLib = null;
let loading = null;
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (loading) return loading;
  loading = import("pdfjs-dist").then((lib) => {
    pdfjsLib = lib;
    lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.mjs`;
    return lib;
  }).catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}
async function convertPdfToImage(file) {
  try {
    const lib = await loadPdfJs();
    const buffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(1);
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    await page.render({ canvasContext: ctx, viewport }).promise;
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve({ imageUrl: "", file: null, error: "Failed to create blob" });
        const name = file.name.replace(/\.pdf$/i, "") + ".png";
        const imageFile = new File([blob], name, { type: "image/png" });
        const url = URL.createObjectURL(blob);
        resolve({ imageUrl: url, file: imageFile });
      }, "image/png", 0.9);
    });
  } catch (err) {
    return { imageUrl: "", file: null, error: String(err) };
  }
}
const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //max 100
      ATS: {
        score: number; //rate based on ATS suitability
        tips: {
          type: "good" | "improve";
          tip: string; //give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
    }`;
const prepareInstructions = ({ jobTitle, jobDescription }) => `You are an expert in ATS (Applicant Tracking System) and resume analysis.
      Please analyze and rate this resume and suggest how to improve it.
      The rating can be low if the resume is bad.
      Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
      If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
      If available, use the job description for the job user is applying to to give more detailed feedback.
      If provided, take the job description into consideration.
      The job title is: ${jobTitle}
      The job description is: ${jobDescription}
      Provide the feedback using the following format:
      ${AIResponseFormat}
      Return the analysis as an JSON object, without any other text and without the backticks.
      Do not include any other text or comments.`;
const Upload = () => {
  const navigate = useNavigate$1();
  const {
    fs,
    ai,
    kv
  } = usePuterStore();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState(null);
  useEffect(() => {
    setStatusText("");
    setError(null);
  }, [file]);
  const handleFileSelect = useCallback((f) => {
    setFile(f);
  }, []);
  const analyze = async (values, selectedFile) => {
    setIsProcessing(true);
    setError(null);
    const safeSetStatus = (s) => {
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
        feedback: null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await kv.set(`resume:${id}`, JSON.stringify(data));
      safeSetStatus("Requesting AI analysis...");
      const aiResponse = await ai.feedback(uploadedFile.path, prepareInstructions({
        jobTitle: values.jobTitle,
        jobDescription: values.jobDescription
      }));
      if (!aiResponse) throw new Error("AI analysis failed");
      const content = aiResponse.message?.content;
      let feedbackText = "";
      if (typeof content === "string") feedbackText = content;
      else if (Array.isArray(content)) feedbackText = content.map((c) => c.text ?? "").join("\n");
      else feedbackText = JSON.stringify(content ?? "");
      let parsedFeedback = null;
      try {
        parsedFeedback = JSON.parse(feedbackText);
      } catch (e) {
        parsedFeedback = {
          raw: feedbackText
        };
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
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!file) {
      setError("Please upload a PDF resume.");
      return;
    }
    const values = {
      companyName: fd.get("company-name") ?? "",
      jobTitle: fd.get("job-title") ?? "",
      jobDescription: fd.get("job-description") ?? ""
    };
    analyze(values, file);
  };
  return /* @__PURE__ */ jsxs("main", {
    className: "bg-[url('/images/bg-main.svg')] bg-cover min-h-screen",
    children: [/* @__PURE__ */ jsx(Navbar, {}), /* @__PURE__ */ jsx("section", {
      className: "main-section max-w-3xl mx-auto px-4 py-16",
      children: /* @__PURE__ */ jsxs("div", {
        className: "page-heading",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-extrabold mb-2",
          children: "Smart feedback for your dream job"
        }), isProcessing ? /* @__PURE__ */ jsxs("div", {
          className: "mt-4",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-lg",
            children: statusText
          }), /* @__PURE__ */ jsx("div", {
            className: "mt-4",
            children: /* @__PURE__ */ jsx("img", {
              src: "/images/resume-scan.gif",
              alt: "processing",
              className: "w-full max-w-md mx-auto"
            })
          })]
        }) : /* @__PURE__ */ jsx("h2", {
          className: "text-lg text-gray-600",
          children: "Drop your resume for an ATS score and improvement tips"
        }), error && /* @__PURE__ */ jsx("div", {
          className: "mt-4 text-sm text-red-600",
          children: error
        }), !isProcessing && /* @__PURE__ */ jsxs("form", {
          id: "upload-form",
          onSubmit: handleSubmit,
          className: "flex flex-col gap-4 mt-8",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "form-div",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "company-name",
              children: "Company Name"
            }), /* @__PURE__ */ jsx("input", {
              id: "company-name",
              name: "company-name",
              className: "input",
              placeholder: "Company Name"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "form-div",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "job-title",
              children: "Job Title"
            }), /* @__PURE__ */ jsx("input", {
              id: "job-title",
              name: "job-title",
              className: "input",
              placeholder: "Job Title"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "form-div",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "job-description",
              children: "Job Description"
            }), /* @__PURE__ */ jsx("textarea", {
              id: "job-description",
              name: "job-description",
              rows: 5,
              className: "textarea",
              placeholder: "Paste the job description here"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "form-div",
            children: [/* @__PURE__ */ jsx("label", {
              children: "Upload Resume"
            }), /* @__PURE__ */ jsx(FileUploader, {
              onFileSelect: handleFileSelect
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-4",
            children: [/* @__PURE__ */ jsx("button", {
              className: "primary-button",
              type: "submit",
              children: "Analyze Resume"
            }), /* @__PURE__ */ jsx("button", {
              type: "button",
              className: "secondary-button",
              onClick: () => {
                setFile(null);
                setError(null);
              },
              children: "Clear"
            })]
          })]
        })]
      })
    })]
  });
};
const upload = UNSAFE_withComponentProps(Upload);
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: upload
}, Symbol.toStringTag, { value: "Module" }));
const ScoreGauge = ({ score = 75 }) => {
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef(null);
  const percentage = score / 100;
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center", children: /* @__PURE__ */ jsxs("div", { className: "relative w-40 h-20", children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 100 50", className: "w-full h-full", children: [
      /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs(
        "linearGradient",
        {
          id: "gaugeGradient",
          x1: "0%",
          y1: "0%",
          x2: "100%",
          y2: "0%",
          children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#a78bfa" }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#fca5a5" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M10,50 A40,40 0 0,1 90,50",
          fill: "none",
          stroke: "#e5e7eb",
          strokeWidth: "10",
          strokeLinecap: "round"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          ref: pathRef,
          d: "M10,50 A40,40 0 0,1 90,50",
          fill: "none",
          stroke: "url(#gaugeGradient)",
          strokeWidth: "10",
          strokeLinecap: "round",
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength * (1 - percentage)
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center pt-2", children: /* @__PURE__ */ jsxs("div", { className: "text-xl font-semibold pt-4", children: [
      score,
      "/100"
    ] }) })
  ] }) });
};
const ScoreBadge$1 = ({ score }) => {
  let badgeColor = "";
  let badgeText = "";
  if (score > 70) {
    badgeColor = "bg-badge-green text-green-600";
    badgeText = "Strong";
  } else if (score > 49) {
    badgeColor = "bg-badge-yellow text-yellow-600";
    badgeText = "Good Start";
  } else {
    badgeColor = "bg-badge-red text-red-600";
    badgeText = "Needs Work";
  }
  return /* @__PURE__ */ jsx("div", { className: `px-3 py-1 rounded-full ${badgeColor}`, children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: badgeText }) });
};
const Category = ({ title, score }) => {
  const textColor = score > 70 ? "text-green-600" : score > 49 ? "text-yellow-600" : "text-red-600";
  return /* @__PURE__ */ jsx("div", { className: "resume-summary", children: /* @__PURE__ */ jsxs("div", { className: "category", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-2 items-center justify-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xl", children: title }),
      /* @__PURE__ */ jsx(ScoreBadge$1, { score })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-2xl", children: [
      /* @__PURE__ */ jsx("span", { className: textColor, children: score }),
      "/100"
    ] })
  ] }) });
};
const Summary = ({ feedback }) => {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-md w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-row items-center p-4 gap-8", children: [
      /* @__PURE__ */ jsx(ScoreGauge, { score: feedback.overallScore }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Your Resume Score" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "This score is calculated based on the variables listed below." })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Category, { title: "Tone & Style", score: feedback.toneAndStyle.score }),
    /* @__PURE__ */ jsx(Category, { title: "Content", score: feedback.content.score }),
    /* @__PURE__ */ jsx(Category, { title: "Structure", score: feedback.structure.score }),
    /* @__PURE__ */ jsx(Category, { title: "Skills", score: feedback.skills.score })
  ] });
};
const ATS = ({ score, suggestions }) => {
  const gradientClass = score > 69 ? "from-green-100" : score > 49 ? "from-yellow-100" : "from-red-100";
  const iconSrc = score > 69 ? "/icons/ats-good.svg" : score > 49 ? "/icons/ats-warning.svg" : "/icons/ats-bad.svg";
  const subtitle = score > 69 ? "Great Job!" : score > 49 ? "Good Start" : "Needs Improvement";
  return /* @__PURE__ */ jsxs("div", { className: `bg-gradient-to-b ${gradientClass} to-white rounded-2xl shadow-md w-full p-6`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsx("img", { src: iconSrc, alt: "ATS Score Icon", className: "w-12 h-12" }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold", children: [
        "ATS Score - ",
        score,
        "/100"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: subtitle }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4", children: "This score represents how well your resume is likely to perform in Applicant Tracking Systems used by employers." }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: suggestions.map((suggestion, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg",
            alt: suggestion.type === "good" ? "Check" : "Warning",
            className: "w-5 h-5 mt-1"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: suggestion.type === "good" ? "text-green-700" : "text-amber-700", children: suggestion.tip })
      ] }, index)) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-700 italic", children: "Keep refining your resume to improve your chances of getting past ATS filters and into the hands of recruiters." })
  ] });
};
const AccordionContext = createContext(
  void 0
);
const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
};
const Accordion = ({
  children,
  defaultOpen,
  allowMultiple = false,
  className = ""
}) => {
  const [activeItems, setActiveItems] = useState(
    defaultOpen ? [defaultOpen] : []
  );
  const toggleItem = (id) => {
    setActiveItems((prev) => {
      if (allowMultiple) {
        return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      } else {
        return prev.includes(id) ? [] : [id];
      }
    });
  };
  const isItemActive = (id) => activeItems.includes(id);
  return /* @__PURE__ */ jsx(
    AccordionContext.Provider,
    {
      value: { activeItems, toggleItem, isItemActive },
      children: /* @__PURE__ */ jsx("div", { className: `space-y-2 ${className}`, children })
    }
  );
};
const AccordionItem = ({
  id,
  children,
  className = ""
}) => {
  return /* @__PURE__ */ jsx("div", { className: `overflow-hidden border-b border-gray-200 ${className}`, children });
};
const AccordionHeader = ({
  itemId,
  children,
  className = "",
  icon,
  iconPosition = "right"
}) => {
  const { toggleItem, isItemActive } = useAccordion();
  const isActive = isItemActive(itemId);
  const defaultIcon = /* @__PURE__ */ jsx(
    "svg",
    {
      className: cn("w-5 h-5 transition-transform duration-200", {
        "rotate-180": isActive
      }),
      fill: "none",
      stroke: "#98A2B3",
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M19 9l-7 7-7-7"
        }
      )
    }
  );
  const handleClick = () => {
    toggleItem(itemId);
  };
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: handleClick,
      className: `
        w-full px-4 py-3 text-left
        focus:outline-none
        transition-colors duration-200 flex items-center justify-between cursor-pointer
        ${className}
      `,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          iconPosition === "left" && (icon || defaultIcon),
          /* @__PURE__ */ jsx("div", { className: "flex-1", children })
        ] }),
        iconPosition === "right" && (icon || defaultIcon)
      ]
    }
  );
};
const AccordionContent = ({
  itemId,
  children,
  className = ""
}) => {
  const { isItemActive } = useAccordion();
  const isActive = isItemActive(itemId);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `
        overflow-hidden transition-all duration-300 ease-in-out
        ${isActive ? "max-h-fit opacity-100" : "max-h-0 opacity-0"}
        ${className}
      `,
      children: /* @__PURE__ */ jsx("div", { className: "px-4 py-3 ", children })
    }
  );
};
const ScoreBadge = ({ score }) => {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex flex-row gap-1 items-center px-2 py-0.5 rounded-[96px]",
        score > 69 ? "bg-badge-green" : score > 39 ? "bg-badge-yellow" : "bg-badge-red"
      ),
      children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: score > 69 ? "/icons/check.svg" : "/icons/warning.svg",
            alt: "score",
            className: "size-4"
          }
        ),
        /* @__PURE__ */ jsxs(
          "p",
          {
            className: cn(
              "text-sm font-medium",
              score > 69 ? "text-badge-green-text" : score > 39 ? "text-badge-yellow-text" : "text-badge-red-text"
            ),
            children: [
              score,
              "/100"
            ]
          }
        )
      ]
    }
  );
};
const CategoryHeader = ({
  title,
  categoryScore
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-4 items-center py-2", children: [
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-semibold", children: title }),
    /* @__PURE__ */ jsx(ScoreBadge, { score: categoryScore })
  ] });
};
const CategoryContent = ({
  tips
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 items-center w-full", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-gray-50 w-full rounded-lg px-5 py-4 grid grid-cols-2 gap-4", children: tips.map((tip, index) => /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-2 items-center", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg",
          alt: "score",
          className: "size-5"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-500 ", children: tip.tip })
    ] }, index)) }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 w-full", children: tips.map((tip, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "flex flex-col gap-2 rounded-2xl p-4",
          tip.type === "good" ? "bg-green-50 border border-green-200 text-green-700" : "bg-yellow-50 border border-yellow-200 text-yellow-700"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-2 items-center", children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg",
                alt: "score",
                className: "size-5"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xl font-semibold", children: tip.tip })
          ] }),
          /* @__PURE__ */ jsx("p", { children: tip.explanation })
        ]
      },
      index + tip.tip
    )) })
  ] });
};
const Details = ({ feedback }) => {
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 w-full", children: /* @__PURE__ */ jsxs(Accordion, { children: [
    /* @__PURE__ */ jsxs(AccordionItem, { id: "tone-style", children: [
      /* @__PURE__ */ jsx(AccordionHeader, { itemId: "tone-style", children: /* @__PURE__ */ jsx(
        CategoryHeader,
        {
          title: "Tone & Style",
          categoryScore: feedback.toneAndStyle.score
        }
      ) }),
      /* @__PURE__ */ jsx(AccordionContent, { itemId: "tone-style", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.toneAndStyle.tips }) })
    ] }),
    /* @__PURE__ */ jsxs(AccordionItem, { id: "content", children: [
      /* @__PURE__ */ jsx(AccordionHeader, { itemId: "content", children: /* @__PURE__ */ jsx(
        CategoryHeader,
        {
          title: "Content",
          categoryScore: feedback.content.score
        }
      ) }),
      /* @__PURE__ */ jsx(AccordionContent, { itemId: "content", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.content.tips }) })
    ] }),
    /* @__PURE__ */ jsxs(AccordionItem, { id: "structure", children: [
      /* @__PURE__ */ jsx(AccordionHeader, { itemId: "structure", children: /* @__PURE__ */ jsx(
        CategoryHeader,
        {
          title: "Structure",
          categoryScore: feedback.structure.score
        }
      ) }),
      /* @__PURE__ */ jsx(AccordionContent, { itemId: "structure", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.structure.tips }) })
    ] }),
    /* @__PURE__ */ jsxs(AccordionItem, { id: "skills", children: [
      /* @__PURE__ */ jsx(AccordionHeader, { itemId: "skills", children: /* @__PURE__ */ jsx(
        CategoryHeader,
        {
          title: "Skills",
          categoryScore: feedback.skills.score
        }
      ) }),
      /* @__PURE__ */ jsx(AccordionContent, { itemId: "skills", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.skills.tips }) })
    ] })
  ] }) });
};
const meta = () => [{
  title: "Resumind | Review "
}, {
  name: "description",
  content: "Detailed overview of your resume"
}];
const Resume = () => {
  const {
    auth: auth2,
    isLoading,
    fs,
    kv
  } = usePuterStore();
  const {
    id
  } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !auth2.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [isLoading]);
  useEffect(() => {
    const loadResume = async () => {
      const resume2 = await kv.get(`resume:${id}`);
      if (!resume2) return;
      const data = JSON.parse(resume2);
      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;
      const pdfBlob = new Blob([resumeBlob], {
        type: "application/pdf"
      });
      const resumeUrl2 = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl2);
      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;
      const blobUrl = URL.createObjectURL(imageBlob);
      setImageUrl(blobUrl);
      setFeedback(data.feedback);
    };
    loadResume();
  }, [id]);
  return /* @__PURE__ */ jsxs("main", {
    className: "!pt-0",
    children: [/* @__PURE__ */ jsx("nav", {
      className: "resume-nav",
      children: /* @__PURE__ */ jsxs(Link, {
        to: "/",
        className: "back-button",
        children: [/* @__PURE__ */ jsx("img", {
          src: "/icons/back.svg",
          alt: "logo",
          className: "w-2.5 h-2.5"
        }), /* @__PURE__ */ jsx("span", {
          className: "text-gray-800 text-sm font-semibold",
          children: "Back to Homepage"
        })]
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "flex flex-row w-full max-lg:flex-col-reverse",
      children: [/* @__PURE__ */ jsx("section", {
        className: "feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center",
        children: imageUrl && resumeUrl && /* @__PURE__ */ jsx("div", {
          className: "animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] w-fit",
          children: /* @__PURE__ */ jsx("a", {
            href: resumeUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            children: /* @__PURE__ */ jsx("img", {
              src: imageUrl,
              className: "w-full h-full object-contain rounded-2xl",
              title: "resume"
            })
          })
        })
      }), /* @__PURE__ */ jsxs("section", {
        className: "feedback-section",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-4xl !text-black font-bold",
          children: "Resume Review"
        }), feedback ? /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col gap-8 animate-in fade-in duration-1000",
          children: [/* @__PURE__ */ jsx(Summary, {
            feedback
          }), /* @__PURE__ */ jsx(ATS, {
            score: feedback.ATS.score || 0,
            suggestions: feedback.ATS.tips || []
          }), /* @__PURE__ */ jsx(Details, {
            feedback
          })]
        }) : /* @__PURE__ */ jsx("img", {
          src: "/images/resume-scan-2.gif",
          className: "w-full"
        })]
      })]
    })]
  });
};
const resume = UNSAFE_withComponentProps(Resume);
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: resume,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const WipeApp = () => {
  const {
    auth: auth2,
    isLoading,
    error,
    clearError,
    fs,
    ai,
    kv
  } = usePuterStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const loadFiles = async () => {
    const files2 = await fs.readDir("./");
    setFiles(files2);
  };
  useEffect(() => {
    loadFiles();
  }, []);
  useEffect(() => {
    if (!isLoading && !auth2.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [isLoading]);
  const handleDelete = async () => {
    files.forEach(async (file) => {
      await fs.delete(file.path);
    });
    await kv.flush();
    loadFiles();
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", {
      children: "Loading..."
    });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", {
      children: ["Error ", error]
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    children: ["Authenticated as: ", auth2.user?.username, /* @__PURE__ */ jsx("div", {
      children: "Existing files:"
    }), /* @__PURE__ */ jsx("div", {
      className: "flex flex-col gap-4",
      children: files.map((file) => /* @__PURE__ */ jsx("div", {
        className: "flex flex-row gap-4",
        children: /* @__PURE__ */ jsx("p", {
          children: file.name
        })
      }, file.id))
    }), /* @__PURE__ */ jsx("div", {
      children: /* @__PURE__ */ jsx("button", {
        className: "bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer",
        onClick: () => handleDelete(),
        children: "Wipe App Data"
      })
    })]
  });
};
const wipe = UNSAFE_withComponentProps(WipeApp);
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: wipe
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/ai-resume-analyzer/assets/entry.client-CDWXVn_P.js", "imports": ["/ai-resume-analyzer/assets/chunk-4WY6JWTD-CefCjoLG.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/ai-resume-analyzer/assets/root-hSA8rZjZ.js", "imports": ["/ai-resume-analyzer/assets/chunk-4WY6JWTD-CefCjoLG.js", "/ai-resume-analyzer/assets/puter-DrvZ6wbT.js"], "css": ["/ai-resume-analyzer/assets/root-DvbRetz1.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/ai-resume-analyzer/assets/home-D_hGAGTK.js", "imports": ["/ai-resume-analyzer/assets/chunk-4WY6JWTD-CefCjoLG.js", "/ai-resume-analyzer/assets/Navbar-C29_jHlA.js", "/ai-resume-analyzer/assets/puter-DrvZ6wbT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth": { "id": "routes/auth", "parentId": "root", "path": "/auth", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/ai-resume-analyzer/assets/auth-eRaR2xKd.js", "imports": ["/ai-resume-analyzer/assets/chunk-4WY6JWTD-CefCjoLG.js", "/ai-resume-analyzer/assets/puter-DrvZ6wbT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/upload": { "id": "routes/upload", "parentId": "root", "path": "/upload", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/ai-resume-analyzer/assets/upload-Dc2KGsUJ.js", "imports": ["/ai-resume-analyzer/assets/chunk-4WY6JWTD-CefCjoLG.js", "/ai-resume-analyzer/assets/Navbar-C29_jHlA.js", "/ai-resume-analyzer/assets/utils-BfpOqbi7.js", "/ai-resume-analyzer/assets/puter-DrvZ6wbT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/resume": { "id": "routes/resume", "parentId": "root", "path": "/resume/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/ai-resume-analyzer/assets/resume-BHdThR6D.js", "imports": ["/ai-resume-analyzer/assets/chunk-4WY6JWTD-CefCjoLG.js", "/ai-resume-analyzer/assets/puter-DrvZ6wbT.js", "/ai-resume-analyzer/assets/utils-BfpOqbi7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/wipe": { "id": "routes/wipe", "parentId": "root", "path": "/wipe", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/ai-resume-analyzer/assets/wipe-DC5IiFK4.js", "imports": ["/ai-resume-analyzer/assets/chunk-4WY6JWTD-CefCjoLG.js", "/ai-resume-analyzer/assets/puter-DrvZ6wbT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/ai-resume-analyzer/assets/manifest-dd188bc3.js", "version": "dd188bc3", "sri": void 0 };
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v8_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/ai-resume-analyzer/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/auth": {
    id: "routes/auth",
    parentId: "root",
    path: "/auth",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/upload": {
    id: "routes/upload",
    parentId: "root",
    path: "/upload",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/resume": {
    id: "routes/resume",
    parentId: "root",
    path: "/resume/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/wipe": {
    id: "routes/wipe",
    parentId: "root",
    path: "/wipe",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
