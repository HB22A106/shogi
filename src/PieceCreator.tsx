import React, { useEffect, useState } from "react";

/* ===== 型定義 ===== */

type CustomPiece = {
  id: string;
  name: string;
  moves: boolean[][];
};

/* ===== 定数 ===== */

const SIZE = 9;
const CENTER = 4;

/* ===== 空の動き ===== */

const emptyMoves = (): boolean[][] =>
  Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => false)
  );

/* ===== コンポーネント ===== */

const PieceCreator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [name, setName] = useState("");
  const [moves, setMoves] = useState<boolean[][]>(emptyMoves());
  const [savedPieces, setSavedPieces] = useState<CustomPiece[]>([]);
  const [selectedSavedPiece, setSelectedSavedPiece] =
    useState<CustomPiece | null>(null);

  /* ===== 保存済み読み込み ===== */

  const loadPieces = () => {
    const saved: CustomPiece[] = JSON.parse(
      localStorage.getItem("customPieces") || "[]"
    );
    setSavedPieces(saved);
  };

  useEffect(() => {
    loadPieces();
  }, []);

  /* ===== マスクリック ===== */

  const toggleCell = (x: number, y: number) => {
    if (x === CENTER && y === CENTER) return;

    const newMoves = moves.map(row => [...row]);
    newMoves[y][x] = !newMoves[y][x];
    setMoves(newMoves);
  };

  /* ===== 保存 ===== */

  const savePiece = () => {
    if (!name.trim()) {
      alert("駒名を入力してください");
      return;
    }

    const piece: CustomPiece = {
      id: Date.now().toString(),
      name,
      moves,
    };

    const saved: CustomPiece[] = JSON.parse(
      localStorage.getItem("customPieces") || "[]"
    );

    saved.push(piece);
    localStorage.setItem("customPieces", JSON.stringify(saved));

    setName("");
    setMoves(emptyMoves());
    loadPieces();
  };

  /* ===== 削除 ===== */

  const deletePiece = (id: string) => {
    if (!window.confirm("削除しますか？")) return;
    const filtered = savedPieces.filter(p => p.id !== id);
    localStorage.setItem("customPieces", JSON.stringify(filtered));
    setSavedPieces(filtered);
    setSelectedSavedPiece(null);
  };

  /* ===== 描画 ===== */

  return (
    <div style={styles.root}>
      {/* ===== 左 ===== */}
      <div style={styles.left}>
        <h2>駒の作成（盤面クリック）</h2>

        <div style={styles.box}>
          <label>駒の表示文字（2文字まで）</label>
          <input
            maxLength={2}
            value={name}
            onChange={e => setName(e.target.value)}
            style={styles.input}
          />
        </div>

        <div>
          <h3>動き設定（クリック）</h3>
          <div style={styles.board}>
            {Array.from({ length: SIZE * SIZE }).map((_, i) => {
              const x = i % SIZE;
              const y = Math.floor(i / SIZE);
              const isCenter = x === CENTER && y === CENTER;
              const canMove = moves[y][x];

              return (
                <div
                  key={i}
                  onClick={() => toggleCell(x, y)}
                  style={{
                    ...styles.cell,
                    background: isCenter
                      ? "#ffd966"
                      : canMove
                      ? "#fff2a8"
                      : "#f8d36f",
                    cursor: isCenter ? "default" : "pointer",
                  }}
                >
                  {isCenter && (
                    <span style={styles.piece}>{name || "？"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={savePiece}>保存</button>
        <button onClick={onBack}>戻る</button>
      </div>

      {/* ===== 右 ===== */}
      <div style={styles.right}>
        <h3>保存されている駒</h3>

        {savedPieces.map(p => (
          <div
            key={p.id}
            style={{
              ...styles.savedRow,
              background:
                selectedSavedPiece?.id === p.id ? "#eef" : "transparent",
            }}
            onClick={() => setSelectedSavedPiece(p)}
          >
            <strong>{p.name}</strong>
            <button
              onClick={e => {
                e.stopPropagation();
                deletePiece(p.id);
              }}
            >
              削除
            </button>
          </div>
        ))}

        {selectedSavedPiece && (
          <div style={{ marginTop: 12 }}>
            <h4>動きプレビュー</h4>
            <div style={styles.board}>
              {Array.from({ length: SIZE * SIZE }).map((_, i) => {
                const x = i % SIZE;
                const y = Math.floor(i / SIZE);
                const isCenter = x === CENTER && y === CENTER;
                const canMove = selectedSavedPiece.moves[y][x];

                return (
                  <div
                    key={i}
                    style={{
                      ...styles.cell,
                      background: isCenter
                        ? "#ffd966"
                        : canMove
                        ? "#fff2a8"
                        : "#f8d36f",
                    }}
                  >
                    {isCenter && (
                      <span style={styles.piece}>
                        {selectedSavedPiece.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== スタイル ===== */

const styles: { [k: string]: React.CSSProperties } = {
  root: {
    display: "flex",
    gap: 24,
    padding: 20,
  },
  left: {
    width: 360,
  },
  right: {
    width: 260,
    marginTop: 48,
  },
  box: {
    border: "1px solid #aaa",
    padding: 12,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    fontSize: 16,
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(9, 40px)",
    gridTemplateRows: "repeat(9, 40px)",
    border: "3px solid #a66b00",
  },
  cell: {
    width: 40,
    height: 40,
    border: "1px solid #a66b00",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  piece: {
    writingMode: "vertical-rl",
    fontWeight: "bold",
    fontSize: 18,
  },
  savedRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    cursor: "pointer",
  },
};

export default PieceCreator;
