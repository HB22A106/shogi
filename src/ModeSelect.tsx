import React from "react";

const ModeSelect: React.FC<{
  onChoose: (mode: "shogi" | "tsume") => void;
  onCreate: () => void;
  onCustom: () => void;
  onBack: () => void;
}> = ({ onChoose, onCreate, onCustom, onBack }) => {
  return (
    <div style={styles.container}>
      <h2>遊び方を選んでください</h2>

      <div style={styles.buttons}>
        <button style={styles.modeButton} onClick={() => onChoose("shogi")}>
          将棋（通常対局）
        </button>

        <button style={styles.modeButton} onClick={() => onChoose("tsume")}>
          詰将棋
        </button>

        <button style={styles.modeButton} onClick={onCreate}>
          作成
        </button>

        <button style={styles.modeButton} onClick={onCustom}>
          カスタムルーム
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <button onClick={onBack}>タイトルに戻る</button>
      </div>
    </div>
  );
};

const styles: { [k: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    fontFamily: "sans-serif",
  },
  buttons: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  modeButton: {
    padding: "10px 18px",
    fontSize: 16,
    cursor: "pointer",
  },
};

export default ModeSelect;
