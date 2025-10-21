#!/bin/bash
# Cleanup script - Remove temporary and redundant files

echo "🧹 Starting cleanup of temporary and redundant files..."
echo "="

# Delete temporary extraction reports (superseded by final docs)
echo "Deleting temporary extraction reports..."
rm -f AR_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f AR_EXTRACTION_SUMMARY.txt
rm -f BASEL_LANDSCHAFT_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f BERN_CHURCH_TAX_EXTRACTION_REPORT.txt
rm -f CHURCH_TAX_EXTRACTION_AARGAU_ST_GALLEN.md
rm -f CHURCH_TAX_EXTRACTION_OW_NW_UR_REPORT.md
rm -f CHURCH_TAX_EXTRACTION_STATUS.md
rm -f CHURCH_TAX_EXTRACTION_ZG_SH.md
rm -f CHURCH_TAX_FINAL_STATUS_20251021.md
rm -f CHURCH_TAX_PHASE1_COMPLETE_20251021.md
rm -f CHURCH_TAX_RESEARCH.md
rm -f CHURCH_TAX_RESEARCH_AR_AI_SG_GR.md
rm -f CHURCH_TAX_SOURCE_VERIFICATION.md
rm -f CHURCH_TAX_VERIFICATION_REPORT.md
rm -f FRIBOURG_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f FRIBOURG_REFORMED_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f FRIBOURG_REFORMED_EXTRACTION_SUMMARY.txt
rm -f GRAUBUENDEN_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f JURA_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f LUCERNE_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f SOLOTHURN_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f THURGAU_CHURCH_TAX_EXTRACTION_REPORT.md
rm -f TICINO_CHURCH_TAX_RESEARCH_REPORT.md
rm -f ZURICH_CHURCH_TAX_REPORT.txt
rm -f OW_NW_UR_EXTRACTION_SUMMARY.txt
rm -f THURGAU_EXTRACTION_SUMMARY.txt
rm -f THURGAU_ALL_80_MUNICIPALITIES.txt

# Delete redundant status/summary files
echo "Deleting redundant status files..."
rm -f BUG_REVIEW_REPORT.md
rm -f FINAL_BUG_REPORT.md
rm -f FINAL_CHURCH_TAX_STATUS_REPORT.md
rm -f FINAL_IMPLEMENTATION_SUMMARY.md
rm -f IMPLEMENTATION_STATUS.md
rm -f IMPLEMENTATION_STATUS_REPORT.md
rm -f MIGRATION_COMPLETE.md
rm -f NEXT_CANTONS_ROADMAP.md
rm -f TAX_CALCULATION_READINESS_ANALYSIS.md
rm -f TICINO_EXTRACTION_COMPLETE.md

# Delete redundant canton deduction reports
echo "Deleting redundant canton deduction reports..."
rm -f CANTON_DEDUCTIONS_100_PERCENT_COMPLETE.md
rm -f CANTON_DEDUCTIONS_FINAL_SUMMARY.md
rm -f CANTON_DEDUCTIONS_MIGRATION_COMPLETE.md
rm -f CANTON_DEDUCTIONS_REVIEW.md

# Delete redundant implementation plan files
echo "Deleting redundant implementation plan files..."
rm -f CHURCH_TAX_IMPLEMENTATION_COMPLETE.md
rm -f CHURCH_TAX_IMPLEMENTATION_PLAN.md
rm -f SOCIAL_SECURITY_IMPLEMENTATION_COMPLETE.md
rm -f SOCIAL_SECURITY_IMPLEMENTATION_PLAN.md
rm -f WEALTH_TAX_DATA_COLLECTION.md
rm -f WEALTH_TAX_FINAL_IMPLEMENTATION.md
rm -f WEALTH_TAX_IMPLEMENTATION_SUMMARY.md
rm -f WEALTH_TAX_RESEARCH_RESULTS.md
rm -f WEALTH_TAX_COMPLETE_DATA.md

# Delete intermediate data files
echo "Deleting intermediate JSON data files..."
rm -f CHURCH_TAX_DATA_AR_AI_SG_GR.json

# Delete intermediate migration SQL files (keep only final ones)
echo "Deleting intermediate migration SQL files..."
rm -f 6cantons_consolidated_migration_sql.txt
rm -f 8cantons_migration_sql.txt
rm -f 11cantons_migration_sql.txt
rm -f bs_so_migration_sql.txt
rm -f deductions_migration_sql.txt
rm -f sz_church_tax_migration_sql.txt
rm -f fr_so_migration_sql.txt

# Delete temporary extraction scripts
echo "Deleting temporary extraction scripts..."
rm -f extract_aargau_church_tax.py
rm -f extract_ar_church_tax.py
rm -f extract_fribourg_church_tax.py
rm -f extract_schaffhausen_church_tax.py
rm -f extract_schwyz_church_tax.py
rm -f extract_solothurn_church_tax.py
rm -f extract_st_gallen_church_tax.py
rm -f extract_thurgau_church_tax.py
rm -f extract_zug_church_tax.py
rm -f parse_schaffhausen.py

