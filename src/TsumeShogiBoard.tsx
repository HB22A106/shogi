import React from "react";

/* ================== 型定義 ================== */
type Player = "sente" | "gote";
type PieceType =
  | "歩" | "香" | "桂" | "銀" | "金" | "角" | "飛" | "玉"
  | "と" | "成香" | "成桂" | "成銀" | "馬" | "龍";

type Piece = { type: PieceType; owner: Player };
type Cell = Piece | null;

/* ================== 定数 ================== */
const promoteMap: Record<string, PieceType> = {
  歩: "と", 香: "成香", 桂: "成桂", 銀: "成銀", 角: "馬", 飛: "龍",
};
const unpromoteMap: Record<string, PieceType> = {
  と: "歩", 成香: "香", 成桂: "桂", 成銀: "銀", 馬: "角", 龍: "飛",
};

/* ================== 詰将棋問題定義 ================== */
type TsumeProblem = {
  limit: number; // 「○手詰」＝手数（先手→後手→先手＝3手）
  board: Cell[][];
  hands: { sente: PieceType[]; gote: PieceType[] };

  // ✅追加：ヒント＆答え（無くてもOK）

  answer?: string;

  // ✅追加：問題名（任意）
  title?: string;
};

const TSUME_PROBLEMS: TsumeProblem[] = [
    // =========================
// ★追加問題①（3手詰）https://www.aonoshogi.com/1tetsumes/　（１）
// 先手：４３金
// 後手：３１玉
// 先手持ち駒：金
// =========================
{
    answer: "３二金打",
  limit: 3,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 先手：4三 金
    b[2][5] = { type: "金", owner: "sente" }; // 43

    // 後手：3一 玉
    b[0][6] = { type: "玉", owner: "gote" }; // 31

    return b;
  })(),
  hands: { sente: ["金"], gote: [] },
},

// =========================
// ★追加問題②（3手詰） (22)
// 先手：３４歩、４２金
// 後手：１１香、１２歩、２１桂、２２玉、２３歩
// 先手持ち駒：角
// =========================
{
    answer: "３一角打",
  limit: 3,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 先手
    b[3][6] = { type: "歩", owner: "sente" }; // 34
    b[1][5] = { type: "金", owner: "sente" }; // 42

    // 後手
    b[0][8] = { type: "香", owner: "gote" }; // 11
    b[1][8] = { type: "歩", owner: "gote" }; // 12
    b[0][7] = { type: "桂", owner: "gote" }; // 21
    b[1][7] = { type: "玉", owner: "gote" }; // 22
    b[2][7] = { type: "歩", owner: "gote" }; // 23

    return b;
  })(),
  hands: { sente: ["角"], gote: [] },
},

// =========================
// ★追加問題③（3手詰） (50)
// 先手：２１金、３４銀
// 後手：３２玉、４１金
// 先手持ち駒：飛（飛車）
// =========================
{
    answer: "２二飛打",
  limit: 3,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 先手
    b[0][7] = { type: "金", owner: "sente" }; // 21
    b[3][6] = { type: "銀", owner: "sente" }; // 34

    // 後手
    b[1][6] = { type: "玉", owner: "gote" }; // 32
    b[0][5] = { type: "金", owner: "gote" }; // 41

    return b;
  })(),
  hands: { sente: ["飛"], gote: [] },
},

// =========================
// ★追加問題④（3手詰）  (96)
// 先手：１４飛、２６歩、４３馬
// 後手：３５玉、３６歩、４６歩
// 持ち駒：なし
// =========================
{
    answer: "４四馬",
  limit: 3,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 先手
    b[3][8] = { type: "飛", owner: "sente" }; // 14
    b[5][7] = { type: "歩", owner: "sente" }; // 26
    b[2][5] = { type: "馬", owner: "sente" }; // 43

    // 後手
    b[4][6] = { type: "玉", owner: "gote" }; // 35
    b[5][6] = { type: "歩", owner: "gote" }; // 36
    b[5][5] = { type: "歩", owner: "gote" }; // 46

    return b;
  })(),
  hands: { sente: [], gote: [] },
},

// =========================
// ★追加問題⑤（3手詰） (121)
// 先手：１２龍、４５歩、５３銀
// 後手：２４歩、３３玉、３４歩、４３銀
// 持ち駒：なし
// =========================
{
    answer: "４二銀不成",
  limit: 3,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 先手
    b[1][8] = { type: "龍", owner: "sente" }; // 12
    b[4][5] = { type: "歩", owner: "sente" }; // 45
    b[2][4] = { type: "銀", owner: "sente" }; // 53

    // 後手
    b[3][7] = { type: "歩", owner: "gote" }; // 24
    b[2][6] = { type: "玉", owner: "gote" }; // 33
    b[3][6] = { type: "歩", owner: "gote" }; // 34
    b[2][5] = { type: "銀", owner: "gote" }; // 43

    return b;
  })(),
  hands: { sente: [], gote: [] },
},

// =========================
// ★追加：画像の5手詰（1）https://tsumeshogi.net/list/?p=1&turn=3 (２０２００２１８)
// =========================
{
    answer: "２三銀打→２五金打",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 後手：玉(1四) / 角(2四) / 馬(3四)
    b[3][8] = { type: "玉", owner: "gote" }; // 1四
    b[3][7] = { type: "角", owner: "gote" }; // 2四
    b[3][6] = { type: "馬", owner: "gote" }; // 3四

    // 先手：龍(2二) / 香(2七)
    b[1][7] = { type: "龍", owner: "sente" }; // 2二
    b[6][7] = { type: "香", owner: "sente" }; // 2七

    return b;
  })(),
  hands: { sente: ["金", "銀"], gote: [] },
},

