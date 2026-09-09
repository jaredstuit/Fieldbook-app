export const growers = [
  { id: "1", name: "Demo Grower", ranches: 2, fields: 7, acres: 284.6, lastVisit: "Sep 3, 2026" },
  { id: "2", name: "Valley Orchards", ranches: 3, fields: 11, acres: 421.2, lastVisit: "Aug 29, 2026" },
  { id: "3", name: "Westside Farming", ranches: 1, fields: 5, acres: 198.0, lastVisit: "Aug 24, 2026" }
];

export const demoField = {
  id: "field-1",
  grower: "Demo Grower",
  ranch: "River Ranch",
  name: "Block 7",
  acres: 42.3,
  crop: "Walnut",
  variety: "Tulare",
  rootstock: "Paradox",
  plantingYear: 2012,
  irrigation: "Double-line drip",
  waterSource: "Well #2",
  flags: ["Low leaf K", "Lesion nematodes", "High-HCO₃ water", "Moderate mite pressure"],
  soils: [
    ["Hanford sandy loam", "64%"],
    ["Tujunga loamy sand", "29%"],
    ["Other mapped units", "7%"]
  ],
  timeline: [
    ["Sep 3, 2026", "Field visit", "Mite pressure remains concentrated along west road; trees otherwise holding leaves well."],
    ["Aug 22, 2026", "Recommendation", "Late-season nutrition / mite follow-up recommendation uploaded."],
    ["Jul 17, 2026", "Tissue sample", "Leaf K 1.34%; N 2.41%; B 38 ppm; Zn 19 ppm."],
    ["Jun 30, 2026", "Observation", "West side showing earlier water stress than center rows."],
    ["Feb 12, 2026", "Water sample", "Well #2 water analysis added to field record."]
  ]
};
