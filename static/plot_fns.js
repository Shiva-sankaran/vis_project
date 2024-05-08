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

function getColor(value) {
    // Define color scale based on data values
    // You can customize the color scale as needed
    // This is just a basic example
    const colorScale = d3.scaleSequential(d3.interpolateYlGn)
        .domain([0, 100]);  // Adjust domain based on your data range
    return colorScale(value);
}

export function renderChoroplethMap(geoData) {
    // Clear previous visualization
    d3.select("#map-svg").selectAll("*").remove();

    // Set up the SVG container
    const svg = d3.select("#map-svg");
    // const width = 1200; // Set a larger width
    // const height = 800; // Set a larger height
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    // Set up the projection
    const projection = d3.geoMercator()
        .fitSize([width, height], geoData);

    // Set up the path generator
    const pathGenerator = d3.geoPath()
        .projection(projection);

    // Define color scale based on data values
    const colorScale = d3.scaleSequential(d3.interpolateYlGn)
        .domain([0, 100]);  // Adjust domain based on your data range

    // Create the tooltip element
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("display", "none")
        .style("position", "absolute")
        .style("background-color", "black")  // Set background color to black
        .style("border", "1px solid white")   // Set border to white
        .style("padding", "5px")
        .style("color", "orange");             // Set text color to orange

    // Draw the map with paths
    svg.selectAll("path")
        .data(geoData.features)
        .enter().append("path")
        .attr("d", pathGenerator)
        .attr("fill", d => {
            // Check if properties exist before accessing them
            if (d.properties && d.properties['Literarcy rate']) {
                return getColor(d.properties['Literarcy rate']);
            } else {
                return "lightgray"; // Or any other default color
            }
        })
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        // Add mouseover event handler
        .on("mouseover", function(event, d) {
            // Format the tooltip content with country name and literacy rate
            const tooltipContent = `<b>${d.properties.name}</b><br>Literarcy Rate: ${d.properties['Literarcy rate']}%`;

            tooltip.style("display", "block")
                .html(tooltipContent);

            // Position tooltip near the mouse
            const x = event.pageX + 10;
            const y = event.pageY + 10;
            tooltip.style("left", `${x}px`)
                .style("top", `${y}px`);
        })

        // Add mouseout event handler to hide tooltip
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });

    // Add legend
    const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width - 250) + ", 20)"); // Adjust as needed

const legendRectSize = 60;
const legendSpacing = 4;

const legendData = [0, 20, 40, 60, 80, 100]; // Adjust based on your data range

legend.selectAll("rect")
    .data(legendData)
    .enter().append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * (legendRectSize + legendSpacing))
    .attr("width", legendRectSize)
    .attr("height", legendRectSize)
    .style("fill", d => colorScale(d));

