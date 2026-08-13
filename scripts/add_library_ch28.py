# -*- coding: utf-8 -*-
"""Write Library chapter 28 (Research Methodology) into mockData.json."""
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
Research is an integral part of academic work, innovation, and the development of health services. A good deal of research is already done in medical colleges and programme offices, yet much of it is not need-based and does not reach the expected standard of scientific method. The work ought to be directed towards major public health problems.

What is research? Why is it done? How is it done? What makes it good? These are the questions this chapter answers. Study designs are dealt with under Epidemiology, and tests of significance under Biostatistics. The concern here is the nature of enquiry itself.

A clinical story makes the point. A medical officer at an antiretroviral therapy (ART) centre notices that many patients diagnosed with human immunodeficiency virus (HIV) at primary health centres never report for treatment. He wonders whether weekly telephone reminders might help. With a colleague he compares two districts: one in which counsellors give reminders, and one in which they do not. After six months, registration within one month of diagnosis is 90 percent in the intervention district and 70 percent in the comparison district. The State AIDS Control Society then takes telephone reminders into routine service. The officer did not merely have an idea. He pursued the idea with a method, and the method produced evidence that could change policy.

The journey of medical practice has been described as three Es: empirical practice (trial and error), experience-based practice (what seemed to work for previous patients), and evidence-based practice (what has been tested by a planned study). A surgeon who invents a new technique converts experience into evidence only when the technique is put through a scientifically planned investigation.

DEFINITIONS
Dictionary: a careful investigation or enquiry, especially through searching for new facts in any branch of knowledge.

Organisation for Economic Co-operation and Development (OECD): creative work undertaken on a systematic basis in order to increase the stock of knowledge, including knowledge of humanity, culture and society, and the use of that stock of knowledge to devise new applications.

FN Kerlinger: a systematic, controlled, empirical and critical investigation of hypothetical propositions about the presumed relations among natural phenomena.

Theobald Smith: a fundamental state of mind involving continual re-examination of the doctrines and axioms upon which current thought and action are based. It is therefore critical of existing practice.

Redman and Mory: systematised efforts to gain new knowledge.

Clifford Woody: defining and redefining problems, formulating hypotheses or suggesting solutions, collecting, organising and evaluating data, making deductions, and carefully testing the conclusions.

In brief: research is the systematic collection, analysis and interpretation of data to answer a certain question or solve a problem. It is characterised by originality, by investigation as a primary objective, and by the potential to produce results that are sufficiently general to add to the stock of knowledge, theoretical or practical.