// =========================
// ★追加：画像の5手詰（2）　　（20200310）
// =========================
{
    answer: "３四飛→３五金打",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 後手：玉(4四) / 桂(3三) / 歩(5六)
    b[3][5] = { type: "玉", owner: "gote" }; // 4四
    b[2][6] = { type: "桂", owner: "gote" }; // 3三
    b[5][4] = { type: "歩", owner: "gote" }; // 5六

    // 先手：銀(5四) / 馬(1三) / 飛(3六)
    b[3][4] = { type: "銀", owner: "sente" }; // 5四
    b[2][8] = { type: "馬", owner: "sente" }; // 1三
    b[5][6] = { type: "飛", owner: "sente" }; // 3六

    return b;
  })(),
  hands: { sente: ["金"], gote: [] },
},

// =========================
// ★追加：画像の5手詰（3）　（20190917）
// =========================
{
    answer: "１三馬→１二飛打",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 1段目：後手 角(4一) / 歩(3一) / 桂(1一) 、先手 銀(2一)
    b[0][5] = { type: "角", owner: "gote" }; // 4一
    b[0][6] = { type: "歩", owner: "gote" }; // 3一
    b[0][8] = { type: "桂", owner: "gote" }; // 1一
    b[0][7] = { type: "銀", owner: "sente" }; // 2一

    // 後手：玉(2二)
    b[1][7] = { type: "玉", owner: "gote" }; // 2二

    // 先手：金(3四) / 馬(1四)
    b[3][6] = { type: "金", owner: "sente" }; // 3四
    b[3][8] = { type: "馬", owner: "sente" }; // 1四

    return b;
  })(),
  hands: { sente: ["飛"], gote: [] },
},

// =========================
// ★追加：画像の5手詰（4）（２０２００３２５）
// =========================
{
    answer: "１三角成→２四銀成",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // 後手：飛(1三) / 玉(1四) / 銀(2五)
    b[2][7] = { type: "飛", owner: "gote" }; // 2三
    b[3][8] = { type: "玉", owner: "gote" }; // 1四
    b[4][7] = { type: "銀", owner: "gote" }; // 2五

    // 先手：銀(2三) / 角(3五) / 角(1五) / 香(1六)
    b[2][6] = { type: "銀", owner: "sente" }; // 3三
    b[4][6] = { type: "角", owner: "sente" }; // 3五
    b[4][8] = { type: "角", owner: "sente" }; // 1五
    b[5][8] = { type: "香", owner: "sente" }; // 1六

    return b;
  })(),
  hands: { sente: [], gote: [] },
},
  // =========================
// ★追加問題①（5手詰）　（２０１９０８２１）
// 先手：５１飛、５３角
// 後手：１１龍、１２歩、２３銀、３１香、３２玉、３３歩
// 先手持ち駒：角
// =========================
{
    // ★追加：5手詰（あなた追加）２０１９０８１０
    answer: "３四角打→２二金打",
    limit: 5,
    board: (() => {
      const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));
  
      // --- 先手 ---
      b[0][6] = { type: "龍", owner: "sente" }; // 31 龍
  
      // --- 後手 ---
      b[1][8] = { type: "玉", owner: "gote" }; // 12 玉
      b[2][8] = { type: "歩", owner: "gote" }; // 13 歩
      b[2][6] = { type: "銀", owner: "gote" }; // 33 銀
      b[3][4] = { type: "角", owner: "gote" }; // 54 角
  
      return b;
    })(),
    hands: { sente: ["角", "金"], gote: [] },
  },
  

// =========================
// ★追加問題②（5手詰）　　（２０１９０６２５）
// 先手：１１飛、２１角、２４桂、２５歩
// 後手：１４歩、２２玉、３１桂
// 持ち駒：なし
// =========================
{
    answer: "１三飛成→１二角成",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[0][8] = { type: "飛", owner: "sente" }; // 11
    b[0][7] = { type: "角", owner: "sente" }; // 21
    b[3][7] = { type: "桂", owner: "sente" }; // 24
    b[4][7] = { type: "歩", owner: "sente" }; // 25

    // --- 後手 ---
    b[3][8] = { type: "歩", owner: "gote" }; // 14
    b[1][7] = { type: "玉", owner: "gote" }; // 22
    b[0][6] = { type: "桂", owner: "gote" }; // 31

    return b;
  })(),
  hands: { sente: [], gote: [] },
},

// =========================
// ★追加問題③（5手詰）　（２０１９０４１４）
// 先手：２５歩、３２龍
// 後手：１３玉、１４銀、２１銀、２３銀
// 先手持ち駒：金、銀
// =========================
{
    answer: "１二金打→２二銀打",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[4][7] = { type: "歩", owner: "sente" }; // 25
    b[1][6] = { type: "龍", owner: "sente" }; // 32

    // --- 後手 ---
    b[2][8] = { type: "玉", owner: "gote" }; // 13
    b[3][8] = { type: "銀", owner: "gote" }; // 14
    b[0][7] = { type: "銀", owner: "gote" }; // 21
    b[2][7] = { type: "銀", owner: "gote" }; // 23

    return b;
  })(),
  hands: { sente: ["金", "銀"], gote: [] },
},

