/***************
*     GRID     *
****************/

var gridButton = document.getElementById("grid-button");
gridButton.addEventListener("mousedown", toggleGrid);
gridButton.addEventListener("touchstart", toggleGrid/* , { once: true } */);

document.addEventListener("visibilitychange", handleVisibilityChange, false);

var shouldBubble = true;
function handleVisibilityChange() {
    if (document.hidden) {
        toggleShouldMimic(false);
        toggleShouldPlay(false);
        shouldBubble = false;
    } else {
        shouldBubble = true;
    }
}

function toggleGrid(event) {
    event.preventDefault();
    squares = document.getElementsByClassName("square-no-border");
    sweet = document.getElementById("sweet");

    if (sweet.style.opacity == "" || sweet.style.opacity > 0) {
        sweet.style.opacity = 0;
    } else {
        sweet.style.opacity = 1;
    }

    Array.prototype.forEach.call(squares, function (square) {
        square.classList.toggle("square-border");
    });
}

/***************
*     SOUND    *
****************/
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const buffers = []; // An array of pre-loaded audio buffers
const filepaths = ["sounds/sound0.mp3", "sounds/sound1.mp3", "sounds/sound2.mp3", "sounds/sound3.mp3", "sounds/sound4.mp3", "sounds/sound5.mp3", "sounds/sound6.mp3", "sounds/sound7.mp3", "sounds/sound8.mp3"];

// Create an array of promises that will load and decode each audio file
const promises = filepaths.map((filepath, index) => {
    return new Promise(function (resolve, reject) {
        const request = new XMLHttpRequest();
        request.open('GET', filepath, true);
        request.responseType = 'arraybuffer';

        request.onload = function () {
            audioContext.decodeAudioData(request.response, function (buffer) {
                buffers[index] = buffer;
                resolve();
            });
        };

        request.onerror = function () {
            reject(new Error('Error loading audio file: ' + filepath));
        };

        request.send();
    });
});

Promise.all(promises).then(function () {
    console.log("All sounds have been loaded")
}).catch(function (error) {
    console.error(error);
});

function playSoundByIndex(index) {
    const source = audioContext.createBufferSource();
    source.buffer = buffers[index];
    source.connect(audioContext.destination);
    source.start(0);
}

squares = document.getElementsByClassName("square");
Array.prototype.forEach.call(squares, function (square, index) {
    square.soundIndex = index;
    square.addEventListener("mousedown", playSound);
    square.addEventListener("touchstart", playSound/*, { once: true } */);
});

let startTime = 0;
let endTime = 0;
let timeElapsed = 0;

let playerPressedButtonIndex = -1;
function playSound(event) {
    event.preventDefault();

    if (shouldMimic) {
        playerPressedButtonIndex = event.currentTarget.soundIndex;
    } else { playerPressedButtonIndex = -1; }

    startTime = performance.now();
    playSoundByIndex(event.currentTarget.soundIndex);
    endTime = performance.now();
    timeElapsed = endTime - startTime;

    // update the output element with the time elapsed
    var outputElement = document.getElementById('output');
    outputElement.textContent = `Sound delay: ${timeElapsed.toFixed(3)} ms`;
}

/***************
* PLAY-A-LONG  *
****************/

var playButton = document.getElementById("play-song");
playButton.addEventListener("mousedown", playALong);
playButton.addEventListener("touchstart", playALong/* , { once: true } */);

let functions = [];
let shouldPlay = false;

function createNoteForPlay(song, index, delay) {
    return function () {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                if (shouldPlay) {
                    if (song >= 0 & song < 9) {
                        const playArea = document.getElementById("play").getBoundingClientRect();
                        playSoundByIndex(song);
                        createParticles(
                            playArea.x + (playArea.width / 6) + (playArea.width / 3) * (song % 3), //Particle X
                            playArea.y + (playArea.height / 6 + (playArea.height / 3) * Math.floor((song / 3))) //Particle Y
                        );
                    }
                    if (index === functions.length - 1) { toggleShouldPlay(); }
                    resolve();
                } else {
                    reject("Sequence cancelled");
                }
            }, parseInt(delay));
        });
    }
}

