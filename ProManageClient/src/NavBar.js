import React, { useContext, useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import {ThemeContext} from './contexts/ThemeContext'
import Brightness4Icon from '@material-ui/icons/Brightness4';
import { useHistory } from 'react-router-dom';
import { withStyles } from "@material-ui/core/styles";
import { Button, Menu, MenuItem } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

const styles = {
  light: {
      color: "black",
      fontSize: "22px"
  },
  dark: {
      color: "white",
      fontSize: "22px"
  }, 
  menuPaper: {
    backgroundColor:"grey",
    marginTop: "1.5%"
  }
};

function NavBar(props){
    const { isLightTheme, light, dark, toggleTheme } = useContext(ThemeContext);
    const theme = isLightTheme ? light : dark;
    const history = useHistory()
    const { classes } = props;
    const [anchorEl, setAnchorEl] = useState(null);

    const ThemeTextTypography = withStyles({
      root: {
        color: theme.text
      }
    })(Typography);


    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    return (
      <div>
        <AppBar style={{ backgroundColor:  theme.navbar }} position="fixed">
          <Toolbar variant="dense" >
            <ThemeTextTypography  onClick={() => history.push('/home')} variant="h5" style={{ fontFamily: "Arial", cursor: "pointer", marginLeft: "7%"}}>
            ProManage
            </ThemeTextTypography>
            <ThemeTextTypography display="inline" onClick={() => history.push('/home')} variant="h6" style={{ color: "grey", fontFamily: "Arial", cursor: "pointer", marginLeft:"5px"}}>
                v2.1
            </ThemeTextTypography>
            <ThemeTextTypography  onClick={() => history.push('/home')} variant="h6" style={{ fontFamily: "Arial", cursor: "pointer", marginLeft: "20%"}}>
              Home
            </ThemeTextTypography>
            <ThemeTextTypography onClick={() => history.push('/addRoom')} variant="h6" style={{ fontFamily: "Arial", cursor: "pointer", marginLeft: "5%"}} >
              Add Room
            </ThemeTextTypography>
            <Brightness4Icon style={{ cursor: "pointer", marginLeft: "5%"}} onClick={() => toggleTheme() }/>
            <Button aria-controls="simple-menu" aria-haspopup="true" style={{ marginLeft: "7%", fontFamily: "Arial" }} onClick={handleClick}>
              <ThemeTextTypography variant="h6" style={{textTransform:"none", color: "tomato", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth:"100%"}}>Hello, {sessionStorage.getItem("name")} <ArrowDropDownIcon style={{verticalAlign: "text-top"}} /></ThemeTextTypography>
            </Button>
            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
              classes={{ paper: classes.menuPaper }}
            >
              <MenuItem onClick={handleClose}><ThemeTextTypography>Profile</ThemeTextTypography></MenuItem>
              <MenuItem onClick={handleClose}><ThemeTextTypography>My account</ThemeTextTypography></MenuItem>
              <MenuItem onClick={() => { sessionStorage.clear(); history.push('/') }}><ThemeTextTypography>Logout</ThemeTextTypography></MenuItem>
            </Menu>

          </Toolbar>
        </AppBar>
      </div>
    );  
} 

export default withStyles(styles)(NavBar);
