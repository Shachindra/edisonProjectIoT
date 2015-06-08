/*
 * Fill in your Plotly user credentials: Your username, api_key, and stream_tokens in config file
 * Find your API key and generate stream tokens in your settings: https://plot.ly/settings
 
*/
var config = require('./config.json'),
    username = config.user,
    apikey = config.apikey,
    tokens = config.tokens,
    Plotly = require('plotly')(username, apikey);

var mraa = require ('mraa');
var LCD  = require ('jsupm_i2clcd');
var mathjs = require ('mathjs');
var moment = require('moment-timezone');

var temperatureSensor = new mraa.Aio(0);
var lightSensor = new mraa.Aio(1);
var soundSensor = new mraa.Aio(2);
var airQualitySensor = new mraa.Aio(3);

var touchSensor = new mraa.Gpio(2);
var buzzer = new mraa.Gpio(3);
var LED = new mraa.Gpio(4);
var switchButton = new mraa.Gpio(5);
var POT = new mraa.Gpio(5);

touchSensor.dir(mraa.DIR_IN);
buzzer.dir(mraa.DIR_OUT);
LED.dir(mraa.DIR_OUT);
switchButton.dir(mraa.DIR_OUT);
POT.dir(mraa.DIR_IN);

var tempPinValue, lightPinValue, soundPinValue, airQualityPinValue;
var tempValue, lightValue, soundValue, airQualityValue;
var lcdMessage_temp = "Temperature Sense";
var lcdMessage_light = "Light Sense";
var lcdMessage_sound = "Sound Level Sense";
var lcdMessage_airQuality = "Air Quality Sense";

var myLCD = new LCD.Jhd1313m1(0, 0x3E, 0x62);

console.log('MRAA Version: '+mraa.getVersion());
/*
 * Describe and embed stream tokens into a plotly graph
*/

var initdata = [
	{name: "Temperature", x:[], y:[], stream:{token: tokens[0], maxpoints:500}},
	{name: "Light", x:[], y:[], stream:{token: tokens[1], maxpoints:500}},
	{name: "Sound", x:[], y:[], stream:{token: tokens[2], maxpoints:500}},
	{name: "Air Quality", x:[], y:[], stream:{token: tokens[3], maxpoints:500}}
];
var initlayout = {fileopt : "extend", filename : "AnalogSensorData"};

/*
 * Initialize the communication layer between the 
*/

Plotly.plot(initdata, initlayout, function (err, msg) {
	
    if (err) return console.log(err);
    console.log(msg);

    var stream1 = Plotly.stream(tokens[0], function (err, res) {
        if (err) return console.log(err);
        console.log(res);
        clearInterval(loop); // once stream is closed, stop writing
    });
	
	var stream2 = Plotly.stream(tokens[1], function (err, res) {
        if (err) return console.log(err);
        console.log(res);
        clearInterval(loop); // once stream is closed, stop writing
    });
	
	var stream3 = Plotly.stream(tokens[2], function (err, res) {
        if (err) return console.log(err);
        console.log(res);
        clearInterval(loop); // once stream is closed, stop writing
    });
	
	var stream4 = Plotly.stream(tokens[3], function (err, res) {
        if (err) return console.log(err);
        console.log(res);
        clearInterval(loop); // once stream is closed, stop writing
    });

    var loop = setInterval(function () {
		tempPinValue = temperatureSensor.read();
		tempValue = parseInt(getTemperature(tempPinValue));
		lightPinValue  = lightSensor.read();
		lightValue = Math.round( lightPinValue/1023*100);
		soundPinValue = soundSensor.read();
		soundValue = soundPinValue;
		airQualityPinValue = airQualitySensor.read();
		airQualityValue = airQualityPinValue;
		
		var touchVal = String(touchSensor.read());
		/* Finished Reading Sensor Data	*/
		
		lcdMessage_temp = "Temp. is @ "+tempValue+" C";
		lcdMessage_light = "Light is @ "+lightValue+" %";
		var lcdMessage_sound = "Sound is @"+soundValue+" %";
		var lcdMessage_airQuality = "AirQlty @ "+airQualityValue+" %";

		myLCD.setCursor(0,0);
		myLCD.write(lcdMessage_temp);
		myLCD.setCursor(1,0);
		myLCD.write(lcdMessage_light);
	
		if(touchVal == '1') {
			LED.write(1);
			buzzer.write(1);
		}
		if(touchVal == '0') {
			buzzer.write(0);
		}
		
		if(lightValue > 10) {
			LED.write(0);
		}
		if(lightValue <= 10) {
			LED.write(1);
		}
		
		/*	Process Sound Sensor Data	*/
		if(soundPinValue > 200) {
			if(soundPinValue > 450) {
				console.log('Clapping! Sound Level @ '+soundPinValue+" at "+getDateTime());
			}
			else if(soundPinValue > 350) {
				console.log('Talking/Singing! Sound Level @ '+soundPinValue+" at "+getDateTime());
			}
			//else
				//console.log('Fan! Normal Sound Level @ '+soundPinValue+" at "+getDateTime());
		}
		else if(soundPinValue < 200) {
			//Normal Value @HomeAlone
			//console.log('Sound Level @ '+soundPinValue);
		}
		
		/*	Process Air Quality Sensor Data	*/
		if(airQualityPinValue > 150) {
			if(airQualityPinValue > 500) {
				console.log('Critical Condition!!  Air Quality Level @ '+airQualityPinValue+" at "+getDateTime());
			}
			else if(airQualityPinValue > 350) {
				console.log('Warning! High CO2 Content!  Air Quality Level @ '+airQualityPinValue+" at "+getDateTime());
			}
			else
				console.log('Moderate CO2 Content! Air Quality Level @ '+airQualityPinValue+" at "+getDateTime());
		}
		else if(airQualityPinValue < 150) {
			//Normal Value @Home
			//console.log('Air Quality Level @ '+airQualityPinValue);
		}
		
		var tempData = { x : getDateTime(), y : tempValue };
        var streamObjectTemp = JSON.stringify(tempData);
        stream1.write(streamObjectTemp+'\n');
		
		var lightData = { x : getDateTime(), y : lightValue };
        var streamObjectLight = JSON.stringify(lightData);
        stream2.write(streamObjectLight+'\n');
		
		var soundData = { x : getDateTime(), y : soundValue };
        var streamObjectSound = JSON.stringify(soundData);
        stream3.write(streamObjectSound+'\n');
		
		var airQualityData = { x : getDateTime(), y : airQualityValue };
        var streamObjectAirQlty = JSON.stringify(airQualityData);
        stream4.write(streamObjectAirQlty+'\n');
		
		//console.log(new Date().toISOString());
		
    }, 500);
});

//  function to get Temperature Sensor Value
function getTemperature(value){
	var stg1 = ((1023.0/value) - 1);
	var stg2 = ((mathjs.log(stg1, 10))/3975.0);
	var stg3 = (stg2 + (1/298.15));
	var stg4 = ((1/stg3) - 275.15);
	//console.log(value+" Temperature ----> "+stg4.toString().substring(0,5));
	return stg4.toString().substring(0,2);
}

// function to get a nicely formatted date string
function getDateTime () {
	return moment().tz('Asia/Kolkata').format().slice(0, 19).replace(/T/, ' ');
}