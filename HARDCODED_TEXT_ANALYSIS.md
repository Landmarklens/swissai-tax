# Comprehensive Hardcoded Text Analysis - SwissAI Tax Frontend

## Executive Summary

- **Total Files Scanned**: 372
- **Files with Hardcoded Text**: 287
- **Files WITHOUT i18n Import**: 168
- **Total Hardcoded Strings Found**: 3572

- **Percentage of Files with Hardcoded Text**: 77.2%

---

## Top 30 Files with Most Hardcoded Text

| Rank | File | Count | Has i18n | Priority |
|------|------|-------|----------|----------|
| 1 | `db.js` | 214 | ❌ | 🔴 HIGH |
| 2 | `components/PropertyImporterWithSetup.jsx` | 132 | ✅ | 🟡 MEDIUM |
| 3 | `components/sections/FAQ/LandlordFAQ.jsx` | 112 | ✅ | 🟡 MEDIUM |
| 4 | `landlordArticles.js` | 93 | ❌ | 🔴 HIGH |
| 5 | `components/sections/featureSection/EnhancedFeatureBox.jsx` | 65 | ✅ | 🟡 MEDIUM |
| 6 | `components/EmailForwardingModal.jsx` | 64 | ✅ | 🟡 MEDIUM |
| 7 | `pages/Policy/Policy.jsx` | 63 | ✅ | 🟡 MEDIUM |
| 8 | `utils/validation/schemaFactory.js` | 58 | ❌ | 🔴 HIGH |
| 9 | `pages/Contact/Contact.jsx` | 57 | ✅ | 🟡 MEDIUM |
| 10 | `pages/TaxFiling/FilingsListPage.jsx` | 55 | ✅ | 🟡 MEDIUM |
| 11 | `faqData.js` | 43 | ❌ | 🔴 HIGH |
| 12 | `constants/taxConstants.js` | 43 | ❌ | 🔴 HIGH |
| 13 | `components/sections/workSection/WorkSection.jsx` | 43 | ✅ | 🟡 MEDIUM |
| 14 | `pages/Terms/Terms.jsx` | 42 | ✅ | 🟡 MEDIUM |
| 15 | `pages/TaxFiling/SubmissionPage.jsx` | 37 | ✅ | 🟡 MEDIUM |
| 16 | `components/TenantSelection/ApplicationDetailModal.jsx` | 36 | ❌ | 🔴 HIGH |
| 17 | `components/TenantSelection/ViewingSlotManager.jsx` | 35 | ❌ | 🔴 HIGH |
| 18 | `store/slices/documentsSlice.js` | 34 | ❌ | 🔴 HIGH |
| 19 | `components/paymentForm/PaymentForm.jsx` | 34 | ❌ | 🔴 HIGH |
| 20 | `pages/TaxFiling/PaymentPage.jsx` | 34 | ✅ | 🟡 MEDIUM |
| 21 | `pages/Settings/components/PreferencesTab.jsx` | 34 | ✅ | 🟡 MEDIUM |
| 22 | `pages/TaxFiling/DocumentUpload.js` | 33 | ❌ | 🔴 HIGH |
| 23 | `pages/Settings/components/BillingTab.jsx` | 32 | ✅ | 🟡 MEDIUM |
| 24 | `components/modals/RecommendationDetailsModal.jsx` | 30 | ✅ | 🟡 MEDIUM |
| 25 | `components/Auth/TaxLoginModal.js` | 30 | ❌ | 🔴 HIGH |
| 26 | `pages/TaxFiling/ReviewPage.jsx` | 30 | ✅ | 🟡 MEDIUM |
| 27 | `components/Interview/DocumentChecklist.js` | 29 | ❌ | 🔴 HIGH |
| 28 | `components/ComparisonTable/ComparisonTable.jsx` | 28 | ✅ | 🟡 MEDIUM |
| 29 | `components/TwoFactor/TwoFactorSettings.jsx` | 27 | ❌ | 🔴 HIGH |
| 30 | `utils/debugLogger.js` | 26 | ❌ | 🔴 HIGH |

---

## Findings by Category

### String Literal (3194 occurrences)

- **landlordArticles.js:4** - `How to List Your Property on HomeAI`
- **landlordArticles.js:5** - `Getting Started`
- **landlordArticles.js:7** - `Step-by-step guide to creating your first property listing`
- **landlordArticles.js:16** - `Add New Property`
- **landlordArticles.js:61** - `Publish`
- **landlordArticles.js:155** - `Employment Status`
- **landlordArticles.js:156** - `Rental History`
- **landlordArticles.js:157** - `References`
- **landlordArticles.js:158** - `Other Factors`
- **landlordArticles.js:229** - `Managing Property Viewings Efficiently`
- **landlordArticles.js:230** - `Property Management`
- **landlordArticles.js:375** - `Can I paint the walls?`
- **landlordArticles.js:376** - `Minor changes with approval and return to original state`
- **landlordArticles.js:378** - `Is the rent negotiable?`
- **landlordArticles.js:379** - `The price reflects market value and property features`
- **landlordArticles.js:381** - `When is the earliest move-in?`
- **landlordArticles.js:384** - `Are pets allowed?`
- **landlordArticles.js:385** - `Small pets negotiable with deposit`
- **landlordArticles.js:387** - `How much are utilities typically?`
- **landlordArticles.js:479** - `Digital Lease Agreements and Documentation`

_... and 3174 more_

### Jsx Text (152 occurrences)

- **landlordArticles.js:1617** - `|Score`
- **hooks/useSteps.js:15** - `= initialStep && step`
- **components/PropertyImporterWithJobs.jsx:326** - `Import Process:`
- **components/EmailForwardingModal.jsx:214** - `Gmail`
- **components/EmailForwardingModal.jsx:215** - `Outlook/Hotmail`
- **components/EmailForwardingModal.jsx:216** - `Yahoo Mail`
- **components/EmailForwardingModal.jsx:217** - `iCloud Mail`
- **components/EmailForwardingModal.jsx:218** - `Other`
- **components/ImportJobProgress.jsx:304** - `2000 && currentProg`
- **components/PropertyImporterWithSetup.jsx:1260** - `Gmail`
- **components/PropertyImporterWithSetup.jsx:1261** - `Outlook/Hotmail`
- **components/PropertyImporterWithSetup.jsx:1262** - `Yahoo Mail`
- **components/PropertyImporterWithSetup.jsx:1263** - `iCloud Mail`
- **components/PropertyImporterWithSetup.jsx:1264** - `Other`
- **components/MultiCantonDashboard/OptimizationPanel.js:107** - `Tax Optimization Recommendations`
- **components/MultiCantonDashboard/OptimizationPanel.js:277** - `Disclaimer:`
- **components/MultiCantonDashboard/OptimizationPanel.js:287** - `Close`
- **components/MultiCantonDashboard/MultiCantonDashboard.js:246** - `Multi-Canton Filing:`
- **components/MultiCantonDashboard/MultiCantonDashboard.js:343** - `Federal:`
- **components/MultiCantonDashboard/MultiCantonDashboard.js:349** - `Cantonal:`

_... and 132 more_

### Button Text (135 occurrences)

- **components/PropertyImporterWithJobs.jsx:226** - `Close`
- **components/PropertyImporterWithJobs.jsx:303** - `}
                  >
                    Paste`
- **components/PropertyImporterWithJobs.jsx:339** - `Cancel`
- **components/PropertyImporterWithJobs.jsx:342** - `}
          >
            {isCreatingJob ? 'Starting Import...' : 'Start Import'}`
- **components/EmailForwardingModal.jsx:312** - `{t('Cancel')}`
- **components/EmailForwardingModal.jsx:320** - `{t('Complete')}`
- **components/ImportJobProgress.jsx:492** - `Cancel Import`
- **components/ImportJobProgress.jsx:502** - `onComplete?.(jobStatus.property_id, jobStatus)}
            >
              View Property`
- **components/ImportJobProgress.jsx:511** - `window.location.reload()}
            >
              Try Again`
- **components/PropertyImporterWithSetup.jsx:652** - `}
                >
                  {t('Paste')}`
- **components/PropertyImporterWithSetup.jsx:671** - `}
        >
          {isCreatingJob ? t('Starting Import...') : t('Import Property')}`
- **components/PropertyImporterWithSetup.jsx:986** - `}
            >
              {t('Upload Documents')}`
- **components/PropertyImporterWithSetup.jsx:1119** - `}
      >
        {t('Add Time Slot')}`
- **components/PropertyImporterWithSetup.jsx:1439** - `{activeStep === 4 ?
                (isSubmitting ? t('Completing...') : t('Complete')) :
                t('Continue')
              }`
- **components/PropertyImporterWithSetup.jsx:1457** - `{t('Done')}`
- **components/ErrorBoundary.jsx:170** - `window.location.reload()}
                >
                  Reload Page`
- **assets/svg/Document.jsx:24** - `}
        >
          Add Lease`
- **components/searchBar/SearchBar.jsx:202** - `{t('Start Your Search')}`
- **components/searchBar/SearchBar.jsx:244** - `{t('Start Your Search')}`
- **components/paymentPlanModal/PaymentPlanModal.jsx:45** - `{t('Cancel')}`

_... and 115 more_

### Toast Message (30 occurrences)

- **components/PropertyImporterWithJobs.jsx:169** - `Property imported successfully! Redirecting to your properties...`
- **components/EmailForwardingModal.jsx:123** - `Email address copied to clipboard!`
- **components/ImportJobProgress.jsx:132** - `✅ Property import completed successfully!`
- **components/ImportJobProgress.jsx:248** - `✅ Property import completed successfully!`
- **components/PropertyImporterWithSetup.jsx:1134** - `Email address copied to clipboard!`
- **utils/index.jsx:27** - `Bad Request: Please check your input.`
- **utils/index.jsx:30** - `Unauthorized: Please log in.`
- **utils/index.jsx:33** - `Forbidden: You don`
- **utils/index.jsx:36** - `Not Found: The resource could not be found.`
- **utils/index.jsx:39** - `Internal Server Error: Please try again later.`
- **utils/index.jsx:47** - `No response received from server.`
- **config/axiosConfig.js:71** - `Session expired. Please login again.`
- **config/axiosConfig.js:82** - `Your account has been deactivated. Please contact support.`
- **config/axiosConfig.js:84** - `You don`
- **config/axiosConfig.js:90** - `The requested resource was not found`
- **config/axiosConfig.js:137** - `Server error. Please try again later.`
- **config/axiosConfig.js:147** - `No response from server. Please check your connection.`
- **config/axiosConfig.js:150** - `Request failed. Please try again.`
- **components/modals/PropertyFeedbackModal.jsx:70** - `Please enter your feedback.`
- **components/modals/PropertyFeedbackModal.jsx:75** - `Please provide a rating.`

_... and 10 more_

### Placeholder (28 occurrences)

- **components/TwoFactor/TwoFactorVerifyModal.jsx:140** - `XXXX-XXXX`
- **components/modals/signContractModal.jsx:69** - `Jon Adams`
- **components/modals/signContractModal.jsx:110** - `Signature`
- **components/modals/addLeaseModal.jsx:214** - `Jon Adams`
- **components/paymentForm/PaymentForm.jsx:38** - `Enter Cardholder Name`
- **components/paymentForm/PaymentForm.jsx:43** - `XXXX XXXX XXXX XXXX`
- **components/paymentForm/PaymentForm.jsx:46** - `MM/YY`
- **components/paymentForm/PaymentForm.jsx:60** - `Enter First name`
- **components/paymentForm/PaymentForm.jsx:63** - `Enter Last name`
- **components/paymentForm/PaymentForm.jsx:74** - `Select Country`
- **components/paymentForm/PaymentForm.jsx:84** - `Enter City`
- **components/paymentForm/PaymentForm.jsx:95** - `Select State`
- **components/paymentForm/PaymentForm.jsx:105** - `Enter ZIP`
- **components/paymentForm/PaymentForm.jsx:110** - `Enter Address`
- **components/Interview/QuestionCard.js:109** - `Enter your answer`
- **components/Interview/QuestionCard.js:123** - `Enter a number`
- **components/Interview/QuestionCard.js:253** - `Enter your answer`
- **components/Interview/QuestionCard.js:278** - `Enter value`
- **components/Interview/QuestionCard.js:319** - `Enter number`
- **components/TaxFiling/QuestionCard.js:185** - `Enter your answer`

_... and 8 more_

### Title (19 occurrences)

- **components/EmailForwardingModal.jsx:187** - `Copy to clipboard`
- **components/PropertyImporterWithSetup.jsx:1233** - `Copy to clipboard`
- **components/MultiCantonDashboard/FilingCard.js:163** - `Modern eCH-0196 PDF with barcode (recommended)`
- **components/MultiCantonDashboard/MultiCantonDashboard.js:217** - `Download all PDFs as ZIP`
- **components/MultiCantonDashboard/MultiCantonDashboard.js:227** - `Refresh data`
- **components/TwoFactor/TwoFactorSetup.jsx:245** - `Copy to clipboard`
- **components/modals/upgradeModal.jsx:83** - `Premium Advance Search`
- **components/Analytics/AIAnalyticsDashboard.jsx:585** - `Refresh Data`
- **components/Analytics/AIAnalyticsDashboard.jsx:591** - `Export Report`
- **components/Analytics/EnhancedAIAnalyticsDashboard.jsx:500** - `Refresh Data`
- **components/Analytics/EnhancedAIAnalyticsDashboard.jsx:515** - `Export Report`
- **components/PropertyImport/steps/CompletionStep.jsx:284** - `Get help`
- **pages/Terms/Terms.jsx:14** - `Terms of Service - SwissTax`
- **pages/ResetPassword/ResetPassword.jsx:91** - `Reset Password - SwissAI Tax`
- **pages/GoogleCallback/GoogleCallback.jsx:91** - `Signing in... - HomeAI`
- **pages/Policy/Policy.jsx:14** - `Privacy Policy - SwissTax`
- **pages/NotFound/index.js:51** - `404 - Page Not Found | HomeAI`
- **pages/ForgotPassword/ForgotPassword.jsx:75** - `Reset Password - SwissAI Tax`
- **pages/Settings/components/DataExportSection.jsx:144** - `Refresh exports list`

### Alt Text (10 occurrences)

