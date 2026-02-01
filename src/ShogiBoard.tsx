import React from "react";

type Player = "sente" | "gote";
type PieceType =
  | "歩" | "香" | "桂" | "銀" | "金" | "角" | "飛" | "玉"
  | "と" | "成香" | "成桂" | "成銀" | "馬" | "龍";

type Piece = { type: PieceType; owner: Player };
type Cell = Piece | null;

const promoteMap: Record<string, PieceType> = {
  歩: "と", 香: "成香", 桂: "成桂", 銀: "成銀", 角: "馬", 飛: "龍",
};
const unpromoteMap: Record<string, PieceType> = {
  と: "歩", 成香: "香", 成桂: "桂", 成銀: "銀", 馬: "角", 龍: "飛",
};

const pawnRow = (owner: Player): Cell[] =>
  Array.from({ length: 9 }, () => ({ type: "歩" as PieceType, owner }));

const initialBoard = (): Cell[][] => [
  [
    { type: "香", owner: "gote" },
    { type: "桂", owner: "gote" },
    { type: "銀", owner: "gote" },
    { type: "金", owner: "gote" },
    { type: "玉", owner: "gote" },
    { type: "金", owner: "gote" },
    { type: "銀", owner: "gote" },
    { type: "桂", owner: "gote" },
    { type: "香", owner: "gote" },
  ],
  [null, { type: "飛", owner: "gote" }, null, null, null, null, null, { type: "角", owner: "gote" }, null],
  pawnRow("gote"),
  Array.from({ length: 9 }, () => null),
  Array.from({ length: 9 }, () => null),
  Array.from({ length: 9 }, () => null),
  pawnRow("sente"),
  [null, { type: "角", owner: "sente" }, null, null, null, null, null, { type: "飛", owner: "sente" }, null],
  [
    { type: "香", owner: "sente" },
    { type: "桂", owner: "sente" },
    { type: "銀", owner: "sente" },
    { type: "金", owner: "sente" },
    { type: "玉", owner: "sente" },
    { type: "金", owner: "sente" },
    { type: "銀", owner: "sente" },
    { type: "桂", owner: "sente" },
    { type: "香", owner: "sente" },
  ],
];

const isInside = (x: number, y: number) => x >= 0 && x < 9 && y >= 0 && y < 9;
const inEnemyZone = (y: number, owner: Player) => (owner === "sente" ? y <= 2 : y >= 6);

const deepCopyBoard = (b: Cell[][]): Cell[][] => b.map(r => r.map(c => (c ? { ...c } : null)));

function getMoves(x: number, y: number, piece: Piece, board: Cell[][]): [number, number][] {
  const dir = piece.owner === "sente" ? -1 : 1;
  const moves: [number, number][] = [];
  const addIfValid = (tx: number, ty: number) => {
    if (!isInside(tx, ty)) return false;
    const target = board[ty][tx];
    if (!target || target.owner !== piece.owner) {
      moves.push([tx, ty]);
      return !target;
    }
    return false;
  };

  let t = piece.type;
  if (["と", "成香", "成桂", "成銀"].includes(t)) t = "金";
  if (t === "馬") t = "角";
  if (t === "龍") t = "飛";

  switch (t) {
    case "歩":
      addIfValid(x, y + dir);
      break;
    case "香":
      for (let i = 1; i < 9; i++) if (!addIfValid(x, y + dir * i)) break;
      break;
    case "桂":
      addIfValid(x - 1, y + dir * 2);
      addIfValid(x + 1, y + dir * 2);
      break;
    case "銀":
      for (const [dx, dy] of [
        [0, dir],
        [-1, dir],
        [1, dir],
        [-1, -dir],
        [1, -dir],
      ]) addIfValid(x + dx, y + dy);
      break;
    case "金":
      for (const [dx, dy] of [
        [0, dir],
        [-1, dir],
        [1, dir],
        [0, -dir],
        [-1, 0],
        [1, 0],
      ]) addIfValid(x + dx, y + dy);
      break;
    case "角":
      for (const [dx, dy] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) for (let i = 1; i < 9; i++) if (!addIfValid(x + dx * i, y + dy * i)) break;
      break;
    case "飛":
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) for (let i = 1; i < 9; i++) if (!addIfValid(x + dx * i, y + dy * i)) break;
      break;
    case "玉":
      for (const [dx, dy] of [
        [1, 1],
        [1, 0],
        [1, -1],
        [0, 1],
        [0, -1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
      ]) addIfValid(x + dx, y + dy);
      break;
  }

  if (piece.type === "馬") for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) addIfValid(x + dx, y + dy);
  if (piece.type === "龍") for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) addIfValid(x + dx, y + dy);

  return moves;
}

