# -*- coding: utf-8 -*-
"""Append Library chapter 28 (Research Methodology) to mockData.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"


def leaf(id_, title, content, new=True):
    item = {"id": id_, "title": title, "content": content.strip() + "\n"}
    if new:
        item["recentlyUpdated"] = True
    return item


C28_1 = r"""
OVERVIEW OF THE CHAPTER
This leaf introduces health research as a systematic enquiry that converts a practice problem into evidence that can change care or policy. It is written for an MD Community Medicine resident who must both consume published evidence and produce a dissertation. Study designs themselves live in the Epidemiology chapter. Tests of significance live in the Biostatistics chapter. This leaf answers a different question: what counts as research, why it is done, and how a problem is placed in the right domain.

DEFINITIONS
RESEARCH: Systematic collection, analysis, and interpretation of data to answer a specified question or solve a problem. It is planned, empirical, and replicable.
HEALTH RESEARCH: Research whose purpose is to improve health, health care, or health systems. It includes biomedical, clinical, epidemiological, and health systems enquiry.
DISCOVERY: Recognition of a previously unnoticed fact or relationship (often from a prepared observation).
INVENTION: Creation of a product, drug, device, or method that did not exist before.
EVIDENCE-BASED PRACTICE: Clinical and public health decisions guided by the best available research evidence, professional judgment, and the values of the person or community served.

[SN]Health research: definition, purpose, and types[/SN]

[LAQ]Introduction to health research and health systems research[/LAQ]

WHY HEALTH RESEARCH IS DONE
- Add to scientific knowledge that others can use.
- Improve diagnosis, treatment, prevention, and patient care.
- Guide planning, management, and evaluation of health programmes.
- Support policy with local, need-based evidence rather than imported habit.
- Train the resident in scientific thinking. A dissertation is mandatory in postgraduate medical courses for this reason.

A medical professional is always a consumer of research and can become a contributor. Day-to-day practice that is only empirical or only experiential is not enough. Practice becomes evidence-based when a question is framed, a method is written in advance, and findings are open to critique.

DOMAINS OF HEALTH RESEARCH
Classify a study by object of analysis (health problem versus healthcare response) and by level of analysis (individual versus population).

| Domain | Level | Object | Typical question |
|---|---|---|---|
| Biomedical | Individual or sub-individual | Health problem | What cellular or structural process produces this disease? |
| Clinical | Individual | Healthcare response | Does this new treatment work better than standard care? |
| Epidemiological | Population | Health problem | What is the frequency, distribution, and cause of this disease? |
| Health systems | Population | Organised response | Is active case finding more efficient than passive detection in this programme? |

Examples that map cleanly:
- Prevalence of goitre in a district: epidemiological research.
- Efficacy of a new antihypertensive in clinic patients: clinical research.
- Whether two sputum smears are nearly as good as three for tuberculosis diagnosis: health systems or operational research that changed national policy.
- Pathological mechanism of a new infection: biomedical research.

Outcome of good research is not a certificate. It is a possible change in medical practice or health policy.

TYPES OF RESEARCH (PURPOSE AND APPROACH)
By purpose:
1. Basic (fundamental, pure): increases the stock of knowledge. Application may be delayed and is often unpredictable.
2. Applied and developmental: improves practice for patients or communities (operational, health services, health manpower, policy, and economic analysis).
3. Clinical trials and monitoring: tests a product or procedure before or after it reaches routine care.

Organisation for Economic Co-operation and Development (OECD) grouping: pure basic, strategic basic, applied, and experimental development.

Other exam-useful labels (do not treat as mutually exclusive): historical, correlational, causal-comparative, content analysis, quantitative, qualitative, biomedical, behavioural, health service, survey, conceptual, one-time versus longitudinal, field versus laboratory, simulation, and translational research.

HEALTH SYSTEMS RESEARCH: STEPS
Health systems research asks how policy, environment, management, community, families, and direct services can be improved. It is cyclical, not a straight line.

1. Select, analyse, and state the research question (problem, priority, justification).
2. Review available literature and programme data.
3. Formulate general and specific objectives and, when appropriate, a hypothesis.
4. Choose methods: variables, design, techniques, sampling, analysis plan, ethics, and a pre-test or pilot.
5. Write the work plan (who does what, and when).
6. Budget people, materials, and money.
7. Plan administration, monitoring, and how results will be used.
8. Plan presentation and briefing of potential users.

A study that cannot name its user (programme manager, clinician, community, or policy cell) is poorly justified.

CRITERIA OF GOOD RESEARCH
- Clear statement of the problem and purpose.
- Detailed, transparent plan and design.
- Honest recording without distortion of observations.
- Appropriate collection and analysis of the data that the objectives require.
- Systematic, logical, empirical, and replicable.

Common obstacles in Indian institutions: weak training in methods, duplication of studies, poor library access, and thin secretarial or statistical support. Naming these is not an excuse for a weak protocol.

INDIA HOOK
The Indian Council of Medical Research (ICMR) Short Term Studentship introduces undergraduates to protocol writing. Postgraduate dissertations are the first full research cycle for most specialists. National programmes (tuberculosis, HIV, immunization) have changed practice when operational studies were used, not when opinions were collected.

> **EXAM TIP:** Open with a one-line definition of research → 2x2 domain table → types by purpose → 8 health-systems steps → close with “research must be able to change practice or policy.” Do not drift into study-design detail that belongs in Epidemiology.

