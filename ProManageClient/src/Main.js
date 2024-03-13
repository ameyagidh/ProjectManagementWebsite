import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { withStyles } from "@material-ui/core/styles";
import {
  MenuItem,
  Menu,
  Button,
  TextField,
  Typography,
  Select,
  InputLabel,
} from "@material-ui/core";
import { useContext } from "react";
import { ThemeContext } from "./contexts/ThemeContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import CancelIcon from "@material-ui/icons/Cancel";
import DoneIcon from "@material-ui/icons/Done";
import NavBar from "./NavBar";
import Modal from "react-modal";
import PeopleAltIcon from "@material-ui/icons/PeopleAlt";
import InputAdornment from "@material-ui/core/InputAdornment";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import { useHistory } from "react-router-dom";
import LibraryBooksIcon from "@material-ui/icons/LibraryBooks";
import Snackbar from "@material-ui/core/Snackbar";
import React from "react";
import SendIcon from "@material-ui/icons/Send";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import { v4 as uuidv4 } from "uuid";

var connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const { REACT_APP_BACKEND_URL } = process.env;
const styles = {
  light: {
    color: "black",
    fontSize: "22px",
  },
  dark: {
    color: "white",
    fontSize: "22px",
  },
  snackbar: {
    backgroundColor: "teal",
    color: "white",
    textAlign: "center",
    minHeight: "70%",
  },
  select: {
    fontSize: "20px",
    color: "white",
  },
  icon: {
    fill: "white",
  },
};

const socket = io(`${REACT_APP_BACKEND_URL}/`, connectionOptions);

