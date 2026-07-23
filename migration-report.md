# ApplyME Top 20 ProgramV2 Migration Report

> Status: pre-migration review only  
> Generated: 2026-07-23  
> Scope: the 20 legacy records listed in Step 4.2  
> No program data has been migrated by this report.

## 1. Migration objective

The current UI continues to consume the legacy `Program` contract. The migration will
therefore be additive:

```text
legacy Program
    │
    ├── retained unchanged for current UI
    │
    └── toProgramV2(program) adapter
            │
            └── ProgramV2 overrides for the audited Top 20
```

The proposed implementation must:

- keep every existing legacy record available to the current UI;
- add only ProgramV2 data-layer records and adapter mappings;
- avoid changing Dashboard, components, filters, favorites, comparison, or school-list logic;
- preserve the legacy ID as an alias when a legacy record is split;
- attach a field-level verification object to every newly populated field;
- use only official university sources;
- store no regional averages or inferred tuition amounts.

## 2. Required minimal schema extensions before migration

The existing V2 schema is broadly compatible, but two requirements cannot currently be
represented exactly.

### 2.1 Verification status

Current:

```ts
type VerificationState =
  | "verified"
  | "pending"
  | "not-published"
  | "historical";
```

Required additive extension:

```ts
type VerificationState =
  | "verified"
  | "pending"
  | "not-published"
  | "historical"
  | "not-found";
```

`not-found` means the relevant official program/department/tuition sources were checked
but no program-specific value was located. It does not mean the value is zero.

### 2.2 Deadline type

`ApplicationRequirement` currently has `deadline` and `applicationRound`, but no
standalone `deadlineType`. Add an optional, non-breaking field:

```ts
type DeadlineType =
  | "priority"
  | "final"
  | "rolling"
  | "international"
  | "domestic"
  | "funding"
  | "unknown";

type ApplicationDeadline = {
  date: string | null;
  label?: string;
  round?: string;
  deadlineType?: DeadlineType;
  intake?: string;
  isPriority?: boolean;
  isRolling?: boolean;
};
```

The legacy `deadline` string remains untouched and is populated by the adapter only when
an existing screen requires it.

## 3. Adapter and split rules

### 3.1 Legacy alias strategy

For a non-split project:

```text
legacy ID -> one ProgramV2 canonical ID
```

For a split project:

```text
legacy ID -> default canonical ProgramV2 record
          -> additional ProgramV2 record(s)
```

The default mapping should preserve the degree already named by the legacy record. No UI
should automatically display the extra record until a future, separately approved UI
integration.

### 3.2 Required splits

| Legacy ID | Existing mixed record | Proposed ProgramV2 records | Default alias |
|---|---|---|---|
| `princeton-mae` | Princeton MAE MSE with generic duration/curriculum | `princeton-mae-mse`, `princeton-mae-meng` | `princeton-mae-mse` |
| `rice-me` | Program says Mechanical Engineering and degree says MMechE while sources cover MS and MME | `rice-me-ms`, `rice-me-mme` | `rice-me-mme` |
| `uva-mae` | MS record but source family also describes MEng | `uva-mae-ms`, `uva-mae-meng` | `uva-mae-ms` |
| `utoronto-me` | Department name is stored as program name | `utoronto-mie-meng` | `utoronto-mie-meng` |

Result: the 20 legacy records produce 23 canonical ProgramV2 records. This does not add a
new university; it normalizes distinct degrees already offered by the same institutions.

## 4. Verification rules

All newly populated fields use `lastVerifiedAt: "2026-07-23"`.

| Status | Migration meaning |
|---|---|
| `verified` | Current official page explicitly supports the value and is not tied only to an expired cycle |
| `historical` | Official value is explicitly tied to the 2025-26 or Fall 2026 cycle |
| `pending` | Official source exists, but the target Fall 2027 value is unpublished, ambiguous, or conflicts with another official page |
| `not-found` | Relevant official sources were checked but no program-specific value was located |

Recurring month/day deadlines that do not identify a cycle remain `pending`, unless the
official page explicitly identifies Fall 2027.

For tuition:

```ts
{
  amount: null,
  currency: "...",
  year: "2027",
  billingBasis: "unknown",
  isInternationalStudent: null,
  includesFees: null,
  sourceUrl: "<official page checked>",
  verificationStatus: "not-found",
  note: "No program-specific official tuition amount located."
}
```

