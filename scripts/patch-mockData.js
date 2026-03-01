const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, '..', 'src', 'data', 'mockData.json');
let data = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

for (let item of data) {
    if (item.subsections) {
        for (let sub of item.subsections) {
            // types_of_data
            if (sub.id === '26-1') {
                sub.content = sub.content.replace(
                    'TYPES OF DATA\n1. QUALITATIVE',
                    'TYPES OF DATA\n\n![Types of Data flowchart](https://storage.googleapis.com/community-med-app.firebasestorage.app/biostats/types_of_data.png)\n\n1. QUALITATIVE'
                );
            }
            // presentation_of_data
            if (sub.id === '26-2') {
                sub.content = sub.content.replace(
                    'DATA PRESENTATION METHODS\nProper presentation transforms raw data into digestible information.\n\n1. TABULATION:',
                    'DATA PRESENTATION METHODS\nProper presentation transforms raw data into digestible information.\n\n![Common Statistical Charts](https://storage.googleapis.com/community-med-app.firebasestorage.app/biostats/presentation_of_data.png)\n\n1. TABULATION:'
                );
            }
            // measures_of_central_tendency
            if (sub.id === '26-3') {
                sub.content = sub.content.replace(
                    "- Pros: Easy to spot, can be used for qualitative data (e.g., the 'mode' blood group).\n\nPERCENTILES AND QUARTILES",
                    "- Pros: Easy to spot, can be used for qualitative data (e.g., the 'mode' blood group).\n\n![Measures of Central Tendency (Image Missing)](https://storage.googleapis.com/community-med-app.firebasestorage.app/biostats/measures_of_central_tendency.png)\n\nPERCENTILES AND QUARTILES"
                );
            }
            // normal_distribution
            if (sub.id === '26-5') {
                sub.content = sub.content.replace(
                    '- Mean +/- 3 Standard Deviations covers approximately 99.73 percent of the observations.\n\nSTANDARD NORMAL DEVIATE',
                    '- Mean +/- 3 Standard Deviations covers approximately 99.73 percent of the observations.\n\n![Normal Distribution Curve](https://storage.googleapis.com/community-med-app.firebasestorage.app/biostats/normal_distribution.png)\n\nSTANDARD NORMAL DEVIATE'
                );
            }
            // hypothesis_testing_errors
            if (sub.id === '26-8') {
                sub.content = sub.content.replace(
                    '- TYPE II ERROR (Beta): False Negative. Accepting the Null Hypothesis when it is actually false. (Saying a life-saving drug is useless).\n\nPOWER OF A TEST:',
                    '- TYPE II ERROR (Beta): False Negative. Accepting the Null Hypothesis when it is actually false. (Saying a life-saving drug is useless).\n\n![Hypothesis Testing Setup](https://storage.googleapis.com/community-med-app.firebasestorage.app/biostats/hypothesis_testing_errors.jpg)\n\nPOWER OF A TEST:'
                );
            }
            // correlation_and_regression
            if (sub.id === '26-12') {
                sub.content = sub.content.replace(
                    '- 0 = No linear correlation at all.\nTests Used: Pearson\'s correlation (for normal, parametric data) and Spearman\'s Rank correlation (for skewed, non-parametric or ordinal data).\n\nREGRESSION',
                    '- 0 = No linear correlation at all.\nTests Used: Pearson\'s correlation (for normal, parametric data) and Spearman\'s Rank correlation (for skewed, non-parametric or ordinal data).\n\n![Correlation Scatter Plots](https://storage.googleapis.com/community-med-app.firebasestorage.app/biostats/correlation_and_regression.png)\n\nREGRESSION'
                );
            }
        }
    }
}

fs.writeFileSync(mockDataPath, JSON.stringify(data, null, 4), 'utf8');
console.log('mockData.json patched successfully.');
