import { updateScreePlot,updateKMeansMSEPlot,updatePCABiplot,renderScatterMatrix } from "./plot_fns.js";

const columnMetadata = {
    'Country': "Country : No Meta data",
    'Year': "Year : No Meta data", 
    'Literarcy rate': "Literarcy rate: Out of 100",
    'Disease_deaths': "Disease_deaths: Probability of dying between 15 and 60 years per 1000 population)",
    'Road traffic death rate': "Road traffic rate : Estimated road traffic death rate (per 100 000 population)",
    'Suicide rate': "Suicide rate : Suicide deaths per 100 000 population",
    'Deaths': "Deaths : Deaths per 1000 people",
    'ParentLocationCode' : "ParentLocationCode:  Geographical location",
    'Country Code':"Country Code : No Meta data",
    'GDP':"GDP : In millions USD",
    'Population':"Population: In millions",
    'Population of children under the age of 1':"Population of children under the age of 1: In millions",
    'Population of children under the age of 5':"Population of children under the age of 5: In millions",
    'Population of children under the age of 15':"Population of children under the age of 15: In millions",
    'Population under the age of 25':"Population of children under the age of 25: In millions",
  };

async function fetchData(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        body: data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.json();
}

export async function findElbowPoint(data) {
    

    const kneeData = new URLSearchParams();
    kneeData.append('data', JSON.stringify(data));
    console.log("DATA:")
    console.log(JSON.stringify(data))
    const knee_point = await fetchData('/find_knee', kneeData);
    console.log("RESPONSE KNEE POINT",knee_point)
    console.log("KNEE POINT:",knee_point.knee_point)
    return knee_point.knee_point;
}

async function fetchTopPCA() {
    const response = await fetchData('/pca_top', {});
    const importantColumns = response.most_important_columns;
    const loadingScores = response.loading_scores;

    const tableBody = document.getElementById('important-columns-body');
    tableBody.innerHTML = ''; 
    document.getElementById("meta-data-panel").innerText = '';
    importantColumns.forEach((columnName, index) => {
        document.getElementById("meta-data-panel").innerText = document.getElementById("meta-data-panel").innerText + columnMetadata[columnName] + "\n"
        const score = loadingScores[index];
        const row = `<tr>
                        <td>${columnName}</td>
                        <td>${score}</td>
                    </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
    return importantColumns
}

document.addEventListener("DOMContentLoaded", async function() {

const xDropdown = document.getElementById("x-pc-select");
for (let i = 1; i <= 11; i++) {
    const option = document.createElement("option");
    option.text = "Principle Component " + i;
    option.value = i;
    xDropdown.appendChild(option);
}

xDropdown.value = 1; 

const yDropdown = document.getElementById("y-pc-select");
for (let i = 1; i <= 11; i++) {
    const option = document.createElement("option");
    option.text = "Principle Component " + i;
    option.value = i;
    yDropdown.appendChild(option);
}

yDropdown.value = 2;  

const pcaData = await fetchData('/pca', {});
updateScreePlot(pcaData.explained_variance_ratio,pcaData.cum_explained_variance);

const kMeansMSEFormData = new URLSearchParams();
kMeansMSEFormData.append('num_clusters', 10); 
const kMeansMSEData = await fetchData('/kmeans_mse', kMeansMSEFormData);
updateKMeansMSEPlot(kMeansMSEData.mse_values);

const pcaBiplotData = await fetchData('/pca_biplot', {});
updatePCABiplot(pcaBiplotData.X_pca, pcaBiplotData.pca_components,pcaBiplotData.cluster_labels, pcaBiplotData.feature_names);

fetchTopPCA()

const ScatterData = await fetchData('/scatter_matrix', {});
renderScatterMatrix(ScatterData.scatter_data,ScatterData.cluster_labels);


});

export async function updateBiPlot(){
    console.log("UPDATING BIPLOT")
    const pcaBiplotData = await fetchData('/pca_biplot', {});
    updatePCABiplot(pcaBiplotData.X_pca, pcaBiplotData.pca_components,pcaBiplotData.cluster_labels, pcaBiplotData.feature_names);

};

export async function updateScatterMatrix(){
    const ScatterData = await fetchData('/scatter_matrix', {});
    renderScatterMatrix(ScatterData.scatter_data,ScatterData.cluster_labels);


};

export async function updateImpAttr(){
    let imp_columns = fetchTopPCA().value
    console.log("IMPORTANT COLUMNS:",imp_columns)
    updatemetaData(imp_columns)

};

export async function updatemetaData(columns){
    console.log("UPDIANG META DATA")
    columns.forEach((columnName, index) => {
        document.getElementById("meta-data-panel").innerText = document.getElementById("meta-data-panel").innerText + columnMetadata[columnName]
    });


};

document.getElementById("x-pc-select").addEventListener("change", async function() {
    const selectedXPC = parseInt(this.value);  
    const pcaBiplotData = await fetchData('/pca_biplot', {});
    updatePCABiplot(pcaBiplotData.X_pca, pcaBiplotData.pca_components,pcaBiplotData.cluster_labels, pcaBiplotData.feature_names);
    console.log("Selected X-axis PC:", selectedXPC);
});

document.getElementById("y-pc-select").addEventListener("change", async function() {
    const selectedXPC = parseInt(this.value); 
    const pcaBiplotData = await fetchData('/pca_biplot', {});
    updatePCABiplot(pcaBiplotData.X_pca, pcaBiplotData.pca_components,pcaBiplotData.cluster_labels, pcaBiplotData.feature_names);
    console.log("Selected Y-axis PC:", selectedXPC);
});