# Delete temporary migration generation scripts
echo "Deleting temporary migration generation scripts..."
rm -f generate_8cantons_migration.py
rm -f generate_11cantons_migration.py
rm -f generate_bs_so_migration.py
rm -f generate_deductions_migration.py
rm -f generate_deductions_migration_batch2.py
rm -f generate_migration_data.py
rm -f generate_municipality_migration.py
rm -f generate_sz_church_tax_migration.py
rm -f generate_fr_so_migration.py
rm -f implement_remaining_cantons.sh

# Delete Bern-specific temporary files
echo "Deleting Bern temporary files..."
rm -f bern_municipalities_list.txt
rm -f bern_tax_multipliers_2024.json
rm -f bern_municipalities_complete.json
rm -f bern_municipalities_migration.sql
rm -f bern_steuerfuesse_2024.pdf
rm -f merge_bern_municipalities.py
rm -f merge_bern_with_bfs.py
rm -f generate_bern_migration.py

# Delete other temporary PDFs and working files
echo "Deleting other temporary files..."
rm -f appenzell_ausserrhoden_steuerfuesse_2024.pdf
rm -f ar_extracted.txt
rm -f ar_tax_guide_2024.pdf
rm -f bern_church_tax_final.csv
rm -f bern_church_tax_final.txt
rm -f fribourg_catholic_parishes_2023.pdf
rm -f fribourg_catholic_parishes_2023.txt
rm -f fribourg_reformed_parishes_test.pdf
rm -f graubuenden_gemeindesteuerfuesse_2024.pdf
rm -f jura_feuille_cantonale.pdf
rm -f lucerne_church_tax_rates_2024.csv
rm -f schaffhausen_steuerfuesse_2025.pdf
rm -f schwyz_steuerfuss_2025.pdf
rm -f solothurn_bfs_temp.xls
rm -f st_gallen_church_tax_2025.pdf
rm -f thurgau_steuerfuesse_2024.pdf
rm -f zug_steuerfuesse_2025.pdf

# Delete Aargau files (keep the structured JSON only)
rm -f aargau_church_tax_2025.pdf

# Delete intermediate church tax JSON files (except final structured ones)
echo "Deleting intermediate church tax data files..."
rm -f church_tax_ar_municipalities.json
rm -f church_tax_fr_catholic_2023.json
rm -f church_tax_fr_municipalities.json
rm -f church_tax_fr_reformed_estimated.json
rm -f church_tax_gr_municipalities.json
rm -f church_tax_ju_municipalities.json
rm -f church_tax_nw_municipalities.json
rm -f church_tax_ow_municipalities.json
rm -f church_tax_sh_municipalities.json
rm -f church_tax_so_municipalities.json
rm -f church_tax_sz_municipalities.json
rm -f church_tax_tg_municipalities.json
rm -f church_tax_ti_summary.json
rm -f church_tax_ur_municipalities.json
rm -f church_tax_zg_municipalities.json
rm -f church_tax_zh_municipalities.json

# Delete Thurgau intermediate files
rm -f thurgau_canton_tax_rates.json
rm -f thurgau_catholic_church_tax.json
rm -f thurgau_municipal_tax_rates.json
rm -f thurgau_reformed_church_tax.json
rm -f thurgau_school_tax_rates.json
rm -f thurgau_total_tax_rates.json

# Delete canton deduction JSON files (data now in DB)
echo "Deleting canton deduction JSON files..."
rm -f canton_deductions_*.json

# Delete special case JSON files (replaced by SPECIAL_CASES_DOCUMENTATION.md)
rm -f church_tax_bl_special_case.json
rm -f church_tax_ai_special_case.json
rm -f church_tax_gl_special_case.json
rm -f church_tax_vs_special_case.json
rm -f church_tax_bs_official.json

# Delete test/integration files
rm -f test_integration.py

# Keep only essential structured data files
echo ""
echo "✅ KEEPING essential files:"
echo "  - CRITICAL_FIXES_COMPLETE.md (main report)"
echo "  - TAX_DATA_GAP_ANALYSIS.md (comprehensive analysis)"
echo "  - DATA_GAP_PRIORITY_MATRIX.md (priority recommendations)"
echo "  - INTEGRATION_COMPLETE.md (integration docs)"
echo "  - SPECIAL_CASES_DOCUMENTATION.md (special cases)"
echo "  - CHURCH_TAX_EXTRACTION_COMPLETE.md (final church tax status)"
echo "  - aargau_church_tax_structured.json (Aargau data)"
echo "  - church_tax_fr_reformed_official.json (Fribourg Reformed official)"
echo "  - st_gallen_church_tax_structured.json (St. Gallen data)"
echo "  - zurich_church_tax_structured.json (Zurich data)"
echo "  - All alembic migration files (database history)"
echo "  - All services/ code files"
echo "  - BFS municipality files"
echo ""
echo "🎉 Cleanup complete!"