No amount may be copied from a different degree, a regional average, an undergraduate
fee table, or a third-party website.

## 5. Current baseline

The existing checker reports:

- 91 total legacy records;
- all 20 selected records are currently grade D;
- 15 selected records score 24;
- Northwestern, Rice, and Georgia Tech score 25;
- HKU and Toronto score 26;
- common missing dimensions are deadline, application website, field-level verification,
  GRE, recommendations, tuition, and curriculum.

Projected scores below are estimates for planning. They are not test results and must be
recalculated after the proposed records are implemented.

## 6. Per-program migration plan

### 1. Princeton University

**Legacy record**

- ID: `princeton-mae`
- Program: Mechanical and Aerospace Engineering
- Degree: MSE
- Current score: 24/D
- Problem: generic tracks and duration mix distinct MSE and MEng routes.

**Proposed records**

1. `princeton-mae-mse` — Mechanical and Aerospace Engineering, M.S.E.
2. `princeton-mae-meng` — Mechanical and Aerospace Engineering, M.Eng.

**Fields to add**

- School: Princeton University / 普林斯顿大学
- Location: Princeton, New Jersey, United States
- MSE: two-year research/thesis route; eight graded courses plus thesis
- MEng: one-year coursework/professional route
- Fall 2026 deadline: December 1, 2025, `historical`
- Application fee: USD 75, `historical`
- GRE: not accepted, `historical`
- Areas: applied physics; biomechanics and biomaterials; control, robotics and dynamical
  systems; fluid mechanics; materials science; propulsion and energy
- Tuition: `not-found`
- Risk: Fall 2027 deadline and requirements are not yet verified; MEng external-support
  expectations must not be applied to MSE

**Sources**

- https://gradschool.princeton.edu/academics/degrees-requirements/fields-study/mechanical-and-aerospace-engineering
- https://mae.princeton.edu/graduate/admissions
- https://mae.princeton.edu/

**Projected score**

- MSE: 24/D -> 78/B
- MEng: new canonical record -> approximately 74/B

### 2. University of Pennsylvania

**Legacy record**

- ID: `upenn-robotics`
- Program: Robotics
- Degree: MSE
- Current score: 24/D

**Proposed record**

- `upenn-robotics-mse` — Robotics, MSE

**Fields to add**

- School: University of Pennsylvania / 宾夕法尼亚大学
- Location: Philadelphia, Pennsylvania, United States
- Program and curriculum description from the official catalog
- Coverage: robotics, vision, perception, control, automation, and machine learning
- Deadline, GRE, TOEFL, IELTS, letters, CV, SOP: `pending` until a current Robotics MSE
  admissions source explicitly confirms them
- Tuition: `not-found`
- Risk: the GRASP academic page and Penn Engineering admissions pages have separate
  responsibilities; no requirements may be inferred from another Penn master's program

**Sources**

- https://catalog.upenn.edu/graduate/programs/robotics-mse/
- https://www.grasp.upenn.edu/academics/masters/

**Projected score**

- 24/D -> 62/C

### 3. Brown University

**Legacy record**

- ID: `brown-me`
- Program: Mechanical Engineering
- Degree: ScM
- Current score: 24/D

**Proposed record**

- `brown-meam-scm` — Mechanical Engineering and Applied Mechanics, Sc.M.

**Fields to add**

- School: Brown University / 布朗大学
- Location: Providence, Rhode Island, United States
- One- or two-year on-campus program
- Thesis, non-thesis, and professional options
- GRE General: recommended
- Three recommendations; CV required; 1,000-1,500 word personal statement
- Priority deadline February 1, 2026 and final deadline April 1, 2026,
  both `historical`
- Eight-course completion structure
- Tuition: `not-found`
- Risk: 2027 deadlines and current language minimums require a new-cycle check

**Source**

- https://graduateprograms.brown.edu/graduate-program/mechanical-engineering-and-applied-mechanics-scm

**Projected score**

- 24/D -> 82/B

### 4. University of California, Berkeley

**Legacy record**

- ID: `berkeley-me`
- Program: Mechanical Engineering
- Degree: MEng
- Current score: 24/D

**Proposed record**

- `berkeley-me-meng` — Mechanical Engineering, MEng

**Fields to add**

