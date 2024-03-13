import { io } from "socket.io-client";
import {useEffect, useState} from 'react';
import './App.css';
import { withStyles } from "@material-ui/core/styles";
import { useHistory } from 'react-router-dom';
import { useContext } from "react";
import {ThemeContext} from './contexts/ThemeContext'
import { Button, TextField, Typography } from "@material-ui/core";
import NavBar from "./NavBar";

var connectionOptions =  {
  "force new connection" : true,
  "reconnectionAttempts": "Infinity", 
  "timeout" : 10000,                  
  "transports" : ["websocket"]
};

const styles = {
  light: {
      color: "black",
      fontSize: "22px"
  },
  dark: {
      color: "white",
      fontSize: "22px"
  }
};

const { REACT_APP_BACKEND_URL } = process.env;
const socket = io(`${REACT_APP_BACKEND_URL}/`, connectionOptions);

function AddRoom(props) {
  const { isLightTheme, light, dark } = useContext(ThemeContext);
  const theme = isLightTheme ? light : dark;
  const history = useHistory()
  const { classes } = props;

  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomError, setJoinRoomError] = useState('');
  const [createRoomError, setCreateRoomError] = useState('');

  const ThemeTextTypography = withStyles({
      root: {
        color: theme.text
      }
  })(Typography);

  const styles = {
    root: {
      background: "black"
    },
    input: {
      color: "white"
    }
  };


  useEffect(async () => {
    if(!sessionStorage.getItem("username"))
        history.push('/')
    socket.on("Hey", (arg1) => {
      if(arg1.err){
        setJoinRoomError(arg1.err);
        setTimeout(() => {
          setJoinRoomError("");
        }, 5000)
      }
      else if(arg1.msg === "Success"){
          if(arg1.roomID){
            setCode(arg1.roomID)
            history.push({
              pathname: `/main/${arg1.roomID}`,
              state: { roomID: arg1.roomID, newUser: true}
            }); 
        }
      }
    });
  })

  function joinRoom(e){
    e.preventDefault();
    if(code.length == 0 || password.length == 0){
      setJoinRoomError("Please enter all fields");
      setTimeout(() => {
          setJoinRoomError("");
      }, 5000)
      return;
    }
    socket.emit('join', code, password, sessionStorage.getItem("username"), sessionStorage.getItem("name"));    
  }

  function createRoom(e){
    e.preventDefault();
    if(newRoomPassword.length == 0 || newRoomName.length == 0){
      setCreateRoomError("Please enter all fields");
      setTimeout(() => {
          setCreateRoomError("");
      }, 5000)
      return;
    }
    socket.emit("create room", newRoomPassword, sessionStorage.getItem("username"), newRoomName, sessionStorage.getItem("name"));
  }
  
  return (
    <>
    <NavBar />
    <div className="App" style={{ display:"flex", height: "91.9vh", paddingTop: "4%", backgroundColor:theme.ui }}>
      <div style={{width:"50%", marginTop:"3%"}}>
        <div style={{marginLeft:"20%", paddingTop:"5%", height:"40%", marginRight:"20%", backgroundColor: theme.innerBox}}>
          <ThemeTextTypography variant="h4">Join Room</ThemeTextTypography>
          <form>
              <ThemeTextTypography display="inline" style={{ color: theme.text }}>
                Enter RoomId:
              </ThemeTextTypography> 
              <TextField InputLabelProps={{ style: { color: theme.placeholder, fontSize: "22px"}}} InputProps={{ className: isLightTheme ? classes.light: classes.dark }} type="text" style={{backgroundColor: theme.button, color: theme.text }} value={code} onChange={(e) => setCode(e.target.value)}/><br /><br />
              <ThemeTextTypography display="inline" style={{ color: theme.text}}>
                Enter Room Password:
              </ThemeTextTypography> 
              <TextField type="password" InputLabelProps={{ style: { color: theme.placeholder, fontSize: "22px"}}} InputProps={{ className: isLightTheme ? classes.light: classes.dark }} style={{backgroundColor: theme.button, textColor: theme.text }} value={password} onChange={(e) => setPassword(e.target.value)}/><br /><br />
              <Button type="submit" style={{backgroundColor: theme.button, color: theme.text }} onClick={(e) => joinRoom(e)} value="Submit">Submit</Button><br />
              {joinRoomError ? <ThemeTextTypography style={{color: "red"}} variant="h7"><b>{joinRoomError}</b></ThemeTextTypography> : null}
          </form>
        </div>
      </div>
      <div style={{width:"50%", marginTop:"3%"}}>
        <div style={{marginLeft:"20%", paddingTop:"5%", height:"40%", marginRight:"20%", backgroundColor: theme.innerBox}}>
          <ThemeTextTypography variant="h4">Create New Room</ThemeTextTypography>
            <form>
              <ThemeTextTypography display="inline" style={{ color: theme.text}}>
                Enter Room Name:
              </ThemeTextTypography>
              <TextField type="text" InputLabelProps={{ style: { color: theme.placeholder, fontSize: "22px"}}} InputProps={{ className: isLightTheme ? classes.light: classes.dark }} style={{backgroundColor: theme.button, color: "white" }} value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}/><br /><br />
              <ThemeTextTypography display="inline" style={{ color: theme.text}}>
                Enter Room Password:
              </ThemeTextTypography>
              <TextField type="password" InputLabelProps={{ style: { color: theme.placeholder, fontSize: "22px"}}} InputProps={{ className: isLightTheme ? classes.light: classes.dark }} style={{backgroundColor: theme.button, color: "white" }} value={newRoomPassword} onChange={(e) => setNewRoomPassword(e.target.value)}/><br /><br />
              <Button type="submit" style={{backgroundColor: theme.button, color: theme.text }} onClick={(e) => createRoom(e)} value="Submit">Submit</Button><br /><br />
              {createRoomError ? <ThemeTextTypography style={{color: "red"}} variant="h7"><b>{createRoomError}</b></ThemeTextTypography> : null}
            </form>
        </div>
      </div>
        
    </div>
    </>
  );
}

export default withStyles(styles)(AddRoom);
