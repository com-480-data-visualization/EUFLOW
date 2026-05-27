"""Re-derive the two origin-choropleth CSVs directly from the raw Eurostat
arnraw TSV. Fixes two preprocessing bugs:

  1. The EDA notebook applied clean_df(arnraw, dropna=True), which dropped
     every row that had any missing year in 1990-2024. This silently removed
     16 of the 27 EU destinations (those whose Eurostat collection started
     after 1990).
  2. The Eurostat TSV ships two unit variants per series: NR (count of
     arrivals) and PCH_PRE (percentage change vs previous year). The
     notebook did not filter on unit, so the PCH_PRE rows occasionally
     overwrote the NR rows in the cleaned dataframe and produced nonsensical
     top-origin picks (China beating Germany on a 110% growth, etc.).

Input  : data/estat_tour_occ_arnraw.tsv  (tour_occ_arnraw, dimensions:
         freq, unit, c_resid, nace_r2, geo)

Outputs:
 - exploitable_data/most_popular_country_of_origin_by_destination.csv
 - exploitable_data/most_popular_country_of_origin_by_destination_excluding_same.csv

Both files preserve the original column shape (leading index column, then
geo, then year columns with a trailing space) so the existing JS chart
scripts can read them without any changes. Years are restricted to 2010+.
"""
import csv
import os

SRC = "data/estat_tour_occ_arnraw.tsv"
OUT_DIR = "exploitable_data"
YEAR_START = 2010
NACE_FILTER = "I551-I553"   # aggregate of hotels + holiday rentals + camping;
                            # avoids the double-counting the EDA cell did
UNIT_FILTER = "NR"          # absolute count of arrivals, NOT PCH_PRE

# Aggregates that are NOT individual countries. They are excluded from the
# top-origin candidate pool so the map always shows a specific country.
AGG_C_RESID = {
    "WORLD", "WRL_NAL", "FOR", "DOM",
    "EU", "EU25", "EU27_2007", "EU27_2020", "EU28",
    "EA", "EA19", "EA20",
    "EFTA", "EUR", "EUR_OTH",
    "AFR", "AFR_OTH",
    "AME", "AME_C_S", "AME_C_S_OTH", "AME_N", "AME_N_OTH",
    "ASI", "ASI_OTH",
    "OCE", "OCE_OTH",
    "INT_EU25", "INT_EU27_2007", "INT_EU27_2020", "INT_EU28",
    "EU27_2020_FOR", "NEU27_2020_FOR",
}


def is_aggregate(code):
    """Anything matching the explicit list or starting with INT_ / NON_ /
    EU* / EA* / WRL* is treated as an aggregate, not a single country."""
    if code in AGG_C_RESID:
        return True
    if code.startswith(("INT_", "NON_", "WRL", "NAT_")):
        return True
    return False


# ---------------------------------------------------------------------------
# 1. Parse the raw TSV
# ---------------------------------------------------------------------------
with open(SRC, encoding="utf-8") as f:
    raw_header = f.readline().rstrip("\n").split("\t")
    key_cols = raw_header[0].split(",")
    year_cols = [h.strip() for h in raw_header[1:]]
    year_idx = {y: i + 1 for i, y in enumerate(year_cols)}  # +1: parts[0] is the key

    pos_unit = key_cols.index("unit")
    pos_c_resid = key_cols.index("c_resid")
    pos_nace = key_cols.index("nace_r2")
    pos_geo = key_cols.index("geo")

    def parse_cell(s):
        if not s:
            return None
        v = s.strip()
        if v == ":":
            return None
        # strip Eurostat reliability flags
        for flag in (" ", "u", "b", "e", "d", "p", "s", "f", "c", "n"):
            v = v.replace(flag, "")
        if not v or v == ":":
            return None
        try:
            return float(v)
        except ValueError:
            return None

    arrivals = {y: {} for y in year_cols if int(y) >= YEAR_START}
    keep_years = list(arrivals.keys())

    for line in f:
        parts = line.rstrip("\n").split("\t")
        if not parts or not parts[0]:
            continue
        key = parts[0].split(",")
        if len(key) != len(key_cols):
            continue
        if key[pos_unit] != UNIT_FILTER:
            continue
        if key[pos_nace] != NACE_FILTER:
            continue
        c_resid = key[pos_c_resid]
        if is_aggregate(c_resid):
            continue
        geo = key[pos_geo]

        for y in keep_years:
            v = parse_cell(parts[year_idx[y]])
            if v is None:
                continue
            arrivals[y].setdefault(geo, {})[c_resid] = v


# ---------------------------------------------------------------------------
# 2. Compute the two top-origin views per (year, geo)
# ---------------------------------------------------------------------------
def top_origin(year, geo, exclude_self):
    by_resid = arrivals[year].get(geo, {})
    if not by_resid:
        return None
    items = by_resid.items()
    if exclude_self:
        items = [(r, v) for r, v in items if r != geo]
    if not items:
        return None
    return max(items, key=lambda kv: kv[1])[0]


all_geos = sorted({g for y in keep_years for g in arrivals[y].keys()})


def write_csv(path, *, exclude_self):
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as out:
        w = csv.writer(out)
        # Header: leading blank index column, then geo, then "YYYY " year cols
        # (trailing space preserved for backwards compatibility with the JS).
        w.writerow([""] + ["geo"] + [y + " " for y in keep_years])
        for idx, geo in enumerate(all_geos):
            row = [idx, geo]
            for y in keep_years:
                origin = top_origin(y, geo, exclude_self)
                row.append(origin if origin is not None else "")
            w.writerow(row)


write_csv(f"{OUT_DIR}/most_popular_country_of_origin_by_destination.csv",
          exclude_self=False)
write_csv(f"{OUT_DIR}/most_popular_country_of_origin_by_destination_excluding_same.csv",
          exclude_self=True)

print(f"Years covered : {keep_years[0]}-{keep_years[-1]} ({len(keep_years)} years)")
print(f"Destinations  : {len(all_geos)}")
print()
print("Unique top-origins that appear in the FOREIGN-only output (excluding-same):")
foreign_origins = set()
for g in all_geos:
    for y in keep_years:
        o = top_origin(y, g, exclude_self=True)
        if o:
            foreign_origins.add(o)
print(" ", sorted(foreign_origins))
