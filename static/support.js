import { renderIncomeBarPlot, renderLineChart, renderChoroplethMap, renderVerticalStackedBarPlot, renderMDSVariablePlot } from "./plot_fns.js";
import {incomeYAxisColumns} from "./constants.js"
import { generateDropdownOptions } from "./util.js";


const columnMetadata = {
    'Country': "Country : No Meta data",
    'Year': "Year : No Meta data", 
    'Literarcy rate': "Literarcy rate: Out of 100",
    // 'Disease_deaths': "Disease_deaths: Probability of dying between 15 and 60 years per 1000 population)",
    'Road traffic death rate': "Road traffic rate : Estimated road traffic death rate (per 100 000 population)",
    'Suicide rate': "Suicide rate : Suicide deaths per 100 000 population",
    'Deaths': "Deaths : Deaths per 1000 people",
    'ParentLocationCode' : "ParentLocationCode:  Geographical location",
    'Country Code':"Country Code : No Meta data",
    'GDP':"GDP : In millions USD",
    "Mental health": "Mental health : % of people diagonised with the corresponding disorder"
    // 'Population':"Population: In millions",
    // 'Population of children under the age of 1':"Population of children under the age of 1: In millions",
    // 'Population of children under the age of 5':"Population of children under the age of 5: In millions",
    // 'Population of children under the age of 15':"Population of children under the age of 15: In millions",
    // 'Population under the age of 25':"Population of children under the age of 25: In millions",
  };


export async function fetchData(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        body: data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.json();
}

let chosen_country_name = "Chile"
document.addEventListener("DOMContentLoaded", async function() {
    console.log("DOM LOADED")
    const countryNamesData = await fetchData('/get_country_names', {});

    
    
    // generateDropdownOptions(document.getElementById('country-dropdown'), countryNamesData.country_names,"any","Chile");
    generateDropdownOptions(document.getElementById('attribute-dropdown'), incomeYAxisColumns,"any","Deaths");

    
    // renderVerticalStackedBarPlot()

    const MDSCorrData = await fetchData('/MDS_corr', {});
    renderMDSVariablePlot(MDSCorrData.MDS_var_vectors, MDSCorrData.feature_names,MDSCorrData.MDS_correlation_matrix);



    // Update GeoSpatial plot
    const geoFormData = new URLSearchParams();
    let year = document.getElementById('year').value;
    geoFormData.append('year', year); 
    const geoData =  await fetchData('/get_geojson_data', geoFormData);
    renderChoroplethMap(geoData)


    // Update income plot
    const incomeFormData = new URLSearchParams();
    year = document.getElementById('year').value;
    let low_thresh = document.getElementById('lowThreshold').value;
    let mid_thresh = document.getElementById('midThreshold').value;
    incomeFormData.append('year', year); 
    incomeFormData.append('low_threshold', low_thresh); 
    incomeFormData.append('mid_threshold', mid_thresh); 
    console.log(incomeFormData)
    const incomeData =  await fetchData('/get_income_data', incomeFormData);
    renderIncomeBarPlot(incomeData)

    // Update Line plot
    const lineInputData = new URLSearchParams();
    lineInputData.append('country', chosen_country_name); 
    const lineData=  await fetchData('/choose_country', lineInputData);
    renderLineChart(lineData)

    // Update stacked bar charts
    const stackedBarInputData = new URLSearchParams();
    stackedBarInputData.append('country', chosen_country_name); 
    const stackedBarData=  await fetchData('/stacked_barcharts', stackedBarInputData);
    console.log("STacked bar charts", stackedBarData)
    renderVerticalStackedBarPlot(stackedBarData)


    document.getElementById("meta-data-panel").innerText = ''
    console.log("INNER TEXT:",document.getElementById("meta-data-panel").innerText )
    updatemetaData(['Literarcy rate', 'Road traffic death rate','Suicide rate', 'Deaths', 'GDP', 'Population',"Mental health"])



});



// Attribute Dropdown
document.getElementById("attribute-dropdown").addEventListener("change", async function() {
    console.log("attribute changed",document.getElementById("attribute-dropdown").value)
    
    // Update income plot
    const incomeFormData = new URLSearchParams();
    let year = document.getElementById('year').value;
    let low_thresh = document.getElementById('lowThreshold').value;
    let mid_thresh = document.getElementById('midThreshold').value;
    incomeFormData.append('year', year); 
    incomeFormData.append('low_threshold', low_thresh); 
    incomeFormData.append('mid_threshold', mid_thresh); 
    console.log(incomeFormData)
    const incomeData =  await fetchData('/get_income_data', incomeFormData);
    renderIncomeBarPlot(incomeData)

    // Update Line plot
    const lineInputData = new URLSearchParams();
    lineInputData.append('country', chosen_country_name); 
    const lineData=  await fetchData('/choose_country', lineInputData);
    renderLineChart(lineData)

    // Update GeoSpatial plot
    const geoFormData = new URLSearchParams();
    year = document.getElementById('year').value;
    geoFormData.append('year', year); 
    const geoData =  await fetchData('/get_geojson_data', geoFormData);
    renderChoroplethMap(geoData)


    document.getElementById('line-h').innerText = "Variation of " + document.getElementById("attribute-dropdown").value + " for " + chosen_country_name
    document.getElementById('bar-h').innerText = "Comparision "  + document.getElementById("attribute-dropdown").value + " by Income groups during " + year
    document.getElementById('geo-h').innerText = "GeoSpatial map for "  + document.getElementById("attribute-dropdown").value + " during " + year
});


