/*
Not the cleanest script I've written,
but it does its job. Feel free to take
this program and do whatever you want
with it. However, you might want to make
some improvements - this was rushed.
*/

const examples = ["run_onload", "list_chars", "guess_game", "greet_me"];

const table = {
  "nop":10,
  "set":11,
  "setc":12,
  "setr":13,
  "out":14,
  "jmp":15,
  "swtch":16,
  "sets":17,
  "setc":18,
  "+":20,
  "-":21,
  "~":21,
  "*":22,
  "/":23,
  "%":24,
  ">":25,
  ">=":26,
  "=":27,
  "&":28,
  "|":29,
  "^":30,
  "!^":31,
  "!&":32,
  "!|":33,
  "root":34,
  "drt":35,
  "exp":36,
  "psh":40,
  "pop":41,
  "inp":42,
  "spl":43,
  "outs":44,
  "null":45,
  "cmps":47,
  "outsc":48
}

const entities = {
  "nl":902,
  "none":0,
  "up":70,
  "down":71,
  "right":72,
  "left":73,
  "dash":88,
  "cross":91,
  "le":101,
  "ge":102,
  "ne":103,
  "euro":104,
  "pound":105,
  "square":106,
  "circle":107,
  "dot":108,
  "cent":109,
  "quote":99,
  "double":100,
  "clr":900,
  "del":901,
  "e_w":110,
  "ne_corn":111,
  "se_corn":112,
  "sw_corn":113,
  "n_s":114,
  "box_ctr":115,
  "rj":116,
  "lj":117,
  "bj":118,
  "tj":119,
  "nw_corn":120,
  "sp":121
};

const num = a => (a < 1000 ? 1000 + a : 6000 + a);

const alpha = "\x00ABCDEFGHIJKLMNOPQRSTUVWXYZ.:?!abcdefghijklmnopqrstuvwxyz/|\\0123456789AAAA<>;,@#$%^&*()-A_+A[]{}=~`'\"AAAAAAAAAAAAAAAAAAAA ";

let labels = {};

let linenum = 0;

let file = null;

let errorPos = 0;

let errorMsg = false;

let errorFile = null;

function error(msg) {
    if(!errorMsg) {
      errorMsg = msg;
      errorPos = linenum + 1;
      errorFile = file;
    }
    return true;
}

function assemble(line, prog) {
  let outp = 0;
  if(line == "halt")
    return 0;
  lineSplit = line.split(" ").map(a => a.trim()).filter(a => a != "");
  linenum = prog.split("\n").indexOf(line);
  if(lineSplit.length > 3) {
    error("Too many arguments");
  }
  let arg1 = (lineSplit[1] ? expr(lineSplit[1]) : 1000);
  let arg2 = (lineSplit[2] ? expr(lineSplit[2]) : 1000);
  if(arg1 < 0 || arg2 < 0) {
    error("Invalid argument");
  }
  if(!table[lineSplit[0]]) {
    error(`No such call for "${lineSplit[0]}"`);
  }
  outp = 100000000 * table[lineSplit[0]] + arg1 * 10000 + arg2;
  return outp;
}

function addLbl(name, idx) {
  if(name in labels)
    return error("A label \"" + name + "\" has been defined in multiple places.");
  labels[name] = idx;
}

function helpNum(e) {
  return (e[0] == "#" ? (labels[e.slice(1)] ? labels[e.slice(1)] : -10000) : (isNaN(parseInt(e)) ? -10000 : parseInt(e)));
}

function expr(e) {
  let outp = 1000;
    switch(e[0]) {
      case "'": {
        return alpha.indexOf(e.slice(1)) > 0 ? alpha.indexOf(e.slice(1)) + 1000 : -1;
      }
      case "r": {
        return 3000;
      }
      case "*": {
        return 2000 + helpNum(e.slice(1));
      }
      case "^": {
        return 3000 + helpNum(e.slice(1));
      }
      case "R": {
        return 3067;
      }
      case "#": {
        return labels[e.slice(1)] ? labels[e.slice(1)] + 1000 : -1;
      }
      case "@": {
        return 5000 + helpNum(e.slice(1));
      }
      case "!": {
        return 6000;
      }
      case "c": {
        return 9000 + helpNum(e.slice(1));
      }
      case "C": {
        return 4000 + helpNum(e.slice(1));
      }
      case "&": {
        return 1000 + getEnt(e.slice(1));
      }
    }
  return num(parseInt((e[0] == "$" ? e.slice(1) : e)));
}

function getEnt(name) {
  name = name.trim();
  if(entities[name]) return entities[name]; else return error(`No such entity "${name}"`);
}

