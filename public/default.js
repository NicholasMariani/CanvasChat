// setup my socket client
var socket = io();


// read room in querystring
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const room = "room";
const generateRandomString = (length = 6) => Math.random().toString(20).substr(2, length);
var canvas = document.getElementById('drawing');
var ctx = canvas.getContext("2d");
var colorPicker = document.getElementById("color-picker");
var brushSizeEl = document.getElementById("brush-size");
var darkModeToggle = document.getElementById("dark-mode-toggle");
var userTitle = document.getElementById("username");
var painting = false;
var x = 0;
var y = 0;
var brushSize = 5;
var color = "#000000";
var username = "";

const generateRandomDarkColor = () => {
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += Math.floor(Math.random() * 10);
  }
  return color;
}

window.addEventListener("resize", setCanvasSize);
canvas.addEventListener("mousedown", startPainting);
canvas.addEventListener("mouseup", stopPainting);
canvas.addEventListener("touchstart", startPaintingTouch);
canvas.addEventListener("touchend", stopPainting);
canvas.addEventListener("touchmove", paintTouch);
canvas.addEventListener("mousemove", paint);
colorPicker.addEventListener("input", setColor);
brushSizeEl.addEventListener("input", setBrushSize);
darkModeToggle.addEventListener("change", toggleDarkMode);

function toggleCollapse() {
  const collapseContent = document.querySelector('.collapse-content');
  collapseContent.classList.toggle('show');
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function setColor(event) {
  color = event.target.value;
}

function setBrushSize(event) {
  brushSize = event.target.value;
}

setCanvasSize();

function startPainting(event) {
  painting = true;
  x = event.clientX;
  y = event.clientY;
}

function stopPainting() {
  painting = false;
  ctx.beginPath();
  socket.emit('mouseUp', {
    event: "end"
  });
}

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
    user: username,
    x: event.clientX,
    y: event.clientY,
    color: color,
    brushSize: brushSize
  });
}

function startPaintingTouch(event) {
  painting = true;
  x = event.touches[0].clientX;
  y = event.touches[0].clientY;
}

function paintTouch(event) {
  if (!painting) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineTo(event.touches[0].clientX, event.touches[0].clientY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(event.touches[0].clientX, event.touches[0].clientY);
  socket.emit('drawClick', {
    user: username,
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
    color: color,
    brushSize: brushSize
  });
}

window.onload = function () {
  while (!username) {
    username = window.prompt("Please enter your username:");
    if (!username) {
      alert("Username cannot be empty. Please try again.");
    }
    else {
      userTitle.textContent = username;
    }
  }

  socket.emit('room', room);
  localStorage.setItem("userColor", generateRandomDarkColor());

  $("form").on('submit', function (event) {
    event.preventDefault();
    let msg = $("#msg").val();
    msg = msg.replace(/(<([^>]+)>)/gi, "");
    const userColor = localStorage.getItem("userColor");
    console.log("sending msg: " + msg + " from " + username);
    socket.emit('message', { "msg": msg, "username": username, "room": room, "userColor": userColor });
    $("#msg").val("");
  });

  // called when the server calls socket.broadcast('message')
  socket.on('message', function (obj) {
    let username = obj.username || 'Anonymous';
    let prevChat = $("#chatBoard").html();
    const ts = new Date().toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    $("#chatBoard").html(prevChat + '<div class="msgRow"><span class="username" style="color:' + obj.userColor + '">' + obj.username + "</span><br />" + obj.msg + '<span class="ts">' + ts + '</span></div>');
    var chatboard = document.getElementById("chatBoard");
    chatboard.scrollTop = chatboard.scrollHeight;
    console.log(prevChat + obj.username + ": " + obj.msg);
  });

  socket.on('participants', function (count) {
    $("#participants").html(count);
  });

  socket.on('paint', function (data) {
    if (data.data.event === "end") {
      console.log('Client Canvas: event: ' + data.data.event);
      ctx.beginPath();
    }
    else {
      console.log('Client Canvas: user: ' + data.data.user + ' x: ' + data.data.x + ' | y: ' + data.data.y, ' | color: ' + data.data.color + ' | brushSize: ' + data.data.brushSize);
      ctx.strokeStyle = data.data.color;
      ctx.lineWidth = data.data.brushSize;
      ctx.lineCap = "round";
      ctx.lineTo(data.data.x, data.data.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(data.data.x, data.data.y);
    }
  });
}