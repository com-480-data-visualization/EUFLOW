"""Preprocess the FSO JSON-stat cube into compact per-chart files for the Switzerland page.

Input  : data/px-x-1003020000_102_20260317-180818.json
         5-D cube: Jahr (22) x Monat (13) x Kanton (27) x Herkunftsland (78) x Indikator (2)
         Indikator 1 = Arrivals, Indikator 2 = Overnight stays
         Monat code 'YYYY' = year total ; Kanton code '8100' = national total ; Herkunftsland code '00' = origin total ; code '1' = Switzerland
         Values are dense row-major in the order above. Null cells exist (suppressed by FSO).

Outputs (written to exploitable_data/):
 - ch_top_month_per_canton.json     {canton_label: {year: month_label_of_peak}}
 - ch_canton_month_intensity.json   {year: {canton_label: [m1..m12] arrivals}}
 - ch_top_origin_per_canton.json    {canton_label: {year: top_foreign_origin_label}}
 - ch_canton_domestic_foreign.json  {year: {canton_label: {domestic, foreign, total}}}
 - ch_canton_avg_stay.json          {year: {canton_label: nights/arrivals}}
 - ch_canton_recovery.json          {canton_label: {2019, 2024, pct_change}}

Run once whenever the FSO source updates. No other preprocessing is performed.
"""
import json
import os
from collections import defaultdict

SRC = "data/px-x-1003020000_102_20260317-180818.json"
OUT_DIR = "exploitable_data"

with open(SRC, encoding="utf-8") as f:
    cube = json.load(f)

ds = cube["dataset"]
dim = ds["dimension"]
values = ds["value"]

# Build index -> label maps for each dimension. The "index" object in each
# dimension's category maps code -> integer position in the flat array.
def cat_codes_in_order(dim_name):
    cat = dim[dim_name]["category"]
    index = cat.get("index", {})
    labels = cat.get("label", {})
    # index can be a dict {code: position} or a list of codes
    if isinstance(index, list):
        ordered_codes = list(index)
    else:
        ordered_codes = sorted(index.keys(), key=lambda k: index[k])
    return ordered_codes, labels

years_codes, years_labels = cat_codes_in_order("Jahr")
months_codes, months_labels = cat_codes_in_order("Monat")
cantons_codes, cantons_labels = cat_codes_in_order("Kanton")
origins_codes, origins_labels = cat_codes_in_order("Herkunftsland")
indic_codes, indic_labels = cat_codes_in_order("Indikator")

N_Y = len(years_codes)
N_M = len(months_codes)
N_C = len(cantons_codes)
N_H = len(origins_codes)
N_I = len(indic_codes)
assert N_Y * N_M * N_C * N_H * N_I == len(values), "value array length mismatch"

# Strides (row-major in the dimension order: Jahr, Monat, Kanton, Herkunftsland, Indikator)
S_I = 1
S_H = N_I
S_C = N_H * N_I
S_M = N_C * N_H * N_I
S_Y = N_M * N_C * N_H * N_I

def get(y, m, c, h, i):
    """Lookup by dimension index positions."""
    return values[y * S_Y + m * S_M + c * S_C + h * S_H + i * S_I]

# Useful index lookups
yi = {code: i for i, code in enumerate(years_codes)}
mi = {code: i for i, code in enumerate(months_codes)}
ci = {code: i for i, code in enumerate(cantons_codes)}
hi = {code: i for i, code in enumerate(origins_codes)}
ii = {code: i for i, code in enumerate(indic_codes)}

# Skip rows
MONTH_TOTAL = "YYYY"
CANTON_TOTAL = "8100"
ORIGIN_TOTAL = "00"
ORIGIN_SWITZERLAND = "1"
IND_ARRIVALS = "1"
IND_NIGHTS = "2"

# Real (non-aggregate) months 1..12 in calendar order
calendar_months = [str(m) for m in range(1, 13)]
canton_codes_only = [c for c in cantons_codes if c != CANTON_TOTAL]

