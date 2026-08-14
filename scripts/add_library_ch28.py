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

What is research? Why is it done? How is it done? What makes it good? These are the questions this chapter answers. The nature of enquiry comes first. Classification of designs, and the tests that follow from the scale of the data, are written out in full later in this chapter so that a protocol can be completed from these pages.

A clinical story makes the point. A medical officer at an antiretroviral therapy (ART) centre notices that many patients diagnosed with human immunodeficiency virus (HIV) at primary health centres never report for treatment. He wonders whether weekly telephone reminders might help. With a colleague he compares two districts: one in which counsellors give reminders, and one in which they do not. After six months, registration within one month of diagnosis is 90 percent in the intervention district and 70 percent in the comparison district. The State AIDS Control Society then takes telephone reminders into routine service. The officer did not merely have an idea. He pursued the idea with a method, and the method produced evidence that could change policy.

The journey of medical practice has been described as three Es: empirical practice (trial and error), experience-based practice (what seemed to work for previous patients), and evidence-based practice (what has been tested by a planned study). A surgeon who invents a new technique converts experience into evidence only when the technique is put through a scientifically planned investigation.

DEFINITIONS
Dictionary: a careful investigation or enquiry, especially through searching for new facts in any branch of knowledge.

Organisation for Economic Co-operation and Development (OECD): creative work undertaken on a systematic basis in order to increase the stock of knowledge, including knowledge of humanity, culture and society, and the use of that stock of knowledge to devise new applications.

FN Kerlinger: a systematic, controlled, empirical and critical investigation of hypothetical propositions about the presumed relations among natural phenomena.

Theobald Smith: a fundamental state of mind involving continual re-examination of the doctrines and axioms upon which current thought and action are based. It is therefore critical of existing practice.

Redman and Mory: systematised efforts to gain new knowledge.

Clifford Woody: defining and redefining problems, formulating hypotheses or suggesting solutions, collecting, organising and evaluating data, making deductions, and carefully testing the conclusions.

Working definition: research is the systematic collection, analysis and interpretation of data to answer a certain question or solve a problem. It is characterised by originality, by investigation as a primary objective, and by the potential to produce results that are sufficiently general to add to the stock of knowledge, theoretical or practical.

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

GENERIC STEPS IN CONDUCTING QUANTITATIVE RESEARCH
Quantitative research is a systematic process of collecting, analysing and interpreting data to answer a question or to solve a problem. Systematic means that the work is not a haphazard chain of activities. Epidemiologic designs sit at the core. They are classified here so that the staircase has a design, not only a slogan. The same staircase, with small changes, serves qualitative and mixed-methods work.

CLASSIFICATION OF STUDY DESIGNS
Epidemiological studies are of two main kinds. The usual sequence is descriptive, then analytical, then experimental.

Observational studies allow nature to take its course. The investigator measures and does not intervene.
- Descriptive studies formulate a hypothesis.
- Analytical studies test a hypothesis.
  - Ecological or correlational: the unit is a population.
  - Cross-sectional (prevalence survey, snapshot): the unit is an individual.
  - Case-control, including nested case-control: the unit is an individual.
  - Case series: the unit is an individual; there is no comparison group of the non-diseased.
  - Cohort (prospective, retrospective, or mixed): the unit is an individual.

Experimental studies confirm a hypothesis. The investigator tries to change a determinant or the course of a disease.
- Randomised controlled trial and clinical trial: the unit is the patient or case.
- Field trial: the unit is a healthy person.
- Community trial: the unit is a community.

Special forms include migration studies (environment versus genes) and knowledge–attitude–practice studies (first used in India for family planning).

Hierarchy of evidence for causality, strongest to weakest: systematic review or meta-analysis of randomised trials; randomised controlled trial; prospective (concurrent) cohort; retrospective (historical) cohort; case-control; cross-sectional; ecological; case series or case report. A well-conducted observational study may outrank a poorly conducted trial. Prospective cohort ranks above retrospective cohort because time order and measurement of exposure are usually stronger.

Evidence-based medicine is the use of those findings for decisions about care. David Sackett is named as its father. The evidence-based pyramid, from highest clinical relevance to lowest, is: meta-analysis; systematic review; randomised controlled trial; prospective cohort; retrospective cohort; case-control; case series; case report; ideas, editorials, opinions; animal research; in-vitro work.

Descriptive epidemiology studies the distribution of a disease or health-related characteristic and the features with which it seems to be associated. It is the design of first resort when a disease is new and there is no etiological hypothesis. Its procedures are: define the population; define the disease; describe it by time, place and person; compare with known indices; formulate a hypothesis.

The working details of case-control and cohort analysis (odds ratio, relative risk, matching) remain in the Epidemiology chapter as worked designs. The classification and the hierarchy above are what a research protocol must name.

The generic steps are these.