- **components/TwoFactor/TwoFactorSetup.jsx:225** - `2FA QR Code`
- **components/chatUpload/UploadedImages.jsx:126** - `Uploaded`
- **components/chatUpload/UploadedImages.jsx:155** - `HOME AI Logo`
- **components/chatUpload/ImageUpload.jsx:68** - `HOME AI Logo`
- **components/pages/DocumentSigningPage.jsx:388** - `Your Signature`
- **components/LoggedInFooter/LoggedInFooter.jsx:70** - `HOME AI Logo`
- **components/sections/missionStatements/MissionStatements.jsx:106** - `HomeAI`
- **components/sections/AboutUs1/AboutUs1.jsx:42** - `HomeAI`
- **components/sections/AboutUs2/AboutUs2.jsx:89** - `HomeAI`
- **components/sections/aiCard/AICard.jsx:67** - `Background Image`

### Aria Label (4 occurrences)

- **components/galleryCard/GalleryCard.jsx:530** - `Like`
- **components/galleryCard/GalleryCard.jsx:533** - `Dislike`
- **components/passwordField/index.jsx:41** - `toggle password visibility`
- **components/sections/workSection/WorkSection.jsx:480** - `User Type`

---

## Detailed File-by-File Analysis

### `db.js`

- **Total Hardcoded Strings**: 214
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 8 | string_literal | `Alice B....` | `alice_b` |
| 9 | string_literal | `Bahnhofstrasse 10, 8001 Zürich...` | `bahnhofstrasse_10_8001_zrich` |
| 14 | string_literal | `I was able to find the perfect home in no time. Th...` | `i_was_able_to` |
| 18 | string_literal | `Michael K....` | `michael_k` |
| 19 | string_literal | `Rämistrasse 28, 8001 Zürich...` | `rmistrasse_28_8001_zrich` |
| 23 | string_literal | `Very efficient and user-friendly. Found a great pl...` | `very_efficient_and_user` |
| 27 | string_literal | `Olivia H....` | `olivia_h` |
| 28 | string_literal | `Limmatquai 70, 8001 Zürich...` | `limmatquai_70_8001_zrich` |
| 32 | string_literal | `A fantastic experience! The AI-driven search made ...` | `a_fantastic_experience_the` |
| 36 | string_literal | `David G....` | `david_g` |
| 37 | string_literal | `Seefeldstrasse 123, 8008 Zürich...` | `seefeldstrasse_123_8008_zrich` |
| 41 | string_literal | `Good service, though I had some minor issues with ...` | `good_service_though_i` |
| 45 | string_literal | `Sophia M....` | `sophia_m` |
| 46 | string_literal | `Niederdorfstrasse 66, 8001 Zürich...` | `niederdorfstrasse_66_8001_zrich` |
| 50 | string_literal | `Easy to use and reliable. I found a great apartmen...` | `easy_to_use_and` |
| 54 | string_literal | `Liam T....` | `liam_t` |
| 55 | string_literal | `Zurichbergstrasse 112, 8044 Zürich...` | `zurichbergstrasse_112_8044_zrich` |
| 59 | string_literal | `This service saved me so much time. Highly recomme...` | `this_service_saved_me` |
| 63 | string_literal | `Chloe F....` | `chloe_f` |
| 64 | string_literal | `Langstrasse 50, 8004 Zürich...` | `langstrasse_50_8004_zrich` |
| 68 | string_literal | `Smooth process from start to finish. The insights ...` | `smooth_process_from_start` |
| 72 | string_literal | `James R....` | `james_r` |
| 73 | string_literal | `Sihlquai 10, 8005 Zürich...` | `sihlquai_10_8005_zrich` |
| 77 | string_literal | `The best way to find a home. Simple, efficient, an...` | `the_best_way_to` |
| 81 | string_literal | `Isabella N....` | `isabella_n` |
| 82 | string_literal | `Europaallee 21, 8004 Zürich...` | `europaallee_21_8004_zrich` |
| 86 | string_literal | `I had a great experience. Found a nice place quick...` | `i_had_a_great` |
| 91 | string_literal | `Search Frequency...` | `search_frequency` |
| 92 | string_literal | `Ranges from daily (Free) to real-time (Pro and VIP...` | `ranges_from_daily_free` |
| 95 | string_literal | `Search Scope:...` | `search_scope` |
| 97 | string_literal | `Limited to 1 match per month in Free, 10 in Premiu...` | `limited_to_1_match` |
| 100 | string_literal | `Data Analysis:...` | `data_analysis` |
| 105 | string_literal | `Support:...` | `support` |
| 107 | string_literal | `Community-based in Free, email support in Premium,...` | `community_based_in_free` |
| 110 | string_literal | `Exclusive Extras:...` | `exclusive_extras` |
| 121 | string_literal | `Basic plan for essential needs...` | `basic_plan_for_essential` |
| 124 | string_literal | `Basic Property Matching...` | `basic_property_matching` |
| 126 | string_literal | `The AI matches properties based on essential crite...` | `the_ai_matches_properties` |
| 129 | string_literal | `Daily Market Scan...` | `daily_market_scan` |
| 130 | string_literal | `Property scans once a day....` | `property_scans_once_a` |
| 133 | string_literal | `Limited Search Scope...` | `limited_search_scope` |
| 134 | string_literal | `Up to 1 active property match per month....` | `up_to_1_active` |
| 138 | string_literal | `The AI analyzes only property descriptions without...` | `the_ai_analyzes_only` |
| 141 | string_literal | `Community Support...` | `community_support` |
| 142 | string_literal | `Access to a user community for help and advice....` | `access_to_a_user` |
| 150 | string_literal | `Ideal for users with simple needs or just starting...` | `ideal_for_users_with` |
| 153 | string_literal | `Experience AI-driven property search at no cost....` | `experience_ai_driven_property` |
| 156 | string_literal | `Get Started...` | `get_started` |
| 161 | string_literal | `Advanced Search...` | `advanced_search` |
| 163 | string_literal | `CHF99.99...` | `chf99_99` |

### `components/PropertyImporterWithSetup.jsx`

- **Total Hardcoded Strings**: 132
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 1260 | jsx_text | `Gmail...` | `gmail` |
| 1261 | jsx_text | `Outlook/Hotmail...` | `outlook_hotmail` |
| 1262 | jsx_text | `Yahoo Mail...` | `yahoo_mail` |
| 1263 | jsx_text | `iCloud Mail...` | `icloud_mail` |
| 1264 | jsx_text | `Other...` | `other` |
| 1233 | title | `Copy to clipboard...` | `copy_to_clipboard` |
| 652 | button_text | `}
                >
                  {t('Paste')}...` | `t_paste` |
| 671 | button_text | `}
        >
          {isCreatingJob ? t('Starting...` | `iscreatingjob_t_starting_import` |
| 986 | button_text | `}
            >
              {t('Upload Documents...` | `t_upload_documents` |
| 1119 | button_text | `}
      >
        {t('Add Time Slot')}...` | `t_add_time_slot` |
| 1439 | button_text | `{activeStep === 4 ?
                (isSubmitting ...` | `activestep_4_issubmitting_t` |
| 1457 | button_text | `{t('Done')}...` | `t_done` |
| 73 | string_literal | `Import Property...` | `import_property` |
| 73 | string_literal | `Property Details...` | `property_details` |
| 73 | string_literal | `Viewing Schedule...` | `viewing_schedule` |
| 73 | string_literal | `Email Setup...` | `email_setup` |
| 73 | string_literal | `Complete...` | `complete` |
| 142 | string_literal | `Homegate...` | `homegate` |
| 143 | string_literal | `ImmoScout24...` | `immoscout24` |
| 144 | string_literal | `Flatfox...` | `flatfox` |
| 193 | string_literal | `Failed to paste from clipboard:...` | `failed_to_paste_from` |
| 206 | string_literal | `No authentication token available...` | `no_authentication_token_available` |
| 225 | string_literal | `Invalid response format...` | `invalid_response_format` |
| 228 | string_literal | `Failed to create import job...` | `failed_to_create_import` |
| 232 | string_literal | `Failed to start import...` | `failed_to_start_import` |
| 286 | string_literal | `Imported Property...` | `imported_property` |
| 324 | string_literal | `No property data in config...` | `no_property_data_in` |
| 329 | string_literal | `Imported Property...` | `imported_property` |
| 330 | string_literal | `Property successfully imported....` | `property_successfully_imported` |
| 347 | string_literal | `Imported Property #...` | `imported_property` |
| 348 | string_literal | `Property successfully imported. Details are being ...` | `property_successfully_imported_details` |
| 453 | string_literal | `Please add at least one viewing slot...` | `please_add_at_least` |
| 480 | string_literal | `FIRST_COME...` | `first_come` |
| 500 | string_literal | `Income Proof...` | `income_proof` |
| 500 | string_literal | `References...` | `references` |
| 544 | string_literal | `Failed to upload document:...` | `failed_to_upload_document` |
| 573 | string_literal | `Failed to fetch property details:...` | `failed_to_fetch_property` |
| 610 | string_literal | `Supported Platforms...` | `supported_platforms` |
| 634 | string_literal | `Property Listing URL...` | `property_listing_url` |
| 641 | string_literal | `Please enter a valid URL from a supported platform...` | `please_enter_a_valid` |
| 642 | string_literal | `Paste the complete URL from the property listing p...` | `paste_the_complete_url` |
| 678 | string_literal | `Starting Import......` | `starting_import` |
| 678 | string_literal | `Import Property...` | `import_property` |
| 696 | string_literal | `Property Details Review...` | `property_details_review` |
| 700 | string_literal | `Please review the imported property details and im...` | `please_review_the_imported` |
| 709 | string_literal | `Property Images...` | `property_images` |
| 766 | string_literal | `No images available for this property...` | `no_images_available_for` |
| 778 | string_literal | `No title available...` | `no_title_available` |
| 782 | string_literal | `Address...` | `address` |
| 785 | string_literal | `No address available...` | `no_address_available` |

### `components/sections/FAQ/LandlordFAQ.jsx`

- **Total Hardcoded Strings**: 112
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 107 | string_literal | `Security & Compliance...` | `security_compliance` |
| 112 | string_literal | `ROI & Pricing...` | `roi_pricing` |
| 117 | string_literal | `Integration & Setup...` | `integration_setup` |
| 122 | string_literal | `Success Metrics...` | `success_metrics` |
| 133 | string_literal | `End-to-end encryption for all communications...` | `end_to_end_encryption` |
| 134 | string_literal | `Swiss data residency guarantees...` | `swiss_data_residency_guarantees` |
| 135 | string_literal | `Regular security audits and penetration testing...` | `regular_security_audits_and` |
| 136 | string_literal | `ISO 27001 compliance in progress...` | `iso_27001_compliance_in` |
| 141 | string_literal | `Are you compliant with Swiss rental laws?...` | `are_you_compliant_with` |
| 142 | string_literal | `Yes, our platform is fully compliant with Swiss fe...` | `yes_our_platform_is` |
| 144 | string_literal | `Updated templates for all 26 cantons...` | `updated_templates_for_all` |
| 146 | string_literal | `Regular legal updates and notifications...` | `regular_legal_updates_and` |
| 147 | string_literal | `Built-in rent control calculations...` | `built_in_rent_control` |
| 148 | string_literal | `Proper notice period management...` | `proper_notice_period_management` |
| 155 | string_literal | `GDPR-compliant consent management...` | `gdpr_compliant_consent_management` |
| 158 | string_literal | `Anonymous analytics only...` | `anonymous_analytics_only` |
| 159 | string_literal | `No data sharing with third parties without consent...` | `no_data_sharing_with` |
| 163 | string_literal | `What happens to my data if I cancel?...` | `what_happens_to_my` |
| 164 | string_literal | `You retain full ownership of your data. Upon cance...` | `you_retain_full_ownership` |
| 166 | string_literal | `Full data export in standard formats (CSV, PDF)...` | `full_data_export_in` |
| 168 | string_literal | `Secure deletion certificates provided...` | `secure_deletion_certificates_provided` |
| 169 | string_literal | `Option to pause instead of delete...` | `option_to_pause_instead` |
| 170 | string_literal | `No lock-in or proprietary formats...` | `no_lock_in_or` |
| 176 | string_literal | `How much time will I actually save?...` | `how_much_time_will` |
| 185 | string_literal | `Based on CHF 50/hour value of time, that...` | `based_on_chf_50` |
| 189 | string_literal | `For landlords with 3-5 properties, the platform ty...` | `for_landlords_with_3` |
| 191 | string_literal | `Average vacancy reduction...` | `average_vacancy_reduction` |
| 192 | string_literal | `Daily rental loss avoided...` | `daily_rental_loss_avoided` |
| 192 | string_literal | `CHF 70-100...` | `chf_70_100` |
| 193 | string_literal | `Monthly savings from vacancy...` | `monthly_savings_from_vacancy` |
| 193 | string_literal | `CHF 840-1200...` | `chf_840_1200` |
| 194 | string_literal | `Platform cost (3 properties)...` | `platform_cost_3_properties` |
| 194 | string_literal | `CHF 147...` | `chf_147` |
| 195 | string_literal | `Net monthly benefit...` | `net_monthly_benefit` |
| 195 | string_literal | `CHF 693-1053...` | `chf_693_1053` |
| 199 | string_literal | `Are there hidden costs?...` | `are_there_hidden_costs` |
| 202 | string_literal | `Unlimited property listings...` | `unlimited_property_listings` |
| 203 | string_literal | `All applicant screenings...` | `all_applicant_screenings` |
| 204 | string_literal | `Document generation and e-signatures...` | `document_generation_and_e` |
| 205 | string_literal | `Market analytics and pricing tools...` | `market_analytics_and_pricing` |
| 210 | string_literal | `Can I try before committing?...` | `can_i_try_before` |
| 211 | string_literal | `Yes! We offer a 7-day free trial with full access ...` | `yes_we_offer_a` |
| 213 | string_literal | `Full feature access during trial...` | `full_feature_access_during` |
| 214 | string_literal | `Up to 3 properties...` | `up_to_3_properties` |
| 216 | string_literal | `Export data anytime...` | `export_data_anytime` |
| 217 | string_literal | `Cancel without any charges...` | `cancel_without_any_charges` |
| 223 | string_literal | `How long does setup take?...` | `how_long_does_setup` |
| 224 | string_literal | `Most landlords are fully set up within 15 minutes....` | `most_landlords_are_fully` |
| 226 | string_literal | `Create account...` | `create_account` |
| 227 | string_literal | `Import/add properties...` | `import_add_properties` |

### `landlordArticles.js`