- School: University of California, Berkeley / 加州大学伯克利分校
- Location: Berkeley, California, United States
- Fall 2027 deadline: January 6, 2027 at 8:59 PM PST, `verified`
- GRE: not required, `verified`
- Two recommendation letters, `verified`
- Resume/CV: optional but preferred, `verified`
- 25-unit curriculum, including technical concentration and engineering leadership
- Tuition: `not-found`
- Risk: English-score scale wording needs exact structured capture from the current page

**Sources**

- https://me.berkeley.edu/graduate/meng-admissions/
- https://me.berkeley.edu/graduate/meng/meng-degree-requirements/
- https://me.berkeley.edu/

**Projected score**

- 24/D -> 88/B

### 5. University of California, Los Angeles

**Legacy record**

- ID: `ucla-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D

**Proposed record**

- `ucla-mae-ms` — Mechanical Engineering, MS

**Fields to add**

- School: University of California, Los Angeles / 加州大学洛杉矶分校
- Location: Los Angeles, California, United States
- Fall-only admission; annual December 1 deadline
- Current admissions FAQ says GRE required, but store as `pending` because the page may
  not yet represent the Fall 2027 policy
- TOEFL 87 and IELTS 7.0 from the current official FAQ
- Curriculum and specializations remain `pending` until current official MS requirements
  are mapped
- Tuition: `not-found`
- Risk: potentially stale GRE language and no target-cycle label

**Sources**

- https://www.mae.ucla.edu/graduate-admissions/
- https://www.mae.ucla.edu/graduate-admissions-2/

**Projected score**

- 24/D -> 70/B

### 6. Vanderbilt University

**Legacy record**

- ID: `vanderbilt-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D

**Proposed record**

- `vanderbilt-me-ms` — Mechanical Engineering, MS

**Fields to add**

- School: Vanderbilt University / 范德堡大学
- Location: Nashville, Tennessee, United States
- Research-oriented MS; 30 coursework credits or 24 coursework plus 6 research credits
- Focus areas: surgical robotics; rehabilitation and socially assistive robotics;
  mechatronics, control and design; energy; fluids; nanotechnology; advanced manufacturing
- GRE not required for the 2026-27 admissions cycle
- TOEFL 89 and IELTS 7.0
- Department page says January 1 while the engineering admissions page says March 15 for
  Fall 2026 MS; deadline must be `pending`, with the conflict documented
- Tuition: `not-found`

**Sources**

- https://engineering.vanderbilt.edu/departments/mechanical-engineering/graduate-programs/
- https://engineering.vanderbilt.edu/graduate-admissions/

**Projected score**

- 24/D -> 74/B

### 7. University of Notre Dame

**Legacy record**

- ID: `notredame-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D
- Current automated classification: ACTIVE

**Proposed record**

- `notredame-me-review`
- `programStatus: "REVIEW"`

**Fields to add**

- School: University of Notre Dame / 圣母大学
- Location: Notre Dame, Indiana, United States
- Do not populate deadline, GRE, language, letters, CV, SOP, curriculum, or tuition
- Add risk factor:
  `当前未确认存在独立面向外部申请者的 Mechanical Engineering MS`
- All unconfirmed application fields: `pending`
- Tuition: `not-found`

**Sources**

- https://ame.nd.edu/graduate/
- https://ame.nd.edu/wp-content/uploads/sites/4/2025/08/AME-Grad-Handbook_2025_2026.pdf

**Projected score**

- 24/D -> approximately 48/D
- The lower score is intentional and accurately represents unresolved program scope

### 8. Washington University in St. Louis

**Legacy record**

- ID: `wustl-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D

**Proposed record**

- `wustl-me-ms` — Mechanical Engineering, MS

**Fields to add**

- School: Washington University in St. Louis / 圣路易斯华盛顿大学
- Location: St. Louis, Missouri, United States
- Full-time master's final deadline March 1; early-decision deadline December 31
- Deadline status: `pending` until the target cycle and Mechanical Engineering exception
  status are confirmed
- Remaining application documents and language requirements: `pending`
- Tuition: `not-found`
- Risk: centralized engineering deadlines and department-specific program content must be
  joined without assuming they have identical cycles

**Sources**

- https://engineering.washu.edu/academics/graduate-admissions/deadlines.html
- https://engineering.washu.edu/academics/graduate-admissions/index.html

**Projected score**

- 24/D -> 64/C

### 9. University of Virginia