1. Select a topic, then narrow general curiosity to scientific curiosity. Quantitative work does not allow many aspects of a problem to be studied at once. If they are, each is studied superficially and the findings cannot be trusted.
2. Search existing knowledge (review of literature). Google Scholar and PubMed are the usual tools. The point is to find the gap, not to decorate the protocol with references.
3. Refine the research question until it names the variable and the population.
4. Define the study variables and write operational definitions.
5. Choose the study population (reference, accessible, sample) and the sampling method.
6. Collect the data (sources, tools, field procedure).
7. Present the data (tables and figures; the rules are written with data management).
8. Analyse the data with tests that match the scale and the design.
9. Interpret the findings: chance versus bias, statistical versus clinical meaning, association versus causation. Interpretation is taken up again with the report.
10. Disseminate: protocol becomes thesis, paper, and briefing of users. Without this step the process is incomplete.

The health-systems cycle below asks the same questions in managerial language.

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

> **EXAM TIP:** Begin with a short definition (Kerlinger or the brief working definition) → distinguish discovery from invention if asked → Weatherall types → domains grid → observational versus experimental designs with the unit of study and the evidence hierarchy → health-systems cycle. Close on change of practice or policy.
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

When several ideas compete, they may be ranked by a simple scoring grid (relevance, feasibility, novelty, ethics, local burden) or by Nominal Group Technique (NGT). NGT is a structured meeting, not a loose brainstorm.

1. The facilitator states the task (for example, “priority research problems for this district this year”).
2. Each member writes ideas in silence for a fixed time. There is no discussion yet.
3. Ideas are listed in a round-robin, one from each person in turn, until the pool is empty. No criticism during listing.
4. The list is clarified. Similar items may be merged, but only if the group agrees.
5. Each member independently ranks or scores a fixed number of items.
6. Scores are summed. The highest totals become the short list for a protocol.

NGT reduces the effect of seniority. A professor’s first spoken idea does not swallow the meeting.

PICO AND PEO
FINER decides whether a question is worth asking. PICO and PEO decide whether it is written tightly enough to design.

PICO is used when there is an intervention or a comparison: Population, Intervention (or Exposure), Comparison, Outcome. Example. In adults with type 2 diabetes attending this clinic (P), does brisk walking for at least one hour daily (I), compared with usual activity (C), reduce fasting blood sugar at twelve weeks (O)?

PEO is used when there is no comparison arm: Population, Exposure, Outcome. Example. Among adolescents 10 to 19 years of age in village X (P), what is the prevalence of anaemia defined as haemoglobin below 12 g/dL (O) in relation to dietary iron intake (E)?

A protocol that cannot fill these boxes still has a topic, not a question. PICO does not replace FINER. A beautifully structured PICO that is not feasible, not ethical, or not relevant should be dropped.

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

TYPES OF DATA AND SCALES OF MEASUREMENT
Data on a variable are commonly collected in one of two forms. This is not the same distinction as quantitative versus qualitative *approaches* to research. A qualitative study can still record a few numbers. A quantitative survey still uses categorical items. Here we mean the nature of the recorded value.

Classification by nature of the data

Qualitative (categorical, discrete) data. There is no notion of magnitude that can be measured with a ruler. The attribute is named or counted. It sits on a nominal or ordinal scale. There is no true value “in between” two categories. Examples: ABO blood group, gender, religion, colour, parity recorded as 0, 1, 2, obesity as present or absent.

Quantitative (continuous, dimensional) data. The characteristic has magnitude and is measured. It sits on a metric scale (interval or ratio). Values exist between any two readings. Examples: serum cholesterol, weight, height, mid-upper arm circumference, body mass index, age, platelet count, temperature in Celsius or Fahrenheit, blood pressure.

Classification by number of values

Dichotomous (binary): only two possible values. Rh positive or negative; diabetes present or absent; gender recorded as male or female.

Polytomous: more than two values. ABO group; MUAC; blood sugar; BMI.

Classification by role in the study (already named above as predictor and outcome) is completed by the controlled variable: the factor deliberately held unchanged (the same plant species if one is testing water).

A continuous measurement can be collapsed into categories (systolic pressure into normal, high-normal, hypertension). The collapse must be decided in the protocol, with named cut-offs, not after seeing which grouping gives a small P.

Scales of measurement (I.R.O.N.)

Categorical scales, for qualitative variables:

1. Nominal. Based on names. No order. HIV status, race, blood group, type of hospital, sex. The numbers assigned, if any, have no mathematical meaning. Addition and division are not done.

2. Ordinal. There is a meaningful order or grade. Severity of anaemia (mild, moderate, severe); social class; Child–Pugh A (5 to 6), B (7 to 9), C (10 to 15); satisfied / very satisfied / dissatisfied. A Likert scale is an ordinal, usually bipolar, summative scale of attitude, commonly with 3, 5 or 7 steps (strongly agree to strongly disagree).

Dimensional (metric) scales, for quantitative variables. Mean and standard deviation are worked only on interval or ratio data.

3. Interval. Equal gaps between numbers, but no absolute zero and no true starting point. Temperature in Celsius or Fahrenheit: 0 °C is not “no temperature”, yet the gap from 10 to 20 is the same size as the gap from 40 to 50. Addition and subtraction are possible; multiplication and division as “twice as hot” are not.

4. Ratio. The same equal gaps, and an absolute zero. Kelvin temperature, weight, height, age, MUAC, blood pressure, pulse rate, money. Ten kilograms is twice five. All ordinary mathematical operations are allowed.

