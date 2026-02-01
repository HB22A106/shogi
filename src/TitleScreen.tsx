import React from "react";

const TitleScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>将棋ゲーム</h1>
      <p style={{ marginTop: 6 }}>AI詰将棋 や 通常対局 をブラウザで遊べます</p>
      <button style={styles.startButton} onClick={onStart}>
        ゲームスタート
      </button>
      <small style={{ marginTop: 12, color: "#555" }}>
      </small>
    </div>
  );
};

const styles: { [k: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    gap: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  title: { fontSize: 48, margin: 0 },
  startButton: {
    marginTop: 180,
    padding: "12px 28px",
    fontSize: 18,
    cursor: "pointer",
  },
};

export default TitleScreen;
