# -*- coding: utf-8 -*-
"""Build, validate, and apply updated Chapter 27 content to mockData.json."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK_PATH = ROOT / "src" / "data" / "mockData.json"
BUNDLE_DIR = ROOT / "dist" / "library_chapter_reviews" / "ch27_20260830T034743Z" / "content"

def load_bundle_text(leaf_id):
    p = BUNDLE_DIR / f"{leaf_id}.txt"
    return p.read_text(encoding="utf-8")

def clean_text(text):
    # Remove em-dashes
    text = text.replace("\u2014", " - ").replace("&mdash;", " - ")
    text = re.sub(r' +-- +', ' - ', text)
    # Remove (PYQ FOCUS) and similar meta tokens
    text = re.sub(r'\s*\((?:PYQ\s*FOCUS|PYQ\s*Focus|PYQ\s*focus|PYQ)\)', '', text)
    text = re.sub(r'\s*\(CRITICAL\s*REVIEW\s*-\s*PYQ\s*FOCUS\)', ' (CRITICAL REVIEW)', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*\(PYQ FOCUS\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\(PYQ FOCUS\):', ':', text, flags=re.IGNORECASE)
    text = re.sub(r'\(PYQ FOCUS\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\(PYQ Focus\):', ':', text, flags=re.IGNORECASE)
    text = re.sub(r'\(PYQ Focus\)', '', text, flags=re.IGNORECASE)
    # Normalize double blank lines around tags
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# ==============================================================================
# LEAF 27-1
# ==============================================================================
def build_leaf_27_1():
    raw = load_bundle_text("27-1")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("DIMENSIONS OF HEALTH", "[SN]Dimensions of Health[/SN]\n\nDIMENSIONS OF HEALTH")
    t = t.replace("DETERMINANTS OF HEALTH", "[SN]Social Determinants of Health[/SN]\n\nDETERMINANTS OF HEALTH")
    t = t.replace("LIFE TABLE", "[SN]Life Table and its Applications in Public Health[/SN]\n\nLIFE TABLE")
    t = t.replace("FORMULAS AND CALCULATIONS\nHUMAN DEVELOPMENT INDEX (HDI):", "[SN]Human Development Index (HDI) and Health Indices[/SN]\n\nFORMULAS AND CALCULATIONS\nHUMAN DEVELOPMENT INDEX (HDI):")
    
    # Insert Census section before LIFE TABLE
    census_block = """[SN]Census and its Application in Health Planning[/SN]

CENSUS AND ITS APPLICATION IN HEALTH PLANNING
Definition: The United Nations defines a population census as the total process of collecting, compiling, evaluating, analysing, and publishing demographic, economic, and social data pertaining, at a specified time, to all persons in a country or in a well-delimited part of a country.

Key Characteristics:
- Individual enumeration of every person.
- Universality within a defined territory.
- Simultaneity (conducted at a well-defined reference time).
- Defined periodicity (conducted decennially).

Enumeration Methods:
1. De Facto Method: Enumerates individuals where they are physically present on the census night, regardless of their usual place of residence.
2. De Jure Method: Enumerates individuals according to their regular or permanent place of residence, regardless of where they are present on census day. India conducts census primarily through the de jure method with a snapshot verification.

Applications in Health Planning and Administration:
1. Base Denominator Data: Provides absolute denominators for calculating vital rates, including Crude Birth Rate (CBR), Crude Death Rate (CDR), Infant Mortality Rate (IMR), Age-Specific Fertility Rates (ASFR), and disease incidence/prevalence rates.
2. Target Group Identification: Quantifies specific beneficiary cohorts for national health programmes:
   - Infants: approx. 2% of total population.
   - Under-5 children: approx. 9-10% of total population.
   - Women of reproductive age (15-49 years): approx. 20-22%.
   - Eligible couples: approx. 15-18% of total population.
   - Geriatric population aged 60 years and above: approx. 10%.
3. Resource Allocation and Infrastructure Norms: Sets the population-to-facility ratios for establishing Sub-Health Centres (1 per 5,000 plains / 3,000 hilly or tribal), Primary Health Centres (1 per 30,000 / 20,000), and Community Health Centres (1 per 1,20,000 / 80,000).
4. Dependency Ratio and Demographic Dividend: Measures the ratio of dependent age groups (0-14 years and >=65 years) to the economically productive population (15-64 years).
5. Socio-Economic and Housing Health Correlates: Generates baseline data on literacy, female work participation, housing quality, piped water access, cooking fuel type, and sanitation facility coverage.

Indian context:
The Census of India is conducted under the statutory provisions of the Census Act, 1948, led by the Registrar General and Census Commissioner of India (RGI) under the Ministry of Home Affairs. The latest completed census was Census 2011 (reporting a population of 1.21 billion, sex ratio of 940 females per 1,000 males, and literacy rate of 74.04%).

> **EXAM TIP:** Structure as: UN definition -> De facto vs De jure -> 5 core public health applications (denominators, target cohorts, facility norms, dependency ratio, housing data) -> Indian statutory context (Census Act 1948 / RGI).

"""
    t = t.replace("[SN]Life Table and its Applications in Public Health[/SN]", census_block + "[SN]Life Table and its Applications in Public Health[/SN]")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 1, Determinants of Health, Major Health Problems and Disease Burden in India.
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 2, Concept of Health and Disease.
- Ministry of Home Affairs, Census Act 1948 & Census of India.
- Office of the Registrar General of India, Sample Registration System (SRS) Bulletins.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-2
# ==============================================================================
def build_leaf_27_2():
    raw = load_bundle_text("27-2")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("MAJOR HEALTH COMMITTEES", "[LAQ]Major Health Committees in India and their Recommendations[/LAQ]\n\nMAJOR HEALTH COMMITTEES")
    t = t.replace("NATIONAL POPULATION POLICY (NPP) 2000", "[SN]National Population Policy 2000[/SN]\n\nNATIONAL POPULATION POLICY (NPP) 2000")
    t = t.replace("NATIONAL HEALTH POLICY (NHP) 2017 (CRITICAL REVIEW)", "[LAQ]National Health Policy 2017: Goals, Quantitative Targets, and Key Policy Shifts[/LAQ]\n\nNATIONAL HEALTH POLICY (NHP) 2017 (CRITICAL REVIEW)")
    t = t.replace("RMNCH+A APPROACH", "[SN]RMNCH+A Approach and 5x5 Continuum of Care Matrix[/SN]\n\nRMNCH+A APPROACH")
    
    # Insert INAP block after RMNCH+A
    inap_block = """

[LAQ]India Newborn Action Plan (INAP): Goals, Principles and Strategic Packages[/LAQ]

INDIA NEWBORN ACTION PLAN (INAP)
Launched in September 2014 in response to the Global Every Newborn Action Plan (ENAP), INAP aims to accelerate the reduction of preventable newborn deaths and stillbirths in India.

1. Goals and Quantitative Targets:
- Target 1: Achieve Single-Digit Neonatal Mortality Rate (NMR <9 per 1,000 live births) by 2030 (interim target: <10 by 2025).
- Target 2: Achieve Single-Digit Stillbirth Rate (SBR <9 per 1,000 total births) by 2030 (interim target: <10 by 2025).

2. Guiding Principles (6 Core Principles):
- Integration: Synergistic alignment with RMNCH+A and National Health Mission (NHM) strategies.
- Equity: Prioritizing high-burden, hard-to-reach, and socioeconomically disadvantaged communities.
- Gender: Ensuring gender equity with special focus on the survival and care of the girl child.
- Quality of Care: Standardized clinical and nursing protocols across institutional delivery points.
- Convergence: Inter-sectoral coordination across Women and Child Development (ICDS), Drinking Water and Sanitation, and Education.
- Accountability: Real-time tracking via Maternal and Child Health Tracking System / ANMOL and mandatory Maternal and Perinatal Death Surveillance and Response (MPDSR).

