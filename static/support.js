import { renderIncomeBarPlot, renderLineChart, renderChoroplethMap, renderVerticalStackedBarPlot, renderMDSVariablePlot } from "./plot_fns.js";
import {incomeYAxisColumns} from "./constants.js"
import { generateDropdownOptions } from "./util.js";

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

document.addEventListener("DOMContentLoaded", async function() {
    console.log("DOM LOADED")
    const countryNamesData = await fetchData('/get_country_names', {});
    const geoData =  await fetchData('/get_geojson_data', {});


    generateDropdownOptions(document.getElementById('y-col-attr'), incomeYAxisColumns,"any");
    generateDropdownOptions(document.getElementById('y-col-attr-line'), incomeYAxisColumns,"any");
    generateDropdownOptions(document.getElementById('country-line'), countryNamesData.country_names,"any");
    generateDropdownOptions(document.getElementById('country-stacked-bar'), countryNamesData.country_names,"any");

    renderChoroplethMap(geoData)
    renderVerticalStackedBarPlot()

    const MDSCorrData = await fetchData('/MDS_corr', {});

    renderMDSVariablePlot(MDSCorrData.MDS_var_vectors, MDSCorrData.feature_names,MDSCorrData.MDS_correlation_matrix);


});


document.getElementById("y-col-attr-line").addEventListener("change", async function() {
    console.log("UPDATING LINE PLOT")
    const lineData=  await fetchData('/choose_country', {});
    renderLineChart(lineData)
});

document.getElementById("y-col-attr").addEventListener("change", async function() {
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


