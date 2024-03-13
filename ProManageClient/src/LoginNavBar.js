import React, { useContext } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import {ThemeContext} from './contexts/ThemeContext'
import Brightness4Icon from '@material-ui/icons/Brightness4';
import { useHistory } from 'react-router-dom';
import { withStyles } from "@material-ui/core/styles";

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

function LoginNavBar(props){
    const { isLightTheme, light, dark, toggleTheme } = useContext(ThemeContext);
    const theme = isLightTheme ? light : dark;
    const history = useHistory()

    const ThemeTextTypography = withStyles({
      root: {
        color: theme.text
      }
    })(Typography);

    return (
      <div style={{minHeight: "25%"}}>
        <AppBar style={{ minHeight: "25%", backgroundColor: theme.navbar }} position="static">
          <Toolbar variant="dense" style={{ marginBottom: "1%", marginTop: "1%"}}>
          <ThemeTextTypography  onClick={() => history.push('/')} variant="h5" style={{ fontFamily: "Arial", cursor: "pointer", marginLeft: "7%"}}>
          ProManage
            </ThemeTextTypography>
            <ThemeTextTypography display="inline" onClick={() => history.push('/')} variant="h6" style={{ color: "grey", fontFamily: "Arial", cursor: "pointer", marginLeft:"5px"}}>
                v1
            </ThemeTextTypography>
            <ThemeTextTypography onClick={() => history.push('/')} variant="h5" style={{ fontFamily: "Arial", cursor: "pointer", marginLeft: "25%"}} >
              Home
            </ThemeTextTypography>
            <Brightness4Icon style={{ cursor: "pointer", marginLeft: "5%"}} onClick={() => toggleTheme() }/>
          </Toolbar>
        </AppBar>
      </div>
    );  
} 

export default withStyles(styles)(LoginNavBar);
