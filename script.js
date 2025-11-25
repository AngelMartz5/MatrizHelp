// VARIABLES GLOBALES
const defaultMatrix = [
    [2, -1,  0,  3,  1,  0,  2],
    [1,  2, -1,  0,  4,  1, -1],
    [0,  1,  3, -2,  0,  2,  1],
    [3,  0, -1,  1,  2, -1,  0],
    [2,  1,  0,  4, -1,  0,  3],
    [0, -2,  1,  0,  3,  2,  1],
    [1,  0,  2, -1,  1,  0,  2]
];

let historyStack = [];

// --- EVENT LISTENERS ---
document.getElementById('btn-generate').addEventListener('click', () => {
    historyStack = [];
    updateNavUI();
    generateInputs();
});
document.getElementById('btn-calc').addEventListener('click', calculateMinors);
document.getElementById('row-select').addEventListener('change', highlightSelectedRow);
document.getElementById('btn-back').addEventListener('click', goBack);

// --- LOGICA MATEMÁTICA ---
function getDeterminant(matrix) {
    const n = matrix.length;
    if (n === 0) return 1; 
    if (n === 1) return matrix[0][0];
    if (n === 2) return (matrix[0][0] * matrix[1][1]) - (matrix[0][1] * matrix[1][0]);

    let det = 0;
    for (let col = 0; col < n; col++) {
        const subMatrix = getSubMatrix(matrix, 0, col);
        det += matrix[0][col] * Math.pow(-1, col) * getDeterminant(subMatrix);
    }
    return det;
}

function getSubMatrix(matrix, r, c) {
    return matrix
        .filter((_, rowIndex) => rowIndex !== r)
        .map(row => row.filter((_, colIndex) => colIndex !== c));
}

// --- INTERFAZ ---
function generateInputs(customData = null) {
    const sizeInput = document.getElementById('size');
    let size = parseInt(sizeInput.value);

    if (customData) { 
        size = customData.length; 
        sizeInput.value = size; 
    }

    const rowSelect = document.getElementById('row-select');
    rowSelect.innerHTML = '';
    for(let i=0; i<size; i++) {
        const option = document.createElement('option');
        option.value = i; 
        option.text = `Fila ${i+1}`;
        rowSelect.appendChild(option);
    }

    const container = document.getElementById('matrix-container');
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.innerHTML = '';

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const input = document.createElement('input');
            input.type = 'number'; input.id = `m-${i}-${j}`;
            input.value = customData ? customData[i][j] : 0;
            input.addEventListener('focus', function() { this.select(); });
            input.addEventListener('keydown', (e) => handleEnterNavigation(e, i, j, size));
            container.appendChild(input);
        }
    }
    
    document.getElementById('results-area').style.display = 'none';
    highlightSelectedRow();
}

// --- HISTORIAL ---
function getCurrentMatrixData() {
    const size = parseInt(document.getElementById('size').value);
    let currentMatrix = [];
    for (let i = 0; i < size; i++) {
        let row = [];
        for (let j = 0; j < size; j++) {
            const val = parseFloat(document.getElementById(`m-${i}-${j}`).value) || 0;
            row.push(val);
        }
        currentMatrix.push(row);
    }
    return currentMatrix;
}

function promoteToMain(matrixData) {
    const currentData = getCurrentMatrixData();
    const currentRow = parseInt(document.getElementById('row-select').value);
    
    historyStack.push({ data: currentData, selectedRow: currentRow });
    updateNavUI();
    generateInputs(matrixData);
    
    const toast = document.getElementById('toast-message');
    toast.innerText = "🔍 Zoom aplicado. Usa 'Volver' para regresar.";
    toast.className = "toast show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(calculateMinors, 500); 
}

function goBack() {
    if (historyStack.length > 0) {
        const prevState = historyStack.pop(); 
        updateNavUI();
        
        generateInputs(prevState.data);
        document.getElementById('row-select').value = prevState.selectedRow;
        highlightSelectedRow();
        
        const toast = document.getElementById('toast-message');
        toast.innerText = "⬅ Regresando...";
        toast.className = "toast show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 2000);
        
        setTimeout(calculateMinors, 500); 
    }
}

