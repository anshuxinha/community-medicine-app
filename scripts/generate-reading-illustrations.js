const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'reading-illustrations');
const SIZE = 1400;

const PALETTE = {
    bg: '#F8F4E8',
    ink: '#14324C',
    sub: '#59728A',
    teal: '#2E827A',
    coral: '#E86E52',
    blue: '#DDE8F8',
    green: '#E1F4EC',
    peach: '#FFF0DE',
    rose: '#FCE8E5',
    lavender: '#EEE9FB',
    white: '#FFFFFF',
    yellow: '#F6D96A',
    red: '#EC6970',
    sky: '#73B7E5',
    gray: '#F3F4F6',
};

const ensureOutputDir = () => {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
};

const roundRect = (ctx, x, y, width, height, radius, fillStyle, strokeStyle = PALETTE.ink, lineWidth = 3) => {
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
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
};

const drawTitle = (ctx, title, subtitle) => {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 66px Sans';
    ctx.fillText(title, 72, 108);
    ctx.fillStyle = PALETTE.sub;
    ctx.font = '34px Sans';
    ctx.fillText(subtitle, 72, 160);
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight, font = '30px Sans', color = PALETTE.ink, maxLines = 5) => {
    ctx.font = font;
    ctx.fillStyle = color;
    const paragraphs = String(text).split('\n');
    let currentY = y;
    let lines = 0;

    for (const paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let line = '';
        for (const word of words) {
            const next = `${line}${word} `;
            if (ctx.measureText(next).width > maxWidth && line) {
                ctx.fillText(line.trim(), x, currentY);
                currentY += lineHeight;
                lines += 1;
                line = `${word} `;
                if (lines >= maxLines) return;
            } else {
                line = next;
            }
        }
        if (line.trim()) {
            ctx.fillText(line.trim(), x, currentY);
            currentY += lineHeight;
            lines += 1;
            if (lines >= maxLines) return;
        }
    }
};

const drawArrow = (ctx, fromX, fromY, toX, toY, color = PALETTE.teal, lineWidth = 7) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const head = 20;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - head * Math.cos(angle - Math.PI / 6), toY - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - head * Math.cos(angle + Math.PI / 6), toY - head * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
};

const drawCard = (
    ctx,
    {
        x,
        y,
        w,
        h,
        fill,
        title,
        body,
        badge,
        titleTop,
        bodyTop,
        titleLineHeight = 40,
        bodyLineHeight = 30,
        titleFont = '700 40px Sans',
        bodyFont = '28px Sans',
        maxTitleLines = 2,
        maxBodyLines = 4,
    }
) => {
    roundRect(ctx, x, y, w, h, 28, fill);
    if (badge) {
        ctx.fillStyle = PALETTE.coral;
        ctx.font = '700 34px Sans';
        ctx.fillText(badge, x + 28, y + 46);
    }
    wrapText(
        ctx,
        title,
        x + 28,
        y + (titleTop ?? (badge ? 78 : 70)),
        w - 56,
        titleLineHeight,
        titleFont,
        PALETTE.ink,
        maxTitleLines
    );
    wrapText(
        ctx,
        body,
        x + 28,
        y + (bodyTop ?? (badge ? 122 : 118)),
        w - 56,
        bodyLineHeight,
        bodyFont,
        PALETTE.sub,
        maxBodyLines
    );
};

const writeCanvas = (fileName, painter) => {
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, SIZE, SIZE);
    painter(ctx);
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), canvas.toBuffer('image/png'));
};

const medicineEvolution = (ctx) => {
    drawTitle(ctx, 'Evolution of Medicine', 'Ancient systems to modern public health');
    const steps = [
        { badge: '1', title: 'Ancient systems', body: 'Ayurveda, Chinese,\nEgyptian, Greek, Roman', fill: PALETTE.blue },
        { badge: '2', title: 'Rational medicine', body: 'Hippocrates and\nclinical observation', fill: PALETTE.green },
        { badge: '3', title: 'Scientific revival', body: 'Vesalius, anatomy,\ncontagion theory', fill: PALETTE.peach },
        { badge: '4', title: 'Sanitary awakening', body: 'Snow, Chadwick,\nwater and sanitation', fill: PALETTE.rose },
        { badge: '5', title: 'Modern public health', body: 'Germ theory, PHC,\nHealth for All, SDGs', fill: PALETTE.lavender },
    ];

    let y = 230;
    steps.forEach((step, index) => {
        drawCard(ctx, { x: 150, y, w: 1100, h: 180, bodyTop: 120, bodyLineHeight: 30, ...step });
        if (index < steps.length - 1) {
            drawArrow(ctx, 700, y + 180, 700, y + 205);
        }
        y += 205;
    });
};

