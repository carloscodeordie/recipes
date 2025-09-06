const svg = document.getElementById("canvas");
const boxesGroup = document.getElementById("boxes");
const connectionsGroup = document.getElementById("connections");
const labelsGroup = document.getElementById("connection-labels");
const addBoxBtn = document.getElementById("addProcessButton");

let selected = null; // dragging
let offset = { x: 0, y: 0 };
let connections = [];
let boxCounter = 0;

let drawingLine = null;
let tempLine = null;
let selectedLine = null;
let selectedBox = null;

function getMousePosition(evt) {
  const CTM = svg.getScreenCTM();
  return {
    x: (evt.clientX - CTM.e) / CTM.a,
    y: (evt.clientY - CTM.f) / CTM.d,
  };
}

// CREATE BOX OR CIRCLE
function createBox(
  x,
  y,
  fixed = false,
  isCircle = false,
  id = null,
  labelText = null
) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  if (!id) id = "box" + ++boxCounter;
  g.setAttribute("id", id);
  g.setAttribute("transform", `translate(${x},${y})`);

  let shape;
  if (isCircle) {
    shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    shape.setAttribute("r", 30);
    shape.setAttribute("cx", 30);
    shape.setAttribute("cy", 30);

    if (id === "startCircle") {
      shape.classList.add("start-circle");
    } else if (id === "endCircle") {
      shape.classList.add("end-circle");
    }

    g.appendChild(shape);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", 30);
    label.setAttribute("y", 35);
    label.setAttribute("text-anchor", "middle");
    label.classList.add("circle-label");
    label.textContent = id === "startCircle" ? "Start" : "End";
    g.appendChild(label);
  } else {
    shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    shape.setAttribute("width", "100");
    shape.setAttribute("height", "60");
    shape.setAttribute("rx", "8");
    shape.setAttribute("ry", "8");
    g.appendChild(shape);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "50");
    text.setAttribute("y", "35");
    text.setAttribute("text-anchor", "middle");
    text.textContent = labelText || id;
    g.appendChild(text);
  }

  // connection points
  if (isCircle) {
    if (id === "startCircle") {
      createConnectionPoint(g, 60, 30, "output");
    } else if (id === "endCircle") {
      createConnectionPoint(g, 0, 30, "input");
    }
  } else {
    createConnectionPoint(g, 0, 30, "input");
    createConnectionPoint(g, 100, 30, "output");
  }

  boxesGroup.appendChild(g);

  if (!fixed) {
    g.addEventListener("mousedown", startDrag);
    g.addEventListener("click", selectBox);
  }

  return g;
}

function createConnectionPoint(parent, cx, cy, type) {
  const point = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  point.setAttribute("cx", cx);
  point.setAttribute("cy", cy);
  point.setAttribute("r", 8);
  point.classList.add("connection-point");
  point.dataset.type = type;
  point.addEventListener("mousedown", startConnection);
  parent.appendChild(point);
}

// DRAGGING
function startDrag(evt) {
  if (evt.target.classList.contains("connection-point")) return;
  selected = evt.currentTarget;
  const mouse = getMousePosition(evt);
  const transform = selected.transform.baseVal.consolidate().matrix;
  offset.x = mouse.x - transform.e;
  offset.y = mouse.y - transform.f;

  svg.addEventListener("mousemove", drag);
  svg.addEventListener("mouseup", endDrag);
}

function drag(evt) {
  if (!selected) return;
  const mouse = getMousePosition(evt);
  let x = mouse.x - offset.x;
  let y = mouse.y - offset.y;

  x = Math.max(0, Math.min(x, svg.width.baseVal.value - 100));
  y = Math.max(0, Math.min(y, svg.height.baseVal.value - 60));

  selected.setAttribute("transform", `translate(${x},${y})`);
  updateConnections();
}

function endDrag() {
  svg.removeEventListener("mousemove", drag);
  svg.removeEventListener("mouseup", endDrag);
  selected = null;
}

// CONNECTIONS
function startConnection(evt) {
  evt.stopPropagation();
  const startPoint = evt.target;
  const parent = startPoint.parentNode;
  const parentMatrix = parent.transform.baseVal.consolidate().matrix;
  const x = parentMatrix.e + parseFloat(startPoint.getAttribute("cx"));
  const y = parentMatrix.f + parseFloat(startPoint.getAttribute("cy"));

  drawingLine = {
    from: parent.id,
    fromType: startPoint.dataset.type, // ✅ store type (input/output)
  };

  tempLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  tempLine.setAttribute("x1", x);
  tempLine.setAttribute("y1", y);
  tempLine.setAttribute("x2", x);
  tempLine.setAttribute("y2", y);
  tempLine.setAttribute("stroke", "#999");
  tempLine.setAttribute("stroke-dasharray", "4");
  connectionsGroup.appendChild(tempLine);

  svg.addEventListener("mousemove", drawTempLine);
  svg.addEventListener("mouseup", finishConnection);
}

function drawTempLine(evt) {
  if (!tempLine) return;
  const mouse = getMousePosition(evt);
  tempLine.setAttribute("x2", mouse.x);
  tempLine.setAttribute("y2", mouse.y);
}