KEY POINTS
- Research is systematic enquiry, not a collection of interesting cases.
- Domain first, design second.
- Applied health research is justified by a discrepancy between what exists and what is needed, with more than one possible answer.
"""

C28_2 = r"""
OVERVIEW OF THE CHAPTER
This leaf covers the first intellectual work of a protocol: choosing a problem, searching what is already known, and writing questions, objectives, and hypotheses that can actually be studied. Weak objectives are the most common reason an MD dissertation collapses at review.

DEFINITIONS
RESEARCH PROBLEM: A perceived discrepancy between the existing situation and a desired or planned situation, where the reason is unclear and more than one answer is possible.
RESEARCH QUESTION: The problem rewritten as a question the study can answer with data.
OBJECTIVE: An action statement of what the study will do. General objectives state the overall aim. Specific objectives are numbered, single-focus, and measurable.
HYPOTHESIS: A tentative, testable statement of the expected relationship between variables. Not every descriptive study needs a formal hypothesis.
LITERATURE SEARCH: Systematic retrieval of published and grey evidence to map what is known, what is conflicting, and what gap the new study will fill.
PICO: Population, Intervention (or Exposure), Comparison, Outcome. A structure for interventional and many analytical questions.
PEO: Population, Exposure, Outcome. Useful when there is no comparison arm.
SMART: Specific, Measurable, Achievable, Relevant, Time-bound. Applied to objectives.

[SN]FINER criteria[/SN]

[LAQ]Formulation of research questions, objectives, and hypotheses[/LAQ]

FINER CRITERIA
Use FINER to decide whether a problem is worth a protocol.

- F Feasible: enough participants, skills, money, time, and administrative support.
- I Interesting: matters to the investigator and to people who will use the result.
- N Novel: fills a gap. Replication is allowed when the setting, method, or population is new, not when the wheel is reinvented.
- E Ethical: no unjustified harm. Ethics review and consent must be possible.
- R Relevant: priority for the area, programme, or country. Can change practice or policy.

Three conditions that make a situation a research problem:
1. A discrepancy between what exists and what is needed.
2. The reason for the discrepancy is not already settled.
3. More than one plausible answer or solution exists.

Sources of problems: clinic or field experience, programme reviews, published papers, theory, and previous dissertations. Prioritise with Nominal Group Technique (NGT) or a simple scoring grid (relevance, feasibility, novelty, ethics, local burden).

[SN]Literature search in health research[/SN]

LITERATURE SEARCH
Purpose: avoid duplication, refine the question, choose methods, and later write the introduction and discussion.

Sources:
- Bibliographic: PubMed / MEDLINE, IndMED, Google Scholar, Cochrane Library.
- Official: Ministry of Health and Family Welfare (MoHFW), National Health Mission (NHM), ICMR, World Health Organization (WHO), National Family Health Survey (NFHS), Sample Registration System (SRS), Census.
- Local: previous theses, hospital records, programme reports, state health department data.
- Backward search: reference lists of key papers. Forward search: who cited those papers.

Practical sequence:
1. Write 3 to 6 keywords and synonyms (including Indian programme names).
2. Combine with Boolean operators (AND, OR, NOT).
3. Filter by humans, last 10 years, and free full text only after the sensitive search is done (do not let “free PDF” decide relevance).
4. Store citations in a manager (Zotero, Mendeley, or a disciplined Vancouver list).
5. Synthesise by theme or by objective. Do not list papers chronologically with no argument.

A literature review answers three questions that later become the Introduction: Why is this important? What is already known? What gap remains?

RESEARCH QUESTIONS
A good question names the population, the phenomenon, and (when relevant) the comparison and the outcome.

- Descriptive: What is the prevalence of anaemia among antenatal women attending this primary health centre?
- Analytical: Is household solid-fuel use associated with acute respiratory infection in under-five children in this block?
- Interventional (PICO): In adults with uncontrolled hypertension at this clinic (P), does a weekly phone reminder (I), compared with usual care (C), improve control at 12 weeks (O)?

Write the question before the title. The title is a compressed question, not a slogan.

OBJECTIVES
Rules that examiners and ethics committees both use:
- Number them. Keep them few.
- Each objective does one job.
- Start with an action verb: to estimate, to determine, to compare, to explore, to assess.
- The verb signals design. “To estimate prevalence” implies a cross-sectional survey. “To determine association” implies an analytical design. “To explore perceptions” implies qualitative work.
- Specific objectives must be achievable with the planned sample, tools, and time.

Avoid: “to study about”, “to know in detail”, and objectives that secretly contain three studies.

HYPOTHESES
Use when the study will test a relationship.

- Null hypothesis (H0): no difference or no association in the population. This is what statistical tests address.
- Alternative hypothesis (H1): the difference or association the investigator expects. May be one-sided or two-sided.

Characteristics of a usable hypothesis: clear variables, stated direction or two-sided stance, testable with the planned data, and consistent with existing knowledge without being trivial.

Descriptive prevalence surveys and most qualitative studies do not force a hypothesis. Do not invent one to look “more scientific.”

INDIA HOOK
Protocol review boards in medical colleges reject topics that are not feasible in the posting period, that copy last year’s dissertation with a new village name, or that have objectives no sample can answer. FINER is the defence against those three failures.

**Mnemonic:** FINER
- F: Feasible
- I: Interesting
- N: Novel
- E: Ethical
- R: Relevant

