var https = require("https");
var OAuth= require('oauth').OAuth;
var mongodb = require('mongodb');
var querystring = require('querystring');

// Mongo details
var mongoUri = process.env.MONGOHQ_URL || 'mongodb://localhost/ubdata';
var collection;
mongodb.Db.connect(mongoUri, function (err, db) {
  db.collection('measurements', function(er, aCollection) {
    collection = aCollection;
  });
});

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

			// Update data every time we're getting new data
			saveToDatabase(measurement);

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

var getMostRecentMeasurements = function (callback) {
	if (collection === undefined) {
		return undefined;
	}

	collection.find({}).toArray(callback);
};

var getDailyMeasurements = function (callback) {
	if (collection === undefined) {
		return undefined;
	}

	// Get all the records
	collection.find({}).toArray(function (err, records) {
		// Take the average for a given day
		var dailyRecords = [];
		var lastDay;
		var dayTotal = 0;
		var count = 0;
		var dayAverage = 0;
		for (var i = 0; i < records.length; i++) {
			var record = records[i];
			var midpoint = (record.endTime - record.startTime) * 0.5 + record.startTime;
			midpoint += (60000 * new Date().getTimezoneOffset()); // convert it to mn time
			midpoint = new Date(midpoint);
			var day = new Date(midpoint.getFullYear(), midpoint.getMonth(), midpoint.getDate());
			if (i === 0 || day.toString() === lastDay.toString()) {
				// Add to previous total
				dayTotal += record.pm25;
				count++;
				lastDay = day;
			} else {
				// New day, get average and push the value
				dayAverage = dayTotal / count;
				console.log(dayTotal, count);
				dailyRecords.push({ date: Date.parse(lastDay), pm25: dayAverage });
				count = 1;
				dayTotal = record.pm25;
				lastDay = day;
			}
		}
		// And add the last one
		dayAverage = dayTotal / count;
		dailyRecords.push({ date: Date.parse(lastDay), pm25: dayAverage });

		callback(err, dailyRecords);
	});
};

// Send out a tweet with the pollution info
var sendTweet = function (req, res) {
	getData(function (data) {
		// Make sure we have data 
		if (data === undefined) {
			console.log("ERROR no data.");
			return res.json(404, {"results": {"error": "no data"}});
		}

		// Make sure the pm value is good
		if (isNaN(data.pm25)) {
			console.log("ERROR pm is NaN");
			return res.json(404, {"results": {"error": "bad pm value"}});
		}

		// Make sure the data is from within the last 3 hours
		var dLocal = new Date();
		var utcLocal = dLocal.getTime() + (dLocal.getTimezoneOffset() * 60000);
		var mnLocal = new Date(utcLocal + (3600000*8));
		var diff = mnLocal - data.endTime;
		if (diff > 3 * 60 * 60 * 1000) {
			console.log("ERROR data older than 3 hours.");
			return res.json(404, {"results": {"error": "data older than 3hr"}});
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
		var dateString = date.getFullYear() + '-' + addZero((date.getMonth() + 1)) + '-' + addZero(date.getDate()) + '; ' + addZero(startTime.getHours()) + ':' + addZero(startTime.getMinutes()) + '-' + addZero(endTime.getHours()) + ':' + addZero(endTime.getMinutes());
		mnString += dateString + '; ';
		enString += dateString + '; ';

		// Get pm value
		enString += 'PM2.5=' + data.pm25.toFixed(0) + '\u00B5g/m\u00B3 [3hr avg]; ';
		mnString += 'PM2.5=' + data.pm25.toFixed(0) + '\u00B5g/m\u00B3 [3цагийн дундаж]; ';

		// Get AQI
		enString += getAQIStrings(data.pm25).en + ' [for 24hr exposure at this level]';
		mnString += getAQIStrings(data.pm25).mn;

		console.log(enString);
		console.log(mnString);
		// console.log(enString.length);
		// console.log(mnString.length);

		// Tweet the English then tweet the Mongolian 30 seconds later to ensure it shows up in feeds
		tweet(enString);
		setTimeout( function () {
			tweet(mnString);
		}, 30000);

		// Send to Facebook in English then in Mongolian after a delay
		facebook(enString);
		setTimeout( function () {
			facebook(mnString);
		}, 30000);

		// End the request
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

  var body = ({'status': text, 'lat': 47.920709, 'long': 106.905848});
	tweeter.post("https://api.twitter.com/1.1/statuses/update.json",
	process.env.TWITTER_TOKEN, process.env.TWITTER_SECRET, body, "application/json",
	function (error, data, response) {
		if (error) {
			console.log('{"results": {"error": ' + JSON.stringify(error) + '}}');
		}
	});
};

var facebook = function(text) {
	var postData = {
		'access_token': process.env.FACEBOOK_ACCESS_TOKEN,
		'message': text
	};
	postData = querystring.stringify(postData);

  var options = {
    host: 'graph.facebook.com',
    port: 443,
    path: '/' + process.env.FACEBOOK_PAGE + '/feed',
    method: 'POST',
    headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Conent-Length': postData.length
    }
  };

  var req = https.request(options, function (res) {
    var data = '';
    res.on('data', function (d) {
      data += d;
    });

    res.on('end', function () {
      data = JSON.parse(data);
      console.log(data);
    });
  });

	req.write(postData);
  req.end();
};

Array.prototype.sum = function() {
	for (var i = 0, L = this.length, sum = 0; i < L; sum += this[i++]);
	return sum;
};

var saveToDatabase = function (data) {
	// Make sure we have a valid collection
	if (!collection) {
		return;
	}

	// Update the record, making sure a measurement is unique on startTime. 
	collection.update( { startTime: data.startTime }, data, { upsert: true } );
};

var getAQIStrings = function (pm25) {
	var aqi = {};

	if (pm25 <= 15.4) {
		aqi.en = 'Good';
		aqi.mn = 'Агаарын чанар сайн';
	} else if (pm25 <= 40.4) {
		aqi.en = 'Moderate';
		aqi.mn = 'Хэвийн';
	} else if (pm25 <= 65.4) {
		aqi.en = 'Unhealthy for sensitive groups';
		aqi.mn = 'Эмзэг бүлгийн эрүүл мэндэд муу';
	} else if (pm25 <= 150.4) {
		aqi.en = 'Unhealthy';
		aqi.mn = 'Эрүүл мэндэд муу нөлөөтэй';
	} else if (pm25 <= 250.4) {
		aqi.en = 'Very Unhealthy';
		aqi.mn = 'Эрүүл мэндэд маш муу';
	} else if (pm25 <= 500.4) {
		aqi.en = 'Hazardous';
		aqi.mn = 'Аюултай';
	} else {
		aqi.en = 'Beyond Index';
		aqi.mn = 'Онц аюултай';
	}

	return aqi;
};

var addZero = function (num) {
	if (num < 10) {
		return '0' + num;
	} else {
		return num;
	}
};

exports.getMostRecentMeasurements = getMostRecentMeasurements;
exports.getMostRecent = getMostRecent;
exports.sendTweet = sendTweet;
exports.getDailyMeasurements = getDailyMeasurements;