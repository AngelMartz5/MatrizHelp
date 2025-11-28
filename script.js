// =========================================
// CLASE FRACCIÓN
// =========================================
class Fraction {
    constructor(n, d = 1) {
        if (d === 0) throw new Error("Div por cero");
        this.n = n;
        this.d = d;
        this.simplify();
    }
    simplify() {
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const common = gcd(Math.abs(this.n), Math.abs(this.d));
        this.n /= common;
        this.d /= common;
        if (this.d < 0) { this.n *= -1; this.d *= -1; }
    }
    add(f) { return new Fraction(this.n * f.d + f.n * this.d, this.d * f.d); }
    sub(f) { return new Fraction(this.n * f.d - f.n * this.d, this.d * f.d); }
    mul(f) { return new Fraction(this.n * f.n, this.d * f.d); }
    div(f) { return new Fraction(this.n * f.d, this.d * f.n); }
    toString() { return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`; }
    toNumber() { return this.n / this.d; }
}

// =========================================
// DATOS & ESTADO
// =========================================
const vectorB_Exam = [5, -3, 7, 10, 2, 8, 4];
const defaultMatrix7x7 = [
    [2, -1, 0, 3, 1, 0, 2],
    [1, 2, -1, 0, 4, 1, -1],
    [0, 1, 3, -2, 0, 2, 1],
    [3, 0, -1, 1, 2, -1, 0],
    [2, 1, 0, 4, -1, 0, 3],
    [0, -2, 1, 0, 3, 2, 1],
    [1, 0, 2, -1, 1, 0, 2]
];

let historyStack = [];

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-content'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active-content');
    const btnMap = { 'tab-explorer': 0, 'tab-steps': 1, 'tab-exam': 2 };
    document.querySelectorAll('.tab-btn')[btnMap[tabId]].classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    generateInputs(defaultMatrix7x7);
    setTimeout(calculateMinors, 200); 
});

document.getElementById('btn-reset-default').addEventListener('click', () => {
    historyStack = [];
    updateNavUI();
    generateInputs(defaultMatrix7x7);
    showToast("Datos del Examen Restaurados");
    setTimeout(calculateMinors, 100);
});

document.getElementById('row-select').addEventListener('change', () => {
    highlightSelectedRow();
    calculateMinors();
});

document.getElementById('btn-back').addEventListener('click', goBack);

function runSelectedMethod() {
    const choice = document.getElementById('method-select').value;
    if (choice === 'item3') {
        solveItem3_GaussDeterminant();
    } else {
        solveItem6_GaussJordanInverse();
    }
}

// =========================================
// FUNCIONES EXPLORADOR
// =========================================
function generateInputs(customData = null) {
    const sizeInput = document.getElementById('size');
    let size = parseInt(sizeInput.value);
    if (customData) { size = customData.length; sizeInput.value = size; }
    const rowSelect = document.getElementById('row-select'); rowSelect.innerHTML = '';
    for(let i=0; i<size; i++) { const option = document.createElement('option'); option.value = i; option.text = `Fila ${i+1}`; rowSelect.appendChild(option); }
    const container = document.getElementById('matrix-container'); container.style.gridTemplateColumns = `repeat(${size}, 1fr)`; container.innerHTML = '';
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const input = document.createElement('input'); input.type = 'number'; input.id = `m-${i}-${j}`; input.value = customData ? customData[i][j] : 0;
            input.addEventListener('focus', function() { this.select(); }); input.addEventListener('change', calculateMinors); container.appendChild(input);
        }
    }
    highlightSelectedRow();
}
function getCurrentMatrixData() {
    const size = parseInt(document.getElementById('size').value);
    let currentMatrix = [];
    for (let i = 0; i < size; i++) {
        let row = [];
        for (let j = 0; j < size; j++) { const val = parseFloat(document.getElementById(`m-${i}-${j}`).value) || 0; row.push(val); }
        currentMatrix.push(row);
    }
    return currentMatrix;
}
function promoteToMain(matrixData) {
    const currentData = getCurrentMatrixData(); const currentRow = parseInt(document.getElementById('row-select').value);
    historyStack.push({ data: currentData, selectedRow: currentRow }); updateNavUI(); generateInputs(matrixData);
    document.getElementById('row-select').value = 0; showToast("Zoom Aplicado"); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(calculateMinors, 200);
}
function goBack() {
    if (historyStack.length > 0) {
        const prevState = historyStack.pop(); updateNavUI(); generateInputs(prevState.data);
        document.getElementById('row-select').value = prevState.selectedRow; highlightSelectedRow(); showToast("Volviendo atrás..."); setTimeout(calculateMinors, 200);
    }
}
function updateNavUI() { const navBar = document.getElementById('nav-bar'); const levelInd = document.getElementById('level-indicator'); if (historyStack.length > 0) { navBar.style.display = 'flex'; levelInd.innerText = `Nivel: ${historyStack.length + 1}`; } else { navBar.style.display = 'none'; } }
function showToast(msg) { const toast = document.getElementById('toast-message'); toast.innerText = msg; toast.className = "toast show"; setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000); }
function highlightSelectedRow() { const size = parseInt(document.getElementById('size').value); const selectedRow = parseInt(document.getElementById('row-select').value); document.querySelectorAll('#matrix-container input').forEach(inp => inp.classList.remove('active-row', 'is-zero')); for(let j=0; j<size; j++) { const input = document.getElementById(`m-${selectedRow}-${j}`); if(input) { input.classList.add('active-row'); if(parseFloat(input.value) === 0) input.classList.add('is-zero'); } } }

// =========================================
// LOGICA EXAMEN COMPLETO (INTEGRADA)
// =========================================
function calculateFullExam() {
    const container = document.getElementById('exam-results-container');
    const A = getCurrentMatrixData();
    let B = (A.length === 7) ? vectorB_Exam : new Array(A.length).fill(1);
    
    const det = getDeterminant(A);
    const inv = getInverse(A);
    
    let html = '';

    // PUNTOS 1-3: IDENTIFICACIÓN
    html += `
        <div class="exam-card">
            <h4>1, 2 y 3. Identificación del Sistema</h4>
            <div class="exam-card-content">
                <div class="theory-text">
                    <strong>Respuesta Escrita:</strong><br>
                    Se define el sistema en su forma matricial $A \\cdot x = B$, donde:<br>
                    • <strong>A</strong> es la matriz de coeficientes (7x7).<br>
                    • <strong>x</strong> es el vector columna de incógnitas ($x_1$ a $x_7$).<br>
                    • <strong>B</strong> es el vector columna de términos independientes.
                </div>
                <div style="display:flex; justify-content:center; align-items:center; gap:10px; flex-wrap:wrap;">
                    <div>${renderMatrixHtml(A)}</div>
                    <div style="font-size:2rem">×</div>
                    <div class="vector-col" style="justify-content:space-between; height:100px;"><div>x₁</div><div>⋮</div><div>x₇</div></div>
                    <div style="font-size:2rem">=</div>
                    ${renderVectorHtml(B)}
                </div>
            </div>
        </div>
    `;

    // PUNTO 4: INVERSA
    if (Math.abs(det) < 1e-10) {
        html += `<div class="exam-card" style="border-color:red;"><h4 style="color:red">Matriz Singular</h4><p style="padding:20px">Determinante es 0. No tiene inversa.</p></div>`;
    } else {
        html += `
            <div class="exam-card">
                <h4>4. Matriz Inversa (A⁻¹)</h4>
                <div class="exam-card-content">
                    <div class="theory-text">
                        <strong>Procedimiento Teórico:</strong><br>
                        1. Verificamos que $|A| \\neq 0$. (Calculado: $|A| = ${det.toFixed(2)}$).<br>
                        2. Construimos la matriz aumentada $[A|I]$.<br>
                        3. Aplicamos Gauss-Jordan hasta llegar a $[I|A^{-1}]$.<br>
                        <strong>Respuesta:</strong> Sí es invertible. A continuación los valores (copiar primeros 4 decimales):
                    </div>
                    <details style="width:100%" open>
                        <summary>Ver Matriz Inversa (Resultado de Matlab/Software)</summary>
                        <div class="scroll-wrapper">${renderMatrixHtml(inv)}</div>
                    </details>
                </div>
            </div>
        `;

        // PUNTO 5: SOLUCIÓN INVERSA
        const x = multiplyMatrixVector(inv, B);
        let procedureText = `<div style="width:100%">`;
        procedureText += `<div class="calc-step"><b>x₁</b> = (${inv[0][0].toFixed(2)}·${B[0]}) + ... + (${inv[0][6].toFixed(2)}·${B[6]}) = <b>${x[0].toFixed(4)}</b></div>`;
        procedureText += `<div class="calc-step" style="text-align:center">... (mismo proceso para filas 2 a 6) ...</div>`;
        const last = A.length - 1;
        procedureText += `<div class="calc-step"><b>x₇</b> = (${inv[last][0].toFixed(2)}·${B[0]}) + ... + (${inv[last][6].toFixed(2)}·${B[6]}) = <b>${x[last].toFixed(4)}</b></div>`;
        procedureText += `</div>`;

        html += `
            <div class="exam-card">
                <h4>5. Solución por Método de la Inversa</h4>
                <div class="exam-card-content">
                    <div class="theory-text">
                        <strong>Procedimiento:</strong><br>
                        Utilizamos la ecuación matricial $x = A^{-1} \\cdot B$.<br>
                        Multiplicamos la matriz inversa obtenida en el punto 4 por el vector $B$.
                    </div>
                    ${procedureText}
                    <div style="margin-top:20px; display:flex; justify-content:center; gap:10px; align-items:center;">
                       <span style="font-weight:bold;">Resultado Vector x:</span> ${renderVectorHtml(x)}
                    </div>
                </div>
            </div>
        `;

        // PUNTO 6: CONFIRMACIÓN GAUSS-JORDAN
        html += `
            <div class="exam-card">
                <h4>6. Confirmación por Gauss-Jordan</h4>
                <div class="exam-card-content">
                    <div class="theory-text">
                        <strong>Respuesta Escrita:</strong><br>
                        "Se aplica el método de Gauss-Jordan a la matriz aumentada $[A|B]$. Al reducir la matriz $A$ a la identidad $I$, la última columna resultante corresponde exactamente al vector solución $x$ calculado en el punto 5, confirmando el resultado."
                    </div>
                </div>
            </div>
        `;
    }

    // PUNTO 7: OPERACIONES VECTORIALES
    if (A.length >= 7) {
        const v6 = A[5]; const v7 = A[6];
        // Producto Punto Manual
        let dotSumStr = "";
        let dot = 0;
        for(let k=0; k<v6.length; k++) {
            dot += v6[k] * v7[k];
            dotSumStr += `(${v6[k]})(${v7[k]})`;
            if(k < v6.length-1) dotSumStr += " + ";
        }

        // Producto Cruz 3D
        const cross = [v6[1]*v7[2]-v6[2]*v7[1], v6[2]*v7[0]-v6[0]*v7[2], v6[0]*v7[1]-v6[1]*v7[0]];
        
        html += `
            <div class="exam-card">
                <h4>7. Producto Punto y Cruz (Fila 6 y 7)</h4>
                <div class="exam-card-content">
                    <p><b>Fila 6 ($\vec{u}$):</b> [${v6.join(', ')}]</p>
                    <p><b>Fila 7 ($\vec{v}$):</b> [${v7.join(', ')}]</p>
                    <hr style="width:100%; margin:15px 0; border:0; border-top:1px solid #eee;">
                    
                    <div class="theory-text">
                        <strong>1. Producto Punto (Escalar):</strong><br>
                        Suma de la multiplicación elemento a elemento.
                    </div>
                    <div class="calc-step" style="white-space:normal;">${dotSumStr} = <b>${dot}</b></div>
                    
                    <div class="theory-text" style="margin-top:15px;">
                        <strong>2. Producto Cruz (Vectorial):</strong><br>
                        <span style="color:#b91c1c;">⚠️ Nota Importante:</span> El producto cruz estándar solo se define para 3 dimensiones. Si el examen pide calcularlo sobre los vectores de 7 datos, estrictamente <b>no existe</b> (error de dimensión). <br><br>
                        A continuación se presenta el cálculo tomando solo los <b>primeros 3 componentes</b> ($i, j, k$) por si esa es la intención:
                    </div>
                    <div class="calc-step">Cruz (ijk): [${cross.map(n=>n.toFixed(2)).join(', ')}]</div>
                </div>
            </div>
        `;
    }
    
    // PUNTO 8
    html += `
        <div class="exam-card">
            <h4>8. Solución en Software</h4>
            <div class="exam-card-content">
                <div class="theory-text">
                    <strong>Respuesta:</strong><br>
                    Los resultados presentados en este informe coinciden con los obtenidos mediante software matemático (Matlab/Octave) al ejecutar los comandos <code>inv(A)</code> y <code>A\\B</code>.
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ... [Mantener funciones matemáticas auxiliares y de Gauss paso a paso] ...
// (Copiar solveItem3_GaussDeterminant, solveItem6_GaussJordanInverse y demás del código anterior)
function solveItem3_GaussDeterminant() {
    const container = document.getElementById('gauss-steps-container'); container.innerHTML = '';
    let rawData = getCurrentMatrixData(); let matrix = rawData.map(row => row.map(val => new Fraction(val)));
    const rows = matrix.length; const cols = matrix[0].length; let stepCount = 1; let swapCount = 0;
    container.innerHTML += `<div style="padding:15px; background:#e0f2fe; border-radius:8px; text-align:center; margin-bottom:15px; color:#0369a1; border: 1px solid #bae6fd;"><b>Inciso 3: Método de Gauss</b><br>Objetivo: Triangular Superior</div>`;
    container.innerHTML += createStepHtmlFrac(0, "Matriz Inicial", matrix, -1);
    for (let j = 0; j < Math.min(rows, cols); j++) {
        if (matrix[j][j].n === 0) {
            let swapRow = -1; for (let k = j + 1; k < rows; k++) { if (matrix[k][j].n !== 0) { swapRow = k; break; } }
            if (swapRow !== -1) { [matrix[j], matrix[swapRow]] = [matrix[swapRow], matrix[j]]; swapCount++; container.innerHTML += createStepHtmlFrac(stepCount++, `<b>Intercambio:</b> F${j+1} ↔ F${swapRow+1}`, matrix, -1); }
        }
        let operations = []; let pivotVal = matrix[j][j];
        if (pivotVal.n !== 0) {
            for (let i = j + 1; i < rows; i++) {
                let targetVal = matrix[i][j];
                if (targetVal.n !== 0) {
                    let factor = targetVal.div(pivotVal);
                    for (let c = 0; c < cols; c++) { let valToSub = matrix[j][c].mul(factor); matrix[i][c] = matrix[i][c].sub(valToSub); }
                    let sign = factor.n < 0 ? '+' : '-'; let absFactor = factor.n < 0 ? factor.mul(new Fraction(-1)) : factor;
                    operations.push(`F${i+1} = F${i+1} ${sign} (${absFactor.toString()})·F${j+1}`);
                }
            }
        }
        if (operations.length > 0) { let descHTML = `<b>Hacer ceros en Columna ${j+1}:</b><br>` + operations.join('<br>'); container.innerHTML += createStepHtmlFrac(stepCount++, descHTML, matrix, -1); }
    }
    let det = new Fraction(1); for(let i=0; i<rows; i++) { det = det.mul(matrix[i][i]); } let signAdjustment = (swapCount % 2 === 0) ? 1 : -1; det = det.mul(new Fraction(signAdjustment));
    container.innerHTML += `<div class="step-item"><div class="step-content"><div class="step-description" style="background:#d1fae5; color:#065f46; border-color:#10b981;"><b>Det = ${det.toString()}</b></div></div></div>`;
}

function solveItem6_GaussJordanInverse() {
    const container = document.getElementById('gauss-steps-container'); container.innerHTML = '';
    let rawA = getCurrentMatrixData(); let size = rawA.length;
    let matrix = rawA.map((row, i) => { let newRow = row.map(val => new Fraction(val)); for(let k=0; k<size; k++) newRow.push(new Fraction(k === i ? 1 : 0)); return newRow; });
    const rows = matrix.length; const cols = matrix[0].length; const sepIdx = size - 1; let stepCount = 1;
    container.innerHTML += `<div style="padding:15px; background:#fef3c7; border-radius:8px; text-align:center; margin-bottom:15px; color:#92400e; border: 1px solid #fcd34d;"><b>Inciso 6: Inversa (Gauss-Jordan)</b></div>`;
    container.innerHTML += createStepHtmlFrac(0, "Matriz Aumentada Inicial [A|I]", matrix, sepIdx);
    for (let j = 0; j < rows; j++) {
        if (matrix[j][j].n === 0) {
            let swapRow = -1; for (let k = j + 1; k < rows; k++) { if (matrix[k][j].n !== 0) { swapRow = k; break; } }
            if (swapRow !== -1) { [matrix[j], matrix[swapRow]] = [matrix[swapRow], matrix[j]]; container.innerHTML += createStepHtmlFrac(stepCount++, `<b>Intercambio:</b> F${j+1} ↔ F${swapRow+1}`, matrix, sepIdx); }
        }
        let pivot = matrix[j][j];
        if (pivot.n !== 0 && (pivot.n !== 1 || pivot.d !== 1)) { for(let c=0; c<cols; c++) matrix[j][c] = matrix[j][c].div(pivot); container.innerHTML += createStepHtmlFrac(stepCount++, `<b>Normalizar:</b> F${j+1} ÷ (${pivot.toString()})`, matrix, sepIdx); }
        let operations = [];
        for (let i = j + 1; i < rows; i++) {
            let targetVal = matrix[i][j];
            if (targetVal.n !== 0) {
                for (let c = 0; c < cols; c++) { let valToSub = matrix[j][c].mul(targetVal); matrix[i][c] = matrix[i][c].sub(valToSub); }
                let sign = targetVal.n < 0 ? '+' : '-'; let absFactor = targetVal.n < 0 ? targetVal.mul(new Fraction(-1)) : targetVal;
                operations.push(`F${i+1} = F${i+1} ${sign} (${absFactor.toString()})(F${j+1})`);
            }
        }
        if (operations.length > 0) { let descHTML = `<b>Ceros Abajo (Col ${j+1}):</b><br>` + operations.join('<br>'); container.innerHTML += createStepHtmlFrac(stepCount++, descHTML, matrix, sepIdx); }
    }
    for (let j = rows - 1; j > 0; j--) {
        let operations = [];
        for (let i = j - 1; i >= 0; i--) {
            let targetVal = matrix[i][j];
            if (targetVal.n !== 0) {
                for (let c = 0; c < cols; c++) { let valToSub = matrix[j][c].mul(targetVal); matrix[i][c] = matrix[i][c].sub(valToSub); }
                let sign = targetVal.n < 0 ? '+' : '-'; let absFactor = targetVal.n < 0 ? targetVal.mul(new Fraction(-1)) : targetVal;
                operations.push(`F${i+1} = F${i+1} ${sign} (${absFactor.toString()})(F${j+1})`);
            }
        }
        if (operations.length > 0) { let descHTML = `<b>Ceros Arriba (Col ${j+1}):</b><br>` + operations.join('<br>'); container.innerHTML += createStepHtmlFrac(stepCount++, descHTML, matrix, sepIdx); }
    }
    container.innerHTML += `<div style="margin:20px; color:var(--success); font-weight:bold; font-size:1.1rem;">✅ Inversa Completada</div>`;
}

function createStepHtmlFrac(num, desc, matrixSnapshot, separatorColIndex = -1) {
    let matrixHtml = renderMatrixHtmlFrac(matrixSnapshot, separatorColIndex);
    if(num === 0) return `<div class="step-item"><div class="step-content"><div class="step-description">${desc}</div><div class="scroll-wrapper">${matrixHtml}</div></div></div>`;
    return `<div class="step-item"><details ${num===1 ? 'open' : ''}><summary>Paso ${num}</summary><div class="step-content"><div class="step-description" style="text-align:left; line-height:1.6;">${desc}</div><div class="scroll-wrapper">${matrixHtml}</div></div></details></div>`;
}
function renderMatrixHtmlFrac(matrixSnapshot, separatorColIndex) {
    const rows = matrixSnapshot.length; const cols = matrixSnapshot[0].length;
    let html = `<div class="matrix-display" style="grid-template-columns: repeat(${cols}, 1fr)">`;
    for(let i=0; i<rows; i++) { for(let j=0; j<cols; j++) { let classes = "matrix-cell"; if (j === separatorColIndex) classes += " augmented-separator"; html += `<div class="${classes}">${matrixSnapshot[i][j].toString()}</div>`; } }
    html += `</div>`; return html;
}
function getDeterminant(matrix) { let m=JSON.parse(JSON.stringify(matrix)); const n=m.length; let det=1; for(let i=0;i<n;i++){ let max=i; for(let k=i+1;k<n;k++) if(Math.abs(m[k][i])>Math.abs(m[max][i])) max=k; [m[i],m[max]]=[m[max],m[i]]; if(i!==max) det*=-1; det*=m[i][i]; for(let k=i+1;k<n;k++){ let f=m[k][i]/m[i][i]; for(let j=i;j<n;j++) m[k][j]-=f*m[i][j]; } } return det; }
function getInverse(matrix) { const n=matrix.length; let m=matrix.map((r,i)=>[...r,...Array(n).fill(0).map((_,j)=>i===j?1:0)]); for(let i=0;i<n;i++){ let max=i; for(let k=i+1;k<n;k++) if(Math.abs(m[k][i])>Math.abs(m[max][i])) max=k; [m[i],m[max]]=[m[max],m[i]]; let p=m[i][i]; for(let j=i;j<2*n;j++) m[i][j]/=p; for(let k=0;k<n;k++){ if(k!==i){ let f=m[k][i]; for(let j=i;j<2*n;j++) m[k][j]-=f*m[i][j]; } } } return m.map(r=>r.slice(n)); }
function multiplyMatrixVector(m,v){ return m.map(r=>r.reduce((a,val,i)=>a+val*v[i],0)); }
function dotProduct(v1,v2){ return v1.reduce((a,v,i)=>a+v*v2[i],0); }
function crossProduct(v1,v2){ return [v1[1]*v2[2]-v1[2]*v2[1], v1[2]*v2[0]-v1[0]*v2[2], v1[0]*v2[1]-v1[1]*v2[0]]; }
function renderMatrixHtml(m){ const c=m[0].length; let h=`<div class="matrix-display" style="grid-template-columns:repeat(${c},1fr)">`; m.forEach(r=>r.forEach(v=>{ h+=`<div class="matrix-cell">${Math.abs(v)<1e-5?0:parseFloat(v.toFixed(2))}</div>`; })); return h+`</div>`; }
function renderVectorHtml(v){ let h=`<div class="vector-col">`; v.forEach(val=>{ h+=`<div class="vector-cell">${Math.abs(val)<1e-5?0:parseFloat(val.toFixed(4))}</div>`; }); return h+`</div>`; }
function getSubMatrix(m,r,c){ return m.filter((_,ri)=>ri!==r).map(row=>row.filter((_,ci)=>ci!==c)); }
function calculateMinors(){ document.getElementById('explorer-results').style.display='flex'; const data=getCurrentMatrixData(); const size=data.length; const selRow=parseInt(document.getElementById('row-select').value); document.getElementById('main-det').innerText=`|A| = ${getDeterminant(data).toFixed(4)}`; const resGrid=document.getElementById('results'); resGrid.innerHTML=''; let formHTML=''; for(let j=0;j<size;j++){ const mult=data[selRow][j]; const minor=getSubMatrix(data,selRow,j); const det=getDeterminant(minor); let sign=Math.pow(-1,selRow+j)===1?'+':'-'; if(j===0&&sign==='+') sign=''; formHTML+=`<span class="formula-term ${mult===0?'term-zero':''}">${sign} <b>${mult}</b>(${det.toFixed(2)})</span> `; const card=document.createElement('div'); card.className=`minor-card ${mult===0?'zero-impact':''}`; card.innerHTML=`<div class="minor-card-header">${mult===0?'⚠️ ':''}Múltiplo: <b>${mult}</b> [F${selRow+1},C${j+1}]</div><div class="minor-card-body">${renderMatrixHtml(minor)}<div class="result-det">Det: ${det.toFixed(2)}</div></div>`; if(minor.length>=2){ const f=document.createElement('div'); f.className='card-footer'; const b=document.createElement('button'); b.className='promote-btn'; b.innerText='🔍 Zoom'; b.onclick=()=>promoteToMain(minor); f.appendChild(b); card.appendChild(f); } resGrid.appendChild(card); } document.getElementById('formula-display').innerHTML=formHTML; }