> **EXAM TIP:** Define the problem → FINER as a five-row table → PICO or PEO for the question → numbered SMART objectives → null versus alternative only if the design tests a relationship. Close with “objectives decide design, not the reverse.”
"""

C28_3 = r"""
OVERVIEW OF THE CHAPTER
This leaf covers how a research idea becomes measurable. Scales of measurement and types of data are taught in Biostatistics. Here the focus is operational definition, indicators, and threats to validity: the parts a protocol must get right before any test is chosen.

DEFINITIONS
VARIABLE: A characteristic that can take more than one value in the study population (age, sex, haemoglobin, treatment group, knowledge score).
INDEPENDENT VARIABLE: The presumed exposure, intervention, or explanatory factor.
DEPENDENT VARIABLE: The outcome the study is trying to explain or change.
CONFOUNDER: A third variable associated with both exposure and outcome that can distort the apparent relationship if it is not designed or analysed for.
OPERATIONAL DEFINITION: The exact rule used in this study to decide how a variable is measured or how a case is labelled.
INDICATOR: A measurable proxy chosen to represent a concept that cannot be observed directly (for example, exclusive breastfeeding in the last 24 hours as an indicator of infant feeding practice).
VALIDITY: The degree to which a measurement measures what it is intended to measure.
RELIABILITY: The degree to which a measurement gives the same result on repetition under the same conditions (repeatability / reproducibility).
BIAS: A systematic error that distorts the estimate in one direction. It is not the same as random sampling error.

[SN]Variables and operational definitions[/SN]

[LAQ]Measurement, validity, and reliability in health research[/LAQ]

SELECTING AND DEFINING VARIABLES
List every variable the objectives require. Then classify each one:

1. By role: independent, dependent, confounder, effect modifier, or purely descriptive.
2. By nature: qualitative (attribute) or quantitative (measured magnitude).
3. By timing: baseline, exposure window, or endpoint.

Operational definition must state:
- Who is counted (numerator and denominator rules).
- What instrument, cut-off, or code is used.
- When and where the measurement is taken.
- Who takes it and how quality is checked.

Example. “Anaemia in pregnancy” is not operational. “Haemoglobin less than 11 g/dL on a digital haemoglobinometer, third-trimester antenatal clinic, measured by a trained staff nurse after daily quality control” is operational.

Qualitative concepts (stigma, satisfaction, empowerment) need indicators chosen from literature or from formative work. Do not invent a one-item “score” the night before data collection.

VALIDITY (ACCURACY OF THE MEASURE)
Common types used in protocols:
- Face validity: the item looks relevant to experts and participants.
- Content validity: the tool covers the domain (often judged by experts; content validity index may be reported).
- Criterion validity: agreement with a gold standard (concurrent or predictive).
- Construct validity: the tool behaves as the theory predicts (convergent and discriminant).

Internal validity of a study is different: it is whether the observed association is true for the people actually studied (free of major bias and confounding). External validity is whether the result can be generalised to a defined reference population.

RELIABILITY (PRECISION OF THE MEASURE)
- Intra-observer: same person, repeated measure.
- Inter-observer: two trained persons, same subjects.
- Test–retest: same tool after a sensible interval.
- Internal consistency: items in a scale hang together (Cronbach’s alpha is often reported for multi-item scales).

A tool can be reliable and still invalid (a well-calibrated wrong instrument). Validity without some reliability is also unusable.

THREATS AND HOW PROTOCOLS HANDLE THEM
- Selection: who enters the sample. Use a sampling frame, explicit inclusion and exclusion, and a recorded response rate.
- Information: how data are obtained. Use standard tools, training, blinding where possible, and pre-tested questionnaires.
- Confounding: design (restriction, matching, randomisation) and analysis (stratification, multivariable models).
- Loss to follow-up: minimise and report. Plan extra sample for expected drop-out.

Pilot the tool. A 10% pre-test that changes wording is cheaper than a finished thesis whose exposure was misunderstood.

INDIA HOOK
National programme indicators (fully immunised child, treatment success, institutional delivery) already have operational definitions. A dissertation that uses a local private definition cannot be compared with NFHS or programme reports and is hard to defend in viva.

> **EXAM TIP:** Define variable → table of role (independent / dependent / confounder) → operational definition with cut-off and tool → validity versus reliability in two columns → one paragraph on bias-control in the protocol. Do not retell the entire scales-of-measurement lecture.
"""

C28_4 = r"""
OVERVIEW OF THE CHAPTER
This leaf treats sampling and sample size as protocol decisions. Detailed properties of the normal curve and the menu of significance tests are in Biostatistics. Here the resident must be able to name the sampling design, write a justifiable sample-size calculation, and defend both in ethics review and viva.

DEFINITIONS
POPULATION (UNIVERSE): All units to which the investigator wants to generalise.
SAMPLING FRAME: A complete, usable list (or equivalent mapping) of units from which the sample is drawn.
SAMPLE: The units actually studied.
SAMPLING UNIT: The element selected (person, household, village, facility).
REPRESENTATIVENESS: The sample mirrors the population on characteristics that matter for the research question.
PROBABILITY (RANDOM) SAMPLING: Every unit has a known, non-zero chance of selection.
NON-PROBABILITY SAMPLING: Chance of selection is unknown. Useful for qualitative work and some feasibility studies; weak for prevalence that will be generalised.
PRECISION (d or L): How close the estimate should be to the true value. Absolute precision is in the same units as the measure. Relative precision is a fraction of the expected proportion.
POWER (1 − beta): Probability of detecting a true difference of the size the investigator cares about. Commonly set at 80% or 90%.
ALPHA (Type I error): Probability of claiming a difference that does not exist. Commonly 0.05.

