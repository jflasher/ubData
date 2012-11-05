var http = require("http");
var url  = require("url");
var htmlParse = require("./htmlParse");
var OAuth= require('oauth').OAuth;
var keys = require('./twitterkeys');

// Call out to parse the data and return it as a JSON object
function data24h(response) {
	var body = '';
	var options = {
		host: 'www.ub-air.info',
		port: 80,
		path: '/ub-air/laq/average-24h.html'
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

// Call out to parse the data and return it as a JSON object
function data30m(response) {
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
		'<p>Right now there are only two API calls<br/>'+
		'<blockquote><a href="http://ubdata.cloudfoundry.com/data30m">http://ubdata.cloudfoundry.com/data30m</a></blockquote><br/>'+
		'and</br>'+
		'<blockquote><a href="http://ubdata.cloudfoundry.com/data24h">http://ubdata.cloudfoundry.com/data24h</a></blockquote>'+
		'This call will return a valid JSON object with a root of "results" for 30 minute measurements or 24 hour measurements, respectively.</p>'+
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
		'<p>The data is currently coming from <a href="http://ub-air.info/ub-air/laq/average-30min.html">http://ub-air.info/ub-air/laq/average-30min.html</a> and <a href="http://ub-air.info/ub-air/laq/average-24h.html">http://ub-air.info/ub-air/laq/average-24h.html</a>.</p>'+
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

// Send out a tweet with the pollution info
function sendTweet(response, request) {
	// Make sure it's a valid request by checking our key
	var urlParts = url.parse(request.url, true);
	var key = urlParts.query["key"];
	if (key != keys.myServerKey) {
		response.end();
		return;
	}
	
	// Get the data
	var body = '';
	var options = {
		host: 'www.ub-air.info',
		port: 80,
		path: '/ub-air/laq/average-24h.html'
	};
	
	var wholePage = '';
	http.get(options, function(res) {
		res.on('data', function (chunk) {
			wholePage += chunk;
		});
		
		res.on('end', function() {
			var data = JSON.parse(htmlParse.parse(wholePage));
			var pm25Arr = [];
			var stations = data.results.stations;
			//console.log(stations.values);
			for (var i = 0; i < stations.length; i++) {
				// Get the PM 2.5 value
				var pm = stations[i].values[1];
				
				// If it's not null or 0.000, add it to the array
				if (pm != null && pm != 0) {
					pm25Arr.push(pm);
				}
			}
			
			// If we have no values, just get out of here
			if (pm25Arr.length == 0) {
				response.end();
				return;
			}
			
			////
			// Build the string to tweet
			////
			
			// The average PM value
			pm25 = pm25Arr.sum() * 1000. / pm25Arr.length;
			
			// The WHO recommended value
			var who25 = 25.;
			
			// Find the difference between WHO and current
			var m = (pm25 / who25).toFixed(1);
			
			// Build up the date and time
			var d = new Date();
			var localTime = d.getTime();
			var localOffset = d.getTimezoneOffset() * 60000;
			var utc = localTime + localOffset;
			var offset = 8.0;   
			var mng = utc + (3600000*offset);
			var today = new Date(mng);
			var dd = today.getDate();
			var mm = today.getMonth()+1; //January is 0!
			var yyyy = today.getFullYear();
			if(dd<10){dd='0'+dd} 
			if(mm<10){mm='0'+mm} 
			var dayStringEN = mm+'/'+dd+'/'+yyyy;
			var dayStringMN = yyyy+'/'+mm+'/'+dd;
			var curHour = (today.getHours() < 10 ? "0" + today.getHours() : today.getHours());
			var curMin = today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes();
			
			// English string
			var textEN = "PM2.5 = " + pm25 + "\u00B5g/m\u00B3, this is " + m + "X the WHO 24hr guideline. Reporting 24hr average from " + pm25Arr.length + " of " + stations.length + " stations as of " + dayStringEN + " " + curHour + ":" + curMin + ". #UBAir";
			
			// Mongolian string
			var textMN = "PM2.5 = " + pm25 + "\u00B5g/m\u00B3. ДЭМБ 24 цагийн удирдамж харицуулхад " + m + "X. " + dayStringMN + ", " + curHour + ":" + curMin + " цагийн байдлаар 24 цагийн дунджаар " + stations.length + " станцын " + pm25Arr.length + " ээс мэдээлэв.";
			
			//console.log(textEN);
			//console.log(textMN);
			//console.log(textEN.length);
			//console.log(textMN.length);
			
			// Tweet the English then tweet the Mongolian 30 seconds later to ensure it shows up in feeds
			tweet(textEN);
			setTimeout(function() {tweet(textMN);},30000);
			response.end();
		});
	});
}

// The function to actually send the tweet given a message
var tweet = function(text) {
	var tweeter = new OAuth(
		"https://api.twitter.com/oauth/request_token",
		"https://api.twitter.com/oauth/access_token",
		keys.consumerKey,
		keys.consumerSecret,
		"1.0",
		null,
		"HMAC-SHA1"
	);
	// Lat/lon 47.920709, 106.905848
    var body = ({'status': text, 'lat': 47.920709, 'long': 106.905848});
	tweeter.post("http://api.twitter.com/1/statuses/update.json",
	keys.token, keys.secret, body, "application/json",
	function (error, data, response) {
		if (error) {
			console.log('{"results": {"error": "' + JSON.stringify(error) + '"}}');
		}
	});
}

Array.prototype.sum = function() {
	for (var i = 0, L = this.length, sum = 0; i < L; sum += this[i++]);
	return sum;
}

exports.data24h = data24h;
exports.data30m = data30m;
exports.showInfo = showInfo;
exports.sendTweet = sendTweet;