import {useEffect, useState} from 'react';
import './App.css';
import { withStyles } from "@material-ui/core/styles";
import { useHistory } from 'react-router-dom';
import { useContext } from "react";
import {ThemeContext} from './contexts/ThemeContext'
import { Card, CardActionArea, CardContent, Grid, Typography } from "@material-ui/core";
import NavBar from "./NavBar";
import axios from "axios";
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

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

function Home() {
  const { isLightTheme, light, dark } = useContext(ThemeContext);
  const theme = isLightTheme ? light : dark;
  const history = useHistory()
  const [projects, setProjects] = useState([]);
  const [shouldFetch, setShouldFetch] = useState(true)
  const [gitCount, setGitCount] = useState(0);

  const ThemeTextTypography = withStyles({
      root: {
        color: theme.text
      }
  })(Typography);

  if(!sessionStorage.getItem("username"))
        history.push('/')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(async () => {
    sessionStorage.setItem("roomID", "a")
    if(shouldFetch){
      const projects = await axios.get(`${REACT_APP_BACKEND_URL}/getProjects/${sessionStorage.getItem("username")}`)
      setProjects(projects.data.room)
      setGitCount(projects.data.gitCount);
      setShouldFetch(false)
    }
  })

  function handleProject(roomID, authLevel){
    history.push({
      pathname: `/main/${roomID}`,
      state: { authLevel }
    }); 
  }
  
  function gitRooms(){
    if(gitCount > 0)
    return(
      <div>
      <ThemeTextTypography style={{fontFamily: "Verdana", marginBottom: "1%", paddingTop: "2%"}} variant="h4"><b>Git Rooms:</b></ThemeTextTypography>
        <Grid container style={{paddingLeft: "8%"}}>
                {projects.length>0 ? projects.map((row,i)=>{
                  if(row.isGitRepo){
                    return(
                        <Grid key={i} style={{marginRight:"20px", marginBottom: "20px"}} item xs={2}>
                            <Card style={{boxShadow: "2px 2px 2px #575859", backgroundColor: theme.innerBox}} onClick={()=> handleProject(row.roomID, row.data.authLevel)}>
                                <CardActionArea>
                                    <CardContent>
                                    <div style={{ textAlign: "center" }}>
                                        <ThemeTextTypography gutterBottom style={{fontFamily: "Georgia"}} variant="h5">
                                            <b>{row.name}</b>
                                        </ThemeTextTypography>
                                        <ThemeTextTypography variant="h6" color="textSecondary">
                                            {row.designation}
                                        </ThemeTextTypography>
                                        <ThemeTextTypography variant="h6" style={{color: theme.textNotImp}}>
                                            {row.data.authLevel} 
                                        </ThemeTextTypography>
                                        <FiberManualRecordIcon fontSize="small" style={{ color: "red" }} /> 
                                        <ThemeTextTypography style={{fontSize:"25px"}}display="inline" variant="h6" color="textSecondary">
                                            <b> {row.members.length}</b> 
                                        </ThemeTextTypography>
                                    </div>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    )}
                  else
                      return null
                }) : <ThemeTextTypography variant="h2" style={{color: "#696b6a", textAlign: "center"}}>No repos</ThemeTextTypography>}
          </Grid>
          </div>
    )
    else if(projects.length == 0)
      return(
        <ThemeTextTypography variant="h2" style={{ marginTop:"2%", color: "#696b6a", textAlign: "center"}}>No Rooms Created</ThemeTextTypography>
      )
  }

  function customRooms(){
    if(gitCount !== projects.length)
    return(
      <div>
      <ThemeTextTypography style={{fontFamily: "Verdana", marginBottom: "1%", paddingTop: "2%"}} variant="h4"><b>Custom Rooms:</b></ThemeTextTypography>
          <Grid container style={{paddingLeft: "8%"}}>
                {projects.length>0 ? projects.map((row,i)=>{
                  if(!row.isGitRepo)
                    return(
                        <Grid key={i} style={{marginRight:"20px", marginBottom: "20px"}} item xs={2}>
                            <Card style={{boxShadow: "2px 2px 2px #575859", backgroundColor: theme.innerBox}} onClick={()=> handleProject(row.roomID, row.data.authLevel)}>
                                <CardActionArea>
                                    <CardContent>
                                    <div style={{ textAlign: "center" }}>
                                        <ThemeTextTypography gutterBottom style={{fontFamily: "Georgia"}} variant="h5">
                                            <b>{row.name}</b>
                                        </ThemeTextTypography>
                                        <ThemeTextTypography variant="h6" color="textSecondary">
                                            {row.designation}
                                        </ThemeTextTypography>
                                        <ThemeTextTypography variant="h6" style={{color: theme.textNotImp}}>
                                            {row.data.authLevel} 
                                        </ThemeTextTypography>
                                        <FiberManualRecordIcon fontSize="small" style={{ color: "red" }} /> 
                                        <ThemeTextTypography style={{fontSize:"25px"}}display="inline" variant="h6" color="textSecondary">
                                            <b> {row.members.length}</b> 
                                        </ThemeTextTypography>
                                    </div>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    )
                  else
                      return null
                }) : <ThemeTextTypography>No repos</ThemeTextTypography>}
              </Grid>
              </div>
    )
  }
  return (
    <div >
    <NavBar />
    <div className="App" style={{ paddingTop: "3%", minHeight: "93.9vh", width: "100%", backgroundColor:theme.ui }}>
          {gitRooms()}
          {customRooms()}
          
    </div>
    </div>
  );
}

export default withStyles(styles)(Home);