[SN]Sample size determination[/SN]

[LAQ]Sampling methods in health research[/LAQ]

WHY SAMPLE SIZE IS AN ETHICAL ISSUE
Too small: the study cannot answer the question, so participants take risk or give time for no scientific gain. Too large: extra cost, delay, and unnecessary burden. Sample size is therefore both a statistical and an ethical requirement.

WHAT THE CALCULATION NEEDS
Write these numbers in the protocol before opening software:
- Expected proportion (p) or mean and standard deviation from literature or a pilot.
- Absolute or relative precision, or the minimum difference worth detecting.
- Alpha (usually 0.05) and whether the test is one-sided or two-sided.
- Power, if the aim is to compare groups (usually 80% or 90%).
- Design effect, if cluster sampling is used (often 1.5 to 2 unless a local estimate exists).
- Expected non-response or drop-out, then inflate n accordingly.

CORE FORMULAE USED IN PROTOCOLS
Single proportion, absolute precision (95% confidence, two-sided):
n = Z squared × p × (1 − p) / d squared
With Z = 1.96 this is often taught as n = 3.84 p q / d squared. The older 4pq / L squared form is the same idea with Z squared rounded to 4.

Worked example. Expected immunisation coverage p = 0.80, absolute precision d = 0.04, 95% confidence:
n = (1.96) squared × 0.80 × 0.20 / (0.04) squared = 384.

Relative precision uses d = e × p in the denominator (e is the relative error as a fraction).

Single mean (when standard error e is specified):
n = s squared / e squared.

Two groups (difference of proportions or means) need the expected values in both groups, alpha, and power. Software (OpenEpi, Epi Info, Statulator) is acceptable if the inputs are listed in the protocol.

Rules of thumb that save viva marks:
- Absolute size of the sample matters more than the sampling fraction.
- Rare outcomes and tight precision inflate n quickly.
- Cluster samples need a design effect. Ignoring it underestimates n.
- Qualitative samples are not powered the same way. They use saturation and diversity, not 4pq / L squared.

TYPES OF SAMPLING
Probability methods (preferred for quantitative estimates that will be generalised):
1. Simple random: every unit equal chance. Lottery or computer random numbers from a numbered frame. Best for small, homogeneous populations.
2. Systematic random: every k-th unit after a random start, k = N / n. Fast. Dangerous if the list has a hidden period (for example every 7th day is a market day).
3. Stratified random: divide into strata (urban/rural, sex, caste block) then sample within each. Improves precision and guarantees small groups appear.
4. Cluster and multistage: villages or wards are sampled first, then households or persons. Practical for community surveys. Analyse with the clustering in mind.
5. Probability proportional to size (PPS): larger clusters get higher chance of selection. Common in coverage surveys.

Non-probability methods:
- Convenience: whoever is easy to reach. Fast, biased.
- Purposive / judgment: units chosen for information richness. Standard in qualitative work.
- Quota: fill cells that look like the population (or a minimum per cell) without random selection.
- Snowball: participants recruit peers. Used for hidden or stigmatised groups.
- Consecutive: every eligible person in a time window. Common in hospital studies; generalises only to similar facilities and seasons.

BIAS IN SAMPLING
Sampling error shrinks as n grows (if selection is random). Non-sampling error (wrong frame, non-response, poor instruments) does not automatically shrink with n and is often larger. Report the frame, the method, the response rate, and how refusals were handled.

INDIA HOOK
Community Medicine dissertations often sample “one PHC area” or “patients attending OPD.” Name the frame (family folders, line list, OPD register), the unit, and the limitation. Do not call an OPD consecutive sample a simple random sample of the district.

> **EXAM TIP:** Define sample and frame → probability versus non-probability table → one worked 4pq or Z squared pq / d squared example → list what you would write in the protocol (p, d, alpha, power, design effect, non-response). End with “wrong n is an ethical failure, not only a statistical one.”
"""

C28_5 = r"""
OVERVIEW OF THE CHAPTER
Qualitative research answers how and why questions that counts cannot close: meaning, process, stigma, and the gap between policy and practice. MD Community Medicine examinations and dissertations increasingly expect a resident to know when to use it, which tool to pick, and how to analyse talk without turning it into fake percentages.

DEFINITIONS
QUALITATIVE RESEARCH: Enquiry that uses words, observations, and artefacts to understand meanings, experiences, and social processes in context. Sampling is purposeful. Analysis is thematic or narrative, not a p-value.
FOCUS GROUP DISCUSSION (FGD): A moderated discussion with a small, relatively homogeneous group (commonly 6 to 10 people) to map shared norms and differences.
IN-DEPTH INTERVIEW (IDI): A one-to-one, lightly structured conversation that follows the participant’s experience with probes.
KEY INFORMANT INTERVIEW (KII): Interview with a person who has special knowledge of the system (medical officer, Accredited Social Health Activist (ASHA), teacher, dai).
PARTICIPATORY RURAL APPRAISAL (PRA): A family of methods in which community members produce maps, rankings, and calendars; the outsider facilitates rather than extracts.
SATURATION: The point at which new interviews or groups add no materially new codes or themes.
TRIANGULATION: Using more than one method, source, or analyst to strengthen credibility.
MIXED METHODS: A planned combination of qualitative and quantitative strands in one study (sequential or concurrent).