const healthFramework = (ctx) => {
    drawTitle(ctx, 'Health as a Framework', 'Concepts, dimensions, and determinants');
    drawCard(ctx, {
        x: 350,
        y: 220,
        w: 700,
        h: 180,
        fill: PALETTE.peach,
        title: 'HEALTH',
        body: 'A dynamic state shaped by body, mind,\nsociety, and environment.',
    });

    const concepts = [
        { x: 80, y: 470, fill: PALETTE.blue, title: 'Biomedical', body: 'Absence of disease' },
        { x: 740, y: 470, fill: PALETTE.green, title: 'Ecological', body: 'Balance with environment' },
        { x: 80, y: 700, fill: PALETTE.peach, title: 'Psychosocial', body: 'Social and mental influences' },
        { x: 740, y: 700, fill: PALETTE.lavender, title: 'Holistic', body: 'Integrates all dimensions' },
    ];
    concepts.forEach((card) => drawCard(ctx, { ...card, w: 580, h: 180 }));

    roundRect(ctx, 170, 1030, 1060, 240, 28, PALETTE.white, PALETTE.teal);
    wrapText(ctx, 'Dimensions: Physical, Mental, Social, Spiritual, Emotional, Vocational', 210, 1094, 980, 46, '700 38px Sans', PALETTE.teal, 3);
    wrapText(ctx, 'Determinants: Biological, Behavioural, Environment, Socio-economic, Health system, Ageing and gender', 210, 1174, 980, 38, '30px Sans', PALETTE.ink, 4);
};

const studyDesigns = (ctx) => {
    drawTitle(ctx, 'Analytical Study Designs', 'Direction, measure, and use-case at a glance');
    const cards = [
        { x: 80, y: 230, fill: PALETTE.blue, title: 'Case control', body: 'Disease to exposure\nRare diseases\nOdds ratio' },
        { x: 740, y: 230, fill: PALETTE.green, title: 'Cohort', body: 'Exposure to outcome\nRare exposures\nRelative risk' },
        { x: 80, y: 690, fill: PALETTE.peach, title: 'Cross sectional', body: 'Exposure + disease together\nSnapshot survey\nPrevalence' },
        { x: 740, y: 690, fill: PALETTE.lavender, title: 'Ecological', body: 'Group-level comparison\nHypothesis generating\nEcological fallacy risk' },
    ];
    cards.forEach((card) => drawCard(ctx, { ...card, w: 580, h: 360 }));
};

const chainOfInfection = (ctx) => {
    drawTitle(ctx, 'Chain of Infection', 'Six links and the points where prevention breaks transmission');
    roundRect(ctx, 430, 520, 540, 170, 30, PALETTE.white, PALETTE.coral);
    wrapText(ctx, 'Break the chain', 520, 582, 360, 48, '700 52px Sans', PALETTE.coral, 1);
    wrapText(ctx, 'Vaccination, isolation,\nsanitation, PPE,\ndisinfection', 540, 640, 320, 32, '28px Sans', PALETTE.ink, 3);

    const nodes = [
        { x: 500, y: 240, w: 400, h: 190, fill: PALETTE.blue, title: 'Agent', body: 'Bacteria, virus,\nparasite' },
        { x: 930, y: 380, w: 330, h: 190, fill: PALETTE.green, title: 'Reservoir', body: 'Human, animal,\nenvironment' },
        { x: 930, y: 760, w: 330, h: 190, fill: PALETTE.peach, title: 'Portal of exit', body: 'Respiratory,\nfecal, blood' },
        { x: 500, y: 960, w: 400, h: 190, fill: PALETTE.rose, title: 'Transmission', body: 'Contact, droplet,\nvehicle, vector' },
        { x: 140, y: 760, w: 400, h: 190, fill: PALETTE.lavender, title: 'Portal of entry', body: 'Mouth, nose,\nskin, placenta' },
        { x: 70, y: 380, w: 410, h: 190, fill: '#EAF7F7', title: 'Susceptible host', body: 'Age, immunity,\nrisk factors' },
    ];
    nodes.forEach((node) => drawCard(ctx, { bodyTop: 120, bodyLineHeight: 30, ...node }));

    drawArrow(ctx, 500, 430, 380, 500);
    drawArrow(ctx, 1095, 570, 1095, 760);
    drawArrow(ctx, 930, 950, 700, 1045);
    drawArrow(ctx, 500, 1055, 300, 950);
    drawArrow(ctx, 270, 760, 270, 570);
    drawArrow(ctx, 480, 420, 540, 300);
};