os.makedirs(OUT_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# 1. Top month per canton (uses Arrivals, all origins total)
# ---------------------------------------------------------------------------
top_month_per_canton = defaultdict(dict)
for c_code in canton_codes_only:
    c_label = cantons_labels[c_code]
    c_idx = ci[c_code]
    for y_code in years_codes:
        y_idx = yi[y_code]
        # find the busiest calendar month
        best_m, best_v = None, -1
        for m_code in calendar_months:
            v = get(y_idx, mi[m_code], c_idx, hi[ORIGIN_TOTAL], ii[IND_ARRIVALS])
            if v is None:
                continue
            if v > best_v:
                best_v = v
                best_m = m_code
        if best_m is not None:
            top_month_per_canton[c_label][y_code] = months_labels[best_m]

with open(f"{OUT_DIR}/ch_top_month_per_canton.json", "w", encoding="utf-8") as f:
    json.dump(top_month_per_canton, f, ensure_ascii=False, indent=2)
print(f"wrote {OUT_DIR}/ch_top_month_per_canton.json  ({len(top_month_per_canton)} cantons)")


# ---------------------------------------------------------------------------
# 2. Canton x month intensity (arrivals per month, all origins total)
# ---------------------------------------------------------------------------
canton_month_intensity = defaultdict(dict)
for y_code in years_codes:
    y_idx = yi[y_code]
    for c_code in canton_codes_only:
        c_label = cantons_labels[c_code]
        c_idx = ci[c_code]
        row = []
        for m_code in calendar_months:
            v = get(y_idx, mi[m_code], c_idx, hi[ORIGIN_TOTAL], ii[IND_ARRIVALS])
            row.append(v if v is not None else 0)
        canton_month_intensity[y_code][c_label] = row

with open(f"{OUT_DIR}/ch_canton_month_intensity.json", "w", encoding="utf-8") as f:
    json.dump(canton_month_intensity, f, ensure_ascii=False, indent=2)
print(f"wrote {OUT_DIR}/ch_canton_month_intensity.json")


# ---------------------------------------------------------------------------
# 3. Top foreign origin per canton (uses Overnight stays, year total month)
#    Top among foreign (excludes 'Switzerland' and the total).
# ---------------------------------------------------------------------------
foreign_origins = [h for h in origins_codes
                   if h != ORIGIN_TOTAL and h != ORIGIN_SWITZERLAND]

top_origin_per_canton = defaultdict(dict)
for c_code in canton_codes_only:
    c_label = cantons_labels[c_code]
    c_idx = ci[c_code]
    for y_code in years_codes:
        y_idx = yi[y_code]
        m_idx = mi[MONTH_TOTAL]
        # Track best foreign origin by overnight stays
        best_h, best_v = None, -1
        for h_code in foreign_origins:
            v = get(y_idx, m_idx, c_idx, hi[h_code], ii[IND_NIGHTS])
            if v is None:
                continue
            if v > best_v:
                best_v = v
                best_h = h_code
        if best_h is not None:
            top_origin_per_canton[c_label][y_code] = origins_labels[best_h]

with open(f"{OUT_DIR}/ch_top_origin_per_canton.json", "w", encoding="utf-8") as f:
    json.dump(top_origin_per_canton, f, ensure_ascii=False, indent=2)
print(f"wrote {OUT_DIR}/ch_top_origin_per_canton.json")


# ---------------------------------------------------------------------------
# 4. Domestic vs foreign mix per canton (Overnight stays, year total month)
# ---------------------------------------------------------------------------
dom_for = defaultdict(dict)
for y_code in years_codes:
    y_idx = yi[y_code]
    m_idx = mi[MONTH_TOTAL]
    for c_code in canton_codes_only:
        c_label = cantons_labels[c_code]
        c_idx = ci[c_code]
        total = get(y_idx, m_idx, c_idx, hi[ORIGIN_TOTAL], ii[IND_NIGHTS])
        dom = get(y_idx, m_idx, c_idx, hi[ORIGIN_SWITZERLAND], ii[IND_NIGHTS])
        if total is None or dom is None:
            continue
        foreign = total - dom
        dom_for[y_code][c_label] = {
            "domestic": dom,
            "foreign": foreign,
            "total": total,
        }

with open(f"{OUT_DIR}/ch_canton_domestic_foreign.json", "w", encoding="utf-8") as f:
    json.dump(dom_for, f, ensure_ascii=False, indent=2)
print(f"wrote {OUT_DIR}/ch_canton_domestic_foreign.json")


# ---------------------------------------------------------------------------
# 5. Average stay length per canton (Overnight stays / Arrivals)
# ---------------------------------------------------------------------------
avg_stay = defaultdict(dict)
for y_code in years_codes:
    y_idx = yi[y_code]
    m_idx = mi[MONTH_TOTAL]
    for c_code in canton_codes_only:
        c_label = cantons_labels[c_code]
        c_idx = ci[c_code]
        arr = get(y_idx, m_idx, c_idx, hi[ORIGIN_TOTAL], ii[IND_ARRIVALS])
        nig = get(y_idx, m_idx, c_idx, hi[ORIGIN_TOTAL], ii[IND_NIGHTS])
        if arr is None or nig is None or arr == 0:
            continue
        avg_stay[y_code][c_label] = nig / arr

with open(f"{OUT_DIR}/ch_canton_avg_stay.json", "w", encoding="utf-8") as f:
    json.dump(avg_stay, f, ensure_ascii=False, indent=2)
print(f"wrote {OUT_DIR}/ch_canton_avg_stay.json")


# ---------------------------------------------------------------------------
# 6. COVID recovery slope: arrivals in 2019 vs 2024 by canton
# ---------------------------------------------------------------------------
recovery = {}
for c_code in canton_codes_only:
    c_label = cantons_labels[c_code]
    c_idx = ci[c_code]
    m_idx = mi[MONTH_TOTAL]
    v19 = get(yi["2019"], m_idx, c_idx, hi[ORIGIN_TOTAL], ii[IND_ARRIVALS])
    v24 = get(yi["2024"], m_idx, c_idx, hi[ORIGIN_TOTAL], ii[IND_ARRIVALS])
    if v19 is None or v24 is None or v19 == 0:
        continue
    recovery[c_label] = {
        "2019": v19,
        "2024": v24,
        "pct_change": (v24 - v19) / v19 * 100.0,
    }

with open(f"{OUT_DIR}/ch_canton_recovery.json", "w", encoding="utf-8") as f:
    json.dump(recovery, f, ensure_ascii=False, indent=2)
print(f"wrote {OUT_DIR}/ch_canton_recovery.json  ({len(recovery)} cantons)")
