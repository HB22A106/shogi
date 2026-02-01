import React, { useEffect, useRef, useState } from "react";

/* ===== 型 ===== */
type Player = "sente" | "gote";

type PieceType =
  | "歩" | "香" | "桂" | "銀" | "金" | "角" | "飛" | "玉"
  | "と" | "成香" | "成桂" | "成銀" | "馬" | "龍"
  | string;

type Piece = { type: PieceType; owner: Player };
type Cell = Piece | null;

type CustomPiece = {
  id: string;
  name: string;
  moves: boolean[][];
};

type Move =
  | { kind: "move"; from: { x: number; y: number }; to: { x: number; y: number }; promote: boolean }
  | { kind: "drop"; to: { x: number; y: number }; piece: PieceType; handIndex: number };

/* ===== 定数 ===== */
const SIZE = 9;
const CENTER = 4;

const TOPBAR_H = 30;
const DRAWER_OPEN_H = 90;
const DRAWER_HANDLE_H = 30;

const BASE_PIECES: PieceType[] = [
  "歩","香","桂","銀","金","角","飛","玉",
  "と","成香","成桂","成銀","馬","龍",
];

const promoteMap: Record<string, PieceType> = {
  歩: "と",
  香: "成香",
  桂: "成桂",
  銀: "成銀",
  角: "馬",
  飛: "龍",
};

const unpromoteMap: Record<string, PieceType> = {
  と: "歩",
  成香: "香",
  成桂: "桂",
  成銀: "銀",
  馬: "角",
  龍: "飛",
};

/* =========================
   ★ 強さ＆軽さの調整はここだけ ★
   ========================= */
// 1手あたりの思考時間（ms）: 大きいほど強いが重い
const AI_TIME_MS = 2000;     // 60〜140が目安（スマホなら60〜90推奨）

// ルートで読む手の数: 大きいほど強いが重い
const ROOT_WIDTH = 1200;     // 12〜24

// 途中ノードで読む手の数: 大きいほど強いが重い
const NODE_WIDTH = 1000;     // 7〜14

// 反復深化の最大深さ: 高いほど強いが「局面によって」重くなる
const MAX_DEPTH = 1000;       // 5〜8推奨

// AIが打つまでの“間”（演出）ms
const AI_DELAY_MS = 120;

/* ===== ユーティリティ ===== */
const emptyBoard = (): Cell[][] =>
  Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));

const inside = (x: number, y: number) => x >= 0 && x < SIZE && y >= 0 && y < SIZE;

const inEnemyZone = (y: number, owner: Player) => (owner === "sente" ? y <= 2 : y >= 6);

const other = (p: Player): Player => (p === "sente" ? "gote" : "sente");

const deepCopyBoard = (b: Cell[][]): Cell[][] =>
  b.map(r => r.map(c => (c ? { ...c } : null)));

const hasNifu = (board: Cell[][], x: number, owner: Player): boolean => {
  for (let y = 0; y < SIZE; y++) {
    const c = board[y][x];
    if (c && c.owner === owner && c.type === "歩") return true;
  }
  return false;
};

const isLastRank = (y: number, owner: Player) => (owner === "sente" ? y === 0 : y === 8);
const isLastTwoRanks = (y: number, owner: Player) => (owner === "sente" ? y <= 1 : y >= 7);

const canPromote = (t: PieceType) => Boolean(promoteMap[t]);

const isForcedPromote = (pieceType: PieceType, toY: number, owner: Player) => {
  if (pieceType === "歩" || pieceType === "香") return isLastRank(toY, owner);
  if (pieceType === "桂") return isLastTwoRanks(toY, owner);
  return false;
};

const capturedBaseType = (t: PieceType): PieceType => (unpromoteMap[t] as PieceType) ?? t;

const canDropHere = (t: PieceType, x: number, y: number, owner: Player, b: Cell[][]) => {
  if (b[y][x]) return false;
  if (t === "歩" && hasNifu(b, x, owner)) return false;
  if (t === "歩" && isLastRank(y, owner)) return false;
  if (t === "香" && isLastRank(y, owner)) return false;
  if (t === "桂" && isLastTwoRanks(y, owner)) return false;
  return true;
};

