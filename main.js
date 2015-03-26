/*global d3 */
'use strict';

var margin = {top: 20, right: 10, bottom: 150, left: 70};
var margin2 = {top: 480, right: 10, bottom: 40, left: 70};
var width = 960 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;
var height2 = 600 - margin2.top - margin2.bottom;

var dataset;

var x = d3.time.scale().range([0, width]),
    x2 = d3.time.scale().range([0, width]),
    y = d3.scale.linear().nice().range([height, 0]),
    y2 = d3.scale.pow().exponent(0.7).range([height2, 0]);

var xAxis = d3.svg.axis().scale(x).orient('bottom'),
    xAxis2 = d3.svg.axis().scale(x2).orient('bottom'),
    yAxis = d3.svg.axis().scale(y).orient('left');

var brush = d3.svg.brush()
    .x(x2)
    .on('brush', brushed);

var area2 = d3.svg.area()
    .interpolate('monotone')
    .x(function(d) { return x2(d.date); })
    .y0(height2)
    .y1(function(d) { return y2(d.pm25); });

var svg = d3.select('.chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

svg.append('defs').append('clipPath')
    .attr('id', 'clip')
  .append('rect')
    .attr('width', width)
    .attr('height', height);

var focus = svg.append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var context = svg.append('g')
    .attr('class', 'context')
    .attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')');

d3.csv('data.csv', type, function(error, data) {
  dataset = data;

  x.domain(d3.extent(data.map(function(d) { return d.date; })));
  y.domain([0, 6000]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  focus.selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('cx', function(d) {
      return x(d.date);
    })
    .attr('cy', function(d) {
      return y(d.pm25);
    })
    .attr('r', 5)
    .attr('fill', function(d) {
      if (d.pm25 <= 15.4) {
        return '#01e24b';
      } else if (d.pm25 <= 40.4) {
        return '#fff958';
      } else if (d.pm25 <= 65.4) {
        return '#ff7c30';
      } else if (d.pm25 <= 150.4) {
        return '#ff211d';
      } else {
        return '#7f0c24';
      }
    })
    .on('mouseover', function(d){
      tip.show(d);
    })
    .on('mouseout', function(){
      tip.hide();
    });

  focus.call(tip);

  focus.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

  focus.append('g')
      .attr('class', 'y axis')
      .call(yAxis);

  // X axis title
  var g = focus.append('g');
  g.append('text')
    .attr('transform', 'translate(' + ((width - margin.left) / 2) + ',' +
      (height + margin.bottom) + ')')
    .style('text-anchor', 'middle')
    .attr('class', 'x axis title')
    .text('Date (ULAT)');

  // Y axis title
  g = focus.append('g');
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left)
    .attr('x', -(height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .attr('class', 'y axis title')
    .text('PM25 \u00B5g/m\u00B3');

  context.append('path')
      .datum(data)
      .attr('class', 'area')
      .attr('d', area2);

  context.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height2 + ')')
      .call(xAxis2);

  var brushg = context.append('g')
      .attr('class', 'x brush')
      .call(brush);
  brushg.selectAll('rect')
      .attr('y', -6)
      .attr('height', height2 + 7);
});

function brushed() {
  x.domain(brush.empty() ? x2.domain() : brush.extent());
  focus.selectAll('circle')
    .data(dataset)
    .transition()
    .attr('cx', function(d) {
      return x(d.date);
    })
    .attr('cy', function(d) {
      return y(d.pm25);
    });
  focus.select('.x.axis').call(xAxis);
}

function type(d) {
  // The average date is start time plus 1.5 hours
  d.date = +d.startTime + 5400000;
  d.pm25 = +d.pm25;
  return d;
}

var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
  var date = d3.time.format('%Y-%m-%d')(new Date(d.date));
  var m = d.pm25.toFixed(0) + ' \u00B5g/m\u00B3';
  return '<div><p>Date: ' + date + '</p><p>PM25: ' + m + '</p></div>';
}).offset([-10,0]);
