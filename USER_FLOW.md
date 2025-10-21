# User Flow: Swiss Standards Import

**Visual Journey - What Users See & Do**

---

## 🎯 Three Possible Journeys

Users can choose their own path:

```
                    START: User Opens App
                              |
                              |
                    ┌─────────┴─────────┐
                    |                   |
              JOURNEY A              JOURNEY B              JOURNEY C
            Import First         Import During            No Import
            (Fastest)            (Flexible)               (Traditional)
                |                     |                        |
            10 minutes            20 minutes               45 minutes
```

Let me show you each journey in detail...

---

## 📱 JOURNEY A: Import First (Recommended - Fastest)

**Perfect for:** Users who have their documents ready

### **Step 1: Homepage**
```
┌─────────────────────────────────────┐
│                                     │
│        🏠 HOMEPAGE                  │
│                                     │
│   SwissAI Tax                       │
│   File Your Taxes in 10 Minutes    │
│                                     │
│   [Get Started] ← User clicks       │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:** Clicks "Get Started"

---

### **Step 2: Pre-Import Screen** (NEW)
```
┌─────────────────────────────────────┐
│                                     │
│   🚀 Speed Up Your Tax Filing!      │
│                                     │
│   Upload documents now to           │
│   auto-fill 20+ questions           │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ 💼 Salary Certificate       │  │
│   │ (Swissdec)                  │  │
│   │                             │  │
│   │ ☐ Not uploaded yet          │  │
│   │                             │  │
│   │ Will auto-fill:             │  │
│   │ • Income: 9 questions       │  │
│   │                             │  │
│   │ [Upload XML] ← Click here   │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ 🏦 Bank Statement           │  │
│   │ (eCH-0196)                  │  │
│   │                             │  │
│   │ ☐ Not uploaded yet          │  │
│   │                             │  │
│   │ Will auto-fill:             │  │
│   │ • Wealth: 12 questions      │  │
│   │                             │  │
│   │ [Upload PDF/XML] ← Or here  │  │
│   └─────────────────────────────┘  │
│                                     │
│   [Skip - Answer Manually]          │
│   [Continue to Interview →]         │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:**
- Option 1: Clicks "Upload XML" under Salary Certificate
- Option 2: Clicks "Upload PDF/XML" under Bank Statement
- Option 3: Clicks "Skip" to answer manually

**Let's say user chooses to upload bank statement first...**

---

### **Step 3: Upload Bank Statement**
```
┌─────────────────────────────────────┐
│  Import Bank Statement              │
│  ──────────────────────              │
│                                     │
│  Step 1 → Step 2 → Step 3 → Step 4 │
│   ✓       📤                        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │   📄 Drag & drop your       │   │
│  │      file here              │   │
│  │                             │   │
│  │   or click to browse        │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Accepted: .pdf, .xml               │
│  Max size: 10 MB                    │
│                                     │
│  💡 Where to get:                   │
│  UBS: Login → Documents → Tax Docs │
│  PostFinance: E-Finance → Documents │
│                                     │
│  [Cancel]                           │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:** Drags file `UBS_eTax_2024.pdf` onto the box

---

### **Step 4: Processing (Automatic)**
```
┌─────────────────────────────────────┐
│  Import Bank Statement              │
│  ──────────────────────              │
│                                     │
│  Step 1 → Step 2 → Step 3 → Step 4 │
│   ✓       ⏳                        │
│                                     │
│  ⏳ Processing...                   │
│                                     │
│  [████████████████░░░░] 80%         │
│                                     │
│  ✅ Uploaded to secure storage      │
│  ✅ Extracted barcode from PDF      │
│  ✅ Decoded XML data                │
│  ⏳ Parsing eCH-0196...             │
│  ⏹ Validating...                   │
│                                     │
│  (Takes 3-5 seconds)                │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:** Waits 5 seconds (automatic)

---

