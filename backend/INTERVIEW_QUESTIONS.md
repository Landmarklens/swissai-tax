# Swiss Tax Interview Questions

Complete list of questions asked to users during the tax filing interview process.

## Question Flow Overview

The interview consists of **14 main questions (Q01-Q14)** with **16 conditional sub-questions**, totaling approximately **30 questions** depending on the user's personal situation.

---

## Personal Information

### Q01: Civil Status
**Question**: "What is your civil status on 31 Dec?"

**Type**: Single choice

**Options**:
- Single
- Married
- Divorced
- Widowed

**Languages**: English, German, French

#### Q01a: Spouse's First Name (if married)
**Type**: Text input
**Validation**: 2-50 characters

!Update
Ask for the AHV number not first name


#### Q01b: Spouse's Last Name (if married)
**Type**: Text input
**Validation**: 2-50 characters

!Update
Ask for the AHV number not first name

#### Q01c: Spouse's Date of Birth (if married)
**Type**: Date picker
**Validation**: Between 1920-01-01 and 2006-12-31

!Update
selection should be with calendar


#### Q01d: Is Spouse Employed? (if married)
**Type**: Yes/No

---

### Q02: Residence
**Question**: "What was your postal code of residence on 31 Dec 2024?"




**Type**: Text input (postal code)

**Validation**: 4-digit Swiss postal code (1000-9999)

**Help Text**: "Enter your 4-digit Swiss postal code where you lived at the end of 2024"

**Features**: Auto-lookup for canton/municipality

#### Q02a: Other Canton Income/Assets
**Question**: "Did you have income or assets in a canton other than your residence?"

**Type**: Yes/No

**Help Text**: "Select yes if you worked in a different canton or owned property outside your residence canton"

#### Q02b: Other Canton Postal Code (if yes to Q02a)
!Update
Do auto lookup postal code
Ask if more than one is needed ( there are people with assets in multiple canntons)


**Type**: Text input (postal code)

**Validation**: 4-digit Swiss postal code (1000-9999)

**Features**: Auto-lookup for canton

---

## Dependents

### Q03: Children
**Question**: "Do you have children?"

**Type**: Yes/No

#### Q03a: Number of Children (if yes)
**Type**: Number input
!Update
Have dropdown with number



**Validation**: 1-20 children

**Triggers**: Loop for Q03b (child details)

#### Q03b: Child Information (loops per child)

!Update
Explain why this is needed


**Type**: Group of fields

**Fields**:
1. **Child's name** (text, required)
2. **Date of birth** (date, required)
3. **In education/training?** (yes/no, required)

#### Q03c: Childcare Costs
**Question**: "Annual childcare costs (daycare, nanny, etc.)"

!Update
Here the user should add documents. IF input yes. IF no we should move one( there are people that do not have daycare etc)


**Type**: Currency (CHF)

**Validation**: CHF 0 - 25,500

**Help Text**: "Third-party childcare costs up to CHF 25,500 are deductible (2024 limit: CHF 25,800 from 2025)"

---

## Employment

### Q04: Employers
**Question**: "Number of employers (including yourself if self-employed)"
!Update
Have dropdown

**Type**: Number input

**Validation**: 0-10 employers

**Branching**: If 0, skip to Q05

#### Q04a: Employer Information (loops per employer)
**Type**: Group of fields

**Fields**:
1. **Employer name** (text, required)
2. **Employment percentage** (number 1-100%, required)

#### Q04b: Commuting Expenses

!Update
Yes or NO. IF yes user adds documents that we extrac infor


**Question**: "Annual commuting expenses (public transport passes/tickets)"

**Type**: Currency (CHF)

**Validation**: CHF 0 - 3,200

**Help Text**: "Public transport costs for commuting to work up to CHF 3,200 are deductible"

#### Q04c: Professional Expenses


!Update
Yes or NO. IF yes user adds documents that we extrac infor

**Question**: "Professional expenses (tools, training, work materials, etc.)"

**Type**: Currency (CHF)