- **Total Hardcoded Strings**: 93
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 1617 | jsx_text | `|Score...` | `score` |
| 4 | string_literal | `How to List Your Property on HomeAI...` | `how_to_list_your` |
| 5 | string_literal | `Getting Started...` | `getting_started` |
| 7 | string_literal | `Step-by-step guide to creating your first property...` | `step_by_step_guide` |
| 16 | string_literal | `Add New Property...` | `add_new_property` |
| 61 | string_literal | `Publish...` | `publish` |
| 155 | string_literal | `Employment Status...` | `employment_status` |
| 156 | string_literal | `Rental History...` | `rental_history` |
| 157 | string_literal | `References...` | `references` |
| 158 | string_literal | `Other Factors...` | `other_factors` |
| 229 | string_literal | `Managing Property Viewings Efficiently...` | `managing_property_viewings_efficiently` |
| 230 | string_literal | `Property Management...` | `property_management` |
| 375 | string_literal | `Can I paint the walls?...` | `can_i_paint_the` |
| 376 | string_literal | `Minor changes with approval and return to original...` | `minor_changes_with_approval` |
| 378 | string_literal | `Is the rent negotiable?...` | `is_the_rent_negotiable` |
| 379 | string_literal | `The price reflects market value and property featu...` | `the_price_reflects_market` |
| 381 | string_literal | `When is the earliest move-in?...` | `when_is_the_earliest` |
| 384 | string_literal | `Are pets allowed?...` | `are_pets_allowed` |
| 385 | string_literal | `Small pets negotiable with deposit...` | `small_pets_negotiable_with` |
| 387 | string_literal | `How much are utilities typically?...` | `how_much_are_utilities` |
| 479 | string_literal | `Digital Lease Agreements and Documentation...` | `digital_lease_agreements_and` |
| 480 | string_literal | `Legal & Compliance...` | `legal_compliance` |
| 482 | string_literal | `Navigate Swiss rental contracts and legal requirem...` | `navigate_swiss_rental_contracts` |
| 725 | string_literal | `Property Management...` | `property_management` |
| 1003 | string_literal | `AI Features...` | `ai_features` |
| 1005 | string_literal | `Master HomeAI\...` | `master_homeai` |
| 1216 | string_literal | `Excellent match for your property...` | `excellent_match_for_your` |
| 1217 | string_literal | `Fast-track this application...` | `fast_track_this_application` |
| 1220 | string_literal | `Good candidate with guarantor...` | `good_candidate_with_guarantor` |
| 1221 | string_literal | `Recommend with 3-month probation...` | `recommend_with_3_month` |
| 1222 | string_literal | `Suitable if pet agreement signed...` | `suitable_if_pet_agreement` |
| 1225 | string_literal | `Better suited for your Property B...` | `better_suited_for_your` |
| 1226 | string_literal | `Consider for future vacancy...` | `consider_for_future_vacancy` |
| 1227 | string_literal | `Recommend partnering with another applicant...` | `recommend_partnering_with_another` |
| 1400 | string_literal | `Property Management...` | `property_management` |
| 1449 | string_literal | `Viewing Management...` | `viewing_management` |
| 1525 | string_literal | `After Work Viewings...` | `after_work_viewings` |
| 1536 | string_literal | `Weekend Open House...` | `weekend_open_house` |
| 1547 | string_literal | `VIP Viewings...` | `vip_viewings` |
| 1789 | string_literal | `Connect Google Calendar...` | `connect_google_calendar` |
| 2017 | string_literal | `How to Generate and Send Digital Rental Contracts...` | `how_to_generate_and` |
| 2066 | string_literal | `Contract Settings...` | `contract_settings` |
| 2067 | string_literal | `Configure Templates...` | `configure_templates` |
| 2444 | string_literal | `Expires soon...` | `expires_soon` |
| 2683 | string_literal | `AI Features...` | `ai_features` |
| 2762 | string_literal | `Configure Chat AI...` | `configure_chat_ai` |
| 2763 | string_literal | `Initial Setup Wizard...` | `initial_setup_wizard` |
| 2883 | string_literal | `Hi {name}! 😊 Great timing!

    I have these viewi...` | `hi_name_great_timing` |
| 2894 | string_literal | `Thanks for your interest! Currently,
    all viewi...` | `thanks_for_your_interest` |
| 2970 | string_literal | `What time is the viewing?...` | `what_time_is_the` |

### `components/sections/featureSection/EnhancedFeatureBox.jsx`

- **Total Hardcoded Strings**: 65
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 158 | string_literal | `Never Miss a Listing...` | `never_miss_a_listing` |
| 160 | string_literal | `Real-time scanning of Switzerland\...` | `real_time_scanning_of` |
| 163 | string_literal | `Scan 10+ Swiss platforms...` | `scan_10_swiss_platforms` |
| 164 | string_literal | `Instant WhatsApp alerts...` | `instant_whatsapp_alerts` |
| 165 | string_literal | `First-mover advantage...` | `first_mover_advantage` |
| 168 | string_literal | `Average alert time...` | `average_alert_time` |
| 169 | string_literal | `REAL-TIME...` | `real_time` |
| 177 | string_literal | `Beyond Basic Filters...` | `beyond_basic_filters` |
| 179 | string_literal | `Our AI reads between the lines—analyzing images, d...` | `our_ai_reads_between` |
| 182 | string_literal | `Visual quality analysis...` | `visual_quality_analysis` |
| 183 | string_literal | `Commute calculations...` | `commute_calculations` |
| 184 | string_literal | `Neighborhood scoring...` | `neighborhood_scoring` |
| 185 | string_literal | `Hidden cost detection...` | `hidden_cost_detection` |
| 187 | string_literal | `Data signals analyzed...` | `data_signals_analyzed` |
| 194 | string_literal | `Personalized Matching...` | `personalized_matching` |
| 196 | string_literal | `No endless forms. Our conversational AI learns you...` | `no_endless_forms_our` |
| 200 | string_literal | `Lifestyle matching...` | `lifestyle_matching` |
| 201 | string_literal | `Family requirements...` | `family_requirements` |
| 202 | string_literal | `Budget optimization...` | `budget_optimization` |
| 204 | string_literal | `Match accuracy...` | `match_accuracy` |
| 211 | string_literal | `Your Perfect Home...` | `your_perfect_home` |
| 213 | string_literal | `Advanced algorithms consider tax zones, school dis...` | `advanced_algorithms_consider_tax` |
| 216 | string_literal | `Tax optimization...` | `tax_optimization` |
| 217 | string_literal | `School proximity...` | `school_proximity` |
| 218 | string_literal | `Transit scoring...` | `transit_scoring` |
| 219 | string_literal | `Market insights...` | `market_insights` |
| 221 | string_literal | `Success rate...` | `success_rate` |
| 222 | string_literal | `AI-POWERED...` | `ai_powered` |
| 233 | string_literal | `Screen 10x Faster...` | `screen_10x_faster` |
| 239 | string_literal | `Employment checks...` | `employment_checks` |
| 240 | string_literal | `Risk score (1-100)...` | `risk_score_1_100` |
| 241 | string_literal | `Red flag detection...` | `red_flag_detection` |
| 243 | string_literal | `Accuracy rate...` | `accuracy_rate` |
| 244 | string_literal | `AI-POWERED...` | `ai_powered` |
| 252 | string_literal | `Price Perfectly...` | `price_perfectly` |
| 254 | string_literal | `Real-time pricing analytics from 50,000+ Swiss pro...` | `real_time_pricing_analytics` |
| 257 | string_literal | `Dynamic pricing...` | `dynamic_pricing` |
| 258 | string_literal | `Demand heat maps...` | `demand_heat_maps` |
| 259 | string_literal | `Competitor tracking...` | `competitor_tracking` |
| 260 | string_literal | `ROI predictions...` | `roi_predictions` |
| 262 | string_literal | `Avg rent increase...` | `avg_rent_increase` |
| 275 | string_literal | `Lead qualification...` | `lead_qualification` |
| 276 | string_literal | `Viewing scheduler...` | `viewing_scheduler` |
| 277 | string_literal | `Multi-channel sync...` | `multi_channel_sync` |
| 279 | string_literal | `Faster response...` | `faster_response` |
| 286 | string_literal | `Zero Paperwork...` | `zero_paperwork` |
| 292 | string_literal | `Digital signatures...` | `digital_signatures` |
| 294 | string_literal | `Tax-ready reports...` | `tax_ready_reports` |
| 296 | string_literal | `Saved per month...` | `saved_per_month` |
| 297 | string_literal | `COMPLIANT...` | `compliant` |

### `components/EmailForwardingModal.jsx`

- **Total Hardcoded Strings**: 64
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 214 | jsx_text | `Gmail...` | `gmail` |
| 215 | jsx_text | `Outlook/Hotmail...` | `outlook_hotmail` |
| 216 | jsx_text | `Yahoo Mail...` | `yahoo_mail` |
| 217 | jsx_text | `iCloud Mail...` | `icloud_mail` |
| 218 | jsx_text | `Other...` | `other` |
| 187 | title | `Copy to clipboard...` | `copy_to_clipboard` |
| 312 | button_text | `{t('Cancel')}...` | `t_cancel` |
| 320 | button_text | `{t('Complete')}...` | `t_complete` |
| 52 | string_literal | `Open Gmail settings (gear icon → See all settings)...` | `open_gmail_settings_gear` |
| 53 | string_literal | `Go to...` | `go_to` |
| 54 | string_literal | `Click...` | `click` |
| 56 | string_literal | `Click...` | `click` |
| 56 | string_literal | `Proceed...` | `proceed` |
| 57 | string_literal | `Select...` | `select` |
| 58 | string_literal | `Choose what to do with Gmail\...` | `choose_what_to_do` |
| 58 | string_literal | `Keep Gmail\...` | `keep_gmail` |
| 63 | string_literal | `Outlook/Hotmail...` | `outlook_hotmail` |
| 65 | string_literal | `Go to Settings (gear icon) → View all Outlook sett...` | `go_to_settings_gear` |
| 66 | string_literal | `Select...` | `select` |
| 66 | string_literal | `Forwarding...` | `forwarding` |
| 67 | string_literal | `Enable forwarding...` | `enable_forwarding` |
| 69 | string_literal | `Choose...` | `choose` |
| 70 | string_literal | `Save your changes...` | `save_your_changes` |
| 74 | string_literal | `Yahoo Mail...` | `yahoo_mail` |
| 76 | string_literal | `Click Settings (gear icon) → More Settings...` | `click_settings_gear_icon` |
| 77 | string_literal | `Select...` | `select` |
| 78 | string_literal | `Forwarding...` | `forwarding` |
| 80 | string_literal | `Click...` | `click` |
| 81 | string_literal | `Save your settings...` | `save_your_settings` |
| 88 | string_literal | `Open Mail and click the gear icon...` | `open_mail_and_click` |
| 89 | string_literal | `Choose...` | `choose` |
| 89 | string_literal | `General...` | `general` |
| 90 | string_literal | `Select...` | `select` |
| 92 | string_literal | `Choose...` | `choose` |
| 93 | string_literal | `Click...` | `click` |
| 97 | string_literal | `Other Email Providers...` | `other_email_providers` |
| 99 | string_literal | `Log in to your email account...` | `log_in_to_your` |
| 100 | string_literal | `Navigate to Settings or Preferences...` | `navigate_to_settings_or` |
| 101 | string_literal | `Look for...` | `look_for` |
| 101 | string_literal | `Mail Forwarding...` | `mail_forwarding` |
| 101 | string_literal | `Email Forwarding...` | `email_forwarding` |
| 103 | string_literal | `Verify the forwarding address if required...` | `verify_the_forwarding_address` |
| 104 | string_literal | `Enable forwarding and save your settings...` | `enable_forwarding_and_save` |
| 123 | string_literal | `Email address copied to clipboard!...` | `email_address_copied_to` |
| 145 | string_literal | `Email Forwarding Setup...` | `email_forwarding_setup` |
| 153 | string_literal | `Property...` | `property` |
| 172 | string_literal | `Your Managed Email Address...` | `your_managed_email_address` |
| 187 | string_literal | `Copy to clipboard...` | `copy_to_clipboard` |
| 204 | string_literal | `Setup Email Forwarding...` | `setup_email_forwarding` |
| 208 | string_literal | `Select Your Email Provider...` | `select_your_email_provider` |

### `pages/Policy/Policy.jsx`

