"""Clean World Bank electricity access data for the project.

Reads the raw World Bank energy-and-mining file and its country metadata from
data/raw/ and writes two tidy CSVs to data/:

  electricity_access.csv        one row per country per year (2000-2019),
                                countries only (regional/income aggregates removed)
  electricity_access_world.csv  the World Bank "World" aggregate, 2000-2019,
                                for use as a reference line

Standard library only. Run from the project root:  python3 scripts/prepare_data.py
"""

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data"

ACCESS_COL = "average_value_Access to electricity (% of population)"
START, END = 2000, 2019


def main():
    # Aggregates (regions, income groups, "World") have a blank Region in the metadata.
    with open(RAW / "country-metadata.csv", encoding="utf-8-sig", newline="") as f:
        meta = {r["Country Code"]: r for r in csv.DictReader(f)}
    countries = {code for code, r in meta.items() if r["Region"].strip()}

    rows, world = [], []
    with open(RAW / "energy-and-mining.csv", encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            year = int(r["Year"])
            value = r[ACCESS_COL].strip()
            if not (START <= year <= END) or value == "":
                continue
            code = r["Country Code"]
            record = {
                "country": r["Country Name"],
                "code": code,
                "year": year,
                "access": round(float(value), 2),
            }
            if code == "WLD":
                world.append(record)
            elif code in countries:
                record["region"] = meta[code]["Region"]
                record["income_group"] = meta[code]["IncomeGroup"]
                rows.append(record)

    rows.sort(key=lambda r: (r["country"], r["year"]))
    world.sort(key=lambda r: r["year"])

    fields = ["country", "code", "region", "income_group", "year", "access"]
    with open(OUT / "electricity_access.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    with open(OUT / "electricity_access_world.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["country", "code", "year", "access"])
        w.writeheader()
        w.writerows(world)

    # Missing-data report
    years_by_code = {}
    for r in rows:
        years_by_code.setdefault(r["code"], set()).add(r["year"])
    n_years = END - START + 1
    complete = sum(1 for ys in years_by_code.values() if len(ys) == n_years)
    no_data = sorted(meta[c]["TableName"] for c in countries - years_by_code.keys())

    print(f"Countries in metadata:       {len(countries)}")
    print(f"Countries with any data:     {len(years_by_code)}")
    print(f"Complete {START}-{END}:        {complete}")
    print(f"Partial coverage:            {len(years_by_code) - complete}")
    print(f"No data at all:              {', '.join(no_data) or 'none'}")
    print(f"Wrote {len(rows)} country rows and {len(world)} world rows")


if __name__ == "__main__":
    main()