3. Strategic Intervention Packages (6 Pillars along the Continuum of Care):
- Package 1: Pre-conception and Antenatal Care: Screening for maternal anemia (Anemia Mukt Bharat), gestational diabetes, syphilis, and ensuring minimum 4 antenatal check-ups (ANCs) including Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA).
- Package 2: Care during Labour and Childbirth: Dakshata and LaQshya initiatives for respectful maternity care, active management of third stage of labour (AMTSL), partograph monitoring, and availability of skilled birth attendants (SBAs).
- Package 3: Immediate Newborn Care: Thermal protection (delayed cord clamping, immediate skin-to-skin contact, drying), infection prevention, neonatal resuscitation, and initiation of breastfeeding within one hour of birth.
- Package 4: Care of the Healthy Newborn: Exclusive breastfeeding for 6 months, zero-dose immunization (BCG, OPV, Hep B), and routine home visits.
- Package 5: Care of Small and Sick Newborn: Facility-based newborn care through a 3-tier institutional network:
  - Newborn Care Corners (NBCC): Operational at all 24x7 Primary Health Centres (PHCs) and delivery points for resuscitation and initial stabilization.
  - Newborn Stabilization Units (NBSU): Established at First Referral Units (FRUs) and Community Health Centres (CHCs) for managing uncomplicated neonatal sickness and stabilizing small babies.
  - Special Newborn Care Units (SNCU): Dedicated 12-20 bedded specialized units at District Hospitals and Medical Colleges with trained pediatricians and nurses for managing severe sepsis, jaundice (phototherapy), and low birth weight (<1800 g), alongside Kangaroo Mother Care (KMC) wards.
- Package 6: Care Beyond Newborn Survival: Rashtriya Bal Swasthya Karyakram (RBSK) 4Ds screening (Defects at birth, Deficiencies, Diseases, Development delays including disability) via Mobile Health Teams and District Early Intervention Centres (DEIC).

4. Community-Based Home Visit Protocols:
- Home-Based Newborn Care (HBNC): Accredited Social Health Activist (ASHA) visits:
  - Institutional Delivery: 6 home visits (Days 3, 7, 14, 21, 28, and 42).
  - Home Delivery: 7 home visits (Days 1, 3, 7, 14, 21, 28, and 42).
- Home-Based Care for Young Child (HBYC): 5 additional structured home visits at 3, 6, 9, 12, and 15 months to monitor growth faltering, developmental milestones, complementary feeding, and age-appropriate immunization.

> **EXAM TIP:** Structure as: Launch year (2014) & Global alignment -> Single-digit NMR/SBR targets (<9 by 2030) -> 6 Guiding principles -> 6 Strategic packages across continuum of care -> 3-tier facility setup (NBCC, NBSU, SNCU) -> HBNC (6/7 visits) and HBYC (5 visits) home schedules."""
    
    t = t.replace("RMNCH+A APPROACH\n", "RMNCH+A APPROACH\n" + inap_block + "\n\n")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 2, Evolution of Health Reforms and Health Policy Development in India.
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 22, Health Care of the Community & Chapter 23, Health Planning and Management.
- Ministry of Health and Family Welfare (MoHFW), National Health Policy 2017.
- Ministry of Health and Family Welfare (MoHFW), India Newborn Action Plan (INAP) 2014.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-3
# ==============================================================================
def build_leaf_27_3():
    raw = load_bundle_text("27-3")
    t = clean_text(raw)
    
    # Fix encoding glitches
    t = t.replace("Parkinsonâ€™s", "Parkinson's").replace("Murphyâ€™s", "Murphy's")
    t = t.replace("Black and Mouton", "Blake and Mouton")
    t = t.replace("Management by Objective (MBO, )", "Management by Objectives (MBO, Peter Drucker)")
    
    # Fix economics definitions
    t = t.replace("When health outcomes of two or more interventions are established to be in all relevant dimensions", "When health outcomes of two or more interventions are established to be identical or equivalent in all relevant dimensions")
    t = t.replace("Outcomes are expressed in (e.g., cost per death averted", "Outcomes are expressed in natural clinical units (e.g., cost per death averted")
    t = t.replace("Both costs and health consequences are measured in (INR or USD)", "Both costs and health consequences are measured in monetary terms (INR or USD)")
    t = t.replace("lost due to intervention", "lost due to illness or saved by intervention")
    
    # Insert tags
    t = t.replace("CORE CONCEPTS\nLAWS OF MANAGEMENT", "CORE CONCEPTS\n\n[SN]Principles of Health Management and Administrative Functions[/SN]\n\nLAWS OF MANAGEMENT")
    t = t.replace("ROOT CAUSE ANALYSIS AND PROBLEM SOLVING", "[SN]Root Cause Analysis and Problem-Solving Tools in Health Management[/SN]\n\nROOT CAUSE ANALYSIS AND PROBLEM SOLVING")
    t = t.replace("LOGISTICS AND INVENTORY CONTROL", "[SN]ABC and VED Analysis in Drug Inventory Management[/SN]\n\nLOGISTICS AND INVENTORY CONTROL")
    t = t.replace("HEALTH ECONOMICS AND ECONOMIC EVALUATION", "[SN]Economic Evaluation in Health: CMA, CEA, CBA, and CUA[/SN]\n\nHEALTH ECONOMICS AND ECONOMIC EVALUATION")
    
    # Add Modern Management Techniques Block
    mmt_block = """[SN]Modern Management Techniques in Health[/SN]

MODERN MANAGEMENT TECHNIQUES IN HEALTH ADMINISTRATION
Modern management techniques provide quantitative, behavioral, and analytical tools to optimize decision-making, maximize resource utilization, and improve health system efficiency.

Classification of Modern Management Techniques:
1. Quantitative Management Techniques:
- Operations Research (OR): Mathematical modeling, linear programming, queuing theory, and simulation to solve complex operational bottlenecks.
- Inventory Control Techniques: ABC analysis (cost-based), VED analysis (criticality-based), SDE analysis (procurement availability), FSN analysis (consumption speed), and Economic Order Quantity (EOQ).
- Cost-Accounting and Economic Evaluation: Cost-Minimization Analysis (CMA), Cost-Effectiveness Analysis (CEA), Cost-Utility Analysis (CUA), and Cost-Benefit Analysis (CBA).
- Network Analysis Techniques: Programme Evaluation and Review Technique (PERT) for probabilistic projects and Critical Path Method (CPM) for deterministic workflows.
- Planning-Programming-Budgeting System (PPBS): Rational budgeting linking programmatic inputs directly to quantitative outputs and long-term national objectives.
- Zero-Base Budgeting (ZBB): Re-justifying every programme activity and expenditure from zero baseline every financial cycle.
- Work Study and Work Sampling: Method study and work measurement (time-motion studies) to optimize healthcare staff workflows, eliminate redundant movements, and standardize task completion times.
- Systems Analysis: Holistic examination of health systems as interconnected inputs, processes, outputs, and feedback loops.

2. Qualitative and Behavioral Management Techniques:
- Management by Objectives (MBO, Peter Drucker): Participatory goal-setting aligning individual staff targets with organizational health priorities.
- Management by Exception (MBE): Delegating routine operational decisions to subordinate staff while reserving top management intervention only for significant variances from established standards.
- Total Quality Management (TQM) and Continuous Quality Improvement (CQI): Organization-wide commitment to zero defects and patient satisfaction (Donabedian framework, NQAS).
- Delphi Technique and Nominal Group Technique: Structured expert consensus methodologies for public health policy forecasting.
- SWOT Analysis: Strategic situational analysis evaluating internal Strengths and Weaknesses alongside external Opportunities and Threats.

> **EXAM TIP:** Structure as: Definition and rationale -> Classification table (Quantitative vs Qualitative/Behavioral) -> 1-2 line description for each technique -> Application examples in Indian national health programmes.

"""
    t = t.replace("[SN]Root Cause Analysis and Problem-Solving Tools in Health Management[/SN]", mmt_block + "[SN]Root Cause Analysis and Problem-Solving Tools in Health Management[/SN]")
    
    # Insert 3x3 ABC-VED Matrix Table
    abc_ved_table = """
