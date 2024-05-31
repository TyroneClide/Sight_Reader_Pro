// Create an AudioContext and an AnalyserNode
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();

// Configure the AnalyserNode
analyser.minDecibels = -100;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;

let source;

// Check if getUserMedia is available and alert the user if not
if (!navigator?.mediaDevices?.getUserMedia) {
  alert("Sorry, getUserMedia is required for the app.");
} else {
  const constraints = { audio: true };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      draw();
      displayNote();
    })
    .catch((err) => {
      alert(err);
    });
}

// Get the canvas and its context
const canvas = document.getElementById("mic");
const canvasContext = canvas.getContext("2d");

let previousValueToDisplay = 0;
let smoothingCount = 0;
let smoothingThreshold = 5;
let smoothingCountThreshold = 5;

/**
 * Resizes the canvas to fit its container while maintaining resolution.
 */
function resizeCanvas() {
  const container = document.getElementById("mic-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/**
 * Draws the audio waveform on the canvas.
 */
function draw() {
  requestAnimationFrame(draw);

  analyser.fftSize = 2048;
  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  canvasContext.lineWidth = 2;
  canvasContext.strokeStyle = "rgb(0, 0, 0)";
  canvasContext.beginPath();

  const sliceWidth = canvas.width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;

    if (i === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }

    x += sliceWidth;
  }

  canvasContext.lineTo(canvas.width, canvas.height / 2);
  canvasContext.stroke();
}

/**
 * Displays the detected note on the screen.
 */
function displayNote() {
  requestAnimationFrame(displayNote);

  const bufferLength = analyser.fftSize;
  const buffer = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(buffer);

  const autoCorrelateValue = autoCorrelate(buffer, audioContext.sampleRate);

  let valueToDisplay = autoCorrelateValue;
  const roundingValue = "tuner-note";
  if (roundingValue === "hz") {
    valueToDisplay = Math.round(valueToDisplay);
  } else if (roundingValue !== "none") {
    valueToDisplay = noteStrings[noteFromPitch(autoCorrelateValue) % 12];
  }

  const smoothingValue = "basic";

  if (autoCorrelateValue === -1) {
    document.getElementById("tuner-note").innerText = "Too quiet...";
    return;
  }

  configureSmoothing(smoothingValue);

  if (isNoteSimilarEnough(valueToDisplay)) {
    if (smoothingCount < smoothingCountThreshold) {
      smoothingCount++;
      return;
    } else {
      previousValueToDisplay = valueToDisplay;
      smoothingCount = 0;
    }
  } else {
    previousValueToDisplay = valueToDisplay;
    smoothingCount = 0;
    return;
  }

  if (typeof valueToDisplay === "number") {
    valueToDisplay += " Hz";
  }

  if (listening) checkGuess(valueToDisplay);

  document.getElementById("tuner-note").innerText = valueToDisplay;
}

/**
 * Configures the smoothing values based on the selected option.
 * @param {string} smoothingValue - The selected smoothing option.
 */
function configureSmoothing(smoothingValue) {
  switch (smoothingValue) {
    case "none":
      smoothingThreshold = 99999;
      smoothingCountThreshold = 0;
      break;
    case "basic":
      smoothingThreshold = 10;
      smoothingCountThreshold = 5;
      break;
    case "very":
      smoothingThreshold = 5;
      smoothingCountThreshold = 10;
      break;
  }
}

/**
 * Checks if the current note is similar enough to the previous one.
 * @param {any} valueToDisplay - The current value to display.
 * @returns {boolean} - True if the note is similar enough, otherwise false.
 */
function isNoteSimilarEnough(valueToDisplay) {
  if (typeof valueToDisplay === "number") {
    return (
      Math.abs(valueToDisplay - previousValueToDisplay) < smoothingThreshold
    );
  } else {
    return valueToDisplay === previousValueToDisplay;
  }
}

/**
 * Autocorrelates the buffer to find the frequency.
 * @param {Float32Array} buffer - The audio buffer.
 * @param {number} sampleRate - The sample rate.
 * @returns {number} - The detected frequency.
 */
function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    sumOfSquares += buffer[i] * buffer[i];
  }

  const rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
  if (rootMeanSquare < 0.01) return -1;

  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  buffer = buffer.slice(r1, r2);
  const newSize = buffer.length;

  const c = new Array(newSize).fill(0);
  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] += buffer[j] * buffer[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;

  let maxValue = -1;
  let maxIndex = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxValue) {
      maxValue = c[i];
      maxIndex = i;
    }
  }

  let T0 = maxIndex;

  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];

  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 -= b / (2 * a);

  return sampleRate / T0;
}

/**
 * Converts a frequency to a note number.
 * @param {number} frequency - The frequency to convert.
 * @returns {number} - The note number.
 */
function noteFromPitch(frequency) {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69;
}