[SN]Focus group discussion[/SN]

[LAQ]Qualitative research methods in community medicine[/LAQ]

WHEN QUALITATIVE METHODS ARE THE RIGHT TOOL
- The problem is poorly understood and categories do not yet exist.
- The question is about meaning, stigma, power, or process (“why do diagnosed patients not reach the antiretroviral therapy centre?”).
- Programme managers need to know how a guideline is actually used.
- Quantitative results are surprising and need explanation.

They are the wrong sole tool when the aim is a generalisable prevalence or an effect size. Mixed methods are then stronger than forcing one paradigm.

QUALITATIVE METHODS
Focus group discussion
- 6 to 10 participants who share a relevant trait (mothers of under-fives, newly diagnosed tuberculosis patients).
- Trained moderator plus note-taker. Topic guide, not a questionnaire.
- 60 to 90 minutes. Record with consent. Transcribe in the language of the discussion, then translate carefully.
- Strengths: group norms, language people actually use, efficient. Limits: dominant voices, poor for very sensitive individual disclosure, not a vote.

In-depth interview
- One person, private setting, probes, silence allowed.
- Best for illness experience, adherence, domestic decision-making.
- Sample for diversity (age, sex, caste, outcome), not for a percentage.

Key informant interview
- Chooses position, not representativeness.
- Good for how registers are filled, how referral actually works, where supplies stall.

Observation
- Structured (checklist) or unstructured field notes.
- Records practice (hand hygiene, counselling, waiting time), which talk often sanitises.

Participatory methods
- Social mapping, wealth ranking, seasonal calendars, transect walks, problem ranking.
- Power shifts toward the community. Needs time and skilled facilitation.

Document review
- Minutes, stock registers, referral slips, media. Cheap triangulation.

HOW TO DO QUALITATIVE RESEARCH (MINIMUM PROTOCOL)
1. State the qualitative question (explore, describe, understand).
2. Choose tradition lightly (thematic description is enough for most MD work; do not claim grounded theory unless you will do it).
3. Sample purposefully until saturation, and say how you will judge it.
4. Write guides. Pilot them.
5. Plan recording, translation, anonymisation, and storage.
6. Analyse: familiarisation → codes → categories → themes → deviant cases. Software (NVivo, Atlas.ti, or even a disciplined spreadsheet) is a filing system, not the analysis.
7. Report with verbatim quotes tagged by type of participant, not by name. Do not convert themes into “63% of FGDs said…”.

Trustworthiness (Lincoln and Guba language often expected in viva): credibility (member check, triangulation), transferability (thick description of setting), dependability (audit trail), confirmability (reflexivity: the researcher’s stance is declared).

INDIA HOOK
National programmes fail as often on process as on commodity. Qualitative work on why ASHAs do not use a new register, or why families refuse a vaccine, is legitimate Community Medicine research. Ethics still apply: consent, confidentiality, and care with quotes that could identify a small village.

> **EXAM TIP:** Define qualitative research → when to use versus when not → table of FGD / IDI / KII / PRA / observation → steps of analysis and saturation → one India programme example. Do not invent percentages from talk.
"""

C28_6 = r"""
OVERVIEW OF THE CHAPTER
This leaf covers how data are obtained, checked, entered, and stored. A brilliant question with a leading questionnaire or a messy spreadsheet still produces an undefendable thesis. Computers in epidemiology (NMC competency CM7.9) sit here as tools, not as a separate subject.

DEFINITIONS
PRIMARY DATA: Collected by the investigator for this study (interview, examination, observation, measurement).
SECONDARY DATA: Already exist (registers, NFHS, HMIS, published papers). Cheaper, faster, and limited by someone else’s definitions.
QUESTIONNAIRE: A structured set of items the participant or interviewer completes. May be interviewer-administered or self-administered.
SCHEDULE: A structured form filled by a trained investigator during an interview (classical distinction still asked in some vivas).
INTERVIEW GUIDE: A flexible list of topics for qualitative interviews, not a fixed wording script.
PRE-TEST / PILOT: A small run of tools and procedures to find ambiguity, timing, and logistics before the main study.
DOUBLE DATA ENTRY: Two independent entries of the same forms, then validation of mismatches.
EPIDATA / EPI INFO: Free packages widely used in public health for questionnaire design, entry with checks, and basic analysis.

[SN]Questionnaire design[/SN]

[LAQ]Data collection methods and data management in health research[/LAQ]

DATA COLLECTION METHODS
Three families:
1. Experiencing: observation and field notes (what people do).
2. Enquiry: interviews, questionnaires, focus groups (what people say).
3. Examining: records, measurements, laboratory or clinical tests (what can be documented).

Choose the method that matches the variable, not the method the resident already likes.

QUESTIONNAIRE AND INSTRUMENT DESIGN
Good items:
- One idea per question.
- Language of the participant, not of the textbook.
- Closed items when categories are known; open items when they are not.
- Validated scales when they exist (and permission / citation recorded).
- Logical flow: consent and eligibility → socio-demography → exposures → outcomes → sensitive items later.

Avoid:
- Leading and double-barrelled questions.
- Technical jargon and double negatives.
- Options that do not exhaust the possibilities (always offer “other, specify” when needed).
- Asking two time frames in one item.