ABC-VED COMBINED INVENTORY MATRIX
Combining ABC and VED analyses creates a 3x3 matrix classifying drugs and consumables into three managerial control categories:

| | Vital (V) | Essential (E) | Desirable (D) |
| --- | --- | --- | --- |
| **A (High Value, 70-80% cost)** | Category I (AV) | Category I (AE) | Category I (AD) |
| **B (Medium Value, 15-25% cost)** | Category I (BV) | Category II (BE) | Category II (BD) |
| **C (Low Value, 5-10% cost)** | Category I (CV) | Category II (CE) | Category III (CD) |

Managerial Control Strategies:
- Category I (Items: AV, AE, AD, BV, CV): Top-priority control. Governed by senior hospital management. Stringent inventory monitoring, low buffer stock for expensive items, continuous weekly reviews, and strict vendor lead-time monitoring. No stock-outs permitted for vital drugs (AV, BV, CV).
- Category II (Items: BE, CE, BD): Moderate control. Governed by middle management (Store Officer / Pharmacist). Periodic monthly reviews, standard buffer stocks, and routine economic order quantities.
- Category III (Items: CD): Low control. Governed by decentralized storekeeper. Simple annual or bi-annual bulk purchasing, high buffer stocks permitted, minimum managerial paperwork.

> **EXAM TIP:** Draw the 3x3 ABC-VED matrix table -> Explain Category I (top management, zero vital stock-outs), Category II (middle management), and Category III (decentralized bulk orders) with exact inventory control rules.
"""
    t = t.replace("ECONOMIC ORDER QUANTITY (EOQ):", abc_ved_table + "\n\nECONOMIC ORDER QUANTITY (EOQ):")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 3, Public Health Management Sciences, Organization of Health Services, Health Management Functions and Resources in Health.
- Sathe PV, Sathe AP. Epidemiology and Management for Health Care for All. Mumbai: Popular Prakashan; Chapter 17, Modern Management Techniques.
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 23, Health Planning and Management.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-4
# ==============================================================================
def build_leaf_27_4():
    # Construct leaf 27-4 completely from clean sources (removing corrupted duplicate BMW text)
    t = """OVERVIEW OF THE CHAPTER
This chapter focuses on essential behavioral and social science dimensions of public health management. It covers community diagnosis, participatory grassroots governance, leadership and motivation theories in healthcare organizations, group dynamics, conflict resolution, Behavior Change Communication (BCC), and structured counseling frameworks (GATHER and REDI).

DEFINITIONS
COMMUNITY DIAGNOSIS: The identification and quantification of health problems in a community in terms of mortality and morbidity rates and ratios, and their identification for the purpose of determining those at risk or those who need health care, and the resources available to meet these needs.
PARTICIPATORY RURAL APPRAISAL (PRA): An approach and methods for learning about rural life and conditions from, with, and by rural people, enabling local people to make their own appraisal, analysis, and plan.
RAPID RURAL APPRAISAL (RRA): A systematic, semi-structured activity conducted on-site by a multidisciplinary team designed to quickly acquire new information on rural life.
SOCIAL MARKETING: The adaptation and adoption of commercial marketing concepts to plan, implement, and evaluate programmes designed to influence the voluntary behavior of target audiences to improve their physical and mental well-being and that of the society of which they are a part.
COUNSELING: A face-to-face communication process by which one person helps another person to make decisions and act on them, exploring feelings, identifying problems, and finding solutions in a supportive, non-judgmental environment.
BEHAVIOR CHANGE COMMUNICATION (BCC): An interactive process with communities (as integrated with an overall programme) to develop tailored messages and approaches using a variety of communication channels to develop positive behaviors, promote and sustain individual, community, and societal behavior changes, and maintain appropriate behaviors.

CORE CONCEPTS

[SN]Community Diagnosis: Concept, Steps, and Methods[/SN]

COMMUNITY DIAGNOSIS
Comparison between Clinical Diagnosis and Community Diagnosis:
| Feature | Clinical Diagnosis | Community Diagnosis |
| --- | --- | --- |
| Primary focus | Individual patient | Entire community or defined population |
| Primary investigator | Clinician / Physician | Epidemiologist / Public Health Specialist |
| Assessment methods | History, physical examination, laboratory and imaging tests | Demography, vital statistics, epidemiological surveys, community mapping |
| Target outcome | Identification of individual disease state | Identification of high-risk groups, health needs, and environmental determinants |
| Intervention plan | Prescription of drugs, surgery, or clinical therapy | Implementation of health programmes, policy reforms, and community interventions |
| Evaluation | Follow-up of individual patient recovery | Monitoring vital indicators, disease incidence, and population health improvements |

Steps in Community Diagnosis:
1. Community Profiling: Determining geographic boundaries, demographic structure, cultural practices, socioeconomic distribution, and political leadership.
2. Data Collection: Gathering primary data (household surveys, FGDs, key informant interviews) and secondary data (Census, SRS, HMIS, civil registration).
3. Data Analysis and Problem Identification: Calculating vital rates (CBR, CDR, IMR, MMR), disease prevalence/incidence, and environmental health risks.
4. Problem Prioritization: Ranking identified health problems using criteria such as magnitude, severity, community concern, feasibility, and cost-effectiveness (Hanlon method).
5. Formulating Action Plan: Defining SMART objectives, allocating resources, establishing timelines, and assigning responsibilities.
6. Implementation: Executing interventions with active community participation.
7. Evaluation and Re-assessment: Measuring outcomes against baseline indicators and modifying strategies.

> **EXAM TIP:** Structure as: Definition -> Comparison table (Clinical vs Community Diagnosis across 6 parameters) -> 7 sequential steps in Community Diagnosis -> Tools used (PRA, RRA, surveys).

[SN]Community Participation and Grassroots Institutions (PRIs and VHSNC)[/SN]

COMMUNITY PARTICIPATION & GRASSROOTS ORGANIZATIONS
Arnstein's Ladder of Citizen Participation:
- Non-participation: 1. Manipulation, 2. Therapy.
- Degrees of Tokenism: 3. Informing, 4. Consultation, 5. Placation.
- Degrees of Citizen Power: 6. Partnership, 7. Delegated Power, 8. Citizen Control.

Panchayati Raj Institutions (PRIs) - 73rd Constitutional Amendment Act, 1992:
Three-tier rural local self-governance:
1. Village Level: Gram Panchayat (headed by Sarpanch / Pradhan).
2. Block Level: Panchayat Samiti (headed by Block Pramukh / Chairperson).
3. District Level: Zilla Parishad (headed by Zilla Parishad President).

Village Health Sanitation and Nutrition Committee (VHSNC):
- Institutional mechanism at the Gram Panchayat level constituted under the National Health Mission (NHM).
- Composition: Minimum 15 members (50% female representation, 33% representation from SC/ST/marginalized groups). Accredited Social Health Activist (ASHA) serves as Member Secretary; Anganwadi Worker (AWW) and Auxiliary Nurse Midwife (ANM) act as facilitators.
- Financial Allocation: Receives an annual untied grant of ₹10,000.
- Core Functions:
  1. Community Health Planning: Formulates the Village Health Action Plan based on local health priorities.
  2. Sanitation and Hygiene: Organizes village clean-up drives, vector breeding site elimination, and maintenance of drinking water sources.
  3. Village Health Sanitation and Nutrition Day (VHSND): Mobilizes pregnant women, lactating mothers, and children for monthly VHSND sessions.
  4. Social Audit and Monitoring: Monitors local health facilities (Sub-Health Centres, Anganwadi Centres) and tracks universal access to government welfare programmes (PDS, MGNREGA).
  5. Emergency Escort Fund: Provides emergency financial assistance from untied funds for transporting complicated obstetric cases to referral hospitals.