**Legacy record**

- ID: `uva-mae`
- Program: Mechanical and Aerospace Engineering
- Degree: MS
- Current score: 24/D
- Problem: source family describes both research MS and coursework MEng.

**Proposed records**

1. `uva-mae-ms` — Mechanical and Aerospace Engineering, MS
2. `uva-mae-meng` — Mechanical and Aerospace Engineering, MEng

**Fields to add**

- School: University of Virginia / 弗吉尼亚大学
- Location: Charlottesville, Virginia, United States
- MS: research/thesis degree; 24 graduate credits including thesis research
- MEng: 30-credit, course-based, no-thesis degree
- Fall 2026 MS deadline December 16, 2025, `historical`
- Fall 2026 MEng international deadline March 20, 2026 and domestic deadline July 31,
  `historical`
- GRE optional; 2026 application fee waived, both `historical`
- MS risk: admission depends heavily on faculty interest and research funding
- Tuition: `not-found`

**Sources**

- https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering/apply-mae/apply-mae-information-prospective-graduate-students
- https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering/academics/graduate-programs/ms-mechanical-and-aerospace-engineering
- https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering/graduate-program-faqs

**Projected score**

- MS: 24/D -> 82/B
- MEng: new canonical record -> approximately 78/B

### 10. University of Florida

**Legacy record**

- ID: `uf-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D

**Proposed record**

- `uf-me-ms` — Mechanical Engineering, MS

**Fields to add**

- School: University of Florida / 佛罗里达大学
- Location: Gainesville, Florida, United States
- GRE not required
- Two recommendation letters; resume; SOP of 500 words or fewer
- Fall priority deadline January 5; international deadline March 1; domestic deadline
  June 1, all `pending` until the target cycle is explicit
- Background: engineering, mathematics, physics, or statistics
- Tuition: `not-found`

**Source**

- https://mae.ufl.edu/students/graduate/admissions/

**Projected score**

- 24/D -> 80/B

### 11. University of Texas at Austin

**Legacy record**

- ID: `utaustin-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D

**Proposed record**

- `utaustin-me-ms` — Mechanical Engineering, MS

**Fields to add**

- School: The University of Texas at Austin / 得克萨斯大学奥斯汀分校
- Location: Austin, Texas, United States
- Fall deadline December 1; spring deadline October 1
- GRE optional
- Three recommendation letters
- SOP and resume/CV required
- Engineering or physical-science background
- Deadline dates: `pending` until associated with a target cycle
- Tuition: `not-found`

**Source**

- https://www.me.utexas.edu/academics/graduate-program/graduate-admissions

**Projected score**

- 24/D -> 80/B

### 12. New York University

**Legacy record**

- ID: `nyu-me`
- Program: Mechatronics and Robotics
- Degree: MS
- Current score: 24/D

**Proposed record**

- `nyu-mechatronics-robotics-ms`

**Fields to add**

- School: New York University / 纽约大学
- Location: Brooklyn, New York, United States
- Formal name: Master of Science in Mechatronics and Robotics
- Interdisciplinary coursework, experiential learning, and project or thesis work
- Specializations: assistive mechatronic and robotic technologies; mobile robotics;
  microrobotics
- Current Tandon application fee: USD 90
- Deadline, GRE, language tests, recommendations, CV and SOP: `pending` until the
  program/current-cycle source explicitly supports each field
- Tuition: `not-found`

**Sources**

- https://mechatronics.engineering.nyu.edu/ms-degree/
- https://mechatronics.engineering.nyu.edu/ms-degree/courses/required-courses.php
- https://engineering.nyu.edu/admissions/graduate/apply/requirements

**Projected score**

- 24/D -> 68/C

### 13. Tufts University

**Legacy record**

- ID: `tufts-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D

**Proposed record**

- `tufts-me-ms` — Mechanical Engineering, MS

**Fields to add**

- School: Tufts University / 塔夫茨大学
- Location: Medford, Massachusetts, United States
- Full-time duration: one or two years
- Thesis option can be selected after matriculation with faculty support
- Application fee: USD 85
- GRE not required
- TOEFL 100; IELTS 7.5; Duolingo 120
- Resume/CV and personal statement required
- Recommendation count and target-cycle deadline: `pending`
- Tuition: `not-found`

**Source**

- https://engineering.tufts.edu/me/prospective-students/masters

**Projected score**

- 24/D -> 76/B

### 14. University of California, Santa Barbara

**Legacy record**

- ID: `ucsb-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D

