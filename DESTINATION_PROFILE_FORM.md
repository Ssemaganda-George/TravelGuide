# Destination Profile Form
**TravelGuide Uganda** — Complete destination profiling template

---

## 📍 Basic Information

| Field | Required | Description |
|-------|----------|-------------|
| **Country** | ✅ | Uganda / Kenya / Tanzania / Rwanda |
| **Destination Name** | ✅ | Official name (e.g., "Bwindi Impenetrable National Park") |
| **Slug** | Auto | Auto-generated from name (e.g., `bwindi-impenetrable-national-park`) |
| **Region** | ✅ | Geographic area (e.g., "Southwestern Uganda, near Kabale") |
| **Coordinates** | ✅ | **Latitude** / **Longitude** (decimal degrees, e.g., -1.0554, 29.6281) |
| **Status** | ✅ | `draft` or `published` |

---

## 🏷️ Classification & Tags

| Field | Required | Description |
|-------|----------|-------------|
| **Tags** | ✅ | Comma-separated (e.g., `gorillas, wildlife, adventure, culture`) |
| **Best Months** | ✅ | e.g., `Jun-Sep, Dec-Feb` |
| **Budget Range** | | e.g., `Premium (gorilla permit is main cost)` / `Budget to mid-range` |
| **Ideal Stay (days)** | ✅ | Number (e.g., `3`) |

---

## ⏱️ Travel Time (Auto-calculated from coordinates)

| Field | Required | Description |
|-------|----------|-------------|
| **Travel Time** | Auto | Auto-filled on save: `~5 hrs 30 min from capital` |
| **Distance from Capital** | Auto | Auto-filled on save: `320.5 km` |
| **Drive Duration** | Auto | Auto-filled on save: `330 min` |

> **Note:** Enter coordinates → Save → System calculates distance & time with terrain multipliers (mountains 1.5×, parks 1.3×, remote 1.25×)

---

## 📖 Content Sections

### One-Line Hook
**Required** — 1 compelling sentence for cards/previews
> *Example: "Where the forest is so thick it earned its name, and the gorillas make every muddy step worth it."*

### Full Story
**Required** — Multi-paragraph narrative. Blank line between paragraphs.
> *Supports inline images: put image URL on its own line, or `![caption](https://...)` for captioned photos.*

### Best Time to Visit
**Required** — Seasonal guidance, weather, crowds

### Getting There
**Required** — Transport options, roads, flights, tips

### Local Tip
**Optional** — Insider advice from a named person
- **Tip text:**
- **Tip from (name):**

### Plan Around It
**Optional** — Nearby destinations to combine

---

## 🗺️ Map & Location

### Coordinates
- **Latitude:** (e.g., -1.0554)
- **Longitude:** (e.g., 29.6281)

> Use Google Maps: right-click → "What's here?" → copy coordinates

---

## 🏨 Accommodation (Stays/Lodges)

*Add one or more lodges. Each lodge needs:*

| Field | Required |
|-------|----------|
| **Name** | ✅ |
| **Tier** | ✅ (`budget` / `mid` / `comfort`) |
| **Description** | |
| **Contact Person** | |
| **Email** | |
| **Website** | |
| **Photos** | URLs (comma-separated) |
| **Coordinates** | Lat / Lng |

---

## 🎯 Activities

*Add one or more activities. Each activity needs:*

| Field | Required |
|-------|----------|
| **Name** | ✅ |
| **Description** | |
| **Cost (Low)** | USD |
| **Cost (High)** | USD |
| **Duration** | e.g., `3-4 hours` |
| **Providers** | Select from partner list |
| **Photos/Videos** | URLs (comma-separated) |

---

## 🖼️ Media

### Hero / Cover Image
**Required** — Main image for destination card

### Gallery Images
Additional photos for story and gallery

### Videos
Video URLs (YouTube, Vimeo, direct MP4)

---

## 📊 SEO & Metadata

| Field | Description |
|-------|-------------|
| **Meta Title** | Browser tab title (max 60 chars) |
| **Meta Description** | Search snippet (max 160 chars) |
| **Last Checked** | Date (YYYY-MM-DD) |

---

## ❓ FAQ (Optional)

*Add common questions:*
- **Q:** How long is the hike?
- **A:** The popular guided hike connects all three falls and typically takes 3-4 hours...

---

## ✅ Submission Checklist

- [ ] All required fields filled
- [ ] Coordinates verified on map
- [ ] At least 1 cover image provided
- [ ] Tags include terrain type (for accurate travel time)
- [ ] Local tip attributed to a person
- [ ] Activities have providers selected
- [ ] Stays have tier assigned

---

## 📤 How to Submit

1. **Fill this form** completely
2. **Attach images** in a folder/zip or share cloud link
3. **Send to:** content@travelguide.ug
4. **Subject:** `Destination Profile: [Destination Name]`

---

## 🔧 For Admin: Quick Entry

Once received, admin enters via:
```
/admin/content → Create destination → Enter coordinates → Save → Auto-calculates travel time → Fill remaining fields → Save
```

---

*Form version: 2026-10-24 | TravelGuide Uganda*