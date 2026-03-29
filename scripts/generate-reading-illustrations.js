const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'reading-illustrations');
const WIDTH = 1600;
const HEIGHT = 900;

const PALETTE = {
    ink: '#11324D',
    navy: '#1B4965',
    teal: '#2F7E79',
    sand: '#F8F4E8',
    coral: '#E76F51',
    slate: '#526D82',
    sky: '#EAF2FF',
    mint: '#E8F8F0',
    peach: '#FFF2E2',
    rose: '#FDE8E5',
    lavender: '#F1ECFF',
    white: '#FFFFFF',
};

const ensureOutputDir = () => {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
};

const roundRect = (ctx, x, y, width, height, radius, fillStyle, strokeStyle = null, lineWidth = 2) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if (strokeStyle) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
};

const drawTitle = (ctx, title, subtitle) => {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 46px Sans';
    ctx.fillText(title, 70, 90);
    ctx.fillStyle = PALETTE.slate;
    ctx.font = '24px Sans';
    ctx.fillText(subtitle, 70, 132);
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight, color = PALETTE.ink, font = '28px Sans', maxLines = 4) => {
    ctx.fillStyle = color;
    ctx.font = font;
    const paragraphs = String(text).split('\n');
    let currentY = y;
    let linesDrawn = 0;

    for (const paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let line = '';

        for (const word of words) {
            const testLine = `${line}${word} `;
            if (ctx.measureText(testLine).width > maxWidth && line) {
                ctx.fillText(line.trim(), x, currentY);
                currentY += lineHeight;
                linesDrawn += 1;
                line = `${word} `;
                if (linesDrawn >= maxLines) return;
            } else {
                line = testLine;
            }
        }

        if (line.trim()) {
            ctx.fillText(line.trim(), x, currentY);
            currentY += lineHeight;
            linesDrawn += 1;
            if (linesDrawn >= maxLines) return;
        }
    }
};

const drawArrow = (ctx, fromX, fromY, toX, toY, color = PALETTE.navy, lineWidth = 6) => {
    const headLength = 18;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
};

const writeCanvas = (fileName, painter) => {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    painter(ctx);
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), canvas.toBuffer('image/png'));
};

const drawMedicineEvolution = (ctx) => {
    drawTitle(ctx, 'Evolution of Medicine', 'From ancient healing systems to primary health care and the SDGs');
    ctx.lineWidth = 8;
    ctx.strokeStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(140, 505);
    ctx.lineTo(1460, 505);
    ctx.stroke();

    const milestones = [
        { x: 90, y: 250, label: 'Ancient systems', note: 'Ayurveda, Chinese,\nEgyptian, Greek, Roman', color: PALETTE.sky },
        { x: 360, y: 560, label: 'Rational medicine', note: 'Hippocrates and\nobservation', color: PALETTE.mint },
        { x: 630, y: 250, label: 'Scientific revival', note: 'Vesalius,\ncontagion, anatomy', color: PALETTE.peach },
        { x: 900, y: 560, label: 'Sanitary awakening', note: 'Snow, Chadwick,\nwater and sanitation', color: PALETTE.rose },
        { x: 1170, y: 250, label: 'Modern public health', note: 'Germ theory, PHC,\nHealth for All, SDGs', color: PALETTE.lavender },
    ];

    milestones.forEach((item, index) => {
        roundRect(ctx, item.x, item.y, 250, 180, 24, item.color, PALETTE.navy);
        ctx.fillStyle = PALETTE.coral;
        ctx.font = '700 24px Sans';
        ctx.fillText(String(index + 1), item.x + 22, item.y + 36);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 28px Sans';
        wrapText(ctx, item.label, item.x + 22, item.y + 68, 200, 30, PALETTE.ink, '700 26px Sans', 2);
        wrapText(ctx, item.note, item.x + 22, item.y + 124, 200, 24, PALETTE.slate, '20px Sans', 3);
        const dotX = item.x + 125;
        ctx.fillStyle = PALETTE.navy;
        ctx.beginPath();
        ctx.arc(dotX, 505, 20, 0, Math.PI * 2);
        ctx.fill();
        drawArrow(ctx, dotX, item.y + (item.y < 400 ? 180 : 0), dotX, item.y < 400 ? 483 : 527, PALETTE.teal, 5);
    });
};