- **Total Hardcoded Strings**: 63
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 14 | title | `Privacy Policy - SwissTax...` | `privacy_policy_swisstax` |
| 14 | string_literal | `Privacy Policy - SwissTax...` | `privacy_policy_swisstax` |
| 15 | string_literal | `SwissTax privacy policy and data protection inform...` | `swisstax_privacy_policy_and` |
| 33 | string_literal | `Privacy Policy...` | `privacy_policy` |
| 45 | string_literal | `Introduction...` | `introduction` |
| 70 | string_literal | `Information We Collect...` | `information_we_collect` |
| 81 | string_literal | `What types of information do we collect?...` | `what_types_of_information` |
| 85 | string_literal | `We collect various types of information to provide...` | `we_collect_various_types` |
| 91 | string_literal | `Personal Information:...` | `personal_information` |
| 95 | string_literal | `This includes your name, email address, phone numb...` | `this_includes_your_name` |
| 105 | string_literal | `We collect tax-related information including incom...` | `we_collect_tax_related` |
| 111 | string_literal | `Usage Data:...` | `usage_data` |
| 115 | string_literal | `We collect data about how you interact with our se...` | `we_collect_data_about` |
| 121 | string_literal | `Document Data:...` | `document_data` |
| 125 | string_literal | `Tax-related documents you upload (such as salary c...` | `tax_related_documents_you` |
| 131 | string_literal | `Technical Data:...` | `technical_data` |
| 135 | string_literal | `This includes your IP address, browser type, devic...` | `this_includes_your_ip` |
| 149 | string_literal | `How do we collect this information?...` | `how_do_we_collect` |
| 151 | string_literal | `We collect information through:...` | `we_collect_information_through` |
| 156 | string_literal | `Direct input during the interview process when you...` | `direct_input_during_the` |
| 163 | string_literal | `Account creation and subscription processes, where...` | `account_creation_and_subscription` |
| 188 | string_literal | `How We Use Your Information...` | `how_we_use_your` |
| 199 | string_literal | `What do we use your information for?...` | `what_do_we_use` |
| 202 | string_literal | `We use the information we collect to:...` | `we_use_the_information` |
| 208 | string_literal | `Calculate and prepare your Swiss tax returns accur...` | `calculate_and_prepare_your` |
| 215 | string_literal | `Generate and submit tax filing documents to Swiss ...` | `generate_and_submit_tax` |
| 221 | string_literal | `Process your subscription payments and manage your...` | `process_your_subscription_payments` |
| 226 | string_literal | `Provide tax optimization insights and identify pot...` | `provide_tax_optimization_insights` |
| 231 | string_literal | `Improve our tax calculation algorithms and service...` | `improve_our_tax_calculation` |
| 237 | string_literal | `Communicate with you regarding tax deadlines, upda...` | `communicate_with_you_regarding` |
| 255 | string_literal | `Data Security...` | `data_security` |
| 266 | string_literal | `How secure is my personal data?...` | `how_secure_is_my` |
| 275 | string_literal | `Your account is protected by two-factor authentica...` | `your_account_is_protected` |
| 287 | string_literal | `What happens in case of a data breach?...` | `what_happens_in_case` |
| 291 | string_literal | `In the unlikely event of a data breach, we will no...` | `in_the_unlikely_event` |
| 307 | string_literal | `Data Sharing and Third Parties...` | `data_sharing_and_third` |
| 318 | string_literal | `Do we share your data with third parties?...` | `do_we_share_your` |
| 329 | string_literal | `Swiss tax authorities when you authorize us to fil...` | `swiss_tax_authorities_when` |
| 336 | string_literal | `Service providers who assist us in operating our s...` | `service_providers_who_assist` |
| 381 | string_literal | `Access: You can request access to the personal dat...` | `access_you_can_request` |
| 388 | string_literal | `Correction: You can request corrections to any ina...` | `correction_you_can_request` |
| 395 | string_literal | `Deletion: You can request the deletion of your dat...` | `deletion_you_can_request` |
| 402 | string_literal | `Opt-Out: You can opt out of receiving promotional ...` | `opt_out_you_can` |
| 416 | string_literal | `How can I manage my preferences?...` | `how_can_i_manage` |
| 420 | string_literal | `You can manage your preferences, update your data,...` | `you_can_manage_your` |
| 436 | string_literal | `Cookies and Tracking Technologies...` | `cookies_and_tracking_technologies` |
| 447 | string_literal | `Do we use cookies?...` | `do_we_use_cookies` |
| 451 | string_literal | `Yes, we use cookies and similar tracking technolog...` | `yes_we_use_cookies` |
| 463 | string_literal | `What types of cookies do we use?...` | `what_types_of_cookies` |
| 466 | string_literal | `We use the following types of cookies:...` | `we_use_the_following` |

### `utils/validation/schemaFactory.js`

- **Total Hardcoded Strings**: 58
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 19 | string_literal | `Invalid email address...` | `invalid_email_address` |
| 20 | string_literal | `Required...` | `required` |
| 21 | string_literal | `Email is too long...` | `email_is_too_long` |
| 28 | string_literal | `Required...` | `required` |
| 29 | string_literal | `Must be at least 8 characters...` | `must_be_at_least` |
| 30 | string_literal | `Password must contain at least one lowercase lette...` | `password_must_contain_at` |
| 31 | string_literal | `Password must contain at least one uppercase lette...` | `password_must_contain_at` |
| 32 | string_literal | `Password must contain at least one number...` | `password_must_contain_at` |
| 33 | string_literal | `Password must contain at least one special charact...` | `password_must_contain_at` |
| 39 | string_literal | `Required...` | `required` |
| 40 | string_literal | `Name must be at least 2 characters long...` | `name_must_be_at` |
| 41 | string_literal | `Name cannot be more than 50 characters...` | `name_cannot_be_more` |
| 44 | string_literal | `Name can only contain letters, spaces, hyphens, an...` | `name_can_only_contain` |
| 52 | string_literal | `Invalid AHV format...` | `invalid_ahv_format` |
| 53 | string_literal | `Required...` | `required` |
| 54 | string_literal | `Invalid AHV number...` | `invalid_ahv_number` |
| 75 | string_literal | `Invalid phone number format...` | `invalid_phone_number_format` |
| 77 | string_literal | `Required...` | `required` |
| 83 | string_literal | `Postal code must be 4 digits...` | `postal_code_must_be` |
| 84 | string_literal | `Required...` | `required` |
| 90 | string_literal | `Required...` | `required` |
| 93 | string_literal | `Invalid canton...` | `invalid_canton` |
| 107 | string_literal | `Passwords must match...` | `passwords_must_match` |
| 108 | string_literal | `Required...` | `required` |
| 112 | string_literal | `You must accept the terms...` | `you_must_accept_the` |
| 113 | string_literal | `Required...` | `required` |
| 121 | string_literal | `Required...` | `required` |
| 137 | string_literal | `Passwords must match...` | `passwords_must_match` |
| 138 | string_literal | `Required...` | `required` |
| 148 | string_literal | `Address is too long...` | `address_is_too_long` |
| 149 | string_literal | `City name is too long...` | `city_name_is_too` |
| 158 | string_literal | `Required...` | `required` |
| 161 | string_literal | `Passwords must match...` | `passwords_must_match` |
| 162 | string_literal | `Required...` | `required` |
| 172 | string_literal | `Required...` | `required` |
| 173 | string_literal | `Municipality name is too short...` | `municipality_name_is_too` |
| 174 | string_literal | `Municipality name is too long...` | `municipality_name_is_too` |
| 177 | string_literal | `Amount must be positive...` | `amount_must_be_positive` |
| 178 | string_literal | `Amount is too large...` | `amount_is_too_large` |
| 179 | string_literal | `Required...` | `required` |
| 180 | string_literal | `Invalid amount...` | `invalid_amount` |
| 182 | string_literal | `Required...` | `required` |
| 183 | string_literal | `Invalid marital status...` | `invalid_marital_status` |
| 185 | string_literal | `Number of children cannot be negative...` | `number_of_children_cannot` |
| 186 | string_literal | `Number of children is too large...` | `number_of_children_is` |
| 187 | string_literal | `Must be a whole number...` | `must_be_a_whole` |
| 190 | string_literal | `Required...` | `required` |
| 191 | string_literal | `Tax year is too old...` | `tax_year_is_too` |
| 192 | string_literal | `Tax year cannot be in the future...` | `tax_year_cannot_be` |
| 202 | string_literal | `Required...` | `required` |

### `pages/Contact/Contact.jsx`

- **Total Hardcoded Strings**: 57
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 514 | button_text | `{t('Send Message')}...` | `t_send_message` |
| 143 | string_literal | `Invalid email address...` | `invalid_email_address` |
| 144 | string_literal | `Required...` | `required` |
| 146 | string_literal | `First name must be at least 2 characters...` | `first_name_must_be` |
| 147 | string_literal | `First name must be at most 50 characters...` | `first_name_must_be` |
| 148 | string_literal | `Required...` | `required` |
| 150 | string_literal | `Last name must be at least 2 characters...` | `last_name_must_be` |
| 151 | string_literal | `Last name must be at most 50 characters...` | `last_name_must_be` |
| 152 | string_literal | `Required...` | `required` |
| 154 | string_literal | `Subject must be at least 3 characters...` | `subject_must_be_at` |
| 155 | string_literal | `Subject must be at most 100 characters...` | `subject_must_be_at` |
| 156 | string_literal | `Please select a subject...` | `please_select_a_subject` |
| 158 | string_literal | `Message must be at least 10 characters...` | `message_must_be_at` |
| 159 | string_literal | `Message must be at most 2000 characters...` | `message_must_be_at` |
| 160 | string_literal | `Required...` | `required` |
| 162 | string_literal | `Phone number must contain only digits, spaces, +, ...` | `phone_number_must_contain` |
| 163 | string_literal | `Phone number is too short...` | `phone_number_is_too` |
| 164 | string_literal | `Phone number is too long...` | `phone_number_is_too` |
| 173 | string_literal | `Contact Us...` | `contact_us` |
| 180 | string_literal | `API_BASE_URL...` | `api_base_url` |
| 193 | string_literal | `Contact Form Submission...` | `contact_form_submission` |
| 202 | string_literal | `Thank you for your request! We\...` | `thank_you_for_your` |
| 212 | string_literal | `Validation error...` | `validation_error` |
| 223 | string_literal | `Validation failed. Please check your input....` | `validation_failed_please_check` |
| 226 | string_literal | `Too many requests. Please wait a moment and try ag...` | `too_many_requests_please` |
| 228 | string_literal | `Please check your input and try again....` | `please_check_your_input` |
| 230 | string_literal | `Failed to send message. Please try again later....` | `failed_to_send_message` |
| 234 | string_literal | `Contact form submission error:...` | `contact_form_submission_error` |
| 235 | string_literal | `Network error. Please check your connection and tr...` | `network_error_please_check` |
| 258 | string_literal | `ContactLayout...` | `contactlayout` |
| 259 | string_literal | `ContactContainer...` | `contactcontainer` |
| 263 | string_literal | `Contact Us...` | `contact_us` |
| 266 | string_literal | `Any question or remarks? Just write us a message!...` | `any_question_or_remarks` |
| 278 | string_literal | `Contact Information...` | `contact_information` |
| 285 | string_literal | `Say something to start a live chat!...` | `say_something_to_start` |
| 332 | string_literal | `ContactFormFormPaper...` | `contactformformpaper` |
| 334 | string_literal | `ContactForm...` | `contactform` |
| 340 | string_literal | `First name...` | `first_name` |
| 344 | string_literal | `Enter your First name...` | `enter_your_first_name` |
| 358 | string_literal | `Last name...` | `last_name` |
| 363 | string_literal | `Enter your Last name...` | `enter_your_last_name` |
| 380 | string_literal | `Enter your Email...` | `enter_your_email` |
| 395 | string_literal | `Phone number...` | `phone_number` |
| 430 | string_literal | `Select Subject...` | `select_subject` |
| 444 | string_literal | `General Inquiry...` | `general_inquiry` |
| 452 | string_literal | `General Inquiry...` | `general_inquiry` |
| 455 | string_literal | `General Inquiry1...` | `general_inquiry1` |
| 463 | string_literal | `General Inquiry...` | `general_inquiry` |
| 466 | string_literal | `General Inquiry2...` | `general_inquiry2` |
| 474 | string_literal | `General Inquiry...` | `general_inquiry` |

### `pages/TaxFiling/FilingsListPage.jsx`

- **Total Hardcoded Strings**: 55
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 530 | placeholder | `e.g. 8001...` | `e_g_8001` |
| 449 | button_text | `navigate(`/tax-filing/review/${filing.id}`)}
     ...` | `navigate_tax_filing_review` |
| 579 | button_text | `{t('filings.createAndStart')}...` | `t_filings_createandstart` |
| 609 | button_text | `{t('filings.copyFiling')}...` | `t_filings_copyfiling` |
| 58 | string_literal | `Zürich...` | `zrich` |
| 60 | string_literal | `Luzern...` | `luzern` |
| 62 | string_literal | `Schwyz...` | `schwyz` |
| 63 | string_literal | `Obwalden...` | `obwalden` |
| 64 | string_literal | `Nidwalden...` | `nidwalden` |
| 65 | string_literal | `Glarus...` | `glarus` |
| 67 | string_literal | `Fribourg...` | `fribourg` |
| 68 | string_literal | `Solothurn...` | `solothurn` |
| 69 | string_literal | `Basel-Stadt...` | `basel_stadt` |
| 70 | string_literal | `Basel-Landschaft...` | `basel_landschaft` |
| 71 | string_literal | `Schaffhausen...` | `schaffhausen` |
| 72 | string_literal | `Appenzell Ausserrhoden...` | `appenzell_ausserrhoden` |
| 73 | string_literal | `Appenzell Innerrhoden...` | `appenzell_innerrhoden` |
| 74 | string_literal | `St. Gallen...` | `st_gallen` |
| 75 | string_literal | `Graubünden...` | `graubnden` |
| 76 | string_literal | `Aargau...` | `aargau` |
| 77 | string_literal | `Thurgau...` | `thurgau` |
| 78 | string_literal | `Ticino...` | `ticino` |
| 80 | string_literal | `Valais...` | `valais` |
| 81 | string_literal | `Neuchâtel...` | `neuchtel` |
| 82 | string_literal | `Geneva...` | `geneva` |
| 144 | string_literal | `Error loading filings:...` | `error_loading_filings` |
| 145 | string_literal | `Failed to load filings...` | `failed_to_load_filings` |
| 177 | string_literal | `Error looking up postal code:...` | `error_looking_up_postal` |
| 180 | string_literal | `Postal code not found...` | `postal_code_not_found` |
| 199 | string_literal | `Error creating filing:...` | `error_creating_filing` |
| 200 | string_literal | `Failed to create filing...` | `failed_to_create_filing` |
| 214 | string_literal | `Error copying filing:...` | `error_copying_filing` |
| 215 | string_literal | `Failed to copy filing...` | `failed_to_copy_filing` |
| 227 | string_literal | `Error deleting filing:...` | `error_deleting_filing` |
| 228 | string_literal | `Failed to delete filing...` | `failed_to_delete_filing` |
| 289 | string_literal | `My Tax Filings...` | `my_tax_filings` |
| 292 | string_literal | `Manage your tax returns across multiple years and ...` | `manage_your_tax_returns` |
| 301 | string_literal | `New Filing...` | `new_filing` |
| 319 | string_literal | `Total Filings...` | `total_filings` |
| 329 | string_literal | `Completed...` | `completed` |
| 341 | string_literal | `In Progress...` | `in_progress` |
| 356 | string_literal | `No filings yet...` | `no_filings_yet` |
| 359 | string_literal | `Start your first tax filing to see it here...` | `start_your_first_tax` |
| 367 | string_literal | `Start Tax Filing...` | `start_tax_filing` |
| 401 | string_literal | `No canton...` | `no_canton` |
| 508 | string_literal | `Create New Tax Filing...` | `create_new_tax_filing` |
| 512 | string_literal | `Tax Year...` | `tax_year` |
| 520 | string_literal | `Postal Code (ZIP)...` | `postal_code_zip` |
| 535 | string_literal | `Looking up postal code......` | `looking_up_postal_code` |
| 540 | string_literal | `Enter your 4-digit postal code...` | `enter_your_4_digit` |

### `faqData.js`