// =========================
// ★追加問題④（5手詰）　（20190303）
// 先手：１３銀、２６歩、３１馬、３５馬
// 後手：２３玉、３２歩、３３銀
// 持ち駒：なし
// =========================
{
    answer: "２二馬→２四馬",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[2][8] = { type: "銀", owner: "sente" }; // 13
    b[5][7] = { type: "歩", owner: "sente" }; // 26
    b[0][6] = { type: "馬", owner: "sente" }; // 31
    b[4][6] = { type: "馬", owner: "sente" }; // 35

    // --- 後手 ---
    b[2][7] = { type: "玉", owner: "gote" }; // 23
    b[1][6] = { type: "歩", owner: "gote" }; // 32
    b[2][6] = { type: "銀", owner: "gote" }; // 33

    return b;
  })(),
  hands: { sente: [], gote: [] },
},

// =========================
// ★追加問題⑤（5手詰）　（２０１８１０２４）
// 先手：３４金
// 後手：１２香、１３玉、１４歩、２１銀、４１馬
// 先手持ち駒：角、金
// =========================
{
    answer: "３一角打→２三金打",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[3][6] = { type: "金", owner: "sente" }; // 34

    // --- 後手 ---
    b[1][8] = { type: "香", owner: "gote" }; // 12
    b[2][8] = { type: "玉", owner: "gote" }; // 13
    b[3][8] = { type: "歩", owner: "gote" }; // 14
    b[0][7] = { type: "銀", owner: "gote" }; // 21
    b[0][5] = { type: "馬", owner: "gote" }; // 41

    return b;
  })(),
  hands: { sente: ["角", "金"], gote: [] },
},

// =========================
// ★追加問題⑥（5手詰）　　（20180612）
// 先手：１４金、２１角、２５歩
// 後手：１１桂、２２玉、２３歩、３１香、３４歩
// 先手持ち駒：飛
// =========================
{
    answer: "１三金→１二飛打",
  limit: 5,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[3][8] = { type: "金", owner: "sente" }; // 14
    b[0][7] = { type: "角", owner: "sente" }; // 21
    b[4][7] = { type: "歩", owner: "sente" }; // 25

    // --- 後手 ---
    b[0][8] = { type: "桂", owner: "gote" }; // 11
    b[1][7] = { type: "玉", owner: "gote" }; // 22
    b[2][7] = { type: "歩", owner: "gote" }; // 23
    b[0][6] = { type: "香", owner: "gote" }; // 31
    b[3][6] = { type: "歩", owner: "gote" }; // 34

    return b;
  })(),
  hands: { sente: ["飛"], gote: [] },
},
{
    //２０１９０８２１
    answer: "２一角打→５二飛成→同龍",
    limit: 7,
    board: (() => {
      const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

      // --- 先手 ---
      b[0][4] = { type: "飛", owner: "sente" }; // 51
      b[2][4] = { type: "角", owner: "sente" }; // 53

      // --- 後手 ---
      b[0][8] = { type: "龍", owner: "gote" }; // 11
      b[1][8] = { type: "歩", owner: "gote" }; // 12
      b[2][7] = { type: "銀", owner: "gote" }; // 23
      b[0][6] = { type: "香", owner: "gote" }; // 31
      b[1][6] = { type: "玉", owner: "gote" }; // 32
      b[2][6] = { type: "歩", owner: "gote" }; // 33

      return b;
    })(),
    hands: { sente: ["角"], gote: [] },
  },
{
  //２０２００３１７
  answer: "２四桂打→１一銀成→１二飛成",
  limit: 7,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[4][8] = { type: "桂", owner: "sente" }; // 15
    b[1][7] = { type: "銀", owner: "sente" }; // 22
    b[1][5] = { type: "飛", owner: "sente" }; // 42

    // --- 後手 ---
    b[1][8] = { type: "玉", owner: "gote" }; // 12
    b[0][7] = { type: "歩", owner: "gote" }; // 21
    b[4][6] = { type: "角", owner: "gote" }; // 35

    return b;
  })(),
  hands: { sente: ["桂"], gote: [] },
},
{
  //２０２００２２８
  answer: "２一金打→３一馬→２三桂不成",
  limit: 7,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[4][6] = { type: "桂", owner: "sente" }; // 35
    b[0][5] = { type: "金", owner: "sente" }; // 41
    b[2][4] = { type: "馬", owner: "sente" }; // 53

    // --- 後手 ---
    b[0][8] = { type: "玉", owner: "gote" }; // 11
    b[1][8] = { type: "歩", owner: "gote" }; // 12
    b[2][8] = { type: "銀", owner: "gote" }; // 13
    b[0][6] = { type: "歩", owner: "gote" }; // 31
    b[4][3] = { type: "角", owner: "gote" }; // 65

    return b;
  })(),
  hands: { sente: ["金"], gote: [] },
},
{
  //２０２００２０３
  answer: "３二金打→３四角成→１二金打",
  limit: 7,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[4][8] = { type: "桂", owner: "sente" }; // 15
    b[2][7] = { type: "角", owner: "sente" }; // 23
    b[5][7] = { type: "馬", owner: "sente" }; // 26

    // --- 後手 ---
    b[3][7] = { type: "歩", owner: "gote" }; // 24
    b[0][6] = { type: "桂", owner: "gote" }; // 31
    b[2][6] = { type: "玉", owner: "gote" }; // 33
    b[2][5] = { type: "銀", owner: "gote" }; // 43

    return b;
  })(),
  hands: { sente: ["金", "金"], gote: [] },
},
// =========================
// ★追加：7手詰め（4問まとめ）２０１９１２２７
// =========================
{
  //２０１９１１２３
  answer: "２三角成→３二飛打→１二銀成",
  limit: 7,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[0][7] = { type: "銀", owner: "sente" }; // 21
    b[0][6] = { type: "飛", owner: "sente" }; // 31
    b[1][6] = { type: "角", owner: "sente" }; // 32
    b[4][6] = { type: "金", owner: "sente" }; // 35

    // --- 後手 ---
    b[0][8] = { type: "桂", owner: "gote" }; // 11
    b[2][8] = { type: "金", owner: "gote" }; // 13
    b[1][7] = { type: "玉", owner: "gote" }; // 22
    b[3][5] = { type: "馬", owner: "gote" }; // 44

    return b;
  })(),
  hands: { sente: ["飛"], gote: [] },
},
{
  //２０１９１１１５
  answer: "１三金打→３四銀打→２２金打",
  limit: 7,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[4][8] = { type: "歩", owner: "sente" }; // 15
    b[3][5] = { type: "馬", owner: "sente" }; // 44

    // --- 後手 ---
    b[1][8] = { type: "飛", owner: "gote" }; // 12
    b[2][7] = { type: "玉", owner: "gote" }; // 23
    b[3][7] = { type: "歩", owner: "gote" }; // 24
    b[1][6] = { type: "龍", owner: "gote" }; // 32

    return b;
  })(),
  hands: { sente: ["金", "金", "銀"], gote: [] },
},
// =========================
// ★追加：9手詰め（4問まとめ）　
// =========================
{
    //９手詰め　
    answer: "２四歩→１五銀→１三龍→同龍",
  limit: 9,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[5][8] = { type: "銀", owner: "sente" }; // 16
    b[4][7] = { type: "歩", owner: "sente" }; // 25
    b[5][6] = { type: "角", owner: "sente" }; // 36
    b[2][5] = { type: "龍", owner: "sente" }; // 43

    // --- 後手 ---
    b[3][8] = { type: "玉", owner: "gote" }; // 14
    b[5][7] = { type: "金", owner: "gote" }; // 26

    return b;
  })(),
  hands: { sente: [], gote: [] },
},

