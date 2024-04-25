import { findElbowPoint,updateBiPlot,updateScatterMatrix,updateImpAttr } from "./support.js";

let selectedScreeBarIndex = -1; 
let selectedMSEBarIndex = -1;

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

function clusterColor(clusterLabel) {
    const colors = ["red", "blue", "green", "orange", "purple", "yellow"]; 
    return colors[clusterLabel];
}

export async function updateScreePlot(data, cum_exp_var) {
    console.log("UPDATING SCREE PLOT");
    const svg = d3.select("#screeplot");
    console.log("SVGGG:")
    console.log(svg)
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    if(selectedScreeBarIndex === -1){
        selectedScreeBarIndex = await findElbowPoint(data)
        console.log("ELBOW POINT IN UPDATE SCREE",selectedScreeBarIndex)
        const intrinsicFormData = {
            intrinsic_dim: selectedScreeBarIndex,
        };
        sendData('/set_intrinsic_dim', intrinsicFormData);

    }
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(data.map((d, i) => i + 1))
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 1]);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const bars = g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => xScale(i + 1))
        .attr("y", d => yScale(d))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d))
        .attr("fill", (d, i) => i === selectedScreeBarIndex-1? "red" : "steelblue")
        .attr("data-index", (d, i) => i+1) 
        .on("mouseover", function() {
            d3.select(this).attr("fill", "orange");
        })
        .on("mouseout", function() {
            const index = +d3.select(this).attr("data-index"); 
            d3.select(this).attr("fill", index === selectedScreeBarIndex ? "red" : "steelblue");
        })
        .on("click", function() {
            selectedScreeBarIndex = +d3.select(this).attr("data-index"); 
            console.log("SELECTED: ",selectedScreeBarIndex)
            const intrinsicFormData = {
                intrinsic_dim: selectedScreeBarIndex,
            };
            sendData('/set_intrinsic_dim', intrinsicFormData);
            updateBiPlot()
            updateImpAttr()
            updateScatterMatrix()
            updateScreePlot(data, cum_exp_var); 
       });

    bars.append("title")
        .text((d, i) => `Principal Component: ${i + 1}\nVariance Explained: ${(d * 100).toFixed(2)}%`); 

    const cumLine = d3.line()
        .x((d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
        .y((d, i) => yScale(cum_exp_var[i])); 
    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("d", cumLine);

    const line = d3.line()
        .x((d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
        .y(d => yScale(d));

    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#ff9933")
        .attr("stroke-width", 2)
        .attr("d", line);
    g.selectAll(".circle")
        .data(cum_exp_var)
        .enter().append("circle")
        .attr("class", "circle")
        .attr("cx", (d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
        .attr("cy", (d, i) => yScale(cum_exp_var[i]))
        .attr("r", 4)
        .attr("fill", "green");

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr('class', 'axis-label')
        .attr("transform", `translate(${width / 2},${height + margin.top + 40})`)
        .style("text-anchor", "middle")
        .text("Principal Component");

    svg.append("text")
        .attr('class', 'axis-label')
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Variance Explained (%)");
}

export async function updateKMeansMSEPlot(data) {
    const svg = d3.select("#kmeans_mse_plot");
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 100 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    if(selectedMSEBarIndex === -1){
        selectedMSEBarIndex = await findElbowPoint(data)
        const numClustersFormData = {
            num_clusters: selectedMSEBarIndex,
        };
        sendData('/set_num_clusters', numClustersFormData);
    }

    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(data.map((d, i) => i + 1))
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data)])
        .nice();

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format(".2e")); 

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const bars = g.selectAll(".kmeans-bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => xScale(i + 1))
        .attr("y", d => yScale(d))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d))
        .attr("fill", (d, i) => i === selectedMSEBarIndex-1? "red" : "steelblue")
        .attr("data-index", (d, i) => i+1) 
        .on("mouseover", function(d, i) {
            d3.select(this).attr("fill", "orange");
        })
        .on("mouseout", function(d, i) {
            const index = +d3.select(this).attr("data-index"); 
            d3.select(this).attr("fill", index === selectedMSEBarIndex ? "red" : "steelblue");
        })
        .on("click", function() {
            selectedMSEBarIndex = +d3.select(this).attr("data-index"); 
            console.log("SELECTED: ",selectedMSEBarIndex)
            const numClustersFormData = {
                num_clusters: selectedMSEBarIndex,
            };
            sendData('/set_num_clusters', numClustersFormData);
            updateBiPlot()
            updateScatterMatrix()
            updateKMeansMSEPlot(data); 
        });

    bars.transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("y", d => yScale(d))
        .attr("height", d => height - yScale(d));

    bars.append("title")
        .text((d, i) => `MSE: ${d.toExponential()}`); 

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(yAxis); 
         svg.append("text")
        .attr('class', 'axis-label')
        .attr("transform", `translate(${width / 2},${height + margin.top + 40})`)
        .style("text-anchor", "middle")
        .text("Number of Clusters (k)");

    svg.append("text")
        .attr('class', 'axis-label')
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Mean Squared Error (MSE)");
}

