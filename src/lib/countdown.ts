import { state } from "./state";

export function countdownTimer(date: Date, hookEnds: () => void) {
  return () => {
    const difference = +date - +new Date();
    let remaining = "END";

    if (difference > 0) {
      const parts: any = {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
      remaining = `00:${
        parts.minutes < 10 ? "0" + parts.minutes : parts.minutes
      }:${parts.seconds < 10 ? "0" + parts.seconds : parts.seconds}`;
    }

    if (state.examFinished === false) {
      if (remaining === "END") {
        hookEnds();
        return;
      }

      document.getElementById("countdownEnd")!.innerHTML = remaining;
    }
  };
}