{
  //２０１９０８１６
  answer: "３三銀打→２一銀成→同馬→２二銀打",
  limit: 9,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[1][6] = { type: "銀", owner: "sente" }; // 32
    b[3][4] = { type: "馬", owner: "sente" }; // 54

    // --- 後手 ---
    b[1][8] = { type: "香", owner: "gote" }; // 12
    b[2][8] = { type: "歩", owner: "gote" }; // 13
    b[1][7] = { type: "玉", owner: "gote" }; // 22
    b[3][7] = { type: "龍", owner: "gote" }; // 24
    b[2][4] = { type: "角", owner: "gote" }; // 53

    return b;
  })(),
  hands: { sente: ["銀", "銀"], gote: [] },
},
// =========================
// ★追加：11手詰め（3問まとめ）
// =========================
{
  //２０２５０６０１
  answer: "３二桂成→１四角打→２三角成→１二銀打",
  limit: 9,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[3][7] = { type: "桂", owner: "sente" }; // 24
    b[2][3] = { type: "飛", owner: "sente" }; // 63

    // --- 後手 ---
    b[0][7] = { type: "桂", owner: "gote" }; // 21
    b[0][6] = { type: "角", owner: "gote" }; // 31
    b[1][5] = { type: "玉", owner: "gote" }; // 42
    b[0][4] = { type: "香", owner: "gote" }; // 51

    return b;
  })(),
  hands: { sente: ["角", "銀"], gote: ["飛", "金", "銀"] },
},
{
    limit: 9,
    answer: "２四銀打→３二香成→３三銀成→２二飛成",
    board: (() => {
      const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));
  
      // --- 先手 ---
      b[4][8] = { type: "角", owner: "sente" }; // 15
      b[4][7] = { type: "飛", owner: "sente" }; // 25
      b[2][6] = { type: "香", owner: "sente" }; // 33
  
      // --- 後手 ---
      b[0][8] = { type: "香", owner: "gote" }; // 11
      b[1][8] = { type: "歩", owner: "gote" }; // 12
      b[2][8] = { type: "玉", owner: "gote" }; // 13
      b[3][8] = { type: "角", owner: "gote" }; // 14
      b[0][7] = { type: "銀", owner: "gote" }; // 21
  
      return b;
    })(),
    hands: { sente: ["銀"], gote: ["歩"] },
  },
  {
    limit: 9,
    answer: "２二銀打→４二飛成→２三銀打→１二金打",
    board: (() => {
      const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));
  
      // --- 先手 ---
      b[4][6] = { type: "桂", owner: "sente" }; // 35
      b[3][5] = { type: "飛", owner: "sente" }; // 44
  
      // --- 後手 ---
      b[2][8] = { type: "歩", owner: "gote" }; // 13
      b[0][7] = { type: "桂", owner: "gote" }; // 21
      b[0][6] = { type: "玉", owner: "gote" }; // 31
      b[2][6] = { type: "角", owner: "gote" }; // 33
      b[0][5] = { type: "金", owner: "gote" }; // 41
  
      return b;
    })(),
    hands: { sente: ["金", "銀", "銀"], gote: ["歩"] },
  },
  {
    limit: 9,
    answer: "３二飛打→３五角成→２五飛打→２六馬",
    board: (() => {
      const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));
  
      // --- 先手 ---
      b[0][4] = { type: "銀", owner: "sente" }; // 51
      b[2][4] = { type: "角", owner: "sente" }; // 53
  
      // --- 後手 ---
      b[0][8] = { type: "香", owner: "gote" }; // 11
      b[3][8] = { type: "歩", owner: "gote" }; // 14
      b[0][7] = { type: "桂", owner: "gote" }; // 21
      b[2][7] = { type: "歩", owner: "gote" }; // 23
      b[2][6] = { type: "玉", owner: "gote" }; // 33
  
      return b;
    })(),
    hands: { sente: ["飛", "飛"], gote: ["歩"] },
  },
{
    //２０２００３２９
    answer: "３一銀不成→２二銀不成→３二香成→３一馬→同馬",
  limit: 11,
  board: (() => {
    const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));

    // --- 先手 ---
    b[4][7] = { type: "歩", owner: "sente" }; // 25
    b[1][6] = { type: "銀", owner: "sente" }; // 32
    b[4][6] = { type: "香", owner: "sente" }; // 35
    b[1][5] = { type: "馬", owner: "sente" }; // 42

    // --- 後手 ---
    b[1][8] = { type: "銀", owner: "gote" }; // 12
    b[3][8] = { type: "歩", owner: "gote" }; // 14
    b[1][7] = { type: "玉", owner: "gote" }; // 22
    b[2][7] = { type: "歩", owner: "gote" }; // 23

    return b;
  })(),
  hands: { sente: [], gote: [] },
},

