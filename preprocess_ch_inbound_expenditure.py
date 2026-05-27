"""Extract the Switzerland-as-destination spending subset from the cleaned
Eurostat expenditure table, and write it as a compact JSON file that the
chart scripts on switzerland.html load directly.

Input  : data/cleaned_extotw.csv
         Cleaned by the EDA notebook from Eurostat tour_dem_extotw.
         Columns: purpose, duration, c_dest, expend, statinfo, geo, then a
         column per year from 2012 onward (each header has a trailing space).

Output : exploitable_data/ch_inbound_expenditure.json
         Shape (kept identical to the original hand-generated file):
           {
             "AVG_NGT": {geo: {year: float, ...}, ...},   # average spend per night, EUR
             "AVG_TRP": {geo: {year: float, ...}, ...},   # average spend per trip, EUR
             "TOTAL":   {geo: {year: float, ...}, ...},   # total spend, EUR
             "_years":  ["2012", "2013", ..., "2024"]
           }
         Year keys are stripped (no trailing space). Geos are the source
         countries that publish CH-as-destination data: AT, BE, DE, ES, FR,
         HU, LU, NL, PT plus the EA20 and EU27_2020 aggregates.

Filter rule per row:
  c_dest == "CH"            # the destination is Switzerland
  purpose == "TOTAL"         # all trip purposes combined (leisure + professional)
  duration == "N_GE1"        # any trip of 1 or more nights
  expend == "TOTXDUR"        # total expenditure across all categories
  statinfo in {AVG_NGT, AVG_TRP, TOTAL}

Run:  python3 preprocess_ch_inbound_expenditure.py
"""
import csv
import json
import os

SRC = "data/cleaned_extotw.csv"
OUT = "exploitable_data/ch_inbound_expenditure.json"

KEEP_STATS = {"AVG_NGT", "AVG_TRP", "TOTAL"}
FILTER = {"c_dest": "CH", "purpose": "TOTAL", "duration": "N_GE1", "expend": "TOTXDUR"}

with open(SRC, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    header = [h.strip() for h in next(reader)]

    # Column indices
    idx = {name: header.index(name) for name in
           ("purpose", "duration", "c_dest", "expend", "statinfo", "geo")}
    year_cols = [(i, h) for i, h in enumerate(header) if h.isdigit() and len(h) == 4]
    years = [h for _, h in year_cols]

    out = {s: {} for s in KEEP_STATS}
    for row in reader:
        # Apply the filter on every dimension column
        if any(row[idx[k]].strip() != v for k, v in FILTER.items()):
            continue
        statinfo = row[idx["statinfo"]].strip()
        if statinfo not in KEEP_STATS:
            continue
        geo = row[idx["geo"]].strip()
        bucket = out[statinfo].setdefault(geo, {})
        for col_i, year in year_cols:
            cell = row[col_i].strip()
            if not cell:
                continue
            try:
                bucket[year] = float(cell)
            except ValueError:
                # ignore non-numeric cells (Eurostat's ":" was already
                # stripped during the EDA cleaning step)
                continue

# Preserve the original key order: AVG_NGT, AVG_TRP, TOTAL, then _years
out["_years"] = years

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)

# Summary
print(f"wrote {OUT}")
print(f"  years     : {years[0]}-{years[-1]} ({len(years)} years)")
for stat in ("AVG_NGT", "AVG_TRP", "TOTAL"):
    geos = sorted(out[stat].keys())
    print(f"  {stat:<8}: {len(geos)} geos -> {', '.join(geos)}")

# Quick sanity print for 2024
print()
print("2024 spot check (per-night spending in CH, EUR):")
for geo in sorted(out["AVG_NGT"].keys()):
    v_n = out["AVG_NGT"][geo].get("2024")
    v_t = out["AVG_TRP"][geo].get("2024")
    if v_n is not None:
        print(f"  {geo:<10} per-night = {v_n:>7.2f}   per-trip = {v_t:>8.2f}")