> **EXAM TIP:** Detail PRIs 3-tier structure -> Detail VHSNC (composition, ₹10,000 untied fund, 5 core functions) -> Arnstein's ladder of participation.

[SN]Motivation Theories and Leadership Styles in Health Administration[/SN]

ORGANIZATIONAL BEHAVIOR: MOTIVATION & LEADERSHIP
1. Motivation Theories:
- Maslow's Hierarchy of Needs: 5 sequential levels of human needs:
  1. Physiological Needs: Basic survival (food, shelter, salary, working conditions).
  2. Safety and Security Needs: Job security, safe working environment, health insurance.
  3. Social / Belongingness Needs: Collegial relationships, teamwork, supportive supervision.
  4. Esteem Needs: Recognition, awards, status, professional autonomy.
  5. Self-Actualization Needs: Achieving one's highest potential, leadership roles, innovative public health problem-solving.
- Herzberg's Two-Factor Theory (Motivator-Hygiene Theory):
  - Hygiene Factors (Extrinsic): Working conditions, salary, organizational policy, interpersonal relationships. Their absence causes dissatisfaction, but their presence does not motivate.
  - Motivators (Intrinsic): Achievement, recognition, challenging work, responsibility, professional advancement. Their presence creates high motivation and job satisfaction.
- McGregor's Theory X and Theory Y:
  - Theory X (Authoritarian): Assumes workers are inherently lazy, dislike work, avoid responsibility, and require close supervision, coercion, and control.
  - Theory Y (Participative): Assumes workers are self-motivated, seek responsibility, exercise self-direction, and possess creative potential when properly supported.

2. Leadership Styles and Frameworks:
- Classic Leadership Styles:
  - Autocratic: Centralized authority, unilateral decision-making, strict compliance (effective in acute disaster triage and epidemic containment).
  - Democratic / Participative: Collaborative decision-making, active team involvement (effective in routine health planning and programme formulation).
  - Laissez-Faire: Minimal guidance, maximum subordinate autonomy (effective only with highly specialized research teams).
- Situational Leadership Model (Hersey and Blanchard): Matches leadership style to follower maturity / task readiness:
  - S1 - Directing / Telling (High Task, Low Relationship): For low competence, low commitment followers.
  - S2 - Coaching / Selling (High Task, High Relationship): For some competence, low commitment followers.
  - S3 - Supporting / Participating (Low Task, High Relationship): For high competence, variable commitment followers.
  - S4 - Delegating (Low Task, Low Relationship): For high competence, high commitment followers.
- Blake and Mouton Managerial Grid (Concern for Production vs Concern for People, scale 1 to 9):
  - (1,1) Impoverished Management: Minimum effort on both production and people.
  - (9,1) Authority-Compliance / Task Management: High concern for tasks, low concern for people.
  - (1,9) Country Club Management: High concern for people, low concern for tasks.
  - (5,5) Middle-of-the-Road Management: Adequate task efficiency and satisfactory morale.
  - (9,9) Team Management: High concern for both production and people (ideal leadership style).
- Likert's 4 Systems of Management:
  - System 1: Exploitative-Authoritative.
  - System 2: Benevolent-Authoritative.
  - System 3: Consultative.
  - System 4: Participative-Group (most effective for long-term health system performance).

> **EXAM TIP:** Structure as: Maslow's 5 tiers -> Herzberg's Hygiene vs Motivator distinction -> Hersey-Blanchard 4 quadrants (S1-S4) -> Blake-Mouton (9,9 Team Management).

[SN]Group Dynamics and Conflict Resolution[/SN]

GROUP DYNAMICS & CONFLICT RESOLUTION
1. Tuckman's 5 Stages of Team Development:
- Forming: Team members meet, explore roles, establish initial boundaries; orientation phase.
- Storming: Interpersonal conflict, competition for leadership, resistance to control; high emotionality.
- Norming: Consensus develops, group cohesion forms, team roles and behavioral norms agreed upon.
- Performing: Team functions smoothly toward shared goals with high synergy, autonomy, and problem-solving capacity.
- Adjourning: Task completion, group dissolution, and celebration of achievements.

2. Thomas-Kilmann Conflict Mode Instrument (Assertiveness vs Cooperativeness):
- Competing (High Assertiveness, Low Cooperativeness): Quick, decisive action in emergencies.
- Collaborating (High Assertiveness, High Cooperativeness): Win-win integration of diverse stakeholder perspectives.
- Compromising (Moderate Assertiveness, Moderate Cooperativeness): Finding mutually acceptable middle ground.
- Avoiding (Low Assertiveness, Low Cooperativeness): Postponing minor or unresolvable issues.
- Accommodating (Low Assertiveness, High Cooperativeness): Yielding to preserve harmony and build social capital.

3. Transactional Analysis (Eric Berne):
- Ego States: Parent (critical/nurturing), Adult (rational, objective, fact-based), Child (natural/adapted/rebellious).
- Types of Transactions: Complementary (parallel communication vectors, smooth dialogue), Crossed (conflicting vectors, causes communication breakdown), Ulterior (hidden psychological agenda under manifest social communication). Effective healthcare counseling operates predominantly in the Adult-to-Adult state.

[SN]Behavior Change Communication (BCC) and Counseling Techniques (GATHER Framework)[/SN]

BEHAVIOR CHANGE COMMUNICATION (BCC) & COUNSELING
1. Difference between Information, Education, and Communication (IEC) and BCC:
- IEC: Disseminates general health awareness, facts, and knowledge passively to broad populations through mass media (posters, radio spots, TV broadcasts).
- BCC: Evidence-based, interactive, strategic communication process that addresses underlying psychosocial determinants, attitudes, norms, and barriers to foster, adopt, and sustain specific healthy behaviors.

2. Transtheoretical Model of Behavior Change (Stages of Change, Prochaska and DiClemente):
1. Precontemplation: Not intending to take action in the foreseeable future (next 6 months); unaware or uninformed about the consequences of behavior.
2. Contemplation: Intending to change within the next 6 months; aware of pros and cons, but ambivalent.
3. Preparation: Intending to take action in the immediate future (next 30 days); has taken some preliminary behavioral steps.
4. Action: Specific overt behavioral modifications made within the past 6 months (e.g., smoking cessation, adopting exclusive breastfeeding).
5. Maintenance: Sustaining behavior change for >6 months, working actively to prevent relapse.
6. Termination / Relapse: Behavior is permanently internalized, or relapse occurs requiring re-entry into contemplation/preparation.

3. Counseling Techniques and Frameworks:
- GATHER Framework (Standard Family Planning and Immunization Counseling):
  - G - Greet: Warmly welcome the client, establish rapport, ensure privacy and comfort.
  - A - Ask: Inquire about health needs, reproductive intentions, previous contraceptive experiences, and concerns.
  - T - Tell: Provide clear, objective information on available methods, mechanisms, advantages, and possible side effects.
  - H - Help: Assist the client in making an informed voluntary choice that matches their needs.
  - E - Explain: Detail how to use the chosen method correctly, what to do if side effects occur, and dispel myths.
  - R - Return: Schedule a follow-up visit, provide referral contacts, and reassure the client that they can return at any time.
- REDI Framework (Adolescent Reproductive Health and HIV/STI Counseling):
  - R - Rapport Building: Establish trust, guarantee strict confidentiality, and set an empathetic tone.
  - E - Exploration: Explore the client's risk behaviors, feelings, knowledge, and social context.
  - D - Decision Making: Identify realistic options, evaluate consequences, and support informed decision-making.
  - I - Implementation: Develop a concrete action plan, practice negotiation skills, and arrange follow-up support.

> **EXAM TIP:** Compare IEC vs BCC -> Draw the 6 Stages of Change (Transtheoretical Model) -> Write GATHER framework with 1-2 lines per letter -> Write REDI framework for adolescent counseling.

MNEMONICS
**Mnemonic:** GATHER (Standard Counseling Framework)
- G: Greet the client warmly
- A: Ask about needs and concerns
- T: Tell about available methods
- H: Help to choose an appropriate method
- E: Explain how to use the method correctly
- R: Return / follow-up scheduling

