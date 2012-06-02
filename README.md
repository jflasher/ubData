# ubData

A simple node.js server to provide current air pollution results from Ulaanbaatar monitoring stations. 

The server can be deployed to Cloud Foundry using the app.js file or run locally (or another server) using index.js.

## Purpose
The purpose of this simple API is to allow for the easier use of the air pollution data that exists for Ulaanbaatar, Mongolia. I was interested in working on a simple project and needed access to this data but it was not available in an easy to get at form. Therefore, I decided to go ahead and create something that would allow others access to the available data in an easy to use manner.

As described below, the code parses an already existing webpage and pulls out the relevant info. This is super susceptible to breaking since it is dependent on the format of the webpage. I will try to keep up with any changes, but if anything seems to be amiss, please feel free to contact me.

## Usage
Right now there is only one API call

> http://ubdata.cloudfoundry.com/data

This call will return a valid JSON object with a root of "results".

On success, the results object will contain the following items:
- startDate: The start date of the measurement period
- endDate: The end date of the measurement
- properties: An array of strings defining what properties are being measured
- units: An array of strings defining the measurement units in the same order as the properties array
- stations: An array of Station objects

On failure, the results object will contain the following items:
- error: A string containing the reason for failure

Each Station object will contain the following items:
- name: The name of the station
- values: An array of float values corresponding to the properties and units in the relevant arrays (null if not present in data set)

*Note: Because the API is calling out to another webpage and then parsing the data, it can take some time to return the JSON data.*

## Data Source
The data is currently coming from http://ub-air.info/ub-air/laq/average-30min.html.

## Code Description
It is a simple node.js server that will connect to the data source and parse the HTML response for the relevant info and return a JSON object. Because the parsing function is tied very intricately to the layout of the webpage, any significant changes to the webpage could very well break the API. Not ideal but it is better than nothing!