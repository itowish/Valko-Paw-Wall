# How to Add Gamescom Photos

A beginner-friendly guide for adding photos to the gallery after the event.

---

## Where are the photos shown?

On the **Gamescom Memories** page (`gamescom.html`). It has five category tabs:

| Tab | What goes here |
|-----|----------------|
| Physical Paw Wall | The banner, setup shots, full-wall photos |
| Hunters & Banner | Hunters posing with the banner |
| Paw Details | Close-up shots of individual paw prints |
| Meetup Moments | The off-site meetup at Kennedy-Ufer |
| Hands & Paw Prints | Artistic shots — hands, ink, the stamping moment |

---

## Step 1 — Prepare your images

- Save your photos as **JPG, PNG, or WebP**
- Any resolution is fine — the page handles both landscape and portrait
- Give them clear file names, e.g. `banner-full.jpg`, `group-01.jpg`

---

## Step 2 — Drop the files into the right folder

Each category has its own folder inside `assets/gamescom/`:

```
assets/
  gamescom/
    physical-wall/    ← banner and wall photos
    hunters-banner/   ← hunters posing with the banner
    paw-details/      ← close-up paw prints
    meetup/           ← off-site meetup photos
    hands-paws/       ← hands and ink close-ups
```

Example: if you have a photo called `banner-full.jpg` for the Physical Paw Wall category, put it at:
```
assets/gamescom/physical-wall/banner-full.jpg
```

---

## Step 3 — Register the photo in the config file

Open `data/gamescom-gallery.js` in any text editor (Notepad works fine).

Find the right category section. Each one looks like this:

```js
{
  category: 'physical-wall',
  label: 'Physical Paw Wall',
  description: 'The banner, the paw prints, and the wall that started it all.',
  images: [
    // Your photos go here
  ],
},
```

Add a line inside the `images: [ ]` array:

```js
images: [
  { src: 'assets/gamescom/physical-wall/banner-full.jpg', alt: 'The full Valko Paw Wall banner', caption: 'Gamescom 2026' },
],
```

**The three fields:**
- `src` — the path to your image (starts with `assets/gamescom/...`)
- `alt` — a short description for screen readers (required)
- `caption` — optional text shown on hover and in the lightbox

---

## Step 4 — Save and refresh

Save the file and open `gamescom.html` in your browser. Your photo should appear.

---

## Full example

Say you want to add three photos to the Physical Paw Wall category:

```js
{
  category: 'physical-wall',
  label: 'Physical Paw Wall',
  description: 'The banner, the paw prints, and the wall that started it all.',
  images: [
    { src: 'assets/gamescom/physical-wall/banner-full.jpg',  alt: 'The full Valko Paw Wall banner', caption: 'The completed banner at Gamescom 2026' },
    { src: 'assets/gamescom/physical-wall/setup.jpg',         alt: 'Setting up the banner before the event' },
    { src: 'assets/gamescom/physical-wall/paws-close.jpg',    alt: 'Close-up of paw prints on the banner', caption: 'Every paw counts' },
  ],
},
```

---

## Questions?

If something doesn't look right, double-check:
1. The file is actually in the `assets/gamescom/` folder
2. The `src` path in `gamescom-gallery.js` matches the file name exactly (case-sensitive on some systems)
3. The commas between entries are in the right place

That's it — no coding required beyond copy-pasting the lines above.
