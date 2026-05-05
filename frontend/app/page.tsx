import Link from "next/link";

const stats = [
  { value: "4x", label: "Tumor classes in the pretrained model" },
  { value: "1", label: "Upload step from image to result" },
  { value: "FastAPI", label: "Backend serving model inference" },
];

const features = [
  {
    title: "Focus on the image",
    description: "Drop an MRI scan and let the model return the most likely tumor class.",
  },
  {
    title: "Confidence included",
    description: "See the predicted label with confidence and top alternatives.",
  },
  {
    title: "Modern stack",
    description: "Next.js frontend, FastAPI backend, Hugging Face model inference.",
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Brain Tumor Classification</span>
          <h1>Upload an MRI image and get an instant tumor type prediction.</h1>
          <p>
            A clean workflow for MRI classification powered by a pretrained vision model,
            delivered through a FastAPI backend and a polished Next.js interface.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/predict">
              Try the predictor
            </Link>
            <a className="secondary-button" href="#details">
              Explore the interface
            </a>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-card panel-card-large">
            <span className="panel-label">Model flow</span>
            <div className="panel-steps">
              <div>Upload MRI</div>
              <div>Backend preprocesses image</div>
              <div>Model returns class and confidence</div>
            </div>
          </div>
          <div className="panel-card panel-card-accent">
            <span className="panel-label">Output</span>
            <strong>Glioma Tumor</strong>
            <p>Confidence shown after inference with top ranked predictions.</p>
          </div>
        </div>
      </section>

      <section className="stats-grid" id="details">
        {stats.map((item) => (
          <article className="stat-card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
