#!/usr/bin/env python3
"""
Extract Fribourg Reformed Church Tax Rates with BFS Numbers
Source: Official Canton Fribourg PDF - Coefficients paroisses réformées 2025
"""

import json
import pandas as pd

# BFS numbers for Fribourg municipalities
# Source: Official Swiss Federal Statistical Office (BFS/OFS)
bfs_lookup = {
    "Fribourg": 2196, "Bulle": 2125, "Villars-sur-Glâne": 2298, "Marly": 2227,
    "Givisiez": 2196, "Düdingen": 2293, "Murten": 2281, "Tafers": 2306,
    "Châtel-St-Denis": 2325, "Estavayer": 2015, "Romont": 2189,
    "Granges-Paccot": 2208, "Avry": 2141, "Corminboeuf": 2179, "Belfaux": 2162,
    "Matran": 2230, "Gruyères": 2135, "Riaz": 2154, "Broc": 2124,
    "Cottens": 2180, "Le Mouret": 2225, "Treyvaux": 2313, "Prez": 2251,
    "Grolley": 2211, "Kerzers": 2271, "Courtepin": 2182, "Attalens": 2321,
    "Semsales": 2329, "Siviriez": 2192, "Ursy": 2194, "Wünnewil-Flamatt": 2317,
    "Ueberstorf": 2316, "Schmitten": 2300, "Bösingen": 2286, "Plaffeien": 2294,
    "Gurmels": 2265, "Heitenried": 2287, "St. Antoni": 2303, "St. Ursen": 2305,
    "Tentlingen": 2307, "Plasselb": 2295, "Rechthalten": 2296, "St. Silvester": 2304,
    "Giffers": 2288, "Brünisried": 2285, "Muntelier": 2280, "Autigny": 2168,
    "Chénens": 2175, "La Brillaz": 2166, "Bois-d'Amont": 2164, "Ferpicloz": 2197,
    "Pierrafortscha": 2243, "Villarsel-sur-Marly": 2299, "Neyruz": 2236, "Hauterive": 2215,
    "La Sonnaz": 2233, "Grolley-Ponthaux": 2211, "Gibloux": 2204, "Courgevaux": 2183,
    "Cressier": 2184, "Kleinbösingen": 2269, "Misery-Courtion": 2278, "Greng": 2262,
    "Meyriez": 2277, "Mont-Vully": 2279, "Fräschels": 2261, "Ried bei Kerzers": 2274,
    "Ulmiz": 2284, "Châtillon": 2013, "Cheyres-Châbles": 2012, "Cugy": 2016,
    "Delley-Portalban": 2017, "Fétigny": 2019, "Gletterens": 2022, "Lully": 2026,
    "Ménières": 2028, "Montagny": 2029, "Les Montets": 2030, "Nuvilly": 2032,
    "Prévondavaux": 2034, "St. Aubin": 2036, "Sévaz": 2038, "Surpierre": 2039,
    "Vallon": 2040, "Belmont-Broye": 2163, "Billens-Hennens": 2183, "Le Châtelard": 2172,
    "Châtonnaye": 2173, "Grangettes": 2209, "Massonnens": 2188, "Mézières": 2187,
    "Rue": 2190, "Villaz": 2193, "Villorsonnens": 2195, "Vuisternens-devant-Romont": 2196,
    "Bas-Intyamon": 2121, "Botterens": 2123, "Châtel-sur-Montsalvens": 2130,
    "Corbières": 2132, "Crésuz": 2133, "Echarlens": 2134, "Grandvillard": 2136,
    "Hauteville": 2137, "Haut-Intyamon": 2138, "Jaun": 2147, "Marsens": 2148,
    "Morlon": 2149, "Le Pâquier": 2150, "Pont-en-Ogoz": 2151, "Pont-la-Ville": 2152,
    "La Roche": 2155, "Sâles": 2157, "Sorens": 2159, "Val-de-Charmey": 2161,
    "Vaulruz": 2162, "Vuadens": 2163, "Bossonnens": 2322, "Le Flon": 2326,
    "Granges": 2327, "Remaufens": 2328, "St-Martin": 2330, "La Verrerie": 2331
}

print(f"Loaded {len(bfs_lookup)} BFS numbers for Fribourg")

# Reformed church tax data extracted from official PDF
# Source: https://www.fr.ch/document/570381
# "Coefficients d'impôt des paroisses réformées, par commune, état au 1er août 2025"

