// Elements
const uploadView = document.getElementById('uploadView');
const analysisView = document.getElementById('analysisView');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const backButton = document.getElementById('backButton');
const analise_de_Imagem = document.getElementById('analysisImage');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultsColumn = document.getElementById('resultsColumn');


// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.opacity = '0.8';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.opacity = '1';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.opacity = '1';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

backButton.addEventListener('click', () => {
    uploadView.classList.remove('hidden');
    analysisView.classList.remove('active');
    fileInput.value = '';
});


function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        analise_de_Imagem.src = e.target.result;
        showAnalysisView();
        analisarImagem(file)
    };
    reader.readAsDataURL(file);
}

// mostrar analises
function showAnalysisView() {
    uploadView.classList.add('hidden');
    analysisView.classList.add('active');
    loadingOverlay.style.display = 'flex';
}

async function analisarImagem(file) {
    loadingOverlay.style.display = "flex";

    const formData = new FormData();

    formData.append("imagem",file);

    try{
        // URL
        const response = await fetch(
            "https://classificador-de-tumores-cerebrais.onrender.com/classificar",
            {
                method: "POST",
                body : formData
            }
        );

        const resultado = await response.json()

        loadingOverlay.style.display = "none";

        displayResults(resultado);
    }catch(error){
        console.error(error);
        alert("ERRO AO CLASSIFICAR A IMAGEM");

        loadingOverlay.style.display= "none";
    }
}

// Results
function displayResults(resultado) {
    
    console.log(resultado);

    const tumorPrincipal =
    resultado.probabilidades.find(
        t => t.name === resultado.classe
    );

    resultsColumn.innerHTML = `
        <!-- Result Card -->
        <div class="result-card">
            <div class="result-header"
            style="
            background:${tumorPrincipal.color}22;
            border-bottom: 1px solid ${tumorPrincipal.color};">
                <div class="result-badge">DETECTADO</div>
                <div class="result-main">
                    <div>
                        <h3 class="result-type">${resultado.classe}</h3>
                        
                    </div>
                    <div class="result-confidence">
                        <div class="confidence-value">${resultado.acuracia}%</div>
                        <div class="confidence-label">ACURÁCIA</div>
                    </div>
                </div>
            </div>
            <div class="probability-section">
                <h4 class="probability-title">Classificação de Probabilidades</h4>
                ${resultado.probabilidades.map(tumor => `
                    <div class="probability-item">
                        <div class="probability-header">
                            <span class="probability-name">${tumor.name}</span>
                            <span class="probability-value">${tumor.confidence}%</span>
                        </div>
                        <div class="probability-bar">
                            <div class="probability-fill" style="width: 0%;
                            background:${tumor.color};"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

    
    `;

    // Barras animadas
    setTimeout(() => {
        document.querySelectorAll('.probability-fill').forEach((bar, i) => {
            bar.style.width = resultado.probabilidades[i].confidence + '%';
        });
    }, 100);
}


document.addEventListener('keydown', (e) => {
   
    if (e.key === 'Escape' && analysisView.classList.contains('active')) {
        backButton.click();
    }
});

// Log 
console.log('APP iniciado');

