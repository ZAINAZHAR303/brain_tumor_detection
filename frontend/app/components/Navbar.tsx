"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Navbar.css";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          <span className="logo-icon">🧠</span>
          Brain Tumor Vision
        </Link>

        <div className="navbar-menu">
          <Link
            href="/"
            className={`navbar-link ${isActive("/") ? "active" : ""}`}
          >
            Home
          </Link>
          <Link
            href="/predict"
            className={`navbar-link ${isActive("/predict") ? "active" : ""}`}
          >
            Tumor Detection
          </Link>
          <Link
            href="/consult"
            className={`navbar-link ${isActive("/consult") ? "active" : ""}`}
          >
            Consult with AI
          </Link>
        </div>
      </div>
    </nav>
  );
}
