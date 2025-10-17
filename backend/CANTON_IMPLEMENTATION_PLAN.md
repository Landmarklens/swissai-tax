# Swiss Canton Tax Implementation Plan

## Overview
Implementation plan for all 26 Swiss cantons with municipality data and tax brackets.

**Status:** 2/26 Complete (Zurich ✅, Aargau ✅)

---

## Canton List (Alphabetical)

| # | Canton | Code | Status | Municipalities | Data Source | Notes |
|---|--------|------|--------|----------------|-------------|-------|
| 1 | Aargau | AG | ✅ **COMPLETE** | 197/197 (100%) | Official Canton PDF | All municipalities seeded |
| 2 | Appenzell Ausserrhoden | AR | ⏳ Pending | 20 | TBD | - |
| 3 | Appenzell Innerrhoden | AI | ⏳ Pending | 6 | TBD | - |
| 4 | Basel-Landschaft | BL | ⏳ Pending | 86 | TBD | - |
| 5 | Basel-Stadt | BS | ⏳ Pending | 3 | TBD | City only (no municipalities) |
| 6 | Bern | BE | ⏳ Pending | 342 | TBD | Largest canton by municipalities |
| 7 | Fribourg | FR | ⏳ Pending | 126 | TBD | Bilingual (FR/DE) |
| 8 | Geneva | GE | ⏳ Pending | 45 | TBD | - |
| 9 | Glarus | GL | ⏳ Pending | 3 | TBD | Only 3 municipalities since 2011 |
| 10 | Graubünden | GR | ⏳ Pending | 101 | TBD | Trilingual (DE/IT/RM) |
| 11 | Jura | JU | ⏳ Pending | 53 | TBD | - |
| 12 | Lucerne | LU | ⏳ Pending | 83 | TBD | - |
| 13 | Neuchâtel | NE | ⏳ Pending | 27 | TBD | - |
| 14 | Nidwalden | NW | ⏳ Pending | 11 | TBD | - |
| 15 | Obwalden | OW | ⏳ Pending | 7 | TBD | - |
| 16 | Schaffhausen | SH | ⏳ Pending | 26 | TBD | - |
| 17 | Schwyz | SZ | ⏳ Pending | 30 | TBD | - |
| 18 | Solothurn | SO | ⏳ Pending | 107 | TBD | - |
| 19 | St. Gallen | SG | ⏳ Pending | 75 | TBD | - |
| 20 | Thurgau | TG | ⏳ Pending | 80 | TBD | - |
| 21 | Ticino | TI | ⏳ Pending | 108 | TBD | Italian-speaking |
| 22 | Uri | UR | ⏳ Pending | 20 | TBD | - |
| 23 | Vaud | VD | ⏳ Pending | 300 | TBD | Second largest by municipalities |
| 24 | Valais | VS | ⏳ Pending | 122 | TBD | Bilingual (FR/DE) |
| 25 | Zug | ZG | ⏳ Pending | 11 | TBD | - |
| 26 | Zurich | ZH | ✅ **COMPLETE** | 160/160 (100%) | Official Canton CSV | All municipalities seeded |

**Total Municipalities:** ~2,136 (estimated)

---

## Implementation Phases

### Phase 1: Completed ✅
- [x] Zurich (ZH) - 160 municipalities
- [x] Aargau (AG) - 197 municipalities

### Phase 2: Large Cantons (Priority)
These cantons have the most municipalities and population:

1. **Bern (BE)** - 342 municipalities (largest)
2. **Vaud (VD)** - 300 municipalities
3. **Valais (VS)** - 122 municipalities
4. **Fribourg (FR)** - 126 municipalities
5. **Ticino (TI)** - 108 municipalities
6. **Solothurn (SO)** - 107 municipalities

### Phase 3: Medium Cantons
7. **Graubünden (GR)** - 101 municipalities
8. **Basel-Landschaft (BL)** - 86 municipalities
9. **Lucerne (LU)** - 83 municipalities
10. **Thurgau (TG)** - 80 municipalities
11. **St. Gallen (SG)** - 75 municipalities
12. **Jura (JU)** - 53 municipalities

### Phase 4: Small Cantons
13. **Geneva (GE)** - 45 municipalities
14. **Schwyz (SZ)** - 30 municipalities
15. **Neuchâtel (NE)** - 27 municipalities
16. **Schaffhausen (SH)** - 26 municipalities
17. **Appenzell Ausserrhoden (AR)** - 20 municipalities
18. **Uri (UR)** - 20 municipalities
19. **Nidwalden (NW)** - 11 municipalities
20. **Zug (ZG)** - 11 municipalities
21. **Obwalden (OW)** - 7 municipalities
22. **Appenzell Innerrhoden (AI)** - 6 municipalities
23. **Glarus (GL)** - 3 municipalities
24. **Basel-Stadt (BS)** - 3 municipalities (city canton)

---

## Data Requirements per Canton

For each canton, we need:

### 1. Municipal Tax Rates (Gemeindesteuerfüsse)
- ✅ Official government source (canton website)
- ✅ 2024 tax year data
- ✅ Complete list of all municipalities
- ✅ Tax multipliers in percentage or decimal format

### 2. Progressive Tax Brackets (Steuertarife)
- ✅ Official canton tax tariff tables
- ✅ Separate schedules for single/married
- ✅ All bracket thresholds and rates
- ✅ "Einfache Steuer" (simple tax) values