Translate with forward translation, expert review, and back-translation for any tool that will be compared with an English original. Pre-test on people like the participants, not on batchmates only.

Interview skills: introduce the study, confirm voluntariness, keep neutral probes, do not teach during the interview, thank and close. Record start and end time.

BIAS IN COLLECTION
- Interviewer bias: tone, prompting, skipping items. Train, supervise, and (where feasible) blind.
- Social desirability: especially sexual behaviour, alcohol, vaccine refusal. Private setting, normalised wording, self-administration when literacy allows.
- Recall bias: shorter recall windows, calendars, records.
- Hawthorne effect: people change when watched. Longer observation or unobtrusive measures.

DATA MANAGEMENT
Plan before the first form is filled:
- Unique ID. Never use name as the analysis key.
- Codebook: variable name, type, allowed values, missing codes.
- Paper path: receipt, completeness check, lockable storage.
- Electronic path: EpiData or equivalent with legal ranges, skip patterns, and must-enter fields. Microsoft Excel alone is a weak primary database because it allows silent type errors.
- Double entry or at least a 10% re-entry check.
- Backup (encrypted) off the single laptop.
- Analysis file separate from the identifiable master. Identifiers stay with the principal investigator.

COMPUTERS IN HEALTH RESEARCH (CM7.9)
Protocol stage: PubMed and Google Scholar for literature; Epi Info or Statulator for sample size; reference managers for Vancouver lists.
Field: EpiCollect or similar for electronic capture when connectivity and ethics approval allow.
Management: EpiData for checked entry; Excel for simple tables and graphs.
Analysis: Epi Info, OpenEpi, and licensed packages (SPSS, Stata, R) as available. Name the package and the tests in the protocol.
Dissemination: journal submission systems and slide software for conferences.

INDIA HOOK
District and medical-college studies still lose months to unsigned forms, unnamed Excel columns, and lost pendrives. Ethics committees now ask about data security as well as consent. Write both.

> **EXAM TIP:** Split the answer into collection methods → questionnaire rules (do / do not) → quality control and double entry → named free software (PubMed, Epi Info, EpiData, OpenEpi). Mention CM7.9 computers in epidemiology in one short closing line.
"""

C28_7 = r"""
OVERVIEW OF THE CHAPTER
Ethics is not an annexure stapled after the sample size. It is a condition for doing the study at all. Indian biomedical and health research involving human participants is governed by the Indian Council of Medical Research (ICMR) National Ethical Guidelines for Biomedical and Health Research Involving Human Participants, 2017. Clinical trials of new drugs and related products also follow the New Drugs and Clinical Trials (NDCT) Rules, 2019, and register on the Clinical Trials Registry - India (CTRI).

DEFINITIONS
RESEARCH ETHICS: Principles and procedures that protect participants, communities, and scientific integrity while knowledge is generated.
INFORMED CONSENT: A process (not a signature) in which a competent person, after adequate information and comprehension, voluntarily agrees to take part.
ETHICS COMMITTEE (EC): An independent multidisciplinary body that reviews the scientific and ethical merit of a protocol before enrolment. Also called Institutional Ethics Committee (IEC) or Institutional Review Board (IRB) in many colleges.
VULNERABILITY: Reduced ability to protect one’s own interests because of limited capacity, power, or resources (children, prisoners, institutionalised persons, very poor communities, subordinates in a hierarchy, some tribal populations, and others listed in the 2017 guidelines).
ASSENT: Affirmative agreement of a child who is capable of some understanding, in addition to permission from a parent or legally acceptable representative (LAR).
BENEFIT–RISK ASSESSMENT: Judging whether anticipated benefits to participants or society justify the risks.

[SN]Informed consent[/SN]

[LAQ]Ethics in health research and the ethics committee[/LAQ]

HISTORICAL ANCHORS (KEEP SHORT IN THE EXAM)
- Nuremberg Code (1947): voluntary consent after the wartime experiments.
- Declaration of Helsinki: World Medical Association (WMA), first adopted 1964 and periodically revised (latest WMA revision 2024). Physician-researchers’ duties to the participant.
- Belmont Report (1979): respect for persons, beneficence, justice.
- Indian line: ICMR policy statement 1980, ethical guidelines 2000 and 2006, then the expanded 2017 national guidelines (released 12 October 2017). Children have a dedicated 2017 ICMR guideline. Addenda exist for systematic reviews (2024) and other special topics; the 2017 document remains the core national reference for human-participant health research.

TWELVE GENERAL PRINCIPLES (ICMR 2017)
The 2017 guidelines start from four basic principles (autonomy, beneficence, non-maleficence, and justice) and expand them into 12 general principles:

1. Essentiality (human participants only when necessary; EC must agree)
2. Voluntariness (right to agree, refuse, or withdraw; protected by informed consent)
3. Non-exploitation (fair selection of participants; extra safeguards for vulnerable groups)
4. Social responsibility (do not deepen social divisions or disturb community harmony)
5. Ensuring privacy and confidentiality (identity and records restricted to authorised persons; limited, EC-guided exceptions)
6. Risk minimization (all stakeholders reduce risk and arrange care and compensation if harm occurs)
7. Professional competence (qualified, trained people plan, conduct, and monitor the work)
8. Maximization of benefit (design the study so participants or society can gain)
9. Institutional arrangements (host institution provides governance, staff, funds, and training)
10. Transparency and accountability (registries, reports, publications; declare and manage conflicts of interest; retain records)
11. Totality of responsibility (every stakeholder is bound by ethics and law)
12. Environmental protection (protect environment and resources at every stage)

