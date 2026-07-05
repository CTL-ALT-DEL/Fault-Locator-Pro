const COPPER_ALPHA = 0.00393;

export function temperatureFactor(tempF) {
  const tempC = (tempF - 32) * 5 / 9;
  return 1 + COPPER_ALPHA * (tempC - 20);
}

export function calculateDistance({ ohms, wire, tempF = 68 }) {
  if (!Number.isFinite(ohms) || ohms <= 0 || !wire) {
    return { valid: false, distanceFeet: NaN, loopOhmsPerFoot: NaN };
  }

  const baseOhms1000 = wire.ohms1000 ?? wire.ohmsPerFt * 1000;
  const factor = wire.tempCompensated === false ? 1 : temperatureFactor(tempF);
  const conductorOhmsPerFoot = (baseOhms1000 / 1000) * factor;
  const loopOhmsPerFoot = wire.ohmsPerFt ? conductorOhmsPerFoot : conductorOhmsPerFoot * 2;
  const distanceFeet = ohms / loopOhmsPerFoot;

  return {
    valid: true,
    distanceFeet,
    loopOhmsPerFoot,
    conductorOhmsPerFoot,
    tempFactor: factor,
  };
}
