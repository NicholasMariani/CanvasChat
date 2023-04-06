// setup my socket client
var socket = io();


// read room in querystring
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const room = urlParams.get('room');

const generateRandomString = (length = 6) => Math.random().toString(20).substr(2, length);

const generateRandomDarkColor = () => {
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += Math.floor(Math.random() * 10);
  }
  return color;
}


window.onload = function () {
  socket.emit('room', room);
  let userid = "";
  if (localStorage.getItem("userid")) {
    userid = localStorage.getItem("userid");
  } else {
    userid = generateRandomString(8);
    localStorage.setItem("userid", userid);
    localStorage.setItem("userColor", generateRandomDarkColor());
  }

  $("form").on('submit', function (event) {
    event.preventDefault();
    let msg = $("#msg").val();
    msg = msg.replace(/(<([^>]+)>)/gi, "");
    const userid = localStorage.getItem("userid");
    const userColor = localStorage.getItem("userColor");
    console.log("sending msg: " + msg + " from " + userid);
    socket.emit('message', { "msg": msg, "userid": userid, "room": room, "userColor": userColor });
    $("#msg").val("");
  });

  // called when the server calls socket.broadcast('message')
  socket.on('message', function (obj) {
    let prevChat = $("#chatBoard").html();
    const ts = new Date().toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    $("#chatBoard").html(prevChat + '<div class="msgRow"><span class="userid" style="color:' + obj.userColor + '">' + obj.userid + "</span><br />" + obj.msg + '<span class="ts">' + ts + '</span></div>');
    var chatboard = document.getElementById("chatBoard");
    chatboard.scrollTop = chatboard.scrollHeight;
    console.log(prevChat + obj.userid + ": " + obj.msg);
  });

  socket.on('participants', function (count) {
    $("#participants").html(count);
  });

  socket.on('paint', function(data) {
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineTo(data.data.x, data.data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.data.x, data.data.y);
  });
}

function toggleCollapse() {
  const collapseContent = document.querySelector('.collapse-content');
  collapseContent.classList.toggle('show');
}

// Get canvas and context
var canvas = document.getElementById("drawing");
var ctx = canvas.getContext("2d");

// Set canvas dimensions to match window size
function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Call the function when the page loads
setCanvasSize();

// Call the function again whenever the window is resized
window.addEventListener("resize", setCanvasSize);
// set drawing variables
var painting = false;
var x = 0;
var y = 0;
var brushSize = 5;
var color = "#000000";
// get color picker and brush size elements
var colorPicker = document.getElementById("color-picker");
var brushSizeEl = document.getElementById("brush-size");
// set event mouse listeners
canvas.addEventListener("mousedown", startPainting);
canvas.addEventListener("mouseup", stopPainting);
canvas.addEventListener("mousemove", paint);
// Set event listeners for touch events
canvas.addEventListener("touchstart", startPainting);
canvas.addEventListener("touchend", stopPainting);
canvas.addEventListener("touchmove", paint);
colorPicker.addEventListener("input", setColor);
brushSizeEl.addEventListener("input", setBrushSize);

// start painting
function startPainting(event) {
  painting = true;
  x = event.clientX;
  y = event.clientY;
}
// stop painting
function stopPainting() {
  painting = false;
  ctx.beginPath();
}

// paint
function paint(event) {
  if (!painting) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineTo(event.clientX, event.clientY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(event.clientX, event.clientY);
  socket.emit('drawClick', {
    x: event.clientX,
    y: event.clientY
  });
}
// set color
function setColor(event) {
  color = event.target.value;
}
// set brush size
function setBrushSize(event) {
  brushSize = event.target.value;
}

// get dark mode toggle
var darkModeToggle = document.getElementById("dark-mode-toggle");

// Add event listener to toggle dark mode
darkModeToggle.addEventListener("change", toggleDarkMode);

// Function to toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}