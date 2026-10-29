# PRD 1 — Media Madrasah Digital Magazine
## Frontend Design Specification for Google AI Studio

**Version:** 1.0  
**Status:** Ready for frontend prototyping  
**Target:** Google AI Studio  
**Next handoff:** GitHub Copilot in VS Code  
**Product type:** Responsive React web application  

---

## 1. Product overview

Build the frontend design for **Media Madrasah**, a digital home for the printed magazine created by the santri of MA Plus Abu Hurairah. The magazine is published every semester, with a different theme each edition. Its purpose is dakwah through writing and encouraging young Muslims to understand that Islam can be spread through thoughtful, beneficial writing.

The website must present the identity and mission of Media Madrasah, provide a searchable catalogue of digital magazine PDFs, and contain a visually designed but not yet connected admin interface for managing publications.

### Brand statement

> **Tim Media Madrasah** adalah tim yang beranggotakan **santri** untuk membuat **majalah cetak** yang terbit setiap semester dengan tema berbeda-beda sebagai ladang dakwah. Media Madrasah mengajak para pemuda meyakini bahwa **kita mampu menyebarkan Islam melalui tulisan** yang kita tuliskan.

Use this statement as editorial source copy. Preserve the meaning and Indonesian language. Minor copyediting is allowed for readability; do not invent school history, statistics, testimonials, publication counts, or awards.

## 2. Scope of this phase

This phase is **frontend design and structure only**. It is not the production backend.

### In scope
- React + TypeScript frontend.
- Responsive public landing page and magazine catalogue.
- Magazine detail/reading page with a designed PDF viewer shell.
- Admin login screen at `/admin`.
- Admin dashboard and PDF-upload form layouts.
- Empty, loading, error, and not-found states.
- Reusable components using shadcn/ui.
- Selective, restrained React Bits animations.
- Clean component boundaries so VS Code Copilot can integrate the backend later.
- A clear visual system: typography, spacing, colour tokens, borders, buttons, form fields, and responsive behaviour.

### Explicitly out of scope
- No Firebase of any kind.
- No Supabase connection or credentials in this phase.
- No actual authentication or password handling.
- No Argon2id implementation in browser code.
- No real file uploads, database writes, signed URLs, or API endpoints.
- No fabricated magazine records or fake admin statistics.
- No hardcoded production credentials.
- No deployment configuration beyond keeping the project suitable for later Vercel deployment.

## 3. Intended users

1. **Readers:** santri, alumni, families, and visitors who want to read published magazine editions.
2. **Admin:** authorised Media Madrasah operator who will later sign in and manage PDFs.

The public site must work without login. Only the admin area uses the `/admin` route. Do not place an Admin link, admin button, or admin call-to-action in public navigation or page footer. This is a navigation decision only, not a security mechanism; Copilot will implement real server-side access control later.

## 4. Design direction

### Visual principles
- Editorial, literary, calm, trustworthy, and modern.
- Premium magazine feel rather than a generic SaaS dashboard.
- Minimal UI with strong typography, generous whitespace, clear hierarchy, and subtle borders.
- Use restrained Islamic-school context through writing, geometry, or subtle motifs; avoid ornamental overload.
- Avoid generic AI-looking gradients, excessive glassmorphism, oversized rounded cards, random decorative blobs, gratuitous 3D, and animations that compete with reading.
- Use React Bits only when the effect reinforces hierarchy or navigation. Respect `prefers-reduced-motion`.
- Use semantic HTML5 and accessible contrast.

### Suggested visual tokens
These are starting tokens, not a reason to overdecorate. Refine them consistently:
- Background: warm paper/off-white.
- Primary text: deep charcoal/near-black.
- Accent: restrained deep green.
- Secondary surfaces: white or subtle warm grey.
- Borders: low-contrast neutral grey.
- Status colours: semantic and limited to the admin interface.
- Typography: a distinctive editorial display face for major headings, highly readable sans-serif for UI, and a comfortable line-height for body copy.

Define colours and typography as design tokens/CSS variables. Do not scatter raw colour values through components.

## 5. Information architecture and routes

| Route | Page | Access | Phase-one behaviour |
|---|---|---|---|
| `/` | Home | Public | Mission statement and empty magazine catalogue preview |
| `/majalah` | Catalogue | Public | Search/filter layout; show an empty state because there are no records |
| `/majalah/:slug` | Magazine detail / reader | Public | Viewer shell with no real PDF connected; show a clear “PDF belum tersedia” state when there is no file URL |
| `/admin` | Admin login | Direct URL only | Login form UI, not secure or connected in this phase |
| `/admin/dashboard` | Admin dashboard | Direct URL only | Dashboard shell with zero counts and empty publications list; do not imply secure authentication |
| `*` | Not found | Public | Helpful 404 page and link back to home |

Do not create public navigation links that reveal `/admin`. Admin route names should be constants rather than duplicated strings.

