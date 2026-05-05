"use client";

import Link from "next/link";
import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Brain Tumor Vision</h4>
            <p>
              AI-powered MRI brain tumor classification using state-of-the-art
              deep learning models.
            </p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/predict">Tumor Detection</Link>
              </li>
              <li>
                <Link href="/consult">Consult with AI</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li>
                <a
                  href="https://huggingface.co/prithivMLmods/BrainTumor-Classification-Mini"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Model Documentation
                </a>
              </li>
              <li>
                <a href="#">GitHub Repository</a>
              </li>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Brain Tumor Vision. All rights reserved.</p>
          <p>
            Built with Next.js, FastAPI, and Hugging Face Transformers.
          </p>
        </div>
      </div>
    </footer>
  );
}