// =========================
// ★追加：11手詰め（5問）
// =========================
  {
    limit: 11,
    answer: "３四角打→１一飛成→１二銀打→１三角成→２三角成",
    board: (() => {
      const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));
  
      // --- 先手 ---
      b[3][7] = { type: "角", owner: "sente" }; // 24
      b[0][6] = { type: "飛", owner: "sente" }; // 31
  
      // --- 後手 ---
      b[1][8] = { type: "玉", owner: "gote" }; // 12
      b[1][6] = { type: "歩", owner: "gote" }; // 32
      b[2][6] = { type: "桂", owner: "gote" }; // 33
      b[2][5] = { type: "銀", owner: "gote" }; // 43
  
      return b;
    })(),
    hands: { sente: ["角", "銀"], gote: ["歩"] },
  },
  {
    limit: 11,
    answer: "３二飛打→２五桂打→２四龍→３一角打→２二角成",
    board: (() => {
      const b = Array.from({ length: 9 }, () => Array<Cell>(9).fill(null));
  
      // --- 先手 ---
      b[5][8] = { type: "歩", owner: "sente" }; // 16
      b[4][6] = { type: "龍", owner: "sente" }; // 35
  
      // --- 後手 ---
      b[0][8] = { type: "香", owner: "gote" }; // 11
      b[3][8] = { type: "歩", owner: "gote" }; // 14
      b[0][7] = { type: "桂", owner: "gote" }; // 21
      b[1][7] = { type: "玉", owner: "gote" }; // 22
      b[2][7] = { type: "金", owner: "gote" }; // 23
      b[3][7] = { type: "歩", owner: "gote" }; // 24
  
      return b;
    })(),
    hands: { sente: ["飛", "角", "桂"], gote: ["歩"] },
  },

];


/* ================== ユーティリティ ================== */
const isInside = (x: number, y: number) => x >= 0 && x < 9 && y >= 0 && y < 9;
const inEnemyZone = (y: number, owner: Player) => (owner === "sente" ? y <= 2 : y >= 6);

const deepCopyBoard = (b: Cell[][]): Cell[][] =>
  b.map(r => r.map(c => (c ? { ...c } : null)));

const hasNifu = (board: Cell[][], x: number, owner: Player): boolean => {
  for (let y = 0; y < 9; y++) {
    const c = board[y][x];
    if (c && c.owner === owner && c.type === "歩") return true;
  }
  return false;
};

/* ================== 駒の動き（完全オリジナル・未変更） ================== */
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
      [[0, dir], [-1, dir], [1, dir], [-1, -dir], [1, -dir]]
        .forEach(([dx, dy]) => addIfValid(x + dx, y + dy));
      break;
    case "金":
      [[0, dir], [-1, dir], [1, dir], [0, -dir], [-1, 0], [1, 0]]
        .forEach(([dx, dy]) => addIfValid(x + dx, y + dy));
      break;
    case "角":
      [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => {
        for (let i = 1; i < 9; i++) if (!addIfValid(x + dx * i, y + dy * i)) break;
      });
      break;
    case "飛":
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
        for (let i = 1; i < 9; i++) if (!addIfValid(x + dx * i, y + dy * i)) break;
      });
      break;
    case "玉":
      [[1,1],[1,0],[1,-1],[0,1],[0,-1],[-1,1],[-1,0],[-1,-1]]
        .forEach(([dx, dy]) => addIfValid(x + dx, y + dy));
      break;
  }

  if (piece.type === "馬")
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => addIfValid(x + dx, y + dy));
  if (piece.type === "龍")
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => addIfValid(x + dx, y + dy));

  return moves;
}

const capturedBaseType = (p: Piece): PieceType =>
  (unpromoteMap[p.type] as PieceType) ?? p.type;