## 6. Public page requirements

### 6.1 Header/navigation
- Media Madrasah text/logo treatment.
- Links: Beranda, Majalah Digital, Tentang Media Madrasah.
- Responsive mobile menu with keyboard-accessible controls.
- No admin link.
- Avoid adding social links unless real destinations are supplied later.

### 6.2 Hero section
- Lead with the idea of dakwah through writing.
- Suggested heading: **“Dakwah yang Hidup dalam Tulisan.”**
- Suggested supporting copy: “Media Madrasah adalah ruang karya para santri untuk menyebarkan ilmu, gagasan, dan nilai-nilai Islam melalui majalah yang terbit setiap semester.”
- Primary CTA: “Jelajahi Majalah” linking to `/majalah`.
- Secondary CTA: “Tentang Media Madrasah” scrolling to the mission section.
- Do not claim an edition count or publication history not supplied by the user.

### 6.3 Mission/about section
Use the brand statement from Section 1. Focus on:
- The team consists of santri.
- The printed magazine is released every semester.
- Each semester may have a different theme.
- The magazine acts as a medium for dakwah through writing.
- Young people can contribute to Islamic communication through written work.

Do not fabricate individual contributor profiles, institutional endorsements, or quotes.

### 6.4 Magazine catalogue preview
- A section title such as “Jelajahi Karya Santri”.
- Provide an empty-state view when the data array is empty.
- Empty-state copy: “Belum ada majalah yang diterbitkan. Karya terbaru akan tampil di sini setelah dipublikasikan.”
- No fake cards, fake covers, fake dates, sample names, or placeholder records that could be mistaken for genuine publications.
- Keep the component ready to render cards when Copilot connects live data later.

### 6.5 Footer
- Media Madrasah name and concise mission line.
- Copyright year may be generated dynamically.
- Do not invent email, phone number, social media URLs, or other contacts.
- Do not reveal the admin route in footer links.

## 7. Catalogue requirements

The `/majalah` page must include:
- Page heading and concise description.
- Search input (title and description intent).
- Filter control for theme.
- Filter control for semester/year, designed so options can later be populated from live records.
- A responsive card/grid layout prepared for real publications.
- Loading state, error state with retry affordance, and empty state.
- Empty search results state that distinguishes “no publications yet” from “no results for this search”.

In this phase, initialise all publication data as an empty array. Do not seed examples. If the frontend requires local types, create types/interfaces only.

### Suggested future publication fields
These are shape definitions, not sample data:
- `id`
- `title`
- `slug`
- `description`
- `theme`
- `semester`
- `publicationYear`
- `publishedAt`
- `status`
- `filePath` (backend-only; never assume this is a public file URL)

## 8. Magazine detail and PDF-reader shell

Create a reading experience suitable for a long-form digital magazine:
- Breadcrumb back to catalogue.
- Title, description, theme, semester, year, and publication date when real metadata exists.
- A dedicated viewer area with page navigation, zoom controls, fit-width affordance, and fullscreen affordance where supported.
- A download control placeholder only if later backend policy allows downloads. Keep it visually disabled or clearly marked as not connected in phase one.
- Empty viewer state: “PDF belum tersedia.”
- Loading and failed-to-load states.

Do not create a fake PDF document, fake page count, or invented content. Copilot will install and integrate `react-pdf` and obtain a permitted PDF URL through a backend endpoint. Do not connect React-PDF to a guessed/public file URL in this phase.

## 9. Admin interface requirements

### 9.1 Login screen (`/admin`)
- Minimal, focused, professional page.
- Username field and password field; password visibility toggle.
- Submit button, disabled/loading state, validation message area, and generic failure message.
- No self-registration, no “create account”, no password reset unless a separate secure process is later specified.
- Do not put production username/password in source code, UI defaults, screenshots, comments, or environment examples.
- In phase one, form submission may be a clearly isolated UI placeholder; it must not claim that real authentication succeeded.

### 9.2 Dashboard (`/admin/dashboard`)
Design a practical content-management screen:
- Sidebar or compact admin navigation.
- Overview heading and “Tambah Majalah” primary action.
- Summary cards can be designed, but initial values must be `0` or omitted; never invent metrics.
- Publications table/list with title, theme, semester, status, updated date, and actions.
- Empty state: “Belum ada publikasi. Unggah PDF pertama untuk mulai mengelola majalah digital.”
- Search, status filter, and pagination controls may be present as non-connected UI elements.
- Every destructive action must later have a confirmation dialog.

### 9.3 Upload/edit form
Fields:
- PDF file picker and drag-and-drop zone.
- Title (required).
- Description (required).
- Theme (required or clearly marked configurable; default requirement is required).
- Semester (required; e.g. semester 1 or 2 through selectable options, not hardcoded publication data).
- Publication year (required).
- Publication status: Draft or Published, with clear explanation.
- Upload progress and field-level validation areas.
- Save draft and Publish buttons.