const drawHealthConceptFramework = (ctx) => {
    drawTitle(ctx, 'Health as a Framework', 'Concepts, dimensions, and determinants arranged around holistic health');
    roundRect(ctx, 560, 250, 460, 190, 36, PALETTE.peach, PALETTE.coral, 3);
    ctx.fillStyle = PALETTE.coral;
    ctx.font = '700 34px Sans';
    ctx.fillText('HEALTH', 735, 310);
    wrapText(ctx, 'A dynamic state shaped by\nbody, mind, society,\nand environment.', 635, 355, 320, 34, PALETTE.ink, '27px Sans', 4);

    const concepts = [
        { x: 70, y: 210, title: 'Biomedical', note: 'Absence of disease', color: PALETTE.sky },
        { x: 70, y: 380, title: 'Ecological', note: 'Balance with environment', color: PALETTE.mint },
        { x: 70, y: 550, title: 'Psychosocial', note: 'Social and mental influences', color: PALETTE.peach },
        { x: 70, y: 720, title: 'Holistic', note: 'Integrates all dimensions', color: PALETTE.lavender },
    ];

    concepts.forEach((card) => {
        roundRect(ctx, card.x, card.y, 340, 120, 24, card.color, PALETTE.navy);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 27px Sans';
        ctx.fillText(card.title, card.x + 22, card.y + 42);
        wrapText(ctx, card.note, card.x + 22, card.y + 84, 280, 28, PALETTE.slate, '22px Sans', 2);
        drawArrow(ctx, card.x + 340, card.y + 60, 560, 345, PALETTE.navy, 4);
    });

    ['Biological', 'Behavioural', 'Environment', 'Socio-economic', 'Health system', 'Ageing and gender'].forEach((label, index) => {
        const y = 190 + index * 95;
        roundRect(ctx, 1120, y, 330, 64, 18, PALETTE.white, PALETTE.teal);
        ctx.fillStyle = PALETTE.teal;
        ctx.font = '700 24px Sans';
        ctx.fillText(label, 1146, y + 40);
        drawArrow(ctx, 1020, 345, 1120, y + 32, PALETTE.teal, 4);
    });

    ['Physical', 'Mental', 'Social', 'Spiritual', 'Emotional', 'Vocational'].forEach((label, index) => {
        const x = 160 + index * 205;
        roundRect(ctx, x, 680, 175, 68, 34, PALETTE.white, PALETTE.coral);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 21px Sans';
        ctx.fillText(label, x + 30, 722);
    });
};

const drawStudyDesignComparison = (ctx) => {
    drawTitle(ctx, 'Analytical Study Designs', 'Direction, unit of analysis, and common measure at a glance');
    const cards = [
        { x: 70, y: 200, title: 'Case control', subtitle: 'Disease to exposure', body: 'Rare diseases\nOdds ratio\nBackward looking', color: PALETTE.sky },
        { x: 830, y: 200, title: 'Cohort', subtitle: 'Exposure to outcome', body: 'Rare exposures\nRelative risk\nProspective possible', color: PALETTE.mint },
        { x: 70, y: 520, title: 'Cross sectional', subtitle: 'Exposure and disease together', body: 'Snapshot in time\nPrevalence\nSurvey friendly', color: PALETTE.peach },
        { x: 830, y: 520, title: 'Ecological', subtitle: 'Group-level comparison', body: 'Population data\nHypothesis generating\nEcological fallacy risk', color: PALETTE.lavender },
    ];

    cards.forEach((card) => {
        roundRect(ctx, card.x, card.y, 700, 220, 28, card.color, PALETTE.navy);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 34px Sans';
        ctx.fillText(card.title, card.x + 28, card.y + 52);
        ctx.fillStyle = PALETTE.teal;
        ctx.font = '700 24px Sans';
        ctx.fillText(card.subtitle, card.x + 28, card.y + 92);
        wrapText(ctx, `- ${card.body.replace(/\n/g, '\n- ')}`, card.x + 28, card.y + 140, 270, 30, PALETTE.slate, '24px Sans', 4);
    });

    ctx.fillStyle = PALETTE.coral;
    ctx.font = '700 24px Sans';
    ctx.fillText('Looks backward', 430, 318);
    drawArrow(ctx, 360, 330, 600, 330, PALETTE.coral, 6);
    ctx.fillText('Follows forward', 1030, 318);
    drawArrow(ctx, 980, 330, 1220, 330, PALETTE.coral, 6);
};