**Validation**: CHF 0+

**Help Text**: "Work-related expenses such as professional tools, continuing education, work clothing, etc."

---

## Benefits

### Q05: Unemployment Benefits


**Question**: "Did you receive unemployment benefits?"

**Type**: Yes/No

---

### Q06: Disability/Accident Insurance
**Question**: "Did you receive disability/accident insurance benefits?"

**Type**: Yes/No

---

## Retirement Savings

### Q07: Pension Fund (2nd Pillar)
**Question**: "Do you have a pension fund (2nd pillar)?"

**Type**: Yes/No

---

### Q08: Pillar 3a Contributions
**Question**: "Did you contribute to Pillar 3a?"

**Type**: Yes/No

!Update
Yes or NO. IF yes user adds documents that we extrac infor
#### Q08a: Pillar 3a Amount (if yes)
**Question**: "Total Pillar 3a contributions (CHF)"

**Type**: Currency (CHF)

**Validation**: CHF 0 - 7,056 (2024 limit for employed persons)

!Update
Drop question
---

## Assets

### Q09: Real Estate
**Question**: "Do you own real estate?"

**Type**: Yes/No

#### Q09a: Number of Properties (if yes)
**Type**: Number input

!Update
Dropdown 

**Validation**: 1-20 properties

**Triggers**: Loop for Q09b (property details)

#### Q09b: Property Details (loops per property)

!Update
each property zip code and secondary ( we have pricipal already) add here

for all details we should mention what we are interested but the user should add documents. no input AI will pull the info


**Type**: Group of fields

**Fields**:
1. **Property type** (single choice, required)
   - Primary residence
   - Secondary residence
   - Rental property

2. **Property value (CHF)** (currency, required)

3. **Mortgage amount (CHF)** (currency, optional)

4. **Annual mortgage interest paid (CHF)** (currency, optional)
   - Help text: "Mortgage interest payments are fully deductible from taxable income"

---

### Q10: Securities/Investments
**Question**: "Do you have securities/investments?"

**Type**: Yes/No
!Update
Yes or NO. IF yes user adds documents that we extrac infor

---

## Deductions

### Q11: Charitable Donations
**Question**: "Did you make charitable donations over CHF 100?"

**Type**: Yes/No

!Update
Yes or NO. IF yes user adds documents that we extrac infor



---

### Q12: Alimony Payments
**Question**: "Did you pay alimony?"

**Type**: Yes/No


!Update
Yes or NO. IF yes user adds documents that we extrac infor

#### Q12a: Alimony Amount (if yes)
**Question**: "Total alimony paid (CHF)"

**Type**: Currency (CHF)

**Validation**: CHF 0+

!Update
Remove
---

### Q13: Medical Expenses
**Question**: "Did you have medical expenses over CHF 2000?"

**Type**: Yes/No


!Update
Yes or NO. IF yes user adds documents that we extrac infor

#### Q13a: Medical Expense Amount (if yes)

!Update
Remove
**Question**: "Total medical expenses (CHF)"

**Type**: Currency (CHF)

**Validation**: Minimum CHF 2,000

#### Q13b: Health Insurance Premiums

!Update
This is mandatory just documents. 
**Question**: "Total annual health insurance premiums paid"

**Type**: Currency (CHF)

**Validation**: CHF 0+

**Help Text**: "Health insurance premiums (basic and supplementary) are fully deductible. This is mandatory in Switzerland."

**Note**: This is a required question for all users

---

### Q14: Church Tax
**Question**: "Church tax preference"


!Update
Yes or NO. IF yes user adds documents that we extrac infor

**Type**: Single choice (required)

**Options**:
- No church tax
- Protestant
- Catholic

**Note**: This is the final question

---

## Document Requirements

Based on user answers, the following documents may be required:


!Update
add alredy the documents we have. User for all questions where documents are required can mark that they will bring them later and we should create a list for them

### R1: Employment Documents
**Condition**: If Q04 > 0 (has employers)

