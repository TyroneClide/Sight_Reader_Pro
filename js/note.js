// Arrays defining notes with octaves and simple note names
const noteOctave = [
  "G5",
  "Gb5",
  "F5",
  "E5",
  "Eb5",
  "D5",
  "Db5",
  "C5",
  "B4",
  "Bb4",
  "A4",
  "Ab4",
  "G4",
  "Gb4",
  "F4",
  "E4",
  "Eb4",
  "D4",
  "Db4",
  "C4",
];

const noteStrings = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

// Object mapping notes to their positions on the staff
const positions = {
  G5: -45,
  Gb5: -45,
  F5: -15,
  E5: 15,
  Eb5: 15,
  D5: 45,
  Db5: 45,
  C5: 75,
  B4: 105,
  Bb4: 105,
  A4: 135,
  Ab4: 135,
  G4: 165,
  Gb4: 165,
  F4: 195,
  E4: 225,
  Eb4: 225,
  D4: 255,
  Db4: 255,
  C4: 285,
};

let note = "C4";
let listening = true;

// Canvas setup
const sCanvas = document.getElementById("staff");
const sctx = sCanvas.getContext("2d");
const SWIDTH = sCanvas.width;
const SHEIGHT = sCanvas.height;

// Initial drawing of the staff and generating a note
sctx.clearRect(0, 0, SWIDTH, SHEIGHT);
drawStaff();
generateNote();

// Logging the initial note
console.log(note);

/**
 * Removes the octave number from a note string.
 * @param {string} note - The note string (e.g., "C4").
 * @returns {string} - The note without the octave (e.g., "C").
 */
function removeOctave(note) {
  return note.slice(0, -1);
}

/**
 * Checks if a note is a flat note.
 * @param {string} note - The note string.
 * @returns {boolean} - True if the note is flat, otherwise false.
 */
function isFlat(note) {
  return note.includes("b");
}

/**
 * Checks if a note needs whiskers (ledger lines).
 * @param {string} note - The note string.
 * @returns {boolean} - True if the note needs whiskers, otherwise false.
 */
function needsWhiskers(note) {
  const whiskerNotes = ["C4"];
  return whiskerNotes.includes(note);
}

/**
 * Generates a random note and draws the staff.
 */
function generateNote() {
  const index = Math.floor(Math.random() * noteOctave.length);
  note = noteOctave[index];
  drawStaff();
}

/**
 * Checks if the guessed pitch matches the generated note.
 * @param {string} pitch - The guessed pitch.
 */
function checkGuess(pitch) {
  console.log(note);
  listening = false;

  const correctGuess = pitch === removeOctave(note);
  document.body.style.transition = "background-color .5s";
  document.body.style.backgroundColor = correctGuess ? "#66FF99" : "#FF4F4B";

  setTimeout(() => {
    document.body.style.transition = "background-color 1.5s";
    document.body.style.backgroundColor = "grey";
    listening = true;
    if (correctGuess) generateNote();
  }, 800);
}

/**
 * Draws the staff and the note on the canvas.
 */
function drawStaff() {
  sctx.clearRect(0, 0, SWIDTH, SHEIGHT);

  const staff = new Image();
  staff.src = "images/staff.png";
  staff.onload = () => {
    sctx.drawImage(staff, 0, SHEIGHT / 2 - 180, SWIDTH + 20, 360);
    drawNote();
  };
}

/**
 * Draws the note on the staff.
 */
function drawNote() {
  const wholeNote = new Image();
  wholeNote.src = "images/whole-note.png";
  wholeNote.onload = () => {
    sctx.drawImage(
      wholeNote,
      380,
      SHEIGHT / 2 - 180 + positions[note],
      110,
      110
    );
  };

  if (isFlat(note)) {
    const flat = new Image();
    flat.src = "images/flat.png";
    flat.onload = () => {
      sctx.drawImage(flat, 340, SHEIGHT / 2 + positions[note] - 206);
    };
  }

  if (needsWhiskers(note)) {
    sctx.lineWidth = 3.5;
    sctx.beginPath();
    sctx.moveTo(360, SHEIGHT / 2 + positions[note] - 125);
    sctx.lineTo(510, SHEIGHT / 2 + positions[note] - 125);
    sctx.stroke();
  }
}