INFORMED CONSENT
Three pillars: information, comprehension, voluntariness. Then documentation.

Essential information (Section 5 of the 2017 guidelines): purpose and methods; duration; procedures; foreseeable risks and discomforts; reasonably expected benefits; alternatives; confidentiality and its limits; compensation and treatment for research-related harm; freedom to refuse or withdraw without loss of entitled care; whom to contact; and any payment or reimbursement.

Process points high-yield for viva:
- Language the participant understands. Leave time for questions.
- High-risk work may need a test of understanding.
- Written consent is the default. Illiterate participants: thumb impression with an impartial witness.
- Children: parental/LAR permission plus assent when the child can understand.
- Electronic consent is permitted when the EC has approved the method.
- Waiver of consent is exceptional (for example some retrospective record reviews with de-identified data) and must be granted by the EC, not assumed by the student.
- Re-consent when the protocol or risk changes materially.
- Community or gatekeeper permission does not replace individual consent.

Privacy and confidentiality: unique codes, locked forms, restricted access, no identifiable photographs without separate permission, careful quotes in qualitative work.

Compensation for research-related injury is a duty in interventional work under Indian rules. Payment for time and travel is reimbursement, not a purchase of risk.

ETHICS COMMITTEE
Roles: scientific review, ethical review, continuing review, and (when needed) site monitoring. Review happens before the first participant is approached.

Composition (2017 guidance, exam skeleton):
- Minimum seven members.
- Chairperson from outside the host institution.
- Member Secretary from the institution.
- Mix: basic medical scientist, clinicians, legal expert, social scientist / philosopher / ethicist / theologian, and a lay person.
- Gender balance and absence of conflict of interest for a given protocol.

Submission: protocol, participant information sheet, consent forms in local language, tools, curriculum vitae of investigators, CTRI number when applicable, insurance or compensation plan for trials, and any material used to recruit.

Review paths: full committee for more than minimal risk; expedited or exemption only as the EC’s standard operating procedure allows. Multicentre work may use single-review mechanisms now being operationalised nationally; the local site still remains accountable for local context.

Clinical trials: NDCT Rules, 2019; CTRI registration before enrolment; Good Clinical Practice. Academic dissertations that are observational still need EC approval in Indian medical colleges.

VULNERABLE GROUPS
Extra justification, extra safeguards, no convenient sampling of subordinates (students, employees, prisoners) merely because they are easy to reach. Tribal research requires additional community-level processes. Pregnant women, neonates, and mentally ill persons have specific additional rules in the 2017 text.

PUBLIC HEALTH RESEARCH
Cluster trials, use of HMIS, and emergency research have dedicated sections. Waiver or altered consent may be argued for some public health evaluations, but only with EC approval and community engagement.

INDIA HOOK
A Community Medicine dissertation that interviews village women without a local-language information sheet, or that treats the medical superintendent’s permission as consent, fails ethics even if the statistics are perfect.

**Mnemonic:** ICE for the consent process
- I: Information
- C: Comprehension
- E: (voluntary) Enrolment / agreement
(Use FINER’s E and this ICE together: problem selection is ethical, and so is each enrolment.)

> **EXAM TIP:** Name ICMR 2017 as the national document → four basic principles then the 12 general principles → consent process (information, comprehension, voluntariness, documentation) → EC composition (7 members, external chair) → NDCT 2019 and CTRI only if the question is a trial. Do not recite Nuremberg for two pages.
"""

C28_8 = r"""
OVERVIEW OF THE CHAPTER
This leaf is the writing half of research methodology: protocol, dissertation, journal article, and critical appraisal. Practical chapter “Project Conduction and Presentation” shows field steps and slides. This leaf is the theory the examiner expects on paper: headings, logic, and how to read someone else’s paper without being fooled.

DEFINITIONS
PROTOCOL (RESEARCH PROPOSAL): The plan written before data collection. It is the contract with the guide, the ethics committee, and (if funded) the sponsor.
THESIS / DISSERTATION: The examined report of work the resident actually did. In Indian MD courses it is a mandatory academic product.
IMRAD: Introduction, Methods, Results, And Discussion. The standard skeleton of an original paper and of most dissertations.
VANCOUVER STYLE: Citation method of the International Committee of Medical Journal Editors (ICMJE): references numbered in order of appearance, journal titles abbreviated as in MEDLINE.
CRITICAL APPRAISAL: Structured judgment of whether a paper’s methods support its conclusions, and whether those conclusions apply to your patients or population.
PREDATORY JOURNAL: A publication that charges authors while skipping genuine peer review. Avoid for both reading and submitting.

[SN]IMRAD format[/SN]

[LAQ]Steps in writing a research protocol and thesis[/LAQ]

WRITING A RESEARCH PROPOSAL
Typical contents (adapt to the college template):
1. Title (population, place, and design when space allows).
2. Introduction and rationale (importance, what is known, gap, local need).
3. Research question and numbered objectives (and hypothesis if used).
4. Review of literature (thematic, not a dump).
5. Methods: design, setting, duration, population, inclusion and exclusion, sample size with formula and inputs, sampling, variables and operational definitions, tools, procedures, analysis plan, quality assurance, ethics.
6. Work plan (Gantt chart: months versus activities).
7. Budget and justification.
8. Plan for use of results (who will hear them).
9. References (Vancouver).
10. Annexes: tools, consent forms, EC undertaking, CTRI receipt if a trial.