const drawChainOfInfection = (ctx) => {
    drawTitle(ctx, 'Chain of Infection', 'Six links that sustain transmission and the intervention points that break the chain');
    const centerX = 800;
    const centerY = 520;
    const radius = 290;
    const steps = [
        { label: 'Agent', note: 'Bacteria, virus,\nparasite', angle: -Math.PI / 2, color: PALETTE.sky },
        { label: 'Reservoir', note: 'Human, animal,\nenvironment', angle: -Math.PI / 6, color: PALETTE.mint },
        { label: 'Portal of exit', note: 'Respiratory,\nfecal, blood', angle: Math.PI / 6, color: PALETTE.peach },
        { label: 'Transmission', note: 'Contact, droplet,\nvehicle, vector', angle: Math.PI / 2, color: PALETTE.rose },
        { label: 'Portal of entry', note: 'Mouth, nose,\nskin, placenta', angle: (5 * Math.PI) / 6, color: PALETTE.lavender },
        { label: 'Susceptible host', note: 'Age, immunity,\nrisk factors', angle: (7 * Math.PI) / 6, color: '#EAF7F7' },
    ];

    roundRect(ctx, 655, 405, 290, 180, 32, PALETTE.white, PALETTE.coral, 3);
    ctx.fillStyle = PALETTE.coral;
    ctx.font = '700 30px Sans';
    ctx.fillText('Break the chain', 710, 458);
    wrapText(ctx, 'Vaccination\nIsolation and PPE\nSanitation and disinfection', 705, 500, 190, 30, PALETTE.ink, '23px Sans', 4);

    steps.forEach((step) => {
        const x = centerX + Math.cos(step.angle) * radius - 120;
        const y = centerY + Math.sin(step.angle) * radius - 78;
        roundRect(ctx, x, y, 240, 156, 24, step.color, PALETTE.navy);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 28px Sans';
        ctx.fillText(step.label, x + 20, y + 40);
        wrapText(ctx, step.note, x + 20, y + 84, 190, 28, PALETTE.slate, '22px Sans', 3);
    });

    for (let index = 0; index < steps.length; index += 1) {
        const current = steps[index].angle;
        const next = steps[(index + 1) % steps.length].angle;
        drawArrow(
            ctx,
            centerX + Math.cos(current) * 185,
            centerY + Math.sin(current) * 185,
            centerX + Math.cos(next) * 185,
            centerY + Math.sin(next) * 185,
            PALETTE.teal,
            5
        );
    }
};

const drawColdChainLadder = (ctx) => {
    drawTitle(ctx, 'Cold Chain in Practice', 'Vaccines stay potent only if the full chain stays within safe temperature limits');
    const levels = [
        { x: 70, y: 640, title: 'National store', note: 'Walk-in coolers\nILR + deep freezers' },
        { x: 350, y: 520, title: 'State / regional', note: 'Cold rooms\nand transport' },
        { x: 630, y: 400, title: 'District store', note: 'ILR, DF,\ntemperature log' },
        { x: 910, y: 280, title: 'PHC / CHC', note: 'ILR +\nsession planning' },
        { x: 1190, y: 160, title: 'Session site', note: 'Vaccine carrier\nwith conditioned ice packs' },
    ];

    roundRect(ctx, 980, 570, 510, 230, 28, PALETTE.white, PALETTE.teal);
    ctx.fillStyle = PALETTE.teal;
    ctx.font = '700 28px Sans';
    ctx.fillText('Temperature discipline', 1020, 626);
    wrapText(ctx, 'Most vaccines: +2 C to +8 C\nFreeze-sensitive vaccines need careful handling\nVVM and shake test detect heat damage\nand freeze damage', 1020, 674, 410, 28, PALETTE.ink, '21px Sans', 6);

    levels.forEach((level, index) => {
        roundRect(ctx, level.x, level.y, 270, 150, 24, PALETTE.white, PALETTE.navy);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 28px Sans';
        ctx.fillText(level.title, level.x + 22, level.y + 46);
        wrapText(ctx, level.note, level.x + 22, level.y + 86, 220, 28, PALETTE.slate, '22px Sans', 3);
        if (index < levels.length - 1) {
            drawArrow(ctx, level.x + 270, level.y + 75, levels[index + 1].x, levels[index + 1].y + 75, PALETTE.coral, 6);
        }
    });
};

