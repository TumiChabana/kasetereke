# ml/06_match_parity_test.py - check that apps/web/js/match.js gives the same Match % as Python.
# Run from ml/:   py 06_match_parity_test.py      (needs Node.js installed: https://nodejs.org)
import json, subprocess, sys
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

places = pd.read_csv("data/places_app_cleaned.csv", keep_default_na=False)
feat = pd.DataFrame({"place_id": places["place_id"]})
feat["family_friendly"] = (places["family_friendly"] == "yes").astype(int)
feat["needs_4x4"] = (places["needs_4x4"] == "yes").astype(int)
feat = pd.concat([feat, pd.get_dummies(places["type"], prefix="type"),
                  pd.get_dummies(places["price_band"], prefix="price"),
                  pd.get_dummies(places["district"], prefix="district")], axis=1).set_index("place_id").astype(float)

def profile_vec(budget, kids, four):
    v = pd.Series(0.0, index=feat.columns)
    v["family_friendly"] = 1.0 if kids else 0.0
    v["needs_4x4"] = 0.0 if four else -1.0
    b = budget.lower()
    v["price_low"] = 1.0 if b == "low" else (-1.0 if b == "high" else 0.0)
    v["price_mid"] = 1.0 if b == "mid" else 0.0
    v["price_high"] = 1.0 if b == "high" else (-1.0 if b == "low" else 0.0)
    return v.values

profiles = [("Low", True, False), ("Mid", False, True), ("High", True, True), ("Mid", False, False)]
# P01 normal stay, P05 needs 4x4, P12 needs_4x4 UNKNOWN (null in JSON), P04 heritage with price n/a
check_ids = ["P01", "P05", "P12", "P04", "P10", "P23"]
js_places = {p["id"]: p for p in json.load(open("../apps/web/data/places.json", encoding="utf-8"))}

js = """
const K = require('../apps/web/js/match.js');
const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const out = input.map(c => K.score(c.profile, c.place));
console.log(JSON.stringify(out));
"""
cases, expected = [], []
for budget, kids, four in profiles:
    pv = profile_vec(budget, kids, four)
    sims = cosine_similarity([pv], feat.loc[check_ids].values)[0]
    for pid, s in zip(check_ids, sims):
        cases.append({"profile": {"budget": budget, "withChildren": kids, "accepts4x4": four},
                      "place": js_places[int(pid[1:])]})
        expected.append(int(np.round((s + 1) / 2 * 100)))
res = subprocess.run(["node", "-e", js], input=json.dumps(cases), capture_output=True, text=True)
if res.returncode != 0:
    sys.exit("Node failed: " + res.stderr)
got = json.loads(res.stdout)
bad = [(c["profile"], c["place"]["id"], e, g) for c, e, g in zip(cases, expected, got) if e != g]
print(f"Checked {len(cases)} profile/place pairs.")
print("PASS: match.js equals Python" if not bad else f"MISMATCH: {bad}")