A good general rule, already stated, is to keep a continuous ratio or interval variable when the science allows it. Blood pressure in millimetres of mercury shows the size of change in every subject; “hypertensive versus normotensive” throws that magnitude away. Programme categories (low birth weight) and ordinal taste scales are the usual exceptions.

The protocol must name the scale. The scale decides the summary (proportion versus mean) and the test.

PLANNING THE MEASUREMENTS
Measurement is the process by which investigators describe, explain and predict constructs that would otherwise remain abstract (Kaplan; Pedhazur and Schmelkin). Without it, observations stay unsystematic. An operational definition takes a variable from the theoretical to the concrete by stating the actual procedures used to measure or manipulate it. In a study of weight loss, “weight loss” might be operationalised as a decrease, in kilograms, below the person’s weight on a named starting date.

Data are non-metric (attributes and categories: qualitative) or metric (amounts and distances: quantitative). Metric data allow magnitudes to be examined; non-metric data mainly describe and classify. A good general rule is to prefer a continuous variable when the science allows it. Blood pressure in millimetres of mercury shows the size of change in every subject; “hypertensive versus normotensive” throws that magnitude away. Exceptions exist (low birth weight as a programme category; an ordinal taste scale). The four scales are named above. The tests that sit on them are named next.

CHOOSING A TEST OF SIGNIFICANCE
Tests of significance give a P value: the probability that a difference as large as the one seen would appear by chance if the null hypothesis were true. They fall into two families.

Parametric tests assume that the variable follows a normal (Gaussian) distribution in the population. They are used for quantitative data on an interval or ratio scale, and they compare means.
- One group, paired readings: paired t-test (cholesterol before and after a drug; blood pressure before and after a trial).
- Two independent groups: unpaired (Student) t-test (height of 20 boys versus 20 girls; birth weight with and without iron supplementation).
- Three or more groups: analysis of variance (ANOVA, F test).
- A Z-test is used in place of a t-test when the sample is large (n greater than 30).

Non-parametric tests make no assumption of a normal distribution. They are used for qualitative data, and they compare proportions or ranks.
- One group, nominal: McNemar’s test. One group, ordinal: Wilcoxon signed-rank (sign) test.
- Two groups, nominal: chi-square. Two groups, ordinal: Wilcoxon rank-sum (Mann–Whitney).
- Three or more groups, nominal: Kruskal–Wallis.

Chi-square is a test of association between qualitative characteristics. It says whether an association is present, not how strong it is. Requirements: qualitative data, a random and reasonably large sample, a contingency table, and each expected cell frequency greater than 5. If an expected cell is below 5, Yates’s correction (subtract 0.5 from |O − E| before squaring) is applied, or Fisher’s exact test is used when the sample is small.

Formula: chi-square = sum of (O − E)² / E. Degrees of freedom = (columns − 1) × (rows − 1). For a 2 × 2 table, d.f. = 1; the 5 percent critical value is 3.84. If the calculated value is smaller than 3.84, the null is not rejected.

A worked 2 × 2. Vaccine A: 22 attacked, 68 not, total 90 (attack rate 24.4 percent). Vaccine B: 14 attacked, 72 not, total 86 (16.2 percent). Combined attack rate 36/176 = 20.4 percent. Expected attacked under A = 18.36; under B = 17.54. Chi-square = 1.79, d.f. = 1, which is below 3.84. The difference is not significant. Vaccine B is not shown to be superior.

Special tests that a protocol may name: Cronbach’s alpha (internal consistency of a questionnaire); Kolmogorov–Smirnov (normality); Dixon Q (outliers); Cox proportional hazards (survival curves); Bland–Altman (a new test against a gold standard).

P greater than 0.05: the null is not rejected. P less than 0.05: the null is rejected. Type I (alpha) error is rejecting a true null (false positive). Type II (beta) error is accepting a false null (false negative). Power is 1 − beta. In medical work a Type I error is usually treated as the more serious of the two. Confidence interval = mean ± Z × SE, where SE = SD / square root of n. The common 95 percent interval uses Z = 1.96 (often taught as 2 SE).

Reliability is the degree to which a measurement is reproducible. Any obtained score has two parts: the true score, and measurement error (distortion from a poor tool, the situation, or a mistake in recording). Three ordinary sources of that error are:

1. Observer variability: skill, wording, or the way the question is put.
2. Instrument variability: an old machine, a new reagent lot, a scale that has not been zeroed.
3. Subject variability: mood, stress, time of day, a biological swing.

Reliability is often summarised as a correlation; a coefficient of about 0.80 or higher is commonly taken as adequate. Ways of raising it: a standardised instrument, training and a written procedure, duplicate readings, calibration, and measuring under similar conditions.

Validity of a measurement is the absence of bias in that measurement: it measures what it is intended to measure.

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

Threat and answer, written into the protocol:

| Threat | What it does | What the protocol does |
|---|---|---|
| Selection | The wrong people enter, or too many refuse | Frame, inclusion and exclusion, recorded response rate |
| Information | Exposure or outcome is mis-measured | Standard tool, training, blinding where possible, pre-test |
| Confounding | A third variable pretends to be the association | Restriction, matching or randomisation; later, stratification or a model |
| Loss to follow-up | The people who stay are not the people who started | Extra sample, active tracing, report who was lost |
| Observer / instrument / subject error | The number is noisy or biased | Calibration, duplicate reads, same time of day, written script |

A pre-test of about one tenth of the planned sample, on people like the participants, is cheaper than a finished thesis whose main exposure was misunderstood.

Qualitative concepts (stigma, satisfaction, “empowerment”) are operationalised by choosing indicators, often after a short formative phase or from a published scale. The indicator is named, scored, and justified. A single homemade item is not an operational definition.

CONCLUSION
Measurement in research is the passage from concept to observation. The protocol should name the variable, the unit, the operational rule, and the likely threats. Scales and tests come after that work is done.

> **EXAM TIP:** Open with concept, variable, observational unit, observation → operational definition → nature of data and I.R.O.N. scales (mean and SD only on interval or ratio) → test map (paired t, unpaired t, ANOVA, chi-square, Mann–Whitney) and the expected-cell rule for chi-square → validity versus reliability.
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

CHOOSING THE STUDY POPULATION
In real life the investigator never has the whole population of interest. Three ideas must be kept apart.

Reference population: all the units to which the findings are meant to apply. For “Does brisk walking for at least one hour daily reduce fasting blood sugar among adults with type 2 diabetes mellitus?”, the reference population could be all such patients in the world. The population need not be people. It may be schools, households or facilities. “What percentage of secondary schools in district X routinely procure iron and folic acid?” has schools as the reference population.

Accessible population: the part the investigator can actually reach. Usually this is the patients of one clinic, or the villages of one block.

Study sample: those who are actually enrolled. Some of the accessible population will refuse, some will not meet the inclusion rules.

Inclusion criteria say who may enter. Exclusion criteria say who, among those included, must still be left out (too ill to walk, already in another trial). They are written before recruitment, not invented when a difficult participant appears.

A sample represents the reference population only if the method of drawing it does. The grocery-shop analogy is useful. The shopkeeper shows a handful of grain. If the sack you take home has been mixed with a poorer lot, the handful was not representative. Enrolling only adolescents who attend an outpatient department, for a village prevalence of anaemia, will usually overestimate anaemia: the sick come to the clinic. Probability methods exist so that human choice does not make the handful unrepresentative.

STANDARD ERROR, AND WHY n MATTERS
If many random samples are drawn, their means (or proportions) form their own distribution. The standard error describes how widely those sample values scatter around the population value. A larger n narrows the standard error and therefore the confidence interval. That is the statistical reason for calculating n. It is not a reason for making n enormous so that a 2 mm Hg difference in blood pressure becomes “significant”. Interpretation of that distinction is taken up with the report.

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

Drop-out must be put back into n. If 384 is required and 20 percent are expected to be lost, n becomes 384 / 0.80 = 480.

Two proportions (each group). Expected leaving rates among nurses in two regions, 30 percent and 15 percent, 90 percent power, 5 percent two-sided significance:
n = (1.28 + 1.96)² × (30×70 + 15×85) / (30 − 15)² = 157 in each group.

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
A moderated conversation with a small, relatively homogeneous group, commonly six to ten people who share a relevant experience (mothers of under-fives, patients recently started on tuberculosis treatment). Mix strangers rather than a boss and subordinates in the same circle.

How a group is run:
1. Write a topic guide of six to ten open prompts, in the order the conversation should travel.
2. Choose a place that is private enough to talk and ordinary enough that people will come.
3. Invite with a clear purpose. Obtain consent for recording.
4. Seat the group so that everyone sees the moderator. A note-taker sits aside.
5. Open with the purpose, the rules (one voice at a time, disagreement is allowed, nothing leaves the room as a named quote without permission), and a warm question.
6. Use the guide. Probe (“say more”, “an example”). Do not teach.
7. Close by asking whether anything important was missed. Thank the group.
8. Transcribe in the language of the discussion. Translate later, carefully.

A good moderator listens more than speaking, keeps one or two voices from capturing the hour, stays neutral, and knows when to probe. Traits often listed: patience, a light hand with silence, no visible rank over the group, and the courage to stop a courtesy chorus.

Advantages often listed are seven: access to group norms and to the language people actually use; several views in one sitting; stimulation of memory by other speakers; a check of extreme individual claims by the group; relatively low cost; useful for generating items that a later survey can count; and acceptable to many communities when well introduced.

Limits are obvious: dominant speakers, courtesy bias, and unsuitability for a very private disclosure. A focus group is not a vote and must not be reported as “63 percent of groups said…”.

In-depth interview
One person, a private setting, an open guide, and probes. Best for illness experience, adherence, and household decisions. The sample is built for diversity (age, sex, caste, outcome), not for a percentage.

Key informant interview
The person is chosen for position, not for representativeness: a medical officer, an Accredited Social Health Activist (ASHA), a teacher, a dai. The aim is to understand how a system actually works (how a register is filled, where a referral stalls).

