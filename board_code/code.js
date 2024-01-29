var tool = "", tool_direction = "";
var pressure_prev = 0;
var dPressure = new Float64Array(5);
var g = new Float64Array(5);

const ssid = "Bi4x-bmFzc2lt", password = "00000000";
const wifi = require('Wifi');
const http = require('http');

const startServer = () => {
 http.createServer((req, res) => {
    console.log("received a request and responding to it!");

    //const urlParts = url.parse(req.url, true);
    const path = req.url;

   switch (path) {
      case "/status":
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          serverStatus: true
        }));
        break;
      case "/state":
       currentState();
        res.writeHead(200,{ "Content-Type": "application/json" });
        res.end(JSON.stringify({
          tool: tool,
          direction: tool_direction,
          floors: 100
        }));
        break;
   }
  }).listen(8080);
  console.log("server created and listening on port 8080");
};

const connectToWifi = () => {
  wifi.connect(ssid, {password: password}, (err) => {
    if(err) {
      console.log("Error: ", err);
      return;
    }
    console.log('Connected to Wifi.  IP address is:', wifi.getIP().ip);
    startServer();
  });
};

function readPressure() {
  "ram";
  return bmeSensor.getData().pressure;
}
function readG() {
  "ram";
  var gravity = mpuSensor.getGravity();
  var combined = 0; for(var i in gravity) combined += gravity[i] * gravity[i];
  return Math.sqrt(combined);
}

/*function recordToFile(period, filename) {
  const headers = 'Time,G,P\n';
  var storage = require("Storage");
  var file = storage.open(filename, 'a');
  file.write(headers);
  return setInterval(() => {
    var record = getTime() + ","
      + readG() + ','
      + readPressure();
    file.write(record + '\n');
    console.log('Wrote record: ' + record);
  }, period);
}*/

function getMean(arr) {
  "ram";
  var sum = 0; for(var i in arr) sum += arr[i];
  return sum / arr.length;
}

function getVariance(arr) {
  "ram";
  var v = 0, mean = getMean(arr);
  for (var i in arr) {
    var x = mean - arr[i];
    v += x * x;
  }
  return v;
}

function shift(arr, new_value) {
  "ram";
  let shift_out = arr[0]; arr.set(arr.subarray(1));
  arr.fill(new_value, -1, arr.length);
  return shift_out;
}

function sense(interval) {
  const headers = 'Time,G,P\n';
  var storage = require("Storage");
  var file = storage.open('Measurements', 'a');
  file.write(headers);
  return setInterval(() => {
    // Update Pressure Records
    let pressure_new = readPressure();
    shift(dPressure, pressure_new - pressure_prev);
    pressure_prev = pressure_new;
    // Update G Records
    let newG = readG(); // Simulate new record
    shift(g, newG);  // Add new value to the end
    // Write to file for tracing
    var record = `${getTime()},${newG},${pressure_new}`;
    file.write(record + '\n');
    console.log(record);
  }, interval);
}

function currentState() {
  // Pressure Change
  var dP_mean = getMean(dPressure); tool_direction = dP_mean > 0 ? "down" : "up";
  var dP_mean_allSq = dP_mean * dP_mean;
  // Variance in G
  var g_variance = getVariance(g);
  // Final Result
  if(dP_mean_allSq < 0.005) {
    if(g_variance < 0.001)
      tool = "Stationary";
    else
      tool = "Stairs";
  }
  else
    tool = "Lift";
}

/* Pin Config
 * ESP32  |  Accelerometer (MPU6050)
 * 3.3V   |  Vcc
 * GND    |  GND
 * D32    |  SCL
 * D33    |  SDA
 *
 * ESP32  |  Barometer (BME280)
 * D22    |  Vcc
 * D19    |  CSB
 * D23    |  GND
 * D18    |  SDO
 * D13    |  SCL
 * D15    |  SDA
 */

/* Configure I2C for the accelerometer */
I2C1.setup({ scl: D32, sda: D33 });

/* Configure pins and I2C for the Barometer */
pinMode(D23, "output", false); // LOW for BME280 [GND]
pinMode(D22, "output", false); // HIGH for BME280 [Vcc]
pinMode(D19, "output", false); // HIGH for BME280 [CSB] to get I2C
pinMode(D18, "output", false); // LOW for BME280 [SDO]
// CSB must be HIGH at startup of BME
// To simulate that Vcc & CSB are HIGH at the same time;
digitalWrite([D23,D22,D19,D18], 0b0000);
digitalWrite([D23,D22,D19,D18], 0b0110);
I2C2.setup({ scl: D13, sda: D15 });

var mpuSensor = require("MPU6050.js").connect(I2C1);
var bmeSensor = require("BME280.js").connect(I2C2);

/* Start running... */
connectToWifi();

var s = sense(1000); console.log('Created sensing interval. Index is', s);
//var r = setInterval(currentState, 2000);
//var t = setTimeout(() => { clearInterval(s); }, 900000);