- **Total Hardcoded Strings**: 43
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 3 | string_literal | `Getting Started...` | `getting_started` |
| 6 | string_literal | `What is SwissAI Tax?...` | `what_is_swissai_tax` |
| 11 | string_literal | `Who can use SwissAI Tax?...` | `who_can_use_swissai` |
| 13 | string_literal | `Anyone living in Switzerland who needs to file tax...` | `anyone_living_in_switzerland` |
| 16 | string_literal | `Which cantons are supported?...` | `which_cantons_are_supported` |
| 18 | string_literal | `All 26 Swiss cantons are fully supported: Zürich, ...` | `all_26_swiss_cantons` |
| 21 | string_literal | `What languages are available?...` | `what_languages_are_available` |
| 23 | string_literal | `SwissAI Tax is available in all four Swiss nationa...` | `swissai_tax_is_available` |
| 28 | string_literal | `Tax Filing Process...` | `tax_filing_process` |
| 31 | string_literal | `How does the AI interview work?...` | `how_does_the_ai` |
| 33 | string_literal | `Our interactive questionnaire (Q01-Q14) guides you...` | `our_interactive_questionnaire_q01` |
| 36 | string_literal | `What documents do I need to upload?...` | `what_documents_do_i` |
| 38 | string_literal | `Common documents include: salary certificates (Loh...` | `common_documents_include_salary` |
| 41 | string_literal | `How does the document upload work?...` | `how_does_the_document` |
| 46 | string_literal | `How accurate are the tax calculations?...` | `how_accurate_are_the` |
| 48 | string_literal | `Our calculations use official Swiss tax rates upda...` | `our_calculations_use_official` |
| 51 | string_literal | `Can I save my progress and continue later?...` | `can_i_save_my` |
| 58 | string_literal | `Deductions & Savings...` | `deductions_savings` |
| 63 | string_literal | `Our AI analyzes your situation and identifies all ...` | `our_ai_analyzes_your` |
| 66 | string_literal | `What are the most common deductions I can claim?...` | `what_are_the_most` |
| 68 | string_literal | `Common deductions include: mandatory insurance (AH...` | `common_deductions_include_mandatory` |
| 71 | string_literal | `Can I deduct home office expenses?...` | `can_i_deduct_home` |
| 73 | string_literal | `Yes, if you work from home regularly, you can dedu...` | `yes_if_you_work` |
| 76 | string_literal | `How do I maximize my tax refund?...` | `how_do_i_maximize` |
| 78 | string_literal | `Upload all relevant documents, answer interview qu...` | `upload_all_relevant_documents` |
| 83 | string_literal | `Security & Privacy...` | `security_privacy` |
| 86 | string_literal | `Is my data secure?...` | `is_my_data_secure` |
| 91 | string_literal | `Where is my data stored?...` | `where_is_my_data` |
| 96 | string_literal | `Can I delete my data?...` | `can_i_delete_my` |
| 101 | string_literal | `Do you share my data with tax authorities?...` | `do_you_share_my` |
| 108 | string_literal | `Technical Support...` | `technical_support` |
| 111 | string_literal | `What if I encounter an error during filing?...` | `what_if_i_encounter` |
| 116 | string_literal | `Can I use SwissAI Tax on mobile devices?...` | `can_i_use_swissai` |
| 121 | string_literal | `What browsers are supported?...` | `what_browsers_are_supported` |
| 123 | string_literal | `We support all modern browsers: Chrome, Firefox, S...` | `we_support_all_modern` |
| 126 | string_literal | `What happens if I need help with complex tax situa...` | `what_happens_if_i` |
| 133 | string_literal | `Pricing & Payment...` | `pricing_payment` |
| 136 | string_literal | `How much does SwissAI Tax cost?...` | `how_much_does_swissai` |
| 141 | string_literal | `Can I try before I buy?...` | `can_i_try_before` |
| 146 | string_literal | `What payment methods do you accept?...` | `what_payment_methods_do` |
| 148 | string_literal | `We accept all major credit cards (Visa, Mastercard...` | `we_accept_all_major` |
| 151 | string_literal | `Do you offer refunds?...` | `do_you_offer_refunds` |
| 153 | string_literal | `Yes. If you\...` | `yes_if_you` |

### `constants/taxConstants.js`

- **Total Hardcoded Strings**: 43
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 8 | string_literal | `Aargau...` | `aargau` |
| 9 | string_literal | `Appenzell Innerrhoden...` | `appenzell_innerrhoden` |
| 10 | string_literal | `Appenzell Ausserrhoden...` | `appenzell_ausserrhoden` |
| 12 | string_literal | `Basel-Landschaft...` | `basel_landschaft` |
| 13 | string_literal | `Basel-Stadt...` | `basel_stadt` |
| 14 | string_literal | `Fribourg...` | `fribourg` |
| 15 | string_literal | `Geneva...` | `geneva` |
| 16 | string_literal | `Glarus...` | `glarus` |
| 17 | string_literal | `Graubünden...` | `graubnden` |
| 19 | string_literal | `Lucerne...` | `lucerne` |
| 20 | string_literal | `Neuchâtel...` | `neuchtel` |
| 21 | string_literal | `Nidwalden...` | `nidwalden` |
| 22 | string_literal | `Obwalden...` | `obwalden` |
| 23 | string_literal | `St. Gallen...` | `st_gallen` |
| 24 | string_literal | `Schaffhausen...` | `schaffhausen` |
| 25 | string_literal | `Solothurn...` | `solothurn` |
| 26 | string_literal | `Schwyz...` | `schwyz` |
| 27 | string_literal | `Thurgau...` | `thurgau` |
| 28 | string_literal | `Ticino...` | `ticino` |
| 31 | string_literal | `Valais...` | `valais` |
| 33 | string_literal | `Zürich...` | `zrich` |
| 72 | string_literal | `Basic tax calculation...` | `basic_tax_calculation` |
| 73 | string_literal | `Q&A interview...` | `q_a_interview` |
| 74 | string_literal | `Limited document upload...` | `limited_document_upload` |
| 75 | string_literal | `No e-filing...` | `no_e_filing` |
| 76 | string_literal | `No support...` | `no_support` |
| 81 | string_literal | `Standard...` | `standard` |
| 85 | string_literal | `All Basic features...` | `all_basic_features` |
| 86 | string_literal | `Unlimited document uploads...` | `unlimited_document_uploads` |
| 87 | string_literal | `OCR scanning...` | `ocr_scanning` |
| 88 | string_literal | `E-filing support...` | `e_filing_support` |
| 89 | string_literal | `Email support...` | `email_support` |
| 94 | string_literal | `Premium...` | `premium` |
| 98 | string_literal | `All Standard features...` | `all_standard_features` |
| 99 | string_literal | `Expert tax review...` | `expert_tax_review` |
| 100 | string_literal | `Phone support...` | `phone_support` |
| 101 | string_literal | `Priority processing...` | `priority_processing` |
| 102 | string_literal | `Tax optimization tips...` | `tax_optimization_tips` |
| 115 | string_literal | `Interview...` | `interview` |
| 116 | string_literal | `Documents...` | `documents` |
| 117 | string_literal | `Review...` | `review` |
| 118 | string_literal | `Payment...` | `payment` |
| 119 | string_literal | `Submit...` | `submit` |

### `components/sections/workSection/WorkSection.jsx`

- **Total Hardcoded Strings**: 43
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 480 | aria_label | `User Type...` | `user_type` |
| 47 | string_literal | `M47.7225 43.4139C47.8047 43.6939 47.81 43.9909 47....` | `m47_7225_43_4139c47` |
| 51 | string_literal | `M47.8057 37.9356C48.9285 35.6067 49.4794 33.0436 4...` | `m47_8057_37_9356c48` |
| 70 | string_literal | `M61.0404 8.70711C61.4309 8.31658 61.4309 7.68342 6...` | `m61_0404_8_70711c61` |
| 84 | string_literal | `M35.75 16.25V35.75H16.25V16.25H35.75Z...` | `m35_75_16_25v35` |
| 86 | string_literal | `M45.5 8.125V16.25C45.5 16.681 45.3288 17.0943 45.0...` | `m45_5_8_125v16` |
| 105 | string_literal | `M61.3736 8.70711C61.7641 8.31658 61.7641 7.68342 6...` | `m61_3736_8_70711c61` |
| 119 | string_literal | `M42.5833 8.125V42.25H31.2083V8.125H42.5833Z...` | `m42_5833_8_125v42` |
| 121 | string_literal | `M45.8333 40.625H44.2083V8.125C44.2083 7.69402 44.0...` | `m45_8333_40_625h44` |
| 141 | string_literal | `M39.6665 17.875V40.625C39.6665 41.056 39.4953 41.4...` | `m39_6665_17_875v40` |
| 145 | string_literal | `M38.0415 14.625H8.7915C7.92955 14.625 7.1029 14.96...` | `m38_0415_14_625h8` |
| 164 | string_literal | `M61.3736 8.70711C61.7641 8.31658 61.7641 7.68342 6...` | `m61_3736_8_70711c61` |
| 180 | string_literal | `M43.875 9.75V17.875H8.125V9.75C8.125 9.31902 8.296...` | `m43_875_9_75v17` |
| 184 | string_literal | `M42.25 6.5H37.375V4.875C37.375 4.44402 37.2038 4.0...` | `m42_25_6_5h37` |
| 203 | string_literal | `M61.3736 8.70711C61.7641 8.31658 61.7641 7.68342 6...` | `m61_3736_8_70711c61` |
| 219 | string_literal | `M47.4583 26C47.4583 28.5411 43.8386 30.4586 42.851...` | `m47_4583_26c47_4583` |
| 223 | string_literal | `M46.2111 20.8853C45.4453 20.085 44.6531 19.2603 44...` | `m46_2111_20_8853c45` |
| 246 | string_literal | `M44.0417 23.7027V43.8751H31.0417V30.8751H21.2917V4...` | `m44_0417_23_7027v43` |
| 250 | string_literal | `M48.9167 42.25H45.6667V27.625L46.1421 28.1004C46.4...` | `m48_9167_42_25h45` |
| 256 | string_literal | `List Your Property for Free...` | `list_your_property_for` |
| 271 | string_literal | `M61.5404 8.70711C61.9309 8.31658 61.9309 7.68342 6...` | `m61_5404_8_70711c61` |
| 288 | string_literal | `M40.0728 30.7592L28.8826 34.8826L24.7592 46.0728C2...` | `m40_0728_30_7592l28` |
| 292 | string_literal | `M40.6334 26.2153L30.1562 22.3437L26.2968 11.8584C2...` | `m40_6334_26_2153l30` |
| 298 | string_literal | `Personalized Property Consultation...` | `personalized_property_consultation` |
| 313 | string_literal | `M60.8736 8.70711C61.2641 8.31658 61.2641 7.68342 6...` | `m60_8736_8_70711c61` |
| 330 | string_literal | `M45.9066 12.4678L31.7082 27.625V39.5383C31.7084 39...` | `m45_9066_12_4678l31` |
| 334 | string_literal | `M47.6736 10.0608C47.4235 9.48297 47.009 8.99137 46...` | `m47_6736_10_0608c47` |
| 340 | string_literal | `Smart Application Filtering...` | `smart_application_filtering` |
| 343 | string_literal | `Let our AI handle the heavy lifting. We filter all...` | `let_our_ai_handle` |
| 356 | string_literal | `M44.0417 11.375V24.375H32.6667V11.375H44.0417ZM8.2...` | `m44_0417_11_375v24` |
| 360 | string_literal | `M44.0417 9.75H8.29175C7.86077 9.75 7.44745 9.92121...` | `m44_0417_9_75h8` |
| 366 | string_literal | `Efficient Application Management...` | `efficient_application_management` |
| 381 | string_literal | `M60.8736 8.70711C61.2641 8.31658 61.2641 7.68342 6...` | `m60_8736_8_70711c61` |
| 398 | string_literal | `M42.75 17.875H31.375V6.5L42.75 17.875ZM24.875 32.5...` | `m42_75_17_875h31` |
| 402 | string_literal | `M43.8997 16.7253L32.5247 5.35031C32.3737 5.19946 3...` | `m43_8997_16_7253l32` |
| 408 | string_literal | `Smart View Experience...` | `smart_view_experience` |
| 423 | string_literal | `M61.5404 8.70711C61.9309 8.31658 61.9309 7.68342 6...` | `m61_5404_8_70711c61` |
| 440 | string_literal | `M21.958 21.125V42.25H8.95801C8.52703 42.25 8.11371...` | `m21_958_21_125v42` |
| 444 | string_literal | `M44.708 8.125H8.95801C8.09605 8.125 7.2694 8.46741...` | `m44_708_8_125h8` |
| 450 | string_literal | `Manage Everything in One Place...` | `manage_everything_in_one` |
| 469 | string_literal | `Streamline Your Property Management with AI...` | `streamline_your_property_management` |
| 470 | string_literal | `AI Real Estate Agent: Your Smartest Move Yet!...` | `ai_real_estate_agent` |
| 480 | string_literal | `User Type...` | `user_type` |

### `pages/Terms/Terms.jsx`