const drawWaterPurificationFlow = (ctx) => {
    drawTitle(ctx, 'Large-Scale Water Purification', 'The treatment pathway from raw source water to safe distribution');
    const steps = [
        { x: 60, title: 'Storage', note: 'Sedimentation +\nnatural purification', color: PALETTE.sky },
        { x: 360, title: 'Filtration', note: 'Slow sand or\nrapid sand filter', color: PALETTE.mint },
        { x: 660, title: 'Chlorination', note: 'Disinfection +\nresidual chlorine', color: PALETTE.peach },
        { x: 960, title: 'Quality check', note: 'FRC, coliforms,\nacceptability', color: PALETTE.rose },
        { x: 1260, title: 'Safe supply', note: 'Protected distribution\nto households', color: PALETTE.lavender },
    ];

    steps.forEach((step, index) => {
        roundRect(ctx, step.x, 330, 260, 180, 28, step.color, PALETTE.navy);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 32px Sans';
        ctx.fillText(step.title, step.x + 24, 386);
        wrapText(ctx, step.note, step.x + 24, 434, 200, 30, PALETTE.slate, '23px Sans', 3);
        if (index < steps.length - 1) {
            drawArrow(ctx, step.x + 260, 420, steps[index + 1].x, 420, PALETTE.teal, 7);
        }
    });

    roundRect(ctx, 150, 590, 580, 210, 28, PALETTE.white, PALETTE.teal);
    ctx.fillStyle = PALETTE.teal;
    ctx.font = '700 28px Sans';
    ctx.fillText('Filter comparison cue', 190, 654);
    wrapText(ctx, 'Slow sand = biological,\nschmutzdecke, slower but high quality.\nRapid sand = mechanical, faster,\nneeds coagulation and backwashing.', 190, 692, 490, 28, PALETTE.ink, '21px Sans', 6);

    roundRect(ctx, 860, 590, 580, 210, 28, PALETTE.white, PALETTE.coral);
    ctx.fillStyle = PALETTE.coral;
    ctx.font = '700 28px Sans';
    ctx.fillText('Chlorination cue', 900, 654);
    wrapText(ctx, 'Free residual chlorine verifies effective disinfection.\nBreakpoint chlorination satisfies chlorine demand\nbefore residual appears.', 900, 692, 490, 28, PALETTE.ink, '21px Sans', 6);
};

const drawBiomedicalWasteSegregation = (ctx) => {
    drawTitle(ctx, 'Biomedical Waste Segregation', 'Color coding matters because each bin leads to a different treatment pathway');
    const bins = [
        { x: 70, title: 'Yellow', color: '#F4D35E', items: ['Human anatomical waste', 'Soiled dressings', 'Expired medicines'], note: 'Incineration / deep burial' },
        { x: 430, title: 'Red', color: '#EE6C73', items: ['IV sets and tubing', 'Catheters', 'Contaminated plastics'], note: 'Autoclave, shred, recycle' },
        { x: 790, title: 'White', color: '#F3F4F6', items: ['Needles', 'Blades', 'Sharps'], note: 'Sharps pit / encapsulation' },
        { x: 1150, title: 'Blue', color: '#7BC8F6', items: ['Glassware', 'Vials', 'Metallic implants'], note: 'Disinfect then recycle' },
    ];

    bins.forEach((bin) => {
        roundRect(ctx, bin.x, 220, 300, 470, 30, PALETTE.white, PALETTE.navy);
        roundRect(ctx, bin.x + 30, 250, 240, 70, 24, bin.color, PALETTE.navy);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 30px Sans';
        ctx.fillText(bin.title, bin.x + 105, 295);
        bin.items.forEach((item, index) => {
            ctx.fillStyle = PALETTE.ink;
            ctx.font = '23px Sans';
            ctx.fillText(`- ${item}`, bin.x + 34, 380 + (index * 54));
        });
        roundRect(ctx, bin.x + 26, 560, 248, 90, 20, PALETTE.sky, PALETTE.teal);
        wrapText(ctx, bin.note, bin.x + 40, 612, 220, 30, PALETTE.teal, '700 22px Sans', 3);
    });
};