function toggleShouldPlay(forceState) {
    shouldPlay = !shouldPlay;
    if (forceState != undefined) { shouldPlay = forceState; }

    if (shouldPlay) {
        toggleShouldMimic(false);
        playButton.textContent = "Stop";
        // var icon = document.getElementsByClassName("fa-circle-play")[0];
        // icon.classList.toggle("fa-circle-stop");
        // icon.classList.toggle("fa-circle-play");
    }
    else {
        playButton.textContent = "Play";
        // var icon = document.getElementsByClassName("fa-circle-stop")[0];
        // icon.classList.toggle("fa-circle-stop");
        // icon.classList.toggle("fa-circle-play");
    }
}

function playALong(event) {
    event.preventDefault();
    toggleShouldPlay();
    functions = [];
    if (shouldPlay) {
        var dropdown = document.getElementById("songs-dropdown");
        var notes = getSongContents(dropdown.selectedOptions[0].value);
        var selectedSong = notes.split(",");
        var delay = selectedSong.pop();
        selectedSong.map((song, index) => {
            functions[index] = createNoteForPlay(song, index, delay);
        });

        functions.reduce(function (promiseChain, currentFunction) {
            return promiseChain.then(currentFunction);
        }, Promise.resolve())
            .catch(function (error) {
                console.log("Error:", error);
            });
    }
}


/***************
*    MIMIC     *
****************/

var mimicButton = document.getElementById("mimic-song");
mimicButton.addEventListener("mousedown", mimicSong);
mimicButton.addEventListener("touchstart", mimicSong/* , { once: true } */);

let shouldMimic = false;

function createNoteForMimic(song, index, delay) {
    return () => {
        return setTimeout(function () {
            if (shouldMimic) {
                if (song >= 0 & song < 9) {
                    const playArea = document.getElementById("play").getBoundingClientRect();
                    playSoundByIndex(song);
                    createParticles(
                        playArea.x + (playArea.width / 6) + (playArea.width / 3) * (song % 3), //Particle X
                        playArea.y + (playArea.height / 6 + (playArea.height / 3) * Math.floor((song / 3))) //Particle Y
                    );
                }
                if (index === functions.length - 1) { toggleShouldMimic(); }
            } else {
                console.log("Info: Mimic ended");
            }
        }, parseInt(delay));
    }
}

function toggleShouldMimic(forceState) {
    shouldMimic = !shouldMimic;
    if (forceState != undefined) { shouldMimic = forceState; }
    if (shouldMimic) {
        toggleShouldPlay(false);
        mimicButton.textContent = "Stop";
    }
    else {
        mimicButton.textContent = "Mimic";
    }
}

var playedNotes = 0;
var mimicedNotes = [];

function mimicSong(event) {
    event.preventDefault();
    toggleShouldMimic();
    playedNotes = 0;
    mimicedNotes = [];
    functions = [];
    if (shouldMimic) {
        var dropdown = document.getElementById("songs-dropdown");
        var notes = getSongContents(dropdown.selectedOptions[0].value);
        var selectedSong = notes.split(",");
        var delay = selectedSong.pop();
        selectedSong.map((song, index) => {
            functions[index] = createNoteForMimic(song, index, delay);
        });
    }
}

/***************
*     TIMER    *
****************/

// Define an array of month names
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Function to update the current date and time every second
function updateCurrentDate() {
    // Get the current date and time
    const now = new Date();

    // Build the date string in the format "24 Apr 2023 at 18:01:30"
    const dateString = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()} at ${formatTime(now)}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Update the content of the div with the date string
    document.getElementById('current-date').textContent = dateString;
}

// Function to format the time as "18:01" instead of "18:1"
function formatTime(date) {
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
}

updateCurrentDate()
// Update the current date and time every second
setInterval(updateCurrentDate, 1000);

/***************
*   EXPLOSION  *
****************/

//const container = document.documentElement;
const container = document.getElementById('play');
const maxParticleCount = 100;