const coldChain = (ctx) => {
    drawTitle(ctx, 'Cold Chain in Practice', 'A vertical ladder from national store to session site');
    const steps = [
        { title: 'National store', body: 'Walk-in coolers\nILR + deep freezers', fill: PALETTE.blue },
        { title: 'State / regional', body: 'Cold rooms\nand transport', fill: PALETTE.green },
        { title: 'District store', body: 'ILR, DF,\ntemperature log', fill: PALETTE.peach },
        { title: 'PHC / CHC', body: 'ILR +\nsession planning', fill: PALETTE.rose },
        { title: 'Session site', body: 'Vaccine carrier\nwith conditioned ice packs', fill: PALETTE.lavender },
    ];

    let y = 235;
    steps.forEach((step, index) => {
        drawCard(ctx, { x: 170, y, w: 760, h: 175, bodyTop: 118, bodyLineHeight: 30, ...step });
        if (index < steps.length - 1) {
            drawArrow(ctx, 550, y + 175, 550, y + 200);
        }
        y += 200;
    });

    roundRect(ctx, 980, 320, 300, 760, 28, PALETTE.white, PALETTE.teal);
    wrapText(ctx, 'Temperature discipline', 1015, 400, 230, 44, '700 42px Sans', PALETTE.teal, 2);
    wrapText(ctx, 'Most vaccines: +2 C to +8 C\nFreeze-sensitive vaccines need careful handling\nVVM and shake test detect heat and freeze damage', 1015, 500, 230, 34, '28px Sans', PALETTE.ink, 8);
};

const waterPurification = (ctx) => {
    drawTitle(ctx, 'Large-Scale Water Purification', 'The treatment pathway from source water to safe supply');
    const steps = [
        { title: 'Storage', body: 'Sedimentation +\nnatural purification', fill: PALETTE.blue },
        { title: 'Filtration', body: 'Slow sand or\nrapid sand filter', fill: PALETTE.green },
        { title: 'Chlorination', body: 'Disinfection +\nresidual chlorine', fill: PALETTE.peach },
        { title: 'Quality check', body: 'FRC, coliforms,\nacceptability', fill: PALETTE.rose },
        { title: 'Safe supply', body: 'Protected distribution\nto households', fill: PALETTE.lavender },
    ];

    let y = 235;
    steps.forEach((step, index) => {
        drawCard(ctx, { x: 150, y, w: 1100, h: 160, bodyTop: 116, bodyLineHeight: 30, ...step });
        if (index < steps.length - 1) {
            drawArrow(ctx, 700, y + 160, 700, y + 190);
        }
        y += 190;
    });

    roundRect(ctx, 150, 1148, 520, 232, 28, PALETTE.white, PALETTE.teal);
    wrapText(ctx, 'Filter comparison cue', 190, 1210, 440, 40, '700 38px Sans', PALETTE.teal, 2);
    wrapText(ctx, 'Slow sand = biological,\nslower, high quality.\nRapid sand = faster,\nneeds coagulation /\nbackwashing.', 190, 1250, 440, 27, '25px Sans', PALETTE.ink, 5);

    roundRect(ctx, 730, 1148, 520, 232, 28, PALETTE.white, PALETTE.coral);
    wrapText(ctx, 'Chlorination cue', 770, 1210, 440, 40, '700 38px Sans', PALETTE.coral, 2);
    wrapText(ctx, 'Residual chlorine proves\neffective disinfection.\nBreakpoint chlorination meets\ndemand before residual\nappears.', 770, 1254, 440, 27, '25px Sans', PALETTE.ink, 5);
};

