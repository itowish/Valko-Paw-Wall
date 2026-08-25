/* ================================================================
   PACK PRINT PROJECT — Gamescom Gallery Config
   data/gamescom-gallery.js

   HOW TO ADD PHOTOS
   -----------------
   1. Drop your image files into the matching folder under assets/gamescom/
   2. Add an entry to the images[] array for the right category below.
   3. Save. Refresh the browser. That's it.

   Image fields:
     src  — path relative to the website root (required)
     alt  — short description for screen readers (required)
     caption — optional caption shown on hover and in the lightbox

   Supported formats: JPG, PNG, WebP
   Both landscape and portrait images are supported.
   ================================================================ */

const GAMESCOM_GALLERY = [

  /* ==============================================================
     CATEGORY 1 — The Physical Paw Wall
     The banner itself, paw prints, setup shots.
     Folder: assets/gamescom/physical-wall/
  ============================================================== */
  {
    category: 'physical-wall',
    label: 'Physical Paw Wall',
    description: 'The banner, the paw prints, and the wall that started it all.',
    images: [
      // Uncomment and edit when you have photos:
      // { src: 'assets/gamescom/physical-wall/banner-full.jpg',   alt: 'The full Valko Paw Wall banner', caption: 'The completed banner at Gamescom 2026' },
      // { src: 'assets/gamescom/physical-wall/setup.jpg',          alt: 'Setting up the banner', caption: 'Setup before the event' },
      // { src: 'assets/gamescom/physical-wall/paws-close.jpg',     alt: 'Close-up of paw prints on the banner' },
    ],
  },

  /* ==============================================================
     CATEGORY 2 — Hunters + Banner
     Hunters posing with the banner.
     Folder: assets/gamescom/hunters-banner/
  ============================================================== */
  {
    category: 'hunters-banner',
    label: 'Hunters & Banner',
    description: 'Hunters from the Pack posing with the Paw Wall.',
    images: [
      // { src: 'assets/gamescom/hunters-banner/group-01.jpg', alt: 'Group of hunters in front of the banner', caption: 'The Pack, August 29 2026' },
      // { src: 'assets/gamescom/hunters-banner/portrait-01.jpg', alt: 'Hunter leaving their paw print' },
    ],
  },

  /* ==============================================================
     CATEGORY 3 — Paw Details
     Close-up shots of individual paw prints.
     Folder: assets/gamescom/paw-details/
  ============================================================== */
  {
    category: 'paw-details',
    label: 'Paw Details',
    description: 'Individual paw prints — each one a mark left by the Pack.',
    images: [
      // { src: 'assets/gamescom/paw-details/paw-01.jpg', alt: 'A teal paw print with the name Wish', caption: 'First paw of the day' },
      // { src: 'assets/gamescom/paw-details/paw-02.jpg', alt: 'Row of colourful paw prints' },
    ],
  },

  /* ==============================================================
     CATEGORY 4 — Meetup Moments
     Off-site meetup at Kennedy-Ufer 11, evening of August 29.
     Folder: assets/gamescom/meetup/
  ============================================================== */
  {
    category: 'meetup',
    label: 'Meetup Moments',
    description: 'The Love and Deepspace Germany off-site meetup — Kennedy-Ufer 11.',
    images: [
      // { src: 'assets/gamescom/meetup/venue.jpg',  alt: 'Meetup venue at Kennedy-Ufer', caption: 'The off-site meetup venue' },
      // { src: 'assets/gamescom/meetup/crowd.jpg',  alt: 'Crowd at the off-site meetup' },
    ],
  },

  /* ==============================================================
     CATEGORY 5 — Hands + Paw Prints
     Artistic shots: hands pressing paws, ink close-ups, etc.
     Folder: assets/gamescom/hands-paws/
  ============================================================== */
  {
    category: 'hands-paws',
    label: 'Hands & Paw Prints',
    description: 'The moment of leaving your mark — up close.',
    images: [
      // { src: 'assets/gamescom/hands-paws/hand-01.jpg', alt: 'Hand pressing a paw stamp onto the banner' },
      // { src: 'assets/gamescom/hands-paws/ink-close.jpg', alt: 'Close-up of teal ink on white paper' },
    ],
  },

];