// Year Slider
document.getElementById("year").addEventListener("input", async function() {
    console.log("YEAR CHANGED")

    // Update income plot
    const incomeFormData = new URLSearchParams();
    let year = document.getElementById('year').value;
    let low_thresh = document.getElementById('lowThreshold').value;
    let mid_thresh = document.getElementById('midThreshold').value;
    incomeFormData.append('year', year); 
    incomeFormData.append('low_threshold', low_thresh); 
    incomeFormData.append('mid_threshold', mid_thresh); 
    console.log(incomeFormData)
    const incomeData =  await fetchData('/get_income_data', incomeFormData);
    renderIncomeBarPlot(incomeData)


    // Update GeoSpatial plot
    const geoFormData = new URLSearchParams();
    year = document.getElementById('year').value;
    geoFormData.append('year', year); 
    const geoData =  await fetchData('/get_geojson_data', geoFormData);
    renderChoroplethMap(geoData)

    document.getElementById('bar-h').innerText = "Comparision "  + document.getElementById("attribute-dropdown").value + " by Income groups during " + year
    document.getElementById('geo-h').innerText = "GeoSpatial map for "  + document.getElementById("attribute-dropdown").value + " during " + year

});


document.getElementById("lowThreshold").addEventListener("input", async function() {
    console.log("lowThreshold CHANGED")

    // Update income plot
    const incomeFormData = new URLSearchParams();
    let year = document.getElementById('year').value;
    let low_thresh = document.getElementById('lowThreshold').value;
    let mid_thresh = document.getElementById('midThreshold').value;
    incomeFormData.append('year', year); 
    incomeFormData.append('low_threshold', low_thresh); 
    incomeFormData.append('mid_threshold', mid_thresh); 
    console.log(incomeFormData)
    const incomeData =  await fetchData('/get_income_data', incomeFormData);
    renderIncomeBarPlot(incomeData)
});


document.getElementById("midThreshold").addEventListener("input", async function() {
    console.log("midThreshold CHANGED")

    // Update income plot
    const incomeFormData = new URLSearchParams();
    let year = document.getElementById('year').value;
    let low_thresh = document.getElementById('lowThreshold').value;
    let mid_thresh = document.getElementById('midThreshold').value;
    incomeFormData.append('year', year); 
    incomeFormData.append('low_threshold', low_thresh); 
    incomeFormData.append('mid_threshold', mid_thresh); 
    console.log(incomeFormData)
    const incomeData =  await fetchData('/get_income_data', incomeFormData);
    renderIncomeBarPlot(incomeData)
});


export async function handleMapClick(value) {
    // Do something with the chosen value
    console.log("Chosen value:", value);
    chosen_country_name = value


    // Update Line plot
    const lineInputData = new URLSearchParams();
    lineInputData.append('country', value); 
    const lineData=  await fetchData('/choose_country', lineInputData);
    renderLineChart(lineData)

    
    // Update stacked bar charts
    const stackedBarInputData = new URLSearchParams();
    stackedBarInputData.append('country', value); 
    const stackedBarData=  await fetchData('/stacked_barcharts', stackedBarInputData);
    console.log("STacked bar charts", stackedBarData)
    renderVerticalStackedBarPlot(stackedBarData)


    document.getElementById('line-h').innerText = "Variation of " + document.getElementById("attribute-dropdown").value + " for " + chosen_country_name
    document.getElementById('stacked-h').innerText = "Variation over different mental disorders for " + chosen_country_name
}

export async function updatemetaData(columns){
    console.log("UPDIANG META DATA")
    document.getElementById("meta-data-panel").innerText = ''
    console.log(columnMetadata)
    columns.forEach((columnName, index) => {
        console.log(columnName)
        console.log(columnMetadata[columnName])
        document.getElementById("meta-data-panel").innerText = document.getElementById("meta-data-panel").innerText + columnMetadata[columnName] + "\n"
    });

};

function toggleMetaDataPanel() {
    var metaDataPanel = document.getElementById("meta-data-panel");
    var toggleBtn = document.getElementById("toggle-btn");
    if (metaDataPanel.style.display === "none" || metaDataPanel.style.display === "") {
        metaDataPanel.style.display = "block";
        toggleBtn.textContent = "Hide Additional Info";
    } else {
        metaDataPanel.style.display = "none";
        toggleBtn.textContent = "Show Additional Info";
    }
}

// Add event listener to the button to toggle the meta data panel
document.getElementById("toggle-btn").addEventListener("click", toggleMetaDataPanel);