Observation
Structured (a checklist) or unstructured field notes. It records what people do. Talk often sanitises practice. Advantages: better accuracy than questioning for visible behaviour, no refusal or recall error, and sometimes the only way to see the thing. Limits: time, too much to watch, a sample that may not represent, and difficulty in reaching the root of a behaviour. Observation may be direct or of traces left by behaviour; structured or unstructured; human or mechanical.

Participatory inquiry
Participation is treated as a moral right. The outsider facilitates. People produce the data themselves. Common participatory rural appraisal (PRA) tools, named so that a viva can be answered:

- Social or resource map: the community draws the village, water points, lanes, and who lives where.
- Wealth or well-being ranking: households are sorted by local criteria of poverty, not by an outsider’s income slab.
- Seasonal calendar: months against work, illness, food, and cash, so that a “typical week” is not invented in the wrong season.
- Transect walk: a walk across the settlement with local guides, noting what the map omitted.
- Problem or preference ranking: stones or seeds voted onto named problems.
- Daily activity clock: whose time a new clinic hour would actually steal.

The common theme is interactive learning and structured analysis that still remains flexible. These methods have been used across health, agriculture and community development.

Document review
Minutes, stock registers, referral slips, diaries, media. Cheap triangulation.

ANALYSIS OF QUALITATIVE DATA
The purpose of qualitative analysis is to make sense of words and observations, not to produce a P value. The usual path is:

1. Familiarisation. Read and re-read transcripts and notes. Listen again to a recording if something is unclear.
2. Coding. Mark short stretches with a label that says what is happening (“side-effects”, “wage loss”, “clinic closed at noon”). Codes come from the data first (inductive). A few may be brought from the question (deductive).
3. Categories. Codes that belong together are grouped.
4. Themes. Categories are interpreted: what story do they tell about the question?
5. Deviant cases. The interview that does not fit is not discarded. It tests the theme.
6. Writing. Themes are presented with verbatim quotes, tagged by type of participant (ASHA, defaulted patient, medical officer), not by name.

Content analysis, when used in this sense, is the disciplined counting or sorting of codes. Discourse analysis asks what people do with words (neutrality, resentment, professional jargon). Grounded theory, phenomenology and ethnography are named only if their procedures will actually be followed.

Software (NVivo, Atlas.ti, or a careful spreadsheet) files the material. It does not decide a theme.

Trustworthiness (Guba and Lincoln): credibility (member check, triangulation), transferability (thick description of setting), dependability (audit trail), confirmability (the investigator’s stance is declared). Triangulation may be of data, investigator, theory or method. Four poorly done methods are worse than one well executed.

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

SOURCES OF DATA
Primary data are collected by the investigator for this study: interview, examination, observation, measurement. Secondary data already exist: case records, registers, Health Management Information System returns, the National Family Health Survey, published papers. Secondary data are cheaper and faster. They are limited by someone else’s definitions, missingness, and purpose. A protocol that uses secondary data must still say how completeness and identity will be handled, and whether the ethics committee has agreed.

Usual sources of epidemiological data, used as a research list: census and civil registration; sample registration; notification; hospital and programme registers; surveys; and special studies. Computers in epidemiology (search, capture, entry, analysis, submission) are taken up at the end of this section.

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

INTERVIEW TYPES AND SKILLS
Interviews may be structured (every wording fixed, as in a schedule), semi-structured (a guide with room to probe), or unstructured (a conversation around a theme). Structured interviews serve a prevalence survey. Semi-structured interviews serve most MD qualitative work. Unstructured interviews need an experienced investigator and a clear analytic plan.

Skills that belong in the protocol as training, not as piety:
- Introduce the study and confirm that participation is voluntary.
- Ask one question at a time. Wait.
- Probe without leading (“what happened then?”, not “you must have been angry”).
- Do not teach, correct, or counsel until the interview is closed (unless safety requires it).
- Record start and end times. Note interruptions.
- Thank the person and say what will happen to the recording.

BIAS IN COLLECTION
Named types, so that the discussion can do more than say “bias was minimised”:
- Interviewer bias: tone, prompting, skipped items. Train, supervise, use a script, and, where feasible, blind.
- Social desirability: alcohol, sexual behaviour, vaccine refusal. Private setting, normalised wording, self-administration when literacy allows.
- Recall bias: shorter windows, calendars, records.
- Hawthorne effect: people change when watched. Longer observation, or unobtrusive measures.
- Leading and loaded items: rewrite in the pre-test.
- Non-response: those who refuse are often different. Report the rate and, if possible, who refused.

Training, supervision, a private setting, a short recall window, and a pre-tested tool are the ordinary remedies.

PROCESSING THE DATA
Before a test is run, the forms are turned into an analysis file.

1. Editing. Completeness, range, and internal sense are checked on the day of collection if possible (age 3 years and “married” is a query, not a data point).
2. Coding. Closed items already have codes. Open items are given a codebook that is frozen after a sample of forms, not reinvented on the last day.
3. Master chart. One row per participant, one column per variable, unique identity number in the first column.
4. Data screening. Impossible values, duplicates, and missingness are listed. Decisions (correct, leave missing, exclude) are written down.
5. Entry. EpiData or an equivalent with legal ranges. Double entry, or a 10 percent re-entry check.
6. Lock. The analysis file is copied. Identifiers stay with the principal investigator.

