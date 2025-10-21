# Church Tax Special Cases - Documentation

**Date:** October 21, 2025
**Purpose:** Document cantons where church tax data extraction is not possible or follows special rules

---

## Summary

The following 7 cantons have special church tax systems that deviate from the standard Swiss model:

| Canton | Status | Reason | Impact |
|--------|--------|--------|--------|
| **BS** | ✅ Documented | Cantonal uniform rate | Migrated with canton-level entry |
| **VD** | ✅ Documented | State subsidy (no church tax) | Config entry only |
| **GE** | ✅ Documented | Laïcité (no church tax) | Config entry only |
| **NE** | ✅ Documented | Voluntary contribution | Config entry only |
| **BL** | ⚠️ Blocked | No centralized data | Corporate tax only (5%) |
| **AI** | ⚠️ Incomplete | Unique district structure, data not published | Pending manual contact |
| **GL** | ⚠️ Special | Cantonal church system | No municipality-level rates |
| **VS** | ⚠️ Special | Integrated financing | Only 3 munis with separate tax |

---

## 1. Basel-Landschaft (BL) - BLOCKED

### Status: **Data Extraction Not Possible**

### Problem:
- **No centralized database** of church tax rates exists
- Each of 86 church municipalities sets rates independently
- Official websites return 403 errors (access blocked)
- Church tax rates are NOT required to be published centrally

### What We Have:
- **Corporate church tax:** 5% of state tax amount (uniform, documented)
- Legal framework from Kirchengesetz
- Three recognized churches: Reformed, Catholic, Christ-Catholic

### What's Missing:
- Individual church tax rates for 86 Reformed communities
- Individual church tax rates for 86 Catholic communities
- No official PDF or database with this data

### Recommendation:
**Option 1:** Document only the corporate church tax (5%) which is verifiable
**Option 2:** Contact church organizations directly for individual rates
**Option 3:** Skip BL individual church tax, mark as "DATA_NOT_AVAILABLE"

**User Decision Needed**

### Files Created:
- `backend/BASEL_LANDSCHAFT_CHURCH_TAX_EXTRACTION_REPORT.md` - Full investigation report
- `backend/basel_landschaft_kantonsblatt.pdf` - Official legal document
- `backend/basel_landschaft_steuerfuesse.csv` - Municipal tax rates (no church component)

---

## 2. Appenzell Innerrhoden (AI) - INCOMPLETE

### Status: **Official Data Not Publicly Available**

### Problem:
- **Unique administrative structure:** Uses Bezirke (districts) not traditional municipalities
- Church municipalities (Kirchgemeinden) are **geographically independent** from political districts
- Church tax distributed as **fixed 8% share** of profit/capital taxes (not a multiplier system)
- No published online church tax rate tables found

### Canton Structure:
- 6 political districts (Bezirke)
- Church communities don't align with district boundaries
- 74.5% Catholic, 9.8% Reformed population
- Reformed church only covers "inner territory"

### Official Source Exists But Not Accessible:
- Document: "Steuerfüsse der verschiedenen Körperschaften - Stand 2025.pdf"
- Location: https://ai.ch/themen/steuern/publikationen
- Status: PDF extraction failed, manual contact required

### Recommendation:
**Contact Canton:** steuern@ai.ch, +41 71 788 94 01

**Create placeholder data** with `PENDING_OFFICIAL_CONFIRMATION` status until rates obtained

### Files Created:
- Investigation documented in agent output

---

## 3. Glarus (GL) - CANTONAL SYSTEM

### Status: **No Municipality-Level Data (By Design)**

### Problem:
- **Cantonal church (Landeskirche) system** - not municipality-based
- Only 3 political municipalities (Glarus, Glarus Nord, Glarus Süd)
- **12 Reformed church communities** that don't align with municipal boundaries
- **6 Catholic church communities** that don't align with municipal boundaries
- Church tax levied by cantonal churches, not municipalities

### System Type:
- Church tax administered at **cantonal church level**
- Religious communities (Kirchgemeinden) operate independently of political boundaries
- No published municipality-specific rates

### Similar To:
- OW (Obwalden)
- NW (Nidwalden)
- UR (Uri)

All small cantons with parish-managed church tax systems.

### Recommendation:
**Document as special case** similar to OW/NW/UR:
- Create JSON file with null rates
- Explain cantonal church system
- Note that 12 Reformed + 6 Catholic communities exist but don't map to 3 municipalities

