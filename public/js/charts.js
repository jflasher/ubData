var margin = {top: 20, right: 20, bottom: 60, left: 50},
    width = $('.container').width() - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var circleClass = function (d) {
  if (d.pm25 <= 15.4) {
    return 'circleColor1';
  } else if (d.pm25 <= 40.4) {
    return 'circleColor2';
  } else if (d.pm25 <= 65.4) {
    return 'circleColor3';
  } else if (d.pm25 <= 150.4) {
    return 'circleColor4';
  } else {
    return 'circleColor5';
  }
};

var line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.pm25); });

var svg = d3.select("#chart3hr").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.xhr("/1/mostRecentMeasurements", function(error, data) {
  if (error) {
    return;
  }
  data = JSON.parse(data.response);
  data.forEach(function(d) {
    d.date = d.startTime + (d.endTime - d.startTime) * 0.5;
    d.pm25 = d.pm25;
  });

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain(d3.extent(data, function(d) { return d.pm25; }));

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      // .attr("transform", "translate(0,30)")
      .attr("x", width * 0.5)
      .attr("y", 40)
      .attr("dx", ".71em")
      .style("text-anchor", "center")
      .text("Time (ULAT)");


  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height * 0.5)
      .attr("dy", ".71em")
      .style("text-anchor", "center")
      .text("PM2.5 (\u00B5g/m\u00B9)");

  svg.selectAll("circle")
      .data(data)
      .enter().append("svg:circle")
      .attr("class", function(d) { return circleClass(d); })
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.pm25); })
      .attr("r", 5);

  $('svg circle').tipsy({
    gravity: 's',
    html: true,
    fade: true,
    title: function() {
      var d = this.__data__;
      var prettyDate = new Date(d.date);
      prettyDate = prettyDate.toLocaleString();
      return '<p>Date: ' + prettyDate + '<br/>PM2.5: ' + d.pm25 + '</p>';
    }
  });

  // svg.append("path")
  //     .datum(data)
  //     .attr("class", "line")
  //     .attr("d", line);

});

// Hide other charts initially
$('#chartDay').hide();
$('#chartMonth').hide();

$('#btnDailyAverage').on('click', function (e) {
  e.preventDefault();
  $('#btn3hrAverage').removeClass('active');
  $('#btnMonthlyAverage').removeClass('active');
  $(this).addClass('active');
  $('#chart3hr').hide();
  $('#chartDay').show();
  $('#chartMonth').hide();
});

$('#btnMonthlyAverage').on('click', function (e) {
  e.preventDefault();
  $('#btn3hrAverage').removeClass('active');
  $('#btnDailyAverage').removeClass('active');
  $(this).addClass('active');
  $('#chart3hr').hide();
  $('#chartDay').hide();
  $('#chartMonth').show();
});

$('#btn3hrAverage').on('click', function (e) {
  e.preventDefault();
  $('#btnDailyAverage').removeClass('active');
  $('#btnMonthlyAverage').removeClass('active');
  $(this).addClass('active');
  $('#chart3hr').show();
  $('#chartDay').hide();
  $('#chartMonth').hide();
});