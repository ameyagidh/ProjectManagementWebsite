import {BrowserRouter as Router,Route,Switch} from 'react-router-dom';
import './App.css';
import Home from "./Home";
import Main from "./Main";
import Login from "./Login";
import ThemeContextProvider from "./contexts/ThemeContext";
import AddRoom from "./AddRoom";
import Logs from "./Logs";

function App() {
  function getProps(data){
    
  }
  const isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

  if(isMobile)
    return <div>Sorry, this website is available only on desktop devices.</div>
  else{
    return (
      <ThemeContextProvider>
            <Router>
              <Switch>
                <Route exact path="/">
                  <Login />
                </Route>
                <Route exact path="/home">
                  <Home getProps={getProps} />
                </Route>
                <Route exact path="/main/:id" component={Main} />
                <Route exact path="/addRoom">
                  <AddRoom />
                </Route>
                <Route exact path="/:id/logs" component={Logs} />
              </Switch>
            </Router>
      </ThemeContextProvider>
    );
  }
}

export default App;