### **Step 5: Review Extracted Data**
```
┌─────────────────────────────────────┐
│  Import Bank Statement              │
│  ──────────────────────              │
│                                     │
│  Step 1 → Step 2 → Step 3 → Step 4 │
│   ✓       ✓       📋                │
│                                     │
│  ✅ Successfully extracted from     │
│     UBS Switzerland AG              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏦 Bank Accounts (3)        │   │
│  │ Account 1: CHF 52,300       │   │
│  │ Account 2: CHF 28,000       │   │
│  │ Account 3: CHF 2,500        │   │
│  │                             │   │
│  │ 📈 Securities (5)           │   │
│  │ Nestlé: CHF 5,500           │   │
│  │ Roche: CHF 5,700            │   │
│  │ ... +3 more                 │   │
│  │                             │   │
│  │ 🏠 Mortgages (1)            │   │
│  │ Interest Paid: CHF 8,750    │   │
│  └─────────────────────────────┘   │
│                                     │
│  💰 SUMMARY:                        │
│  Total Interest: CHF 915.75         │
│  Total Dividends: CHF 482.50        │
│  Net Wealth: CHF -388,799           │
│                                     │
│  This will auto-fill 12 questions!  │
│                                     │
│  [< Back]  [Apply to Tax Return →] │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:** Reviews the numbers, clicks "Apply to Tax Return"

---

### **Step 6: Success Confirmation**
```
┌─────────────────────────────────────┐
│  Import Bank Statement              │
│  ──────────────────────              │
│                                     │
│  Step 1 → Step 2 → Step 3 → Step 4 │
│   ✓       ✓       ✓       ✅        │
│                                     │
│         ✅ Import Complete!          │
│                                     │
│  Your bank statement has been       │
│  imported successfully.             │
│                                     │
│  12 questions auto-filled:          │
│  ✓ Interest income                  │
│  ✓ Dividend income                  │
│  ✓ Bank balances                    │
│  ✓ Securities holdings              │
│  ✓ Net wealth                       │
│  ... +7 more                        │
│                                     │
│  Want to import salary cert now?    │
│  [Import Another Document]          │
│                                     │
│  [Continue to Interview →]          │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:** Clicks "Import Another Document" to upload salary cert

---

### **Step 7: Upload Salary Certificate** (Same process)
```
User repeats steps 3-6 for salary certificate

After 2 minutes:
✅ Bank statement imported (12 questions filled)
✅ Salary certificate imported (9 questions filled)

Total: 21 questions auto-filled!
```

**USER ACTION:** Clicks "Continue to Interview"

---

### **Step 8: Interview - Pre-filled Questions**
```
┌─────────────────────────────────────┐
│  Question 1 of 64                   │
│                                     │
│  What is your civil status?         │
│                                     │
│  ⚪ Single                          │
│  ⚪ Married ← User selects          │
│  ⚪ Divorced                         │
│                                     │
│  [Next →]                           │
│                                     │
└─────────────────────────────────────┘
```
**USER ACTION:** Answers normally

---

```
┌─────────────────────────────────────┐
│  Question 2 of 64                   │
│                                     │
│  Do you have children?              │
│                                     │
│  ⚪ Yes                             │
│  ⚪ No ← User selects               │
│                                     │
│  [Next →]                           │
│                                     │
└─────────────────────────────────────┘
```
**USER ACTION:** Answers normally

---