function asmProg(program, mmap, constants) {
  let code = program.split("\n").filter(a => a[0] != "#");
  let clean = [];
  labels = {};
  let constclean = [];
  let memclean = [];
  errorPos = 0;
  errorMsg = false;
  file = "Constants";
  constants = constants.split("\n").map(a => a.trimLeft());
  for(linenum = 0; linenum < constants.length; linenum++) {
    if(constants[linenum].trim() == "") continue;
    switch(constants[linenum][0]) {
      case "#": {
        continue;
      }
      case ".": {
        addLbl(constants[linenum].slice(1), constclean.length + 1);
        break;
      }
      case ":": {
        addLbl(constants[linenum].slice(1), constclean.length);
        break;
      }
      case "$": {
        constclean.push(parseInt(constants[linenum].slice(1)));
        break;
      }
      case "_": {
        for(var j = 0; j < parseInt(constants[linenum].slice(1)); j++) {
          constclean.push(0);
        }
        break;
      }
      case "'": {
        for(var j = 1; j < constants[linenum].length; j++) {
          constclean.push(alpha.indexOf(constants[linenum][j]));
        }
        break;
      }
      case "&": {
        constclean.push(getEnt(constants[linenum].slice(1)));
        break;
      }
      default: {
        error("Invalid constant expression \"" + constants[linenum] + "\"")
      }
    };
  };
  
  file = "Memory Map";
  mmap = mmap.split("\n").map(a => a.trim());
  for(linenum = 0; linenum < mmap.length; linenum++) {
    if(mmap[linenum].trim() == "") continue;
    switch(mmap[linenum][0]) {
      case "#": {
        continue;
      }
      case ".": {
        addLbl(mmap[linenum].slice(1), memclean.length + 1);
        break;
      }
      case ":": {
        addLbl(mmap[linenum].slice(1), memclean.length);
        break;
      }
      case "_": {
        for(var j = 0; j < parseInt(mmap[linenum].slice(1)); j++) {
          memclean.push(0);
        }
        break;
      }
      default: {
        error("Invalid memory expression \"" + mmap[linenum] + "\"");
      }
    };
  };
  
  file = "Program";
  for(linenum = 0; linenum < code.length; linenum++) {
    if(code[linenum].trim() == "") continue;
    if(code[linenum][0] == ".") {
      addLbl(code[linenum].slice(1), clean.length + 1);
    } else if(code[linenum][0] == ":") {
      addLbl(code[linenum].slice(1), clean.length);
    } else {
      clean.push(code[linenum])
    }
  }
  
  let final = [];
  
  for(i of clean) {
    final.push(assemble(i, program));
  }
  
  return "a_{upload}\\left(\\left[" + JSON.stringify([memclean.length, constclean.length, ...constclean, ...final]).slice(1, -1) + "\\right]\\right)";
}

// const PROGRAM = `# Assembler Test
// .begin
// outsc #msg #endmsg
// +       *#count 01
// % r 010
// set #count r
// + *#count 060
// out r 01
// out 0902 01
// halt
// jmp #begin 01`;

// const MMAP = `# Memory map
// .count
// _2`;

// const CONSTANTS = `# Constant section
// .msg
// 'Button Presses: 
// :endmsg`;

// const CONSTANTS = `# Constant section
// _2`;

// BELOW: STUFF NOT FOR THE ASSEMBLY PROCESS

let activeTA = "program";

let areas = {
  "program":document.getElementById("prog"),
  "mmap":document.getElementById("mmap"),
  "constant":document.getElementById("const")
}

let pre = document.getElementById("feedback");

function lineNumbers() {
  document.querySelector("p").innerHTML = "";
  for(var i = 1; i < areas[activeTA].value.split("\n").length + 1; i++) {
    document.querySelector("p").innerHTML += `${i}<br/>`;
  }
}

function show(tab) {
  areas[activeTA].style.display = "none";
  areas[tab].style.display = "";
  activeTA = tab;
  lineNumbers();
  areas[activeTA].addEventListener("input", () => {
    pre.textContent = "";
    document.querySelector("p").innerHTML = "";
    lineNumbers();
  });
}

function copyResult(str) {
  navigator.clipboard.writeText(str)
    .then(() => {
      pre.textContent = "Program assembled with no errors and copied to clipboard.\nFor help on how to upload the program, click \"Program Upload Help\" in the left sidebar";
    })
    .catch(err => {
      pre.textContent = "Program assembled with no errors, but couldn't be copied to clipboard.\nTry changing browser's permissions, or copying the result below manually (be sure not to include any extra whitespace at the beginning or end)\n\n" + str
    });
}

function download() {
  const text = JSON.stringify({
    "program":areas.program.value,
    "mmap":areas.mmap.value,
    "constant":areas.constant.value
  });
  const blob = new Blob([text], { type: "application/json" });
  const a = document.createElement('a');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.href = window.URL.createObjectURL(blob);
  a.setAttribute('download', "desm_prog.json");
  a.click();
  window.URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
  pre.textContent = "Program has been downloaded. You may now upload it to this webpage some other time.";
}

document.getElementById("upload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    let result = {};
    try {result = JSON.parse(reader.result)} catch {pre.textContent = "The file uploaded was not in a supported format.";}
    if(!result.program || !result.mmap || !result.constant) {
      pre.textContent = "The file uploaded was not in a supported format.";
    } else if(confirm("Uploading this file will overwrite the current program being edited. Continue?")) {
      for(var i of ["program", "mmap", "constant"]) {
        areas[i].value = result[i];
      }
      show("program");
    }
  };
  reader.readAsText(file, "utf-8");
});

function everything() {
  let result = asmProg(areas.program.value, areas.mmap.value, areas.constant.value);
  if(errorMsg) {
    pre.textContent = `Error: ${errorMsg}\nFound at line ${errorPos} in "${errorFile}"`;
  } else {
    copyResult(result);
  }
}

show("program");

// BELOW: STUFF FOR EXAMPLE PROGRAMS

function showEx(arg) {
    document.getElementById("examples").style.display = arg;
}

for(var i of examples) {
    document.querySelector("#examples ul").innerHTML += `<li onclick="load('${i}')">${i}</li>`;
}

async function load(name) {
    if(!confirm("Opening this program will overwrite the current program being edited. Continue?"))
        return;
    let result = await (await fetch(`example/${name}.json`)).json();
    for(var i of ["program", "mmap", "constant"]) {
        areas[i].value = result[i];
    }
    show("program");
    showEx("none");
}