DATA MANAGEMENT
The plan is written before the first form is filled.

Each participant receives a unique identity number. The name is not the analysis key. A codebook lists every variable, its type, allowed values and missing codes. Paper forms are receipted, checked for completeness, and locked away. Electronic entry is done in a package that allows legal ranges, skip patterns and must-enter fields. EpiData is built for that work. A spreadsheet used as the only database will accept silent type errors.

Double entry, or at least a 10 percent re-entry check, catches those errors. The analysis file is kept separate from the identifiable master. Identifiers stay with the principal investigator. A second copy, encrypted, is stored away from the single laptop.

Quality assurance is named in the protocol: double entry, a validated tool, blinding or random allocation in a trial, and the handling of data-entry mismatches.

PRESENTATION OF DATA
Data from experiments, records and surveys must be accurate and complete before they are shown. The first step is to sort them into characteristic groups. A presentation should be concise without losing what matters, easy to read, and able to define the problem. There are two main methods: tabulation, and drawing (charts and diagrams).

Tabulation
Tables are numbered in sequence and given a title. Column and row headings name the unit (height in cm, age in years). Data are ordered by size, time or alphabet. Footnotes explain exclusions and abbreviations.

Simple tables show simple categories (year of admission and number of students). A frequency distribution table splits a variable into class intervals. The number of groups is ordinarily between 6 and 16, and should not exceed about 20 or fall below 5. Class intervals are kept equal throughout the table.

Charts for qualitative data
Bar chart. Used to compare the magnitude of frequencies in discrete or qualitative data. Bars may be vertical or horizontal, and are separated by a space of about half the bar width. A bar chart compares magnitudes. It does not show the relationship between two continuous variables (that is a scatter plot). Types: simple; multiple or compound (males and females by year); component or proportional (each bar split into parts).

Pie (sector) diagram. Discrete qualitative characters (blood groups, causes of death). Angle of a sector = (class frequency / total) × 360 degrees.

Pictogram. Pictures of a standard size stand for a stated number of cases. Used for a lay audience.

Charts for quantitative data
Histogram. An area diagram. Class intervals sit on the horizontal axis, frequencies on the vertical. The area of each rectangle follows the frequency.

Frequency polygon. Mid-points of the histogram blocks joined by straight lines.

Frequency curve. When observations are very many and intervals small, the polygon smooths into a curve.

Line diagram. A frequency polygon against time. It shows a rising, falling or fluctuating trend (incidence over years). It is not a scatter plot of two variables.

Ogive (cumulative frequency). Always rising. Locates percentiles, quartiles and the median. A “less than” ogive and a “greater than” ogive meet at the median.

Scatter (dot) diagram. Two continuous variables. The vertical axis is usually the outcome. A cloud along a straight line suggests a linear relationship; no cloud suggests none. It shows strong or weak, positive or negative, correlation by eye.

Other plots a protocol or thesis may need: stem-and-leaf; tree diagram of possible outcomes; box-and-whisker (the box holds the middle 50 percent; each whisker 25 percent; marked are minimum, Q1, median, Q3, maximum, and the interquartile range). Tertile, quartile, pentile, decile and centile (percentile) divide the series into 3, 4, 5, 10 or 100 parts. The median is the 50th centile. Percentile Px = (n + 1) × x / 100.

COMPUTERS IN HEALTH RESEARCH
Computers now sit in every stage, from the protocol to dissemination. This is the applied meaning of the undergraduate competency on computers in epidemiology.

During protocol writing, literature is found through Google Scholar and through PubMed. Sample size can be calculated in Epi Info, Statulator, or similar tools. Epi Info can also sketch a structured questionnaire.

During implementation, electronic capture (for example EpiCollect) is used when the ethics committee has approved it and the field can support it. A spreadsheet can generate random numbers for simple random sampling or for a randomised trial.

For management, EpiData is preferred to a bare spreadsheet because of checks and validation. Basic descriptive statistics and a t-test can be done in a spreadsheet. Other tests are run in EpiData, Epi Info, OpenEpi (free) or in licensed packages (SPSS, Stata). Tables and charts for presentation are commonly drawn in a spreadsheet.

For dissemination, journals now receive manuscripts through online systems. Presentation software is used for oral and poster papers.

The protocol should name the packages that will actually be used, and the tests that will be applied, rather than promising “suitable statistical software”.

CONCLUSION
Collection is experiencing, enquiry or examining. The instrument is written, translated and pre-tested. Entry is controlled. Computers are tools at each stage, not a substitute for a codebook and a locked cupboard.

> **EXAM TIP:** Sources → three families of collection → questionnaire rules → processing (edit, code, master chart) → presentation (table rules; bar and pie for qualitative; histogram, line, scatter for quantitative; ogive for median) → computers stage by stage.
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

SAMPLE CONSENT FORM (WORKED)
A form has two declarations. The wording below is the shape examiners expect, to be printed in the local language and adapted to the study.