```
┌─────────────────────────────────────┐
│  Question 5 of 64                   │
│                                     │
│  💡 This was auto-filled from       │
│     your import!                    │
│  ✅ From ACME Salary Certificate    │
│                                     │
│  What is your gross employment      │
│  income?                            │
│                                     │
│  CHF 85,000.00 [Edit ✎]             │
│                                     │
│  Looks correct?                     │
│                                     │
│  [< Back]  [Skip (Already Done) →]  │
│                                     │
└─────────────────────────────────────┘
```
**USER ACTION:** Just clicks "Skip" (doesn't need to type anything!)

---

```
[Questions 6-14 all skipped - already filled]

User just clicks "Skip" 9 times in a row
Takes 30 seconds
```

---

```
┌─────────────────────────────────────┐
│  Question 15 of 64                  │
│                                     │
│  Did you make charitable donations  │
│  over CHF 100?                      │
│                                     │
│  ⚪ Yes                             │
│  ⚪ No ← User answers               │
│                                     │
│  [Next →]                           │
│                                     │
└─────────────────────────────────────┘
```
**USER ACTION:** Resumes answering questions

---

### **Step 9: Complete Interview**
```
After 10 minutes total:

✅ 21 questions skipped (auto-filled)
✅ 43 questions answered manually

┌─────────────────────────────────────┐
│                                     │
│     ✅ Interview Complete!          │
│                                     │
│  Time taken: 10 minutes             │
│  (vs. 45 min without import)        │
│                                     │
│  [Review & Calculate Taxes →]       │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:** Clicks "Review & Calculate"

---

### **Step 10: Done!**
```
┌─────────────────────────────────────┐
│  Your 2024 Tax Return               │
│                                     │
│  Tax Due: CHF 12,450                │
│                                     │
│  Based on:                          │
│  • Employment income: CHF 85,000    │
│  • Capital income: CHF 1,398        │
│  • Deductions: CHF 15,200           │
│                                     │
│  [Submit to Tax Authority]          │
│                                     │
└─────────────────────────────────────┘
```

**Total Journey A Time: 10-15 minutes** ✅

---

## 📱 JOURNEY B: Import During Interview

**Perfect for:** Users who start answering, then realize they have the files

### **Steps 1-2: Skip Import Screen**
```
User clicks "Get Started"
   ↓
Clicks "Skip - Answer Manually"
   ↓
Goes straight to interview
```

### **Step 3: Start Answering Questions**
```
┌─────────────────────────────────────┐
│  Question 1: Civil status?          │
│  User answers: Married              │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  Question 2: Children?              │
│  User answers: 0                    │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  Question 3: Canton?                │
│  User answers: Zürich               │
└─────────────────────────────────────┘
```

**USER ACTION:** Answering normally for 5 minutes...

---

### **Step 4: App Suggests Import** (NEW)
```
┌─────────────────────────────────────┐
│  Question 5 of 64                   │
│                                     │
│  Upload your employment certificate │
│  (Lohnausweis)                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💡 Save Time!               │   │
│  │                             │   │
│  │ If you have Swissdec format,│   │
│  │ we can auto-fill this + 8   │   │
│  │ more questions!             │   │
│  │                             │   │
│  │ [Import Swissdec] ← Click!  │   │
│  └─────────────────────────────┘   │
│                                     │
│  OR                                 │
│                                     │
│  📄 Upload regular PDF              │
│  [Drag & drop or browse]            │
│                                     │
│  OR                                 │
│                                     │
│  [Enter Manually]                   │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:**
- Thinks: "Oh! I have that file in my email"
- Clicks "Import Swissdec"

---

### **Step 5: Import Dialog Opens**
```
Same upload process as Journey A:
1. Upload file
2. Processing (5 seconds)
3. Review extracted data
4. Confirm

After 2 minutes:
✅ Salary certificate imported!
```

---

### **Step 6: Smart Skip**
```
┌─────────────────────────────────────┐
│  ✅ Import Complete!                │
│                                     │
│  9 questions auto-filled ahead.     │
│                                     │
│  What would you like to do?         │
│                                     │
│  ⚪ Skip to next unfilled question  │
│     (Recommended - jumps to Q15)    │
│                                     │
│  ⚪ Review each imported question   │
│     (Go through Q5-Q14 one by one)  │
│                                     │
│  ⚪ Continue from current question  │
│     (Normal flow)                   │
│                                     │
│  [Continue →]                       │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:** Selects "Skip to next unfilled" (recommended)

---

### **Step 7: Jump Ahead**
```
Question 5: ✅ (auto-filled)
Question 6: ✅ (auto-filled)
Question 7: ✅ (auto-filled)
...
Question 14: ✅ (auto-filled)
   ↓
Jumped directly to Question 15!

┌─────────────────────────────────────┐
│  Question 15 of 64                  │
│                                     │
│  Did you make donations over        │
│  CHF 100?                           │
│                                     │
│  ⚪ Yes                             │
│  ⚪ No ← User answers               │
│                                     │
└─────────────────────────────────────┘
```

**USER ACTION:** Continues answering from Q15 onward

---

### **Step 8: Complete**
```
Total time: 20 minutes

Breakdown:
- 5 min: Answered Q1-Q4 manually
- 2 min: Imported salary cert
- 13 min: Answered Q15-Q64 manually

Saved: 25 minutes (vs. 45 min)
```

**Total Journey B Time: 20 minutes** ✅

---

## 📱 JOURNEY C: No Import (Traditional)

**Perfect for:** Users who don't have standard files or prefer manual

### **All Steps**
```
┌─────────────────────────────────────┐
│  Step 1: Click "Get Started"        │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  Step 2: Click "Skip - Manual"      │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  Step 3: Answer all 64 questions    │
│          manually                   │
│          (No auto-fill)             │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  Step 4: Upload regular PDFs        │
│          (Optional - AI extracts)   │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  Step 5: Review & Submit            │
└─────────────────────────────────────┘
```

**Total Journey C Time: 45 minutes** (same as current)

**But:** This still works! No one is forced to use imports.

---

## 🔄 Side-by-Side Comparison

### **Journey A (Import First)**
```
Homepage
   ↓ (30 sec)
Pre-Import Screen
   ↓ (2 min) Upload bank statement
   ↓ (2 min) Upload salary cert
   ↓ (10 min) Answer remaining 43 questions
Done!

Total: 15 minutes
```

### **Journey B (Import During)**
```
Homepage
   ↓ (30 sec)
Skip import
   ↓ (5 min) Answer first 4 questions
   ↓ (2 min) Import when suggested
   ↓ (13 min) Answer remaining questions
Done!

Total: 20 minutes
```

### **Journey C (No Import)**
```
Homepage
   ↓ (30 sec)
Skip import
   ↓ (40 min) Answer all 64 questions
   ↓ (5 min) Upload regular PDFs (optional)
Done!

Total: 45 minutes
```

---

## 📊 Time Breakdown

### **What Takes Time in Each Journey:**

**Journey A:**
| Activity | Time |
|----------|------|
| Navigate to pre-import | 30 sec |
| Upload bank file | 2 min |
| Upload salary file | 2 min |
| Review imported data | 1 min |
| Answer Q1-Q4 (personal) | 2 min |
| Skip Q5-Q25 (auto-filled) | 30 sec |
| Answer Q26-Q64 (manual) | 7 min |
| **TOTAL** | **15 min** |

**Journey B:**
| Activity | Time |
|----------|------|
| Navigate to interview | 30 sec |
| Answer Q1-Q4 manually | 5 min |
| Import at Q5 | 2 min |
| Skip Q5-Q14 (auto-filled) | 30 sec |
| Answer Q15-Q64 manually | 13 min |
| **TOTAL** | **21 min** |

**Journey C:**
| Activity | Time |
|----------|------|
| Navigate to interview | 30 sec |
| Answer all 64 questions | 40 min |
| Upload regular PDFs | 5 min |
| **TOTAL** | **45 min** |

---

## 🎯 User Decision Points

### **Decision 1: Homepage → Pre-Import**
```
User sees: "Upload documents to save time?"

Options:
A) Upload now (Journey A) ← Recommended
B) Skip for now (Journey B or C)