function updateNavUI() {
    const navBar = document.getElementById('nav-bar');
    const levelInd = document.getElementById('level-indicator');
    if (historyStack.length > 0) {
        navBar.style.display = 'flex';
        levelInd.innerText = `Nivel: ${historyStack.length + 1}`;
    } else {
        navBar.style.display = 'none';
    }
}

// --- UTILIDADES ---
function highlightSelectedRow() {
    const size = parseInt(document.getElementById('size').value);
    const selectedRow = parseInt(document.getElementById('row-select').value);
    document.querySelectorAll('#matrix-container input').forEach(inp => inp.classList.remove('active-row', 'is-zero'));
    
    for(let j=0; j<size; j++) {
        const input = document.getElementById(`m-${selectedRow}-${j}`);
        if(input) {
            input.classList.add('active-row');
            if(parseFloat(input.value) === 0) input.classList.add('is-zero');
        }
    }
}

function handleEnterNavigation(e, currentR, currentC, size) {
    if (e.key === "Enter") {
        e.preventDefault();
        let nextC = currentC + 1; let nextR = currentR;
        if (nextC >= size) { nextC = 0; nextR = currentR + 1; }
        if (nextR >= size) { nextR = 0; nextC = 0; }
        const nextInput = document.getElementById(`m-${nextR}-${nextC}`);
        if (nextInput) nextInput.focus();
    }
}

function renderMatrixHtml(matrix) {
    const size = matrix.length;
    let html = `<div class="matrix-display" style="grid-template-columns: repeat(${size}, 1fr)">`;
    matrix.forEach(row => {
        row.forEach(val => {
            let displayVal = Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
            html += `<div class="matrix-cell">${displayVal}</div>`;
        });
    });
    html += `</div>`;
    return html;
}

// --- CÁLCULO ---
function calculateMinors() {
    const resultsArea = document.getElementById('results-area');
    resultsArea.style.display = 'block';
    const resultsGrid = document.getElementById('results');
    const formulaDisplay = document.getElementById('formula-display');
    
    resultsGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1;">Calculando...</p>';
    formulaDisplay.innerHTML = '';

    setTimeout(() => {
        const currentData = getCurrentMatrixData(); 
        const size = currentData.length;
        const selectedRow = parseInt(document.getElementById('row-select').value);

        const mainDet = getDeterminant(currentData);
        document.getElementById('main-det').innerText = `Determinante Total: ${mainDet}`;
        resultsGrid.innerHTML = '';

        let formulaHTML = '';

        for (let j = 0; j < size; j++) {
            const multiplier = currentData[selectedRow][j];
            const sign = Math.pow(-1, selectedRow + j);
            const minorMatrix = getSubMatrix(currentData, selectedRow, j);
            const minorDet = getDeterminant(minorMatrix);
            const isZero = multiplier === 0;

            let displaySign = (j === 0 && sign === 1) ? '' : (sign === 1 ? '+' : '-');
            formulaHTML += `
                <div class="formula-term ${isZero ? 'term-zero' : ''}">
                    <span class="math-sign">${displaySign}</span>
                    <span class="multiplier">${multiplier}</span>
                    <span>× (${minorDet})</span>
                </div>
            `;

            const card = document.createElement('div');
            card.className = `minor-card ${isZero ? 'zero-impact' : ''}`;
            card.innerHTML = `
                <div class="minor-card-header">
                    <h3>${isZero?'⚠️ ':''}Múltiplo: <b>${multiplier}</b> [F${selectedRow+1},C${j+1}]</h3>
                </div>
                <div class="minor-card-body">
                    ${renderMatrixHtml(minorMatrix)}
                    <div class="result-det">Det: <span>${minorDet}</span></div>
                    ${isZero ? '<p style="color:var(--danger); margin-top:5px; font-size:0.8rem">Se anula (x0)</p>' : ''}
                </div>
            `;

            if (minorMatrix.length >= 2) {
                const footer = document.createElement('div');
                footer.className = 'card-footer';
                
                const promoteBtn = document.createElement('button');
                promoteBtn.className = 'promote-btn';
                promoteBtn.innerHTML = '🔍 Analizar como Principal';
                promoteBtn.onclick = () => promoteToMain(minorMatrix);
                footer.appendChild(promoteBtn);

                if(!isZero) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'toggle-btn';
                    toggleBtn.innerText = 'Ver Submatrices Internas ↓';
                    footer.appendChild(toggleBtn);
                    
                    const nestedContainer = document.createElement('div');
                    nestedContainer.className = 'nested-container';
                    toggleBtn.addEventListener('click', function() {
                        toggleNestedView(this, nestedContainer, minorMatrix);
                    });
                    card.appendChild(nestedContainer);
                }
                card.appendChild(footer);
            }
            resultsGrid.appendChild(card);
        }
        formulaDisplay.innerHTML = formulaHTML;
    }, 50);
}