const capturedBaseType = (p: Piece): PieceType => (unpromoteMap[p.type] as PieceType) ?? p.type;

const checkWinner = (board: Cell[][]): Player | null => {
  let senteKing = false, goteKing = false;
  for (const row of board) for (const c of row) {
    if (c?.type === "玉") {
      if (c.owner === "sente") senteKing = true;
      if (c.owner === "gote") goteKing = true;
    }
  }
  if (!senteKing) return "gote";
  if (!goteKing) return "sente";
  return null;
};

const hasNifu = (board: Cell[][], x: number, owner: Player): boolean => {
    for (let y = 0; y < 9; y++) {
      const c = board[y][x];
      if (c && c.owner === owner && c.type === "歩") {
        return true;
      }
    }
    return false;
  };
  type Move =
  | { kind: "move"; from: { x: number; y: number }; to: { x: number; y: number }; promote: boolean }
  | { kind: "drop"; to: { x: number; y: number }; piece: PieceType; handIndex: number };

const other = (p: Player): Player => (p === "sente" ? "gote" : "sente");

const isLastRank = (y: number, owner: Player) => (owner === "sente" ? y === 0 : y === 8);
const isLastTwoRanks = (y: number, owner: Player) => (owner === "sente" ? y <= 1 : y >= 7);

const isForcedPromote = (pieceType: PieceType, toY: number, owner: Player) => {
  // 本将棋だと歩/香は最終段、桂は最終2段が「不成で行けない」ので強制成り
  if (pieceType === "歩" || pieceType === "香") return isLastRank(toY, owner);
  if (pieceType === "桂") return isLastTwoRanks(toY, owner);
  return false;
};

const canPromote = (pieceType: PieceType) => Boolean(promoteMap[pieceType]);

const pieceValue = (t: PieceType): number => {
  // ざっくり評価（強さ調整しやすい）
  switch (t) {
    case "歩": return 1;
    case "香": return 3;
    case "桂": return 3;
    case "銀": return 4;
    case "金": return 5;
    case "角": return 8;
    case "飛": return 10;
    case "玉": return 10000;
    case "と": return 5;
    case "成香": return 5;
    case "成桂": return 5;
    case "成銀": return 5;
    case "馬": return 9;   // 角+α
    case "龍": return 11;  // 飛+α
    default: return 0;
  }
};

const evaluate = (board: Cell[][], hands: { sente: PieceType[]; gote: PieceType[] }): number => {
  // gote視点：プラスがgote有利、マイナスがsente有利
  let score = 0;

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const c = board[y][x];
      if (!c) continue;
      const v = pieceValue(c.type);

      // 前進ボーナス（軽く）: goteは下へ、senteは上へ進むほど少し加点
      const advance = c.owner === "gote" ? y : (8 - y);
      const advanceBonus = 0.03 * advance;

      score += (c.owner === "gote" ? 1 : -1) * (v + advanceBonus);
    }
  }

  // 持ち駒（少し控えめに加点）
  for (const t of hands.gote) score += 0.8 * pieceValue(t);
  for (const t of hands.sente) score -= 0.8 * pieceValue(t);

  // 手数（軽く）: 動ける方が少し良い
  const gMoves = generateAllMoves("gote", board, hands).length;
  const sMoves = generateAllMoves("sente", board, hands).length;
  score += 0.02 * (gMoves - sMoves);

  return score;
};

