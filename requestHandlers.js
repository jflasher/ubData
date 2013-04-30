var https = require("https");
var OAuth= require('oauth').OAuth;

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
			measurement.pm25 = components[2] * 1000;
			var station = {
				id: components[3],
				latitude: parseFloat(components[4]),
				longitude: parseFloat(components[5])
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
		// Make sure we have data 
		if (data === undefined) {
			res.end('{"results": {"error": "no data"}}');
			return;
		}

		// Make sure the data is from within the last 3 hours
		var dLocal = new Date();
		var utcLocal = dLocal.getTime() + (dLocal.getTimezoneOffset() * 60000);
		var mnLocal = new Date(utcLocal + (3600000*8));
		var diff = mnLocal - data.endTime;
		if (diff > 3 * 60 * 60 * 1000) {
			res.end('{"results": {"error": "data older than 3hr"}}');
			return;
		}

		////
		// Build the string to tweet
		////
		var mnString = '';
		var enString = '';

		// Get the date
		var date = new Date(((data.endTime - data.startTime) * 0.5) + data.startTime);
		var startTime = new Date(data.startTime);
		var endTime = new Date(data.endTime);
		var dateString = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + startTime.getHours() + ':' + startTime.getMinutes() + '-' + endTime.getHours() + ':' + endTime.getMinutes();
		mnString += dateString + '; ';
		enString += dateString + '; ';

		// Get pm value
		enString += 'PM2.5=' + data.pm25.toFixed(0) + '\u00B5g/m\u00B3 (3hr avg); ';
		mnString += 'PM2.5=' + data.pm25.toFixed(0) + '\u00B5g/m\u00B3 (3цагийн дундаж); ';

		// Get AQI
		enString += getAQIStrings(data.pm25).en + ' (for 24-hr exposure at this level)';
		mnString += getAQIStrings(data.pm25).mn + ' (Тухайн төвшингөөр 24-цагт авах тун)';

		console.log(enString);
		console.log(mnString);
		// console.log(enString.length);
		// console.log(mnString.length);

		// Tweet the English then tweet the Mongolian 30 seconds later to ensure it shows up in feeds
		// tweet(enString);
		// setTimeout( function () {
		// 	tweet(mnString);
		// }, 30000);
		res.end('{"results": {"success": "1"}}');

	});
};

// The function to actually send the tweet given a message
var tweet = function(text) {
	var tweeter = new OAuth(
		"https://api.twitter.com/oauth/request_token",
		"https://api.twitter.com/oauth/access_token",
		process.env.CONSUMER_KEY,
		process.env.CONSUMER_SECRET,
		"1.0",
		null,
		"HMAC-SHA1"
	);
	// Lat/lon 47.920709, 106.905848
  var body = ({'status': text, 'lat': 47.920709, 'long': 106.905848});
	tweeter.post("http://api.twitter.com/1/statuses/update.json",
	process.env.TWITTER_TOKEN, process.env.TWITTER_SECRET, body, "application/json",
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

var getAQIStrings = function (pm25) {
	var aqi = {};

	if (pm25 <= 15.4) {
		aqi.en = 'Good';
		aqi.mn = 'Сайн';
	} else if (pm25 <= 40.4) {
		aqi.en = 'Moderate';
		aqi.mn = 'Дунд';
	} else if (pm25 <= 65.4) {
		aqi.en = 'Unhealthy for sensitive groups';
		aqi.mn = 'Эмзэг бүлэгт муу';
	} else if (pm25 <= 150.4) {
		aqi.en = 'Unhealthy';
		aqi.mn = 'Муу';
	} else if (pm25 <= 250.4) {
		aqi.en = 'Very Unhealthy';
		aqi.mn = 'Маш муу';
	} else if (pm25 <= 500.4) {
		aqi.en = 'Hazradous';
		aqi.mn = 'Аюултай';
	} else {
		aqi.en = 'Beyond Index';
		aqi.mn = 'Онц аюултай';
	}

	return aqi;
}

exports.getMostRecent = getMostRecent;
exports.sendTweet = sendTweet;