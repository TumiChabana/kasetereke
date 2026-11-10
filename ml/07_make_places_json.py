# ml/07_make_places_json.py - export the places sheet to apps/web/data/places.json for the traveller app.
# Run from ml/:   py 07_make_places_json.py
# Rules: id = number from place_id; price_band n/a|unknown -> null; needs_4x4 yes/no/unknown -> true/false/null
#        (unknown is NOT false); family_friendly yes/no -> true/false; price_per_night number or null.
import json, os
import pandas as pd

OUT = "../apps/web/data/places.json"
df = pd.read_excel("data/KaSetereke_complete_dataset.xlsx", sheet_name="places", keep_default_na=False)

def yes_no(v, allow_unknown):
    v = str(v).strip().lower()
    if v == "yes": return True
    if v == "no": return False
    if allow_unknown and v == "unknown": return None
    raise ValueError(f"unexpected value {v!r}")

def band(v):
    v = str(v).strip().lower()
    return None if v in ("n/a", "unknown", "") else v

def price(v):
    return None if v in ("", None) else float(v) if not float(v).is_integer() else int(v)

places = []
for _, r in df.iterrows():
    places.append({
        "id": int(str(r["place_id"]).lstrip("Pp")),
        "name": r["name"],
        "district": r["district"],
        "type": r["type"],
        "price_band": band(r["price_band"]),
        "price_per_night": price(r["price_per_night"]),
        "family_friendly": yes_no(r["family_friendly"], False),
        "needs_4x4": yes_no(r["needs_4x4"], True),
        "description": r["description"],
        "image_file": r["image_file"],
    })

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(places, f, ensure_ascii=False, indent=2)
print(f"Saved {len(places)} places to {OUT}")