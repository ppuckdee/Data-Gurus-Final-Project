# Mapping Electricity Access Around the World

Final project by Juan Mo, Nick Puckdee, Snigdha Tiwari, and Anuradha Jaganathan.

**Question:** Which countries had the least access to electricity in 2019, and how did access change from 2000 to 2019?

## Data

Source: World Bank indicator *Access to electricity (% of population)* (EG.ELC.ACCS.ZS), from
[light-and-salt/World-Bank-Data-by-Indicators](https://github.com/light-and-salt/World-Bank-Data-by-Indicators)
(`engergy-and-mining/` folder).

| File | What it is |
|---|---|
| `data/raw/energy-and-mining.csv` | Raw World Bank energy and mining indicators, 1960–2020 |
| `data/raw/country-metadata.csv` | Country metadata; aggregates have a blank `Region` |
| `data/electricity_access.csv` | **Cleaned:** countries only, 2000–2019, columns `country, code, region, income_group, year, access` |
| `data/electricity_access_world.csv` | World average, 2000–2019 |

To regenerate the cleaned files (standard library only):

```sh
python3 scripts/prepare_data.py
```

Cleaning steps:
- Keep only the electricity access column.
- Keep only the years 2000–2019.
- Remove regional, income-group, and other aggregate rows: they have no `Region` in the metadata.
- Drop rows with missing values.

Coverage: of 217 countries, 189 have data for every year from 2000 to 2019, 27 have partial data, and 1 (American Samoa) has none.

## Project layout

All figures live on one page, `index.html`, with one `<section>` per figure.

```
index.html            the page: header + a section for each figure
css/style.css         shared styles and color tokens (light + dark)
js/figureN.js         one script per figure
data/                 cleaned CSVs (see above)
scripts/              data-prep scripts
```

To add a figure:
1. Write its code in `js/figureN.js`, wrapped in `(() => { ... })();` so its variables stay private.
2. Prefix its element IDs with `figN-`, for example `fig3-chart`.
3. Replace the placeholder in that figure's `<section>`, and add a `<script src="js/figureN.js">` tag after the D3 script tag.

## Figures

| # | Figure | Status |
|---|---|---|
| 1 | World map, 2000 | in progress |
| 2 | World map, 2019 | in progress |
| 3 | Lowest access in 2019 (bar) | in progress |
| 4 | Largest improvements 2000–2019 (bar) | in progress |
| 5 | Access over time in selected countries (line) | done: `js/figure5.js` |

## Running locally

D3 loads the CSVs with `fetch`, so the page has to be served over HTTP rather than opened as a file:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```