/* ===== コンポーネント ===== */
const CustomRoom: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard());
  const [phase, setPhase] = useState<"edit" | "play">("edit");
  const [turn, setTurn] = useState<Player>("sente");

  const [pieceList, setPieceList] = useState<PieceType[]>(BASE_PIECES);
  const customMapRef = useRef<Record<string, CustomPiece>>({});

  const [selectedPiece, setSelectedPiece] = useState<PieceType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [available, setAvailable] = useState<[number, number][]>([]);

  const [hands, setHands] = useState<{ sente: PieceType[]; gote: PieceType[] }>({
    sente: [],
    gote: [],
  });
  const [selectedHand, setSelectedHand] = useState<number | null>(null);

  const [aiThinking, setAiThinking] = useState(false);

  const resetToEdit = (msg?: string) => {
    if (msg) alert(msg);
    setPhase("edit");
    setBoard(emptyBoard());
    setHands({ sente: [], gote: [] });
    setSelected(null);
    setAvailable([]);
    setSelectedHand(null);
    setSelectedPiece(null);
    setTurn("sente");
    setDrawerOpen(true);
    setAiThinking(false);
  };

  /* ===== カスタム駒読込 ===== */
  useEffect(() => {
    const saved: CustomPiece[] = JSON.parse(localStorage.getItem("customPieces") || "[]");
    const map: Record<string, CustomPiece> = {};
    saved.forEach(p => (map[p.name] = p));
    customMapRef.current = map;
    setPieceList([...BASE_PIECES, ...saved.map(p => p.name)]);
  }, []);

  /* ===== 指し手（探索にもUIにも使えるよう b を使う） ===== */
  const getMovesOnBoard = (x: number, y: number, p: Piece, b: Cell[][]): [number, number][] => {
    const def = customMapRef.current[p.type];
    if (def) {
      const dir = p.owner === "sente" ? -1 : 1;
      const res: [number, number][] = [];
      def.moves.forEach((row, my) =>
        row.forEach((can, mx) => {
          if (!can || (mx === CENTER && my === CENTER)) return;
          const tx = x + (mx - CENTER);
          const ty = y + (my - CENTER) * dir;
          if (!inside(tx, ty)) return;
          const t = b[ty][tx];
          if (!t || t.owner !== p.owner) res.push([tx, ty]);
        })
      );
      return res;
    }

    const dir = p.owner === "sente" ? -1 : 1;
    const res: [number, number][] = [];
    const add = (tx: number, ty: number) => {
      if (!inside(tx, ty)) return false;
      const t = b[ty][tx];
      if (!t || t.owner !== p.owner) {
        res.push([tx, ty]);
        return !t;
      }
      return false;
    };

    let t = p.type;
    if (["と","成香","成桂","成銀"].includes(t)) t = "金";
    if (t === "馬") t = "角";
    if (t === "龍") t = "飛";

    switch (t) {
      case "歩": add(x, y + dir); break;
      case "香": for (let i = 1; i < SIZE; i++) if (!add(x, y + dir * i)) break; break;
      case "桂": add(x - 1, y + dir * 2); add(x + 1, y + dir * 2); break;
      case "銀": [[0,dir],[-1,dir],[1,dir],[-1,-dir],[1,-dir]].forEach(([dx,dy])=>add(x+dx,y+dy)); break;
      case "金": [[0,dir],[-1,dir],[1,dir],[0,-dir],[-1,0],[1,0]].forEach(([dx,dy])=>add(x+dx,y+dy)); break;
      case "角":
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx,dy])=>{
          for (let i=1;i<SIZE;i++) if(!add(x+dx*i,y+dy*i)) break;
        });
        break;
      case "飛":
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
          for (let i=1;i<SIZE;i++) if(!add(x+dx*i,y+dy*i)) break;
        });
        break;
      case "玉":
        [[1,1],[1,0],[1,-1],[0,1],[0,-1],[-1,1],[-1,0],[-1,-1]].forEach(([dx,dy])=>add(x+dx,y+dy));
        break;
    }

    if (p.type === "馬") [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>add(x+dx,y+dy));
    if (p.type === "龍") [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx,dy])=>add(x+dx,y+dy));

    return res;
  };

  /* =========================
     AI（後手）
     ========================= */

  const kingPos = (b: Cell[][], owner: Player): { x: number; y: number } | null => {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const c = b[y][x];
      if (c && c.owner === owner && c.type === "玉") return { x, y };
    }
    return null;
  };

  const pieceValue = (t: PieceType): number => {
    switch (t) {
      case "歩": return 1;
      case "香": return 3;
      case "桂": return 3;
      case "銀": return 4;
      case "金": return 5;
      case "角": return 8;
      case "飛": return 10;
      case "玉": return 10000;
      case "と": return 6;
      case "成香": return 6;
      case "成桂": return 6;
      case "成銀": return 6;
      case "馬": return 10;
      case "龍": return 12;
      default: {
        // カスタム駒：移動可能数から推定（強めに評価）
        const def = customMapRef.current[t];
        if (!def) return 5;
        const mobility = def.moves.flat().filter(Boolean).length - 1; // 中心除外
        return 4 + mobility * 0.35;
      }
    }
  };

  const evaluate = (b: Cell[][], h: typeof hands): number => {
    // gote視点：+ が有利
    let score = 0;
    const gKing = kingPos(b, "gote");
    const sKing = kingPos(b, "sente");

    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const c = b[y][x];
      if (!c) continue;

      const v = pieceValue(c.type);

      // 前進ボーナス
      const advance = c.owner === "gote" ? y : (8 - y);
      const advanceBonus = 0.08 * advance;

      // 王に近い駒を少し評価
      let kingBonus = 0;
      if (c.owner === "gote" && sKing) {
        const d = Math.abs(x - sKing.x) + Math.abs(y - sKing.y);
        kingBonus = (12 - Math.min(12, d)) * 0.05;
      } else if (c.owner === "sente" && gKing) {
        const d = Math.abs(x - gKing.x) + Math.abs(y - gKing.y);
        kingBonus = (12 - Math.min(12, d)) * 0.05;
      }

      score += (c.owner === "gote" ? 1 : -1) * (v + advanceBonus + kingBonus);
    }

    // 持ち駒（少し強め）
    for (const t of h.gote) score += 1.0 * pieceValue(t);
    for (const t of h.sente) score -= 1.0 * pieceValue(t);

    return score;
  };

  const applyMoveAI = (
    mv: Move,
    player: Player,
    b: Cell[][],
    h: typeof hands
  ): { board: Cell[][]; hands: typeof hands; winner: Player | null } => {
    const nb = deepCopyBoard(b);
    const nh = { sente: [...h.sente], gote: [...h.gote] };

    if (mv.kind === "drop") {
      nb[mv.to.y][mv.to.x] = { type: mv.piece, owner: player };
      nh[player].splice(mv.handIndex, 1);
      return { board: nb, hands: nh, winner: null };
    }

    const moving = nb[mv.from.y][mv.from.x];
    if (!moving) return { board: b, hands: h, winner: null };

    const target = nb[mv.to.y][mv.to.x];

    let winner: Player | null = null;
    if (target?.type === "玉") {
      winner = player;
    } else if (target) {
      nh[player].push(capturedBaseType(target.type));
    }

    let piece: Piece = { ...moving };
    if (mv.promote && promoteMap[piece.type]) piece.type = promoteMap[piece.type];

    nb[mv.to.y][mv.to.x] = piece;
    nb[mv.from.y][mv.from.x] = null;

    return { board: nb, hands: nh, winner };
  };

  const generateAllMoves = (player: Player, b: Cell[][], h: typeof hands): Move[] => {
    const moves: Move[] = [];

    // 盤上の手
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const p = b[y][x];
      if (!p || p.owner !== player) continue;

      const targets = getMovesOnBoard(x, y, p, b);
      for (const [tx, ty] of targets) {
        const promotable =
          canPromote(p.type) && (inEnemyZone(y, player) || inEnemyZone(ty, player));

        if (promotable) {
          if (isForcedPromote(p.type, ty, player)) {
            moves.push({ kind: "move", from: { x, y }, to: { x: tx, y: ty }, promote: true });
          } else {
            // 先に「成り」を入れる（読みの効率が上がりやすい）
            moves.push({ kind: "move", from: { x, y }, to: { x: tx, y: ty }, promote: true });
            moves.push({ kind: "move", from: { x, y }, to: { x: tx, y: ty }, promote: false });
          }
        } else {
          moves.push({ kind: "move", from: { x, y }, to: { x: tx, y: ty }, promote: false });
        }
      }
    }

    // 持ち駒
    const handArr = h[player];
    for (let i = 0; i < handArr.length; i++) {
      const t = handArr[i];
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (!canDropHere(t, x, y, player, b)) continue;
        moves.push({ kind: "drop", to: { x, y }, piece: t, handIndex: i });
      }
    }

    return moves;
  };

  const moveHeuristic = (mv: Move, player: Player, b: Cell[][]): number => {
    // 大きいほど先に読む
    if (mv.kind === "drop") {
      let s = 0;
      const targetKing = kingPos(b, player === "gote" ? "sente" : "gote");
      if (targetKing) {
        const d = Math.abs(mv.to.x - targetKing.x) + Math.abs(mv.to.y - targetKing.y);
        s += (10 - Math.min(10, d)) * 2;
      }
      s += (4 - Math.abs(mv.to.x - 4)) * 0.5; // 中央寄り
      s += pieceValue(mv.piece) * 0.2;
      return s;
    }

    const to = b[mv.to.y][mv.to.x];
    let s = 0;

    if (to?.type === "玉") return 999999;
    if (to) s += 80 + pieceValue(to.type) * 10; // 駒取り
    if (mv.promote) s += 20;

    return s;
  };

  // 局面キャッシュ
  const ttRef = useRef<Map<string, { depth: number; score: number }>>(new Map());

  const posKey = (b: Cell[][], h: typeof hands, t: Player) => {
    let s = t + "|";
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const c = b[y][x];
        if (!c) s += ".";
        else s += c.owner[0] + c.type + ",";
      }
      s += "/";
    }
    // 持ち駒も入れる（順序ぶれ防止）
    const sg = [...h.sente].sort().join(",");
    const gg = [...h.gote].sort().join(",");
    s += `|S:${sg}|G:${gg}`;
    return s;
  };

  const limitMoves = (moves: Move[], player: Player, b: Cell[][], limit: number) => {
    moves.sort((A, B) => moveHeuristic(B, player, b) - moveHeuristic(A, player, b));
    return moves.slice(0, Math.max(1, Math.min(limit, moves.length)));
  };

  const alphaBetaTimed = (
    b: Cell[][],
    h: typeof hands,
    t: Player,
    depth: number,
    alpha: number,
    beta: number,
    deadline: number
  ): number => {
    if (performance.now() > deadline) throw new Error("TIME");
    if (depth <= 0) return evaluate(b, h);

    const key = posKey(b, h, t);
    const cached = ttRef.current.get(key);
    if (cached && cached.depth >= depth) return cached.score;

    let moves = generateAllMoves(t, b, h);
    if (moves.length === 0) return evaluate(b, h);

    moves = limitMoves(moves, t, b, NODE_WIDTH);

    let best: number;

    if (t === "gote") {
      best = -Infinity;
      for (const mv of moves) {
        const a = applyMoveAI(mv, "gote", b, h);
        if (a.winner === "gote") { best = 999999; break; }

        const sc = alphaBetaTimed(a.board, a.hands, "sente", depth - 1, alpha, beta, deadline);
        if (sc > best) best = sc;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
    } else {
      best = Infinity;
      for (const mv of moves) {
        const a = applyMoveAI(mv, "sente", b, h);
        if (a.winner === "sente") { best = -999999; break; }

        const sc = alphaBetaTimed(a.board, a.hands, "gote", depth - 1, alpha, beta, deadline);
        if (sc < best) best = sc;
        if (best < beta) beta = best;
        if (alpha >= beta) break;
      }
    }

    ttRef.current.set(key, { depth, score: best });
    return best;
  };

  const chooseAIMoveTimed = (b: Cell[][], h: typeof hands): Move | null => {
    ttRef.current.clear();
    const deadline = performance.now() + AI_TIME_MS;

    let root = generateAllMoves("gote", b, h);
    if (root.length === 0) return null;

    root = limitMoves(root, "gote", b, ROOT_WIDTH);

    let bestMove = root[0];
    let bestScore = -Infinity;

    // 反復深化：時間がある限り深く読む
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      try {
        let localBestMove = bestMove;
        let localBestScore = -Infinity;

        for (const mv of root) {
          if (performance.now() > deadline) throw new Error("TIME");

          const a = applyMoveAI(mv, "gote", b, h);
          const sc =
            a.winner === "gote"
              ? 999999
              : alphaBetaTimed(a.board, a.hands, "sente", depth - 1, -Infinity, Infinity, deadline);

          if (sc > localBestScore) {
            localBestScore = sc;
            localBestMove = mv;
          }
        }

        bestMove = localBestMove;
        bestScore = localBestScore;
      } catch {
        break; // 時間切れ
      }
    }

    // bestScore未使用でもOK（デバッグ用に残している）
    void bestScore;
    return bestMove ?? null;
  };

  // ★ 後手AI：後手の番になったら自動で1手指す
  useEffect(() => {
    if (phase !== "play") return;
    if (turn !== "gote") return;

    setAiThinking(true);

    const id = window.setTimeout(() => {
      try {
        const mv = chooseAIMoveTimed(board, hands);
        if (!mv) {
          resetToEdit("後手の指し手がありません");
          return;
        }

        const a = applyMoveAI(mv, "gote", board, hands);

        setBoard(a.board);
        setHands(a.hands);
        setSelected(null);
        setAvailable([]);
        setSelectedHand(null);

        if (a.winner === "gote") {
          resetToEdit("後手の勝ち");
          return;
        }

        setTurn("sente");
      } finally {
        setAiThinking(false);
      }
    }, AI_DELAY_MS);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turn, board, hands]);

  /* ===== 盤クリック ===== */
  const handleCellClick = (x: number, y: number) => {
    if (phase === "play" && turn === "gote") return;

    // 配置モード
    if (phase === "edit") {
      const b = deepCopyBoard(board);
      if (!selectedPiece) b[y][x] = null;
      else b[y][x] = { type: selectedPiece, owner: turn };
      setBoard(b);
      return;
    }

    // 持ち駒打ち（先手のみ）
    if (selectedHand !== null) {
      if (turn !== "sente") return;
      const t = hands.sente[selectedHand];
      if (!canDropHere(t, x, y, "sente", board)) return;

      const b = deepCopyBoard(board);
      b[y][x] = { type: t, owner: "sente" };
      setBoard(b);

      setHands(prev => {
        const arr = [...prev.sente];
        arr.splice(selectedHand, 1);
        return { ...prev, sente: arr };
      });

      setSelectedHand(null);
      setSelected(null);
      setAvailable([]);
      setTurn("gote");
      return;
    }

    const cell = board[y][x];

    // 移動
    if (selected && available.some(([ax, ay]) => ax === x && ay === y)) {
      const b = deepCopyBoard(board);
      const moving = b[selected.y][selected.x]!;
      const target = b[y][x];

      if (target?.type === "玉") {
        resetToEdit("先手の勝ち");
        return;
      }
      if (target) {
        const base = capturedBaseType(target.type);
        setHands(prev => ({ ...prev, sente: [...prev.sente, base] }));
      }

      let promote = false;
      const promotable =
        canPromote(moving.type) &&
        (inEnemyZone(y, moving.owner) || inEnemyZone(selected.y, moving.owner));
      if (promotable) {
        if (isForcedPromote(moving.type, y, moving.owner)) promote = true;
        else promote = window.confirm(`${moving.type} を成りますか？`);
      }

      const newPiece: Piece = {
        ...moving,
        type: promote && promoteMap[moving.type] ? promoteMap[moving.type] : moving.type,
      };

      b[y][x] = newPiece;
      b[selected.y][selected.x] = null;

      setBoard(b);
      setSelected(null);
      setAvailable([]);
      setTurn("gote");
      return;
    }

    // 選択
    if (cell && cell.owner === turn) {
      setSelected({ x, y });
      setSelectedHand(null);
      setAvailable(getMovesOnBoard(x, y, cell, board));
    } else {
      setSelected(null);
      setSelectedHand(null);
      setAvailable([]);
    }
  };

  /* ===== 表示用パディング（引き出しで盤が隠れないようにする） ===== */
  const bottomPad = phase === "edit"
    ? (drawerOpen ? DRAWER_OPEN_H + 16 : DRAWER_HANDLE_H + 16)
    : 24;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
          <span>
            {phase === "edit"
              ? `配置モード（${turn === "sente" ? "先手" : "後手"}）`
              : `${turn === "sente" ? "先手" : "後手"}の番`}
          </span>

          {phase === "play" && aiThinking && (
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              AI思考中…
            </span>
          )}
        </div>

        <div style={styles.topBarBtns}>
          {phase === "edit" && (
            <>
              <button onClick={() => setTurn(other(turn))}>先後切替</button>
              <button onClick={() => setPhase("play")}>対戦開始</button>
              <button onClick={() => resetToEdit()}>全リセット</button>
            </>
          )}
          <button onClick={onBack}>戻る</button>
        </div>
      </div>

      <div style={{ ...styles.content, paddingTop: TOPBAR_H + 12, paddingBottom: bottomPad }}>
        <div style={styles.hands}>
          <div style={{ marginRight: 8 }}>後手：</div>
          {hands.gote.map((t, i) => (
            <span key={i} style={{ ...styles.handPiece, opacity: 0.9 }}>
              {t}
            </span>
          ))}
        </div>

        <div style={styles.board}>
          {board.map((r, y) =>
            r.map((c, x) => {
              const a = available.some(([ax, ay]) => ax === x && ay === y);
              const isSel = selected?.x === x && selected?.y === y;
              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  style={{
                    ...styles.cell,
                    background: isSel ? "#ffe07a" : a ? "#fff2a8" : "#f8d36f",
                    cursor: phase === "play" && turn === "gote" ? "not-allowed" : "pointer",
                  }}
                >
                  {c && (
                    <span
                      style={{
                        ...styles.piece,
                        color: c.owner === "gote" ? "#c22" : "#000",
                        transform: c.owner === "gote" ? "rotate(180deg)" : "none",
                      }}
                    >
                      {c.type}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={styles.hands}>
          <div style={{ marginRight: 8 }}>先手：</div>
          {hands.sente.map((t, i) => (
            <span
              key={i}
              style={{
                ...styles.handPiece,
                background: selectedHand === i ? "#ffd966" : "#fff",
                cursor: phase === "play" && turn === "sente" ? "pointer" : "default",
                opacity: phase === "play" && turn === "sente" ? 1 : 0.6,
              }}
              onClick={() => {
                if (phase !== "play") return;
                if (turn !== "sente") return;
                setSelected(null);
                setAvailable([]);
                setSelectedHand(prev => (prev === i ? null : i));
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {phase !== "edit" && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => resetToEdit()}>編集に戻る</button>
          </div>
        )}
      </div>

      {phase === "edit" && (
        <div
          style={{
            ...styles.drawer,
            height: drawerOpen ? DRAWER_OPEN_H : DRAWER_HANDLE_H,
          }}
        >
          <div style={styles.drawerHandle}>
            <button onClick={() => setDrawerOpen(o => !o)}>
              {drawerOpen ? "駒一覧を閉じる" : "駒一覧を開く"}
            </button>
            <button onClick={() => setSelectedPiece(null)} style={{ marginLeft: 6 }}>
              消去
            </button>
            <div style={{ marginLeft: 10, opacity: 0.8 }}>
              選択中：{selectedPiece ?? "（消去）"}
            </div>
          </div>

          {drawerOpen && (
            <div style={styles.drawerScroll}>
              {pieceList.map(p => (
                <button
                  key={p}
                  style={{
                    ...styles.selectBtn,
                    background: selectedPiece === p ? "#ffd966" : "#fff",
                  }}
                  onClick={() => setSelectedPiece(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ===== スタイル ===== */
const styles: { [k: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#f0e5b2",
  },

  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: TOPBAR_H,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    background: "#f0e5b2",
    borderBottom: "1px solid rgba(0,0,0,0.15)",
    boxSizing: "border-box",
  },
  topBarBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 12,
    boxSizing: "border-box",
  },

  board: {
    display: "grid",
    gridTemplateColumns: "repeat(9, 64px)",
    gridTemplateRows: "repeat(9, 64px)",
    border: "4px solid #a66b00",
    background: "#f8d36f",
  },
  cell: {
    width: 64,
    height: 64,
    border: "1px solid #a66b00",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
  },
  piece: {
    writingMode: "vertical-rl",
    fontSize: 32,
    fontWeight: "bold",
  },

  hands: {
    minHeight: 40,
    margin: 8,
    display: "flex",
    gap: 6,
    justifyContent: "center",
    flexWrap: "wrap",
    alignItems: "center",
  },
  handPiece: {
    fontSize: 22,
    border: "1px solid #000",
    padding: "4px 8px",
    background: "#fff",
    borderRadius: 6,
  },

  drawer: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    background: "rgba(240,229,178,0.98)",
    borderTop: "1px solid rgba(0,0,0,0.2)",
    boxShadow: "0 -6px 18px rgba(0,0,0,0.18)",
    transition: "height 160ms ease",
    boxSizing: "border-box",
  },
  drawerHandle: {
    height: DRAWER_HANDLE_H,
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    borderBottom: "1px solid rgba(0,0,0,0.15)",
    boxSizing: "border-box",
  },
  drawerScroll: {
    height: DRAWER_OPEN_H - DRAWER_HANDLE_H,
    overflowY: "auto",
    padding: 6,
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
    boxSizing: "border-box",
  },

  selectBtn: {
    padding: "4px 8px",
    fontSize: 13,
    border: "1px solid #333",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    lineHeight: 1.1,
  },
};

export default CustomRoom;
