import { Typography } from "@material-ui/core";
import { useContext } from "react";
import {ThemeContext} from './contexts/ThemeContext'
import { withStyles } from "@material-ui/core/styles";
import NavBar from "./NavBar";
import { useState } from "react";


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

function Logs(props) {
    
    const { isLightTheme, light, dark } = useContext(ThemeContext);
    const theme = isLightTheme ? light : dark;

    const [logs, setLogs] = useState(props.location.state.logs);

    const ThemeTextTypography = withStyles({
        root: {
          color: theme.text, 
          display: "inline"
        }
    })(Typography);

    return(
        <div>
            <NavBar />
            <div className="App" style={{ minHeight: "100vh", maxHeight:"auto", width: "100%", backgroundColor: theme.ui}}>
                <div style={{ paddingBottom: "1%", paddingTop: "5%", marginLeft:"20%", marginRight:"20%", textAlign: "left"}}>
                    {logs.map((row) => (
                        <div style={{ backgroundColor: "#292828", minHeight: "60px", paddingTop: "15px", paddingLeft:"2%", marginBottom: "2%"}}>
                            <ThemeTextTypography>{row.name}</ThemeTextTypography><br />
                            <ThemeTextTypography>- {row.from}</ThemeTextTypography>
                            <ThemeTextTypography style={{color:"grey", marginLeft:"1%"}}>{row.date}</ThemeTextTypography>
                        </div>
                    ))}
                </div>
                
            </div>
        </div>
    )
}

export default withStyles(styles)(Logs);