- **Total Hardcoded Strings**: 42
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 14 | title | `Terms of Service - SwissTax...` | `terms_of_service_swisstax` |
| 14 | string_literal | `Terms of Service - SwissTax...` | `terms_of_service_swisstax` |
| 15 | string_literal | `SwissTax terms of service and usage agreement for ...` | `swisstax_terms_of_service` |
| 33 | string_literal | `Terms and Conditions...` | `terms_and_conditions` |
| 45 | string_literal | `Introduction...` | `introduction` |
| 50 | string_literal | `Welcome to SwissTax! These Terms and Conditions go...` | `welcome_to_swisstax_these` |
| 70 | string_literal | `Use of Services...` | `use_of_services` |
| 81 | string_literal | `Who can use SwissTax?...` | `who_can_use_swisstax` |
| 85 | string_literal | `SwissTax services are available to individuals who...` | `swisstax_services_are_available` |
| 97 | string_literal | `What are the rules for using the service?...` | `what_are_the_rules` |
| 101 | string_literal | `You agree to use SwissTax services only for lawful...` | `you_agree_to_use` |
| 107 | string_literal | `Using the service to engage in tax fraud, evasion,...` | `using_the_service_to` |
| 120 | string_literal | `Attempting to access, tamper with, or use non-publ...` | `attempting_to_access_tamper` |
| 127 | string_literal | `Distributing viruses, malware, or any harmful code...` | `distributing_viruses_malware_or` |
| 134 | string_literal | `Sharing your account credentials or allowing unaut...` | `sharing_your_account_credentials` |
| 148 | string_literal | `Can SwissTax terminate my access to the service?...` | `can_swisstax_terminate_my` |
| 168 | string_literal | `Subscriptions and Payments...` | `subscriptions_and_payments` |
| 179 | string_literal | `What is the cost of using SwissTax?...` | `what_is_the_cost` |
| 195 | string_literal | `How do I cancel my subscription?...` | `how_do_i_cancel` |
| 199 | string_literal | `Canceling is simple and hassle-free. Visit your ac...` | `canceling_is_simple_and` |
| 199 | string_literal | `Cancel Subscription....` | `cancel_subscription` |
| 211 | string_literal | `What payment methods are accepted?...` | `what_payment_methods_are` |
| 215 | string_literal | `We accept major credit cards (Visa, MasterCard, Am...` | `we_accept_major_credit` |
| 227 | string_literal | `What happens if I miss a payment?...` | `what_happens_if_i` |
| 231 | string_literal | `If a payment fails, we will attempt to charge your...` | `if_a_payment_fails` |
| 243 | string_literal | `Are there any refunds available?...` | `are_there_any_refunds` |
| 247 | string_literal | `We offer a satisfaction guarantee before you submi...` | `we_offer_a_satisfaction` |
| 263 | string_literal | `Intellectual Property...` | `intellectual_property` |
| 274 | string_literal | `Who owns the content on SwissTax?...` | `who_owns_the_content` |
| 290 | string_literal | `Who owns my tax data?...` | `who_owns_my_tax` |
| 310 | string_literal | `Data Privacy...` | `data_privacy` |
| 321 | string_literal | `How secure is my personal data?...` | `how_secure_is_my` |
| 325 | string_literal | `Your data and preferences are stored securely, kep...` | `your_data_and_preferences` |
| 337 | string_literal | `Will my data be shared with third parties?...` | `will_my_data_be` |
| 341 | string_literal | `We do not share or sell your personal data to thir...` | `we_do_not_share` |
| 357 | string_literal | `Limitation of Liability...` | `limitation_of_liability` |
| 368 | string_literal | `Is SwissTax liable for tax calculation errors?...` | `is_swisstax_liable_for` |
| 372 | string_literal | `While we strive to provide accurate tax calculatio...` | `while_we_strive_to` |
| 384 | string_literal | `What is the extent of SwissTax...` | `what_is_the_extent` |
| 388 | string_literal | `To the fullest extent permitted by Swiss law, Swis...` | `to_the_fullest_extent` |
| 404 | string_literal | `Governing Law...` | `governing_law` |
| 415 | string_literal | `What law governs these Terms and Conditions?...` | `what_law_governs_these` |

### `pages/TaxFiling/SubmissionPage.jsx`

- **Total Hardcoded Strings**: 37
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 379 | jsx_text | `: submissionMethod === 'efile' ?...` | `submissionmethod_efile` |
| 185 | button_text | `{t('Go to Dashboard')}...` | `t_go_to_dashboard` |
| 50 | string_literal | `Zürich...` | `zrich` |
| 51 | string_literal | `April 30, 2025...` | `april_30_2025` |
| 71 | string_literal | `Submission failed. Please try again or contact sup...` | `submission_failed_please_try` |
| 73 | string_literal | `Submission error:...` | `submission_error` |
| 95 | string_literal | `PDF download failed:...` | `pdf_download_failed` |
| 115 | string_literal | `Submission Successful!...` | `submission_successful` |
| 119 | string_literal | `Your tax filing has been successfully submitted...` | `your_tax_filing_has` |
| 125 | string_literal | `Confirmation Details...` | `confirmation_details` |
| 131 | string_literal | `Confirmation Number...` | `confirmation_number` |
| 140 | string_literal | `Tax Year...` | `tax_year` |
| 149 | string_literal | `Submission Method...` | `submission_method` |
| 152 | string_literal | `E-Filing...` | `e_filing` |
| 152 | string_literal | `Manual Submission...` | `manual_submission` |
| 158 | string_literal | `Submitted Date...` | `submitted_date` |
| 170 | string_literal | `A confirmation email has been sent to your registe...` | `a_confirmation_email_has` |
| 183 | string_literal | `Download PDF...` | `download_pdf` |
| 189 | string_literal | `Go to Dashboard...` | `go_to_dashboard` |
| 207 | string_literal | `Submit Your Tax Filing...` | `submit_your_tax_filing` |
| 210 | string_literal | `Choose your preferred submission method...` | `choose_your_preferred_submission` |
| 243 | string_literal | `E-Filing...` | `e_filing` |
| 243 | string_literal | `Recommended...` | `recommended` |
| 247 | string_literal | `Submit directly to...` | `submit_directly_to` |
| 256 | string_literal | `Instant confirmation...` | `instant_confirmation` |
| 265 | string_literal | `Faster processing time...` | `faster_processing_time` |
| 305 | string_literal | `Manual Submission...` | `manual_submission` |
| 309 | string_literal | `Download PDF and submit yourself...` | `download_pdf_and_submit` |
| 313 | string_literal | `You will need to submit the forms to the tax offic...` | `you_will_need_to` |
| 324 | string_literal | `Submission Address...` | `submission_address` |
| 343 | string_literal | `Important Reminders...` | `important_reminders` |
| 348 | string_literal | `Deadline...` | `deadline` |
| 353 | string_literal | `Keep copies of all documents for at least 10 years...` | `keep_copies_of_all` |
| 358 | string_literal | `Check your email for confirmation...` | `check_your_email_for` |
| 382 | string_literal | `Submitting......` | `submitting` |
| 384 | string_literal | `Submit via E-Filing...` | `submit_via_e_filing` |
| 385 | string_literal | `Download PDF Forms...` | `download_pdf_forms` |

### `components/TenantSelection/ApplicationDetailModal.jsx`

- **Total Hardcoded Strings**: 36
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 334 | jsx_text | `Hard Criteria...` | `hard_criteria` |
| 344 | jsx_text | `Soft Score...` | `soft_score` |
| 527 | jsx_text | `Close...` | `close` |
| 493 | button_text | `{/* TODO: Implement viewing scheduling */}}>
     ...` | `todo_implement_viewing_scheduling` |
| 506 | button_text | `}
                >
                  Reject...` | `reject` |
| 527 | button_text | `Close...` | `close` |
| 116 | string_literal | `Does not meet criteria...` | `does_not_meet_criteria` |
| 118 | string_literal | `Applicant rejected. Notification sent....` | `applicant_rejected_notification_sent` |
| 131 | string_literal | `AI card generated successfully with GPT-5!...` | `ai_card_generated_successfully` |
| 141 | string_literal | `Application Received...` | `application_received` |
| 142 | string_literal | `Viewing Scheduled...` | `viewing_scheduled` |
| 143 | string_literal | `Viewing Attended...` | `viewing_attended` |
| 144 | string_literal | `Documents Submitted...` | `documents_submitted` |
| 145 | string_literal | `Decision Made...` | `decision_made` |
| 191 | string_literal | `Hide Identity...` | `hide_identity` |
| 191 | string_literal | `Reveal Identity...` | `reveal_identity` |
| 221 | string_literal | `Overview...` | `overview` |
| 222 | string_literal | `AI Analysis...` | `ai_analysis` |
| 223 | string_literal | `Documents...` | `documents` |
| 224 | string_literal | `Communication...` | `communication` |
| 225 | string_literal | `Viewing...` | `viewing` |
| 239 | string_literal | `Not provided...` | `not_provided` |
| 247 | string_literal | `Not provided...` | `not_provided` |
| 266 | string_literal | `Applied...` | `applied` |
| 272 | string_literal | `Source Portal...` | `source_portal` |
| 273 | string_literal | `Direct...` | `direct` |
| 279 | string_literal | `Yes (AI)...` | `yes_ai` |
| 336 | string_literal | `Passed...` | `passed` |
| 338 | string_literal | `Failed...` | `failed` |
| 422 | string_literal | `Generating......` | `generating` |
| 422 | string_literal | `Generate AI Card with GPT-5...` | `generate_ai_card_with` |
| 471 | string_literal | `Scheduled Date...` | `scheduled_date` |
| 472 | string_literal | `Not specified...` | `not_specified` |
| 478 | string_literal | `Status...` | `status` |
| 479 | string_literal | `Attended...` | `attended` |
| 479 | string_literal | `Scheduled...` | `scheduled` |

### `components/TenantSelection/ViewingSlotManager.jsx`

- **Total Hardcoded Strings**: 35
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 448 | jsx_text | `Viewing Type...` | `viewing_type` |
| 454 | jsx_text | `Individual Viewing...` | `individual_viewing` |
| 455 | jsx_text | `Group Viewing...` | `group_viewing` |
| 473 | jsx_text | `Cancel...` | `cancel` |
| 482 | jsx_text | `Bulk Create Viewing Slots...` | `bulk_create_viewing_slots` |
| 508 | jsx_text | `Select Weekdays...` | `select_weekdays` |
| 524 | jsx_text | `Time Slots...` | `time_slots` |
| 575 | jsx_text | `Cancel...` | `cancel` |
| 474 | button_text | `{editingSlot ? 'Update' : 'Create'}...` | `editingslot_update_create` |
| 576 | button_text | `Create Slots...` | `create_slots` |
| 635 | button_text | `Continue to Next Step...` | `continue_to_next_step` |
| 129 | string_literal | `Failed to create viewing slot:...` | `failed_to_create_viewing` |
| 129 | string_literal | `Unknown error...` | `unknown_error` |
| 136 | string_literal | `Failed to create viewing slot:...` | `failed_to_create_viewing` |
| 153 | string_literal | `YYYY-MM-DD...` | `yyyy_mm_dd` |
| 171 | string_literal | `Failed to create viewing slots:...` | `failed_to_create_viewing` |
| 171 | string_literal | `Unknown error...` | `unknown_error` |
| 177 | string_literal | `Failed to create viewing slots:...` | `failed_to_create_viewing` |
| 182 | string_literal | `Are you sure you want to delete this viewing slot?...` | `are_you_sure_you` |
| 230 | string_literal | `Cancelled...` | `cancelled` |
| 233 | string_literal | `Available...` | `available` |
| 335 | string_literal | `MMM DD, YYYY...` | `mmm_dd_yyyy` |
| 396 | string_literal | `Edit Viewing Slot...` | `edit_viewing_slot` |
| 396 | string_literal | `Create Viewing Slot...` | `create_viewing_slot` |
| 426 | string_literal | `Duration (minutes)...` | `duration_minutes` |
| 439 | string_literal | `Max Capacity...` | `max_capacity` |
| 442 | string_literal | `Number of viewers per slot...` | `number_of_viewers_per` |
| 452 | string_literal | `Viewing Type...` | `viewing_type` |
| 465 | string_literal | `Notes (optional)...` | `notes_optional` |
| 475 | string_literal | `Update...` | `update` |
| 475 | string_literal | `Create...` | `create` |
| 489 | string_literal | `Start Date...` | `start_date` |
| 500 | string_literal | `End Date...` | `end_date` |
| 541 | string_literal | `Duration...` | `duration` |
| 550 | string_literal | `Capacity...` | `capacity` |

### `store/slices/documentsSlice.js`

- **Total Hardcoded Strings**: 34
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 34 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 34 | string_literal | `Getting documents...` | `getting_documents` |
| 39 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 39 | string_literal | `No authenticated user, using localStorage...` | `no_authenticated_user_using` |
| 42 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 42 | string_literal | `Retrieved documents from localStorage...` | `retrieved_documents_from_localstorage` |
| 52 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 52 | string_literal | `User ID not found, using localStorage...` | `user_id_not_found` |
| 59 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 59 | string_literal | `Attempting to fetch documents from API...` | `attempting_to_fetch_documents` |
| 72 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 72 | string_literal | `Documents fetched from API successfully...` | `documents_fetched_from_api` |
| 79 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 79 | string_literal | `Synced documents to localStorage...` | `synced_documents_to_localstorage` |
| 88 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 88 | string_literal | `Documents API not implemented (405), using localSt...` | `documents_api_not_implemented` |
| 90 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 90 | string_literal | `API request failed, falling back to localStorage...` | `api_request_failed_falling` |
| 100 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 100 | string_literal | `Error getting documents...` | `error_getting_documents` |
| 112 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 112 | string_literal | `Creating new document...` | `creating_new_document` |
| 130 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 130 | string_literal | `Attempting to create document via API...` | `attempting_to_create_document` |
| 142 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 142 | string_literal | `Document created via API...` | `document_created_via_api` |
| 156 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 156 | string_literal | `API unavailable, saving to localStorage...` | `api_unavailable_saving_to` |
| 161 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 161 | string_literal | `Document saved to localStorage...` | `document_saved_to_localstorage` |
| 167 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 167 | string_literal | `Error creating document, using localStorage fallba...` | `error_creating_document_using` |
| 262 | string_literal | `DOCUMENTS_SLICE...` | `documents_slice` |
| 262 | string_literal | `Documents state updated...` | `documents_state_updated` |

### `components/paymentForm/PaymentForm.jsx`

- **Total Hardcoded Strings**: 34
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 118 | jsx_text | `Cancel...` | `cancel` |
| 38 | placeholder | `Enter Cardholder Name...` | `enter_cardholder_name` |
| 43 | placeholder | `XXXX XXXX XXXX XXXX...` | `xxxx_xxxx_xxxx_xxxx` |
| 46 | placeholder | `MM/YY...` | `mm_yy` |
| 60 | placeholder | `Enter First name...` | `enter_first_name` |
| 63 | placeholder | `Enter Last name...` | `enter_last_name` |
| 74 | placeholder | `Select Country...` | `select_country` |
| 84 | placeholder | `Enter City...` | `enter_city` |
| 95 | placeholder | `Select State...` | `select_state` |
| 105 | placeholder | `Enter ZIP...` | `enter_zip` |
| 110 | placeholder | `Enter Address...` | `enter_address` |
| 115 | button_text | `Save...` | `save` |
| 118 | button_text | `Cancel...` | `cancel` |
| 5 | string_literal | `United States...` | `united_states` |
| 8 | string_literal | `United Kingdom...` | `united_kingdom` |
| 12 | string_literal | `New York...` | `new_york` |
| 13 | string_literal | `California...` | `california` |
| 38 | string_literal | `Cardholder Name...` | `cardholder_name` |
| 38 | string_literal | `Enter Cardholder Name...` | `enter_cardholder_name` |
| 43 | string_literal | `Credit Card Number...` | `credit_card_number` |
| 43 | string_literal | `XXXX XXXX XXXX XXXX...` | `xxxx_xxxx_xxxx_xxxx` |
| 46 | string_literal | `Expiration Date...` | `expiration_date` |
| 49 | string_literal | `CVV/CVC...` | `cvv_cvc` |
| 60 | string_literal | `First name...` | `first_name` |
| 60 | string_literal | `Enter First name...` | `enter_first_name` |
| 63 | string_literal | `Last name...` | `last_name` |
| 63 | string_literal | `Enter Last name...` | `enter_last_name` |
| 71 | string_literal | `Country...` | `country` |
| 74 | string_literal | `Select Country...` | `select_country` |
| 84 | string_literal | `Enter City...` | `enter_city` |
| 95 | string_literal | `Select State...` | `select_state` |
| 105 | string_literal | `Enter ZIP...` | `enter_zip` |
| 110 | string_literal | `Address...` | `address` |
| 110 | string_literal | `Enter Address...` | `enter_address` |

