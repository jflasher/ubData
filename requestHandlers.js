var http = require("http");
var htmlParse = require("./htmlParse");

// Call out to parse the data and return it as a JSON object
function data(response) {
	var body = '';
	var options = {
		host: 'www.ub-air.info',
		port: 80,
		path: '/ub-air/laq/average-30min.html'
	};
	
	var wholePage = '';
	http.get(options, function(res) {
		res.on('data', function (chunk) {
			wholePage += chunk;
		});
		
		res.on('end', function() {
			response.end(htmlParse.parse(wholePage));
		});
	}).on('error', function(e) {
		  response.end('{"results": {"error": "' + e.message + '"}}');
	});
}

// Show a simple info page
function showInfo(response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	var body = '<html>'+
		'<head>'+
		'<meta http-equiv="Content-Type" content="text/html; '+
		'charset=UTF-8" />'+
		'<title>Ulaanbaatar Air Pollution Simple API</title>'+
		'</head>'+
		'<body>'+
		'<center><h1>Simple API for Ulaanbaatar Air Pollution Measurements</h1></center>'+
		'<h2>Purpose</h2>'+
		'<p>The purpose of this simple API is to allow for the easier use of the air pollution data that exists for Ulaanbaatar, Mongolia. '+
		'I was interested in working on a simple project and needed access to this data but it was not available in an easy to get at form. '+
		'Therefore, I decided to go ahead and create something that would allow others access to the available data in an easy to use manner.</p>'+
		'<p>As described below, the code parses an already existing webpage and pulls out the relevant info. This is super susceptible to breaking '+
		'since it is dependent on the format of the webpage. I will try to keep up with any changes, but if anything seems to be amiss, please feel '+
		'free to contact me.</p>'+
		'<h2>Usage</h2>'+
		'<p>Right now there is only one API call<br/>'+
		'<blockquote><a href="http://ubdata.cloudfoundry.com/data">http://ubdata.cloudfoundry.com/data</a></blockquote>'+
		'This call will return a valid JSON object with a root of "results".</p>'+
		'<p>On success, the results object will contain the following items:<br/>'+
		'<ul><li>startDate - The start date of the measurement period</li>'+
		'<li>endDate - The end date of the measurement</li>'+
		'<li>properties - An array of strings defining what properties are being measured</li>'+
		'<li>units - An array of strings defining the measurement units in the same order as the properties array</li>'+
		'<li>stations - An array of Station objects</li></ul></p>'+
		'<p>On failure, the results object will contain the following items:<br/>'+
		'<ul><li>error - A string containing the reason for failure</li></ul></p>'+
		'<p>Each Station object will contain the following items:<br/>'+
		'<ul><li>name - The name of the station</li>'+
		'<li>values - An array of float values corresponding to the properties and units in the relevant arrays (null if not present in data set)</li></ul></p>'+
		'<p><em>Note: Because the API is calling out to another webpage and then parsing the data, it can take some time to return the JSON data.</em></p>'+
		'<h2>Data Source</h2>'+
		'<p>The data is currently coming from <a href="http://ub-air.info/ub-air/laq/average-30min.html">http://ub-air.info/ub-air/laq/average-30min.html</a>.</p>'+
		'<h2>Code Description</h2>'+
		'<p>The code that runs the API server can be found at <a href="https://github.com/jflasher/ubData">https://github.com/jflasher/ubData</a>. It is a simple '+
		'<a href="http://nodejs.org/">node.js</a> server that will connect to the data source and parse the HTML response for the relevant info and return a JSON object. '+
		'Because the parsing function is tied very intricately to the layout of the webpage, any significant changes to the webpage could very well break the API. Not ideal '+
		'but it is better than nothing!</p>'+
		'<h2>Contact</h2>'+
		'<p>If any problems arise, please feel free to contact me at <a href="mailto:joe@joeflasher.com?subject=UB%20Data%20API">joe@joeflasher.com</a>.</p>'+
		'</body>'+
		'</html>';
	response.end(body);
}

exports.data = data;
exports.showInfo = showInfo;