Discovery is seeing what everybody has seen and thinking what nobody has thought. James Austin distinguished four varieties of chance in discovery: blind luck (Chance I); an investigator who already believes an idea and acts to prove it (Chance II: Ehrlich and Salvarsan, Epstein and Barr); chance that favours a prepared mind (Chance III: Fleming's penicillin, made usable by Florey and Chain); and chance that comes from persistence plus lateral thinking (Chance IV). Invention is different. It is the creation of a material thing (a drug, a gadget, a machine) that did not exist before.

[SN]Health research: definition, purpose and types[/SN]

[LAQ]Introduction to health research and health systems research[/LAQ]

CHARACTERISTICS OF RESEARCH
A scientific enquiry demands a clear statement of the problem. It seeks relationships, including those of cause and effect. It helps in generating principles and theories that allow prediction. It rests on observational, experimental or empirical evidence. It requires deep knowledge of the subject. It should be objective and logical, carefully recorded and reported, and carried out with patience rather than hurry. The investigator is expected to keep personal preference out of the record of what was observed.

WHY RESEARCH IS DONE
People take up research for many private reasons: curiosity, service, career, prestige, or the pressure to publish. The legitimate objectives, however, are public.

Research is done to add to scientific knowledge; to improve medical and health practice; to benefit patients and the community; to study a new phenomenon and establish the facts; to help in planning health programmes; to support the managerial side of health development; to improve diagnostic methods; and to help in effective patient care. It also inculcates inductive thinking and the habit of organising thought logically.

A medical professional is always a consumer of research and may become a contributor. Each encounter with a patient teaches something, but those lessons become usable by others only when they are converted into evidence. That is why a dissertation is mandatory in postgraduate medical courses. It is the first full exposure of a specialist to the research process. The Indian Council of Medical Research (ICMR) Short Term Studentship introduces the same discipline even earlier, at undergraduate level.

As consumers, doctors depend on published work for everyday decisions (which test, which drug, which public health measure). They should not accept what is printed at face value. Learning methodology is also learning how to read a paper.

DOMAINS OF HEALTH RESEARCH
The scope of health research is usefully seen as a grid. One axis is the object of analysis: the health problem itself, or the organised response to it. The other axis is the level of analysis: the individual (or sub-individual), or the population.

Biomedical research describes biological processes, body structure and function, and pathological mechanisms in individuals. Epidemiological research describes frequency, distribution and causes of disease in populations (for example, the prevalence of goitre in a district). Clinical research concerns the natural history of disease and the efficacy of preventive, diagnostic or therapeutic interventions in individuals. Health systems research studies the organised response at population level: policy research and operational research. An example is whether active case finding by home visits is more economical than passive case finding at clinics for tuberculosis under the National Tuberculosis Elimination Programme (NTEP).

Whatever the domain, the intended outcome is a possible change in medical practice or in health policy. Evidence that two sputum smears were nearly as informative as three changed national tuberculosis policy. Evidence that a new antihypertensive lowers blood pressure changes prescribing. Research that cannot name a user (a clinician, a programme manager, a community, a policy cell) is poorly justified.

TYPES OF RESEARCH
Types depend on purpose, approach, nature and setting.

Weatherall (1981) used three large headings.

I. Basic, fundamental or pure research. It has been the source of most major medical advances. It is often unpredictable. There may be no initial connection between the work and a later medical use. It needs trained investigators, long time and large funds. Few people stay in this field because the career is uncertain and the training of undergraduates and postgraduates has become increasingly rigid.

II. Applied research and development. The aim is to improve practice and to benefit patients and communities. Linkages are needed between colleges, centres that develop new procedures, and the people who will use them. The team should include scientifically trained workers as well as clinicians. Applied work includes operational research, health services research, health manpower studies, policy analysis and economic analysis.

III. Clinical trials and monitoring. These are done as a product or procedure approaches clinical use. Commercial sponsors often have a large stake in seeing the product used, sometimes before its value is beyond doubt.

The OECD grouping is close: pure basic, strategic basic, applied, and experimental development.

Other categories, not mutually exclusive, are historical, correlational, causal-comparative, content analysis, quantitative (inferential and experimental), qualitative (including opinion and attitude work by participatory rural appraisal), biomedical, behavioural, health service, survey, conceptual (concerned with an abstract idea or theory), one-time versus longitudinal, field versus laboratory, simulation, and translational.

HOW TO DO RESEARCH: STEPS IN HEALTH SYSTEMS RESEARCH
Development of a health systems study is cyclical. The arrows run both ways. The usual questions, and the steps that answer them, are these.

What are the problems, and why study them? Select, analyse and state the research question: identify the problem, set priority, and write the justification.

What information is already available? Review the literature and other existing information.

Why is the study wanted, and what is hoped for? Formulate general and specific objectives, and a hypothesis where the design requires one.

What additional data are needed, and how will they be collected? Write the methodology: variables, type of study, techniques, sampling, plan for collection, processing and analysis, ethical considerations, and a pre-test or pilot.

Who will do what, and when? Prepare the work plan (people and time).

What resources are needed, and what is already in hand? Prepare the budget (material, equipment, money).

How will the project be administered, and how will use of the results be ensured? Plan administration, monitoring, and identification of potential users.

How will findings be presented? Write a project summary and plan briefing sessions.

Major areas of health systems research include policy (the place of health in the national plan, priority needs, equity, culture), the environment (living conditions, water, sanitation, waste, natural resources), administration and management, the community, individuals and families, and direct services (appropriateness, effectiveness, efficiency, accessibility, acceptability). The work is multidisciplinary.

CRITERIA OF GOOD RESEARCH, AND COMMON DIFFICULTIES
A good study has a clear purpose, a plan described in enough detail to be followed, an honest investigator who reports observations without distortion, data collected as required and analysed appropriately, and a method that is systematic, logical, empirical and replicable.

Problems commonly met by researchers include lack of scientific training in methods, poor interaction between research institutions and service organisations, duplication of studies, the absence of an agreed code of conduct, inadequate secretarial help, poorly managed libraries, and lack of infrastructure. Naming these difficulties is not an excuse for a weak protocol.

CONCLUSION
Research in medicine is scientific enquiry. It begins with a problem in practice or in a programme, is placed in a domain, and is carried through a cycle of questions, methods, resources and use of results. Its justification is a possible change in practice or policy, and a reader who can also judge the evidence of others.

> **EXAM TIP:** Begin with a short definition (Kerlinger or the brief working definition) → distinguish discovery from invention if asked → Weatherall types with one example each → the 2 by 2 domains grid → the health-systems cycle as questions and steps. Close on change of practice or policy. Leave designs and p-values to the other chapters.
"""


C28_2 = r"""
OVERVIEW OF THE CHAPTER
The first step, and one of the most difficult, is to state the problem clearly. A research question is the starting point of the whole project. It is the roadmap. The protocol is written only after the question has been finalised. Garbage in, garbage out: if this step is wrong, nothing that follows will save the study.

Ideas come from clinical practice, teaching, meetings, journals, newspapers, talk with colleagues, and new technologies. The first idea is usually too broad. An investigator who is “interested in the rising trend of heart disease in India” has a topic, not a question. A domain must be chosen (screening, treatment, or prognosis), the literature must be searched for what is already known, and a guide or colleague must help to make the curiosity focused and relevant.

DEFINITIONS
RESEARCH PROBLEM: A situation in which there is a perceived discrepancy between what exists and what is planned or ideal, the reason for the discrepancy is unclear, and more than one answer is possible.
RESEARCH QUESTION: The problem rewritten interrogatively, naming the population and the variable or variables of interest.
GENERAL OBJECTIVE: The essence of the study in declarative form, giving the overall direction of enquiry.
SPECIFIC OBJECTIVES: The general objective broken into smaller, logically connected parts. They say what, where, and for what purpose.
HYPOTHESIS: A tentative proposition, a specific version of the research question that names sample, predictor and outcome in a form that can be tested. Medawar described scientific reasoning as a dialogue between the imaginative voice (what might be true) and the critical voice (what is fact).
LITERATURE SEARCH: Systematic retrieval of what is already known, so that the new study is not a repetition and so that methods can be chosen with open eyes.

[SN]FINER criteria[/SN]

[LAQ]Formulation of research questions, objectives and hypotheses[/LAQ]

IDENTIFICATION AND PRIORITISATION OF THE PROBLEM
Whether a situation requires research depends on three conditions. There should be a discrepancy between what exists and the ideal or planned situation. The reason for that discrepancy should be unclear (otherwise there is nothing to ask). There should be more than one possible answer or solution.

Sources are numerous: personal experience, literature, existing theory, and previous studies. The selected problem should, ultimately, be directed towards the health of a population, that is, towards one or more determinants of health.

FINER CRITERIA
A useful question satisfies five tests.

Feasible. Can an adequate number of subjects be found? Is the expertise available? Is the work affordable and administratively possible? Will support be given?

Interesting. The area should interest the investigator, colleagues working in the field, health managers, and, if funds are sought, the funding agency.

Novel. It should fill a gap or solve a problem in a new way. The aim is not to reinvent the wheel. Replication in a new setting or with a better method is another matter.

Ethical. In applied work, human beings are usually involved. Ethical policy must be observed. A study that would do unjustified harm is not to be done, however neat the question.

Relevant. The problem should be a priority for the area, the region or the country, so that the findings can be used.

Three broad kinds of question follow from the type of information sought. Some studies describe a health situation so that an intervention can be planned (magnitude, distribution, risk factors, utilisation, cost). Some evaluate an ongoing intervention (coverage, quality, acceptability, impact). Some define a problem in resources, policy or environment and analyse possible causes in order to find a solution.

When several ideas compete, they may be ranked by a simple scoring grid or by Nominal Group Technique (NGT): silent generation of ideas, round-robin listing, clarification, and independent ranking.

[SN]Literature search in health research[/SN]

LITERATURE SEARCH
The review answers three questions that later become the Introduction. Why is the topic important? What is already known? What is still not known, and how will this study fill that gap?

Sources of information include bibliographic databases (PubMed / MEDLINE, IndMED, the Cochrane Library, Google Scholar), official statistical systems (Ministry of Health and Family Welfare, National Family Health Survey, Sample Registration System, Census, World Health Organization Statistical Information System), and local material (previous theses, hospital records, programme reports). A backward search follows the reference lists of key papers. A forward search asks who later cited those papers.

PubMed is searched at pubmed.gov. Unqualified terms are mapped, in order, against a Medical Subject Headings (MeSH) translation table, a journals table, a phrase list, and an author index. Boolean operators AND, OR and NOT must be typed in upper case and are processed left to right unless parentheses change the order. Field tags stand after the term, in square brackets: [mh] for MeSH, [au] for author, [dp] for date of publication, [pt] for publication type, [la] for language. Limits restrict age, sex, humans or animals, language, article type and date. A few classic patterns:

dna [mh] AND crick [au] AND 1993 [dp]

(heat OR humidity) AND multiple sclerosis

asthma/therapy [mh] AND review [pt] AND child, preschool [mh] AND english [la]

Google searches the whole web. PubMed searches the bibliographic database of the National Library of Medicine. They are not substitutes for each other. Citations should be stored as they are found, in Vancouver form, so that the reference list is not reconstructed from memory at the end.

The review itself is a synthesis around the objectives, not a chronological catalogue of papers.

ELEMENTS OF A RESEARCH QUESTION
Two primary elements are the variable of interest and the population under study. In analytical work there are two variables of interest: a predictor (independent variable: risk factor or intervention) and an outcome (dependent variable: the disease or the effect of the intervention). The study population is the group to which the investigator wishes to generalise.

A usable analytical question has the shape: does the predictor cause (or is it associated with) the outcome, among this population? It should be phrased as a question, and it should be brief, clear and focused.

Examples of analytical questions:
Does brisk walking for at least one hour daily reduce fasting blood sugar among adults with type 2 diabetes mellitus?
Does labetalol lower blood pressure compared with methyldopa among pregnant women with hypertension? (In a trial, name the comparator.)
Is prenatal depression associated with infant mortality among pregnant women of low income?

Examples of descriptive questions (usually two of the three elements):
What is the prevalence of high blood pressure, defined as systolic pressure above 140 mm Hg or diastolic above 90 mm Hg, among adults over 30 years in an urban slum?
What is the prevalence of anaemia, defined as haemoglobin below 12 g/dL, among adolescents 10 to 19 years of age in a village?

If the question contains phrases such as greater than, less than, causes, leads to, compared with, associated with, related to, or different from, the study is not merely descriptive and a hypothesis should be written.

OBJECTIVES
Objectives are closely related to the statement of the problem. The general objective gives the direction of enquiry in declarative form. Specific objectives divide that aim into smaller parts. They focus the study, prevent unnecessary collection of data, and organise the work into phases.

In a quantitative study the objective names the key variables, their relationship, and the population (to examine the relationship between high blood pressure and body mass index in executives). In a qualitative study it names the nature of the enquiry, the phenomenon, and the setting (to describe terminal care in an intensive care unit as perceived by those who nurse dying patients).

Use action verbs that can be evaluated: to determine, to compare, to verify, to calculate, to describe, to establish, to estimate. Avoid vague non-action verbs: to appreciate, to understand, to discover, to develop, to study. When a project is later judged, results are compared with the objectives. If the objectives were never clear, the project cannot be evaluated.

A convenient check is SMART: specific, measurable, achievable, relevant, and time-bound. A programme-style example of the form (not a current national target) is: to reduce infant mortality in a stated area from a stated baseline to a stated level within a stated period.

A useful classroom distinction is this. Descriptive studies estimate. Analytical studies determine. Thus: to estimate the prevalence of anaemia among adolescents in a village; to determine the effect of brisk walking on fasting blood sugar in adults with type 2 diabetes.

HYPOTHESES
A hypothesis translates the question into a prediction of the expected outcome. It forces logical thought, exercises critical judgement, and ties the new study to earlier findings. It is applied to most observational studies other than purely descriptive ones, and to experimental studies.

A good hypothesis is simple, specific, testable, unambiguous, stated in advance, preferably in the present tense, and it states the expected relationship between the independent and the dependent variable.

Simple: one predictor and one outcome. Lower levels of exercise in the postpartum period are associated with greater weight retention.

Complex: more than one predictor or more than one outcome. A sedentary life and alcohol consumption are associated with ischaemic heart disease and neuropathy in persons with diabetes.

Specific: operational definitions are already in the sentence (how exposure is measured, who the subjects are, where they were found).

Stated in advance: a hypothesis invented after looking at the tables (post hoc) invites over-interpretation. Secondary hypotheses, if any, should also be written beforehand, especially in trials.

Directional (one-sided): specifies the direction of the association. Non-directional (two-sided): states only that an association exists. Null hypothesis (H0): there is no association in the population; this is the formal basis of the significance test. Alternative hypothesis (Ha): there is an association; the test attempts to reject H0 in favour of Ha.

The research (scientific, declarative) hypothesis is often directional. The statistical hypothesis that is tested is the null. If P is below the chosen level of significance (commonly 0.05 or 0.01), H0 is rejected. If P is at or above that level, H0 is not rejected.

Type I (alpha) error is rejecting a true null: declaring two treatments different when they are not. Type II (beta) error is failing to reject a false null: declaring them equivalent when they are not. Power is 1 minus beta: the chance of detecting a difference that truly exists.

CONCLUSION
A good question contains the necessary elements, passes FINER, and can be rewritten as numbered SMART objectives. Where the wording implies comparison or association, a hypothesis is stated in advance. The literature review is what makes the novelty claim honest.

**Mnemonic:** FINER
- F: Feasible
- I: Interesting
- N: Novel
- E: Ethical
- R: Relevant

> **EXAM TIP:** State the three conditions that make a situation a research problem → FINER as five short paragraphs, not five words → elements of the question (population, predictor, outcome) with one worked example → general versus specific objectives and the action-verb list → null versus alternative, with Type I and Type II named. Do not start the answer with PICO unless the question is interventional.
"""


C28_3 = r"""
OVERVIEW OF THE CHAPTER
A variable of interest is one of the two primary elements of a research question. Before a tool is printed or a test is chosen, the investigator must say what will be measured, on whom, with what rule, and how far that measurement can be trusted. Scales of measurement and the choice of statistical tests are treated in the Biostatistics chapter. The present concern is the research meaning of a variable, its operational definition, and the threats to validity that a protocol has to name.

DEFINITIONS
VARIABLE: An attribute that varies. Systolic blood pressure varies from person to person, and in the same person from hour to hour.
OBSERVATIONAL UNIT: The person (or household, village, specimen) on whom the measurement is made.
OBSERVATION: The value obtained (122 mm Hg). Several observational units give several observations. Two readings from the same person are paired observations.
DATA: The collection of those values. Fifty patients yield fifty weights; that collection is the data on weight.
INDEPENDENT (PREDICTOR) VARIABLE: The exposure, intervention or explanatory factor.
DEPENDENT (OUTCOME) VARIABLE: The effect the study is trying to explain or change.
CONFOUNDER: A third variable associated with both predictor and outcome, capable of distorting the apparent relationship if it is ignored.
OPERATIONAL DEFINITION: The exact rule used in this study to decide how a variable is measured or how a case is labelled.
INDICATOR: A measurable proxy for a concept that cannot be observed directly.
VALIDITY: The extent to which a measurement measures what it is intended to measure.
RELIABILITY: The extent to which repetition under the same conditions gives the same result.
BIAS: Systematic error that pushes an estimate in one direction. It is not the same thing as random sampling variation.

[SN]Variables and operational definitions[/SN]

[LAQ]Measurement, validity and reliability in health research[/LAQ]

FROM CONCEPT TO OBSERVATION
A concept (blood pressure, anaemia, stigma, utilisation) is not yet a variable. The variable is the attribute as it will be recorded. The observational unit is who or what is measured. The observation is the recorded value.

If fifty patients take part, each has a different weight, so weight is a variable. The set of fifty numbers in kilograms is data. When blood pressure is taken twice in a day on the same person, the two numbers are paired observations from one observational unit. That distinction matters later for the choice of a paired test, but it must be thought of at the stage of planning measurements, not after the tables are drawn.

ROLE OF THE VARIABLE
List every variable the objectives require, then give each a role: independent, dependent, confounder, effect modifier, or purely descriptive (age and sex in a baseline table). An analytical question that has not named its predictor and its outcome is not yet a question.

OPERATIONAL DEFINITION
“Anaemia in pregnancy” is a concept. It is not an operational definition. An operational definition states who is counted, with what instrument, at what cut-off, when and where, and by whom. For example: haemoglobin less than 11 g/dL on a digital haemoglobinometer, third-trimester antenatal clinic, measured by a trained staff nurse after daily quality control.

Qualitative ideas (satisfaction, stigma, empowerment) need indicators taken from earlier work or from a short formative phase. A one-item “score” invented the night before fieldwork will not survive viva.

National programme indicators (fully immunised child, treatment success, institutional delivery) already have operational definitions. A dissertation that invents a private definition cannot be compared with the National Family Health Survey or with programme reports.

TYPES OF DATA, IN BRIEF
Data on a variable are commonly collected in one of two forms. This is not the same distinction as quantitative versus qualitative approaches to research.

Qualitative (categorical) data place people in categories. Gender (male, female, transgender) is nominal: order is not meaningful. Nutritional status (undernutrition, normal, overweight, obese) is ordinal: order matters. Categorical data are summarised as proportions.

Quantitative (numerical) data are measurements or counts. Temperature in °F is continuous. Number of days of absence from work is discrete. Numerical data are summarised as mean or median.

A continuous measurement can be collapsed into categories for ease of understanding (systolic pressure into normal, high-normal, hypertension). The collapse must be decided in the protocol, with named cut-offs, not after seeing which grouping gives a small P.

THREATS TO VALIDITY, AND WHAT THE PROTOCOL DOES ABOUT THEM
Validity of a measurement:
- Face: the item looks relevant to those who use it.
- Content: the tool covers the domain (often judged by experts).
- Criterion: agreement with a gold standard, concurrent or predictive.
- Construct: the tool behaves as the underlying idea predicts.

Validity of a study is a larger idea. Internal validity asks whether the association is true for the people actually studied. External validity asks whether it can be carried to a defined reference population. A sample drawn from one outpatient department does not, by itself, represent a district.

Reliability:
- Intra-observer: the same person, repeated measure.
- Inter-observer: two trained persons, same subjects.
- Test–retest: the same tool after a sensible interval.
- Internal consistency: items of a scale hang together.

A tool may be reliable and still invalid (a well-zeroed instrument measuring the wrong thing). Validity without reliability is also unusable.

Strategies that belong in the protocol, not in the discussion as an afterthought:
- Selection: a sampling frame, written inclusion and exclusion, a recorded response rate.
- Information: a standard tool, training, blinding where it is possible, a pre-test.
- Confounding: restriction, matching or randomisation in design; stratification or a multivariable model in analysis.
- Loss to follow-up: plan for it, inflate the sample, and report it.

A pre-test of about one tenth of the planned sample, on people like the participants, is cheaper than a finished thesis whose main exposure was misunderstood.

CONCLUSION
Measurement in research is the passage from concept to observation. The protocol should name the variable, the unit, the operational rule, and the likely threats. Scales and tests come after that work is done.

> **EXAM TIP:** Open with concept, variable, observational unit, observation, data (the systolic pressure example) → roles of variables → one fully written operational definition → validity versus reliability in two short columns → how the protocol will handle selection, information and confounding. Do not spend the answer on the normal curve.
"""


C28_4 = r"""
OVERVIEW OF THE CHAPTER
One of the most frequent practical problems in applied statistics is the size of the sample. An appropriate sample produces a usable answer. A sample that is too large wastes money and time and burdens extra people. A sample that is too small may fail to detect a difference that is there; in the worst case the whole effort, and the inconvenience to participants, is wasted. Inappropriate sample size is therefore an ethical matter as well as a statistical one.

The question “How large a sample must I take?” is answered by a mixture of theory and common sense. In the field the size is often fixed by the number of subjects who can be reached, or by cost and time. Even then the calculation is worth doing. It shows whether the study is likely to be worthwhile and what size of difference it can reasonably detect.

DEFINITIONS
POPULATION (UNIVERSE): All the units to which the investigator wishes to generalise.
SAMPLING FRAME: A complete, usable list or map of those units, from which the sample is drawn. An incomplete frame produces an incomplete sample, however elegant the random numbers.
SAMPLE: The units actually studied.
SAMPLING UNIT: The element selected (person, household, village, facility).
REPRESENTATIVENESS: The sample mirrors the population on the characteristics that matter for the question.
PROBABILITY (RANDOM) SAMPLING: Every unit has a known, non-zero chance of selection.
NON-PROBABILITY SAMPLING: The chance of selection is unknown.
PRECISION: How close the estimate should lie to the true value. Absolute precision is in the same units as the measure. Relative precision is a fraction of the expected proportion.
POWER (1 − beta): The probability of detecting a true difference of the size the investigator cares about. Commonly 80 or 90 percent.
ALPHA (Type I error): The chance of claiming a difference that does not exist. Commonly 0.05. Confidence level is 1 − alpha (95 percent when alpha is 5 percent).

[SN]Sample size determination[/SN]

[LAQ]Sampling methods in health research[/LAQ]

WHAT GOVERNS SAMPLE SIZE
Adequacy depends on:
- the degree of difference worth detecting (between two means or two proportions);
- Type I error (alpha), usually 0.05;
- confidence level (fixed once alpha is chosen; higher confidence needs a larger sample);
- Type II error (beta), often 0.20, and therefore power of 80 percent (or 0.10 and 90 percent);
- the natural variation of the readings (standard deviations);
- expected drop-out and non-compliance, which inflate the calculated n;
- whether the test is one-sided or two-sided.

Z values in common use at 95 percent confidence are 1.96 (two-sided) and 1.65 (one-sided). At 80 percent power, Z for beta is 0.84; at 90 percent power it is 1.28.

Methods of arriving at n include arbitrary numbers (not recommended), copying a previous study (which may have been wrong), nomograms, formulae that change with design, and computer programmes based on those formulae (Epi Info, OpenEpi, Statulator). Whatever the machine, the protocol must list the inputs.

ESTIMATING n WITH ABSOLUTE PRECISION: ONE SAMPLE
For a single proportion,
n = Z² × p × (1 − p) / d²
where p is the expected proportion and d is absolute precision. With Z = 1.96 this is close to the older teaching form 4pq / L².

Example. Previous work suggests immunisation coverage of about 80 percent. The investigator wants the estimate to lie within 4 percentage points of the true value, at 95 percent confidence.
n = (1.96)² × 0.80 × 0.20 / (0.04)² = 384.

A medical officer wishes to estimate the prevalence of diarrhoea among children under five. Expected prevalence 20 percent, absolute precision 5 percentage points, 95 percent confidence: n = 246 children.

Relative precision uses the relative error e in the denominator as (e × p). For the same 80 percent coverage, a relative precision of 10 percent (that is, 8 percentage points) gives n = 96. A relative precision of 5 percent gives n = 384, which is the same as an absolute precision of 0.04 when p is 0.80.

It is the absolute size of the sample that matters, not the sampling fraction. A rare event with a tight limit of accuracy demands a large n even in a small population.

SINGLE MEAN
When the standard error e of a mean is specified,
n = s² / e².
Birth weights are expected to have a standard deviation of 400 g, and the desired standard error is 20 g: n = 400² / 20² = 400 newborns.

COMPARISONS
Two groups require the expected values in both groups, alpha and power. Comparison of two means, two rates or two proportions uses the form
n (in each group) = (u + v)² × (variances) / (difference)²
where v is the normal deviate for the two-sided significance level (1.96 at 5 percent) and u is the normal deviate for power (1.28 at 90 percent).

A worked illustration. Mean birth weight 3000 g versus 3200 g, standard deviation 500 g in each district, 90 percent power, 5 percent two-sided significance:
n = (1.28 + 1.96)² × (500² + 500²) / (200)² = 131 newborns in each district.

Cluster samples need a design effect (often 1.5 to 2 unless a local estimate exists). Ignoring clustering underestimates n. Qualitative samples are not powered with 4pq / L². They are built for diversity and continued until saturation.

TYPES OF SAMPLING
Once the universe is defined, a sampling frame is prepared. The accuracy of the frame governs the quality of the sample.

Probability methods
Simple random sampling. Every unit in the frame is numbered. A table of random numbers, or pieces of paper drawn from a box, decides who enters. Each unit has an equal chance. It is ideal for a small, homogeneous population. Example: 50 students out of 250, each name on a slip, the box shaken, 50 slips drawn.

Systematic random sampling. Number the units 1 to N. Decide n. The interval k = N / n. Draw a random start between 1 and k, then take every k-th unit. Example: 100 students from 1200, k = 12, random start 6, then 6, 18, 30, 42… It is quicker than simple random sampling. It is biased if the list has a hidden period (every 7th day is a market day; a clinic-attendance sample taken every 7 days would be all Tuesdays).

Stratified random sampling. The universe is divided into strata (religion, age, urban or rural) that are not equally common, and a random sample is drawn within each stratum. It is used when those strata must appear in the analysis.

Cluster and multistage sampling. Villages or wards are drawn first, then households or persons. This is the practical method for many community surveys. Analysis must respect the clustering. Probability proportional to size gives larger clusters a larger chance of selection and is common in coverage surveys.

Non-probability methods
Convenience: whoever is easy to reach. Fast, and biased.
Purposive or judgment: units chosen because they are rich in information. This is the ordinary method of qualitative work.
Quota: cells are filled to look like the population (or to a minimum per cell) without random selection. Proportional quota copies the population percentages and then stops. Non-proportional quota only ensures that small groups are large enough to talk about. Example: stigma of leprosy or HIV, sampling men and women, rural and urban, poor and better-off, so that each face of the stigma can be described.
Snowball: participants recruit peers. Used when the group is hidden or stigmatised.
Consecutive: every eligible person in a stated time window. Common in hospital studies. It generalises only to similar facilities and seasons. It is not a simple random sample of the district.

SAMPLING AND NON-SAMPLING ERROR
If repeated random samples are drawn, their results differ. That variation is sampling error. It shrinks as n grows, provided selection is random. It is larger when the individual readings themselves vary widely.

Non-sampling error comes from a bad frame, an uncalibrated instrument, observer variation, incomplete coverage of those selected, and conceptual mistakes. These errors are often more important than sampling error, and a larger n does not automatically remove them.

Greek letters are conventionally used for population values (μ, σ) and Roman letters for sample values (x̄, s).

CONCLUSION
Write the frame, the method, the inputs to n (p or s, precision, alpha, power, design effect, non-response), and the limitation of the sample. Do not call an outpatient consecutive series a random sample of the community.

> **EXAM TIP:** Define universe, frame and sample → probability versus non-probability with one method fully worked (systematic: N, n, k, random start) → one 4pq or Z²pq/d² calculation with the immunisation figures → list the inputs you would print in the protocol → end on sampling versus non-sampling error. Mention that a sample too small is an ethical failure.
"""


C28_5 = r"""
OVERVIEW OF THE CHAPTER
Qualitative research is a form of social enquiry that focuses on the way people interpret and make sense of their experience and of the world in which they live. Individuals are not in a vacuum. They live in a whole life context: accumulated knowledge, surroundings, and the organisations that serve them. Understanding health services depends not only on the nature of disease but on what people believe about health, how they behave, and how they work inside those organisations.

A second clinical story sits beside the ART officer. A resident in pulmonary medicine sees many patients with drug-resistant tuberculosis. His teacher points him to loss to follow-up. He first counts: of 200 patients started on treatment in six months at the primary health centres of his district, 40 have discontinued (20 percent, against an expected figure under 5 percent). He then visits homes and interviews defaulters until no new reason appears (eighteen interviews, recorded and transcribed). The reasons are familiar to anyone who has sat in a rural clinic: symptoms have gone, side-effects are not tolerated, the centre is far, work timings collide with clinic timings. The first half of his work estimated a number. The second half explored why. That is the difference between a quantitative and a qualitative approach.

DEFINITIONS
QUALITATIVE RESEARCH (Denzin and Lincoln): a situated activity that locates the observer in the world. It consists of interpretive and material practices that make the world visible (field notes, interviews, conversations, photographs, recordings, memos) and studies things in their natural settings, attempting to make sense of phenomena in terms of the meanings people bring to them.

Holloway: a form of social enquiry that focuses on the way people interpret and make sense of their experiences and the world in which they live.

It has also been called naturalistic inquiry, field research, the case-study approach, and interpretive research. Findings are often presented as a story line, which is why qualitative workers are sometimes called story-tellers. No single method is a panacea.

SATURATION: the point at which new interviews or groups add no materially new codes or themes.
TRIANGULATION (Denzin): use of more than one perspective on the same set of data: data, investigator, theory, or method. Multiple methods that are all poorly done are worse than one method well executed.
TRUSTWORTHINESS (Guba and Lincoln): credibility, transferability, dependability and confirmability.

[SN]Focus group discussion[/SN]

[LAQ]Qualitative research methods in community medicine[/LAQ]

PURPOSES
Qualitative methods emphasise quality rather than quantity. They ask why people do what they do; how behaviours, systems and relationships are maintained or changed; how social organisations function; and they can stimulate an action–experience–learning cycle in a community. They are used when processes and meanings are not adequately described by numbers, or when numbers alone are the wrong tool.

They are the wrong sole method when the aim is a generalisable prevalence or an effect size. Mixed methods (a planned qualitative strand with a quantitative strand) then serve better than forcing one paradigm.

PHILOSOPHICAL NOTES, KEPT SHORT
A method carries philosophical assumptions. Positivism, borrowed from the natural sciences, tests hypotheses and prizes neutrality. Interpretive work asks how human beings make sense of reality. Critical theory holds that people can assess and change society. Constructivism takes trustworthiness, not a single objective truth, as the central issue. The resident does not need a seminar in epistemology to do an MD qualitative chapter, but should not claim grounded theory or phenomenology unless the method will actually be followed.

Recognisable features of qualitative social research include natural settings (everyday life, not a laboratory), primacy of data (the framework grows from what is collected rather than being fixed in advance), context-bound interpretation, immersion of the investigator, and thick description (factual plus analytic), which generates an empathetic understanding.

HOW TO DO THE WORK
Choose the design from the problem and the question: case study, comparison, sample or panel, intervention, or participant observation. Sources of data include systematic observation, participant observation, interviews (individual, family, group), questionnaires, focus group discussions, film and recordings, documents, and the investigator’s own impressions, kept separate from the participants’ words.

Analysis may be content analysis with coding and indexing, discourse analysis, or another method named in the protocol. Software files the material. It does not do the thinking.

QUALITATIVE METHODS
Focus group discussion
A moderated conversation with a small, relatively homogeneous group, commonly six to ten people who share a relevant experience (mothers of under-fives, patients recently started on tuberculosis treatment). A moderator and a note-taker work from a topic guide, not from a questionnaire. An hour to an hour and a half is usual. With consent the session is recorded and transcribed in the language of the discussion.

Advantages often listed are: access to group norms and to the language people actually use; several views in one sitting; stimulation of memory by other speakers; a check of extreme individual claims by the group; relatively low cost; useful for generating items that a later survey can count; and acceptable to many communities when well introduced.

A good moderator listens more than speaking, keeps one or two voices from capturing the hour, stays neutral, and knows when to probe. Limits are obvious: dominant speakers, courtesy bias, and unsuitability for a very private disclosure. A focus group is not a vote and must not be reported as “63 percent of groups said…”.

In-depth interview
One person, a private setting, an open guide, and probes. Best for illness experience, adherence, and household decisions. The sample is built for diversity (age, sex, caste, outcome), not for a percentage.

Key informant interview
The person is chosen for position, not for representativeness: a medical officer, an Accredited Social Health Activist (ASHA), a teacher, a dai. The aim is to understand how a system actually works (how a register is filled, where a referral stalls).

Observation
Structured (a checklist) or unstructured field notes. It records what people do. Talk often sanitises practice. Advantages: better accuracy than questioning for visible behaviour, no refusal or recall error, and sometimes the only way to see the thing. Limits: time, too much to watch, a sample that may not represent, and difficulty in reaching the root of a behaviour. Observation may be direct or of traces left by behaviour; structured or unstructured; human or mechanical.

Participatory inquiry
Participation is treated as a moral right. Group methods (mapping, ranking, seasonal calendars, transect walks) help people organise to change a situation they themselves have named. The outsider facilitates. The common theme is interactive learning and structured analysis that still remains flexible. These methods have been used across health, agriculture and community development, and they bring disciplines together.

Document review
Minutes, stock registers, referral slips, diaries, media. Cheap triangulation.

REPORTING
Report themes with verbatim quotes tagged by type of participant, not by name. Describe the setting thickly enough for a reader to judge transferability. Keep an audit trail. State the investigator’s own stance (reflexivity). Do not convert talk into false precision.

Ethics still apply. Consent, confidentiality, and care with quotes that could identify a small village are not optional because the data are words.

CONCLUSION
Quantitative work estimates. Qualitative work explores. The resident who counted 20 percent loss to follow-up and then sat in eighteen homes until the reasons stopped changing has used both, each for the question it can answer.

> **EXAM TIP:** Define qualitative research (Holloway, or Denzin and Lincoln) → when it is the right tool and when it is not → table of FGD, IDI, KII, observation, PRA → how a group is run (number, guide, recording, moderator) → saturation and triangulation → one programme example (loss to follow-up, vaccine refusal, unused register). Do not invent percentages from interviews.
"""


C28_6 = r"""
OVERVIEW OF THE CHAPTER
A question, however well framed, is only as good as the data that answer it. Collection, classification, and later entry and storage are part of methodology, not clerical afterthoughts. The methods of collection, and the application of computers at each stage, are the subject of this section.

DEFINITIONS
PRIMARY DATA: Collected by the investigator for this study.
SECONDARY DATA: Already in existence (registers, published surveys, programme reports). Cheaper and faster, and limited by someone else’s definitions and missingness.
QUESTIONNAIRE: A structured set of items completed by the participant or by an interviewer.
SCHEDULE: A structured form filled by a trained investigator during an interview. Some vivas still ask for this distinction.
INTERVIEW GUIDE: A flexible list of topics for a qualitative interview, not a fixed script.
PRE-TEST (PILOT): A small run of tools and procedures to find ambiguity, timing and logistics before the main study.
DOUBLE DATA ENTRY: Two independent entries of the same forms, then a check of mismatches.

[SN]Questionnaire design[/SN]

[LAQ]Data collection methods and data management in health research[/LAQ]

METHODS OF COLLECTION
Three families cover almost all health research.

Experiencing: observation and field notes. What people do.
Enquiry: interviews, questionnaires, focus groups. What people say.
Examining: records, physical measurements, laboratory or clinical tests. What can be documented.

The method is chosen to match the variable. A study of hand hygiene that asks only “Do you wash your hands?” and never watches a ward is using enquiry where observation was required.

QUESTIONNAIRE AND INSTRUMENT
Good items carry one idea, in the language of the participant. Closed items are used when the categories are already known; open items when they are not. Validated scales are preferred when they exist, and the source is cited. The flow is consent and eligibility, then socio-demography, then exposures, then outcomes, with the most sensitive items later rather than at the door.

Avoid leading questions, double-barrelled questions, double negatives, jargon, and option lists that do not exhaust the possibilities (leave “other, specify” when it is needed). Do not ask two time frames in one sentence.

A tool that will be compared with an English original should be translated forward, reviewed by someone who knows the subject and the language, and translated back. The pre-test is done on people like the participants, not only on batchmates.

Interviewing is a skill. The study is introduced, voluntariness is confirmed, probes stay neutral, the interviewer does not teach during the interview, and the closing is courteous. Start and end times are recorded. Bias enters here as easily as in the wording: tone, prompting, skipped items, social desirability (alcohol, sexual behaviour, vaccine refusal), recall, and the Hawthorne effect when people know they are watched. Training, supervision, a private setting, a short recall window, and, where literacy allows, self-administration are the ordinary remedies.

DATA MANAGEMENT
The plan is written before the first form is filled.

Each participant receives a unique identity number. The name is not the analysis key. A codebook lists every variable, its type, allowed values and missing codes. Paper forms are receipted, checked for completeness, and locked away. Electronic entry is done in a package that allows legal ranges, skip patterns and must-enter fields. EpiData is built for that work. A spreadsheet used as the only database will accept silent type errors.

Double entry, or at least a 10 percent re-entry check, catches those errors. The analysis file is kept separate from the identifiable master. Identifiers stay with the principal investigator. A second copy, encrypted, is stored away from the single laptop.

Quality assurance is named in the protocol: double entry, a validated tool, blinding or random allocation in a trial, and the handling of data-entry mismatches.

COMPUTERS IN HEALTH RESEARCH
Computers now sit in every stage, from the protocol to dissemination. This is the applied meaning of the undergraduate competency on computers in epidemiology.

During protocol writing, literature is found through Google Scholar and through PubMed. Sample size can be calculated in Epi Info, Statulator, or similar tools. Epi Info can also sketch a structured questionnaire.

During implementation, electronic capture (for example EpiCollect) is used when the ethics committee has approved it and the field can support it. A spreadsheet can generate random numbers for simple random sampling or for a randomised trial.

For management, EpiData is preferred to a bare spreadsheet because of checks and validation. Basic descriptive statistics and a t-test can be done in a spreadsheet. Other tests are run in EpiData, Epi Info, OpenEpi (free) or in licensed packages (SPSS, Stata). Tables and charts for presentation are commonly drawn in a spreadsheet.

For dissemination, journals now receive manuscripts through online systems. Presentation software is used for oral and poster papers.

The protocol should name the packages that will actually be used, and the tests that will be applied, rather than promising “suitable statistical software”.

CONCLUSION
Collection is experiencing, enquiry or examining. The instrument is written, translated and pre-tested. Entry is controlled. Computers are tools at each stage, not a substitute for a codebook and a locked cupboard.

> **EXAM TIP:** Divide the answer into sources (primary, secondary) → the three families of collection → rules for a questionnaire (one idea, language, flow, what to avoid) → quality control and double entry → computers stage by stage (PubMed and sample-size software; EpiData; Epi Info or OpenEpi; journal systems). Mention ethics of data storage in one line.
"""


C28_7 = r"""
OVERVIEW OF THE CHAPTER
Ensuring ethical conduct is not an annexure stapled on after the sample size. It is a condition of doing the study. Indian biomedical and health research involving human participants is governed by the Indian Council of Medical Research (ICMR) National Ethical Guidelines for Biomedical and Health Research Involving Human Participants, 2017. Clinical trials of new drugs and related products also follow the New Drugs and Clinical Trials Rules, 2019, and are registered on the Clinical Trials Registry - India (CTRI) before enrolment.

DEFINITIONS
RESEARCH ETHICS: The principles and procedures that protect participants, communities and the integrity of the science while knowledge is generated.
INFORMED CONSENT: A process, not a signature, in which a competent person, after adequate information and comprehension, voluntarily agrees to take part.
ETHICS COMMITTEE (EC): An independent multidisciplinary body that reviews scientific and ethical merit before any participant is approached. Also called Institutional Ethics Committee (IEC) or Institutional Review Board (IRB) in many colleges.
VULNERABILITY: Reduced ability to protect one’s own interests because of limited capacity, power or resources.
ASSENT: Affirmative agreement of a child who can understand something of the study, given in addition to permission from a parent or legally acceptable representative (LAR).
BENEFIT–RISK ASSESSMENT: Judging whether the anticipated benefits to participants or to society justify the risks.

[SN]Informed consent[/SN]

[LAQ]Ethics in health research and the ethics committee[/LAQ]

A SHORT HISTORY, THEN THE INDIAN DOCUMENT
The Nuremberg Code (1947) put voluntary consent at the centre after the wartime experiments. The Declaration of Helsinki of the World Medical Association, first adopted in 1964 and revised from time to time (the latest WMA revision is 2024), states the duties of the physician-researcher to the participant. The Belmont Report (1979) named respect for persons, beneficence and justice.

In India the ICMR issued a policy statement in 1980, ethical guidelines in 2000 and 2006, and the expanded national guidelines in 2017 (released 12 October 2017). There is a dedicated 2017 guideline for research involving children. Later addenda cover special topics (systematic reviews, leftover samples, and others). The 2017 document remains the core national reference for health research with human participants.

The 2017 guidelines start from four basic principles (autonomy, beneficence, non-maleficence and justice) and expand them into twelve general principles, to be applied to biomedical, social and behavioural research for health, including biological material and data.

1. Essentiality. After considering alternatives in the light of existing knowledge, the use of human participants is essential, and an ethics committee independent of the work has agreed.
2. Voluntariness. The participant may agree, refuse or withdraw at any time. The consent process is what protects that right.
3. Non-exploitation. Participants are selected fairly, so that benefits and burdens are not placed arbitrarily. Vulnerable groups have extra safeguards.
4. Social responsibility. The work should not deepen social or historic divisions or disturb harmony in a community.
5. Ensuring privacy and confidentiality. Identity and records are restricted to those authorised. Limited exceptions (for example a court order, or a serious risk to life) are handled with the ethics committee. The right to life can supersede the right to privacy.
6. Risk minimization. All stakeholders, at every stage, reduce risk and arrange care and compensation if harm occurs.
7. Professional competence. Those who plan, conduct, evaluate and monitor the work are qualified and trained for it.
8. Maximization of benefit. The design should make a direct or indirect benefit to participants or to society possible.
9. Institutional arrangements. The host institution has policies for research governance and provides infrastructure, staff, funds and training.
10. Transparency and accountability. Plans and outcomes enter the public domain through registries, reports and publications, while privacy is kept. Conflicts of interest are declared and managed. Records are retained for possible audit.
11. Totality of responsibility. Every stakeholder is bound by the ethical guidelines and the law.
12. Environmental protection. Environment and resources are protected at every stage, in line with existing rules.

INFORMED CONSENT
Three pillars, then documentation: information, comprehension, voluntariness.

Essential information includes purpose and methods; duration; procedures; foreseeable risks and discomforts; reasonably expected benefits; alternatives; confidentiality and its limits; compensation and treatment for research-related harm; freedom to refuse or withdraw without loss of entitled care; whom to contact; and any payment or reimbursement.

The information is given in a language the person understands, with time to ask questions. High-risk work may need a test of understanding. Written consent is the default. A person who cannot sign gives a thumb impression before an impartial witness. A child gives assent when able, and a parent or LAR gives permission. Electronic consent is allowed when the ethics committee has approved the method.

Waiver of consent is exceptional (some retrospective reviews of de-identified records) and is granted by the committee, not assumed by the student. Re-consent is needed when the protocol or the risk changes in a material way. Permission from a community leader or a medical superintendent does not replace individual consent.

Privacy is kept by unique codes, locked forms, restricted access, and care with photographs and with qualitative quotes. Payment for time and travel is reimbursement. It is not a purchase of risk. Compensation for research-related injury is a duty in interventional work under Indian rules.

ETHICS COMMITTEE
The committee reviews scientific merit and ethical merit before the first participant is approached. It continues to review, and it may monitor a site.

Composition, as used in examination answers: at least seven members; a chairperson from outside the host institution; a member secretary from the institution; a mix that includes a basic medical scientist, clinicians, a legal expert, a social scientist or ethicist or theologian, and a lay person; attention to gender; and no member with a conflict of interest sitting on that protocol.

The file submitted usually contains the protocol, the participant information sheet, consent forms in the local language, the tools, the investigators’ summaries of training, the CTRI number when the study is a trial, and the plan for insurance or compensation in a trial.

More than minimal risk goes to a full meeting. Expedited review or exemption exists only as the committee’s standard operating procedure allows. Multicentre work may use single-review arrangements that are being developed nationally; the local site remains responsible for local context.

Observational dissertations in Indian medical colleges still require committee approval. They are not “only a survey” in the sense that exempts them.

VULNERABLE GROUPS AND PUBLIC HEALTH RESEARCH
Children, prisoners, institutionalised persons, very poor communities, subordinates in a hierarchy (students, employees), some tribal populations, pregnant women, the terminally ill, and persons with impaired cognition are not to be sampled merely because they are easy to reach. Extra justification and extra safeguards are required. Tribal work needs community-level processes as well as individual consent.

Public health research (cluster trials, use of routine information systems, work in emergencies) has its own section in the 2017 guidelines. Altered or waived consent may be argued for some evaluations, but only with committee approval and with community engagement.

CONCLUSION
A Community Medicine dissertation that interviews village women without a local-language information sheet, or that treats an administrator’s letter as consent, fails ethically even if the statistics are faultless. The twelve principles, the consent process, and the committee are the three parts of a complete answer.

**Mnemonic:** ICE (the consent process)
- I: Information
- C: Comprehension
- E: Enrolment that is voluntary

> **EXAM TIP:** Name the 2017 ICMR guidelines → four basic principles and then the twelve general principles (at least name them; expand essentiality, voluntariness, non-exploitation, privacy, risk minimization) → consent as process (information, comprehension, voluntariness, documentation, waiver, re-consent) → committee composition (seven, external chair) → NDCT 2019 and CTRI if the question is a trial. Keep Nuremberg and Helsinki to a few lines.
"""


C28_8 = r"""
OVERVIEW OF THE CHAPTER
Without dissemination the research process is incomplete. The common format for an original report is known by the acronym IMRAD. The same bones appear, with extra academic clothing, in the MD dissertation, and in a shorter form in a journal article. Reading other people’s papers with the same bones in mind is critical appraisal.

DEFINITIONS
PROTOCOL (PROPOSAL): The plan written before data are collected. It is the contract with the guide, the ethics committee, and, if there is one, the sponsor. It is written in the future tense.
THESIS / DISSERTATION: The examined report of the work the resident actually did. Methods are written in the past tense. Copying the protocol into the thesis without changing tense and without inserting the numbers actually achieved is a common failure.
IMRAD: Introduction, Methods, Results, And Discussion.
VANCOUVER STYLE: The citation method of the International Committee of Medical Journal Editors (ICMJE). References are numbered in the order they appear. Journal titles are abbreviated as in MEDLINE.
CRITICAL APPRAISAL: A structured judgement of whether a paper’s methods support its conclusions, and whether those conclusions apply to the reader’s patients or population.

[SN]IMRAD format[/SN]

[LAQ]Steps in writing a research protocol and thesis[/LAQ]

THE PROTOCOL
A typical outline, to be adapted to the college template, is:

Title (population, place, and design when space allows).
Introduction and rationale: why the problem matters, what is known, what gap remains, why this place.
Question, numbered objectives, and a hypothesis where the design needs one.
Review of literature, arranged by theme or by objective, not as a list of papers in date order.
Methods: design, setting, duration, population, inclusion and exclusion, sample size with formula and inputs, sampling, variables and operational definitions, tools, procedure, outcomes, analysis, quality assurance, ethics.
Work plan (a Gantt chart of months against activities).
Budget and its justification.
Plan for use of the results (who will hear them).
References in Vancouver form.
Annexes: tools, consent forms, ethics undertaking, Clinical Trials Registry - India receipt if the study is a trial.

When a project is later evaluated, the results are compared with these objectives. If the objectives were vague, evaluation is impossible.

IMRAD FORMAT
Introduction. Why did you study this? What is already known? What is still not known? How will this study fill the gap? The section usually ends with the specific objectives.

Methods (materials and methods). How did you study it? The dictum is that another investigator should be able to repeat the work in another setting from this section alone. Usual headings are: study design; setting; duration; study population and sampling; inclusion and exclusion; sample size (calculated and achieved); procedure; data collection and tools; outcome measures; entry and analysis; quality assurance; ethical considerations (committee approval, consent, privacy).

Reporting guidelines help completeness, and should be named only when they fit the design: CONsolidated Standards Of Reporting Trials (CONSORT) for trials, Strengthening the Reporting of Observational Studies in Epidemiology (STROBE) for observational studies, Preferred Reporting Items for Systematic Reviews and Meta-Analyses (PRISMA) for reviews, Consolidated criteria for reporting qualitative research (COREQ) for interviews and focus groups. A student project that is not a trial should not be dressed in CONSORT language.

Results. What did you find? Findings are given in text, tables and figures, in the order of the objectives. Begin with the flow of participants and a baseline table. Give numbers with percentages. Titles sit above tables and legends below figures. The section does not interpret, and it does not repeat every cell in prose.

Discussion. What does it mean? Important findings are summarised and possible reasons offered. Similarities and contradictions with other studies are discussed with reasoning. Strengths and limitations are stated. Directions for further work may be suggested. The conclusion is aligned with the objectives. This is the one section in which a narrative voice is allowed, provided it does not invent findings that the results section does not contain.

References. Every resource cited in the text appears at the end, in Vancouver style.

THE THESIS
Most Indian universities expect, in something like this order: certificates and declaration; acknowledgements; contents; lists of tables and figures; abbreviations; introduction; review of literature; aims and objectives; material and methods; results; discussion; summary and conclusion; recommendations; references; annexures (tool, consent, ethics letter, an excerpt of the master chart).

Practical habits that save months: write the methods while the study is running; lock the analysis plan before looking at unexpected P values; keep dated copies of protocol amendments; show tables to the guide and the statistician before drafting the discussion.

THE ARTICLE
A paper is a conversion of the thesis, not a reduction of font size. The target journal’s instructions and word limit govern the draft. A structured abstract and Medical Subject Headings keywords help retrieval. Authorship follows the four ICMJE criteria (substantial contribution; drafting or critical revision; final approval; accountability). Gift authorship is misconduct. The ICMR Policy on Research Integrity and Publication Ethics (RIPE), 2019, is the Indian institutional reference for plagiarism, fabrication and authorship disputes. Journals that charge authors and skip genuine peer review are not a place to send, or to cite as if they were indexed science.

[SN]Critical appraisal of a journal article[/SN]

CRITICAL APPRAISAL
Publication is not proof. The method decides how far the conclusion can be believed.

A working sequence for a resident, and for an examination short note:
1. What was the question? Is it clear and important?
2. What was the design? Can that design answer that question?
3. Who was studied? Inclusion, sampling, response, and whether the sample resembles the reader’s setting.
4. How were exposure and outcome measured? Was there blinding? What bias is likely?
5. How was confounding handled?
6. What are the results (effect size and confidence interval, not only P)?
7. Do the conclusions stay inside the data, or do they run ahead of them?
8. Who funded the work, and is a conflict of interest declared?
9. Would this change practice or a programme here?

Design-specific checklists (CONSORT, STROBE, CASP) are memory aids. In an examination a structured paragraph is worth more than the sentence “the study is good.”

CONCLUSION
The protocol is the plan. IMRAD is the report. The thesis is the examined form of that report. The article is the public form. Appraisal is how a doctor remains a critical consumer. University work fails more often on muddled objectives, a missing ethics letter and a broken reference list than on the absence of an exotic test.

**Mnemonic:** IMRAD
- I: Introduction (why)
- M: Methods (how)
- R: Results (what)
- D: Discussion (so what)

> **EXAM TIP:** For a protocol or thesis question, write the headings in order (title, rationale, objectives, methods including sample size and ethics, Gantt, budget, IMRAD for the report). For IMRAD, use the four questions: why, how, what, what does it mean. For appraisal, walk the nine points rather than giving a vague opinion.
"""


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    data = [ch for ch in data if str(ch.get("id")) != "28"]

    chapter = {
        "id": "28",
        "title": "Research Methodology",
        "description": "Health research methods: the nature of enquiry, questions and hypotheses, sampling, qualitative work, ethics, the protocol and the scientific report. Distinct from biostatistics and from epidemiological study designs.",
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
    print("wrote chapter 28 with", len(chapter["subsections"]), "leaves")
    for s in chapter["subsections"]:
        print(s["id"], len(s["content"]))


if __name__ == "__main__":
    main()