### 3. Canton Tax Multiplier (Kantonssteuerfuss)
- ✅ Official canton-level multiplier for 2024
- ✅ Source documentation

### 4. Special Rules (if applicable)
- Family adjustments/deductions
- Child tax credits
- Canton-specific rules

---

## Official Website Sources

### Completed:
- **Zurich (ZH):** https://www.zh.ch/de/steuern-finanzen/steuern/
- **Aargau (AG):** https://www.ag.ch/de/themen/steuern-finanzen/steuern/

### To Research:
- **Appenzell AR:** https://www.ar.ch/verwaltung/departement-finanzen-und-ressourcen/
- **Appenzell AI:** https://www.ai.ch/themen/steuern
- **Basel-Landschaft:** https://www.baselland.ch/politik-und-behorden/direktionen/finanz-und-kirchendirektion/steuerverwaltung
- **Basel-Stadt:** https://www.steuerverwaltung.bs.ch/
- **Bern:** https://www.be.ch/de/start/dienstleistungen/steuern.html
- **Fribourg:** https://www.fr.ch/de/finanzen-und-steuern
- **Geneva:** https://www.ge.ch/impots
- **Glarus:** https://www.gl.ch/verwaltung/finanzen-und-gesundheit/steuerverwaltung.html
- **Graubünden:** https://www.gr.ch/DE/institutionen/verwaltung/dfg/stv/Seiten/Start.aspx
- **Jura:** https://www.jura.ch/DFI/SCC/Accueil.html
- **Lucerne:** https://steuern.lu.ch/
- **Neuchâtel:** https://www.ne.ch/autorites/DEAS/SCFI/Pages/accueil.aspx
- **Nidwalden:** https://www.nw.ch/steuerverwaltung
- **Obwalden:** https://www.ow.ch/verwaltung/3360
- **Schaffhausen:** https://sh.ch/CMS/Webseite/Kanton-Schaffhausen/Beh-rde/Verwaltung/Finanzdepartement/Steueramt-1144269-DE.html
- **Schwyz:** https://www.sz.ch/privatpersonen/steuern.html
- **Solothurn:** https://so.ch/verwaltung/finanzdepartement/steueramt/
- **St. Gallen:** https://www.sg.ch/steuern-finanzen.html
- **Thurgau:** https://steuerverwaltung.tg.ch/
- **Ticino:** https://www4.ti.ch/dfe/dc/sportello-fiscale/home/
- **Uri:** https://www.ur.ch/verwaltung/2630
- **Vaud:** https://www.vd.ch/themes/etat-droit-finances/impots/
- **Valais:** https://www.vs.ch/de/web/scc
- **Zug:** https://www.zg.ch/de/steuern-finanzen/steuern

---

## Implementation Workflow per Canton

For each canton, follow these steps:

### Step 1: Research Official Sources
1. Find official canton tax administration website
2. Locate 2024 municipal tax rates document (PDF, CSV, or webpage)
3. Locate 2024 tax tariff/bracket tables
4. Document all sources with URLs

### Step 2: Extract Municipality Data
1. Download official municipality tax rate document
2. Parse data (PDF→text, CSV, or web scraping)
3. Verify completeness (check municipality count)
4. Create parsed data file

### Step 3: Define Tax Brackets
1. Extract progressive tax brackets from official tariff
2. Define separate schedules for single/married
3. Identify canton multiplier
4. Document any special rules

### Step 4: Create Calculator
1. Create `canton_tax_calculators/{canton_code}.py`
2. Implement `_load_tax_brackets()` method
3. Implement canton-specific logic (if any)
4. Add docstring with official sources

### Step 5: Create Migration
1. Generate migration file with all municipalities
2. Include official source documentation
3. Make migration idempotent
4. Test migration locally

### Step 6: Run Migration & Test
1. Run migration to seed database
2. Verify municipality count matches official data
3. Run calculator tests
4. Validate against official examples (if available)

### Step 7: Register Canton
1. Add to canton factory (`get_canton_calculator`)
2. Create unit tests
3. Update documentation

---

## Quality Assurance Checklist

For each canton implementation:

- [ ] ✅ Official government source documented
- [ ] ✅ 100% municipality coverage verified
- [ ] ✅ Tax brackets match official tariff tables
- [ ] ✅ Canton multiplier correct for 2024
- [ ] ✅ Migration is idempotent
- [ ] ✅ All tests passing
- [ ] ✅ Calculator registered in factory
- [ ] ✅ Real-world validation examples documented

---

## Next Steps

1. **Start with Bern (BE)** - Largest canton by municipalities (342)
   - Research official sources
   - Extract municipality data
   - Implement calculator and migration

2. **Continue with Vaud (VD)** - Second largest (300)
3. **Work through remaining cantons by priority**

---

## Notes

- **Data Format:** Some cantons provide CSV, others PDF. Need flexible parsing.
- **Bilingual Cantons:** FR, VS, GR have multilingual municipality names
- **City Cantons:** BS, GE have few municipalities (mostly city itself)
- **Tax Year:** All data should be for 2024
- **Validation:** Cross-check with online tax calculators where available

---

**Last Updated:** 2025-10-17
**Progress:** 2/26 cantons complete (7.7%)
