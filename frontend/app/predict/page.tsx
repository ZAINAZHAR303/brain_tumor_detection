"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

type Prediction = {
  label: string;
  display_label: string;
  confidence: number;
};

type ApiResponse = {
  filename: string;
  prediction: Prediction;
  top_predictions: Prediction[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function PredictPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFile(nextFile: File | null) {
    setError(null);
    setResult(null);
    setFile(nextFile);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (nextFile) {
      setPreviewUrl(URL.createObjectURL(nextFile));
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0] ?? null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function submitFile() {
    if (!file) {
      setError("Please upload an MRI image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiBaseUrl}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail ?? "Prediction failed.");
      }

      const data = (await response.json()) as ApiResponse;
      setResult(data);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell predict-page">
      <section className="predict-header">
        <div>
          <span className="eyebrow">Prediction workspace</span>
          <h1>Upload a scan and let the model return the likely tumor type.</h1>
          <p>
            The frontend sends the image to FastAPI, the model classifies it, and the
            result is shown instantly with confidence and top alternatives.
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={() => inputRef.current?.click()}>
          Choose image
        </button>
      </section>

      <section className="predict-grid">
        <div
          className={`upload-card ${file ? "has-file" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          role="presentation"
        >
          <input
            ref={inputRef}
            className="file-input"
            type="file"
            accept="image/*"
            onChange={onInputChange}
          />

          {previewUrl ? (
            <img className="preview-image" src={previewUrl} alt="Selected MRI preview" />
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">MRI</div>
              <h2>Drop your MRI image here</h2>
              <p>PNG, JPG, or JPEG files work best for the classifier.</p>
            </div>
          )}

          <div className="upload-actions">
            <button className="primary-button" type="button" onClick={submitFile} disabled={loading}>
              {loading ? "Analyzing image..." : "Run prediction"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => handleFile(null)}
              disabled={loading}
            >
              Clear
            </button>
          </div>

          {file ? <p className="file-name">Selected file: {file.name}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </div>

        <aside className="result-card">
          <span className="panel-label">Prediction result</span>

          {result ? (
            <>
              <div className="result-hero">
                <strong>{result.prediction.display_label}</strong>
                <span>{result.prediction.confidence.toFixed(2)}% confidence</span>
              </div>

              <div className="result-list">
                {result.top_predictions.map((item) => (
                  <div className="result-item" key={`${item.label}-${item.confidence}`}>
                    <span>{item.display_label}</span>
                    <strong>{item.confidence.toFixed(2)}%</strong>
                  </div>
                ))}
              </div>

              <p className="result-meta">File processed: {result.filename}</p>
            </>
          ) : (
            <div className="result-empty">
              <h2>No prediction yet</h2>
              <p>The model output will appear here after you upload a scan.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
