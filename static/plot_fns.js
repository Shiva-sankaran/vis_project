// import { findElbowPoint,updateBiPlot,updateScatterMatrix,updateImpAttr } from "./support.js";
import {handleMapClick} from "./support.js"
import {slider_start_value} from "./constants.js"
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

let country_name = ""
export function renderChoroplethMap(geoData) {
    // Clear previous visualization
    d3.select("#map-svg").selectAll("*").remove();
    console.log("GEO DATA: ",geoData)
    var yAxisAttribute = document.getElementById('attribute-dropdown').value;
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
        if (d.properties && d.properties[yAxisAttribute]) {
            return getColor(d.properties[yAxisAttribute]);
        } else {
            return "lightgray"; // Or any other default color
        }
    })
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    // Add mouseover event handler
    .on("mouseover", function(event, d) {
        // Format the tooltip content with country name and literacy rate
        const tooltipContent = `<b>${d.properties.name}</b><br>${d.properties[yAxisAttribute]}$: ${d.properties[yAxisAttribute]}%`;

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
    })
    // Add onclick event handler
    .on("click", function(event, d) {
        // Remove highlight from previously clicked countries
        svg.selectAll("path")
            .attr("fill", d => {
                if (d.properties && d.properties[yAxisAttribute]) {
                    return getColor(d.properties[yAxisAttribute]);
                } else {
                    return "lightgray"; // Or any other default color
                }
            });

        // Highlight the clicked country
        d3.select(this)
            .attr("fill", "orange"); // Change color to highlight color

        // Get the chosen value (for example, the country name)
        const chosenValue = d.properties.name;
        // Call the imported function with the chosen value
        handleMapClick(chosenValue);
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
    var yAxisAttribute = document.getElementById('attribute-dropdown').value;

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
    console.log("RENDERING INCOME")
    d3.select("#bar_plot_svg").selectAll("*").remove();

    // Get user input values
    var yAxisAttribute = document.getElementById('attribute-dropdown').value;

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

export async function renderVerticalStackedBarPlot(data) {
    console.log("Rendering vertical stacked bar charts");
    console.log(data)
    var margin = { top: 20, right: 30, bottom: 30, left: 60 };
    var width = 800 - margin.left - margin.right;
    var height = 800 - margin.top - margin.bottom;
    d3.select("#vertical_stacked_bar_plot_svg").selectAll("*").remove();

    // Create SVG for the bar chart
    const svg = d3.select("#vertical_stacked_bar_plot_svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Dummy data
    // var data = [
    //     { year: 2010, diseases: { A: 20, B: 30, C: 40, D: 50, E: 60 } },
    //     { year: 2011, diseases: { A: 30, B: 40, C: 50, D: 60, E: 70 } },
    //     { year: 2012, diseases: { A: 40, B: 50, C: 60, D: 70, E: 80 } }
    //     // Add more data points as needed
    // ];

    // Extracting the keys (disease names) from the first data entry
    var keys = Object.keys(data[0].diseases);
    console.log("Keys:",keys)
    // Define colors for diseases
    // var diseaseColors = {
    //     A: "#1f77b4", // blue
    //     B: "#ffea00", // yellow
    //     C: "#2ca02c", // green
    //     D: "#d62728", // red
    //     E: "#9467bd" // purple
    // };
    var diseaseColors = {
        "Alcohol use disorders (%)": "#1f77b4", // blue
        'Bipolar disorder (%)': "#ffea00", // yellow
        'Eating disorders (%)': "#2ca02c", // green
        'Depression (%)': "#d62728", // red
        'Drug use disorders (%)': "#9467bd" // purple
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
        .attr("y", function(d) { return height; })
        .attr("height", function(d) { return 0; }) // Calculate height based on y value
        .attr("width", x.bandwidth() / keys.length)
        // Add mouseover effect
        .transition()
        .duration(1000)
        .attr("y", function(d) { return y(d.y); })
        .attr("height", function(d) { return height - y(d.y); }) // Calculate height based on y value
        .on('end', function(){

            svg.selectAll('rect')
            .append('title')
            .text(d => `${d.y}`);

            svg.selectAll('rect')
                .on("mouseover", function(d) {
                    d3.select(this).attr("fill", "gray");
                    
                })
                // Add mouseout effect
                .on("mouseout", function(d) {
                    d3.select(this).attr("fill", diseaseColors[d3.select(this.parentNode).datum().key]);
        
                    // Remove text label
                    svg.select(".tooltip").remove();
                });

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

let threshold_mem = slider_start_value
export async function renderMDSVariablePlot(X_pca1, feature_names, correlation_matrix,threshold=threshold_mem) {
    console.log("IN UPDATE BIPLOT");
    console.log(feature_names);
    const svg = d3.select("#corr_plot_svg");
    svg.selectAll("*").remove();
    console.log("THRESHODL MEM: ",threshold_mem)

    // const plotGroup = d3.select("#screeplot").select("g");

    // // Remove existing MDS variable plot elements
    // plotGroup.selectAll(".point").remove();

    const xval = 0;
    const yval = 1;

    console.log("value", xval, yval);

    const margin = { top: 80, right: 100, bottom: 50, left: 100 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const xExtent = d3.extent(X_pca1, d => d[0]);
    const yExtent = d3.extent(X_pca1, d => d[1]);

    const maxExtent = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]), Math.abs(yExtent[0]), Math.abs(yExtent[1]));

    const xScale = d3.scaleLinear()
        .domain([-maxExtent, maxExtent])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([-maxExtent, maxExtent])
        .range([height, 0]);


    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // g.append("text")
    //     .attr("x", width - 250)
    //     .attr("y", margin.top - 140)
    //     .style("font-weight", "bold")
    //     .style("fill", "#ff9933")
    //     .text("Legend for Loading Vectors");

    
    const VarColors = ["teal", "lightblue", "coral", "lightgreen", "violet", "orange", "pink", "gold", "lightgray", "lightsteelblue", "lightcoral"];

    const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - margin.right - 10}, 15)`);

    legend.selectAll("text")
        .data(X_pca1)
        .enter().append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 20 + 9)
        .text((d, i) => `${feature_names[i]}`) // Map short names to full names
        .style("fill", (d, i) => `${VarColors[i]}`)
        .style("font-size", "15px")
        .attr("alignment-baseline", "middle");


    // Draw circles for each data point
    const circles = g.selectAll("circle.point") // Select circles with class "point"
    .data(X_pca1)
    .enter().append("circle")
    .attr("class", "point") // Add class "point" to circles
    .attr("cx", d => xScale(d[xval]))
    .attr("cy", d => yScale(d[yval]))
    .attr("r", 9)
    .attr("fill", (d, i) => VarColors[i])
    .attr("opacity", 0.7)
    .attr("feature", (d, i) => feature_names[i])

    .on("click", function () {
        const featureName = d3.select(this).attr("feature"); // Retrieve feature name attribute
        console.log("Clicked feature:", featureName);
        const clickedCircle = d3.select(this);
        const text = g.append("text")
            .attr("x", clickedCircle.attr("cx"))
            .attr("y", clickedCircle.attr("cy"))
            .attr("dy", -15) // Offset the text slightly above the circle
            .style("fill", "white")
            .style("font-size", "12px")
            .attr("class", "circle-text") // Assign a class to the text element
            .text(order_n);
        order_n = order_n + 1;
        feature_order.push(featureName);
        if (order_n === 8) {
            console.log("Updating PCP", feature_order);
            const message = g.append("text")
        .attr("x", 50)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "24px")
        .text("PCP Order Updated");
    setTimeout(() => {
        message.remove(); // Remove the message after 5 seconds
    }, 5000); // Duration in milliseconds (5 seconds)

            updatePCPOrder(feature_order);
            // Remove all text elements next to circles
            g.selectAll(".circle-text").remove();
    
            // Reset order_n back to 0
            order_n = 1;
            feature_order = [];
        }
    })
    
    
    .on("mouseover", function () {
        d3.select(this).attr("r", 12); // Increase size on hover
    })
    .on("mouseout", function () {
        d3.select(this).attr("r", 9); // Reset size on mouseout
    })
    .append("title")
    .text((d, i) => `${feature_names[i]}: (${d[xval]}, ${d[yval]})`);

    // Draw lines between all pairs of variables
    for (let i = 0; i < X_pca1.length; i++) {
        for (let j = i + 1; j < X_pca1.length; j++) {
            const correlation = correlation_matrix[i][j]; // Get correlation value
            // let threshold = 0
            if (Math.abs(correlation) >= threshold) {
                const opacity = Math.abs(correlation); // Opacity based on absolute correlation value
    
                const textX = (xScale(X_pca1[i][xval]) + xScale(X_pca1[j][xval])) / 2; // Calculate text x position
                const textY = (yScale(X_pca1[i][yval]) + yScale(X_pca1[j][yval])) / 2; // Calculate text y position
    
                const line = g.append("line")
                    .attr("x1", xScale(X_pca1[i][xval]))
                    .attr("y1", yScale(X_pca1[i][yval]))
                    .attr("x2", xScale(X_pca1[j][xval]))
                    .attr("y2", yScale(X_pca1[j][yval]))
                    .style("stroke", function(d) { return correlation > 0 ? "green" : "red"; }) // Fixed color
                    .style("stroke-width", 5) // Constant width
                    .style("opacity", opacity); // Set opacity based on correlation value
    
                // Append text marker (hidden by default)
                const text = g.append("text")
                    .attr("x", textX)
                    .attr("y", textY)
                    .attr("dy", -5) // Offset the text slightly above the line
                    .style("fill", "white")
                    .style("font-size", "12px")
                    .text(`${feature_names[i]} - ${feature_names[j]}: ${correlation.toFixed(2)}`)
                    .style("display", "none"); // Hide text initially
    
                // Show text on line hover
                line.on("mouseover", function () {
                    console.log("HOVERING")
                    text.style("display", "block");
                })
                .on("mouseout", function () {
                    text.style("display", "none");
                });
            }
        }
    }


    g.append("g")
        .attr("transform", `translate(0, ${height / 2})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .attr("transform", `translate(${width / 2}, 0)`)
        .call(d3.axisLeft(yScale));

    
        const sliderGroup = g.append("g")
        .attr("class", "slider")
        .attr("transform", `translate(${width / 2 + 100}, ${height + 20})`);
    
    // Append axis line
    const axisLine = sliderGroup.append("line")
        .attr("class", "axis-line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 200)
        .attr("y2", 0)
        .style("stroke", "white")
        .style("stroke-width", 2); // Adjust line width as needed
    
    // Add ticks for minimum and maximum values
    const minTick = sliderGroup.append("text")
        .attr("class", "slider-tick")
        .attr("text-anchor", "middle")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", "1.5em")
        .style("fill", "white")
        .text("0");
    
    const maxTick = sliderGroup.append("text")
        .attr("class", "slider-tick")
        .attr("text-anchor", "middle")
        .attr("x", 200)
        .attr("y", 0)
        .attr("dy", "1.5em")
        .style("fill", "white")
        .text("1");
    
    // Add text element to display slider value
    const sliderValueText = sliderGroup.append("text")
        .attr("class", "slider-value")
        .attr("text-anchor", "middle")
        .attr("x", 100) // Position at the center initially
        .attr("y", -20) // Position above the slider
        .style("fill", "white")
        .text(threshold_mem.toFixed(2)); // Initial text (slider value)
    
    // Add slider handle
    const handle = sliderGroup.append("circle")
        .attr("class", "handle")
        .attr("r", 9)
        .style("fill", "white")
        .attr("cx", threshold_mem * 200) // Initial position based on threshold_mem
        .call(d3.drag()
            .on("end", function(event) { // Use "end" event instead of "drag"
                const x = Math.max(0, Math.min(200, event.x)); // Ensure handle stays within slider bounds
                handle.attr("cx", x);
    
                // Map x-coordinate to slider value between 0 and 1
                const sliderValue = x / 200;
    
                // Update threshold memory variable
                threshold_mem = sliderValue;
                console.log("THRESHOLD SET TO :", threshold_mem)
    
                // Update slider value text
                sliderValueText.text(threshold_mem.toFixed(2));
    
                // Update MDS plot with new threshold value
                renderMDSVariablePlot(X_pca1, feature_names, correlation_matrix, sliderValue);
            }));
    



}