A protocol is written in future tense. A thesis methods chapter is written in past tense. Do not copy-paste one into the other without changing the tense and the actual numbers achieved.

[SN]Critical appraisal of a journal article[/SN]

IMRAD FORMAT
Introduction
Why this problem matters; what is known; what is unknown; how this study will fill the gap. Ends with objectives. Keep it short.

Methods
Enough detail that a colleague could repeat the study: design, setting, duration, population, sample size, sampling, inclusion and exclusion, tools, procedure, outcomes, analysis, quality control, ethics approval and consent. Reporting guidelines help completeness: CONsolidated Standards Of Reporting Trials (CONSORT) for trials, Strengthening the Reporting of Observational Studies in Epidemiology (STROBE) for observational studies, Preferred Reporting Items for Systematic Reviews and Meta-Analyses (PRISMA) for reviews, Consolidated criteria for reporting qualitative research (COREQ) for interviews and focus groups. Name the guideline; do not pretend a student project is a CONSORT trial if it is not.

Results
What was found, in the order of the objectives. Start with the flow of participants and baseline table. Give numbers with percentages. Put titles above tables and legends below figures. Do not interpret here. Do not repeat every cell in prose.

Discussion
Summary of key findings; comparison with other studies; possible explanations; strengths; limitations; implications for practice or policy; conclusion that answers the objectives (not a new claim). Recommendations must grow from the data.

References
Vancouver. Every in-text number has a list entry. Prefer primary papers and official reports over coaching notes.

STEPS IN THESIS WRITING
Anatomy expected by most Indian universities:
- Certificates, declaration, acknowledgements
- Contents, list of tables and figures, abbreviations
- Introduction
- Review of literature
- Aims and objectives
- Material and methods
- Results
- Discussion
- Summary and conclusion
- Recommendations
- References
- Annexures (tool, consent, EC letter, master chart excerpt)

Practical tips that save months:
- Write methods while the study runs, not after memory fades.
- Lock the analysis plan before looking at p-values that were not pre-specified.
- Keep a dated file of protocol amendments.
- Guide and statistician see tables before the discussion is drafted.

HOW TO WRITE AN ARTICLE
Convert the thesis; do not shrink-font the whole book into one file.
- Follow the target journal’s instructions to authors and word limits.
- Title, structured abstract, keywords from MeSH when possible.
- Cover letter that states what is new and that the work is not under duplicate review.
- Authorship follows ICMJE four criteria (substantial contribution; drafting or critical revision; final approval; accountability). Gift authorship is misconduct.
- ICMR Policy on Research Integrity and Publication Ethics (RIPE), 2019, is the Indian institutional reference for plagiarism, fabrication, and authorship disputes.

CRITICAL APPRAISAL
Need: publication is not proof. Method decides belief.

A usable one-page method for a resident:
1. What was the question? Is it clear and important?
2. What was the design? Is it able to answer that question?
3. Who was studied? Inclusion, sampling, response, generalisability to your setting.
4. How were exposure and outcome measured? Bias? Blinding?
5. How was confounding handled?
6. What are the results (effect size and confidence interval, not only p)?
7. Are the conclusions aligned with the data, or larger than the data?
8. Conflict of interest and funding.
9. Would this change your practice or your programme?

Use design-specific checklists (CASP, CONSORT, STROBE) as memory aids. In the examination, a structured paragraph beats a vague “the study is good.”

INDIA HOOK
University theses fail more often on muddled objectives, missing EC letters, and Vancouver chaos than on “not enough fancy statistics.” Journals fail residents who submit a 40-page methods dump to a 2,500-word original article slot. Write to the form.

**Mnemonic:** IMRAD
- I: Introduction (why)
- M: Methods (how)
- R: Results (what)
- D: Discussion (so what)

> **EXAM TIP:** For protocol/thesis LAQ: title → rationale → objectives → methods headings (include ethics and sample size) → Gantt and budget in one line each → IMRAD for the report. For critical appraisal SN: question → design fit → bias/confounding → results versus conclusion. Draw IMRAD as four boxes if the paper allows a figure.
"""


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    if any(str(ch.get("id")) == "28" for ch in data):
        data = [ch for ch in data if str(ch.get("id")) != "28"]

    chapter = {
        "id": "28",
        "title": "Research Methodology",
        "description": "MD health-research methods: questions, sampling, qualitative work, ethics, protocol and scientific writing. Distinct from biostatistics and from epidemiological study designs.",
        "recentlyUpdated": True,
        "subsections": [
            leaf("28-1", "Introduction to Health Research", C28_1),
            leaf("28-2", "Literature Search, Research Questions, Objectives, and Hypotheses", C28_2),
            leaf("28-3", "Variables, Measurement, and Validity", C28_3),
            leaf("28-4", "Sample Size and Sampling in Research", C28_4),
            leaf("28-5", "Qualitative Research", C28_5),
            leaf("28-6", "Data Collection Tools and Data Management", C28_6),
            leaf("28-7", "Ethics in Health Research", C28_7),
            leaf("28-8", "Protocol, Thesis, Paper, and Critical Appraisal", C28_8),
        ],
    }
    data.append(chapter)
    MOCK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("appended chapter 28 with", len(chapter["subsections"]), "leaves")


if __name__ == "__main__":
    main()