function generateCofactorFormulaHtml(matrix) {
    const size = matrix.length;
    const selectedRow = 0; 
    let formulaParts = [];
    for (let j = 0; j < size; j++) {
        const multiplier = matrix[selectedRow][j];
        const sign = Math.pow(-1, selectedRow + j);
        const displaySign = sign === 1 ? '+' : '-';
        const nextSubMatrix = getSubMatrix(matrix, selectedRow, j);
        const nextDet = getDeterminant(nextSubMatrix);
        if (multiplier !== 0) {
             formulaParts.push(`${displaySign} ${multiplier}·(${nextDet})`);
        }
    }
    if (formulaParts.length === 0) return "0";
    let finalFormula = formulaParts.join(' ');
    if (finalFormula.startsWith('+ ')) finalFormula = finalFormula.substring(2);
    return `<b>Desarrollo F1:</b> ${finalFormula} = <b>${getDeterminant(matrix)}</b>`;
}

function toggleNestedView(btn, container, parentMatrix) {
    const isHidden = container.style.display === 'none' || container.style.display === '';

    if (isHidden) {
        btn.innerText = 'Ocultar Submatrices ↑';
        btn.classList.add('active');
        container.style.display = 'block';

        if (container.innerHTML === '') {
            container.innerHTML = '<p>Cargando...</p>';
            setTimeout(() => {
                container.innerHTML = ''; 
                const size = parentMatrix.length;
                const expansionRow = 0; 
                for(let nj=0; nj < size; nj++) {
                     const multiplier = parentMatrix[expansionRow][nj];
                     const subSubMatrix = getSubMatrix(parentMatrix, expansionRow, nj);
                     const subSubDet = getDeterminant(subSubMatrix);
                     
                     const subCard = document.createElement('div');
                     subCard.className = 'sub-minor-card';
                     let cardHtml = `
                        <div style="font-weight:600; margin-bottom:5px; color:#555; font-size:0.9rem">
                            → Sub de ${multiplier} [Int: 1,${nj+1}]
                        </div>
                        ${renderMatrixHtml(subSubMatrix)}
                        <div style="margin-top:5px; font-size:0.9rem">Det: <b>${subSubDet}</b></div>
                     `;
                     if (subSubMatrix.length >= 2) {
                        cardHtml += `
                            <button class="toggle-btn secondary-toggle">Fórmula</button>
                            <div class="sub-formula-container" style="display:none;">
                                ${generateCofactorFormulaHtml(subSubMatrix)}
                            </div>
                        `;
                     }
                     subCard.innerHTML = cardHtml;
                     container.appendChild(subCard);
                     
                     if (subSubMatrix.length >= 2) {
                        const secondaryBtn = subCard.querySelector('.secondary-toggle');
                        const formulaCont = subCard.querySelector('.sub-formula-container');
                        secondaryBtn.addEventListener('click', function() {
                            const isFormulaHidden = formulaCont.style.display === 'none';
                            formulaCont.style.display = isFormulaHidden ? 'block' : 'none';
                            this.innerText = isFormulaHidden ? 'Ocultar' : 'Fórmula';
                        });
                     }
                }
            }, 50);
        }
    } else {
        btn.innerText = 'Ver Submatrices Internas ↓';
        btn.classList.remove('active');
        container.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generateInputs(defaultMatrix);
});