Most users choose: A (60%)
Some users choose: B (40%)
```

### **Decision 2: During Interview**
```
User at Q5, sees: "Import Swissdec?"

Options:
A) Import now (Journey B)
B) Upload regular PDF
C) Enter manually

Most users choose: A if they have file (70%)
Otherwise choose: B or C (30%)
```

### **Decision 3: Review Imported Data**
```
User sees extracted data

Options:
A) Apply as-is ← Most common (95%)
B) Edit some values (4%)
C) Cancel import (1%)
```

---

## 📱 Mobile vs Desktop Flow

### **Desktop (Big Screen):**
```
Pre-Import Screen:
┌────────────────────────────────┐
│ [Salary]  [Bank]  [Skip]       │ ← Side by side
└────────────────────────────────┘

Import Dialog:
┌────────────────────────────────┐
│        Modal (centered)        │
│     (Medium size, 600px)       │
└────────────────────────────────┘
```

### **Mobile (Small Screen):**
```
Pre-Import Screen:
┌────────────┐
│ [Salary]   │ ← Stacked
├────────────┤
│ [Bank]     │
├────────────┤
│ [Skip]     │
└────────────┘

Import Dialog:
┌────────────┐
│ Full screen│ ← Slides up from bottom
│ overlay    │
└────────────┘
```

**Same steps, different layout!**

---

## ✅ Summary: The User Flow

### **Simplest Explanation:**

**Journey A (Fast):**
```
Open app → Upload 2 files → Answer 10 questions → Done
```

**Journey B (Flexible):**
```
Open app → Answer a few → Upload when suggested → Finish
```

**Journey C (Traditional):**
```
Open app → Answer all manually → Done
```

**All roads lead to the same destination: Tax return filed!**

---

## 🎯 Key Takeaways:

1. **User has 3 choices** - all work fine
2. **No forced changes** - import is optional
3. **Saves time** - 30-35 minutes with import
4. **Same destination** - all paths complete the tax return
5. **Flexible** - can import at start OR during
6. **Fallback** - if import fails, can always type manually

**That's the entire user flow!** 🚀