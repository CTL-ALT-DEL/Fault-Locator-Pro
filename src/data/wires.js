export const WIRE_DB = [
  { id: "awg14", name: "14 AWG solid copper", category: "Copper", gauge: "14", ohms1000: 2.525, tags: "14 awg copper solid" },
  { id: "awg16", name: "16 AWG solid copper", category: "Copper", gauge: "16", ohms1000: 4.016, tags: "16 awg copper solid" },
  { id: "awg18", name: "18 AWG solid copper", category: "Copper", gauge: "18", ohms1000: 6.385, tags: "18 awg copper solid" },
  { id: "awg22", name: "22 AWG solid copper", category: "Copper", gauge: "22", ohms1000: 16.14, tags: "22 awg copper solid" },
  { id: "awg24", name: "24 AWG solid copper", category: "Copper", gauge: "24", ohms1000: 25.67, tags: "24 awg copper solid" },

  { id: "fpl18-2", name: "18/2 FPL fire alarm", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "fire fpl fplr fplp 18/2 slc nac" },
  { id: "fpl18-4", name: "18/4 FPL fire alarm", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "fire fpl fplr fplp 18/4 speaker strobe" },
  { id: "fpl16-2", name: "16/2 FPL fire alarm", category: "Fire", gauge: "16", ohms1000: 4.1, tags: "fire fpl fplr fplp 16/2 nac" },
  { id: "fpl16-4", name: "16/4 FPL fire alarm", category: "Fire", gauge: "16", ohms1000: 4.1, tags: "fire fpl fplr fplp 16/4 speaker strobe" },
  { id: "fpl14-2", name: "14/2 FPL fire alarm", category: "Fire", gauge: "14", ohms1000: 2.6, tags: "fire fpl fplr fplp 14/2 nac" },
  { id: "fpl14-4", name: "14/4 FPL fire alarm", category: "Fire", gauge: "14", ohms1000: 2.6, tags: "fire fpl fplr fplp 14/4 speaker strobe" },
  { id: "shield18", name: "18/2 shielded SLC", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "fire shielded slc addressable drain 18/2" },
  { id: "shield22", name: "22/2 shielded data/SLC", category: "Fire", gauge: "22", ohms1000: 16.14, tags: "fire shielded data slc addressable drain 22/2" },
  { id: "fplp18-2", name: "18/2 FPLP plenum fire alarm", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "fire fplp plenum 18/2 slc nac" },
  { id: "fplp18-4", name: "18/4 FPLP plenum fire alarm", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "fire fplp plenum 18/4 speaker strobe" },
  { id: "fplp16-2", name: "16/2 FPLP plenum fire alarm", category: "Fire", gauge: "16", ohms1000: 4.1, tags: "fire fplp plenum 16/2 nac" },
  { id: "fplp16-4", name: "16/4 FPLP plenum fire alarm", category: "Fire", gauge: "16", ohms1000: 4.1, tags: "fire fplp plenum 16/4 speaker strobe" },
  { id: "nac12-2", name: "12/2 fire alarm NAC", category: "Fire", gauge: "custom", ohms1000: 1.8, tags: "fire nac 12/2 high current" },

  { id: "protect-phsc", name: "Protectowire PHSC", category: "Protectowire", gauge: "custom", ohmsPerFt: 0.185, tempCompensated: false, tags: "protectowire phsc linear heat detector" },
  { id: "protect-plr", name: "Protectowire PLR", category: "Protectowire", gauge: "custom", ohmsPerFt: 0.058, tempCompensated: false, tags: "protectowire plr low resistance linear heat detector" },
  { id: "protect-cti", name: "Protectowire CTI", category: "Protectowire", gauge: "custom", ohmsPerFt: 0.282, tempCompensated: false, tags: "protectowire cti linear heat detector" },

  { id: "cat5", name: "CAT5e 24 AWG pair", category: "Data", gauge: "24", ohms1000: 25.67, tags: "data cat cat5 cat5e ethernet network" },
  { id: "cat6", name: "CAT6 23 AWG pair", category: "Data", gauge: "custom", ohms1000: 20.36, tags: "data cat cat6 ethernet network" },

  { id: "belden-6200ue", name: "Belden 6200UE 18/2 FPLP", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "belden 6200ue fire fplp plenum 18/2 slc nac" },
  { id: "belden-6201ue", name: "Belden 6201UE 18/4 FPLP", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "belden 6201ue fire fplp plenum 18/4 speaker strobe" },
  { id: "genesis-18-2", name: "Honeywell Genesis 18/2 FPLP", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "honeywell genesis fire fplp plenum 18/2" },
  { id: "genesis-16-2", name: "Honeywell Genesis 16/2 FPLP", category: "Fire", gauge: "16", ohms1000: 4.1, tags: "honeywell genesis fire fplp plenum 16/2 nac" },
  { id: "westpenn-25225b", name: "West Penn 25225B 18/2 FPLP", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "west penn westpenn 25225b fire fplp plenum 18/2" },
  { id: "southwire-18-4", name: "Southwire 18/4 FPLP", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "southwire fire fplp plenum 18/4" },
  { id: "simplex-18-2", name: "Simplex-style 18/2 SLC", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "simplex fire slc 18/2 addressable" },
  { id: "notifier-18-2", name: "Notifier-style 18/2 SLC", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "notifier fire slc 18/2 addressable" },
  { id: "siemens-18-2", name: "Siemens-style 18/2 SLC", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "siemens fire slc 18/2 addressable" },
  { id: "est-18-2", name: "EST-style 18/2 SLC", category: "Fire", gauge: "18", ohms1000: 6.5, tags: "est edwards fire slc 18/2 addressable" },
  { id: "sec22", name: "22 AWG security/control", category: "Security", gauge: "22", ohms1000: 16.14, tags: "security alarm control 22/2 22/4" },
];

export function findWire(id) {
  return WIRE_DB.find(wire => wire.id === id);
}

export function searchWires(query = "") {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return WIRE_DB.filter(wire => {
    const haystack = `${wire.name} ${wire.category} ${wire.tags}`.toLowerCase();
    return tokens.length === 0 || tokens.every(token => haystack.includes(token));
  });
}
