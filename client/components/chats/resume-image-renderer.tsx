import React, { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Skeleton } from "@/components/ui/skeleton";

interface ResumeImageRendererProps {
  htmlContent: string;
}

const ResumeImageRenderer: React.FC<ResumeImageRendererProps> = ({ htmlContent }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setImgSrc(null);
    setError(null);
    const timer = setTimeout(() => {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        iframe.contentDocument.open();
        iframe.contentDocument.write(htmlContent);
        iframe.contentDocument.close();
        // Wait for content to render
        setTimeout(() => {
          const body = iframe.contentDocument?.body;
          if (body) {
            toPng(body, { cacheBust: true, backgroundColor: "white" })
              .then((dataUrl) => {
                setImgSrc(dataUrl);
                setLoading(false);
              })
              .catch((err) => {
                setError("Failed to render image");
                setLoading(false);
              });
          } else {
            setError("Failed to access iframe body");
            setLoading(false);
          }
        }, 200); // Wait for DOM to render
      } else {
        setError("Failed to access iframe");
        setLoading(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [htmlContent]);

  return (
    <div className="w-full flex justify-center items-center min-h-[500px] relative">
      {loading && <Skeleton className="h-[500px] w-full md:min-w-lg " />}
      {error && <div className="text-red-500">{error}</div>}
      {imgSrc && !loading && !error && (
        <img
          src={imgSrc}
          alt="Resume preview"
          className="w-full max-w-3xl border rounded shadow bg-white"
          style={{ minHeight: 500 }}
        />
      )}
      {/* Hidden iframe for rendering HTML in isolation */}
      <iframe
        ref={iframeRef}
        style={{ position: "absolute", left: -9999, top: 0, width: "800px", height: "1200px", visibility: "hidden", pointerEvents: "none", border: "none", zIndex: -1 }}
        sandbox="allow-same-origin"
        aria-hidden="true"
        tabIndex={-1}
        title="Resume HTML Renderer"
      />
    </div>
  );
};

export default ResumeImageRenderer; 