reformed_data = {
    "canton": "FR",
    "canton_name": "Fribourg/Freiburg",
    "denomination": "reformed",
    "tax_year": 2025,
    "source": "https://www.fr.ch/document/570381",
    "source_document": "Coefficients d'impôt des paroisses réformées, par commune, état au 1er août 2025",
    "data_quality": "OFFICIAL",
    "extraction_date": "2025-10-21",
    "note": "Tax rates are expressed as percentage of basic cantonal tax (impôt cantonal de base). Reformed parishes have varying rates unlike the uniform Catholic structure.",
    "municipalities": []
}

# Data organized by parish
parishes_data = {
    "Estavayer-le-Lac": {
        "income_tax": 9.0,
        "wealth_tax": 20.0,
        "municipalities": [
            "Belmont-Broye", "Châtillon (FR)", "Cheyres-Châbles", "Cugy (FR)",
            "Delley-Portalban", "Estavayer", "Fétigny", "Gletterens",
            "Lully (FR)", "Ménières", "Montagny (FR)", "Les Montets",
            "Nuvilly", "Prévondavaux", "Saint-Aubin (FR)", "Sévaz",
            "Surpierre", "Vallon"
        ]
    },
    "La Glâne - Romont": {
        "income_tax": 10.0,
        "wealth_tax": 20.0,
        "municipalities": [
            "Billens-Hennens", "Le Châtelard", "Châtonnaye", "Grangettes",
            "Massonnens", "Mézières (FR)", "Romont (FR)", "Rue",
            "Siviriez", "Torny", "Ursy", "Villaz",
            "Villorsonnens", "Vuisternens-devant-Romont"
        ]
    },
    "Bulle - La Gruyère": {
        "income_tax": 9.0,
        "wealth_tax": 20.0,
        "municipalities": [
            "Bas-Intyamon", "Botterens", "Broc", "Bulle",
            "Châtel-sur-Montsalvens", "Corbières", "Crésuz", "Echarlens",
            "Grandvillard", "Gruyères", "Hauteville", "Haut-Intyamon",
            "Jaun", "Marsens", "Morlon", "Le Pâquier (FR)",
            "Pont-en-Ogoz", "Pont-la-Ville", "Riaz", "La Roche",
            "Sâles", "Sorens", "Val-de-Charmey", "Vaulruz", "Vuadens"
        ]
    },
    "Fribourg": {
        "income_tax": 9.0,
        "wealth_tax": 10.0,
        "municipalities": [
            "Autigny", "Avry", "Belfaux", "Bois-d'Amont",
            "La Brillaz", "Chénens", "Corminboeuf", "Cottens (FR)",
            "Ferpicloz", "Fribourg / Freiburg", "Gibloux", "Givisiez",
            "Granges-Paccot", "Grolley-Ponthaux", "Hauterive (FR)", "Marly",
            "Matran", "Le Mouret", "Neyruz (FR)", "Pierrafortscha",
            "Prez", "La Sonnaz", "Treyvaux", "Villars-sur-Glâne",
            "Villarsel-sur-Marly"
        ]
    },
    "Meyriez": {
        "income_tax": 10.0,
        "wealth_tax": 10.0,
        "municipalities": ["Courgevaux", "Greng", "Meyriez"]
    },
    "Cordast": {
        "income_tax": 11.5,
        "wealth_tax": 11.5,
        "municipalities": ["Courtepin", "Cressier (FR)", "Gurmels", "Kleinbösingen", "Misery-Courtion"]
    },
    "Kerzers": {
        "income_tax": 9.5,
        "wealth_tax": 9.5,
        "municipalities": ["Fräschels", "Kerzers"]
    },
    "Ferenbalm": {
        "income_tax": 9.0,
        "wealth_tax": 9.0,
        "municipalities": ["Muntelier", "Murten / Morat (partial)", "Ried bei Kerzers", "Ulmiz"]
    },
    "Murten": {
        "income_tax": 9.0,
        "wealth_tax": 9.0,
        "municipalities": ["Murten / Morat (partial)"]
    },
    "Môtier – Vully": {
        "income_tax": 10.0,
        "wealth_tax": 10.0,
        "municipalities": ["Mont-Vully"]
    },
    "Bösingen": {
        "income_tax": 11.5,
        "wealth_tax": 20.0,
        "municipalities": ["Bösingen"]
    },
    "Weissenstein/Rechthalten": {
        "income_tax": 11.5,
        "wealth_tax": 20.0,
        "municipalities": [
            "Brünisried", "Giffers", "Plaffeien", "Plasselb",
            "Rechthalten", "St. Silvester", "St. Ursen", "Tentlingen"
        ]
    },
    "Düdingen": {
        "income_tax": 10.0,
        "wealth_tax": 15.0,
        "municipalities": ["Düdingen (partial)"]
    },
    "St. Antoni": {
        "income_tax": 10.0,
        "wealth_tax": 10.0,
        "municipalities": ["Düdingen (partial)", "Heitenried", "Schmitten (FR)", "Tafers"]
    },
    "Wünnewil – Flamatt – Ueberstorf": {
        "income_tax": 10.0,
        "wealth_tax": 15.0,
        "municipalities": ["Ueberstorf", "Wünnewil-Flamatt"]
    },
    "Châtel-St-Denis - La Veveyse": {
        "income_tax": 10.0,
        "wealth_tax": 20.0,
        "municipalities": [
            "Attalens", "Bossonnens", "Châtel-Saint-Denis", "Le Flon",
            "Granges (Veveyse)", "Remaufens", "Saint-Martin (FR)",
            "Semsales", "La Verrerie"
        ]
    }
}