const biomedicalWaste = (ctx) => {
    drawTitle(ctx, 'Biomedical Waste Segregation', 'Color coding and disposal pathway at a glance');
    const bins = [
        { x: 80, y: 240, fill: PALETTE.yellow, title: 'Yellow', body: '- Human anatomical waste\n- Soiled dressings\n- Expired medicines', footer: 'Incineration /\ndeep burial' },
        { x: 740, y: 240, fill: PALETTE.red, title: 'Red', body: '- IV sets and tubing\n- Catheters\n- Contaminated plastics', footer: 'Autoclave, shred,\nrecycle' },
        { x: 80, y: 760, fill: PALETTE.gray, title: 'White', body: '- Needles\n- Blades\n- Sharps', footer: 'Sharps pit /\nencapsulation' },
        { x: 740, y: 760, fill: PALETTE.sky, title: 'Blue', body: '- Glassware\n- Vials\n- Metallic implants', footer: 'Disinfect then\nrecycle' },
    ];

    bins.forEach((bin) => {
        roundRect(ctx, bin.x, bin.y, 580, 430, 28, PALETTE.white);
        roundRect(ctx, bin.x + 45, bin.y + 38, 490, 88, 26, bin.fill);
        wrapText(ctx, bin.title, bin.x + 215, bin.y + 98, 180, 40, '700 44px Sans', PALETTE.ink, 1);
        wrapText(ctx, bin.body, bin.x + 45, bin.y + 190, 450, 42, '30px Sans', PALETTE.ink, 4);
        roundRect(ctx, bin.x + 45, bin.y + 310, 490, 90, 22, '#E7EFFB', PALETTE.teal);
        wrapText(ctx, bin.footer, bin.x + 75, bin.y + 360, 430, 34, '700 28px Sans', PALETTE.teal, 3);
    });
};

const disasterCycle = (ctx) => {
    drawTitle(ctx, 'Disaster Management Cycle', 'Think of disaster work as a loop, not a one-time event');
    roundRect(ctx, 460, 520, 480, 190, 30, PALETTE.white, PALETTE.coral);
    wrapText(ctx, 'Ongoing loop', 575, 592, 250, 48, '700 54px Sans', PALETTE.coral, 1);
    wrapText(ctx, 'Each phase feeds\ninto the next.', 550, 638, 300, 32, '29px Sans', PALETTE.ink, 2);

    const phases = [
        { x: 470, y: 220, fill: PALETTE.blue, title: 'Mitigation', body: 'Reduce risk\nbefore impact' },
        { x: 930, y: 520, fill: PALETTE.green, title: 'Preparedness', body: 'Plans, drills,\nstockpiles' },
        { x: 470, y: 860, fill: PALETTE.peach, title: 'Response', body: 'Triage, rescue,\nrelief' },
        { x: 10, y: 520, fill: PALETTE.rose, title: 'Recovery', body: 'Rehabilitation\nand rebuild' },
    ];
    phases.forEach((phase) => drawCard(ctx, { ...phase, w: 460, h: 200, bodyTop: 124, bodyLineHeight: 30 }));

    drawArrow(ctx, 700, 390, 1030, 520);
    drawArrow(ctx, 1030, 690, 700, 860);
    drawArrow(ctx, 470, 1030, 240, 690);
    drawArrow(ctx, 240, 520, 590, 390);
};

ensureOutputDir();

[
    ['medicine_evolution_timeline.png', medicineEvolution],
    ['health_concept_framework.png', healthFramework],
    ['study_design_comparison.png', studyDesigns],
    ['chain_of_infection.png', chainOfInfection],
    ['cold_chain_ladder.png', coldChain],
    ['water_purification_flow.png', waterPurification],
    ['biomedical_waste_segregation.png', biomedicalWaste],
    ['disaster_management_cycle.png', disasterCycle],
].forEach(([fileName, painter]) => writeCanvas(fileName, painter));

console.log('Generated square reading illustrations.');