**Required**: Lohnausweis (wage statement) per employer

---

### R2: Unemployment Statement
**Condition**: If Q05 = yes

**Required**: Unemployment benefits statement


!Update
Yes or NO. IF yes user adds documents that we extrac infor

---

### R3: Insurance Benefits
**Condition**: If Q06 = yes

**Required**: Disability/accident insurance benefits statement

---

### R4: Pension Fund Certificate
**Condition**: If Q07 = yes

**Required**: Pension fund (2nd pillar) certificate

---

### R5: Pillar 3a Certificate
**Condition**: If Q08 = yes

**Required**: Pillar 3a contribution certificate

---

### R6: Property Documents
**Condition**: If Q09 = yes

**Required** (per property):
- Property tax statement
- Mortgage statement (if applicable)

---

### R7: Securities Statement
**Condition**: If Q10 = yes

**Required**: Securities/investment account statement

---

### R8: Donation Receipts
**Condition**: If Q11 = yes

**Required**: Charitable donation receipts

---

### R9: Medical Receipts
**Condition**: If Q13 = yes (medical expenses > CHF 2,000)

**Required**: Medical expense receipts

---

## Question Statistics

- **Total main questions**: 14 (Q01-Q14)
- **Total sub-questions**: 16 conditional follow-ups
- **Maximum questions per user**: ~30 (depending on situation)
- **Minimum questions per user**: 14 (if all conditional questions are "no")
- **Supported languages**: English, German, French
- **Document types**: 9 different document categories

---

## Tax Year Coverage

These questions are designed for the **2024 tax year** with the following limits:

- **Pillar 3a max**: CHF 7,056 (employed with pension fund)
- **Childcare costs max**: CHF 25,500 (increases to CHF 25,800 in 2025)
- **Commuting costs max**: CHF 3,200
- **Medical expenses threshold**: CHF 2,000
- **Donation minimum**: CHF 100

---

## Deduction Categories Covered

1. Professional expenses (automatic 3% + declared costs)
2. Pillar 3a contributions
3. Health insurance premiums (mandatory)
4. Childcare costs
5. Commuting expenses
6. Mortgage interest (fully deductible)
7. Medical expenses (above threshold)
8. Charitable donations
9. Alimony payments
10. Child deductions (CHF 6,600 per child federal)

---

## Interview Flow Logic

```
Q01 (Civil status)
  └─ If married → Q01a, Q01b, Q01c, Q01d
  └─ Else → Q02

Q02 (Postal code)
  └─ Q02a (Other canton?)
      └─ If yes → Q02b
      └─ Else → Q03

Q03 (Children?)
  └─ If yes → Q03a (count) → Q03b (loop details) → Q03c (costs)
  └─ Else → Q04

Q04 (Employers)
  └─ If > 0 → Q04a (loop details) → Q04b, Q04c
  └─ Else → Q05

Q05 (Unemployment) → Q06
Q06 (Disability) → Q07
Q07 (Pension fund) → Q08

Q08 (Pillar 3a?)
  └─ If yes → Q08a (amount)
  └─ Else → Q09

Q09 (Real estate?)
  └─ If yes → Q09a (count) → Q09b (loop details)
  └─ Else → Q10

Q10 (Securities) → Q11

Q11 (Donations?)
  └─ If yes → Q11a (amount)
  └─ Else → Q12

Q12 (Alimony?)
  └─ If yes → Q12a (amount)
  └─ Else → Q13

Q13 (Medical expenses?)
  └─ If yes → Q13a (amount)
  └─ Always → Q13b (insurance premiums)

Q13b → Q14 (Church tax) → COMPLETE
```

---

## Technical Implementation

**Configuration file**: `/backend/config/questions.yaml`

**Question model**: `/backend/models/question.py`

**Interview service**: `/backend/services/interview_service.py`

**API router**: `/backend/routers/interview.py`

**Answer storage**: Encrypted in `swisstax.tax_answers` table

**Profile storage**: Encrypted JSON in `TaxFilingSession.profile`
