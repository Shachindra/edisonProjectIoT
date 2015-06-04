var portName = "/dev/ttyMFD1";
var mraa = require('mraa');
SerialPort = require("serialport").SerialPort;
console.log('MRAA Version: ' + mraa.getVersion());

var serialPort = new SerialPort(portName, {
	baudrate: 9600,				// default for serial communication
	dataBits: 8, 
	parity: 'none', 
	stopBits: 1, 
	flowControl: false 
});

serialPort.on('open', showPortOpen);
serialPort.on('data', saveLatestData);
serialPort.on('close', showPortClose);

function showPortOpen() {
   console.log('Serial Communication Port is Open. Data rate: ' +serialPort.options.baudRate);
}

function showPortClose() {
   console.log('Serial Communication Port is Closed.');
}

function saveLatestData(data) {
    var readData = data.toString();
    console.log(readData);
}