function generateAllMoves(player: Player, board: Cell[][], hands: { sente: PieceType[]; gote: PieceType[] }): Move[] {
  const moves: Move[] = [];

  // 盤上の駒の指し手
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    const p = board[y][x];
    if (!p || p.owner !== player) continue;

    const targets = getMoves(x, y, p, board);
    for (const [tx, ty] of targets) {
      const promotable = canPromote(p.type) && (inEnemyZone(y, player) || inEnemyZone(ty, player));

      if (promotable) {
        // 強制成りなら promote:true だけ
        if (isForcedPromote(p.type, ty, player)) {
          moves.push({ kind: "move", from: { x, y }, to: { x: tx, y: ty }, promote: true });
        } else {
          moves.push({ kind: "move", from: { x, y }, to: { x: tx, y: ty }, promote: false });
          moves.push({ kind: "move", from: { x, y }, to: { x: tx, y: ty }, promote: true });
        }
      } else {
        moves.push({ kind: "move", from: { x, y }, to: { x: tx, y: ty }, promote: false });
      }
    }
  }

  // 持ち駒の打ち
  const hand = hands[player];
  for (let i = 0; i < hand.length; i++) {
    const t = hand[i];

    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
      if (board[y][x]) continue;

      // 打てない段の制限（簡略でも入れると“らしく”なる）
      if (t === "歩" && isLastRank(y, player)) continue;
      if (t === "香" && isLastRank(y, player)) continue;
      if (t === "桂" && isLastTwoRanks(y, player)) continue;

      // 二歩
      if (t === "歩" && hasNifu(board, x, player)) continue;

      moves.push({ kind: "drop", to: { x, y }, piece: t, handIndex: i });
    }
  }

  return moves;
}

function applyMove(
    mv: Move,
    player: Player,
    board: Cell[][],
    hands: { sente: PieceType[]; gote: PieceType[] }
  ): { board: Cell[][]; hands: { sente: PieceType[]; gote: PieceType[] }; winner: Player | null } {
    const newBoard = deepCopyBoard(board);
    const newHands = { sente: [...hands.sente], gote: [...hands.gote] };
  
    if (mv.kind === "drop") {
      newBoard[mv.to.y][mv.to.x] = { type: mv.piece, owner: player };
      newHands[player].splice(mv.handIndex, 1);
      return { board: newBoard, hands: newHands, winner: checkWinner(newBoard) };
    }
  
    const moving = newBoard[mv.from.y][mv.from.x];
    if (!moving) return { board, hands, winner: checkWinner(board) };
  
    const target = newBoard[mv.to.y][mv.to.x];
  
    let winner: Player | null = null;
    if (target?.type === "玉") {
      winner = player; // 玉を取ったら勝ち（現状仕様）
    } else if (target) {
      const base = capturedBaseType(target);
      newHands[player].push(base);
    }
  
    let piece: Piece = { ...moving };
    if (mv.promote && promoteMap[piece.type]) piece.type = promoteMap[piece.type];
  
    newBoard[mv.to.y][mv.to.x] = piece;
    newBoard[mv.from.y][mv.from.x] = null;
  
    return { board: newBoard, hands: newHands, winner: winner ?? checkWinner(newBoard) };
  }
  

function chooseAIMove(
  board: Cell[][],
  hands: { sente: PieceType[]; gote: PieceType[] },
  depth = 2
): Move | null {
  // 後手（gote）専用：2手読み（gote→sente）くらいが「アマ初段っぽく」なりやすい
  const rootMoves = generateAllMoves("gote", board, hands);
  if (rootMoves.length === 0) return null;

  let bestScore = -Infinity;
  let scored: { mv: Move; score: number }[] = [];

  for (const mv of rootMoves) {
    const a = applyMove(mv, "gote", board, hands);
    if (a.winner === "gote") {
      scored.push({ mv, score: 999999 });
      continue;
    }

    const score = minimax(a.board, a.hands, "sente", depth - 1);
    scored.push({ mv, score });
    if (score > bestScore) bestScore = score;
  }

  // 上位から少しランダム（毎回同じ手になりにくい＆人間っぽい）
  scored.sort((A, B) => B.score - A.score);
  const topK = Math.min(4, scored.length);
  const pickFrom = scored.slice(0, topK);

  // ほぼ最善寄りにしつつ、僅かにブレる
  const weights = pickFrom.map((s, i) => Math.exp((s.score - pickFrom[0].score) / 1.2) / (1 + i * 0.15));
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < pickFrom.length; i++) {
    r -= weights[i];
    if (r <= 0) return pickFrom[i].mv;
  }
  return pickFrom[0].mv;
}

