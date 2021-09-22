const log = (message) => console.log(`[CLIENT] ${message}`);

function init(e) {
  const websocket = new WebSocket("ws://localhost:8081");
  const canvas = document.querySelector("#canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");

  let isPainting = false;
  const initPaint = (e) => {
    isPainting = true;
    paint(e); // needed to be able to make dots
  };
  const finishPaint = () => {
    isPainting = false;
  };

  const paint = (e) => {
    if (!isPainting) return;
    const args = {
      id: window.clientId || null,
      color: window.clientColor || "black",
      x: e.clientX,
      y: e.clientY,
      radius: 10,
      startAngle: 0,
      endAngle: 2 * Math.PI,
    };
    websocket.send(JSON.stringify({ type: "paint", payload: args }));
  };

  const recreateCanvas = (state) => {
    state.forEach((message) => {
      if (message.type == "paint") {
        paintDot(ctx, message.payload);
      }
    });
  };
  const handleSocketOpen = (e) => {
    log("Opening Socket...", e);
    log("Request init data from server");
    websocket.send(JSON.stringify({ type: "init" }));
  };

  const handleSocketMessage = (e) => {
    const message = JSON.parse(e.data);
    log(`Message incoming: ${message}`);
    switch (message.type) {
      case "init":
        const { id, color, state } = message.payload;
        window.clientId = id;
        window.clientColor = color;
        recreateCanvas(state);
        break;
      case "paint":
        const args = message.payload;
        paintDot(ctx, args);
        break;
      default:
        console.log("default case...");
    }
  };

  // Connecting events with functions
  websocket.onopen = handleSocketOpen;
  websocket.onmessage = handleSocketMessage;
  canvas.onmousedown = initPaint;
  canvas.onmousemove = paint;
  canvas.onmouseup = finishPaint;
}

function paintDot(ctx, args) {
  ctx.fillStyle = args.color;
  ctx.arc(args.x, args.y, args.radius, args.startAngle, args.endAngle);
  ctx.fill();
  ctx.beginPath();
}

window.onload = init;