**Proposed record**

- `ucsb-me-ms` — Mechanical Engineering, MS

**Fields to add**

- School: University of California, Santa Barbara / 加州大学圣塔芭芭拉分校
- Location: Santa Barbara, California, United States
- Fall 2027 application period: September 1-December 15, 2026, `verified`
- GRE not required
- Three recommendation letters
- Research areas: bioengineering and systems biology; computational science and
  engineering; dynamic systems, control and robotics; micro/nanoscale engineering;
  solid mechanics, materials and structures; thermal sciences and fluid mechanics
- Risk: research fit and potential-advisor alignment are important review criteria
- Tuition: `not-found`

**Sources**

- https://me.ucsb.edu/graduate/how-apply
- https://me.ucsb.edu/graduate/graduate-admissions

**Projected score**

- 24/D -> 88/B

### 15. Lehigh University

**Legacy record**

- ID: `lehigh-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 24/D

**Proposed record**

- `lehigh-me-ms` — Mechanical Engineering, MS

**Fields to add**

- School: Lehigh University / 理海大学
- Location: Bethlehem, Pennsylvania, United States
- GRE not required
- Two recommendation letters; personal statement; resume
- Application fee: USD 50
- Fall final deadline July 15; financial-support deadline December 15; spring deadline
  December 1, all `pending` until tied to the target cycle
- The department's 2025-26 tuition and fees figure must remain `historical`; do not use it
  as Fall 2027 tuition
- Fall 2027 tuition: `not-found`

**Sources**

- https://engineering.lehigh.edu/meche/graduate/admissions
- https://engineering.lehigh.edu/academics/graduate/masters/masters-mechanical-engineering

**Projected score**

- 24/D -> 78/B

### 16. Northwestern University

**Legacy record**

- ID: `northwestern-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 25/D

**Proposed record**

- `northwestern-me-ms` — Mechanical Engineering, MS

**Fields to add**

- School: Northwestern University / 西北大学
- Location: Evanston, Illinois, United States
- Course-based terminal and thesis MS options
- Typical duration 9-15 months
- 2025-26 GRE not required, `historical`
- Two recommendation letters; SOP; CV
- TOEFL 90; IELTS 7.0
- Fall 2026 deadline July 21, 2026, `historical`
- Curriculum breadth across solids, thermofluids/energy, controls, design/manufacturing,
  micro/nano, biomedical, mathematics/science, and engineering management
- Tuition: `not-found`

**Sources**

- https://www.mccormick.northwestern.edu/mechanical/academics/graduate/prospective-masters/how-to-apply.html
- https://www.mccormick.northwestern.edu/mechanical/academics/graduate/prospective-masters/
- https://www.mccormick.northwestern.edu/mechanical/academics/graduate/student-resources/masters-curriculum.html

**Projected score**

- 25/D -> 84/B

### 17. Rice University

**Legacy record**

- ID: `rice-me`
- Program: Mechanical Engineering
- Degree: MMechE
- Current score: 25/D
- Problem: the legacy record mixes the professional MME label with sources covering both
  MME and research MS.

**Proposed records**

1. `rice-me-ms` — Mechanical Engineering, MS
2. `rice-me-mme` — Mechanical Engineering, MME

**Fields to add**

- School: Rice University / 莱斯大学
- Location: Houston, Texas, United States
- MS: thesis/research route, normally completed within two calendar years
- MME: professional non-thesis route
- MS Fall deadline December 15; late consideration through January 15
- MME Fall deadline May 1 for international applicants and July 1 for domestic applicants
- Deadline cycle not explicit: `pending`
- GRE optional but recommended
- At least three recommendations
- TOEFL 90; IELTS 7.0
- Areas: aerospace; biomechanics; computational fluids/mechanics; energy; fluids and
  thermal science; design; mechanics; robotics; controls; tribology
- Tuition: `not-found`

**Sources**

- https://mech.rice.edu/academics/graduate-programs/graduate-admissions
- https://mech.rice.edu/academics/graduate-programs/master-science-program

**Projected score**

- MS: new canonical record -> approximately 82/B
- MME: 25/D -> approximately 78/B

### 18. Georgia Institute of Technology

**Legacy record**