legend.selectAll("text")
    .data(legendData)
    .enter().append("text")
    .attr("x", legendRectSize + legendSpacing)
    .attr("y", (d, i) => i * (legendRectSize + legendSpacing) + legendRectSize / 2)
    .attr("dy", "1em")
    .style("fill", "white")
    .text(d => d === 0 ? "No data available" : d + "%")
    .style("font-size","20px");

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
export async function renderVerticalStackedBarPlot() {
    console.log("Rendering vertical stacked bar charts");
    var margin = { top: 20, right: 30, bottom: 30, left: 60 };
    var width = 600 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;
    d3.select("#vertical_stacked_bar_plot_svg").selectAll("*").remove();

    // Create SVG for the bar chart
    const svg = d3.select("#vertical_stacked_bar_plot_svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Dummy data
    var data = [
        { year: 2010, diseases: { A: 20, B: 30, C: 40, D: 50, E: 60 } },
        { year: 2011, diseases: { A: 30, B: 40, C: 50, D: 60, E: 70 } },
        { year: 2012, diseases: { A: 40, B: 50, C: 60, D: 70, E: 80 } }
        // Add more data points as needed
    ];

    // Extracting the keys (disease names) from the first data entry
    var keys = Object.keys(data[0].diseases);

    // Define colors for diseases
    var diseaseColors = {
        A: "#1f77b4", // blue
        B: "#ffea00", // yellow
        C: "#2ca02c", // green
        D: "#d62728", // red
        E: "#9467bd" // purple
    };

    // Transform the data into the format expected by the stack generator
    var stackedData = keys.map(function(key) {
        return {
            key: key,
            values: data.map(function(d) {
                return { x: d.year, y: d.diseases[key] || 0 }; // Replace undefined with 0
            })
        };
    });

    // Set up scales
    var x = d3.scaleBand()
        .domain(data.map(function(d) { return d.year; }))
        .range([0, width])
        .padding(0.1);

    var y = d3.scaleLinear()
        .domain([0, d3.max(stackedData, function(d) { return d3.max(d.values, function(d) { return d.y; }); })])
        .nice()
        .range([height, 0]);

    // Create groups for each series, rects for each segment
    var groups = svg.selectAll("g")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", function(d) { return diseaseColors[d.key]; });

    var rects = groups.selectAll("rect")
        .data(function(d) { return d.values; })
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.x) + x.bandwidth() / keys.length * keys.indexOf(d3.select(this.parentNode).datum().key); })
        .attr("y", function(d) { return y(d.y); })
        .attr("height", function(d) { return height - y(d.y); }) // Calculate height based on y value
        .attr("width", x.bandwidth() / keys.length)
        // Add mouseover effect
        .on("mouseover", function() {
            d3.select(this).attr("fill", "orange");
        })
        // Add mouseout effect
        .on("mouseout", function(d) {
            d3.select(this).attr("fill", diseaseColors[d3.select(this.parentNode).datum().key]);
        });

    // Add axes
    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
}


// export async function renderStackedBarPlot() {
//     console.log("Rendering stacked bar charts");
//     var margin = { top: 20, right: 30, bottom: 30, left: 60 };
//     var width = 600 - margin.left - margin.right;
//     var height = 400 - margin.top - margin.bottom;
//     d3.select("#stacked_bar_plot_svg").selectAll("*").remove();

//     // Create SVG for the bar chart
//     const svg = d3.select("#stacked_bar_plot_svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//     // Dummy data
//     var data = [
//         { category: "A", subbars: [20, 30, 40, 50, 60] },
//         { category: "B", subbars: [30, 40, 50, 60, 70] },
//         { category: "C", subbars: [40, 50, 60, 70, 80] }
//         // Add more data points as needed
//     ];

//     // Define colors for sub-bars
//     var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"];

//     // Transpose the data into layers
//     var dataset = d3.stack().keys(d3.range(data[0].subbars.length))(data.map(function(d) {
//         return d.subbars;
//     }));

//     // Set up scales
//     var x = d3.scaleBand()
//         .domain(data.map(function(d) { return d.category; }))
//         .range([0, width])
//         .padding(0.1);

//     var y = d3.scaleLinear()
//         .domain([0, d3.max(dataset, function(d) { return d3.max(d, function(d) { return d[1]; }); })])
//         .range([height, 0]);

//     // Create groups for each series, rects for each segment
//     var groups = svg.selectAll("g")
//         .data(dataset)
//         .enter()
//         .append("g")
//         .attr("fill", function(d, i) { return colors[i]; });

//     var rects = groups.selectAll("rect")
//         .data(function(d) { return d; })
//         .enter()
//         .append("rect")
//         .attr("x", function(d, i) { return x(data[i].category); })
//         .attr("y", function(d) { return y(d[1]); })
//         .attr("height", function(d) { return y(d[0]) - y(d[1]); })
//         .attr("width", x.bandwidth());

//     // Add axes
//     var xAxis = d3.axisBottom(x);

//     var yAxis = d3.axisLeft(y);

//     svg.append("g")
//         .attr("class", "x axis")
//         .attr("transform", "translate(0," + height + ")")
//         .call(xAxis);

//     svg.append("g")
//         .attr("class", "y axis")
//         .call(yAxis);
// }