function finishConnection(evt) {
  svg.removeEventListener("mousemove", drawTempLine);
  svg.removeEventListener("mouseup", finishConnection);

  if (!drawingLine || !tempLine) return;

  const target = evt.target;
  if (
    target.classList.contains("connection-point") &&
    target.dataset.type !== drawingLine.fromType
  ) {
    const fromId = drawingLine.from;
    const fromType = drawingLine.fromType;
    const toId = target.parentNode.id;
    const toType = target.dataset.type;

    const newLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    newLine.dataset.from = fromId;
    newLine.dataset.fromType = fromType; // ✅ save which point
    newLine.dataset.to = toId;
    newLine.dataset.toType = toType; // ✅ save which point
    newLine.addEventListener("click", selectLine);
    newLine.addEventListener("dblclick", labelLine);
    connectionsGroup.appendChild(newLine);

    connections.push({
      from: fromId,
      fromType,
      to: toId,
      toType,
      line: newLine,
      label: null,
    });
    updateConnections();
  }

  connectionsGroup.removeChild(tempLine);
  tempLine = null;
  drawingLine = null;
}

function updateConnections() {
  connections.forEach((conn) => {
    const fromBox = document
      .getElementById(conn.from)
      .transform.baseVal.consolidate().matrix;
    const toBox = document
      .getElementById(conn.to)
      .transform.baseVal.consolidate().matrix;

    const fromPoint = document.querySelector(
      `#${conn.from} [data-type='${conn.fromType}']`
    );
    const toPoint = document.querySelector(
      `#${conn.to} [data-type='${conn.toType}']`
    );

    const x1 = fromBox.e + parseFloat(fromPoint.getAttribute("cx"));
    const y1 = fromBox.f + parseFloat(fromPoint.getAttribute("cy"));
    const x2 = toBox.e + parseFloat(toPoint.getAttribute("cx"));
    const y2 = toBox.f + parseFloat(toPoint.getAttribute("cy"));

    conn.line.setAttribute("x1", x1);
    conn.line.setAttribute("y1", y1);
    conn.line.setAttribute("x2", x2);
    conn.line.setAttribute("y2", y2);

    if (conn.label) {
      conn.label.setAttribute("x", (x1 + x2) / 2);
      conn.label.setAttribute("y", (y1 + y2) / 2 - 5);
    }
  });
}

// Selection: lines
function selectLine(evt) {
  clearSelections();
  selectedLine = evt.target;
  selectedLine.classList.add("selected-line");
}

// Selection: boxes
function selectBox(evt) {
  clearSelections();
  selectedBox = evt.currentTarget;
  selectedBox.classList.add("selected-box");
  evt.stopPropagation();
}

// Clear selections when clicking background
svg.addEventListener("click", (evt) => {
  if (evt.target === svg) {
    clearSelections();
  }
});

function clearSelections() {
  if (selectedLine) selectedLine.classList.remove("selected-line");
  if (selectedBox) selectedBox.classList.remove("selected-box");
  selectedLine = null;
  selectedBox = null;
}

// Delete logic
document.addEventListener("keydown", (evt) => {
  if (evt.key === "Delete") {
    if (selectedLine) {
      const idx = connections.findIndex((c) => c.line === selectedLine);
      if (idx >= 0) {
        if (connections[idx].label)
          labelsGroup.removeChild(connections[idx].label);
        connectionsGroup.removeChild(selectedLine);
        connections.splice(idx, 1);
      }
      selectedLine = null;
    } else if (selectedBox) {
      const boxId = selectedBox.id;
      // Remove connections linked to this box
      connections = connections.filter((c) => {
        if (c.from === boxId || c.to === boxId) {
          if (c.label) labelsGroup.removeChild(c.label);
          connectionsGroup.removeChild(c.line);
          return false;
        }
        return true;
      });
      boxesGroup.removeChild(selectedBox);
      selectedBox = null;
    }
  }
});

// Label a line
function labelLine(evt) {
  const line = evt.target;
  const conn = connections.find((c) => c.line === line);
  if (!conn) return;

  const labelText = prompt(
    "Enter label for this connection:",
    conn.label ? conn.label.textContent : ""
  );
  if (labelText === null) return;

  if (!conn.label) {
    conn.label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    conn.label.setAttribute("text-anchor", "middle");
    conn.label.setAttribute("font-size", "12");
    labelsGroup.appendChild(conn.label);
  }
  conn.label.textContent = labelText;
  updateConnections();
}

// BUTTONS
addBoxBtn.addEventListener("click", () => {
  const customLabel = prompt("Enter a label for the new box:", "New Box");
  createBox(
    100 + boxCounter * 40,
    100 + boxCounter * 30,
    false,
    false,
    null,
    customLabel
  );
});

// Initial setup
createBox(50, svg.height.baseVal.value / 2 - 30, true, true, "startCircle");
createBox(
  svg.width.baseVal.value - 90,
  svg.height.baseVal.value / 2 - 30,
  true,
  true,
  "endCircle"
);
// createBox(200, 80, false, false, null, "Step A");
// createBox(400, 200, false, false, null, "Step B");