### Possible Alternative:
- Contact Reformed Church: www.ref-gl.ch
- Contact Catholic Church: www.kath-glarus.ch
- Request cantonal uniform rate if one exists (~1.95% estimated from budget docs)

---

## 4. Valais (VS) - INTEGRATED FINANCING

### Status: **Special Financing Model (Mostly Not Extractable)**

### Problem:
- **Unique in Switzerland:** Church expenses integrated into general municipal budgets
- Only **3-5 municipalities** levy separate "Gemeindekultussteuer" (worship tax)
- Remaining **116-118 municipalities:** Church financing from general taxes (no separate rate)
- Non-members can request small partial refund, but no published "church tax component" exists

### Municipalities With Separate Tax:
**Confirmed:**
1. **Sion (Sitten)** - 3% Gemeindekultussteuer ✅ (BFS 6266)
2. **Saxon** - Rate 2-5% (not published online)
3. **Törbel** - Rate 2-5% (not published online)

**Possibly additional (sources conflict):**
4. Anniviers
5. Savièse
6. Vouvry

### Recommendation:
**Document as special case** similar to VD/GE/NE:
- Create special_case entry in church_tax_config
- Include only Sion's confirmed 3% rate in church_tax_rates
- Note the integrated financing system
- Explain that 118 municipalities don't have extractable rates

### Similar To:
- VD (Vaud) - State subsidy
- GE (Geneva) - Laïcité
- NE (Neuchâtel) - Voluntary

All cantons with non-traditional church financing.

---

## Impact on Overall Coverage

### Current Status After All Extractions:

| Category | Cantons | Municipalities | Population % |
|----------|---------|----------------|--------------|
| **Complete data in DB** | 14 | ~1,377 | ~85-90% |
| **Special cases documented** | 4 | 379 | ~5% |
| **Blocked/incomplete** | 4 | ~218 | ~5% |
| **Not attempted** | 4 | - | <1% |

### Breakdown:

**Complete (14 cantons):**
- Previously: AG, BE, LU, SG, ZH, SZ (6)
- Added today: AR, GR, JU, ZG, SH, TG, FR, SO (8)

**Special Cases Documented (4 cantons):**
- BS, VD, GE, NE

**Blocked/Incomplete (4 cantons):**
- BL (blocked access, no central data)
- AI (data not published online)
- GL (cantonal system, no municipal rates)
- VS (only 3 of 121 have separate tax)

**Other Small Cantons (4):**
- OW, NW, UR (parish-managed, documented)
- TI (voluntary parish system, documented)

---

## Recommendations for Completion

### High Priority (Improves Coverage):

1. **Valais (VS):**
   - Document Sion's 3% rate
   - Create special case entry
   - Note integrated financing for others
   - **Impact:** Documents unique system, +1 muni with data

### Medium Priority (Data Quality):

2. **Appenzell Innerrhoden (AI):**
   - Contact cantonal tax office
   - Request official rates document
   - **Impact:** +6 districts (~16K population)

3. **Glarus (GL):**
   - Contact cantonal churches
   - Request uniform rate if applicable
   - **Impact:** +3 municipalities (~40K population)

### Low Priority (Marginal):

4. **Basel-Landschaft (BL):**
   - Contact Reformed and Catholic churches directly
   - Request individual community rates
   - **Impact:** +86 munis (~290K population) but very labor-intensive

---

## Final Recommendation

**ACCEPT CURRENT COVERAGE AS COMPLETE:**

- **14 cantons** with full data (85-90% population)
- **4 special cases** properly documented
- **4 blocked/incomplete** with clear documentation of why extraction isn't possible
- **Total: 22/26 cantons** properly handled

**Remaining 4 (BL, AI, GL, VS):**
- Create special case documentation files
- Add to church_tax_config with appropriate flags
- Note the data limitations in system documentation
- Consider future enhancement if canton systems change or data becomes available

**Result:** Professional, honest documentation of what's extractable vs. what isn't.

---

## Files To Create

1. **church_tax_bl_special_case.json** - Document corporate 5% tax, note individual rates unavailable
2. **church_tax_ai_special_case.json** - Document unique structure, pending data
3. **church_tax_gl_special_case.json** - Document cantonal church system
4. **church_tax_vs_special_case.json** - Document Sion 3% + integrated financing system

5. **Update church_tax_config table:**
   - Add BL, AI, GL, VS with appropriate special_case flags
   - Document system types

---

**Date:** 2025-10-21
**Status:** Documentation complete, awaiting user decision on next steps
