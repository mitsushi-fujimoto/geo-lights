import Geogebra from 'react-geogebra';
import React from 'react';
import { Stack, Typography, Switch, Button, Snackbar, Alert } from '@mui/material';
import createModule from './lightsout.mjs';

function App() {
  const [mode, setMode] = React.useState(true);
  const handleChange = (event) => {
    setMode(event.target.checked);
  };
  const stateMode = React.useRef(); // ステート取得のためにオブジェクトを作成
  stateMode.current = mode; // modeのステートをcurrentに保持
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
          sx={{width:'200px','& .MuiAlert-message':{textAlign:'center',width:'inherit'}}}
        >
          <strong>{message}</strong>
        </Alert>
      </Snackbar>
    </div>
  );

  // GeoGebra初期化関数
  function ggbOnInit() {
    const ggbApplet = window.ggbApplet;
    ggbApplet.evalCommand('SetPerspective("2")'); // AlgebraViewを非表示("2"はGraphicsViewを指す)
    ggbApplet.setAxesVisible(false,false); // 座標軸を非表示
    ggbApplet.setGridVisible(false); // グリッドを非表示
    ggbApplet.setCoordSystem(-2,12,-12,1.5); // 原点位置を左上に設定
    ggbApplet.evalCommand('SetAxesRatio(1,1)'); // 座標軸の縦横比を1:1に
    ggbApplet.enableShiftDragZoom(false); // グラフィックスビューのドラッグ&ズームを禁止
    createCell(); // セルを表示
    ggbApplet.registerClickListener(ListenerC); // クリックイベントのリスナーを指定
  }

  // ライツアウトの盤面を生成
  function createCell() {
    const ggbApplet = window.ggbApplet;
    // 5x5格子点P_iの作成
    ggbApplet.evalCommand('Execute(Sequence("P"+(i)+"=("+2*Mod(i,5)+","+(-2*Div(i,5))+")",i,0,24))');
    // 格子点を左上に持つセルq_iをPolygonで作成
    ggbApplet.evalCommand('Execute(Sequence("q"+(i)+"=Polygon(P"+(i)+",P"+(i)+"+(0,-2),P"+(i)+"+(2,-2),P"+(i)+"+(2,0))",i,0,24))');
    for (var i = 0; i < ggbApplet.getObjectNumber(); i++) {
      var obj = ggbApplet.getObjectName(i);
      ggbApplet.setLabelVisible(obj,false); // オブジェクトのラベルは非表示
      if (ggbApplet.getObjectType(obj) === "point") { 
        ggbApplet.setVisible(obj,false); // 点は非表示
      } else if (ggbApplet.getObjectType(obj) !== "quadrilateral") { 
        ggbApplet.setFixed(obj,true,false); // セルq_i以外は選択できないように
      } else {
        ggbApplet.setFixed(obj,true,true); // ドラッグでセルが動かないように固定化
        ggbApplet.evalCommand("SetDynamicColor("+(obj)+",0,0,0,0.2)"); // セルのデフォルトカラーを白に
      }
    }
  }

  // クリックされた場所にあるセルの色を変更
  function ListenerC(obj) { // objにはクリックされたオブジェクト名が渡される
    const ggbApplet = window.ggbApplet;
    if (obj.startsWith('q')) { // セルq_iがクリックされたら
      reverseColor(obj);
      var num = parseInt(obj.substring(1));
      if (stateMode.current === true) { // Playモードなら十字に色反転
        if ((num-1)%5 !== 4) reverseColor("q"+(num-1));
        if ((num+1)%5 !== 0) reverseColor("q"+(num+1));
        if ((num-5) >= 0) reverseColor("q"+(num-5));
        if ((num+5) < 25) reverseColor("q"+(num+5));
      }
      // クリックしたセルに解答の白丸がある場合は削除
      if (ggbApplet.isDefined("AP"+(num))) {
        ggbApplet.deleteObject("AP"+(num));
      }
    }
  }

  // セルの色を反転
  function reverseColor(obj) {
    const ggbApplet = window.ggbApplet;
    if (ggbApplet.getColor(obj) === "#000000") {
      ggbApplet.evalCommand('SetDynamicColor('+(obj)+',0,0,1,0.5)');
    } else {
      ggbApplet.evalCommand('SetDynamicColor('+(obj)+',0,0,0,0.2)');
    }
  }

  // 可解性の判定
  function judgement() {
    const ggbApplet = window.ggbApplet;
    var numlist = []; // 点灯セルの番号を保存する配列
    // 解答の白丸を削除
    for (var i = 0; i < 25; i++) {
      if (ggbApplet.isDefined("AP"+(i))) {
        ggbApplet.deleteObject("AP"+(i));
      }
    }
    for (i = 0; i < ggbApplet.getObjectNumber(); i++) {
      var obj = ggbApplet.getObjectName(i);
      if (ggbApplet.getObjectType(obj) === "quadrilateral" && ggbApplet.getColor(obj) !== "#000000") {
        numlist.push(obj.substring(1));
      }
    }
    var len = numlist.length;
    var numarray = new Uint8Array(new Uint32Array(numlist).buffer); // C関数に渡す配列を準備
    createModule().then(mod => { // solvable関数の呼び出し
      var result = mod.ccall('solvable','number',['array','number'],[numarray,len]);
      if (result === 1) setMessage('Solvable!');
      else setMessage('Unsolvable!');
      setOpen(true);
    });
  }

  // ライツアウトの求解
  function solution() {
    const ggbApplet = window.ggbApplet;
    var numlist = []; // 点灯セルの番号を保存する配列
    // 解答の白丸を削除
    for (var i = 0; i < 25; i++) {
      if (ggbApplet.isDefined("AP"+(i))) {
        ggbApplet.deleteObject("AP"+(i));
      }
    }
    for (i = 0; i < ggbApplet.getObjectNumber(); i++) {
      var obj = ggbApplet.getObjectName(i);
      if (ggbApplet.getObjectType(obj) === "quadrilateral" && ggbApplet.getColor(obj) !== "#000000") {
        numlist.push(parseInt(obj.substring(1))); // q_iの添え字番号iを整数に変換してnumlistに保存
      }
    }
    var len = numlist.length;
    var numarray = new Uint8Array(new Uint32Array(numlist).buffer); // C関数に渡す配列を準備
    createModule().then(mod => { // solve関数の呼び出し
      var ptr = mod.ccall('solve', 'number', ['array','number'], [numarray, len]);
      var rslt = new Int32Array(mod.HEAP32.buffer, ptr, 25); // JavaScriptの配列に変換
      if (rslt[0] === -1) { // 非可解な場合
        setMessage('Unsolvable!');
        setOpen(true);
      } else { // 可解な場合
        for (i = 0; i < 25; i++) {
          if (rslt[i] === 1){ // 解答の白丸をセルに付加
            var x = ggbApplet.getXcoord("P"+(i))+1;
            var y = ggbApplet.getYcoord("P"+(i))-1;
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

  // ゲームの初期化
  function init() {
    const ggbApplet = window.ggbApplet;
    // 解答の白丸を削除
    for (var i = 0; i < 25; i++) {
      if (ggbApplet.isDefined("AP"+(i))) {
        ggbApplet.deleteObject("AP"+(i));
      }
    }
    // 色つきセルを白に
    for (i = 0; i < ggbApplet.getObjectNumber(); i++) {
      var obj = ggbApplet.getObjectName(i);
      if (ggbApplet.getObjectType(obj) === "quadrilateral" && ggbApplet.getColor(obj) !== "#000000") {
        ggbApplet.evalCommand("SetDynamicColor("+(obj)+",0,0,0,0.2)");
      }
    }
    setMode(true);
  }
}
export default App;