For this design phase, file selection can be local-only. Do not send it anywhere or claim that an upload has been saved. Keep the future API integration isolated behind a service layer.

### 9.4 Admin publication management
Create layouts for:
- List all drafts and published publications.
- Edit metadata.
- Publish/unpublish.
- Delete with a clear confirmation modal.
- Upload/file error and save error states.

No real CRUD actions in this phase.

## 10. Required empty-data contract

This requirement is mandatory:
- Initial `magazines` data must be `[]`.
- There must be no hardcoded fake magazine data, sample titles, sample authors, example publication dates, fake view counts, or fictitious admin metrics.
- Static brand/editorial copy is allowed because it is provided in this PRD.
- The UI must render meaningful empty states instead of breaking when arrays are empty.
- Components must support future data injection through props or a repository/service layer.
- Use clear TypeScript types. Avoid `any` unless there is a documented reason.

## 11. Technical direction

- React + TypeScript, preferably Vite if the existing Google AI Studio environment supports exporting a Vite project cleanly.
- HTML5 semantic elements (`header`, `nav`, `main`, `section`, `article`, `footer`, and proper form labels).
- shadcn/ui for common accessible controls; customise tokens rather than rebuilding every base component.
- React Bits for a few deliberate visual interactions only.
- Tailwind CSS if configured by shadcn/ui setup.
- Icons from the existing icon library (Lucide if available); no emoji in core navigation or admin controls.
- A small routing layer with the paths in Section 5.
- Keep backend-specific modules abstract. Add an interface such as `magazineService` but do not implement remote calls.
- No Supabase package, Firebase package, secrets, Argon2id, or server API integration in this stage.

## 12. Quality and accessibility
- Responsive widths: mobile (320 px and above), tablet, laptop, and wide desktop.
- Keyboard navigation and visible focus states.
- Correct form labels, descriptive buttons, semantic headings in order, and sufficient text contrast.
- Respect reduced motion preferences.
- Images and covers must have useful alt text if real assets are added in a later phase.
- Loading states should reserve layout space to reduce visual shifts.
- Avoid horizontal overflow, especially in the admin table and PDF toolbar.
- Use Indonesian for all user-facing copy.

## 13. Acceptance criteria

The Google AI Studio result is acceptable when:
1. All routes listed in Section 5 have a coherent frontend layout.
2. No Firebase or Supabase integration is present.
3. No credentials or secrets are embedded in frontend code.
4. The public catalogue and admin publication list render genuine empty states from empty arrays.
5. The home page accurately explains Media Madrasah using the supplied mission.
6. `/admin` is reachable by direct URL but is not linked from the public navigation or footer.
7. The admin screen is a design prototype, not falsely represented as secure production login.
8. Upload, publish, edit, and delete controls do not claim to persist data.
9. Responsive behaviour, focus states, and form labels are implemented.
10. Components are organised and named clearly enough for Copilot to integrate the backend without replacing the entire UI.
11. No dummy magazine, fake PDF, fabricated publication statistic, or made-up contact detail appears.
12. The project builds without TypeScript errors.

## 14. Required handoff to Copilot

At completion, provide:
- Full source code in the project workspace.
- An overview of routes and reusable components.
- The current TypeScript data model/interfaces.
- A list of placeholder service methods awaiting backend implementation.
- A list of environment variables that are **not yet configured** (do not create secret values).
- Confirmation that all magazine arrays start empty.
- Any known dependencies or build issues.

Do not replace the UI during backend integration unless a specific technical limitation requires it. Copilot should preserve the design and connect the real services behind the existing component/service boundaries.

---

## Copy-ready prompt for Google AI Studio

Build the frontend defined by this PRD for Media Madrasah, a digital magazine for santri. Use React + TypeScript, semantic HTML5, shadcn/ui, and restrained React Bits effects. Use Indonesian UI copy. Create the public home page, catalogue, magazine detail/PDF-reader shell, `/admin` login screen, and `/admin/dashboard` content-management design. Make the design editorial, minimalist, typography-led, accessible, responsive, and production-minded—not generic AI-generated SaaS styling.

**Critical constraints:** this task is frontend design only. Do not implement Firebase, Supabase, database access, authentication, Argon2id, API endpoints, or real file uploads. Do not include secrets or credentials. Initialise all magazine data as empty arrays. Do not invent magazines, PDF files, statistics, authors, publication dates, or contact details. Render complete empty/loading/error states. `/admin` must exist for direct navigation but must not appear in public navigation/footer. Admin actions must be clearly unconnected placeholders and must never claim to save or authenticate successfully. Preserve a clean service/interface boundary so GitHub Copilot in VS Code can implement the production backend later. Follow every section of this PRD and report the file structure and any unfinished items.
