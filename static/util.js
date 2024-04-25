
const columnDataTypes = {
    'Country': true,
    'Year': true, 
    'Literarcy rate': false,
    'Disease_deaths': false,
    'Road traffic death rate': false,
    'Suicide rate': false,
    'Deaths': false,
    'ParentLocationCode' : true,
    'Country Code':true,
    'GDP':false,
    'Population':false,
    'Population of children under the age of 1':false,
    'Population of children under the age of 5':false,
    'Population of children under the age of 15':false,
    'Population under the age of 25':false
  };

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


function isCategorical(columnName) {
return columnDataTypes[columnName];
}
  
function generateDropdownOptions(dropdown,columnNames,type) {
    console.log("LOGGIN")
    console.log(columnNames)
    dropdown.innerHTML = ''; // Clear existing options
    const defaultOption = document.createElement('option');
    defaultOption.value = 'default';
    defaultOption.text = 'Choose a column...';
    dropdown.appendChild(defaultOption);
    console.log("LOGGIN")
    console.log(columnNames)
    columnNames.forEach(column => {
      if (!isCategorical(column) | type == "any") {
        const option = document.createElement('option');
        option.value = column;
        option.textContent = column;
        dropdown.appendChild(option);
      }
    });
  }
export { isCategorical, generateDropdownOptions,columnMetadata };