- ID: `gatech-me`
- Program: Mechanical Engineering
- Degree: MS
- Current score: 25/D

**Proposed record**

- `gatech-me-msme` — Mechanical Engineering, MSME

**Fields to add**

- School: Georgia Institute of Technology / 佐治亚理工学院
- Location: Atlanta, Georgia, United States
- Thesis and non-thesis routes
- Undergraduate mechanical engineering or equivalent engineering background
- GRE no longer required according to the current Woodruff BS/MS notice
- Target-cycle deadline, language tests, recommendations, CV and SOP remain `pending`
  until a current regular-MSME admissions source confirms them
- Tuition: `not-found`
- Risk: official Woodruff pages include old and program-specific GRE statements; do not
  use Medical Physics or historic handbook requirements for MSME

**Sources**

- https://www.me.gatech.edu/graduate
- https://www.me.gatech.edu/faqs-3
- https://www.me.gatech.edu/bsms-0

**Projected score**

- 25/D -> 66/C

### 19. The University of Hong Kong

**Legacy record**

- ID: `hku-me`
- Program: Mechanical Engineering
- Degree: MSc(Eng)
- Current score: 26/D

**Proposed record**

- `hku-me-msceng` — MSc(Eng) in Mechanical Engineering

**Fields to add**

- School: The University of Hong Kong / 香港大学
- Location: Hong Kong, China
- Full-time one year; part-time two years
- 72-credit structure: at least 30 discipline-course credits, no more than 18 elective
  credits, and a 24-credit dissertation
- Subject coverage: energy and power; environmental engineering; material technology;
  theoretical mechanics; computer-integrated design and manufacturing
- Focus example: Robotics, Drones and Control
- The located admissions document is for September 2025 and is `historical`
- Current deadline, language requirements, documents and recommendations: `pending`
- Tuition: `not-found`

**Sources**

- https://mech.hku.hk/tpg/
- https://admissions.hku.hk/tpg/sites/default/files/R51_REGULATIONSYLLABUS_2.pdf
- https://admissions.hku.hk/tpg/sites/default/files/R363_PROGRAMINFORMATION_3.pdf

**Projected score**

- 26/D -> 72/B

### 20. University of Toronto

**Legacy record**

- ID: `utoronto-me`
- Program: Mechanical and Industrial Engineering
- Degree: MEng
- Current score: 26/D
- Problem: the department name is stored as the program name.

**Proposed record**

- `utoronto-mie-meng`
- Program: Master of Engineering
- Department: Mechanical and Industrial Engineering
- Degree: MEng

**Fields to add**

- School: University of Toronto / 多伦多大学
- Location: Toronto, Ontario, Canada
- Full-time, extended full-time, and part-time modes
- Two references
- Letter of Intent and CV required
- Fall 2026 co-op deadline February 4 and non-co-op deadline May 31, `historical`
- Winter 2027 international deadline September 15 and domestic deadline November 15,
  `verified` for that intake only
- Program is self-funded
- Exact program tuition: `not-found`
- GRE and detailed ELP scores remain `pending` unless the current SGS source explicitly
  verifies them

**Sources**

- https://www.mie.utoronto.ca/programs/graduate/master-of-engineering/
- https://www.mie.utoronto.ca/graduate./

**Projected score**

- 26/D -> 82/B

## 7. Planned migration output

After approval, the implementation should be limited to the data layer and the minimum
schema/adapter changes required to represent the audited values.

Proposed output:

1. Extend `VerificationState` with `not-found`.
2. Add optional `deadlineType`.
3. Add a Top 20 ProgramV2 override dataset.
4. Add an alias/split registry for the four split/renamed legacy records.
5. Update the adapter to merge a legacy Program with its ProgramV2 override.
6. Extend data-quality checks to:
   - validate every populated V2 field has field verification;
   - accept an official checked URL for `not-found` tuition;
   - prevent a historical deadline from being treated as current;
   - report split records separately without counting them as duplicate legacy programs;
   - enforce `programStatus: "REVIEW"` for Notre Dame.
7. Run `npm.cmd run data:check`.
8. Run `npm.cmd run build`.

No UI file, Dashboard logic, legacy project list, PDF generation, or unrelated program
record should be changed.

## 8. Approval gate

Migration has not started. Approval is required before creating the 23 canonical
ProgramV2 records and applying the adapter/schema changes described above.