export function updatePCABiplot(X_pca, pca_components, cluster_labels, feature_names) {
    console.log("IN UPDATE BIPLOT");
    console.log(feature_names);
    const svg = d3.select("#pca_biplot");
    svg.selectAll("*").remove();

    const xval = document.getElementById("x-pc-select").value - 1;
    const yval = document.getElementById("y-pc-select").value - 1;

    console.log("value",xval,yval);

    const margin = { top: 80, right: 100, bottom: 50, left: 100 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const xExtent = d3.extent(X_pca, d => d[0]);
    const yExtent = d3.extent(X_pca, d => d[1]);
    const maxExtent = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]), Math.abs(yExtent[0]), Math.abs(yExtent[1]));

    const maxDataValue = Math.max(Math.abs(d3.max(pca_components, d => d[xval])), Math.abs(d3.min(pca_components, d => d[xval])),
                                   Math.abs(d3.max(pca_components, d => d[yval])), Math.abs(d3.min(pca_components, d => d[yval])));
    const loadingsScale = maxExtent / maxDataValue * 0.4; 
    const xScale = d3.scaleLinear()
        .domain([-maxExtent, maxExtent])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([-maxExtent, maxExtent])
        .range([height, 0]);

    const arrowColors = d3.scaleOrdinal(d3.schemeCategory10);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("text")
        .attr("x", width - 250) 
        .attr("y", margin.top - 140)
        .style("font-weight", "bold")
        .style("fill","#ff9933")
        .text("Legend for Loading Vectors");

    g.selectAll(".point")
        .data(X_pca)
        .enter().append("circle")
        .attr("class", "point")
        .attr("cx", d => xScale(d[xval]))
        .attr("cy", d => yScale(d[yval]))
        .attr("r", 3)
        .attr("fill", (d, i) => clusterColor(cluster_labels[i]))
        .on("mouseover", function() {
            d3.select(this).attr("r", 5); 
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 3); 
        })
        .append("title") 
        .text((d, i) => `Data Point ${i+1}: (${d[xval]}, ${d[yval]})`);

    pca_components.forEach((component, i) => {
        const color = arrowColors(i); 

        const arrow = g.append("line")
            .attr("class", "arrow")
            .attr("x1", width/2)
            .attr("y1", height/2)
            .attr("x2", xScale(component[xval] * loadingsScale))
            .attr("y2", yScale(component[yval] * loadingsScale))
            .attr("marker-end", "url(#arrowhead-" + i + ")")
            .style("stroke", color)
            .style("stroke-width", 2) 
            .on("mouseover", function() {
                d3.select(this).style("stroke-width", 4); 
            })
            .on("mouseout", function() {
                d3.select(this).style("stroke-width", 2); 
            });

        arrow.append("title") 
            .text(`${feature_names[i]}\nUnscaled Loading Vector ${i+1}: (${component[xval]}, ${component[yval]})\nscaled Loading Vector ${i+1}: (${component[xval]* loadingsScale}, ${component[yval]* loadingsScale})`);

        g.append("text")
            .attr("x", width - 300) 
            .attr("y", margin.top - 120 + 20 * (i + 1)) 
            .style("fill", color)
            .style("font-size", "15px")
            .append("tspan") 
            .text(feature_names[i]);

        svg.append("defs").append("marker")
            .attr("id", "arrowhead-" + i)
            .attr("refX", 6)
            .attr("refY", 3)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0 L0,6 L9,3 z")
            .style("stroke", color) 
            .style("fill", color);
    });

    g.append("g")
        .attr("transform", `translate(0, ${height / 2})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .attr("transform", `translate(${width / 2}, 0)`)
        .call(d3.axisLeft(yScale));

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", -10)
        .style("fill", "#ff9933")
        .text("PC" + (yval+1));
    
    g.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", width+20)
        .style("fill", "#ff9933")
        .text("PC" + (xval+1));
}

export function renderScatterMatrix(scatterData, clusterLabels) {
    const margin = { top: 80, right: 50, bottom: 50, left: 50 };
    const scatterSize = 250; 
    const padding = 20; 
    const gridStroke = "lightgray";

    const columns = Object.keys(scatterData[0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const svg1 = d3.select("#scatter-matrix");
    svg1.selectAll("*").remove();

    const svg = d3.select("#scatter-matrix")
        .attr("width", scatterSize * columns.length + margin.left + margin.right)
        .attr("height", scatterSize * columns.length + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    for (let i = 0; i < columns.length + 1; i++) {
        const xPos = i * scatterSize;
        const yPos = i * scatterSize;

        svg.append("line")
            .attr("x1", xPos)
            .attr("y1", 0)
            .attr("x2", xPos)
            .attr("y2", scatterSize * columns.length)
            .style("stroke", gridStroke);

        svg.append("line")
            .attr("x1", 0)
            .attr("y1", yPos)
            .attr("x2", scatterSize * columns.length)
            .attr("y2", yPos)
            .style("stroke", gridStroke);
    }

    columns.forEach((xColumn, i) => {
        columns.forEach((yColumn, j) => {
            const xPos = i * scatterSize;
            const yPos = j * scatterSize;

            if (i !== j) {
                const plotSize = scatterSize - 2 * padding;

                const xExtent = d3.extent(scatterData, d => d[xColumn]);
                const yExtent = d3.extent(scatterData, d => d[yColumn]);

                const xScale = d3.scaleLinear()
                    .domain(xExtent)
                    .range([0, plotSize]);

                const yScale = d3.scaleLinear()
                    .domain(yExtent)
                    .range([plotSize, 0]);

                const g = svg.append("g")
                    .attr("transform", `translate(${xPos + padding},${yPos + padding})`);

                g.selectAll("circle")
                    .data(scatterData)
                    .enter().append("circle")
                    .attr("cx", d => xScale(d[xColumn]))
                    .attr("cy", d => yScale(d[yColumn]))
                    .attr("r", 3)
                    .style("fill", (d, index) => color(clusterLabels[`('${xColumn}', '${yColumn}')` ][index]))  
                    .on("mouseover", function() {
                        d3.select(this).attr("r", 5); 
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("r", 3); 
                    })
                    .append("title") 
                    .text((d, index) => `${xColumn}: ${d[xColumn]}, ${yColumn}: ${d[yColumn]}`);

                if (j === columns.length - 1) {
                    g.append("g")
                        .attr("transform", `translate(0,${plotSize + 2 * padding})`)
                        .call(d3.axisBottom(xScale).ticks(5))
                        .selectAll("text")
                        .attr("transform", "translate(-10,0)rotate(-45)"); 
                }

                if (i === 0) {
                    g.append("g")
                        .attr("transform", `translate(${-2 * padding}, 0)`)
                        .call(d3.axisLeft(yScale).ticks(5));
                }

                if (j === 0) {
                    g.append("g")
                        .attr("transform", `translate(0, ${-2 * padding})`)
                        .call(d3.axisTop(xScale).ticks(5))
                        .selectAll("text")
                        .attr("transform", "translate(0, -5)rotate(-45)");
                }

                if (i === columns.length - 1) {
                    g.append("g")
                        .attr("transform", `translate(${plotSize + 2 * padding}, 0)`)
                        .call(d3.axisRight(yScale).ticks(5));
                }
            } else {
                svg.append("text")
                    .attr("x", xPos + scatterSize / 2)
                    .attr("y", yPos + scatterSize / 2)
                    .attr("text-anchor", "middle")
                    .attr("transform", `rotate(-45 ${xPos + scatterSize / 2},${yPos + scatterSize / 2})`) 
                    .text(xColumn)
                    .attr("dy", "0.35em") 
                    .style("fill","#ff9933");
            }
        });
    });
}
