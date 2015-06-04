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

loop();

function loop() {
	/* Started Reading Sensor Data	*/
	tempPinValue = temperatureSensor.read();
	tempValue = getTemperature(tempPinValue);
	lightPinValue  = lightSensor.read();
	lightValue = Math.round( lightPinValue/1023*100);
	soundPinValue = soundSensor.read();
	soundValue = Math.round( soundPinValue/1023*100);
	airQualityPinValue = airQualitySensor.read();
	airQualityValue = Math.round( airQualityPinValue/1023*100);
	
	var touchVal = String(touchSensor.read());
	/* Finished Reading Sensor Data	*/
	
	lcdMessage_temp = "Temp. is @ "+tempValue;
	lcdMessage_light = "Light is @ "+lightValue+" %";
	var lcdMessage_sound = "Sound is @"+soundValue+" %";
	var lcdMessage_airQuality = "AirQlty @ "+airQualityValue+" %";

	myLCD.setCursor(0,0);
	myLCD.write(lcdMessage_temp);
	myLCD.setCursor(1,0);
	myLCD.write(lcdMessage_light);
	
	/*	Process Touch Sensor Data	*/
	if(touchVal == '1') {
		LED.write(1);
		buzzer.write(1);
		while(String(touchSensor.read()) == '1') {
			myLCD.setCursor(0,0);
			myLCD.write("Touch Detected:)");
			myLCD.setCursor(1,0);
			myLCD.write(getTime());
		}
	}
	if(touchVal == '0') {
		buzzer.write(0);
	}
	
	/*	Process Light Sensor Data	*/
	if(lightValue > 10) {
		LED.write(0);
	}
	if(lightValue < 10) {
		LED.write(1);
	}
	
	/*	Process Sound Sensor Data	*/
	if(soundPinValue > 200) {
		if(soundPinValue > 450) {
			console.log('Clapping! Sound Level @ '+soundPinValue+" at "+getTime());
		}
		else if(soundPinValue > 350) {
			console.log('Talking/Singing! Sound Level @ '+soundPinValue+" at "+getTime());
		}
		//else
			//console.log('Fan! Normal Sound Level @ '+soundPinValue+" at "+getTime());
	}
	else if(soundPinValue < 200) {
		//Normal Value @HomeAlone
		//console.log('Sound Level @ '+soundPinValue);
	}
	
	/*	Process Air Quality Sensor Data	*/
	if(airQualityPinValue > 150) {
		if(airQualityPinValue > 500) {
			console.log('Critical Condition!!  Air Quality Level @ '+airQualityPinValue+" at "+getTime());
		}
		else if(airQualityPinValue > 350) {
			console.log('Warning! High CO2 Content!  Air Quality Level @ '+airQualityPinValue+" at "+getTime());
		}
		else
			console.log('Moderate CO2 Content! Air Quality Level @ '+airQualityPinValue+" at "+getTime());
	}
	else if(airQualityPinValue < 150) {
		//Normal Value @Home
		//console.log('Air Quality Level @ '+airQualityPinValue);
	}
	
	//console.log('Sound Level @ '+soundPinValue+'	Air Quality Level @ '+airQualityPinValue+" at "+getTime());
	
	setTimeout(loop,100);
}

function getTemperature(value) {
	var stg1 = ((1023.0/value) - 1);
	var stg2 = ((mathjs.log(stg1, 10))/3975.0);
	var stg3 = (stg2 + (1/298.15));
	var stg4 = ((1/stg3) - 275.15);
	//console.log(value+" Temperature ----> "+stg4.toString().substring(0,5));
	return stg4.toString().substring(0,5)+" C";
}

function getTime() {
	return "Now "+moment().tz('Asia/Kolkata').format().slice(11, 19)+" "+moment().tz('Asia/Kolkata').format('A');
}
