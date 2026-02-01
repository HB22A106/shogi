import React from "react";
import TitleScreen from "./TitleScreen";
import ModeSelect from "./ModeSelect";
import ShogiBoard from "./ShogiBoard";
import TsumeShogiBoard from "./TsumeShogiBoard";
import PieceCreator from "./PieceCreator";
import CustomRoom from "./CustomRoom";

type Screen = "title" | "mode" | "play" | "create" | "custom";
type GameMode = "shogi" | "tsume" | null;

const App: React.FC = () => {
  const [screen, setScreen] = React.useState<Screen>("title");
  const [mode, setMode] = React.useState<GameMode>(null);

  return (
    <>
      {screen === "title" && (
        <TitleScreen onStart={() => setScreen("mode")} />
      )}

      {screen === "mode" && (
        <ModeSelect
          onChoose={(m) => {
            setMode(m);
            setScreen("play");
          }}
          onCreate={() => setScreen("create")}
          onCustom={() => setScreen("custom")}
          onBack={() => setScreen("title")}
        />
      )}

      {screen === "create" && (
        <PieceCreator onBack={() => setScreen("mode")} />
      )}

      {screen === "custom" && (
        <CustomRoom onBack={() => setScreen("mode")} />
      )}

      {screen === "play" && mode === "shogi" && (
        <ShogiBoard onBack={() => setScreen("mode")} />
      )}

      {screen === "play" && mode === "tsume" && (
        <TsumeShogiBoard onBack={() => setScreen("mode")} />
      )}

    </>
  );
};

export default App;
