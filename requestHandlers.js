var https = require("https");
var OAuth= require('oauth').OAuth;
var keys = require('./twitterkeys');

// Get the most recent data
var getData = function (callback) {
	// Not sure this url will always work?
	var options = {
		host: 'dl.dropboxusercontent.com',
		port: 443,
		path: '/sh/9knt5t1vuhq2i1x/1S6hOJ5QQO/PM25.txt?token_hash=AAEJ3Aah6f0CwRAeJ58uBE6HD50gjD7T-iovsaUSOVhrmg'
	};

	var data = '';
	https.get(options, function (res) {
		
		res.on('data', function (chunk) {
			data += chunk;
		});

		res.on('end', function () {	
			// Split on ';'
			var components = data.split(';');

			// Make sure we have valid data
			if (components.length === 0) {
				callback(undefined);
			}

			var measurement = {};
			var times = components[1].split('-');
			measurement.startTime = Date.parse(components[0] + ' ' + times[0]);
			measurement.endTime = Date.parse(components[0] + ' ' + times[1]);
			measurement.pm25 = components[2];
			var station = {
				id: components[3],
				latitude: components[4],
				longitude: components[5]
			};
			measurement.station = station;
			
			callback(measurement);
		});

	}).on('error', function (e) {
		console.log(e);
		callback(undefined);
	});

};

var getMostRecent = function (req, res) {
	getData(function (data) {
		if (data === undefined) {
			res.end('{"results": {"error": "no data"}}');
		} else {
			res.end(JSON.stringify(data));
		}
	});
};

// Send out a tweet with the pollution info
var sendTweet = function (req, res) {
	getData(function (data) {
		////
		// Build the string to tweet
		////
		
		// The average PM value
		pm25 = data.pm25 * 1000;
		
		// The WHO recommended value
		var who25 = 25.0;
		
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
		var textMN = dayStringMN + " " + curHour + ":" + curMin + " цагийн байдлаар УБ-ын " + stations.length + " станцын 24 цагийн дундаж түвшин PM2.5=" + pm25 + "\u00B5g/m\u00B3 байгаа нь ДЭМБ-ийн зөвлөмжөөс " + m + " дахин их байна.";
		
		//console.log(textEN);
		//console.log(textMN);
		//console.log(textEN.length);
		//console.log(textMN.length);
		
		// Tweet the English then tweet the Mongolian 30 seconds later to ensure it shows up in feeds
		//tweet(textEN);
		//setTimeout(function() {tweet(textMN);},30000);
		res.end('{"results": {"success": "1"}}');

	});	
	
	// // Get the data
	// var body = '';
	// var options = {
	// 	host: 'www.ub-air.info',
	// 	port: 80,
	// 	path: '/ub-air/laq/average-24h.html'
	// };
	
	// var wholePage = '';
	// http.get(options, function(res) {
	// 	res.on('data', function (chunk) {
	// 		wholePage += chunk;
	// 	});
		
	// 	res.on('end', function() {
	// 		var data = JSON.parse(htmlParse.parse(wholePage));
	// 		var pm25Arr = [];
	// 		var stations = data.results.stations;
	// 		//console.log(stations.values);
	// 		for (var i = 0; i < stations.length; i++) {
	// 			// Get the PM 2.5 value
	// 			var pm = stations[i].values[1];
				
	// 			// If it's not null or 0.000, add it to the array
	// 			if (pm != null && pm != 0) {
	// 				pm25Arr.push(pm);
	// 			}
	// 		}
			
	// 		// If we have no values, just get out of here
	// 		if (pm25Arr.length == 0) {
	// 			response.end();
	// 			return;
	// 		}
			
	// 		////
	// 		// Build the string to tweet
	// 		////
			
	// 		// The average PM value
	// 		pm25 = (pm25Arr.sum() * 1000.0 / pm25Arr.length).toFixed(0);
			
	// 		// The WHO recommended value
	// 		var who25 = 25.0;
			
	// 		// Find the difference between WHO and current
	// 		var m = (pm25 / who25).toFixed(1);
			
	// 		// Build up the date and time
	// 		var d = new Date();
	// 		var localTime = d.getTime();
	// 		var localOffset = d.getTimezoneOffset() * 60000;
	// 		var utc = localTime + localOffset;
	// 		var offset = 8.0;   
	// 		var mng = utc + (3600000*offset);
	// 		var today = new Date(mng);
	// 		var dd = today.getDate();
	// 		var mm = today.getMonth()+1; //January is 0!
	// 		var yyyy = today.getFullYear();
	// 		if(dd<10){dd='0'+dd} 
	// 		if(mm<10){mm='0'+mm} 
	// 		var dayStringEN = mm+'/'+dd+'/'+yyyy;
	// 		var dayStringMN = yyyy+'/'+mm+'/'+dd;
	// 		var curHour = (today.getHours() < 10 ? "0" + today.getHours() : today.getHours());
	// 		var curMin = today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes();
			
	// 		// English string
	// 		var textEN = "PM2.5 = " + pm25 + "\u00B5g/m\u00B3, this is " + m + "X the WHO 24hr guideline. Reporting 24hr average from " + pm25Arr.length + " of " + stations.length + " stations as of " + dayStringEN + " " + curHour + ":" + curMin + ". #UBAir";
			
	// 		// Mongolian string
	// 		var textMN = dayStringMN + " " + curHour + ":" + curMin + " цагийн байдлаар УБ-ын " + stations.length + " станцын 24 цагийн дундаж түвшин PM2.5=" + pm25 + "\u00B5g/m\u00B3 байгаа нь ДЭМБ-ийн зөвлөмжөөс " + m + " дахин их байна.";
			
	// 		//console.log(textEN);
	// 		//console.log(textMN);
	// 		//console.log(textEN.length);
	// 		//console.log(textMN.length);
			
	// 		// Tweet the English then tweet the Mongolian 30 seconds later to ensure it shows up in feeds
	// 		//tweet(textEN);
	// 		//setTimeout(function() {tweet(textMN);},30000);
	// 		response.end();
	// 	});
	// });
};

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
};

Array.prototype.sum = function() {
	for (var i = 0, L = this.length, sum = 0; i < L; sum += this[i++]);
	return sum;
};

exports.getMostRecent = getMostRecent;
exports.sendTweet = sendTweet;