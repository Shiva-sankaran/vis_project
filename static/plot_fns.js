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
    // Add chart title
    // svg.append("text")
    //    .attr("x", width / 2)
    //    .attr("y", 0 - (margin.top / 2))
    //    .attr("text-anchor", "middle")
    //    .style("font-size", "16px")
    //    .text("Income Categories");

    svg.append("text")
    .attr('class', 'axis-label')
    .attr("transform", `translate(${width / 2},${height + margin.top + 30})`)
    .style("text-anchor", "middle")
    .text("Income Categories");
}
