# The Groove Archive

**The Groove Archive** is a web-based music discovery tool for electronic music lovers. It showcases curated DJ sets with embedded playback options, interactive filters, and personalized suggestions—powered by a Google Sheet backend.

## 🚀 Features

* 🎛 **Explore DJ sets** via tier, genre, energy, and platform filters
* 🤖 **Set recommender** suggests mixes based on your preferences
* 🎧 **Embedded player** with in-page support for SoundCloud and YouTube
* 🔍 **Global keyboard command bar** (`K`) for fast navigation and search
* 🖼 **Heatmap viewer** for visualizing crowd engagement or mood
* ⚡ **Fast rendering** with virtualized lists and local caching

## 📦 Tech stack

* **Framework**: React (w/ Next.js or CRA)
* **Styling**: TailwindCSS
* **Animation**: Framer Motion
* **Data**: Google Sheets → CSV parser
* **Utilities**: Virtualization (TanStack), Context-based audio player

## 📄 Data source

All DJ set data is loaded from a **published Google Sheet**. Update the sheet to change the site content.

```ts
const GOOGLE_SHEET_PUB_HTML = "https://docs.google.com/spreadsheets/d/e/.../pubhtml?gid=...&single=true";
```

To edit data:

* Make your sheet public via "Publish to web"
* Replace the URL in the config
* Sheet must contain columns like: `Set`, `Tier`, `Genre`, `Energy`, `YouTube`, `SoundCloud`

## 🧠 Structure

* `FestivalSetsMockup` is the main React component
* Routes: `home`, `list`, `suggest`, `heatmaps`
* State: React hooks + context (audio player)
* Views:

  * `ListView`: scrollable, filterable DJ set table
  * `SuggestView`: weighted random recommendation based on user preferences
  * `HeatmapsView`: display static images of crowd energy visuals
* UI includes modals, command bar, player overlay, and "now playing" bar

## 🔑 Shortcuts

| Action            | Key                  |
| ----------------- | -------------------- |
| Open command bar  | `K`                  |
| Toggle play/pause | UI button            |
| Scroll to top     | Appears after scroll |

## 🛠 Customization

* **Genres** are inferred from the classification field in the sheet
* **Heatmaps** can be added by placing images in `/public/heatmaps` and updating the `HEATMAP_IMAGES` array
* **Styling** is adjustable via CSS variables in `IndustrialGlowTheme`

## 🧪 Running locally

1. Clone the repo
2. Install dependencies

```bash
npm install
# or
yarn
```

3. Start the development server

```bash
npm run dev
# or
yarn dev
```

4. Visit `http://localhost:3000`

> Make sure to update the Google Sheet link in the config if running your own dataset.

## 🧩 Known limitations

* No backend—everything runs client-side
* No authentication (by design)
* Errors in the sheet format may silently fail

## 📁 File organization (simplified)

```
components/
  └── FestivalSetsMockup.tsx     # Main app
  └── views/                     # List, suggest, heatmaps
  └── components/                # UI primitives (modals, player, nav)
  └── utils/                     # CSV parsing, helpers
```

## 👤 Author

Built with ❤️ by Joost. Intended for sharing DJ sets with friends and exploring electronic music tastefully.