export function diagnoseReading({ ohms, mode, lengthFeet, calculation }) {
  if (!Number.isFinite(ohms) || ohms <= 0 || !calculation.valid) {
    return {
      icon: "✓",
      label: "READY",
      level: "good",
      confidence: null,
      health: null,
      message: "Select a wire and enter a stable ohm reading.",
    };
  }

  if (mode === "ground") {
    if (ohms < 1000) {
      return {
        icon: "⚠",
        label: "GROUND FAULT",
        level: "bad",
        confidence: 92,
        health: 35,
        message: "Low resistance to ground. Inspect wet boxes, conduit edges, shields, drain wires, staples, metal contact, and device bases.",
      };
    }

    return {
      icon: "✓",
      label: "NORMAL",
      level: "good",
      confidence: 80,
      health: 92,
      message: "No low-resistance ground fault detected. If symptoms remain, check for stray voltage and device leakage.",
    };
  }

  const expectedOhms = calculation.loopOhmsPerFoot * lengthFeet;
  const lowLimit = expectedOhms * 0.8;
  const highLimit = expectedOhms * 1.2;

  if (ohms < 0.05) {
    return {
      icon: "⚠",
      label: "NEAR SHORT",
      level: "bad",
      confidence: 96,
      health: 25,
      message: "Very low resistance. Zero meter leads, then inspect the first boxes, terminations, crushed cable, or nearby device bases.",
    };
  }

  if (ohms >= lowLimit && ohms <= highLimit) {
    return {
      icon: "✓",
      label: "NORMAL",
      level: "good",
      confidence: 88,
      health: 96,
      message: "Reading is within the expected range for the length basis. This may be normal cable resistance or a far-end loop.",
    };
  }

  if (ohms < lowLimit) {
    return {
      icon: "⚠",
      label: "SHORT DETECTED",
      level: "bad",
      confidence: 90,
      health: 40,
      message: "Resistance is lower than expected. Inspect near the calculated distance and check splices, bases, appliances, and damaged cable.",
    };
  }

  return {
    icon: "◒",
    label: "RESISTIVE",
    level: "warn",
    confidence: 65,
    health: 58,
    message: "Resistance is higher than expected. Look for corrosion, water, bad splices, wrong wire type, connected devices, or partial opens.",
  };
}
