// import { findElbowPoint,updateBiPlot,updateScatterMatrix,updateImpAttr } from "./support.js";


async function sendData(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed sending data');
        }

        const result = await response.json();
        console.log(result.message); 
    } catch (error) {
        console.error('Error:', error.message);
    }
}

export async function renderLineChart(countryData) {
    // Clear previous visualization
    d3.select("#line-plot").selectAll("*").remove();

    // Get user input values
    var yAxisAttribute = document.getElementById('y-col-attr-line').value;

    // Define margin, width, and height for the chart
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    // Create SVG for the line chart
    const svg = d3.select("#line-plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Extract x and y values
    const xValues = countryData.map(d => d['Year']);
    const yValues = countryData.map(d => d[yAxisAttribute]);

    // Define scales for x and y axes
    const xScale = d3.scaleLinear()
        .domain(d3.extent(xValues))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(yValues), d3.max(yValues)])
        .nice()
        .range([height, 0]);

    // Define the line function
    const line = d3.line()
        .x((d, i) => xScale(xValues[i]))
        .y(d => yScale(d));

    // Create x-axis
    const xAxis = d3.axisBottom(xScale);
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Create y-axis
    const yAxis = d3.axisLeft(yScale);
    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Add circles to mark data points
    svg.selectAll(".circle")
        .data(countryData)
        .enter().append("circle")
        .attr("class", "circle")
        .attr("cx", (d, i) => xScale(xValues[i]))
        .attr("cy", d => yScale(d[yAxisAttribute]))
        .attr("r", 4)
        .attr("fill", "steelblue");

    // Add the line to the SVG
    svg.append("path")
        .datum(yValues)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add y-axis label
    svg.append("text")
       .attr('class', 'axis-label')
       .attr("transform", "rotate(-90)")
       .attr("y", -margin.left)
       .attr("x", 0 - (height / 2))
       .attr("dy", "1em")
       .style("text-anchor", "middle")
       .text(yAxisAttribute);

    // Add chart title
    svg.append("text")
    .attr('class', 'axis-label')
    .attr("transform", `translate(${width / 2},${height + margin.top + 30})`)
    .style("text-anchor", "middle")
    .text("Year");
}


// Have to add slider and make it prettier
export async function renderIncomeBarPlot(data) {
    // Clear previous visualization
    d3.select("#bar_plot_svg").selectAll("*").remove();

    // Get user input values
    var yAxisAttribute = document.getElementById('y-col-attr').value;

    // Define attributes for each income category
    const incomeCategories = ['low_income_avg', 'mid_income_avg', 'high_income_avg'];

    

    // Define margin, width, and height for the chart
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;
    

    // Create SVG for the bar chart
    const svg = d3.select("#bar_plot_svg")
                //   .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const xScale = d3.scaleBand()
                     .domain(incomeCategories)
                     .range([0, width])
                     .padding(0.1);

    const yScale = d3.scaleLinear()
                     .domain([0, d3.max(incomeCategories, category => data[category][yAxisAttribute])])
                     .range([height, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
       .attr("class", "x-axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

    svg.append("g")
       .attr("class", "y-axis")
       .call(yAxis);

    // Create bars
    svg.selectAll(".bar")
       .data(incomeCategories)
       .enter().append("rect")
       .attr("class", "bar")
       .attr("x", d => xScale(d))
       .attr("y", d => yScale(data[d][yAxisAttribute]))
       .attr("width", xScale.bandwidth())
       .attr("height", d => height - yScale(data[d][yAxisAttribute]))
       .attr("fill", "steelblue")
       .on("mouseover", function(d, i) {
        d3.select(this).attr("fill", "orange");
    })
    .on("mouseout", function(d, i) {
        const index = +d3.select(this).attr("data-index"); 
        d3.select(this).attr("fill", "steelblue");
    });

    svg.append("text")
       .attr('class', 'axis-label')
       .attr("transform", "rotate(-90)")
       .attr("y", -margin.left)
       .attr("x", 0 - (height / 2))
       .attr("dy", "1em")
       .style("text-anchor", "middle")
       .text(yAxisAttribute);


    svg.append("text")
    .attr('class', 'axis-label')
    .attr("transform", `translate(${width / 2},${height + margin.top + 30})`)
    .style("text-anchor", "middle")
    .text("Income Categories");
}