/* ================== メインコンポーネント ================== */
const TsumeShogiBoard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [problemIndex, setProblemIndex] = React.useState(0);
  const problem = TSUME_PROBLEMS[problemIndex];

  const [board, setBoard] = React.useState<Cell[][]>(deepCopyBoard(problem.board));
  const [hands, setHands] = React.useState(problem.hands);
  const [selected, setSelected] = React.useState<{ x: number; y: number } | null>(null);
  const [available, setAvailable] = React.useState<[number, number][]>([]);
  const [turn, setTurn] = React.useState<Player>("sente");
  const [selectedHand, setSelectedHand] = React.useState<number | null>(null);

  // 手数カウント
  const [moveCount, setMoveCount] = React.useState(0);
  const moveCountRef = React.useRef(0);

  const [result, setResult] = React.useState<"success" | "fail" | null>(null);

  // ✅追加：ヒント/答え表示モーダル
  const [infoModal, setInfoModal] = React.useState<null | { title: string; text: string }>(null);

  React.useEffect(() => {
    const p = TSUME_PROBLEMS[problemIndex];
    setBoard(deepCopyBoard(p.board));
    setHands(p.hands);
    setSelected(null);
    setSelectedHand(null);
    setAvailable([]);
    setTurn("sente");
    setMoveCount(0);
    moveCountRef.current = 0;
    setResult(null);
    setInfoModal(null);
  }, [problemIndex]);

  const resetProblem = () => {
    setBoard(deepCopyBoard(problem.board));
    setHands(problem.hands);
    setSelected(null);
    setSelectedHand(null);
    setAvailable([]);
    setTurn("sente");
    setMoveCount(0);
    moveCountRef.current = 0;
    setResult(null);
    setInfoModal(null);
  };

  const goNextProblem = () => {
    if (problemIndex + 1 >= TSUME_PROBLEMS.length) {
      alert("全問終了です");
      return;
    }
    setProblemIndex(problemIndex + 1);
  };

  // ✅追加：前の問題へ
  const goPrevProblem = () => {
    if (problemIndex <= 0) {
      alert("これが最初の問題です");
      return;
    }
    setProblemIndex(problemIndex - 1);
  };

  // ✅追加：答え表示
  const showAnswer = () => {
    if (!problem.answer) {
      alert("この問題は答えが未登録です。");
      return;
    }
    setInfoModal({ title: "答え", text: problem.answer });
  };

  const handleHandClick = (player: Player, idx: number) => {
    if (result || player !== turn) return;
    setSelected(null);
    setAvailable([]);
    setSelectedHand(prev => (prev === idx ? null : idx));
  };

  // 指し手1回＝+1、制限超えたらfail（Refで確実に数える）
  const applyMoveCountAndLimit = () => {
    const next = moveCountRef.current + 1;
    moveCountRef.current = next;
    setMoveCount(next);

    if (next > problem.limit) {
      setResult("fail");
      return false;
    }
    return true;
  };

  /* ================== 後手自動応手AI（ここから） ================== */
  type Action =
    | { kind: "move"; fromX: number; fromY: number; toX: number; toY: number; promote: boolean }
    | { kind: "drop"; toX: number; toY: number; piece: PieceType };

  const findKing = (b: Cell[][], owner: Player): { x: number; y: number } | null => {
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        const c = b[y][x];
        if (c && c.owner === owner && c.type === "玉") return { x, y };
      }
    }
    return null;
  };

  const senteCanCaptureGoteKingNext = (b: Cell[][]): boolean => {
    const kingPos = findKing(b, "gote");
    if (!kingPos) return true;
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        const c = b[y][x];
        if (!c || c.owner !== "sente") continue;
        const mv = getMoves(x, y, c, b);
        if (mv.some(([tx, ty]) => tx === kingPos.x && ty === kingPos.y)) return true;
      }
    }
    return false;
  };

  const simulateAction = (b: Cell[][], h: { sente: PieceType[]; gote: PieceType[] }, act: Action) => {
    const nb = deepCopyBoard(b);
    const nh = { sente: [...h.sente], gote: [...h.gote] };

    if (act.kind === "drop") {
      nb[act.toY][act.toX] = { type: act.piece, owner: "gote" };
      const idx = nh.gote.indexOf(act.piece);
      if (idx >= 0) nh.gote.splice(idx, 1);
      return { nb, nh };
    }

    const moving = nb[act.fromY][act.fromX];
    if (!moving) return { nb, nh };

    const target = nb[act.toY][act.toX];
    if (target) {
      const base = capturedBaseType(target);
      nh.gote.push(base);
    }

    const newPiece: Piece = { ...moving };
    if (act.promote && promoteMap[newPiece.type]) {
      newPiece.type = promoteMap[newPiece.type];
    }

    nb[act.toY][act.toX] = newPiece;
    nb[act.fromY][act.fromX] = null;

    return { nb, nh };
  };

  const pieceValue: Record<PieceType, number> = {
    玉: 100000,
    飛: 900,
    角: 800,
    金: 600,
    銀: 500,
    桂: 300,
    香: 300,
    歩: 100,
    と: 600,
    成香: 600,
    成桂: 600,
    成銀: 600,
    馬: 900,
    龍: 1000,
  };

  const listPieces = (b: Cell[][], owner: Player) => {
    const res: { x: number; y: number; piece: Piece }[] = [];
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        const c = b[y][x];
        if (c && c.owner === owner) res.push({ x, y, piece: c });
      }
    }
    return res;
  };

  const isSquareAttacked = (b: Cell[][], targetX: number, targetY: number, by: Player): boolean => {
    const pcs = listPieces(b, by);
    for (const p of pcs) {
      const mv = getMoves(p.x, p.y, p.piece, b);
      if (mv.some(([tx, ty]) => tx === targetX && ty === targetY)) return true;
    }
    return false;
  };

  const isKingInCheck = (b: Cell[][], owner: Player): boolean => {
    const kp = findKing(b, owner);
    if (!kp) return true;
    const enemy: Player = owner === "sente" ? "gote" : "sente";
    return isSquareAttacked(b, kp.x, kp.y, enemy);
  };

  const generateActions = (
    owner: Player,
    b: Cell[][],
    h: { sente: PieceType[]; gote: PieceType[] }
  ): Action[] => {
    const acts: Action[] = [];

    // 盤上移動
    for (const p of listPieces(b, owner)) {
      const mv = getMoves(p.x, p.y, p.piece, b);
      for (const [tx, ty] of mv) {
        const canPromote =
          !!promoteMap[p.piece.type] &&
          (inEnemyZone(ty, owner) || inEnemyZone(p.y, owner));

        if (canPromote) acts.push({ kind: "move", fromX: p.x, fromY: p.y, toX: tx, toY: ty, promote: true });
        acts.push({ kind: "move", fromX: p.x, fromY: p.y, toX: tx, toY: ty, promote: false });
      }
    }

    // 持ち駒打ち
    const hand = h[owner];
    for (let i = 0; i < hand.length; i++) {
      const pt = hand[i];
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (b[y][x]) continue;
          if (pt === "歩" && hasNifu(b, x, owner)) continue;
          acts.push({ kind: "drop", toX: x, toY: y, piece: pt });
        }
      }
    }

    return acts;
  };

  const evalForGote = (b: Cell[][]): number => {
    const gk = findKing(b, "gote");
    if (!gk) return -999999;

    if (senteCanCaptureGoteKingNext(b)) return -500000;

    const inCheck = isKingInCheck(b, "gote");
    let score = inCheck ? -20000 : 0;

    // 玉の逃げ道（安全マス）
    const kingMoves = [
      [1, 1],[1, 0],[1, -1],[0, 1],[0, -1],[-1, 1],[-1, 0],[-1, -1]
    ];
    let safeSquares = 0;
    for (const [dx, dy] of kingMoves) {
      const nx = gk.x + dx;
      const ny = gk.y + dy;
      if (!isInside(nx, ny)) continue;
      const c = b[ny][nx];
      if (c && c.owner === "gote") continue;
      if (!isSquareAttacked(b, nx, ny, "sente")) safeSquares++;
    }
    score += safeSquares * 200;

    // 素材差（ざっくり）
    for (const { piece } of listPieces(b, "gote")) score += pieceValue[piece.type] * 0.05;
    for (const { piece } of listPieces(b, "sente")) score -= pieceValue[piece.type] * 0.02;

    return score;
  };

  const filterEvasionsIfInCheck = (
    b: Cell[][],
    h: { sente: PieceType[]; gote: PieceType[] },
    acts: Action[]
  ): Action[] => {
    if (!isKingInCheck(b, "gote")) return acts;

    const res: Action[] = [];
    for (const act of acts) {
      const { nb } = simulateAction(b, h, act);
      if (!isKingInCheck(nb, "gote")) res.push(act);
    }
    return res.length > 0 ? res : acts;
  };

  const scoreGoteActionBy2Ply = (act: Action): number => {
    const { nb, nh } = simulateAction(board, hands, act);

    const gk = findKing(nb, "gote");
    if (!gk) return -999999;

    const senteActs = generateActions("sente", nb, nh);

    let worst = 999999;

    for (const sAct of senteActs) {
      const { nb: nb2 } = simulateAction(nb, nh, sAct);

      const gk2 = findKing(nb2, "gote");
      if (!gk2) {
        worst = Math.min(worst, -999999);
        continue;
      }

      const v = evalForGote(nb2);
      worst = Math.min(worst, v);
    }

    if (senteActs.length === 0) {
      worst = evalForGote(nb);
    }

    return worst;
  };

  const chooseGoteAction = (): Action | null => {
    let acts = generateActions("gote", board, hands);
    if (acts.length === 0) return null;

    acts = filterEvasionsIfInCheck(board, hands, acts);

    let bestAct: Action | null = null;
    let bestScore = -9999999;

    for (const act of acts) {
      const score = scoreGoteActionBy2Ply(act);
      if (score > bestScore) {
        bestScore = score;
        bestAct = act;
      }
    }

    return bestAct ?? acts[0];
  };

  React.useEffect(() => {
    if (result) return;
    if (turn !== "gote") return;

    const act = chooseGoteAction();
    if (!act) {
      setResult("success");
      return;
    }

    const { nb, nh } = simulateAction(board, hands, act);

    setBoard(nb);
    setHands(nh);

    const ok = applyMoveCountAndLimit();
    if (!ok) return;

    setSelected(null);
    setSelectedHand(null);
    setAvailable([]);
    setTurn("sente");
  }, [turn, result, board, hands]);

  /* ================== 先手操作 ================== */
  const handleClick = (x: number, y: number) => {
    if (result) return;
    if (turn !== "sente") return;

    const cell = board[y][x];

    if (selectedHand !== null) {
      if (cell) return;

      const t = hands[turn][selectedHand];
      if (t === "歩" && hasNifu(board, x, turn)) {
        alert("二歩です");
        setResult("fail");
        return;
      }

      const newBoard = deepCopyBoard(board);
      newBoard[y][x] = { type: t, owner: turn };
      setBoard(newBoard);

      setHands(prev => {
        const a = [...prev[turn]];
        a.splice(selectedHand, 1);
        return { ...prev, [turn]: a };
      });

      if (!applyMoveCountAndLimit()) return;

      setTurn("gote");
      setSelectedHand(null);
      setAvailable([]);
      return;
    }

    if (cell && cell.owner === turn) {
      setSelected({ x, y });
      setAvailable(getMoves(x, y, cell, board));
      return;
    }

    if (selected && available.some(([ax, ay]) => ax === x && ay === y)) {
      const newBoard = deepCopyBoard(board);
      const moving = newBoard[selected.y][selected.x]!;
      const target = newBoard[y][x];

      let newPiece = { ...moving };
      if (
        promoteMap[moving.type] &&
        (inEnemyZone(y, moving.owner) || inEnemyZone(selected.y, moving.owner))
      ) {
        if (window.confirm(`${moving.type} を成りますか？`)) {
          newPiece.type = promoteMap[moving.type];
        }
      }

      if (target) {
        if (target.type === "玉") {
          applyMoveCountAndLimit();
          setResult("success");
          return;
        }
        setHands(prev => ({
          ...prev,
          [turn]: [...prev[turn], capturedBaseType(target)],
        }));
      }

      newBoard[y][x] = newPiece;
      newBoard[selected.y][selected.x] = null;
      setBoard(newBoard);

      if (!applyMoveCountAndLimit()) return;

      setTurn("gote");
      setSelected(null);
      setAvailable([]);
    }
  };

  const total = TSUME_PROBLEMS.length;

  return (
    <div style={styles.container}>
      {/* ✅ヒント/答えモーダル */}
      {infoModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h2 style={{ marginTop: 0 }}>{infoModal.title}</h2>
            <pre style={styles.modalText}>{infoModal.text}</pre>
            <button onClick={() => setInfoModal(null)}>閉じる</button>
          </div>
        </div>
      )}

      {/* 結果オーバーレイ */}
      {result && (
        <div style={styles.overlay}>
          <h1>{result === "success" ? "詰み成功！" : "失敗…"}</h1>

          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={onBack}>タイトルに戻る</button>
            <button onClick={resetProblem}>同じ問題</button>
            <button onClick={goPrevProblem}>前の問題</button>
            <button onClick={goNextProblem}>次の問題</button>
            <button onClick={showAnswer}>答え</button>
          </div>
        </div>
      )}

      {/* ✅上部コントロール */}
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={onBack}>戻る</button>
        <button onClick={resetProblem}>リセット</button>

        {/* ✅前へ */}
        <button onClick={goPrevProblem} disabled={problemIndex === 0}>
          前の問題
        </button>

        {/* ✅次へ */}
        <button onClick={goNextProblem} disabled={problemIndex + 1 >= total}>
          次の問題
        </button>

        {/* ✅ヒント＆答え */}
        <button onClick={showAnswer}>答え</button>

        {/* ✅今何問目 / 全何問 */}
        <span style={{ marginLeft: 10, fontWeight: "bold" }}>
          第 {problemIndex + 1} 問 / 全 {total} 問　（{moveCount}/{problem.limit} 手）
        </span>
      </div>

      {problem.title && <h2 style={{ marginTop: 0 }}>{problem.title}</h2>}

      <div style={styles.hands}>
        <h3>後手の持ち駒：</h3>
        {hands.gote.map((t, i) => (
          <span
            key={i}
            onClick={() => handleHandClick("gote", i)}
            style={{
              ...styles.handPiece,
              background: selectedHand === i && turn === "gote" ? "#ffd966" : "#fff",
              cursor: turn === "gote" ? "pointer" : "default",
            }}
          >
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
              <div
                key={`${x}-${y}`}
                onClick={() => handleClick(x, y)}
                style={{
                  ...styles.cell,
                  background: isSelected
                    ? "#ffe07a"
                    : isAvail
                      ? "#fff6b3"
                      : "#f8d36f",
                }}
              >
                {cell && (
                  <span
                    style={{
                      ...styles.piece,
                      transform: cell.owner === "gote" ? "rotate(180deg)" : "none",
                      color: cell.owner === "gote" ? "#c22" : "#000",
                    }}
                  >
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
          <span
            key={i}
            onClick={() => handleHandClick("sente", i)}
            style={{
              ...styles.handPiece,
              background: selectedHand === i && turn === "sente" ? "#ffd966" : "#fff",
              cursor: turn === "sente" ? "pointer" : "default",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ================== スタイル ================== */
const styles: { [k: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#f0e5b2",
    minHeight: "100vh",
    paddingTop: 20,
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(9, 60px)",
    gridTemplateRows: "repeat(9, 60px)",
    border: "4px solid #a66b00",
  },
  cell: {
    width: 60,
    height: 60,
    border: "1px solid #a66b00",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  piece: { fontSize: 26, fontWeight: "bold", userSelect: "none" },
  hands: { margin: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 },
  handPiece: {
    fontSize: 20,
    border: "1px solid #000",
    borderRadius: 4,
    padding: "4px 8px",
    background: "#fff",
    cursor: "pointer",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    padding: 12,
  },

  // ✅追加：ヒント/答えモーダル
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    zIndex: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  modalBox: {
    width: "min(520px, 92vw)",
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
  modalText: {
    whiteSpace: "pre-wrap",
    fontSize: 16,
    lineHeight: 1.4,
    background: "#f7f7f7",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
    maxHeight: "45vh",
    overflow: "auto",
  },
};

export default TsumeShogiBoard;
