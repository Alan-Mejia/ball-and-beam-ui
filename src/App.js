import React, { Fragment, useRef } from 'react';
import './App.css';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { over } from 'stompjs'
import SockJS from 'sockjs-client'
import * as echarts from 'echarts';

var  stompClient = null
const serverNameWebSocket = "http://192.168.3.10:8080/iot-pid-ball-and-beam"

function App() {

  const deviceName = useRef("")
  const password = useRef("")
  const [isUserLogged, setIsUsserLoged] = useState(false)

  const blockForBalanceAnimation = useRef(null)
  const blockForBallDistanceAnimation = useRef(null)

  const newGainKp = useRef(2.0)
  const newGainKi = useRef(0.00055)
  const newGainKd = useRef(1200)


  const blockForInfraredDistance = useRef(null)
  const containerForChart = useRef(null)
  const [selectedCm, setSelectedCm] = useState(11);
  const [selectedMm, setSelectedMm] = useState(0);
  const [selectNewSensorMeassure, setSelectNewSensorMeassure] = useState(false);

  const [dataAforChart, setDataAforChart] = useState([0])
  const [distanceChartData, setDistanceChartData] = useState([0])
  const [setPointChartData, setSetPointChartData] = useState([0])
  const countForGraphic = useRef(0)

  /* Information from device */
  const [distance, setDistance] = useState(15);
  const [setPointFromSensor, setSetPointFromSensor] = useState(0)
  const [servoAnglefrom, setServoAngleFrom] = useState(5);
  const [servoAngleTo, setServoAngleTo] = useState(-7.5)
  const [kpFromSensor, setKpFromSensor] = useState(null);
  const [kiFromSensor, setKiFromSensot] = useState(null)
  const [kdFromSensor, setKdFromSensor] = useState(null)

  const [chart, setChart] = useState("")


  

  useEffect(()=>{
    if(isUserLogged){
      setChart(createChart())
    }
  },[isUserLogged])

  useEffect(()=>{
    if(isUserLogged && chart !== ""){
      
      const options = {
        
        tooltip:{
          show: true,
          trigger: "axis",
          triggerOn: "mouseove|click"
        },
        xAxis: {
          type: 'category',
          data: [...dataAforChart],
          nameLocation: 'middle'
        },
        yAxis: {
          type: 'value',
          main: 6,
          max: 30
        },
        series: [
          {
            data: [...distanceChartData],
            type: 'line'
          },
          {
            data: [...setPointChartData],
            type: 'line'
          }
        ]
      };
    
      chart.setOption(options);
    }
    
    
  },[dataAforChart, distanceChartData, setPointChartData])

  

  useEffect(()=>{
    if(isUserLogged){
      blockForBalanceAnimation.current.style.setProperty("--rotation-from-angle", `${(servoAnglefrom-30)/4}deg`)
      blockForBalanceAnimation.current.style.setProperty("--rotation-to-angle", `${(servoAngleTo-30)/4}deg`)
      blockForBallDistanceAnimation.current.style.setProperty("--ball-distance-sensor", `${distance}px`)
      blockForInfraredDistance.current.style.setProperty("--infrared-distance",`${distance}px`)
    }
    
  },[servoAngleTo, servoAnglefrom, distance])

  useEffect(()=>{
    if(isUserLogged){
      if((selectedCm + selectedMm/10)>20.0 ){
        Swal.fire({
          icon: 'warning',
          title: "Out of range",
          text: `${selectedCm + selectedMm/10} cm is greater than the maximum value permmited 20 cm, the setpoint will be automatically set to 20 cm.`,
        }).then(()=>{
          setSelectedCm(20)
          setSelectedMm(0)
  
          const payload = {
            from: `react-ui-${deviceName.current}`,
            to: deviceName.current,
            action: "changeParameters",
            newKp: newGainKp.current,
            newKi: newGainKi.current,
            newKd: newGainKd.current,
            newSetPoint: 20.0
          }
          stompClient.send(`/iot-websocket/change-system-parameters/${deviceName.current}`,{}, JSON.stringify(payload))
        })
        
      }else if((selectedCm + selectedMm/10)<8.0){
        Swal.fire({
          icon: 'warning',
          title: "Out of range",
          text: `${selectedCm + selectedMm/10} cm is lesser than the minimum value permmited 8 cm, the setpoint will be automatically set to 8 cm.`,
        }).then(()=>{
          setSelectedCm(8)
          setSelectedMm(0)
          const payload = {
            from: `react-ui-${deviceName.current}`,
            to: deviceName.current,
            action: "changeParameters",
            newKp: newGainKp.current,
            newKi: newGainKi.current,
            newKd: newGainKd.current,
            newSetPoint: 8.0
          }
          stompClient.send(`/iot-websocket/change-system-parameters/${deviceName.current}`,{}, JSON.stringify(payload))
        })
      }else{
        const payload = {
          from: `react-ui-${deviceName.current}`,
          to: deviceName.current,
          action: "changeParameters",
          newKp: newGainKp.current,
          newKi: newGainKi.current,
          newKd: newGainKd.current,
          newSetPoint: selectedCm + selectedMm/10
        }
        stompClient.send(`/iot-websocket/change-system-parameters/${deviceName.current}`,{}, JSON.stringify(payload))
      }
    }
    
  },[selectNewSensorMeassure])

  const createChart = () => {
    if(isUserLogged){
      //const chartContainer = document.getElementById(containerForChart.current);
      const chart = echarts.init(containerForChart.current);
    
      // Establece opciones iniciales para la gráfica
      const options = {
        tooltip:{
          show: true,
          trigger: "axis",
          triggerOn: "mouseove|click"
        },
        xAxis: {
          type: 'category',
          data: [...dataAforChart],
          nameLocation: 'middle'
        },
        yAxis: {
          type: 'value',
          min: 6,
          max: 30
        },
        series: [
          {
            data: [...distanceChartData],
            type: 'line'
          },
          {
            data: [...setPointChartData],
            type: 'line'
          }
        ]
      };
    
      chart.setOption(options);
    
      // Retorna la instancia de la gráfica
      return chart;
    }
    
  };

  const handleCmClick = (cm) => {
    setSelectedCm(()=>cm);
    setSelectedMm(0);
  };

  const handleMmClick = (mm) => {
    setSelectedMm(()=>mm);
  };

  const handleOnClickLogin = ()=>{
    if(deviceName.current === "alancho" && password.current === "equipodecontrol"){
      let sock = new SockJS(serverNameWebSocket)
      stompClient = over(sock)
      stompClient.connect({},onConnectedWebSocket, onErrorWebSocketConnection)
      setIsUsserLoged(true)
    }else{
      Swal.fire({
        icon: 'warning',
        title: "You can not login",
        text: 'The credentials are incorrect'
      })
    }
  }

  const onConnectedWebSocket = ()=>{
    stompClient.subscribe(`/connection/systeminfo/${deviceName.current}`, onStatusMessageRecieved)
  }

  const onStatusMessageRecieved = (payload)=>{
    console.log("Nuevo Update: ", dataAforChart)
    countForGraphic.current += 1;
    const messageContent = JSON.parse(payload.body)
    const centimeters =  Math.floor(messageContent.setPoint)
    const milimeters = (messageContent.setPoint % 1)*10 
    if(messageContent.from === deviceName.current && messageContent.to === `react-ui-${deviceName.current}`){
      setDistance(messageContent.currentDistance)
      setKdFromSensor(messageContent.kd)
      setKiFromSensot(parseFloat(messageContent.ki) )
      setKpFromSensor(messageContent.kp)
      setSetPointFromSensor(messageContent.setPoint)
      setServoAngleFrom(messageContent.servoAngleFrom)
      setServoAngleTo(messageContent.servoAngleTo)
      setSelectedCm(centimeters)
      setSelectedMm(milimeters)

      setDataAforChart((prevState)=>{
        if(prevState.length === 10){
          const newState = [...prevState]
          newState.shift()
          newState.push(countForGraphic.current)
          return newState
        }else{
          const newState = [...prevState]
          newState.push(countForGraphic.current)
          return newState
        }
      })

      setDistanceChartData((prevState)=>{
        if(prevState.length === 10){
          const newState = prevState
          newState.shift()
          newState.push(messageContent.currentDistance)
          return newState
        }else{
          const newState = prevState
          newState.push(messageContent.currentDistance)
          return newState
        }
      })

      setSetPointChartData((prevState)=>{
        if(prevState.length === 10){
          const newState = prevState
          newState.shift()
          newState.push(messageContent.setPoint)
          return newState
        }else{
          const newState = prevState
          newState.push(messageContent.setPoint)
          return newState
        }
      })

    } 
  }

  const onErrorWebSocketConnection = ()=>{
    console.log("Not COnnected to websocket")
  }

  const handleOnChangeUserName = (e)=>{
    deviceName.current = e.target.value
  }

  const handleOnChangePassword = (e)=>{
    password.current = e.target.value
  }

  const handleOnChangeKp = (e)=>{
    newGainKp.current = isNaN(Number(e.target.value))? 0 : Number(e.target.value)
  }

  const handleOnChangeKi = (e)=>{
    newGainKi.current = isNaN(Number(e.target.value))? 0 : Number(e.target.value)
  }

  const handleOnChangeKd = (e)=>{
    newGainKd.current = isNaN(Number(e.target.value))? 0 : Number(e.target.value)
  }

  const handleOnClickChangeGains = ()=>{
    const payload = {
      from: `react-ui-${deviceName.current}`,
      to: deviceName.current,
      action: "changeParameters",
      newKp: newGainKp.current,
      newKi: newGainKi.current,
      newKd: newGainKd.current,
      newSetPoint: setPointFromSensor
    }
    stompClient.send(`/iot-websocket/change-system-parameters/${deviceName.current}`,{}, JSON.stringify(payload))
  }

  return (
    <Fragment>
      {isUserLogged?
        <div className="App">
          <h1 style={{textAlign: "center"}}>Ball and Beam Control System</h1>
        <div className="ruler-container" ref={blockForBalanceAnimation}>
          <div className="sensor-container">
            <div className="sensor-indicator" ref={blockForInfraredDistance}/>
          </div>

          <div className='ball' ref={blockForBallDistanceAnimation}></div>


          {[...Array(22)].map((_, index) => (
            <div
              key={index}
              className={`cm-mark ${selectedCm >= index + 1 ? 'selected' : ''}`}
              onClick={() =>{
                handleCmClick(index + 1)
                setSelectNewSensorMeassure(!selectNewSensorMeassure)
              }}
            >
              {index + 1}
            </div>
          ))}


            <div className='mm-container'>
              {[...Array(9)].map((_, index) => (
                <div
                  key={index}
                  className={`mm-mark ${selectedMm >= index + 1 ? 'selected' : ''}`}
                  onClick={() => {
                    /* if((selectedCm + selectedMm/10)<= 20.0 && (selectedCm + selectedMm/10)>=8.0){ */
                    handleMmClick(index + 1)  
                    setSelectNewSensorMeassure(!selectNewSensorMeassure)
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
        </div>
          
          <div style={{width: "90%", margin: "50px auto", height: "60vh", backgroundColor: "#A0BFE0", borderRadius: "20px", display: "flex", justifyContent: "center", alignItems: "center"}}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", width: "calc(100% - 30px)", height: "calc(100% - 30px)", borderRadius: "20px"}}>
                  <div style={{backgroundColor: "white", width: "50%", height: "100%"}}>
                    <h2 style={{textAlign: "center"}}>Setpoint vs Current distance</h2>
                    <main id='control-system-chart' ref={containerForChart} style={{width: "calc(100%)", height: "calc(100% - 30px)"}}>

                    </main>
                  </div>
                  
                  
                  <div style={{backgroundColor: "green", width: "50%", height: "100%", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                    <div style={{backgroundColor: "white", width: "50%", height: "100%", textAlign: "center", borderLeft: "1px solid black"}}>
                      <h2 style={{textAlign: "center"}}>Change PID gains</h2>
                      <label>Kp: </label>
                      <input type='number' placeholder='Change Kp gain' onChange={handleOnChangeKp}></input>
                      <br></br>
                      <br></br>
                      <label>Ki: </label>
                      <input type='number' placeholder='Change Ki gain' onChange={handleOnChangeKi}></input>
                      <br></br>
                      <br></br>
                      <label>Kd: </label>
                      <input type='number' placeholder='Change Kd gain' onChange={handleOnChangeKd}></input>
                      <br></br>
                      <br></br>
                      <button onClick={handleOnClickChangeGains} style={{backgroundColor: "#AAC8A7", borderRadius: "8px", outline: "none"}}>Change gains!</button>
                    </div>
                    <div style={{backgroundColor: "white", width: "50%", height: "100%", borderLeft: "1px solid black"}}>
                      <h2 style={{textAlign: "center"}}>Information from device</h2>
                      <h3 style={{textAlign: "left", marginLeft: "15px", fontSize: "15px"}}>Distance: {distance} cm</h3>
                      <h3 style={{textAlign: "left", marginLeft: "15px", fontSize: "15px"}}>Setpoint: {setPointFromSensor} cm</h3>
                      <h3 style={{textAlign: "left", marginLeft: "15px", fontSize: "15px"}}>Gain kp: {kpFromSensor}</h3>
                      <h3 style={{textAlign: "left", marginLeft: "15px", fontSize: "15px"}}>Gain ki: {kiFromSensor}</h3>
                      <h3 style={{textAlign: "left", marginLeft: "15px", fontSize: "15px"}}>Gain kd: {kdFromSensor}</h3>  
                    </div>  
                  </div>
              </div>
          </div>

          <p>Made by 😎 Alan Mejia</p>
    </div>    

                  :
        
        <div>
          <h1 style={{textAlign: "center"}}>Find your device</h1>
          <div style={{width: "100%", textAlign: "center", fontSize: "30px", marginTop: "25px"}}>
            <label>Username: </label>
            <input type='text' style={{height: "25px", fontSize: "18px"}} onChange={handleOnChangeUserName}></input>
          </div>
          <div style={{width: "100%", textAlign: "center", fontSize: "30px", marginTop: "25px"}}>
            <label>Password: </label>
            <input type='password' style={{height: "25px", fontSize: "18px"}} onChange={handleOnChangePassword}></input>
          </div>
          <div style={{width: "100%", textAlign: "center", marginTop: "25px"}}>
            <button style={{margin: "0 auto", fontSize: "20px"}} onClick={handleOnClickLogin}>Login</button>
          </div>
        </div>
      }
    
    </Fragment>
  );
}

export default App;
