# Project Guiding Principles

## 🎯 Project Identity
- **Type**: Portfolio / PoC (Proof of Concept) / MVP (Minimum Viable Product).
- **Goal**: Demonstrate technical capability and core value quickly.
- **Mindset**: Avoid over-engineering. Focus on impact, speed, and "Wow" factor.

## ☁️ Deployment Environment
- **Frontend/Fullstack**: **Vercel** (Next.js).
  - *Constraint*: Serverless functions (cold starts, execution time limits), Edge Runtime compatibility.
- **Database/Backend**: **Supabase** (PostgreSQL, Realtime, Auth).
  - *Constraint*: Connection pooling (Transaction mode), Realtime quotas.
- **AI/ML**: **Google Cloud** (Gemini, Vertex AI).
  - *Constraint*: API quotas, Latency.

## ⚠️ Key Considerations
1.  **Free Tier Awareness**: Always design within the limits of free tiers (Vercel Hobby, Supabase Free, GCP Free).
2.  **Performance**: Optimize for Core Web Vitals. Use `next/image`, lazy loading, and efficient data fetching (`@tanstack/react-query`).
3.  **Cost Efficiency**: Minimize unnecessary API calls, database reads, and storage usage.
4.  **Simplicity**: Prefer simple, maintainable solutions over complex architectures unless necessary for the portfolio showcase.