function Main(props) {
  const history = useHistory();
  const divRef = useRef(null);
  let { id } = useParams();
  const { isLightTheme, light, dark } = useContext(ThemeContext);
  const theme = isLightTheme ? light : dark;
  const { classes } = props;

  const outerModal = {
    modal: {
      backgroundColor: "green",
    },
    overlay: {
      backgroundColor: theme.modalBackground,
    },
    content: {
      width: "40%",
      height: "70%",
      alignContent: "center",
      marginLeft: "28%",
      marginTop: "3%",
      overflow: "auto",
      backgroundColor: theme.modalColor,
      border: "none",
    },
  };

  const [completedValue, setCompletedValue] = useState("");
  const [pendingValue, setPendingValue] = useState("");
  const [activeValue, setActiveValue] = useState("");
  const [pendingData, setPendingData] = useState([]);
  const [activeData, setActiveData] = useState([]);
  const [completedData, setCompletedData] = useState([]);
  const [chatData, setChatData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [refresh, setRefresh] = useState(true);
  const [chatValue, setChatValue] = useState("");
  const [authLevel, setAuthLevel] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isChatBarOpen, setIsChatBarOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [project, setProject] = useState("");
  const [pendingError, setPendingError] = useState("");
  const [activeError, setActiveError] = useState("");
  const [completedError, setCompletedError] = useState("");
  const [changeAuthError, setChangeAuthError] = useState("");
  const [chatError, setChatError] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [priority, setPriority] = useState("Low");
  const [dragName, setDragName] = useState("");
  const [clickedUser, setClickedUser] = useState({});
  const [broadcastMessage, setBroadcastMessage] = useState({});
  const [snackBarMessage, setSnackBarMessage] = useState({});

  const ThemeTextTypography = withStyles({
    root: {
      color: theme.text,
    },
  })(Typography);

  useEffect(() => {
    if (!sessionStorage.getItem("username")) history.push("/");
    else {
      const fetchData = async () => {
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/getPendingData/${id}/${sessionStorage.getItem(
            "username"
          )}`
        );
        if (res.data.msg === "No group found" || !props.location.state)
          history.push("/home");
        else {
          setAuthLevel(res.data.authLevel);
          if (
            props.location.state.newUser &&
            sessionStorage.getItem("roomID") &&
            sessionStorage.getItem("roomID") != id
          )
            socket.emit("new data", {
              data: res.data.data,
              message: `Welcome to the team ${sessionStorage.getItem("name")}`,
            });
          else
            socket.emit("new data", {
              data: res.data.data,
              from: broadcastMessage.from,
              message: broadcastMessage.message,
            });
          sessionStorage.setItem("roomID", id);
          setBroadcastMessage({});
          setRefresh(false);
          socket.on("new data from server", (arg1) => {
            if (
              arg1.data.message &&
              arg1.data.from !== sessionStorage.getItem("name")
            ) {
              setSnackBarMessage({
                ...snackBarMessage,
                from: arg1.data.from,
                message: arg1.data.message,
              });
              setShowSnackbar(true);
            }
            setProject(arg1.data.data);
            const user = arg1.data.data.members.find(
              (member) => member.id === sessionStorage.getItem("username")
            );
            if (!user) history.push("/home");
            else {
              setAuthLevel(user.authLevel);
              setLogsData(arg1.data.data.logs);
              setPendingData(arg1.data.data.pending);
              setActiveData(arg1.data.data.ongoing);
              setCompletedData(arg1.data.data.finsished);
              setChatData(arg1.data.data.chat);
              divRef &&
                divRef.current &&
                divRef.current.scrollIntoView &&
                divRef.current.scrollIntoView({
                  behavior: "smooth",
                  block: "end",
                });
            }
          });
        }
      };
      if (refresh) fetchData();
    }
  }, [refresh]);

  const changeAuthLevel = async (user, level) => {
    if (user === sessionStorage.getItem("username")) {
      setChangeAuthError("Cannot change your own level");
      setTimeout(() => {
        setChangeAuthError("");
      }, 5000);
      return;
    }
    if (authLevel !== "Level X") {
      setChangeAuthError("You dont have required permission");
      setTimeout(() => {
        setChangeAuthError("");
      }, 5000);
      return;
    }
    var dt = new Date();
    var date =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    setBroadcastMessage({
      ...broadcastMessage,
      from: sessionStorage.getItem("name"),
      message: `Changed Auth Level of ${user} to ${level}`,
    });
    await axios.post(`${REACT_APP_BACKEND_URL}/changeAuth`, {
      id,
      user,
      level,
      date,
      from: sessionStorage.getItem("name"),
    });
    setRefresh(true);
  };
  const addPending = async () => {
    if (pendingValue.length === 0) {
      setPendingError("Invalid task entered");
      setTimeout(() => {
        setPendingError("");
      }, 5000);
      return;
    }
    if (authLevel === "Level Z") {
      setPendingError("You dont have required permission");
      setTimeout(() => {
        setPendingError("");
      }, 5000);
      return;
    }
    var dt = new Date();
    var date =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    setBroadcastMessage({
      ...broadcastMessage,
      from: sessionStorage.getItem("name"),
      message: `Added ${pendingValue} into Pending Task`,
    });
    // console.log(uuid());
    const a = await axios.post(`${REACT_APP_BACKEND_URL}/addData`, {
      roomID: id,
      type: "Pending",
      taskID: "hdhd",
      name: pendingValue,
      createdAt: date,
      createdBy: sessionStorage.getItem("name"),
    });
    setRefresh(true);
    setPendingValue("");
  };
  const addCompleted = async () => {
    if (completedValue.length === 0) {
      setCompletedError("Invalid task entered");
      setTimeout(() => {
        setCompletedError("");
      }, 5000);
      return;
    }
    if (authLevel === "Level Z") {
      setCompletedError("You dont have required permission");
      setTimeout(() => {
        setCompletedError("");
      }, 5000);
      return;
    }
    var dt = new Date();
    var date =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    setBroadcastMessage({
      ...broadcastMessage,
      from: sessionStorage.getItem("name"),
      message: `Added ${completedValue} into Completed Task`,
    });
    await axios.post(`${REACT_APP_BACKEND_URL}/addData`, {
      roomID: id,
      type: "Completed",
      taskID: uuidv4(),
      name: completedValue,
      createdAt: date,
      createdBy: sessionStorage.getItem("name"),
      completedAt: date,
    });
    setRefresh(true);
    setCompletedValue("");
  };
  const addActive = async () => {
    if (activeValue.length === 0) {
      setActiveError("Invalid task entered");
      setTimeout(() => {
        setActiveError("");
      }, 5000);
      return;
    }
    if (authLevel === "Level Z") {
      setActiveError("You dont have required permission");
      setTimeout(() => {
        setActiveError("");
      }, 5000);
      return;
    }
    var dt = new Date();
    var date =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    setBroadcastMessage({
      ...broadcastMessage,
      from: sessionStorage.getItem("name"),
      message: `Added ${activeValue} into Active Task`,
    });
    await axios.post(`${REACT_APP_BACKEND_URL}/addData`, {
      roomID: id,
      type: "Active",
      taskID: uuidv4(),
      name: activeValue,
      createdAt: date,
      createdBy: sessionStorage.getItem("name"),
    });
    setRefresh(true);
    setActiveValue("");
  };
  const removeData = async (taskID, type, name) => {
    if (authLevel === "Level Z") {
      if (type === "Pending") {
        setPendingError("You dont have required permission");
        setTimeout(() => {
          setPendingError("");
        }, 5000);
      } else if (type === "Active") {
        setActiveError("You dont have required permission");
        setTimeout(() => {
          setActiveError("");
        }, 5000);
      } else {
        setCompletedError("You dont have required permission");
        setTimeout(() => {
          setCompletedError("");
        }, 5000);
      }
      return;
    }
    if (taskID !== undefined && type !== undefined) {
      var dt = new Date();
      var date =
        dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
      setBroadcastMessage({
        ...broadcastMessage,
        from: sessionStorage.getItem("name"),
        message: `Removed ${name} from ${type} Task`,
      });
      await axios.post(`${REACT_APP_BACKEND_URL}/removeData`, {
        id,
        taskID,
        type,
        name,
        date,
        userID: sessionStorage.getItem("name"),
      });
      setRefresh(true);
    }
  };
  const nextLevel = async (taskID, createdBy, name, createdAt, type) => {
    if (authLevel === "Level Z") {
      if (type === "Pending") {
        setPendingError("You dont have required permission");
        setTimeout(() => {
          setPendingError("");
        }, 5000);
      } else if (type === "Active") {
        setActiveError("You dont have required permission");
        setTimeout(() => {
          setActiveError("");
        }, 5000);
      } else {
        setCompletedError("You dont have required permission");
        setTimeout(() => {
          setCompletedError("");
        }, 5000);
      }
      return;
    }
    var dt = new Date();
    var completedAt =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    if (type === "Active")
      setBroadcastMessage({
        ...broadcastMessage,
        from: sessionStorage.getItem("name"),
        message: `Moved ${name} from Active to Completed Task`,
      });
    else if (type === "Pending")
      setBroadcastMessage({
        ...broadcastMessage,
        from: sessionStorage.getItem("name"),
        message: `Moved ${name} from Pending to Active Task`,
      });
    await axios.post(`${REACT_APP_BACKEND_URL}/nextLevel`, {
      id,
      taskID,
      createdBy,
      name,
      createdAt,
      type,
      completedAt,
      from: sessionStorage.getItem("name"),
    });
    setRefresh(true);
  };
  const addChat = async () => {
    if (chatValue.length === 0) {
      setChatError("Invalid message");
      setTimeout(() => {
        setChatError("");
      }, 5000);
      return;
    }
    if (priority === "High")
      setBroadcastMessage({
        ...broadcastMessage,
        from: sessionStorage.getItem("name"),
        message: `Received High Priority Message from ${sessionStorage.getItem(
          "name"
        )}: ${chatValue}`,
      });

    await axios.post(`${REACT_APP_BACKEND_URL}/addChat`, {
      id,
      text: chatValue,
      fromName: sessionStorage.getItem("name"),
      fromUserName: sessionStorage.getItem("username"),
      chatID: uuidv4(),
      priority,
    });
    setChatValue("");
    setPriority("Low");
    setRefresh(true);
  };
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, droppableId } = result;
    var dt = new Date();
    var date =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    setBroadcastMessage({
      ...broadcastMessage,
      from: sessionStorage.getItem("name"),
      message: `Moved ${dragName} from ${source.droppableId} to ${destination.droppableId} Task`,
    });
    await axios.post(`${REACT_APP_BACKEND_URL}/drag`, {
      source,
      destination,
      draggableId: result.draggableId,
      id,
      date,
      from: sessionStorage.getItem("name"),
    });
    setRefresh(true);
  };
  const handleClick = (event, id, authLevel) => {
    setClickedUser({ ...clickedUser, id, authLevel });
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const blockUser = async (user) => {
    if (user.id === sessionStorage.getItem("username")) {
      setChangeAuthError("Illegal option");
      setTimeout(() => {
        setChangeAuthError("");
      }, 5000);
      return;
    }
    if (authLevel != "Level X") {
      setChangeAuthError("You dont have required permission");
      setTimeout(() => {
        setChangeAuthError("");
      }, 5000);
      return;
    }
    var dt = new Date();
    var date =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    setBroadcastMessage({
      ...broadcastMessage,
      from: sessionStorage.getItem("name"),
      message: `Blocked user ${user.id}`,
    });
    await axios.post(`${REACT_APP_BACKEND_URL}/blockUser/${user.id}/${id}`, {
      date,
      from: sessionStorage.getItem("name"),
    });
    setRefresh(true);
  };
  const removeUser = async (user) => {
    if (user.id === sessionStorage.getItem("username")) {
      setChangeAuthError("Illegal option");
      setTimeout(() => {
        setChangeAuthError("");
      }, 5000);
      return;
    }
    if (authLevel != "Level X") {
      setChangeAuthError("You dont have required permission");
      setTimeout(() => {
        setChangeAuthError("");
      }, 5000);
      return;
    }
    var dt = new Date();
    var date =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    setBroadcastMessage({
      ...broadcastMessage,
      from: sessionStorage.getItem("name"),
      message: `Removed user ${user.id}`,
    });
    const log = `Removed ${sessionStorage.getItem("username")}`;
    await axios.post(
      `${REACT_APP_BACKEND_URL}/removeUser/${user.id}/${id}/${log}`,
      { date, from: sessionStorage.getItem("name") }
    );
    setRefresh(true);
  };
  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
    setSnackBarMessage({});
  };
  const handleChatBarClose = () => {
    setIsChatBarOpen(false);
  };

  const handleChatBarOpen = () => {
    setIsChatBarOpen(true);
  };
  const handleChatBarChange = (e) => {
    setPriority(e.target.value);
  };
  const leaveGroup = async () => {
    var dt = new Date();
    var date =
      dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    const log = `${sessionStorage.getItem("username")} left the group`;
    await axios.post(
      `${REACT_APP_BACKEND_URL}/removeUser/${sessionStorage.getItem(
        "username"
      )}/${id}/${log}`,
      { date, from: sessionStorage.getItem("name") }
    );
    setRefresh(true);
  };

  if (showLogs) {
    history.push({ pathname: `/${id}/logs`, state: { logs: logsData } });
    setShowLogs(false);
  } else if (showModal) {
    return (
      <Modal
        scrollable={true}
        ariaHideApp={false}
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        style={outerModal}
      >
        <div>
          {changeAuthError ? (
            <ThemeTextTypography style={{ color: "red" }}>
              <b>{changeAuthError}</b>
            </ThemeTextTypography>
          ) : null}
          {project.members.map((curr, i) => (
            <div key={i}>
              <ThemeTextTypography
                display="inline"
                style={{ fontFamily: "serif" }}
                variant="h3"
              >
                {curr.name}
              </ThemeTextTypography>
              <div style={{ display: "inline", float: "right" }}>
                <ThemeTextTypography
                  variant="h5"
                  style={{
                    color: "#ed1c00",
                    fontFamily: "fantasy",
                    verticalAlign: "text-top",
                  }}
                  display="inline"
                >
                  {curr.authLevel}
                </ThemeTextTypography>
                <Button
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  onClick={(e) => handleClick(e, curr.id, curr.authLevel)}
                >
                  <DragIndicatorIcon
                    fontSize="large"
                    style={{ color: theme.text }}
                  />
                </Button>
                <Menu
                  id="simple-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleClose}>
                    <Button
                      onClick={() => changeAuthLevel(clickedUser.id, "Level X")}
                    >
                      {clickedUser.authLevel === "Level X" ? (
                        <Typography
                          style={{ color: "#ed1c00", fontFamily: "fantasy" }}
                        >
                          Level X
                        </Typography>
                      ) : (
                        <Typography style={{ fontFamily: "fantasy" }}>
                          Level X
                        </Typography>
                      )}
                    </Button>
                  </MenuItem>
                  <MenuItem onClick={handleClose}>
                    <Button
                      onClick={() => changeAuthLevel(clickedUser.id, "Level Y")}
                    >
                      {clickedUser.authLevel === "Level Y" ? (
                        <Typography
                          style={{ color: "#ed1c00", fontFamily: "fantasy" }}
                        >
                          Level Y
                        </Typography>
                      ) : (
                        <Typography style={{ fontFamily: "fantasy" }}>
                          Level Y
                        </Typography>
                      )}
                    </Button>
                  </MenuItem>
                  <MenuItem onClick={handleClose}>
                    <Button
                      onClick={() => changeAuthLevel(clickedUser.id, "Level Z")}
                    >
                      {clickedUser.authLevel === "Level Z" ? (
                        <Typography
                          style={{ color: "#ed1c00", fontFamily: "fantasy" }}
                        >
                          Level Z
                        </Typography>
                      ) : (
                        <Typography style={{ fontFamily: "fantasy" }}>
                          Level Z
                        </Typography>
                      )}
                    </Button>
                  </MenuItem>
                  <MenuItem onClick={handleClose}>
                    <Button onClick={() => blockUser(clickedUser)}>
                      <Typography style={{ fontFamily: "fantasy" }}>
                        Remove & Block
                      </Typography>
                    </Button>
                  </MenuItem>
                  <MenuItem onClick={handleClose}>
                    <Button onClick={() => removeUser(clickedUser)}>
                      <Typography style={{ fontFamily: "fantasy" }}>
                        Remove
                      </Typography>
                    </Button>
                  </MenuItem>
                </Menu>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    );
  } else {
    return (
      <>
        <NavBar />
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          ContentProps={{
            classes: {
              root: classes.snackbar,
            },
          }}
          open={showSnackbar}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          message={
            <Typography>
              {snackBarMessage.from ? (
                <div>
                  <b>{snackBarMessage.from} :</b> {snackBarMessage.message}
                </div>
              ) : snackBarMessage.message ? (
                snackBarMessage.message
              ) : null}
            </Typography>
          }
        />
        <div
          style={{
            minHeight: "91.9vh",
            paddingTop: "4%",
            backgroundColor: theme.ui,
          }}
        >
          <div style={{ textAlign: "center", marginLeft: "15%" }}>
            <ThemeTextTypography
              display="inline"
              style={{ fontWeight: "bold", fontFamily: "serif", width: "10px" }}
              variant="h3"
            >
              {project.name}
            </ThemeTextTypography>
            <ThemeTextTypography
              style={{ cursor: "pointer" }}
              display="inline"
              onClick={() => {
                navigator.clipboard.writeText(id);
                setShowSnackbar(true);
                setSnackBarMessage({
                  message: "Room ID copied to clipboard !",
                });
              }}
              variant="h4"
            >
              🔗
            </ThemeTextTypography>
            {project.members ? (
              <PeopleAltIcon
                style={{
                  cursor: "pointer",
                  marginLeft: "5%",
                  color: theme.text,
                }}
                fontSize="large"
                onClick={() => setShowModal(true)}
              />
            ) : null}
            <LibraryBooksIcon
              onClick={() => setShowLogs(true)}
              style={{ cursor: "pointer", color: theme.text, marginLeft: "5%" }}
              fontSize="large"
            />
            <Button
              onClick={() => leaveGroup()}
              style={{
                marginRight: "15%",
                float: "right",
                border: "1px solid white",
              }}
            >
              <ThemeTextTypography>
                <ExitToAppIcon />
                <span style={{ verticalAlign: "text-bottom" }}>Leave Team</span>
              </ThemeTextTypography>
            </Button>
          </div>
          <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
            <div class="search-container" style={{ minHeight: "30vh" }}>
              <div
                class="search-item"
                style={{
                  maxHeight: "70vh",
                  minHeight: "70vh",
                  backgroundColor: theme.innerBox,
                }}
              >
                <ThemeTextTypography
                  style={{ fontFamily: "Georgia" }}
                  variant="h4"
                >
                  <b>Pending</b>
                </ThemeTextTypography>
                <TextField
                  label="Add Pending Task"
                  InputLabelProps={{
                    style: { color: theme.placeholder, fontSize: "22px" },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment>
                        <Button
                          style={{
                            marginBottom: "25%",
                            backgroundColor: theme.button,
                            color: theme.text,
                          }}
                          onClick={addPending}
                        >
                          Add
                        </Button>
                      </InputAdornment>
                    ),
                    className: isLightTheme ? classes.light : classes.dark,
                  }}
                  style={{ backgroundColor: theme.input }}
                  type="text"
                  value={pendingValue}
                  onChange={(e) => setPendingValue(e.target.value)}
                />
                {pendingError ? (
                  <ThemeTextTypography style={{ color: "red" }}>
                    <b>{pendingError}</b>
                  </ThemeTextTypography>
                ) : null}
                <div
                  style={{
                    marginTop: "3%",
                    overflowY: "auto",
                    maxHeight: "85%",
                    overflowX: "hidden",
                  }}
                >
                  <Droppable key="Pending" droppableId="Pending">
                    {(provided, snapshot) => {
                      return (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{
                            background: theme.innerBox,
                            padding: 4,
                            width: "100%",
                          }}
                        >
                          {pendingData.map((row, i) => (
                            <div
                              key={i}
                              onClick={setDragName(row.name)}
                              style={{
                                backgroundColor: theme.innerBox,
                                marginBottom: "10px",
                              }}
                            >
                              <Draggable
                                key={row.taskID}
                                draggableId={row.taskID}
                                index={i}
                              >
                                {(provided, snapshot) => {
                                  return (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        userSelect: "none",
                                        padding: 16,
                                        margin: "0 0 0px 0",
                                        minHeight: "50px",
                                        backgroundColor: snapshot.isDragging
                                          ? "#7d7c7c"
                                          : "#545353",
                                        color: "white",
                                        ...provided.draggableProps.style,
                                      }}
                                    >
                                      <ThemeTextTypography
                                        style={{
                                          fontFamily:
                                            "DejaVu Sans Mono, monospace",
                                          float: "left",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          maxWidth: "80%",
                                        }}
                                        variant="h6"
                                        display="inline"
                                      >
                                        {row.name}
                                      </ThemeTextTypography>
                                      <div style={{ float: "right" }}>
                                        <DoneIcon
                                          style={{
                                            cursor: "pointer",
                                            color: theme.text,
                                          }}
                                          onClick={() =>
                                            nextLevel(
                                              row.taskID,
                                              row.createdBy,
                                              row.name,
                                              row.createdAt,
                                              "Pending"
                                            )
                                          }
                                        />
                                        <CancelIcon
                                          style={{
                                            cursor: "pointer",
                                            color: theme.text,
                                          }}
                                          onClick={() =>
                                            removeData(
                                              row.taskID,
                                              "Pending",
                                              row.name
                                            )
                                          }
                                        />
                                      </div>
                                      <br />
                                      <div style={{ marginTop: "5%" }}>
                                        <ThemeTextTypography
                                          style={{
                                            fontFamily:
                                              "DejaVu Sans Mono, monospace",
                                            textAlign: "left",
                                            float: "left",
                                            color: theme.textNotImp,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "59%",
                                          }}
                                          variant="h6"
                                        >
                                          - {row.createdBy}
                                        </ThemeTextTypography>
                                        <ThemeTextTypography
                                          style={{
                                            fontFamily:
                                              "DejaVu Sans Mono, monospace",
                                            textAlign: "right",
                                            float: "right",
                                            color: theme.textNotImp,
                                          }}
                                          variant="h6"
                                        >
                                          {row.createdAt}
                                        </ThemeTextTypography>
                                      </div>
                                    </div>
                                  );
                                }}
                              </Draggable>
                            </div>
                          ))}

                          {provided.placeholder}
                        </div>
                      );
                    }}
                  </Droppable>
                </div>
              </div>
              <div
                class="search-item"
                style={{
                  maxHeight: "70vh",
                  minHeight: "70vh",
                  backgroundColor: theme.innerBox,
                }}
              >
                <ThemeTextTypography
                  style={{ fontFamily: "Georgia" }}
                  variant="h4"
                >
                  <b>Active</b>
                </ThemeTextTypography>
                <TextField
                  label="Add Active Task"
                  InputLabelProps={{
                    style: { color: theme.placeholder, fontSize: "22px" },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment>
                        <Button
                          style={{
                            marginBottom: "25%",
                            backgroundColor: theme.button,
                            color: theme.text,
                          }}
                          onClick={addActive}
                        >
                          Add
                        </Button>
                      </InputAdornment>
                    ),
                    className: isLightTheme ? classes.light : classes.dark,
                  }}
                  style={{ backgroundColor: theme.input }}
                  type="text"
                  value={activeValue}
                  onChange={(e) => setActiveValue(e.target.value)}
                />
                {activeError ? (
                  <ThemeTextTypography style={{ color: "red" }}>
                    <b>{activeError}</b>
                  </ThemeTextTypography>
                ) : null}
                <div
                  style={{
                    marginTop: "3%",
                    overflowY: "auto",
                    maxHeight: "85%",
                    overflowX: "hidden",
                  }}
                >
                  <Droppable key="Active" droppableId="Active">
                    {(provided, snapshot) => {
                      return (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{
                            background: theme.innerBox,
                            padding: 4,
                            width: "100%",
                          }}
                        >
                          {activeData.map((row, i) => (
                            <div
                              key={i}
                              onClick={setDragName(row.name)}
                              style={{
                                backgroundColor: theme.innerBox,
                                marginBottom: "10px",
                              }}
                            >
                              <Draggable
                                key={row.taskID}
                                draggableId={row.taskID}
                                index={i}
                              >
                                {(provided, snapshot) => {
                                  return (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        userSelect: "none",
                                        padding: 16,
                                        margin: "0 0 0px 0",
                                        minHeight: "50px",
                                        backgroundColor: snapshot.isDragging
                                          ? "#7d7c7c"
                                          : "#545353",
                                        color: "white",
                                        ...provided.draggableProps.style,
                                      }}
                                    >
                                      <ThemeTextTypography
                                        style={{
                                          fontFamily:
                                            "DejaVu Sans Mono, monospace",
                                          float: "left",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          maxWidth: "80%",
                                        }}
                                        variant="h6"
                                        display="inline"
                                      >
                                        {row.name}
                                      </ThemeTextTypography>
                                      <div style={{ float: "right" }}>
                                        <DoneIcon
                                          style={{
                                            cursor: "pointer",
                                            color: theme.text,
                                          }}
                                          onClick={() =>
                                            nextLevel(
                                              row.taskID,
                                              row.createdBy,
                                              row.name,
                                              row.createdAt,
                                              "Active"
                                            )
                                          }
                                        />
                                        <CancelIcon
                                          style={{
                                            cursor: "pointer",
                                            color: theme.text,
                                          }}
                                          onClick={() =>
                                            removeData(
                                              row.taskID,
                                              "Active",
                                              row.name
                                            )
                                          }
                                        />
                                      </div>
                                      <br />
                                      <div style={{ marginTop: "5%" }}>
                                        <ThemeTextTypography
                                          style={{
                                            fontFamily:
                                              "DejaVu Sans Mono, monospace",
                                            textAlign: "left",
                                            float: "left",
                                            color: theme.textNotImp,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "59%",
                                          }}
                                          variant="h6"
                                        >
                                          - {row.createdBy}
                                        </ThemeTextTypography>
                                        <ThemeTextTypography
                                          style={{
                                            fontFamily:
                                              "DejaVu Sans Mono, monospace",
                                            textAlign: "right",
                                            float: "right",
                                            color: theme.textNotImp,
                                          }}
                                          variant="h6"
                                        >
                                          {row.createdAt}
                                        </ThemeTextTypography>
                                      </div>
                                    </div>
                                  );
                                }}
                              </Draggable>
                            </div>
                          ))}

                          {provided.placeholder}
                        </div>
                      );
                    }}
                  </Droppable>
                </div>
              </div>
              <div
                class="search-item"
                style={{
                  maxHeight: "70vh",
                  minHeight: "70vh",
                  backgroundColor: theme.innerBox,
                }}
              >
                <ThemeTextTypography
                  style={{ fontFamily: "Georgia" }}
                  variant="h4"
                >
                  <b>Completed</b>
                </ThemeTextTypography>
                <TextField
                  label="Add Completed Task"
                  InputLabelProps={{
                    style: { color: theme.placeholder, fontSize: "22px" },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment>
                        <Button
                          style={{
                            marginBottom: "25%",
                            backgroundColor: theme.button,
                            color: theme.text,
                          }}
                          onClick={addCompleted}
                        >
                          Add
                        </Button>
                      </InputAdornment>
                    ),
                    className: isLightTheme ? classes.light : classes.dark,
                  }}
                  style={{ backgroundColor: theme.input }}
                  type="text"
                  value={completedValue}
                  onChange={(e) => setCompletedValue(e.target.value)}
                />
                {completedError ? (
                  <ThemeTextTypography style={{ color: "red" }}>
                    <b>{completedError}</b>
                  </ThemeTextTypography>
                ) : null}
                <div
                  style={{
                    marginTop: "3%",
                    overflowY: "auto",
                    maxHeight: "85%",
                    overflowX: "hidden",
                  }}
                >
                  <Droppable key="Completed" droppableId="Completed">
                    {(provided, snapshot) => {
                      return (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{
                            background: theme.innerBox,
                            padding: 4,
                            width: "100%",
                          }}
                        >
                          {completedData.map((row, i) => (
                            <div
                              onClick={setDragName(row.name)}
                              key={i}
                              style={{
                                backgroundColor: theme.innerBox,
                                marginBottom: "10px",
                              }}
                            >
                              <Draggable
                                key={row.taskID}
                                draggableId={row.taskID}
                                index={i}
                              >
                                {(provided, snapshot) => {
                                  return (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        userSelect: "none",
                                        padding: 16,
                                        margin: "0 0 0px 0",
                                        minHeight: "50px",
                                        backgroundColor: snapshot.isDragging
                                          ? "#7d7c7c"
                                          : "#545353",
                                        color: "white",
                                        ...provided.draggableProps.style,
                                      }}
                                    >
                                      <ThemeTextTypography
                                        style={{
                                          fontFamily:
                                            "DejaVu Sans Mono, monospace",
                                          float: "left",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          maxWidth: "80%",
                                        }}
                                        variant="h6"
                                        display="inline"
                                      >
                                        {row.name}
                                      </ThemeTextTypography>
                                      <div style={{ float: "right" }}>
                                        <CancelIcon
                                          style={{
                                            cursor: "pointer",
                                            color: theme.text,
                                          }}
                                          onClick={() =>
                                            removeData(
                                              row.taskID,
                                              "Completed",
                                              row.name
                                            )
                                          }
                                        />
                                      </div>
                                      <br />
                                      <div style={{ marginTop: "5%" }}>
                                        <ThemeTextTypography
                                          style={{
                                            fontFamily:
                                              "DejaVu Sans Mono, monospace",
                                            textAlign: "left",
                                            float: "left",
                                            color: theme.textNotImp,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "59%",
                                          }}
                                          variant="h6"
                                        >
                                          - {row.createdBy}
                                        </ThemeTextTypography>
                                        <ThemeTextTypography
                                          style={{
                                            fontFamily:
                                              "DejaVu Sans Mono, monospace",
                                            textAlign: "right",
                                            float: "right",
                                            color: theme.textNotImp,
                                          }}
                                          variant="h6"
                                        >
                                          {row.createdAt}
                                        </ThemeTextTypography>
                                      </div>
                                    </div>
                                  );
                                }}
                              </Draggable>
                            </div>
                          ))}

                          {provided.placeholder}
                        </div>
                      );
                    }}
                  </Droppable>
                </div>
              </div>

              <div
                style={{
                  minWidth: "24%",
                  maxHeight: "50vh",
                  minHeight: "50vh",
                  marginLeft: "7%",
                  marginRight: "3%",
                  backgroundColor: theme.innerBox,
                }}
                class="search-item"
              >
                <ThemeTextTypography
                  style={{ fontFamily: "Georgia" }}
                  variant="h4"
                >
                  <b>Chat</b>
                </ThemeTextTypography>
                {chatError ? (
                  <ThemeTextTypography style={{ color: "red" }}>
                    <b>{chatError}</b>
                  </ThemeTextTypography>
                ) : null}
                <div
                  style={{
                    overflowY: "auto",
                    maxHeight: "80%",
                    overflowX: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {chatData.length > 0 &&
                    chatData.map((row, idx) => (
                      <div key={idx} style={{ textAlign: "left" }}>
                        {row.priority === "High" ? (
                          <ThemeTextTypography
                            style={{ fontFamily: "Georgia", color: "#f5190a" }}
                            variant="h6"
                            display="inline"
                          >
                            <b>{row.from} : </b>
                          </ThemeTextTypography>
                        ) : (
                          <ThemeTextTypography
                            style={{ fontFamily: "Georgia", color: "#06d64f" }}
                            variant="h6"
                            display="inline"
                          >
                            <b>{row.from} : </b>
                          </ThemeTextTypography>
                        )}
                        <ThemeTextTypography
                          style={{ fontFamily: "DejaVu Sans Mono, monospace" }}
                          variant="h6"
                          display="inline"
                        >
                          {row.text}
                        </ThemeTextTypography>
                      </div>
                    ))}
                  <div ref={divRef} className="list-bottom"></div>
                </div>
                <TextField
                  label="Type Your Message"
                  multiline
                  rowsMax={2}
                  type="text"
                  InputLabelProps={{
                    style: { color: theme.placeholder, fontSize: "22px" },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment>
                        <div className="outer">
                          <div className="top">
                            {chatValue.length > 0 ? (
                              <Select
                                className={classes.select}
                                inputProps={{ classes: { icon: classes.icon } }}
                                open={isChatBarOpen}
                                onClose={handleChatBarClose}
                                onOpen={handleChatBarOpen}
                                onChange={handleChatBarChange}
                                value={priority}
                              >
                                <MenuItem value={"Low"}>Low</MenuItem>{" "}
                                <MenuItem value={"High"}>High</MenuItem>
                              </Select>
                            ) : null}
                          </div>
                          <div className="below">
                            <SendIcon
                              style={{
                                marginBottom: "50%",
                                height: "35px",
                                cursor: "pointer",
                                color: theme.text,
                              }}
                              onClick={addChat}
                            />
                          </div>
                        </div>
                      </InputAdornment>
                    ),
                    className: isLightTheme ? classes.light : classes.dark,
                  }}
                  style={{
                    position: "fixed",
                    bottom: "27%",
                    right: "3%",
                    width: "25.3%",
                    backgroundColor: theme.input,
                  }}
                  value={chatValue}
                  onChange={(e) => setChatValue(e.target.value)}
                />
              </div>
            </div>
          </DragDropContext>
        </div>
      </>
    );
  }
}

export default withStyles(styles)(Main);
