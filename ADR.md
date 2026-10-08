# ADR — Tahririno Architecture Decisions

This document records the key architecture decisions made for Tahririno
and why, so future contributors don't have to guess or re-litigate them.
It covers decisions only — not features or business logic.

---

## 1. Why Next.js

Tahririno needs to grow from a simple informational shell into a full
store, while staying fast and easy to find on search engines. Next.js
gives us one framework that covers both static pages and, later,
server-rendered or dynamic pages, without switching tools mid-project.
It is also standard enough that hiring, hosting, and long-term community
support are not a concern over a 10-year horizon.

## 2. Why TypeScript

Strict typing catches a large class of mistakes before the site ever
runs, which matters more as the codebase and number of contributors grow.
The cost (slightly more upfront writing) is small compared to the years
of maintenance this project is expected to have.

## 3. Why Tailwind CSS

Tailwind lets us define a small set of design tokens (colors, spacing,
typography — see Phase 2) once, in one config file, and reuse them
everywhere via utility classes. This avoids scattered, hand-written CSS
files that drift out of sync over time, and it requires no additional
runtime library or external UI kit.

## 4. Why RTL First

Persian is the project's primary language and is written right-to-left.
Designing and testing RTL from the very first phase (root `dir="rtl"`,
RTL-aware spacing) avoids a costly retrofit later, since RTL bugs are
much harder to find and fix after a UI already exists in LTR.

## 5. Why Mobile First

The target customers (schools, offices, individual buyers) are
overwhelmingly likely to browse on a phone first. Building the base
styles for small screens and expanding upward (`sm:`, `lg:` breakpoints)
keeps the default experience fast and simple, instead of the common
mistake of designing for desktop and cutting things down for mobile.

## 6. Why Feature-Based Architecture

`src/features/` (prepared in Phase 0.5) means that once real business
capabilities (products, orders, accounts, etc.) are built, each one lives
in its own self-contained folder instead of being spread across many
shared folders. This keeps large, unrelated parts of the business from
becoming entangled with each other as the project grows over years.

## 7. Why Platform Independence

The project is currently tested on Replit and Vercel, but is expected to
possibly move to a VPS, a dedicated server, or Docker in the future
(see the Phase 1.1 audit). Avoiding platform-specific packages,
environment variables, or configuration means that move can happen
without rewriting the application.

## 8. Why Design Foundation Before Business Features

Colors, typography, spacing, and base components (Button, Card, Logo)
are used by every future page and feature. Defining them once, before any
store feature exists, means every feature built afterward is visually
consistent by default — instead of every feature inventing its own
styling and the project slowly losing visual coherence.