### `pages/TaxFiling/PaymentPage.jsx`

- **Total Hardcoded Strings**: 34
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 195 | button_text | `{selectedPlan === plan.id ? t('Selected') : t('Sel...` | `selectedplan_plan_id_t` |
| 326 | button_text | `{processing
              ? t('Processing...')
   ...` | `processing_t_processing_selectedplan` |
| 49 | string_literal | `Basic tax calculation...` | `basic_tax_calculation` |
| 50 | string_literal | `Q&A interview...` | `q_a_interview` |
| 51 | string_literal | `Document upload...` | `document_upload` |
| 52 | string_literal | `E-filing...` | `e_filing` |
| 53 | string_literal | `Support...` | `support` |
| 58 | string_literal | `Standard...` | `standard` |
| 63 | string_literal | `All Basic features...` | `all_basic_features` |
| 64 | string_literal | `Unlimited document uploads...` | `unlimited_document_uploads` |
| 65 | string_literal | `OCR scanning...` | `ocr_scanning` |
| 66 | string_literal | `E-filing support...` | `e_filing_support` |
| 67 | string_literal | `Email support...` | `email_support` |
| 72 | string_literal | `Premium...` | `premium` |
| 76 | string_literal | `All Standard features...` | `all_standard_features` |
| 77 | string_literal | `Expert review...` | `expert_review` |
| 78 | string_literal | `Phone support...` | `phone_support` |
| 79 | string_literal | `Priority processing...` | `priority_processing` |
| 80 | string_literal | `Tax optimization tips...` | `tax_optimization_tips` |
| 102 | string_literal | `Payment failed:...` | `payment_failed` |
| 118 | string_literal | `Choose Your Plan...` | `choose_your_plan` |
| 121 | string_literal | `Select a plan that best fits your needs...` | `select_a_plan_that` |
| 144 | string_literal | `Recommended...` | `recommended` |
| 200 | string_literal | `Selected...` | `selected` |
| 200 | string_literal | `Select Plan...` | `select_plan` |
| 213 | string_literal | `Payment Method...` | `payment_method` |
| 223 | string_literal | `Credit Card (Visa, Mastercard, Amex)...` | `credit_card_visa_mastercard` |
| 245 | string_literal | `Bank Transfer...` | `bank_transfer` |
| 257 | string_literal | `Secure payment processing powered by Stripe...` | `secure_payment_processing_powered` |
| 271 | string_literal | `Stripe payment form will be integrated here...` | `stripe_payment_form_will` |
| 279 | string_literal | `Bank transfer details will be sent to your email a...` | `bank_transfer_details_will` |
| 290 | string_literal | `Order Summary...` | `order_summary` |
| 333 | string_literal | `Processing......` | `processing` |
| 335 | string_literal | `Continue...` | `continue` |

### `pages/Settings/components/PreferencesTab.jsx`

- **Total Hardcoded Strings**: 34
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 239 | jsx_text | `English...` | `english` |
| 240 | jsx_text | `Deutsch...` | `deutsch` |
| 241 | jsx_text | `Français...` | `franais` |
| 242 | jsx_text | `Italiano...` | `italiano` |
| 88 | string_literal | `Error loading settings:...` | `error_loading_settings` |
| 89 | string_literal | `Failed to load settings...` | `failed_to_load_settings` |
| 112 | string_literal | `Error saving preferences:...` | `error_saving_preferences` |
| 113 | string_literal | `Failed to save preferences...` | `failed_to_save_preferences` |
| 134 | string_literal | `Error saving notifications:...` | `error_saving_notifications` |
| 135 | string_literal | `Failed to save notifications...` | `failed_to_save_notifications` |
| 217 | string_literal | `Saving......` | `saving` |
| 227 | string_literal | `Language & Region...` | `language_region` |
| 232 | string_literal | `Application Language...` | `application_language` |
| 236 | string_literal | `Application Language...` | `application_language` |
| 254 | string_literal | `Tax Preferences...` | `tax_preferences` |
| 317 | string_literal | `Show Tax Tips...` | `show_tax_tips` |
| 330 | string_literal | `Default Tax Year...` | `default_tax_year` |
| 333 | string_literal | `Tax Year...` | `tax_year` |
| 337 | string_literal | `Tax Year...` | `tax_year` |
| 352 | string_literal | `Rounding Method...` | `rounding_method` |
| 355 | string_literal | `Method...` | `method` |
| 359 | string_literal | `Method...` | `method` |
| 362 | string_literal | `Standard (0.05 CHF)...` | `standard_0_05_chf` |
| 363 | string_literal | `Round Up...` | `round_up` |
| 364 | string_literal | `Round Down...` | `round_down` |
| 378 | string_literal | `Notifications...` | `notifications` |
| 395 | string_literal | `Filing Reminders...` | `filing_reminders` |
| 398 | string_literal | `Get reminders about upcoming tax deadlines...` | `get_reminders_about_upcoming` |
| 418 | string_literal | `Document Updates...` | `document_updates` |
| 421 | string_literal | `Notifications when documents are processed...` | `notifications_when_documents_are` |
| 441 | string_literal | `Tax Tips Newsletter...` | `tax_tips_newsletter` |
| 444 | string_literal | `Receive monthly tax saving tips and updates...` | `receive_monthly_tax_saving` |
| 464 | string_literal | `Promotional Emails...` | `promotional_emails` |
| 467 | string_literal | `Special offers and partner promotions...` | `special_offers_and_partner` |

### `pages/TaxFiling/DocumentUpload.js`

- **Total Hardcoded Strings**: 33
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 167 | jsx_text | `Interview...` | `interview` |
| 170 | jsx_text | `Documents...` | `documents` |
| 173 | jsx_text | `Review...` | `review` |
| 176 | jsx_text | `Submit...` | `submit` |
| 328 | jsx_text | `Process Document with OCR...` | `process_document_with_ocr` |
| 302 | button_text | `}>
          Upload Additional Documents...` | `upload_additional_documents` |
| 343 | button_text | `}>
            Start OCR Scan...` | `start_ocr_scan` |
| 60 | string_literal | `LOHNAUSWEIS...` | `lohnausweis` |
| 60 | string_literal | `Employment income declared...` | `employment_income_declared` |
| 61 | string_literal | `PILLAR_3A...` | `pillar_3a` |
| 61 | string_literal | `Pillar 3a contributions declared...` | `pillar_3a_contributions_declared` |
| 62 | string_literal | `INSURANCE_PREMIUM...` | `insurance_premium` |
| 62 | string_literal | `Insurance deductions claimed...` | `insurance_deductions_claimed` |
| 66 | string_literal | `Lohnausweis_2024.pdf...` | `lohnausweis_2024_pdf` |
| 67 | string_literal | `Pillar3a_Certificate.pdf...` | `pillar3a_certificate_pdf` |
| 73 | string_literal | `Please upload only PDF, JPG, or PNG files under 10...` | `please_upload_only_pdf` |
| 100 | string_literal | `LOHNAUSWEIS...` | `lohnausweis` |
| 100 | string_literal | `BANK_STATEMENTS...` | `bank_statements` |
| 105 | string_literal | `Upload failed:...` | `upload_failed` |
| 106 | string_literal | `Failed to upload document. Please try again....` | `failed_to_upload_document` |
| 119 | string_literal | `OCR processing started. This may take a few moment...` | `ocr_processing_started_this` |
| 122 | string_literal | `OCR failed:...` | `ocr_failed` |
| 123 | string_literal | `Failed to process document. Please try again....` | `failed_to_process_document` |
| 144 | string_literal | `Salary Certificate...` | `salary_certificate` |
| 145 | string_literal | `Pillar 3a Certificate...` | `pillar_3a_certificate` |
| 146 | string_literal | `Insurance Premium Statement...` | `insurance_premium_statement` |
| 147 | string_literal | `Bank Statements...` | `bank_statements` |
| 148 | string_literal | `Medical Receipts...` | `medical_receipts` |
| 209 | string_literal | `Verified...` | `verified` |
| 209 | string_literal | `Uploaded...` | `uploaded` |
| 229 | string_literal | `Uploaded successfully...` | `uploaded_successfully` |
| 274 | string_literal | `Drop the file here...` | `drop_the_file_here` |
| 275 | string_literal | `Drag & drop or click to upload...` | `drag_drop_or_click` |

### `pages/Settings/components/BillingTab.jsx`

- **Total Hardcoded Strings**: 32
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 135 | button_text | `{t('View Plans')}...` | `t_view_plans` |
| 310 | button_text | `}
                  sx={{ mt: 2 }}
               ...` | `sx_mt_2_disabled` |
| 62 | string_literal | `Failed to load billing information...` | `failed_to_load_billing` |
| 63 | string_literal | `Error fetching subscription data:...` | `error_fetching_subscription_data` |
| 82 | string_literal | `Failed to cancel subscription...` | `failed_to_cancel_subscription` |
| 83 | string_literal | `Error canceling subscription:...` | `error_canceling_subscription` |
| 91 | string_literal | `Download invoice:...` | `download_invoice` |
| 127 | string_literal | `Current Plan...` | `current_plan` |
| 130 | string_literal | `You do not have an active subscription...` | `you_do_not_have` |
| 133 | string_literal | `Subscribe to SwissAI Tax to access premium feature...` | `subscribe_to_swissai_tax` |
| 136 | string_literal | `View Plans...` | `view_plans` |
| 148 | string_literal | `Current Plan...` | `current_plan` |
| 171 | string_literal | `Canceling...` | `canceling` |
| 173 | string_literal | `Active...` | `active` |
| 174 | string_literal | `Inactive...` | `inactive` |
| 189 | string_literal | `Your subscription will be canceled on...` | `your_subscription_will_be` |
| 197 | string_literal | `Current Period...` | `current_period` |
| 211 | string_literal | `Cancel Plan...` | `cancel_plan` |
| 224 | string_literal | `Payment Method...` | `payment_method` |
| 240 | string_literal | `Card on file...` | `card_on_file` |
| 243 | string_literal | `Managed by Stripe...` | `managed_by_stripe` |
| 257 | string_literal | `Billing History...` | `billing_history` |
| 262 | string_literal | `No billing history available...` | `no_billing_history_available` |
| 290 | string_literal | `Pending...` | `pending` |
| 302 | string_literal | `Download...` | `download` |
| 316 | string_literal | `View All Invoices...` | `view_all_invoices` |
| 331 | string_literal | `Cancel Plan...` | `cancel_plan` |
| 334 | string_literal | `Are you sure you want to cancel your plan?...` | `are_you_sure_you` |
| 337 | string_literal | `Your subscription will remain active until...` | `your_subscription_will_remain` |
| 338 | string_literal | `After that, you will lose access to premium featur...` | `after_that_you_will` |
| 343 | string_literal | `Keep Plan...` | `keep_plan` |
| 351 | string_literal | `Cancel Plan...` | `cancel_plan` |

### `components/modals/RecommendationDetailsModal.jsx`

- **Total Hardcoded Strings**: 30
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 815 | button_text | `{t('Close')}...` | `t_close` |
| 115 | string_literal | `Perfect location match for your work commute...` | `perfect_location_match_for` |
| 116 | string_literal | `Budget fits within your specified range...` | `budget_fits_within_your` |
| 117 | string_literal | `Amenities match your lifestyle preferences...` | `amenities_match_your_lifestyle` |
| 118 | string_literal | `Property size meets your family needs...` | `property_size_meets_your` |
| 121 | string_literal | `Similar properties in this area rent for 5-10% mor...` | `similar_properties_in_this` |
| 122 | string_literal | `High demand neighborhood with low vacancy rates...` | `high_demand_neighborhood_with` |
| 123 | string_literal | `Recent price increase trend in this district...` | `recent_price_increase_trend` |
| 211 | string_literal | `OnDemand...` | `ondemand` |
| 308 | string_literal | `Property Details...` | `property_details` |
| 521 | string_literal | `Overview...` | `overview` |
| 522 | string_literal | `Details...` | `details` |
| 523 | string_literal | `Insights...` | `insights` |
| 551 | string_literal | `Bedrooms...` | `bedrooms` |
| 572 | string_literal | `Bathrooms...` | `bathrooms` |
| 593 | string_literal | `Square Meters...` | `square_meters` |
| 611 | string_literal | `Available...` | `available` |
| 614 | string_literal | `Immediately...` | `immediately` |
| 633 | string_literal | `Match Analysis...` | `match_analysis` |
| 681 | string_literal | `Amenities...` | `amenities` |
| 720 | string_literal | `Description...` | `description` |
| 744 | string_literal | `Property Information...` | `property_information` |
| 749 | string_literal | `Property Type...` | `property_type` |
| 752 | string_literal | `For Sale...` | `for_sale` |
| 752 | string_literal | `For Rent...` | `for_rent` |
| 757 | string_literal | `Listing Source...` | `listing_source` |
| 766 | string_literal | `Canton...` | `canton` |
| 846 | string_literal | `Tell us what you think...` | `tell_us_what_you` |
| 866 | string_literal | `View on...` | `view_on` |
| 866 | string_literal | `Source...` | `source` |

### `components/Auth/TaxLoginModal.js`

- **Total Hardcoded Strings**: 30
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 194 | button_text | `setMode('login')}
        sx={{ mb: 2 }}
      >
 ...` | `setmode_login_sx_mb` |