function minimax(
  board: Cell[][],
  hands: { sente: PieceType[]; gote: PieceType[] },
  turn: Player,
  depth: number
): number {
  const w = checkWinner(board);
  if (w === "gote") return 999999;
  if (w === "sente") return -999999;
  if (depth <= 0) return evaluate(board, hands);

  const moves = generateAllMoves(turn, board, hands);
  if (moves.length === 0) return evaluate(board, hands);

  if (turn === "gote") {
    let best = -Infinity;
    for (const mv of moves) {
      const a = applyMove(mv, "gote", board, hands);
      const sc = minimax(a.board, a.hands, "sente", depth - 1);
      if (sc > best) best = sc;
    }
    return best;
  } else {
    let best = Infinity;
    for (const mv of moves) {
      const a = applyMove(mv, "sente", board, hands);
      const sc = minimax(a.board, a.hands, "gote", depth - 1);
      if (sc < best) best = sc;
    }
    return best;
  }
}


const ShogiBoard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [board, setBoard] = React.useState<Cell[][]>(initialBoard());
  const [selected, setSelected] = React.useState<{ x: number; y: number } | null>(null);
  const [available, setAvailable] = React.useState<[number, number][]>([]);
  const [turn, setTurn] = React.useState<Player>("sente");
  const [hands, setHands] = React.useState<{ sente: PieceType[]; gote: PieceType[] }>({ sente: [], gote: [] });
  const [selectedHand, setSelectedHand] = React.useState<number | null>(null);
  const [winner, setWinner] = React.useState<Player | null>(null);

  const resetGame = () => {
    setBoard(initialBoard());
    setHands({ sente: [], gote: [] });
    setSelected(null);
    setSelectedHand(null);
    setAvailable([]);
    setTurn("sente");
    setWinner(null);
  };
  const commitMove = (mv: Move, player: Player) => {
    const a = applyMove(mv, player, board, hands);
    setBoard(a.board);
    setHands(a.hands);
    setSelected(null);
    setSelectedHand(null);
    setAvailable([]);
    if (a.winner) setWinner(a.winner);
    else setTurn(other(player));
  };

  React.useEffect(() => {
    if (winner) return;
    if (turn !== "gote") return;

    const id = window.setTimeout(() => {
      const mv = chooseAIMove(board, hands, 2); // ←強さ：2手読み
      if (!mv) return;
      commitMove(mv, "gote");
    }, 350); // 少し“考えてる感”

    return () => window.clearTimeout(id);
  }, [turn, winner, board, hands]);


  const handleHandClick = (player: Player, idx: number) => {
    if (winner || player !== turn) return;
    if (turn === "gote") return;
    setSelected(null);
    setAvailable([]);
    setSelectedHand(prev => (prev === idx ? null : idx));
  };

  const handleClick = (x: number, y: number) => {
    if (winner) return;
    if (turn === "gote") return;

    const cell = board[y][x];

    if (selectedHand !== null) {
      if (cell) return;
      const t = hands[turn][selectedHand];
      if (t === "歩" && hasNifu(board, x, turn)) {
        alert(`二歩で${turn === "sente" ? "先手" : "後手"}の負け`);
        setWinner(turn === "sente" ? "gote" : "sente");
        return;
      }
      const newBoard = deepCopyBoard(board);
      newBoard[y][x] = { type: t, owner: turn };
      setBoard(newBoard);
      setHands(prev => {
        const a = [...prev[turn]];
        a.splice(selectedHand, 1);
        return { ...prev, [turn]: a } as typeof prev;
      });
      const w = checkWinner(newBoard);
      if (w) setWinner(w);
      else setTurn(turn === "sente" ? "gote" : "sente");
      setSelectedHand(null);
      setAvailable([]);
      return;
    }

    if (cell && cell.owner === turn) {
      setSelected({ x, y });
      setSelectedHand(null);
      setAvailable(getMoves(x, y, cell, board));
      return;
    }

    if (selected && available.some(([ax, ay]) => ax === x && ay === y)) {
      const newBoard = deepCopyBoard(board);
      const moving = newBoard[selected.y][selected.x];
      const target = newBoard[y][x];
      if (!moving) return;
      let newPiece = { ...moving };
      if (promoteMap[moving.type] && (inEnemyZone(y, moving.owner) || inEnemyZone(selected.y, moving.owner))) {
        if (window.confirm(`${moving.type} を成りますか？`)) {
          newPiece.type = promoteMap[moving.type];
        }
      }
      if (target) {
        if (target.type === "玉") {
          setWinner(turn);
          return;
        }
        const base = capturedBaseType(target);
        setHands(prev => ({ ...prev, [turn]: [...prev[turn], base] }));
      }
      newBoard[y][x] = newPiece;
      newBoard[selected.y][selected.x] = null;
      setBoard(newBoard);
      const w = checkWinner(newBoard);
      if (w) setWinner(w);
      else setTurn(turn === "sente" ? "gote" : "sente");
      setSelected(null);
      setAvailable([]);
    } else {
      setSelected(null);
      setSelectedHand(null);
      setAvailable([]);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: 12 }}>
        <button onClick={onBack}>モード選択に戻る</button>
        <div>
          <button onClick={resetGame} style={{ marginRight: 8 }}>リセット</button>
          <span style={{ marginLeft: 12 }}>{turn === "sente" ? "先手の番" : "後手の番"}</span>
        </div>
      </div>

      {winner && (
        <div style={styles.overlay}>
          <h1>{winner === "sente" ? "先手の勝ち！" : "後手の勝ち！"}</h1>
          <button onClick={resetGame} style={styles.button}>再戦する</button>
        </div>
      )}

      <div style={styles.hands}>
        <h3>後手の持ち駒：</h3>
        {hands.gote.map((t, i) => (
          <span key={i} onClick={() => handleHandClick("gote", i)} style={{
            ...styles.handPiece,
            background: selectedHand === i && turn === "gote" ? "#ffd966" : "#fff",
            cursor: turn === "gote" ? "pointer" : "default",
          }}>
            {t}
          </span>
        ))}
      </div>

      <div style={styles.board}>
        {board.map((row, y) =>
          row.map((cell, x) => {
            const isSelected = selected?.x === x && selected?.y === y;
            const isAvail = available.some(([ax, ay]) => ax === x && ay === y);
            return (
              <div key={`${x}-${y}`} onClick={() => handleClick(x, y)} style={{
                ...styles.cell,
                background: isSelected ? "#ffe07a" : isAvail ? "#fff6b3" : "#f8d36f",
              }}>
                {cell && (
                  <span style={{
                    ...styles.piece,
                    transform: cell.owner === "gote" ? "rotate(180deg)" : "none",
                    color: cell.owner === "gote" ? "#c22" : "#000",
                  }}>
                    {cell.type}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={styles.hands}>
        <h3>先手の持ち駒：</h3>
        {hands.sente.map((t, i) => (
          <span key={i} onClick={() => handleHandClick("sente", i)} style={{
            ...styles.handPiece,
            background: selectedHand === i && turn === "sente" ? "#ffd966" : "#fff",
            cursor: turn === "sente" ? "pointer" : "default",
          }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

const styles: { [k: string]: React.CSSProperties } = {
  container: { display: "flex", flexDirection: "column", alignItems: "center", background: "#f0e5b2", minHeight: "100vh", paddingTop: 20, paddingBottom: 40 },
  board: { display: "grid", gridTemplateColumns: "repeat(9, 60px)", gridTemplateRows: "repeat(9, 60px)", border: "4px solid #a66b00" },
  cell: { width: 60, height: 60, border: "1px solid #a66b00", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" },
  piece: { fontSize: 26, fontWeight: "bold", userSelect: "none" },
  hands: { margin: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 },
  handPiece: { fontSize: 20, border: "1px solid #000", borderRadius: 4, padding: "4px 8px", background: "#fff" },
  overlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 },
  button: { padding: "10px 20px", fontSize: 18, cursor: "pointer" },
};

export default ShogiBoard;
