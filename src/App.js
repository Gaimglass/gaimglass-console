import React, { useState, useEffect, useMemo } from 'react';
import { SketchPicker } from 'react-color';
import { RgbColorPicker, HslColorPicker } from 'react-colorful';
import { useSelector, useDispatch } from 'react-redux'
import { initializeStatus } from './store/status'

import logo from './logo.svg';
import './App.css';

const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;
//const fs = electron.remote.require('fs');


function App() {
  
  const dispatch = useDispatch();

  const [color, setColor] = useState({rgb:{r:200,g:20,b:255}});
  const [mute, setMute] = useState(false);

  // store
  const count = useSelector(state => state)

  //
  useEffect(() => {
    //debugger;
    // TODO add some delay here because GG is not normally ready to accept serial input
    (async () => {
      const c = await ipcRenderer.send('get-status');
    })();
    
    //dispatch(initializeStatus());
    /*
    console.log("getting color..");
    const c = ipcRenderer.sendSync('get-color');
    if (c) {
      setColor({
        ...c
      });
      // pass color to gaimglass
      ipcRenderer.sendSync('set-color', c);
    } else {
      // set up default color perhaps?
    }*/
  }, []);


  function handleChangeComplete(c) {
    ipcRenderer.sendSync('set-color', c)
    setColor({
      ...c
    });
  };

  function writeDefault() {
    ipcRenderer.sendSync('set-default-color', {red: color.rgb.r, green: color.rgb.g, blue: color.rgb.b}) 
  }

  function getColor() {
    const c = ipcRenderer.sendSync('get-color');
    //console.log(c);
  }

  async function getStatus() {
    console.log("ok stat...");
    const c = await ipcRenderer.sendSync('get-status');
    // todo, update state with new values
    console.log("ok stat",c);
  }

  function toggleMute() {
    if(mute) {
      setMute(false);
      ipcRenderer.sendSync('set-mute', false);
    } else {
      setMute(true);
      ipcRenderer.sendSync('set-mute', true);
    }
  }

  return (
    <div className="App">
      {/* <img src={logo} className="App-logo" alt="logo" /> */}
      <button onClick={writeDefault}>Set Default Color</button>
      {/* <button onClick={readDefault}>Get Default Color</button> */}

      <button onClick={getColor}>Get Color</button>
      <button onClick={toggleMute}>{mute ? "Turn Off" : "Turn On"}</button>
      <button onClick={getStatus}>Get Status</button>

      <div>{color?.hex}</div>
      <div>{color?.rgb?.r} {color?.rgb?.g} {color?.rgb?.b}</div>
      
      <RgbColorPicker
        color={color}
        onChange={ handleChangeComplete }
      ></RgbColorPicker>
      {/* <SketchPicker
        width={400}
        color={color.hex}
        onChange={ handleChangeComplete }
        //onChangeComplete={ handleChangeComplete }
      /> */}
    </div>
  );
}


export default App;