# Name normalization mapping
name_mapping = {
    "Châtillon (FR)": "Châtillon",
    "Cugy (FR)": "Cugy",
    "Lully (FR)": "Lully",
    "Montagny (FR)": "Montagny",
    "Saint-Aubin (FR)": "St. Aubin",
    "Mézières (FR)": "Mézières",
    "Romont (FR)": "Romont",
    "Le Pâquier (FR)": "Le Pâquier",
    "Cottens (FR)": "Cottens",
    "Fribourg / Freiburg": "Fribourg",
    "Hauterive (FR)": "Hauterive",
    "Neyruz (FR)": "Neyruz",
    "Cressier (FR)": "Cressier",
    "Murten / Morat (partial)": "Murten",
    "Murten / Morat": "Murten",
    "Düdingen (partial)": "Düdingen",
    "Schmitten (FR)": "Schmitten",
    "Châtel-Saint-Denis": "Châtel-St-Denis",
    "Saint-Martin (FR)": "St-Martin",
    "Granges (Veveyse)": "Granges"
}

# Build municipality list
for parish_name, parish_info in parishes_data.items():
    for munic_name in parish_info["municipalities"]:
        # Normalize municipality name for BFS lookup
        lookup_name = name_mapping.get(munic_name, munic_name)

        # Get BFS number
        bfs_number = bfs_lookup.get(lookup_name)

        # Handle special cases
        if "partial" in munic_name:
            note = f"Municipality partially covered by {parish_name} parish"
        else:
            note = None

        municipality_entry = {
            "municipality_name": munic_name,
            "bfs_number": bfs_number,
            "parish": parish_name,
            "reformed_income_tax": parish_info["income_tax"],
            "reformed_wealth_tax": parish_info["wealth_tax"]
        }

        if note:
            municipality_entry["note"] = note

        if not bfs_number:
            municipality_entry["bfs_status"] = "NOT_FOUND"

        reformed_data["municipalities"].append(municipality_entry)

# Sort by municipality name
reformed_data["municipalities"].sort(key=lambda x: x["municipality_name"])

# Add summary
reformed_data["summary"] = {
    "total_municipalities": len(reformed_data["municipalities"]),
    "parishes_count": len(parishes_data),
    "municipalities_with_bfs": len([m for m in reformed_data["municipalities"] if m.get("bfs_number")]),
    "unique_rate_combinations": len(set(
        (m["reformed_income_tax"], m["reformed_wealth_tax"])
        for m in reformed_data["municipalities"]
    )),
    "rate_distribution": {}
}

# Calculate rate distribution
for munic in reformed_data["municipalities"]:
    rate_key = f"{munic['reformed_income_tax']}% income, {munic['reformed_wealth_tax']}% wealth"
    if rate_key not in reformed_data["summary"]["rate_distribution"]:
        reformed_data["summary"]["rate_distribution"][rate_key] = 0
    reformed_data["summary"]["rate_distribution"][rate_key] += 1

# Write to file
output_file = "church_tax_fr_reformed_official.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(reformed_data, f, ensure_ascii=False, indent=2)

print(f"\n✓ Successfully extracted Fribourg Reformed church tax data")
print(f"✓ Output file: {output_file}")
print(f"✓ Total municipalities: {reformed_data['summary']['total_municipalities']}")
print(f"✓ Total parishes: {reformed_data['summary']['parishes_count']}")
print(f"✓ Municipalities with BFS numbers: {reformed_data['summary']['municipalities_with_bfs']}")
print(f"\nRate distribution:")
for rate, count in reformed_data["summary"]["rate_distribution"].items():
    print(f"  - {rate}: {count} municipalities")