const drawDisasterManagementCycle = (ctx) => {
    drawTitle(ctx, 'Disaster Management Cycle', 'Disaster work is continuous: each phase prepares the next');
    const centerX = 610;
    const centerY = 500;
    const radius = 290;
    const phases = [
        { label: 'Mitigation', angle: -Math.PI / 2, color: PALETTE.sky, note: 'Reduce risk\nbefore impact' },
        { label: 'Preparedness', angle: 0, color: PALETTE.mint, note: 'Plans, drills,\nstockpiles' },
        { label: 'Response', angle: Math.PI / 2, color: PALETTE.peach, note: 'Triage,\nrescue, relief' },
        { label: 'Recovery', angle: Math.PI, color: PALETTE.rose, note: 'Rehabilitation\nand rebuild' },
    ];

    roundRect(ctx, 500, 445, 220, 105, 26, PALETTE.white, PALETTE.coral, 3);
    ctx.fillStyle = PALETTE.coral;
    ctx.font = '700 26px Sans';
    ctx.fillText('Ongoing loop', 545, 485);
    wrapText(ctx, 'Each phase shapes the next.', 530, 520, 160, 24, PALETTE.ink, '20px Sans', 2);

    phases.forEach((phase, index) => {
        const x = centerX + Math.cos(phase.angle) * radius - 115;
        const y = centerY + Math.sin(phase.angle) * radius - 75;
        roundRect(ctx, x, y, 230, 150, 24, phase.color, PALETTE.navy);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 28px Sans';
        ctx.fillText(phase.label, x + 24, y + 42);
        wrapText(ctx, phase.note, x + 24, y + 84, 180, 28, PALETTE.slate, '22px Sans', 3);
        const next = phases[(index + 1) % phases.length];
        drawArrow(
            ctx,
            centerX + Math.cos(phase.angle) * 150,
            centerY + Math.sin(phase.angle) * 150,
            centerX + Math.cos(next.angle) * 150,
            centerY + Math.sin(next.angle) * 150,
            PALETTE.teal,
            6
        );
    });

    roundRect(ctx, 1040, 250, 420, 340, 28, PALETTE.white, PALETTE.teal);
    ctx.fillStyle = PALETTE.teal;
    ctx.font = '700 28px Sans';
    ctx.fillText('Why this image matters', 1080, 304);
    wrapText(ctx, 'Students often memorize the phases as a list.\nThe cycle view shows why triage and surveillance\nsit inside response, while planning and risk reduction\nhappen before the event.', 1080, 360, 320, 30, PALETTE.ink, '22px Sans', 6);
};

const jobs = [
    ['medicine_evolution_timeline.png', drawMedicineEvolution],
    ['health_concept_framework.png', drawHealthConceptFramework],
    ['study_design_comparison.png', drawStudyDesignComparison],
    ['chain_of_infection.png', drawChainOfInfection],
    ['cold_chain_ladder.png', drawColdChainLadder],
    ['water_purification_flow.png', drawWaterPurificationFlow],
    ['biomedical_waste_segregation.png', drawBiomedicalWasteSegregation],
    ['disaster_management_cycle.png', drawDisasterManagementCycle],
];

ensureOutputDir();
jobs.forEach(([fileName, painter]) => writeCanvas(fileName, painter));
console.log(`Generated ${jobs.length} illustrations in ${OUTPUT_DIR}`);