function createParticles(clientX, clientY) {
    var childrenCount = container.children.length;
    if (childrenCount >= maxParticleCount) { return; }
    for (let i = 0; i < 20 + Math.random(); i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        container.appendChild(particle);

        const angle = Math.random() * 360;
        const distance = Math.random() * 40;
        const scale = Math.random() * 2;
        const duration = 500 + Math.random() * 500;
        const rotation = Math.random() * 360; // random rotation angle
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        const rect = container.getBoundingClientRect();

        particle.style.left = clientX - rect.left + x + 'px';
        particle.style.top = clientY - rect.top + y + 'px';
        particle.style.zIndex = '9999';

        const animation = particle.animate(
            [
                { transform: `translate(0, 0) scale(0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`, opacity: 0 }
            ],
            {
                duration: duration,
                easing: 'ease-out'
            }
        );

        animation.onfinish = () => particle.remove();
    }
}

play.addEventListener('mousedown', function (event) {
    const { clientX, clientY } = event;
    createParticles(clientX, clientY);
});

play.addEventListener('touchstart', function (event) {
    Array.prototype.forEach.call(event.touches, function (event) {
        const { clientX, clientY } = event;
        createParticles(clientX, clientY);
    } /*, { once: true } */);
});

/***************
*   SONG LIST  *
****************/

var dropdown = document.getElementById("songs-dropdown");

function getSongContents(songName) {
    const xhr = new XMLHttpRequest();
    const fileURL = `songs/${songName}.txt`;
    let fileContents = '';

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                fileContents = xhr.responseText;
            } else {
                console.log('Error reading file:', xhr.status);
            }
        }
    };

    xhr.open('GET', fileURL, false);
    xhr.send();

    return fileContents.replaceAll("\r\n", "").replaceAll("\n", "");
}

function populateDropDown() {
    // Make an AJAX request to retrieve the list of files
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // Parse the list of file names from the response
            var songIndex = xhr.responseText.split('\n');

            // Populate the dropdown list with the file names
            songIndex.forEach(function (songName) {
                if (songName === "") { return; }
                var option = document.createElement('option');
                option.value = songName;
                option.text = songName.replaceAll("_", " ");
                dropdown.add(option);
            });
        }
    };
    xhr.open('GET', 'songs/Index.txt');
    xhr.send();
}
populateDropDown();


/***************
*    BUBBLES   *
****************/

const rect = container.getBoundingClientRect();
var angle = 0;
function createBubble() {
    var childrenCount = container.children.length;
    if (childrenCount >= maxParticleCount - 25) { return; }
    for (let i = 0; i < 4; i++) {
        const particle = document.createElement('div');
        particle.classList.add('bubble');
        container.appendChild(particle);

        const scale = Math.random() * 1.5;
        const duration = 5000 + Math.random() * 500;
        const x = rect.width * Math.random();
        const y = -rect.height / 4 * Math.random() + 100 * Math.random();

        particle.style.left = rect.left + x;
        particle.style.top = rect.top + y;
        particle.style.zIndex = '9990';

        const animation = particle.animate(
            [
                { transform: `translate(${x}px, ${rect.height}px) scale(0.1)`, opacity: 0.6 },
                { transform: `translate(${x + angle * 10}px, ${y}px) scale(${scale})`, opacity: 0 }
            ],
            {
                duration: duration,
                easing: 'ease-out'
            }
        );

        animation.onfinish = () => particle.remove();
    }
}
if (shouldBubble) {
    setInterval(createBubble, 500);
}

window.addEventListener("devicemotion", handleMotion, true);

var currentAngle = 0;
var smoothingFactor = 0.01;

function handleMotion(event) {
    var acceleration = event.accelerationIncludingGravity;
    var x = acceleration.x;
    var y = acceleration.y;

    var targetAngle = Math.atan2(x, y) * (180 / Math.PI);
    currentAngle = lerp(currentAngle, targetAngle, smoothingFactor);

    if (currentAngle < -10) {
        currentAngle = -10;
    } else if (currentAngle > 10) {
        currentAngle = 10;
    }

    angle = currentAngle;

    // Apply rotation to your target div element
    var targetDiv = document.getElementById("crown");
    targetDiv.style.transform = "rotate(" + currentAngle + "deg)";
    container.style.setProperty('--background', `linear-gradient(${150 + angle}deg, rgba(255, 249, 188, 1) 5%, rgba(227, 176, 39, 1) 35%, rgb(146, 66, 12) 80%)`);
}

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}