Declaration by the participant
By signing below, I (name) agree to take part in a research study entitled “(title)”.
I declare that:
- I have read this information and consent form and understand the contents (or it has been read to me).
- I have had a chance to ask questions and they have been answered.
- Taking part is voluntary. I have not been pressured.
- I may leave the study at any time and will not lose any care I am entitled to.
Signed at (place) on (date). Signature, or mark X if the person cannot sign, with an impartial witness.

Declaration by the researcher
I (name) declare that I explained this document; I encouraged questions and took time to answer them; I am satisfied that the person understands the study.
Signed at (place) on (date).

The information sheet that precedes the form carries the essential elements listed above. A signed form without that sheet is not informed consent.

Privacy is kept by unique codes, locked forms, restricted access, and care with photographs and with qualitative quotes. Payment for time and travel is reimbursement. It is not a purchase of risk. Compensation for research-related injury is a duty in interventional work under Indian rules.

ETHICS COMMITTEE
The committee reviews scientific merit and ethical merit before the first participant is approached. It continues to review, and it may monitor a site.

Composition, as used in examination answers: at least seven members; a chairperson from outside the host institution; a member secretary from the institution; a mix that includes a basic medical scientist, clinicians, a legal expert, a social scientist or ethicist or theologian, and a lay person; attention to gender; and no member with a conflict of interest sitting on that protocol.

The file submitted usually contains the protocol, the participant information sheet, consent forms in the local language, the tools, the investigators’ summaries of training, the CTRI number when the study is a trial, and the plan for insurance or compensation in a trial.

Elements of the review (what the committee actually looks at): scientific merit and whether human participants are essential; risk and benefit; the consent process and the language of the sheet; selection of participants and safeguards for the vulnerable; privacy and data security; compensation for research-related harm; conflict of interest; and, for a trial, registration and insurance. A methodologically weak study that cannot answer its question is also ethically weak: people would be used to no purpose.

The member secretary screens incoming work. Three paths are used:

1. Exemption from review: less than minimal risk (some anonymous educational surveys).
2. Expedited review: minimal risk (review of existing records, a minor change to an already approved protocol).
3. Full committee review: more than minimal risk (blood, invasive tests, an intervention).

The meeting may approve, approve with modifications, or reject. Approval is required before the first participant is approached. Multicentre work may use single-review arrangements that are being developed nationally; the local site remains responsible for local context.

Observational dissertations in Indian medical colleges still require committee approval. They are not “only a survey” in the sense that exempts them.

VULNERABLE GROUPS AND PUBLIC HEALTH RESEARCH
The 2017 guidelines treat vulnerability as reduced ability to protect one’s own interests. Groups named there, and expected in an examination answer, include:

- Children: parental or LAR permission plus assent when the child can understand. A dedicated ICMR guideline for children sits beside the 2017 general text.
- Pregnant women and the foetus: extra justification; no convenience sampling of antenatal clinics for an unrelated question.
- Persons with mental illness or cognitive impairment: capacity is assessed; a LAR acts when capacity is lacking.
- Tribal communities: community-level processes as well as individual consent; the work should not deepen historic harm.
- Hierarchical subordinates (students, employees, prisoners, institutionalised persons): they are easy to recruit and hard to refuse. That is the reason not to use them as a default sample.
- The very poor, sex workers, sexual minorities, and the terminally ill: extra safeguards against inducement and against identification.

They are not to be sampled merely because they sit in the next room. Extra justification and extra safeguards are required.

Public health research (cluster trials, use of routine information systems, work in emergencies) has its own section in the 2017 guidelines. Altered or waived consent may be argued for some evaluations, but only with committee approval and with community engagement. Tuskegee and the wartime camp experiments are the reason this machinery exists. They need only a few lines in an answer; the 2017 principles and the consent process need the rest.

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
Work plan (a Gantt chart of months against activities). Typical rows: ethics approval, pre-test, recruitment, follow-up, entry, analysis, writing. Typical columns: months 1 to 12. Shading shows when each row is active. Two activities that need the same person in the same week are a planning error, not a software error.

Budget and its justification. Ordinary heads: personnel (investigator time, field worker, data entry); travel; consumables and investigations; equipment (only what the study must buy); contingency (a small stated percentage); overhead if the institution charges it. Each line has a quantity, a unit cost, and a sentence of justification. A budget that hides a laptop “for the study” when the college already has one will be asked about.

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

INTERPRETING THE STUDY FINDINGS
A statistically significant result is not automatically a clinically useful one. Two teaching examples make the point.

A 2 mm Hg difference in systolic pressure between drug A and drug B may become “significant” when each group grows from 100 to 300. The difference is still 2 mm Hg. The clinician has to say whether that difference matters.

Conversely, a large difference in cure (30 percent versus 60 percent) may fail to reach P less than 0.05 when each group has only 20 patients, and become significant at 30 per group. The size of the effect was always large. The first study was under-powered.

Hence interpretation asks more than “was P below 0.05?”

For a descriptive study: give the point estimate with a confidence interval, not the point alone. The interval is the range in which the reference population value is likely to lie.

For an analytical study, five questions:

1. What is the measure of association (relative risk, odds ratio, difference of means)?
2. What is its confidence interval (precision)?
3. What is the chance of a Type I error (P)?
4. What systematic error remains (selection, measurement, confounding)?
5. What is the utility: is the association likely to be causal (Bradford Hill criteria below); if an intervention, is it acceptable, safe, and affordable?

Criteria of causal association (Bradford Hill), in the same order and sense as in the Epidemiology chapter:
1. Temporal association. The cause precedes the effect. Order and the length of the interval both matter. This is the essential criterion. A concurrent cohort shows it best.
2. Strength of association. Relative risk in a cohort; odds ratio in a case-control study.
3. Specificity. One factor, one disease. The hardest and the weakest criterion.
4. Consistency. The finding repeats in other places and by other hands.
5. Biological plausibility. Anatomy or physiology can credit the link.
6. Coherence. The association sits with other known facts.
7. Dose–response (biological gradient). More exposure, more effect.
8. Reversibility. Removing the cause lowers the risk (ex-smokers versus current smokers for lung cancer).

A randomised trial is the strongest single study for causation. An ecological study is the weakest for testing a risk-factor link. Indirect association (high altitude and goitre, via iodine) must not be sold as direct cause.

P says nothing about the strength of an association. A very small P with a relative risk of 1.05 is not a public health finding. Association is not causation until the causal criteria have been considered. Chance error is handled by the test and the interval. Bias is handled by the design and by an honest discussion.

Results state what was found. Discussion says what it means. Mixing the two is the commonest fault in a first draft.

THE THESIS
Most Indian universities expect, in something like this order. The purpose of each part is what matters.

- Certificates, declaration, acknowledgements: who did the work and that it is the candidate’s.
- Contents, lists of tables and figures, abbreviations: so a examiner can find a table without hunting.
- Introduction: why this problem, here, now. Ends by pointing at the gap.
- Review of literature: what is known, arranged by theme or by objective, including work that disagrees.
- Aims and objectives: the numbered promises against which the rest will be judged.
- Material and methods: enough to repeat the study. Past tense. The numbers actually achieved.
- Results: what was found, in the order of the objectives. No interpretation.
- Discussion: meaning, other studies, strengths, limits.
- Summary and conclusion: a short close that answers the objectives and does not invent a new claim.
- Recommendations: only what the data can support, written so that a programme officer could act.
- References: Vancouver, every in-text number present.
- Annexures: tool, consent, ethics letter, an excerpt of the master chart.

Practical habits that save months: write the methods while the study is running; lock the analysis plan before looking at unexpected P values; keep dated copies of protocol amendments; show tables to the guide and the statistician before drafting the discussion.

THE ARTICLE
A paper is a conversion of the thesis, not a reduction of font size. The target journal’s instructions and word limit govern the draft. A structured abstract and Medical Subject Headings keywords help retrieval. Authorship follows the four ICMJE criteria (substantial contribution; drafting or critical revision; final approval; accountability). Gift authorship is misconduct. The ICMR Policy on Research Integrity and Publication Ethics (RIPE), 2019, is the Indian institutional reference for plagiarism, fabrication and authorship disputes. Journals that charge authors and skip genuine peer review are not a place to send, or to cite as if they were indexed science.

A short checklist before submission:
- Title represents the content and names the design when it helps.
- Abstract covers objectives, design, subjects, setting, outcomes, results and a conclusion that does not outrun the data.
- Introduction states the question or hypothesis and ties the literature to that question.
- Methods describe design, sample, measurements, analysis and ethics in enough detail to repeat the work.
- Results give numbers with the statements; tables are clear; no opinions in this section.
- Discussion covers strengths and limits, brings past findings in, and does not generalise beyond the sample and the tool.
- References are in the journal’s style and were actually read.
- Terminology and units are uniform. The tone is that of a careful worker, not a salesman.

[SN]Critical appraisal of a journal article[/SN]

CRITICAL APPRAISAL
Publication is not proof. The method decides how far the conclusion can be believed. Evaluation can be done by the author before submission, by peer reviewers, or by a reader who must decide whether to change practice. A qualitative impression (“the paper is good”) is weak. Walking the paper under nine headings is stronger.

1. Title: does it represent the content and the breadth of the study?
2. Authors: are affiliations clear?
3. Abstract: does it cover every component, with actual numbers, and without a conclusion larger than the study?
4. Introduction and literature: is the question or hypothesis stated? Are key references present? Are concepts defined? Is the “big picture” given?
5. Materials and methods (the heaviest heading): are variables, design, bias control, procedure, population, sample size, setting, and tests described, and are they appropriate?
6. Results: do numbers accompany the statements? Are tables efficient and accurate? Is this section free of opinion?
7. Discussion and conclusion: are pluses and minuses covered? Is the talk about this study? Do conclusions stay inside the design, the tool and the sample?
8. References: a reasonable number, actually used, in standard form.
9. General considerations: sections labelled, terms uniform, tone rigorous, writing clear.

Then two practical questions. How would you use this paper in your own setting? What two suggestions would you send the author?

A working sequence for a short note can still be the nine reader’s questions: question; design fit; who was studied; measurement and blinding; confounding; effect size and interval, not only P; whether conclusions stay inside the data; funding and conflict; whether practice here should change.

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