| 204 | button_text | `setMode('signup')}
        sx={{ mb: 3 }}
      >
...` | `setmode_signup_sx_mb` |
| 293 | button_text | `{loading ? 'Anmeldung...' : 'Anmelden'}...` | `loading_anmeldung_anmelden` |
| 411 | button_text | `{loading ? 'Konto wird erstellt...' : 'Konto erste...` | `loading_konto_wird_erstellt` |
| 101 | string_literal | `E-Mail ist erforderlich...` | `e_mail_ist_erforderlich` |
| 103 | string_literal | `Ungültige E-Mail-Adresse...` | `ungltige_e_mail_adresse` |
| 108 | string_literal | `Passwort ist erforderlich...` | `passwort_ist_erforderlich` |
| 110 | string_literal | `Passwort muss mindestens 6 Zeichen lang sein...` | `passwort_muss_mindestens_6` |
| 116 | string_literal | `Vorname ist erforderlich...` | `vorname_ist_erforderlich` |
| 119 | string_literal | `Nachname ist erforderlich...` | `nachname_ist_erforderlich` |
| 122 | string_literal | `Passwörter stimmen nicht überein...` | `passwrter_stimmen_nicht_berein` |
| 137 | string_literal | `Erfolgreich angemeldet!...` | `erfolgreich_angemeldet` |
| 142 | string_literal | `Anmeldung fehlgeschlagen...` | `anmeldung_fehlgeschlagen` |
| 163 | string_literal | `Konto erfolgreich erstellt!...` | `konto_erfolgreich_erstellt` |
| 168 | string_literal | `Registrierung fehlgeschlagen...` | `registrierung_fehlgeschlagen` |
| 181 | string_literal | `Google-Anmeldung fehlgeschlagen...` | `google_anmeldung_fehlgeschlagen` |
| 237 | string_literal | `E-Mail...` | `e_mail` |
| 255 | string_literal | `Passwort...` | `passwort` |
| 301 | string_literal | `Anmeldung......` | `anmeldung` |
| 301 | string_literal | `Anmelden...` | `anmelden` |
| 326 | string_literal | `Vorname...` | `vorname` |
| 334 | string_literal | `Nachname...` | `nachname` |
| 344 | string_literal | `E-Mail...` | `e_mail` |
| 362 | string_literal | `Passwort...` | `passwort` |
| 380 | string_literal | `Passwort bestätigen...` | `passwort_besttigen` |
| 419 | string_literal | `Konto wird erstellt......` | `konto_wird_erstellt` |
| 419 | string_literal | `Konto erstellen...` | `konto_erstellen` |
| 137 | toast_message | `Erfolgreich angemeldet!...` | `erfolgreich_angemeldet` |
| 163 | toast_message | `Konto erfolgreich erstellt!...` | `konto_erfolgreich_erstellt` |
| 181 | toast_message | `Google-Anmeldung fehlgeschlagen...` | `google_anmeldung_fehlgeschlagen` |

### `pages/TaxFiling/ReviewPage.jsx`

- **Total Hardcoded Strings**: 30
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 57 | string_literal | `Failed to load review data. Please try again....` | `failed_to_load_review` |
| 59 | string_literal | `Review load error:...` | `review_load_error` |
| 82 | string_literal | `Failed to update field:...` | `failed_to_update_field` |
| 105 | string_literal | `PDF download failed:...` | `pdf_download_failed` |
| 107 | string_literal | `Failed to download PDF. Please try again....` | `failed_to_download_pdf` |
| 148 | string_literal | `Dashboard...` | `dashboard` |
| 151 | string_literal | `Interview...` | `interview` |
| 153 | string_literal | `Review & Calculate...` | `review_calculate` |
| 160 | string_literal | `Review & Calculate...` | `review_calculate` |
| 163 | string_literal | `Review your information and tax calculation before...` | `review_your_information_and` |
| 172 | string_literal | `Download PDF Preview...` | `download_pdf_preview` |
| 190 | string_literal | `Personal Information...` | `personal_information` |
| 202 | string_literal | `Full Name...` | `full_name` |
| 207 | string_literal | `Canton...` | `canton` |
| 212 | string_literal | `Filing Status...` | `filing_status` |
| 217 | string_literal | `Dependents...` | `dependents` |
| 231 | string_literal | `Income Summary...` | `income_summary` |
| 243 | string_literal | `Employment Income...` | `employment_income` |
| 250 | string_literal | `Investment Income...` | `investment_income` |
| 257 | string_literal | `Other Income...` | `other_income` |
| 266 | string_literal | `Total Income...` | `total_income` |
| 281 | string_literal | `Deductions...` | `deductions` |
| 293 | string_literal | `Pillar 3a...` | `pillar_3a` |
| 300 | string_literal | `Health Insurance...` | `health_insurance` |
| 307 | string_literal | `Childcare...` | `childcare` |
| 314 | string_literal | `Work Expenses...` | `work_expenses` |
| 323 | string_literal | `Total Deductions...` | `total_deductions` |
| 347 | string_literal | `Back to Documents...` | `back_to_documents` |
| 355 | string_literal | `Continue to Payment...` | `continue_to_payment` |
| 355 | string_literal | `Continue to Submit...` | `continue_to_submit` |

### `components/Interview/DocumentChecklist.js`

- **Total Hardcoded Strings**: 29
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 34 | string_literal | `Salary Certificate (Lohnausweis)...` | `salary_certificate_lohnausweis` |
| 35 | string_literal | `Annual salary statement from your employer...` | `annual_salary_statement_from` |
| 36 | string_literal | `Employment...` | `employment` |
| 40 | string_literal | `Unemployment Benefits Statement...` | `unemployment_benefits_statement` |
| 41 | string_literal | `Statement from unemployment insurance...` | `statement_from_unemployment_insurance` |
| 42 | string_literal | `Benefits...` | `benefits` |
| 46 | string_literal | `Insurance Benefits Statement...` | `insurance_benefits_statement` |
| 47 | string_literal | `Disability or accident insurance benefits...` | `disability_or_accident_insurance` |
| 48 | string_literal | `Benefits...` | `benefits` |
| 52 | string_literal | `Pension Fund Certificate...` | `pension_fund_certificate` |
| 54 | string_literal | `Pension...` | `pension` |
| 58 | string_literal | `Pillar 3a Certificate...` | `pillar_3a_certificate` |
| 59 | string_literal | `Private pension savings statement...` | `private_pension_savings_statement` |
| 60 | string_literal | `Pension...` | `pension` |
| 64 | string_literal | `Property Tax Statement...` | `property_tax_statement` |
| 65 | string_literal | `Real estate tax assessment...` | `real_estate_tax_assessment` |
| 66 | string_literal | `Property...` | `property` |
| 70 | string_literal | `Mortgage Statement...` | `mortgage_statement` |
| 71 | string_literal | `Annual mortgage interest statement...` | `annual_mortgage_interest_statement` |
| 72 | string_literal | `Property...` | `property` |
| 76 | string_literal | `Securities Account Statement...` | `securities_account_statement` |
| 77 | string_literal | `Investment account annual statement...` | `investment_account_annual_statement` |
| 78 | string_literal | `Investments...` | `investments` |
| 82 | string_literal | `Donation Receipts...` | `donation_receipts` |
| 83 | string_literal | `Receipts from charitable organizations...` | `receipts_from_charitable_organizations` |
| 84 | string_literal | `Deductions...` | `deductions` |
| 88 | string_literal | `Medical Expense Receipts...` | `medical_expense_receipts` |
| 89 | string_literal | `Medical bills and pharmacy receipts...` | `medical_bills_and_pharmacy` |
| 90 | string_literal | `Deductions...` | `deductions` |

### `components/ComparisonTable/ComparisonTable.jsx`

- **Total Hardcoded Strings**: 28
- **Has i18n Import**: Yes ✅

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 79 | string_literal | `Time to list property...` | `time_to_list_property` |
| 84 | string_literal | `Application screening...` | `application_screening` |
| 85 | string_literal | `Manual review...` | `manual_review` |
| 86 | string_literal | `AI-powered instant scoring...` | `ai_powered_instant_scoring` |
| 89 | string_literal | `Response time to inquiries...` | `response_time_to_inquiries` |
| 90 | string_literal | `Hours to days...` | `hours_to_days` |
| 91 | string_literal | `Instant 24/7...` | `instant_24_7` |
| 94 | string_literal | `Market price analysis...` | `market_price_analysis` |
| 96 | string_literal | `Real-time analytics...` | `real_time_analytics` |
| 99 | string_literal | `Document generation...` | `document_generation` |
| 100 | string_literal | `Manual creation...` | `manual_creation` |
| 105 | string_literal | `Separate service...` | `separate_service` |
| 106 | string_literal | `Integrated...` | `integrated` |
| 109 | string_literal | `Viewing scheduling...` | `viewing_scheduling` |
| 110 | string_literal | `Back-and-forth emails...` | `back_and_forth_emails` |
| 111 | string_literal | `Smart calendar sync...` | `smart_calendar_sync` |
| 114 | string_literal | `Multi-channel management...` | `multi_channel_management` |
| 119 | string_literal | `Performance tracking...` | `performance_tracking` |
| 121 | string_literal | `Detailed analytics...` | `detailed_analytics` |
| 124 | string_literal | `Average vacancy period...` | `average_vacancy_period` |
| 129 | string_literal | `Cost per property...` | `cost_per_property` |
| 131 | string_literal | `CHF 49/month...` | `chf_49_month` |
| 162 | string_literal | `Traditional vs AI-Powered Management...` | `traditional_vs_ai_powered` |
| 165 | string_literal | `See how AI transforms property management efficien...` | `see_how_ai_transforms` |
| 172 | string_literal | `Feature...` | `feature` |
| 173 | string_literal | `Traditional Management...` | `traditional_management` |
| 176 | string_literal | `HomeAI Platform...` | `homeai_platform` |
| 177 | string_literal | `RECOMMENDED...` | `recommended` |

### `components/TwoFactor/TwoFactorSettings.jsx`

- **Total Hardcoded Strings**: 27
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 225 | jsx_text | `Disable Two-Factor Authentication?...` | `disable_two_factor_authentication` |
| 264 | jsx_text | `Regenerate Backup Codes...` | `regenerate_backup_codes` |
| 245 | button_text | `}
          >
            {actionLoading ? 'Disabl...` | `actionloading_disabling_disable_2fa` |
| 306 | button_text | `Download...` | `download` |
| 309 | button_text | `Copy...` | `copy` |
| 322 | button_text | `}
              >
                {actionLoading ?...` | `actionloading_generating_regenerate` |
| 64 | string_literal | `Failed to load 2FA status...` | `failed_to_load_2fa` |
| 68 | string_literal | `Failed to load 2FA status...` | `failed_to_load_2fa` |
| 76 | string_literal | `Please enter your password...` | `please_enter_your_password` |
| 87 | string_literal | `Two-factor authentication disabled successfully...` | `two_factor_authentication_disabled` |
| 92 | string_literal | `Failed to disable 2FA...` | `failed_to_disable_2fa` |
| 95 | string_literal | `Failed to disable 2FA...` | `failed_to_disable_2fa` |
| 103 | string_literal | `Please enter your password...` | `please_enter_your_password` |
| 115 | string_literal | `Backup codes regenerated successfully...` | `backup_codes_regenerated_successfully` |
| 119 | string_literal | `Failed to regenerate backup codes...` | `failed_to_regenerate_backup` |
| 122 | string_literal | `Failed to regenerate backup codes...` | `failed_to_regenerate_backup` |
| 138 | string_literal | `Backup codes copied to clipboard!...` | `backup_codes_copied_to` |
| 157 | string_literal | `Two-factor authentication enabled successfully!...` | `two_factor_authentication_enabled` |
| 191 | string_literal | `Enabled...` | `enabled` |
| 199 | string_literal | `Your account is protected with 2FA...` | `your_account_is_protected` |
| 200 | string_literal | `Add an extra layer of security to your account...` | `add_an_extra_layer` |
| 234 | string_literal | `Password...` | `password` |
| 252 | string_literal | `Disabling......` | `disabling` |
| 252 | string_literal | `Disable 2FA...` | `disable_2fa` |
| 275 | string_literal | `Password...` | `password` |
| 328 | string_literal | `Generating......` | `generating` |
| 328 | string_literal | `Regenerate...` | `regenerate` |

### `utils/debugLogger.js`

- **Total Hardcoded Strings**: 26
- **Has i18n Import**: No ❌

**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`

#### Hardcoded Text Found:

| Line | Pattern | Text | Suggested Key |
|------|---------|------|---------------|
| 46 | string_literal | `Access logger via: window.__debugLogger...` | `access_logger_via_window` |
| 57 | string_literal | `LOGGER...` | `logger` |
| 100 | string_literal | `CRITICAL...` | `critical` |
| 109 | string_literal | `CRITICAL...` | `critical` |
| 135 | string_literal | `CRITICAL...` | `critical` |
| 154 | string_literal | `API_REQUEST...` | `api_request` |
| 177 | string_literal | `API_RESPONSE...` | `api_response` |
| 184 | string_literal | `API_RESPONSE_DATA...` | `api_response_data` |
| 194 | string_literal | `PERFORMANCE...` | `performance` |
| 215 | string_literal | `API_ERROR...` | `api_error` |
| 262 | string_literal | `PERFORMANCE...` | `performance` |
| 268 | string_literal | `PERFORMANCE...` | `performance` |
| 275 | string_literal | `PERFORMANCE...` | `performance` |
| 287 | string_literal | `USER_ACTION...` | `user_action` |
| 292 | string_literal | `FEATURE_FLAG...` | `feature_flag` |
| 297 | string_literal | `ANALYTICS...` | `analytics` |
| 312 | string_literal | `X-API-Key...` | `x_api_key` |
| 313 | string_literal | `X-API-Key...` | `x_api_key` |
| 376 | string_literal | `LOGGER...` | `logger` |
| 383 | string_literal | `LOGGER...` | `logger` |
| 383 | string_literal | `Logs cleared...` | `logs_cleared` |
| 403 | string_literal | `CRITICAL...` | `critical` |
| 412 | string_literal | `PERFORMANCE...` | `performance` |
| 428 | string_literal | `Total logs:...` | `total_logs` |
| 429 | string_literal | `Session ID:...` | `session_id` |
| 459 | string_literal | `Failed to send log to remote:...` | `failed_to_send_log` |


---

## Recommendations

1. **Priority 1 (High)**: Files without i18n imports - 168
2. **Priority 2 (Medium)**: Files with i18n imports but hardcoded text - 119

### Implementation Steps:

1. Add `useTranslation` hook to files without i18n
2. Replace hardcoded text with `t('translation.key')`
3. Add missing translations to `/src/locales/{en,de,fr,it}/translation.json`
4. Test all languages to ensure translations work