[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 4, Key Health Management Functions and Best Practices I.
- Sathe PV, Sathe AP. Epidemiology and Management for Health Care for All. Mumbai: Popular Prakashan; Chapter 17, Modern Management Techniques (Personnel Management, Leadership, Motivation).
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 23, Health Planning and Management.
[/REF]"""
    return clean_text(t)

# ==============================================================================
# LEAF 27-5
# ==============================================================================
def build_leaf_27_5():
    raw = load_bundle_text("27-5")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("DECENTRALIZED PARTICIPATORY PLANNING", "[SN]Micro-Planning and Decentralized Participatory Planning[/SN]\n\nDECENTRALIZED PARTICIPATORY PLANNING")
    t = t.replace("THE HEALTH PLANNING CYCLE: STEPS IN SUBCENTRE ACTION PLAN", "[LAQ]Health Planning: Steps in Health Planning Cycle and Formulation of a District Health Plan[/LAQ]\n\n[SN]Health Planning Cycle[/SN]\n\nTHE HEALTH PLANNING CYCLE: STEPS IN SUBCENTRE ACTION PLAN")
    t = t.replace("APPLICATION OF THE LOGICAL FRAMEWORK (LOG FRAME)", "[SN]Logical Framework Analysis (Logframe Matrix)[/SN]\n\nAPPLICATION OF THE LOGICAL FRAMEWORK (LOG FRAME)")
    
    # Add dedicated Gantt Chart section
    gantt_block = """

[SN]Gantt Chart in Health Project Management[/SN]

GANTT CHART IN HEALTH PROJECT MANAGEMENT
Developed by Henry L. Gantt (1917), the Gantt chart is a horizontal bar chart used for project scheduling, workflow coordination, and progress tracking.

1. Structural Components:
- Horizontal Axis (X-axis): Represents chronological project calendar time (days, weeks, months, quarters).
- Vertical Axis (Y-axis): Lists discrete, sequential work packages, activities, and milestones.
- Horizontal Bars: Length of each bar represents the planned duration of that activity. The start of the bar indicates start date, and the end indicates planned completion date.
- Shading / Progress Fill: Partial coloring of bars indicates actual percentage completion relative to the reporting date (represented by a vertical "time line" cursor).

2. Task Dependency Relationships:
- Finish-to-Start (FS): Activity B cannot begin until Activity A finishes (e.g., Training vaccinators must finish before launching immunization drive).
- Start-to-Start (SS): Activity B can begin as soon as Activity A begins (e.g., Distributing IEC materials starts concurrently with public announcements).
- Finish-to-Finish (FF): Activity B cannot finish until Activity A finishes (e.g., Monitoring visits continue until the vaccination campaign concludes).

3. Public Health Applications:
- Pulse Polio Immunization (PPI) and Intensified Mission Indradhanush (IMI) micro-planning.
- Roll-out of national health programme campaigns (e.g., Mass Drug Administration for Lymphatic Filariasis).
- Construction, upgrading, and commissioning of Ayushman Arogya Mandirs (Health and Wellness Centres).
- Health sector emergency preparedness and disaster relief mobilization.
- Annual district health action planning (DHAP) implementation tracking.

4. Comparison: Gantt Chart vs Network Analysis (PERT/CPM):
| Parameter | Gantt Chart | PERT / CPM |
| --- | --- | --- |
| Primary representation | Linear bar chart against time | Network diagram of nodes (events) and arrows (activities) |
| Inter-task dependencies | Limited visual depiction | Explicitly mapped dependency network |
| Critical Path | Does not calculate Critical Path | Identifies Critical Path (longest path with zero slack) |
| Uncertainty modeling | Deterministic single duration estimate | Probabilistic three-time estimates ($t_o, t_m, t_p$) in PERT |
| Ease of understanding | High visual clarity; easily understood by all staff | Requires technical training to construct and interpret |

> **EXAM TIP:** Define Henry Gantt origin -> Draw X-axis (time) vs Y-axis (tasks) bar diagram -> Explain 3 task dependencies (FS, SS, FF) -> Detail 4 public health uses -> Present 5-point comparison table with PERT/CPM."""
    
    t = t.replace("APPLICATION OF THE LOGICAL FRAMEWORK (LOG FRAME)\n", "APPLICATION OF THE LOGICAL FRAMEWORK (LOG FRAME)\n" + gantt_block + "\n\n")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 5, Key Health Management Functions and Best Practices II.
- Sathe PV, Sathe AP. Epidemiology and Management for Health Care for All. Mumbai: Popular Prakashan; Chapter 17, Modern Management Techniques (Gantt Chart, Planning-Programming-Budgeting System).
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 23, Health Planning and Management.
- National Health Mission (NHM), District Health Action Plan Guidelines.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-6
# ==============================================================================
def build_leaf_27_6():
    raw = load_bundle_text("27-6")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("SUPPORTIVE SUPERVISION", "[SN]Supportive Supervision in Health Management[/SN]\n\nSUPPORTIVE SUPERVISION")
    t = t.replace("EVALUATION OF HEALTH PROGRAMMES", "[LAQ]Programme Evaluation: Types, Study Designs, and Plan to Evaluate a Community Health Education Intervention[/LAQ]\n\nEVALUATION OF HEALTH PROGRAMMES")
    t = t.replace("CRITICAL REVIEW OF HMIS IN INDIA", "[LAQ]Health Management Information System (HMIS) in India: Critical Review, Innovations, and Grassroots Improvements[/LAQ]\n\nCRITICAL REVIEW OF HMIS IN INDIA")
    t = t.replace("HOSPITAL STATISTICS & ADMINISTRATION", "[SN]Hospital Utilization Indices: Bed Occupancy Rate, ALOS, and Turnover Interval[/SN]\n\nHOSPITAL STATISTICS & ADMINISTRATION")
    
    # Add structured plan to evaluate community health education intervention
    eval_plan_block = """

PLAN TO EVALUATE A PROPOSED COMMUNITY HEALTH EDUCATION INTERVENTION
Scenario: Evaluating a 1-year community-based health education and BCC intervention aimed at increasing institutional delivery and early initiation of breastfeeding in a rural block.

1. Evaluation Framework (Input-Process-Output-Outcome-Impact):
- Inputs: Financial resources allocated, educational flipcharts, audio-visual aids, training of ASHAs and ANMs.
- Process: Number of VHSND counseling sessions conducted, percentage of pregnant women counselled, adherence to standard counseling protocols.
- Outputs: Number of community mothers attending BCC sessions, educational brochures distributed.
- Outcomes (Intermediate): Knowledge, Attitude, and Practice (KAP) scores regarding birth preparedness; institutional delivery rate; colostrum feeding rate.
- Impact (Long-term): Neonatal Mortality Rate (NMR), Early Neonatal Sepsis incidence, Maternal Mortality Ratio (MMR).

2. Evaluation Study Design:
- Quasi-Experimental Pre-Post Design with Non-Equivalent Control Group:
  - Intervention Block: Receives the structured health education programme.
  - Control Block: Matched for baseline demographic and socioeconomic variables; continues routine standard primary care without targeted BCC campaigns.
  - Baseline Assessment: Pre-intervention survey in both blocks measuring baseline maternal knowledge and institutional delivery rates.
  - Endline Assessment: Post-intervention survey 12 months later in both blocks to calculate Difference-in-Differences (DiD) effect, controlling for secular secular trends.

3. Data Collection Methods:
- Quantitative: Representative cluster sampling household survey of mothers who delivered in the preceding 12 months using a structured questionnaire.
- Qualitative: Focus Group Discussions (FGDs) with mothers, mothers-in-law, and ASHAs; In-Depth Interviews (IDIs) with Medical Officers.
- Secondary Data: HMIS and ANMOL delivery registers verified against civil registration death and birth records.

4. Key Evaluative Indicators:
- Process: Coverage of >=4 ANC counseling contacts (target: >85%).
- Outcome: Institutional delivery rate (target: increase by >=20 percentage points over baseline).
- Outcome: Early initiation of breastfeeding within 1 hour of birth (target: >80%).
- Outcome: Colostrum feeding rate (target: >90%).

5. Evaluation Dissemination and Action:
- Submission of findings to District Health Society (DHS) to institutionalize successful BCC modules into the District Health Action Plan (DHAP)."""
    
    t = t.replace("EVALUATION OF HEALTH PROGRAMMES\n", "EVALUATION OF HEALTH PROGRAMMES\n" + eval_plan_block + "\n\n")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 6, Supportive Supervision, Monitoring and Evaluation, and HMIS as Health Management Functions.
- Sathe PV, Sathe AP. Epidemiology and Management for Health Care for All. Mumbai: Popular Prakashan; Chapter 17, Modern Management Techniques.
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 23, Health Planning and Management.
- National Health Systems Resource Centre (NHSRC), HMIS Operational Guidelines.
- National Health Authority (NHA), Ayushman Bharat Digital Mission (ABDM) Framework.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-7
# ==============================================================================
def build_leaf_27_7():
    raw = load_bundle_text("27-7")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("UNIVERSAL HEALTH COVERAGE (UHC) & AYUSHMAN BHARAT", "[LAQ]Ayushman Bharat: Comprehensive Primary Health Care (AB-HWC) and PM-JAY for Universal Health Coverage[/LAQ]\n\nUNIVERSAL HEALTH COVERAGE (UHC) & AYUSHMAN BHARAT")
    t = t.replace("PRIMARY HEALTH CARE SYSTEM & IPHS STANDARDS (RURAL)", "[LAQ]Rural Health Care Delivery System in India and IPHS Norms[/LAQ]\n\nPRIMARY HEALTH CARE SYSTEM & IPHS STANDARDS (RURAL)")
    t = t.replace("HEALTH SECTOR REFORMS & PUBLIC-PRIVATE PARTNERSHIP (PPP)", "[SN]Public-Private Partnerships (PPP) in Healthcare and SWOT Analysis[/SN]\n\nHEALTH SECTOR REFORMS & PUBLIC-PRIVATE PARTNERSHIP (PPP)")
    t = t.replace("QUALITY MANAGEMENT IN HEALTH SERVICES", "[SN]Quality Assurance in Health Care: Donabedian Framework and National Quality Assurance Standards (NQAS)[/SN]\n\nQUALITY MANAGEMENT IN HEALTH SERVICES")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 7, Health Care Delivery Systems in India and Sustainable Development Goals.
- Sathe PV, Sathe AP. Epidemiology and Management for Health Care for All. Mumbai: Popular Prakashan; Chapter 17, Modern Management Techniques (SWOT Analysis).
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 22, Health Care of the Community.
- Ministry of Health and Family Welfare (MoHFW), Indian Public Health Standards (IPHS) 2022 Guidelines.
- National Health Authority (NHA), Pradhan Mantri Jan Arogya Yojana (PM-JAY) Operational Guidelines.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-8
# ==============================================================================
def build_leaf_27_8():
    raw = load_bundle_text("27-8")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("INTEGRATED DISEASE SURVEILLANCE PROGRAMME (IDSP)", "[LAQ]Disease Surveillance in India: IDSP, Transition to IHIP, and Outbreak Investigation[/LAQ]\n\nINTEGRATED DISEASE SURVEILLANCE PROGRAMME (IDSP)")
    t = t.replace("E-HEALTH, TELEMEDICINE & DIGITAL HEALTH", "[SN]Role of Telemedicine in Community Health (eSanjeevani)[/SN]\n\nE-HEALTH, TELEMEDICINE & DIGITAL HEALTH")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 8, Application of Principles of Epidemiology in Health Management and Management of National Health Programmes.
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 3, Principles of Epidemiology and Epidemiologic Methods & Chapter 23, Health Planning and Management.
- National Centre for Disease Control (NCDC), Integrated Disease Surveillance Programme (IDSP) & Integrated Health Information Platform (IHIP) Guidelines.
- Ministry of Health and Family Welfare (MoHFW), eSanjeevani Telemedicine Guidelines.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-9
# ==============================================================================
def build_leaf_27_9():
    raw = load_bundle_text("27-9")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("THE DISASTER MANAGEMENT CYCLE", "[LAQ]Disaster Management Cycle, Institutional Framework (NDMA), and Incident Response System[/LAQ]\n\nTHE DISASTER MANAGEMENT CYCLE")
    t = t.replace("INCIDENT RESPONSE SYSTEM (IRS) & TRIAGE", "[SN]Triage in Mass Casualty Incidents[/SN]\n\nINCIDENT RESPONSE SYSTEM (IRS) & TRIAGE")
    t = t.replace("HEALTH SECTOR RESPONSE TO SPECIFIC DISASTERS", "[LAQ]Health Sector Management of Floods and Post-Disaster Epidemics[/LAQ]\n\nHEALTH SECTOR RESPONSE TO SPECIFIC DISASTERS")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 9, Disaster Preparedness and Management (Public Health Emergency).
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 13, Environment and Health (Disaster Management).
- National Disaster Management Authority (NDMA), National Disaster Management Plan 2016.
- Ministry of Home Affairs, Disaster Management Act 2005.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-10
# ==============================================================================
def build_leaf_27_10():
    raw = load_bundle_text("27-10")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("NATIONAL GUIDELINES: BIO-MEDICAL WASTE MANAGEMENT RULES, 2016", "[LAQ]Bio-Medical Waste Management Rules 2016: Color-Coding, Segregation, and Disposal Technologies[/LAQ]\n\nNATIONAL GUIDELINES: BIO-MEDICAL WASTE MANAGEMENT RULES, 2016")
    t = t.replace("CAPACITY BUILDING, TRAINING, AND SAFETY MEASURES", "[SN]Occupational Safety and Needle-Stick Injury Management in Healthcare Workers[/SN]\n\nCAPACITY BUILDING, TRAINING, AND SAFETY MEASURES")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 10, Infection Management and Environment Plan—Biomedical Waste Management.
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 13, Environment and Health (Hospital Waste Management).
- Ministry of Environment, Forest and Climate Change (MoEFCC), Bio-Medical Waste Management Rules 2016 (amended 2018, 2019).
- Central Pollution Control Board (CPCB), Guidelines for Common Bio-medical Waste Treatment and Disposal Facilities.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-11
# ==============================================================================
def build_leaf_27_11():
    raw = load_bundle_text("27-11")
    t = clean_text(raw)
    
    # Insert tags
    t = t.replace("MEDICAL ETHICS AND INTERNATIONAL DECLARATIONS", "[SN]Ethical Declarations in Medical Research: Nuremberg Code and Declaration of Helsinki[/SN]\n\nMEDICAL ETHICS AND INTERNATIONAL DECLARATIONS")
    t = t.replace("RESEARCH IN HEALTH MANAGEMENT", "[LAQ]Health Systems Research (HSR): Definition, Evolution, Study Designs, and Methodologies[/LAQ]\n\nRESEARCH IN HEALTH MANAGEMENT")
    t = t.replace("1. Operational Research (OR):", "[SN]Operational Research in Health Services: Concept, Scope, and Steps[/SN]\n\n1. Operational Research (OR):")
    t = t.replace("PROGRAMME EVALUATION AND REVIEW TECHNIQUE (PERT) & CPM", "[LAQ]Project Formulation Steps and Role of Network Analysis (PERT and CPM) in Health Management[/LAQ]\n\n[SN]Network Analysis: Programme Evaluation and Review Technique (PERT) and Critical Path Method (CPM)[/SN]\n\nPROGRAMME EVALUATION AND REVIEW TECHNIQUE (PERT) & CPM")
    t = t.replace("QUALITATIVE RESEARCH METHODOLOGIES", "[SN]Qualitative Research Methods: Focus Group Discussions (FGD) and Delphi Technique[/SN]\n\nQUALITATIVE RESEARCH METHODOLOGIES")
    
    # Add Hybrid Designs & Implementation Research section
    hybrid_block = """[LAQ]Implementation Research: Hybrid Study Designs (Types 1, 2, and 3) and Comparison with Operational Research[/LAQ]

IMPLEMENTATION RESEARCH & HYBRID STUDY DESIGNS
Implementation research is the scientific study of methods to promote the systematic uptake of research findings and evidence-based practices into routine healthcare delivery, improving service quality and public health impact.

1. Hybrid Effectiveness-Implementation Designs (Curran et al.):
Hybrid study designs blend clinical effectiveness testing with implementation strategy evaluation across a continuum:

- Type 1 Hybrid Design:
  - Primary Objective: Test the clinical effectiveness of a healthcare intervention in a real-world setting.
  - Secondary Objective: Gather preliminary descriptive information on implementation context, feasibility, and potential barriers/facilitators.
  - Public Health Example: Testing the clinical efficacy of a new oral regimen for multidrug-resistant tuberculosis (MDR-TB) while documenting provider acceptability and patient treatment adherence patterns.

- Type 2 Hybrid Design (Dual Focus):
  - Primary Objective: Simultaneously test the clinical effectiveness of the health intervention AND evaluate the effectiveness of a specific implementation strategy.
  - Public Health Example: Evaluating the effectiveness of a mobile app for hypertension management (clinical outcome: blood pressure reduction) while concurrently comparing two implementation models: nurse-led community monitoring vs physician-led clinic visits (implementation outcome: adoption rate, cost per patient tracked).

- Type 3 Hybrid Design:
  - Primary Objective: Test the effectiveness of the implementation strategy (e.g., financial incentives, digital tracking, supportive supervision).
  - Secondary Objective: Observe and monitor clinical health outcomes and service delivery quality.
  - Public Health Example: Testing whether financial incentives for ASHAs improve the rate of institutional deliveries and postpartum home visits, while tracking maternal and neonatal mortality as secondary health outcomes.

2. Comparison: Implementation Research vs Operational Research:
| Feature | Implementation Research (IR) | Operational Research (OR) |
| --- | --- | --- |
| Focus | How to translate evidence-based interventions into widespread real-world practice | Solving specific, localized operational bottlenecks in existing programme delivery |
| Generalizability | High; aims to create generalizable knowledge and transferable implementation models | Context-specific; solves local system problems (e.g., reducing vaccine stock-outs in one district) |
| Theoretical Frameworks | Utilizes structured implementation frameworks (CFIR, RE-AIM, PRISM) | Utilizes quantitative modeling, queuing theory, linear programming, and process mapping |
| Target Outcomes | Adoption, Acceptability, Feasibility, Fidelity, Penetration, Sustainability | Service efficiency, resource allocation, turnaround time, unit cost reduction |
| Dissemination | Broad scientific publication and national policy formulation | Local programme modification and administrative standard operating procedures |

> **EXAM TIP:** Define Implementation Research -> Describe Type 1, 2, 3 Hybrid Designs (Curran framework) with 1 distinct public health example each -> Present 5-point comparison table with Operational Research."""
    
    t = t.replace("[LAQ]Health Systems Research (HSR): Definition, Evolution, Study Designs, and Methodologies[/LAQ]", hybrid_block + "\n\n[LAQ]Health Systems Research (HSR): Definition, Evolution, Study Designs, and Methodologies[/LAQ]")
    
    # Add Project Formulation Steps & Micronutrient OR section
    proj_form_block = """
STEPS IN HEALTH PROJECT FORMULATION
Project formulation is the systematic development of a project proposal from initial conception to final approval:
1. Project Genesis: Identification of health system gap or policy priority.
2. Project Identification: Defining target population, geographic scope, and preliminary problem statement.
3. Project Formulation: Detailed technical planning, logframe construction, budgeting, and risk analysis.
4. Project Appraisal: Formal multidisciplinary review (technical, financial, economic, environmental feasibility).
5. Project Approval: Administrative sanction and financial allocation by governing authorities (e.g., Cabinet / NHM Mission Steering Group).
6. Project Implementation: Executing activities according to work plans and network diagrams (Gantt, PERT/CPM).
7. Project Monitoring: Continuous tracking of physical and financial progress via HMIS.
8. Project Evaluation: Assessing output, outcome, and impact achievements against baseline targets.

[LAQ]Phases of Operational Research Applied to Micronutrient Deficiency Control[/LAQ]

PHASES OF OPERATIONAL RESEARCH APPLIED TO MICRONUTRIENT DEFICIENCY CONTROL
Applying the 5-phase OR cycle to optimize the National Iron Plus Initiative / Anemia Mukt Bharat (AMB):

Phase 1: Problem Identification & Situational Analysis:
- Identifying high prevalence of anemia despite widespread supply of Iron-Folic Acid (IFA) tablets.
- Diagnosing bottlenecks: High gastrointestinal side effects leading to poor compliance, supply chain stock-outs at Sub-Health Centres, and lack of community counseling.

Phase 2: Strategy Development & Hypothesis Generation:
- Developing alternative operational solutions:
  - Switching from standard IFA to enteric-coated or syrup formulations with meals.
  - Introducing direct supervised consumption during weekly school/Anganwadi sessions (WIFS).
  - Deploying digital tracking (T4 strategy: Test, Treat, Talk, Track via AMB portal).

Phase 3: Field Pilot Testing (Quasi-Experimental Design):
- Testing the modified intervention package in 2 high-burden blocks vs 2 standard-care control blocks for 6 months.
- Monitoring process fidelity, compliance logs, and side effect reporting.

Phase 4: Data Analysis & Outcome Evaluation:
- Evaluating outcomes: Proportion of beneficiaries consuming >=100 IFA tablets, percentage change in mean hemoglobin levels, and cost per anemia case corrected.

Phase 5: Policy Translation and Programmatic Scaling:
- Incorporating successful delivery strategies into state NHM Annual Programme Implementation Plans (PIPs) and scaling nationally under Anemia Mukt Bharat.

> **EXAM TIP:** Structure Project Formulation as 8 sequential steps -> Structure Micronutrient OR as 5 phases (Problem Identification -> Strategy Formulation -> Field Pilot -> Evaluation -> Scaling)."""
    
    t = t.replace("PROGRAMME EVALUATION AND REVIEW TECHNIQUE (PERT) & CPM\n", "PROGRAMME EVALUATION AND REVIEW TECHNIQUE (PERT) & CPM\n" + proj_form_block + "\n\n")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 11, Medical Ethics and Research in Public Health Management.
- Sathe PV, Sathe AP. Epidemiology and Management for Health Care for All. Mumbai: Popular Prakashan; Chapter 17, Modern Management Techniques (Network Analysis, PERT/CPM, Work Study, Operations Research).
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 23, Health Planning and Management.
- Indian Council of Medical Research (ICMR), National Ethical Guidelines for Biomedical and Health Research Involving Human Participants.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# LEAF 27-12
# ==============================================================================
def build_leaf_27_12():
    raw = load_bundle_text("27-12")
    t = clean_text(raw)
    
    # Fix outdated Yellow Fever validity
    t = t.replace("Valid for 10 years beginning 10 days after vaccination", "Valid for the life of the person vaccinated beginning 10 days after vaccination (WHA67.13 amendment to IHR Annex 7; booster doses cannot be required by port health authorities)")
    t = t.replace("valid for 10 years", "valid for the life of the person vaccinated")
    
    # Insert tags
    t = t.replace("MAJOR INTERNATIONAL HEALTH AGENCIES\n1. World Health Organization (WHO):", "[SN]World Health Organization: Structure, Regional Offices, and Core Functions[/SN]\n\nMAJOR INTERNATIONAL HEALTH AGENCIES\n1. World Health Organization (WHO):")
    t = t.replace("INTERNATIONAL HEALTH REGULATIONS (IHR 2005)", "[LAQ]International Health Regulations (IHR 2005): Objectives, Core Capacities, and Public Health Emergency of International Concern (PHEIC)[/LAQ]\n\nINTERNATIONAL HEALTH REGULATIONS (IHR 2005)")
    t = t.replace("INTERNATIONAL CLASSIFICATION OF DISEASES (ICD-11)", "[SN]International Classification of Diseases Eleventh Revision (ICD-11)[/SN]\n\nINTERNATIONAL CLASSIFICATION OF DISEASES (ICD-11)")
    
    # Add Mass Gathering & VHF Preparedness LAQ block
    vhf_block = """[LAQ]Prevention and Management of International Transmission of Viral Haemorrhagic Fevers (VHF) during Mass Gatherings[/LAQ]

PREVENTION AND MANAGEMENT OF INTERNATIONAL TRANSMISSION OF VIRAL HAEMORRHAGIC FEVERS (VHF) DURING INTERNATIONAL CONFERENCES / MASS GATHERINGS
Mass international gatherings (conferences, religious pilgrimages, sporting events) create high risks for the rapid cross-border introduction and amplification of high-consequence pathogens, including Viral Haemorrhagic Fevers (VHFs: Ebola, Marburg, Crimean-Congo Haemorrhagic Fever, Lassa Fever, Yellow Fever).

Comprehensive 4-Phase Public Health Management Framework under IHR (2005):

Phase 1: Pre-Event Planning & Risk Assessment (3 to 6 months prior):
- Multi-Agency Coordination: Establish a Health Emergency Operations Centre (EOC) linking MoHFW, NCDC, Ministry of External Affairs, Civil Aviation, and Immigration authorities.
- Country Risk Stratification: Enumerate delegates arriving from VHF-endemic or active outbreak countries.
- Point of Entry (PoE) Protocol: Mandate health declarations on visa applications, pre-travel advisories, and verify Yellow Fever international vaccination certificates (lifetime validity).
- Infrastructure & Laboratory Readiness: Designate BSL-4 diagnostic referral facilities (e.g., ICMR-National Institute of Virology, Pune) and pre-position Personal Protective Equipment (PPE Level 4 / Full body coveralls with PAPR) and viral transport media.

Phase 2: Point of Entry Screening & Border Health Measures:
- Primary Screening: Thermal imaging scanners and contactless fever screening at international arrival terminals.
- Secondary Screening: Dedicated Port Health Officer (PHO) examination for symptomatic travelers (fever >=38°C, unexplained hemorrhage, severe headache, myalgia, contact history within past 21 days).
- Immediate Isolation: Dedicated negative-pressure isolation facility at airport/seaport; direct ambulance transfer to designated infectious disease hospital via bio-containment transit.

Phase 3: Conference Venue & On-Site Management:
- Syndromic Surveillance: Real-time on-site medical post tracking fevers, acute illnesses, and gastrointestinal symptoms using the Integrated Health Information Platform (IHIP).
- Infection Prevention and Control (IPC): Hand hygiene stations, waste segregation for infectious biohazard waste (incineration / autoclaving), and strict environmental disinfection (0.5% sodium hypochlorite).
- Suspected Case Protocol: Immediate isolation in on-site holding room, blood sampling in specialized biohazard packaging, contact tracing team mobilized to quarantine close contacts for 21 days with twice-daily temperature monitoring.

Phase 4: Post-Event Follow-up & International Reporting:
- IHR Notification: Immediate notification within 24 hours to WHO via the National IHR Focal Point (NCDC) if a confirmed VHF case is detected (mandatory Article 6 notification).
- Exit Screening & Traveler Tracking: 21-day passive post-event monitoring with SMS-based self-reporting for all returning international delegates.

> **EXAM TIP:** Structure as: IHR (2005) mandate -> 4 chronological phases (Pre-event planning, Point of entry screening, Venue IPC/Surveillance, Post-event reporting) -> BSL-4 testing & 24-hr WHO notification via NCDC."""
    
    t = t.replace("[SN]International Classification of Diseases Eleventh Revision (ICD-11)[/SN]", vhf_block + "\n\n[SN]International Classification of Diseases Eleventh Revision (ICD-11)[/SN]")
    
    # Append point-wise REF
    ref = """\n\n[REF]
References:
- Sunder Lal, Adarsh, Pankaj. Public Health Management. CBS Publishers; Chapter 12, International Health Agencies and International Health Regulations.
- Park K. Park's Textbook of Preventive and Social Medicine. 28th ed. Jabalpur: Banarsidas Bhanot; 2025. Chapter 24, International Health.
- World Health Organization, International Health Regulations (IHR 2005, Annex 7 amended 2016).
- World Health Organization, ICD-11 Reference Guide.
[/REF]"""
    return clean_text(t + ref)

# ==============================================================================
# QUALITY AUDIT & RUNNER
# ==============================================================================
BUILDERS = {
    "27-1": build_leaf_27_1,
    "27-2": build_leaf_27_2,
    "27-3": build_leaf_27_3,
    "27-4": build_leaf_27_4,
    "27-5": build_leaf_27_5,
    "27-6": build_leaf_27_6,
    "27-7": build_leaf_27_7,
    "27-8": build_leaf_27_8,
    "27-9": build_leaf_27_9,
    "27-10": build_leaf_27_10,
    "27-11": build_leaf_27_11,
    "27-12": build_leaf_27_12,
}

def verify_leaf(leaf_id, text):
    errors = []
    if "\u2014" in text:
        errors.append(f"Contains Unicode em-dash (\\u2014) in {leaf_id}")
    if " -- " in text:
        errors.append(f"Contains ' -- ' in {leaf_id}")
    if re.search(r'\(?PYQ\s*FOCUS\)?', text, re.IGNORECASE):
        errors.append(f"Contains PYQ FOCUS in {leaf_id}")
    body_no_ref = re.sub(r'\[REF\][\s\S]*?\[/REF\]', '', text, flags=re.IGNORECASE)
    forbidden_park = re.findall(r'\b(?:as per Park|according to Park|Park notes|Park says|Park-aligned|Park\s*\(\d+th\s*ed\)|DEFINITION\s*\(Park\))\b', body_no_ref, re.IGNORECASE)
    if forbidden_park:
        errors.append(f"Textbook name-dropping in {leaf_id}: {forbidden_park}")
    if not re.search(r'\[REF\][\s\S]*?\[/REF\]', text, re.IGNORECASE):
        errors.append(f"Missing [REF] tag in {leaf_id}")
    return errors

def main():
    print("Building and validating all 12 leaves for Chapter 27...")
    all_errors = {}
    built_contents = {}
    for leaf_id, builder in BUILDERS.items():
        content = builder()
        errs = verify_leaf(leaf_id, content)
        if errs:
            all_errors[leaf_id] = errs
        built_contents[leaf_id] = content
        print(f"Leaf {leaf_id}: {len(content)} characters, {len(errs)} errors.")

    if all_errors:
        print("QUALITY VALIDATION FAILED:")
        for lid, errs in all_errors.items():
            for e in errs:
                print(f"  [{lid}] {e}")
        sys.exit(1)

    print("\nAll 12 leaves passed all quality gates successfully!")

    # Update mockData.json
    with open(MOCK_PATH, "r", encoding="utf-8") as f:
        mock_data = json.load(f)

    ch27 = next(c for c in mock_data if str(c.get("id")) == "27")
    for sub in ch27.get("subsections", []):
        sid = str(sub.get("id"))
        if sid in built_contents:
            sub["content"] = built_contents[sid]
            print(f"Updated subsection {sid} in mockData.json ({len(built_contents[sid])} chars)")

    with open(MOCK_PATH, "w", encoding="utf-8") as f:
        json.dump(mock_data, f, indent=2, ensure_ascii=False)

    print("\nSuccessfully wrote updated Chapter 27 to mockData.json!")

if __name__ == "__main__":
    main()
