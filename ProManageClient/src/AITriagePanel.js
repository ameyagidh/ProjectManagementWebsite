import { useContext, useState } from "react";
import axios from "axios";
import { withStyles } from "@material-ui/core/styles";
import { Typography, TextField, Button, CircularProgress } from "@material-ui/core";
import AutoAwesomeIcon from '@material-ui/icons/Star';
import { ThemeContext } from "./contexts/ThemeContext";

const { REACT_APP_BACKEND_URL } = process.env;

const badgeClass = {
  High: "pm-badge pm-badge-high",
  Medium: "pm-badge pm-badge-medium",
  Low: "pm-badge pm-badge-low",
};

/**
 * AI Insights panel - task auto-triage.
 *
 * Sends a task title/description to the ProManageAI microservice
 * (TF-IDF + LinearSVC model, see ProManageAI/train_triage.py) via the
 * Express proxy at POST /ai/triage, and renders the predicted priority.
 * Genuinely runs locally, no API key required.
 */
function AITriagePanel() {
  const { isLightTheme, light, dark } = useContext(ThemeContext);
  const theme = isLightTheme ? light : dark;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ThemeTextTypography = withStyles({ root: { color: theme.text } })(Typography);

  const analyze = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/ai/triage`, { title, description });
      setResult(res.data);
    } catch (e) {
      setError("AI service is offline. Start ProManageAI (uvicorn main:app --port 8001) to try this.");
    }
    setLoading(false);
  };

  return (
    <div
      className="pm-card"
      style={{
        margin: "0 8% 32px 8%",
        padding: "24px",
        backgroundColor: theme.box,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <AutoAwesomeIcon style={{ color: theme.accent }} />
        <ThemeTextTypography variant="h5"><b>AI task triage</b></ThemeTextTypography>
      </div>
      <ThemeTextTypography variant="body2" style={{ color: theme.textNotImp, marginBottom: 16 }}>
        Type a task title and description - a locally trained TF-IDF + LinearSVC model predicts
        its priority instantly, no cloud API required.
      </ThemeTextTypography>
      <TextField
        fullWidth
        variant="outlined"
        label="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginBottom: 12, backgroundColor: theme.input }}
        InputLabelProps={{ style: { color: theme.placeholder } }}
        InputProps={{ style: { color: theme.text } }}
      />
      <TextField
        fullWidth
        variant="outlined"
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ marginBottom: 16, backgroundColor: theme.input }}
        InputLabelProps={{ style: { color: theme.placeholder } }}
        InputProps={{ style: { color: theme.text } }}
      />
      <Button className="pm-gradient-btn" onClick={analyze} disabled={loading || !title.trim()}>
        {loading ? <CircularProgress size={20} style={{ color: "#fff" }} /> : "Analyze priority"}
      </Button>

      {error && (
        <ThemeTextTypography variant="body2" style={{ color: theme.danger, marginTop: 12 }}>
          {error}
        </ThemeTextTypography>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <span className={badgeClass[result.priority]}>{result.priority} priority</span>
          <ThemeTextTypography variant="body2" style={{ color: theme.textNotImp, marginTop: 8 }}>
            Ranked: {result.confidence_rank.join(" > ")} &middot; model: {result.model} &middot;
            held-out accuracy: {(result.holdout_accuracy * 100).toFixed(0)}%
          </ThemeTextTypography>
        </div>
      )}
    </div>
  );
}

export default AITriagePanel;
