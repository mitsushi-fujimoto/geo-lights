import Geogebra from 'react-geogebra';
import React from 'react';
import { Stack, Typography, Switch, Button, Snackbar, Alert } from '@mui/material';
import createModule from './lightsout.mjs';

function App() {
  const [mode, setMode] = React.useState(true);
  const handleChange = (event) => {
    setMode(event.target.checked);
  };
  const stateMode = React.useRef(); // Create an object to obtain state
  stateMode.current = mode; // Keep the state of mode in current
  const [open, setOpen] = React.useState(false);
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };
  const [message, setMessage] = React.useState('');
  return (
    <div className="App">
      <h1>Lights Out</h1>
      <Geogebra
        width="650" height="600" showToolBar="false" showMenuBar="false"
        showAlgebraInput="false" allowStyleBar appletOnLoad={ggbOnInit}
      />
      <Stack direction="row" alignItems="center">
        <Typography>Setup</Typography>
        <Switch checked={mode} onChange={handleChange} />
        <Typography>Play</Typography>
        <Button variant="contained" onClick={init} sx={{margin:2}}>Reset</Button>
        <Button variant="contained" onClick={judgement} sx={{margin:2}}>Judge</Button>
        <Button variant="contained" onClick={solution} sx={{margin:2}}>Solve</Button>
      </Stack>
      <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
      >
        <Alert icon={false} onClose={handleClose} variant="filled" severity="success"
          sx={{width:'200px', '& .MuiAlert-message':{textAlign:'center', width:'inherit'}}}
        >
          <strong>{message}</strong>
        </Alert>
      </Snackbar>
    </div>
  );

  // Initialization function for Geogebra component
  function ggbOnInit() {
    const ggbApplet = window.ggbApplet;
    ggbApplet.evalCommand('SetPerspective("G")'); // Display only GraphicsView
    ggbApplet.setAxesVisible(false,false); // Hide the coordinate axes
    ggbApplet.setGridVisible(false); // Hide the grid of GraphicsView
    ggbApplet.setCoordSystem(-2,12,-12,1.5); // Set the origin position to the top left
    ggbApplet.evalCommand('SetAxesRatio(1,1)'); // Set the aspect ratio of the coordinate axes to 1:1
    ggbApplet.enableShiftDragZoom(false); // Disable drag & zoom in GraphicsView
    createCell(); // Create the 5x5 grid
    ggbApplet.registerClickListener(ListenerC); // Specify the click event listener
  }

  // Create the 5x5 grid of Lights Out
  function createCell() {
    const ggbApplet = window.ggbApplet;
    // Create 5x5 grid points P_i
    ggbApplet.evalCommand('Execute(Sequence("P"+(i)+"=("+2*Mod(i,5)+","+(-2*Div(i,5))+")",i,0,24))');
    // Create cell q_i with 'Polygon' that has a grid point in the upper left
    ggbApplet.evalCommand('Execute(Sequence("q"+(i)+"=Polygon(P"+(i)+",P"+(i)+"+(0,-2),P"+(i)+"+(2,-2),P"+(i)+"+(2,0))",i,0,24))');
    for (let i = 0; i < ggbApplet.getObjectNumber(); i++) {
      const obj = ggbApplet.getObjectName(i);
      ggbApplet.setLabelVisible(obj,false); // Hide labels of objects
      if (ggbApplet.getObjectType(obj) === "point") { 
        ggbApplet.setVisible(obj,false); // Hide point objects
      } else if (ggbApplet.getObjectType(obj) !== "quadrilateral") { 
        ggbApplet.setFixed(obj,true,false); // Make objects other than q_i unselectable
      } else {
        ggbApplet.setFixed(obj,true,true); // Fix cells so they cannot be dragged
        ggbApplet.evalCommand("SetDynamicColor("+(obj)+",0,0,0,0.2)"); // Set default cell color
      }
    }
  }

  // Click event listener for cells
  function ListenerC(obj) { // obj is the name of the clicked object
    const ggbApplet = window.ggbApplet;
    if (obj.startsWith('q')) { // If cell q_i is clicked
      reverseColor(obj);
      const num = parseInt(obj.substring(1));
      if (stateMode.current === true) { // If in Play mode, invert colors in a cross shape
        if ((num-1)%5 !== 4) reverseColor("q"+(num-1));
        if ((num+1)%5 !== 0) reverseColor("q"+(num+1));
        if ((num-5) >= 0) reverseColor("q"+(num-5));
        if ((num+5) < 25) reverseColor("q"+(num+5));
      }
      // If the clicked cell has a white circle, remove it
      if (ggbApplet.isDefined("AP"+(num))) {
        ggbApplet.deleteObject("AP"+(num));
      }
    }
  }

  // Invert the color of the cell
  function reverseColor(obj) {
    const ggbApplet = window.ggbApplet;
    if (ggbApplet.getColor(obj) === "#000000") {
      ggbApplet.evalCommand('SetDynamicColor('+(obj)+',0,0,1,0.5)');
    } else {
      ggbApplet.evalCommand('SetDynamicColor('+(obj)+',0,0,0,0.2)');
    }
  }

  // Solvability check of Lights Out
  function judgement() {
    const ggbApplet = window.ggbApplet;
    const numlist = []; // Array to store the indices of the lit cells
    // Remove the white circles corresponding to the solution
    for (let i = 0; i < 25; i++) {
      if (ggbApplet.isDefined("AP"+(i))) {
        ggbApplet.deleteObject("AP"+(i));
      }
    }
    for (let i = 0; i < ggbApplet.getObjectNumber(); i++) {
      const obj = ggbApplet.getObjectName(i);
      if (ggbApplet.getObjectType(obj) === "quadrilateral" && ggbApplet.getColor(obj) !== "#000000") {
        numlist.push(obj.substring(1)); // Store the index of q_i in numlist
      }
    }
    // Prepare the array for the C function
    const numarray = new Uint8Array(new Uint32Array(numlist).buffer);
    createModule().then(mod => {
      // Execute the C function 'solvable'
      const result = mod.ccall('solvable', 'number', ['array','number'], [numarray, numlist.length]);
      if (result === 1) setMessage('Solvable!');
      else setMessage('Unsolvable!');
      setOpen(true);
    });
  }

  // Find the solution of Lights Out
  function solution() {
    const ggbApplet = window.ggbApplet;
    const numlist = []; // Array to store the indices of the lit cells
    // Remove the white circles corresponding to the solution
    for (let i = 0; i < 25; i++) {
      if (ggbApplet.isDefined("AP"+(i))) {
        ggbApplet.deleteObject("AP"+(i));
      }
    }
    for (let i = 0; i < ggbApplet.getObjectNumber(); i++) {
      const obj = ggbApplet.getObjectName(i);
      if (ggbApplet.getObjectType(obj) === "quadrilateral" && ggbApplet.getColor(obj) !== "#000000") {
        numlist.push(parseInt(obj.substring(1))); // Store the index of q_i in numlist
      }
    }
    // Prepare the array for the C function
    const numarray = new Uint8Array(new Uint32Array(numlist).buffer);
    createModule().then(mod => {
      // Execute the C function 'solve'
      const ptr = mod.ccall('solve', 'number', ['array','number'], [numarray, numlist.length]);
      // Convert the result to a JavaScript array
      const rslt = new Int32Array(mod.HEAP32.buffer, ptr, 25);
      if (rslt[0] === -1) { // Unsolvable case
        setMessage('Unsolvable!');
        setOpen(true);
      } else { // Solvable case
        for (let i = 0; i < 25; i++) {
          if (rslt[i] === 1) { // Add white circles on the cells for the solution
            const x = ggbApplet.getXcoord("P"+(i))+1;
            const y = ggbApplet.getYcoord("P"+(i))-1;
            ggbApplet.evalCommand("AP"+(i)+"=("+(x)+","+(y)+")");
            ggbApplet.setLabelVisible("AP"+(i),false);
            ggbApplet.setFixed("AP"+(i),true,false);
            ggbApplet.evalCommand("SetDynamicColor(AP"+(i)+",1,1,1,0.2)");
          }
        }
      }
      mod._free(ptr);
    });
  }

  // Initialization function for the game
  function init() {
    const ggbApplet = window.ggbApplet;
    // Remove the white circles corresponding to the solution
    for (let i = 0; i < 25; i++) {
      if (ggbApplet.isDefined("AP"+(i))) {
        ggbApplet.deleteObject("AP"+(i));
      }
    }
    // Reset the color of all cells to the default color
    for (let i = 0; i < ggbApplet.getObjectNumber(); i++) {
      const obj = ggbApplet.getObjectName(i);
      if (ggbApplet.getObjectType(obj) === "quadrilateral" && ggbApplet.getColor(obj) !== "#000000") {
        ggbApplet.evalCommand("SetDynamicColor("+(obj)+",0,0,0,0.2)");
      }
    }
    setMode(true);
  }
}
export default App;
