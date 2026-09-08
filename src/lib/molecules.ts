import { attach, benzene, chain, custom, ring, type Structure } from "./structure";

export type Difficulty = "intro" | "intermediate" | "challenge" | "advanced";

export type Topic =
  | "Alkanes"
  | "Branched alkanes"
  | "Cycloalkanes"
  | "Alkenes"
  | "Alkynes"
  | "Alcohols"
  | "Ethers"
  | "Aldehydes"
  | "Ketones"
  | "Carboxylic acids"
  | "Esters"
  | "Amines"
  | "Alkyl halides"
  | "Benzene derivatives"
  | "Phenols"
  | "Amides";

export type Molecule = {
  id: string;
  /** Canonical SMILES used for structure identity checking. */
  smiles: string;
  displayName: string;
  /** Systematic names accepted at all times. */
  iupacNames: string[];
  /** Trivial / common names, accepted when the instructor allows them. */
  commonNames: string[];
  difficulty: Difficulty;
  topic: Topic;
  hint: string;
  explanation: string;
  structure: Structure;
};

const O2 = { at: 1, els: ["O"], order: 2 as const, dir: -1 as const };

export const MOLECULES: Molecule[] = [
  // ---------------- Alkanes & branched alkanes ----------------
  {
    id: "pentane",
    smiles: "CCCCC",
    displayName: "pentane",
    iupacNames: ["pentane"],
    commonNames: ["n-pentane", "normal pentane"],
    difficulty: "intro",
    topic: "Alkanes",
    hint: "Count the carbons in the unbranched chain, then add the alkane ending -ane.",
    explanation:
      "Five carbons in a continuous, saturated chain: pent- for five carbons plus -ane for a single-bonded (saturated) hydrocarbon.",
    structure: chain(["C", "C", "C", "C", "C"]),
  },
  {
    id: "2-methylpropane",
    smiles: "CC(C)C",
    displayName: "2-methylpropane",
    iupacNames: ["2-methylpropane", "methylpropane"],
    commonNames: ["isobutane"],
    difficulty: "intro",
    topic: "Branched alkanes",
    hint: "The longest chain is only three carbons long; the fourth carbon is a branch.",
    explanation:
      "Longest chain = propane. A methyl branch sits on the middle carbon (C2), giving 2-methylpropane, known industrially as isobutane.",
    structure: chain(["C", "C", "C"], { subs: [{ at: 1, els: ["C"], dir: -1 }] }),
  },
  {
    id: "2-methylbutane",
    smiles: "CCC(C)C",
    displayName: "2-methylbutane",
    iupacNames: ["2-methylbutane"],
    commonNames: ["isopentane"],
    difficulty: "intermediate",
    topic: "Branched alkanes",
    hint: "Number the four-carbon chain from the end that reaches the branch first.",
    explanation:
      "The longest chain has four carbons (butane) with one methyl group. Numbering from the nearer end puts the methyl at C2, so it is 2-methylbutane (isopentane).",
    structure: chain(["C", "C", "C", "C"], { subs: [{ at: 2, els: ["C"], dir: -1 }] }),
  },
  {
    id: "22-dimethylpropane",
    smiles: "CC(C)(C)C",
    displayName: "2,2-dimethylpropane",
    iupacNames: ["2,2-dimethylpropane", "dimethylpropane"],
    commonNames: ["neopentane"],
    difficulty: "intermediate",
    topic: "Branched alkanes",
    hint: "One central carbon carries four methyl groups — the longest chain is only three carbons.",
    explanation:
      "A quaternary central carbon bearing four methyls. Longest chain = propane with two methyls on C2: 2,2-dimethylpropane, commonly neopentane.",
    structure: attach(
      chain(["C", "C", "C"], { subs: [{ at: 1, els: ["C"], dir: -1 }] }),
      1,
      "C",
      0,
      0.87,
    ),
  },
  {
    id: "23-dimethylpentane",
    smiles: "CCC(C)C(C)C",
    displayName: "2,3-dimethylpentane",
    iupacNames: ["2,3-dimethylpentane"],
    commonNames: [],
    difficulty: "challenge",
    topic: "Branched alkanes",
    hint: "Find the longest chain (five carbons) and number it to give the branches the lowest set of locants.",
    explanation:
      "Longest chain is pentane. Methyl groups on adjacent carbons get the locant set {2,3} rather than {3,4}, so the name is 2,3-dimethylpentane.",
    structure: chain(["C", "C", "C", "C", "C"], {
      subs: [
        { at: 1, els: ["C"], dir: -1 },
        { at: 2, els: ["C"], dir: 1 },
      ],
    }),
  },
  // ---------------- Cycloalkanes ----------------
  {
    id: "cyclohexane",
    smiles: "C1CCCCC1",
    displayName: "cyclohexane",
    iupacNames: ["cyclohexane"],
    commonNames: [],
    difficulty: "intro",
    topic: "Cycloalkanes",
    hint: "A closed ring of carbons uses the prefix cyclo-.",
    explanation: "Six carbons in a saturated ring: cyclo- + hex- + -ane.",
    structure: ring(6),
  },
  {
    id: "cyclopropane",
    smiles: "C1CC1",
    displayName: "cyclopropane",
    iupacNames: ["cyclopropane"],
    commonNames: [],
    difficulty: "intro",
    topic: "Cycloalkanes",
    hint: "Three carbons closed into the smallest possible ring.",
    explanation:
      "A three-membered saturated ring. Highly strained (60° bond angles), historically used as an anaesthetic.",
    structure: ring(3),
  },
  {
    id: "methylcyclopentane",
    smiles: "CC1CCCC1",
    displayName: "methylcyclopentane",
    iupacNames: ["methylcyclopentane"],
    commonNames: [],
    difficulty: "intermediate",
    topic: "Cycloalkanes",
    hint: "With only one substituent on a ring, no locant number is needed.",
    explanation:
      "A five-membered ring bearing one methyl group. A single substituent is automatically at C1, so no number appears in the name.",
    structure: ring(5, { subs: [{ at: 0, els: ["C"] }] }),
  },
  // ---------------- Alkenes ----------------
  {
    id: "ethene",
    smiles: "C=C",
    displayName: "ethene",
    iupacNames: ["ethene"],
    commonNames: ["ethylene"],
    difficulty: "intro",
    topic: "Alkenes",
    hint: "Two carbons joined by a double bond; the -ene ending signals the double bond.",
    explanation:
      "The simplest alkene: eth- (two carbons) + -ene (C=C). Its common name ethylene is still used throughout industry.",
    structure: chain(["C", "C"], { orders: { 0: 2 } }),
  },
  {
    id: "propene",
    smiles: "CC=C",
    displayName: "prop-1-ene",
    iupacNames: ["prop-1-ene", "propene", "1-propene"],
    commonNames: ["propylene"],
    difficulty: "intro",
    topic: "Alkenes",
    hint: "Number from the end nearest the double bond.",
    explanation:
      "Three carbons with the double bond between C1 and C2: prop-1-ene (commonly propylene). The locant is often dropped because no other position is possible.",
    structure: chain(["C", "C", "C"], { orders: { 1: 2 } }),
  },
  {
    id: "e-but-2-ene",
    smiles: "C/C=C/C",
    displayName: "(E)-but-2-ene",
    iupacNames: ["(E)-but-2-ene", "trans-but-2-ene", "(E)-2-butene", "trans-2-butene"],
    commonNames: [],
    difficulty: "challenge",
    topic: "Alkenes",
    hint: "The two methyl groups sit on opposite sides of the C=C — that is the E (trans) arrangement.",
    explanation:
      "Four carbons, double bond between C2 and C3. Higher-priority groups (the methyls) are on opposite sides, so the descriptor is E (entgegen), often written trans.",
    structure: custom(
      [
        ["C", 0, 0],
        ["C", 0.87, -0.5],
        ["C", 1.74, 0],
        ["C", 2.61, -0.5],
      ],
      [
        [0, 1],
        [1, 2, 2],
        [2, 3],
      ],
    ),
  },
  {
    id: "z-but-2-ene",
    smiles: "C/C=C\\C",
    displayName: "(Z)-but-2-ene",
    iupacNames: ["(Z)-but-2-ene", "cis-but-2-ene", "(Z)-2-butene", "cis-2-butene"],
    commonNames: [],
    difficulty: "challenge",
    topic: "Alkenes",
    hint: "Both methyl groups point to the same side of the double bond.",
    explanation:
      "Same skeleton as the E isomer, but the methyls are on the same side of the C=C, giving Z (zusammen), commonly labelled cis.",
    structure: custom(
      [
        ["C", 0, 0.5],
        ["C", 0.5, 0],
        ["C", 1.5, 0],
        ["C", 2.0, 0.5],
      ],
      [
        [0, 1],
        [1, 2, 2],
        [2, 3],
      ],
    ),
  },
  {
    id: "2-methylpropene",
    smiles: "CC(C)=C",
    displayName: "2-methylprop-1-ene",
    iupacNames: ["2-methylprop-1-ene", "2-methylpropene", "2-methyl-1-propene"],
    commonNames: ["isobutylene", "isobutene"],
    difficulty: "intermediate",
    topic: "Alkenes",
    hint: "The double bond gets the lowest locant, then the methyl branch is numbered from there.",
    explanation:
      "A three-carbon chain with the C=C at C1 and a methyl branch at C2: 2-methylprop-1-ene, known as isobutylene.",
    structure: chain(["C", "C", "C"], { orders: { 1: 2 }, subs: [{ at: 1, els: ["C"], dir: -1 }] }),
  },
  // ---------------- Alkynes ----------------
  {
    id: "ethyne",
    smiles: "C#C",
    displayName: "ethyne",
    iupacNames: ["ethyne"],
    commonNames: ["acetylene"],
    difficulty: "intro",
    topic: "Alkynes",
    hint: "A triple bond takes the ending -yne.",
    explanation:
      "Two carbons joined by a triple bond and drawn linear: ethyne, universally known as acetylene (welding gas).",
    structure: custom(
      [
        ["C", 0, 0],
        ["C", 1, 0],
      ],
      [[0, 1, 3]],
    ),
  },
  {
    id: "but-1-yne",
    smiles: "C#CCC",
    displayName: "but-1-yne",
    iupacNames: ["but-1-yne", "1-butyne"],
    commonNames: ["ethylacetylene"],
    difficulty: "challenge",
    topic: "Alkynes",
    hint: "Number so the triple bond starts at the lowest possible carbon.",
    explanation:
      "Four carbons with the triple bond between C1 and C2. The triple-bonded carbons are drawn linear, the rest zigzag.",
    structure: custom(
      [
        ["C", 0, 0],
        ["C", 1, 0],
        ["C", 2, 0],
        ["C", 2.87, -0.5],
      ],
      [
        [0, 1, 3],
        [1, 2],
        [2, 3],
      ],
    ),
  },
  // ---------------- Alcohols ----------------
  {
    id: "ethanol",
    smiles: "CCO",
    displayName: "ethanol",
    iupacNames: ["ethanol"],
    commonNames: ["ethyl alcohol", "grain alcohol"],
    difficulty: "intro",
    topic: "Alcohols",
    hint: "An -OH group on an alkane replaces the final -e with -ol.",
    explanation: "Two carbons plus a hydroxyl group: ethane becomes ethanol (ethyl alcohol).",
    structure: chain(["C", "C", "O"]),
  },
  {
    id: "propan-2-ol",
    smiles: "CC(C)O",
    displayName: "propan-2-ol",
    iupacNames: ["propan-2-ol", "2-propanol"],
    commonNames: ["isopropyl alcohol", "isopropanol", "rubbing alcohol"],
    difficulty: "intro",
    topic: "Alcohols",
    hint: "The OH sits on the middle carbon of a three-carbon chain.",
    explanation:
      "Three carbons with the hydroxyl on C2: propan-2-ol. Its common names are isopropyl alcohol and isopropanol.",
    structure: chain(["C", "C", "C"], { subs: [{ at: 1, els: ["O"], dir: -1 }] }),
  },
  {
    id: "cyclohexanol",
    smiles: "OC1CCCCC1",
    displayName: "cyclohexanol",
    iupacNames: ["cyclohexanol"],
    commonNames: [],
    difficulty: "intermediate",
    topic: "Alcohols",
    hint: "Combine the ring name with the alcohol suffix; a lone substituent needs no locant.",
    explanation:
      "A hydroxyl group on a cyclohexane ring. The carbon bearing OH is C1 by definition, so the name is simply cyclohexanol.",
    structure: ring(6, { subs: [{ at: 0, els: ["O"] }] }),
  },
  {
    id: "ethane-1-2-diol",
    smiles: "OCCO",
    displayName: "ethane-1,2-diol",
    iupacNames: ["ethane-1,2-diol", "1,2-ethanediol"],
    commonNames: ["ethylene glycol", "glycol"],
    difficulty: "intermediate",
    topic: "Alcohols",
    hint: "Two hydroxyl groups means the suffix -diol, and the final -e of the parent stays.",
    explanation:
      "Hydroxyls on both carbons of ethane: ethane-1,2-diol, the antifreeze known as ethylene glycol.",
    structure: chain(["O", "C", "C", "O"]),
  },
  // ---------------- Ethers ----------------
  {
    id: "ethoxyethane",
    smiles: "CCOCC",
    displayName: "ethoxyethane",
    iupacNames: ["ethoxyethane"],
    commonNames: ["diethyl ether", "ether"],
    difficulty: "intermediate",
    topic: "Ethers",
    hint: "In IUPAC ether names the smaller side becomes an alkoxy prefix on the larger parent chain.",
    explanation:
      "An oxygen bridging two ethyl groups. Systematically ethoxyethane; almost always called diethyl ether.",
    structure: chain(["C", "C", "O", "C", "C"]),
  },
  {
    id: "methoxymethane",
    smiles: "COC",
    displayName: "methoxymethane",
    iupacNames: ["methoxymethane"],
    commonNames: ["dimethyl ether"],
    difficulty: "intro",
    topic: "Ethers",
    hint: "One oxygen with a methyl group on each side.",
    explanation: "The simplest ether: methoxymethane, commonly dimethyl ether.",
    structure: chain(["C", "O", "C"]),
  },
  {
    id: "methoxybenzene",
    smiles: "COc1ccccc1",
    displayName: "methoxybenzene",
    iupacNames: ["methoxybenzene"],
    commonNames: ["anisole", "methyl phenyl ether"],
    difficulty: "challenge",
    topic: "Ethers",
    hint: "Benzene is the parent; the OCH3 group is named as a prefix.",
    explanation:
      "A methoxy group attached to a benzene ring: methoxybenzene, traditionally anisole.",
    structure: benzene([{ at: 0, els: ["O", "C"] }]),
  },
  // ---------------- Aldehydes ----------------
  {
    id: "ethanal",
    smiles: "CC=O",
    displayName: "ethanal",
    iupacNames: ["ethanal"],
    commonNames: ["acetaldehyde"],
    difficulty: "intro",
    topic: "Aldehydes",
    hint: "A C=O at the end of the chain uses the suffix -al.",
    explanation:
      "Two carbons with the carbonyl at the chain end: ethanal, commonly acetaldehyde. The aldehyde carbon is always C1.",
    structure: chain(["C", "C"], { subs: [{ at: 1, els: ["O"], order: 2, dir: -1 }] }),
  },
  {
    id: "propanal",
    smiles: "CCC=O",
    displayName: "propanal",
    iupacNames: ["propanal"],
    commonNames: ["propionaldehyde"],
    difficulty: "intermediate",
    topic: "Aldehydes",
    hint: "Three carbons with the carbonyl at the terminal position.",
    explanation: "Propane skeleton with a terminal C=O: propanal (propionaldehyde).",
    structure: chain(["C", "C", "C"], { subs: [{ at: 2, els: ["O"], order: 2, dir: 1 }] }),
  },
  {
    id: "benzaldehyde",
    smiles: "O=Cc1ccccc1",
    displayName: "benzaldehyde",
    iupacNames: ["benzenecarbaldehyde", "benzaldehyde"],
    commonNames: ["benzaldehyde", "oil of bitter almond"],
    difficulty: "intermediate",
    topic: "Aldehydes",
    hint: "An aldehyde group directly on a benzene ring keeps its retained name.",
    explanation:
      "A CHO group on benzene. IUPAC retains the name benzaldehyde (systematically benzenecarbaldehyde); it smells of almonds.",
    structure: attach(benzene([{ at: 0, els: ["C"] }]), 6, "O", 0.5, -0.75, 2),
  },
  // ---------------- Ketones ----------------
  {
    id: "propan-2-one",
    smiles: "CC(C)=O",
    displayName: "propan-2-one",
    iupacNames: ["propan-2-one", "2-propanone"],
    commonNames: ["acetone", "dimethyl ketone"],
    difficulty: "intro",
    topic: "Ketones",
    hint: "A carbonyl in the middle of the chain takes the suffix -one.",
    explanation:
      "Three carbons with the C=O on C2: propan-2-one, the solvent everyone calls acetone.",
    structure: chain(["C", "C", "C"], { subs: [O2] }),
  },
  {
    id: "butan-2-one",
    smiles: "CCC(C)=O",
    displayName: "butan-2-one",
    iupacNames: ["butan-2-one", "2-butanone"],
    commonNames: ["methyl ethyl ketone", "MEK"],
    difficulty: "intermediate",
    topic: "Ketones",
    hint: "Number the four-carbon chain so the carbonyl gets the lower locant.",
    explanation:
      "Four carbons with the carbonyl at C2: butan-2-one, sold as methyl ethyl ketone (MEK).",
    structure: chain(["C", "C", "C", "C"], { subs: [{ at: 1, els: ["O"], order: 2, dir: -1 }] }),
  },
  {
    id: "cyclohexanone",
    smiles: "O=C1CCCCC1",
    displayName: "cyclohexanone",
    iupacNames: ["cyclohexanone"],
    commonNames: [],
    difficulty: "intermediate",
    topic: "Ketones",
    hint: "A carbonyl carbon inside a ring is C1 automatically.",
    explanation:
      "Cyclohexane with one ring carbon oxidised to a carbonyl: cyclohexanone, a precursor to nylon.",
    structure: ring(6, { subs: [{ at: 0, els: ["O"], order: 2 }] }),
  },
  // ---------------- Carboxylic acids ----------------
  {
    id: "ethanoic-acid",
    smiles: "CC(=O)O",
    displayName: "ethanoic acid",
    iupacNames: ["ethanoic acid"],
    commonNames: ["acetic acid", "vinegar acid"],
    difficulty: "intro",
    topic: "Carboxylic acids",
    hint: "A COOH group gives the ending -oic acid.",
    explanation:
      "Two carbons ending in a carboxyl group: ethanoic acid, the acid in vinegar, commonly acetic acid.",
    structure: chain(["C", "C", "O"], { subs: [O2] }),
  },
  {
    id: "methanoic-acid",
    smiles: "OC=O",
    displayName: "methanoic acid",
    iupacNames: ["methanoic acid"],
    commonNames: ["formic acid"],
    difficulty: "intermediate",
    topic: "Carboxylic acids",
    hint: "Only one carbon in the whole molecule — and it is the carboxyl carbon.",
    explanation:
      "The simplest carboxylic acid: methanoic acid, better known as formic acid (ant venom).",
    structure: chain(["C", "O"], { subs: [{ at: 0, els: ["O"], order: 2, dir: -1 }] }),
  },
  {
    id: "benzoic-acid",
    smiles: "OC(=O)c1ccccc1",
    displayName: "benzoic acid",
    iupacNames: ["benzoic acid", "benzenecarboxylic acid"],
    commonNames: ["phenylmethanoic acid"],
    difficulty: "intermediate",
    topic: "Carboxylic acids",
    hint: "Carboxyl group attached straight to a benzene ring — the retained name is used.",
    explanation:
      "A COOH on benzene: benzoic acid, whose salts (benzoates) are common food preservatives.",
    structure: attach(
      attach(benzene([{ at: 0, els: ["C"] }]), 6, "O", 0.5, -0.75, 2),
      6,
      "O",
      -0.6,
      -0.7,
    ),
  },
  // ---------------- Esters ----------------
  {
    id: "ethyl-ethanoate",
    smiles: "CC(=O)OCC",
    displayName: "ethyl ethanoate",
    iupacNames: ["ethyl ethanoate"],
    commonNames: ["ethyl acetate"],
    difficulty: "intermediate",
    topic: "Esters",
    hint: "Name the alkyl group on oxygen first, then the acid part ending in -oate.",
    explanation:
      "Ester of ethanoic acid and ethanol. The O-alkyl group (ethyl) comes first, then the acyl part: ethyl ethanoate, i.e. ethyl acetate.",
    structure: chain(["C", "C", "O", "C", "C"], { subs: [O2] }),
  },
  {
    id: "methyl-methanoate",
    smiles: "COC=O",
    displayName: "methyl methanoate",
    iupacNames: ["methyl methanoate"],
    commonNames: ["methyl formate"],
    difficulty: "challenge",
    topic: "Esters",
    hint: "The acyl side has just one carbon.",
    explanation:
      "Ester of methanoic acid and methanol: methyl methanoate (methyl formate), a fruity-smelling liquid.",
    structure: chain(["C", "O", "C"], { subs: [{ at: 2, els: ["O"], order: 2, dir: 1 }] }),
  },
  // ---------------- Amines ----------------
  {
    id: "ethanamine",
    smiles: "CCN",
    displayName: "ethanamine",
    iupacNames: ["ethanamine", "ethylamine"],
    commonNames: ["ethylamine"],
    difficulty: "intro",
    topic: "Amines",
    hint: "An NH2 group on an alkane gives the suffix -amine.",
    explanation: "Two carbons plus a primary amine: ethanamine, also written ethylamine.",
    structure: chain(["C", "C", "N"]),
  },
  {
    id: "propan-2-amine",
    smiles: "CC(C)N",
    displayName: "propan-2-amine",
    iupacNames: ["propan-2-amine", "2-propanamine", "2-aminopropane"],
    commonNames: ["isopropylamine", "isopropyl amine"],
    difficulty: "intermediate",
    topic: "Amines",
    hint: "The nitrogen sits on the middle carbon of three.",
    explanation:
      "A primary amine on C2 of propane: propan-2-amine, commonly isopropylamine.",
    structure: chain(["C", "C", "C"], { subs: [{ at: 1, els: ["N"], dir: -1 }] }),
  },
  {
    id: "trimethylamine",
    smiles: "CN(C)C",
    displayName: "N,N-dimethylmethanamine",
    iupacNames: ["N,N-dimethylmethanamine"],
    commonNames: ["trimethylamine"],
    difficulty: "challenge",
    topic: "Amines",
    hint: "Substituents on nitrogen take the locant N, not a number.",
    explanation:
      "A tertiary amine with three methyls on nitrogen. Systematically N,N-dimethylmethanamine; the smell of spoiled fish is trimethylamine.",
    structure: attach(
      chain(["C", "N", "C"], { subs: [{ at: 1, els: ["C"], dir: 1 }] }),
      1,
      "C",
      0,
      -0.87,
    ),
  },
  {
    id: "aniline",
    smiles: "Nc1ccccc1",
    displayName: "aniline",
    iupacNames: ["aniline", "benzenamine", "phenylamine"],
    commonNames: ["aminobenzene"],
    difficulty: "intermediate",
    topic: "Amines",
    hint: "An NH2 group directly on benzene has its own retained name.",
    explanation:
      "Amino group on benzene: aniline (also accepted: phenylamine, benzenamine) — the parent of many dyes.",
    structure: benzene([{ at: 0, els: ["N"] }]),
  },
  // ---------------- Alkyl halides ----------------
  {
    id: "chloroethane",
    smiles: "CCCl",
    displayName: "chloroethane",
    iupacNames: ["chloroethane"],
    commonNames: ["ethyl chloride"],
    difficulty: "intro",
    topic: "Alkyl halides",
    hint: "Halogens are named as prefixes: fluoro-, chloro-, bromo-, iodo-.",
    explanation: "Ethane with one chlorine: chloroethane, also called ethyl chloride.",
    structure: chain(["C", "C", "Cl"]),
  },
  {
    id: "2-bromopropane",
    smiles: "CC(C)Br",
    displayName: "2-bromopropane",
    iupacNames: ["2-bromopropane"],
    commonNames: ["isopropyl bromide"],
    difficulty: "intermediate",
    topic: "Alkyl halides",
    hint: "The halogen is on the central carbon, so it needs a locant.",
    explanation:
      "Bromine on C2 of propane: 2-bromopropane, a secondary halide (isopropyl bromide).",
    structure: chain(["C", "C", "C"], { subs: [{ at: 1, els: ["Br"], dir: -1 }] }),
  },
  {
    id: "trichloromethane",
    smiles: "ClC(Cl)Cl",
    displayName: "trichloromethane",
    iupacNames: ["trichloromethane"],
    commonNames: ["chloroform"],
    difficulty: "intermediate",
    topic: "Alkyl halides",
    hint: "One carbon, three identical halogens — use a multiplying prefix.",
    explanation:
      "Methane with three chlorines: trichloromethane, historically used as chloroform.",
    structure: attach(
      chain(["Cl", "C", "Cl"], { subs: [{ at: 1, els: ["Cl"], dir: 1 }] }),
      1,
      "Cl",
      0,
      -0.87,
    ),
  },
  // ---------------- Benzene derivatives & phenols ----------------
  {
    id: "toluene",
    smiles: "Cc1ccccc1",
    displayName: "methylbenzene",
    iupacNames: ["methylbenzene"],
    commonNames: ["toluene", "phenylmethane"],
    difficulty: "intro",
    topic: "Benzene derivatives",
    hint: "One methyl group on a benzene ring.",
    explanation:
      "Benzene bearing a single methyl group: methylbenzene, universally known as toluene.",
    structure: benzene([{ at: 0, els: ["C"] }]),
  },
  {
    id: "14-dimethylbenzene",
    smiles: "Cc1ccc(C)cc1",
    displayName: "1,4-dimethylbenzene",
    iupacNames: ["1,4-dimethylbenzene", "para-dimethylbenzene", "p-dimethylbenzene"],
    commonNames: ["p-xylene", "para-xylene"],
    difficulty: "challenge",
    topic: "Benzene derivatives",
    hint: "Groups directly across the ring from each other are 1,4 (para).",
    explanation:
      "Two methyl groups in the para relationship: 1,4-dimethylbenzene, industrially p-xylene.",
    structure: benzene([
      { at: 0, els: ["C"] },
      { at: 3, els: ["C"] },
    ]),
  },
  {
    id: "styrene",
    smiles: "C=Cc1ccccc1",
    displayName: "ethenylbenzene",
    iupacNames: ["ethenylbenzene", "vinylbenzene"],
    commonNames: ["styrene"],
    difficulty: "challenge",
    topic: "Benzene derivatives",
    hint: "The two-carbon group attached to the ring contains a double bond.",
    explanation:
      "A vinyl (ethenyl) group on benzene: ethenylbenzene, the monomer styrene used to make polystyrene.",
    structure: attach(benzene([{ at: 0, els: ["C"] }]), 6, "C", 0.6, -0.7, 2),
  },
  {
    id: "phenol",
    smiles: "Oc1ccccc1",
    displayName: "phenol",
    iupacNames: ["phenol", "benzenol", "hydroxybenzene"],
    commonNames: ["carbolic acid"],
    difficulty: "intro",
    topic: "Phenols",
    hint: "An OH group bonded straight to an aromatic ring is not called an alcohol.",
    explanation:
      "Hydroxyl on benzene: phenol (also written benzenol / hydroxybenzene), weakly acidic unlike ordinary alcohols.",
    structure: benzene([{ at: 0, els: ["O"] }]),
  },
  {
    id: "4-methylphenol",
    smiles: "Cc1ccc(O)cc1",
    displayName: "4-methylphenol",
    iupacNames: ["4-methylphenol", "para-cresol", "p-methylphenol"],
    commonNames: ["p-cresol", "para-cresol"],
    difficulty: "challenge",
    topic: "Phenols",
    hint: "The OH carbon is C1 in a phenol; number the ring from there.",
    explanation:
      "Phenol with a methyl group para to the hydroxyl: 4-methylphenol, commonly p-cresol.",
    structure: benzene([
      { at: 0, els: ["O"] },
      { at: 3, els: ["C"] },
    ]),
  },
  // ---------------- Amides ----------------
  {
    id: "ethanamide",
    smiles: "CC(N)=O",
    displayName: "ethanamide",
    iupacNames: ["ethanamide"],
    commonNames: ["acetamide"],
    difficulty: "intermediate",
    topic: "Amides",
    hint: "A carbonyl bonded to nitrogen gives the suffix -amide.",
    explanation:
      "Two-carbon acyl group bonded to NH2: ethanamide, traditionally acetamide.",
    structure: chain(["C", "C", "N"], { subs: [O2] }),
  },
  {
    id: "methanamide",
    smiles: "NC=O",
    displayName: "methanamide",
    iupacNames: ["methanamide"],
    commonNames: ["formamide"],
    difficulty: "intermediate",
    topic: "Amides",
    hint: "The simplest amide — a single carbon.",
    explanation: "One carbon carrying both C=O and NH2: methanamide, commonly formamide.",
    structure: chain(["C", "N"], { subs: [{ at: 0, els: ["O"], order: 2, dir: -1 }] }),
  },
  {
    id: "n-methylethanamide",
    smiles: "CNC(C)=O",
    displayName: "N-methylethanamide",
    iupacNames: ["N-methylethanamide"],
    commonNames: ["N-methylacetamide"],
    difficulty: "challenge",
    topic: "Amides",
    hint: "A group on the amide nitrogen is labelled N-, not with a number.",
    explanation:
      "Ethanamide with a methyl on nitrogen: N-methylethanamide. The N- locant shows the substituent is on nitrogen, not carbon.",
    structure: chain(["C", "N", "C", "C"], { subs: [{ at: 2, els: ["O"], order: 2, dir: -1 }] }),
  },,

  // ---------------- Advanced priority & multi-substituent naming ----------------
  {
    id: "4-hydroxy-3-methylpentanal",
    smiles: "O=CCC(C)C(O)C",
    displayName: "4-hydroxy-3-methylpentanal",
    iupacNames: ["4-hydroxy-3-methylpentanal"],
    commonNames: [],
    difficulty: "advanced",
    topic: "Aldehydes",
    hint: "The aldehyde has higher naming priority than the alcohol, so use the -al suffix and name OH as hydroxy-.",
    explanation:
      "The terminal aldehyde carbon must be C1. The five-carbon parent is pentanal; the OH is a hydroxy substituent at C4 and the methyl branch is at C3.",
    structure: chain(["C", "C", "C", "C", "C"], {
      subs: [
        { at: 0, els: ["O"], order: 2, dir: -1 },
        { at: 2, els: ["C"], dir: -1 },
        { at: 3, els: ["O"], dir: 1 },
      ],
    }),
  },
  {
    id: "4-bromo-3-methylpentan-2-one",
    smiles: "CC(=O)C(C)C(Br)C",
    displayName: "4-bromo-3-methylpentan-2-one",
    iupacNames: ["4-bromo-3-methylpentan-2-one", "4-bromo-3-methyl-2-pentanone"],
    commonNames: [],
    difficulty: "advanced",
    topic: "Ketones",
    hint: "The ketone outranks the halogen and alkyl groups. Number from the end nearest C=O.",
    explanation:
      "The parent is pentan-2-one because the carbonyl receives the lowest locant. The remaining substituents are bromo at C4 and methyl at C3, alphabetized in the name.",
    structure: chain(["C", "C", "C", "C", "C"], {
      subs: [
        { at: 1, els: ["O"], order: 2, dir: -1 },
        { at: 2, els: ["C"], dir: 1 },
        { at: 3, els: ["Br"], dir: -1 },
      ],
    }),
  },
  {
    id: "5-bromo-4-methylhex-2-enal",
    smiles: "O=CC=CC(C)C(Br)C",
    displayName: "5-bromo-4-methylhex-2-enal",
    iupacNames: ["5-bromo-4-methylhex-2-enal", "5-bromo-4-methyl-2-hexenal"],
    commonNames: [],
    difficulty: "advanced",
    topic: "Aldehydes",
    hint: "Start numbering at the aldehyde carbon, then locate the alkene before naming the branches.",
    explanation:
      "The aldehyde controls the suffix and fixes C1. The parent is hex-2-enal, with a methyl substituent at C4 and bromo at C5.",
    structure: chain(["C", "C", "C", "C", "C", "C"], {
      orders: { 1: 2 },
      subs: [
        { at: 0, els: ["O"], order: 2, dir: -1 },
        { at: 3, els: ["C"], dir: 1 },
        { at: 4, els: ["Br"], dir: -1 },
      ],
    }),
  },
  {
    id: "5-chloro-6-hydroxy-4-methylhex-2-enal",
    smiles: "O=CC=CC(C)C(Cl)CO",
    displayName: "5-chloro-6-hydroxy-4-methylhex-2-enal",
    iupacNames: ["5-chloro-6-hydroxy-4-methylhex-2-enal", "5-chloro-6-hydroxy-4-methyl-2-hexenal"],
    commonNames: [],
    difficulty: "advanced",
    topic: "Aldehydes",
    hint: "An aldehyde still wins over an alcohol. List chloro, hydroxy, and methyl alphabetically after identifying the parent.",
    explanation:
      "A six-carbon aldehyde parent gives hex-2-enal. The OH is named hydroxy because aldehyde has priority; its substituents are 5-chloro, 6-hydroxy, and 4-methyl.",
    structure: chain(["C", "C", "C", "C", "C", "C"], {
      orders: { 1: 2 },
      subs: [
        { at: 0, els: ["O"], order: 2, dir: -1 },
        { at: 3, els: ["C"], dir: 1 },
        { at: 4, els: ["Cl"], dir: -1 },
        { at: 5, els: ["O"], dir: 1 },
      ],
    }),
  },
  {
    id: "6-hydroxy-5-methylhex-3-yn-2-one",
    smiles: "CC(=O)C#CC(C)CO",
    displayName: "6-hydroxy-5-methylhex-3-yn-2-one",
    iupacNames: ["6-hydroxy-5-methylhex-3-yn-2-one", "6-hydroxy-5-methyl-3-hexyn-2-one"],
    commonNames: [],
    difficulty: "advanced",
    topic: "Ketones",
    hint: "Choose the ketone as the suffix first; then include the triple-bond locant in the parent name.",
    explanation:
      "Numbering from the carbonyl end gives hex-3-yn-2-one. The alcohol is a hydroxy substituent at C6, and a methyl branch is at C5.",
    structure: chain(["C", "C", "C", "C", "C", "C"], {
      orders: { 2: 3 },
      subs: [
        { at: 1, els: ["O"], order: 2, dir: -1 },
        { at: 4, els: ["C"], dir: 1 },
        { at: 5, els: ["O"], dir: -1 },
      ],
    }),
  },
  {
    id: "4-hydroxy-3-3-dimethylpentanal",
    smiles: "O=CCC(C)(C)C(O)C",
    displayName: "4-hydroxy-3,3-dimethylpentanal",
    iupacNames: ["4-hydroxy-3,3-dimethylpentanal"],
    commonNames: [],
    difficulty: "advanced",
    topic: "Aldehydes",
    hint: "The aldehyde selects pentanal as the parent; two identical branches on C3 require the prefix di-.",
    explanation:
      "The aldehyde is the highest-priority functional group. Numbering from it gives pentanal, with hydroxy at C4 and two methyl groups at C3.",
    structure: chain(["C", "C", "C", "C", "C"], {
      subs: [
        { at: 0, els: ["O"], order: 2, dir: -1 },
        { at: 2, els: ["C"], dir: 1 },
        { at: 2, els: ["C"], dir: -1 },
        { at: 3, els: ["O"], dir: 1 },
      ],
    }),
  },
  {
    id: "5-chloro-6-methylhept-3-yn-2-one",
    smiles: "CC(=O)C#CC(Cl)C(C)C",
    displayName: "5-chloro-6-methylhept-3-yn-2-one",
    iupacNames: ["5-chloro-6-methylhept-3-yn-2-one", "5-chloro-6-methyl-3-heptyn-2-one"],
    commonNames: [],
    difficulty: "advanced",
    topic: "Ketones",
    hint: "Build the longest chain containing both the ketone and triple bond, then number toward the ketone.",
    explanation:
      "The seven-carbon parent is hept-3-yn-2-one. The ketone obtains C2, the alkyne is at C3, and the remaining substituents are 5-chloro and 6-methyl.",
    structure: chain(["C", "C", "C", "C", "C", "C", "C"], {
      orders: { 2: 3 },
      subs: [
        { at: 1, els: ["O"], order: 2, dir: -1 },
        { at: 4, els: ["Cl"], dir: 1 },
        { at: 5, els: ["C"], dir: -1 },
      ],
    }),
  },
  {
    id: "4-bromo-5-hydroxy-3-methylhex-2-enal",
    smiles: "O=CC=C(C)C(Br)C(O)C",
    displayName: "4-bromo-5-hydroxy-3-methylhex-2-enal",
    iupacNames: ["4-bromo-5-hydroxy-3-methylhex-2-enal", "4-bromo-5-hydroxy-3-methyl-2-hexenal"],
    commonNames: [],
    difficulty: "advanced",
    topic: "Aldehydes",
    hint: "Do not let the alcohol choose the suffix: aldehyde has priority. Once the parent is set, alphabetize bromo, hydroxy, and methyl.",
    explanation:
      "The aldehyde establishes a hex-2-enal parent. The substituents are bromo at C4, hydroxy at C5, and methyl at C3.",
    structure: chain(["C", "C", "C", "C", "C", "C"], {
      orders: { 1: 2 },
      subs: [
        { at: 0, els: ["O"], order: 2, dir: -1 },
        { at: 2, els: ["C"], dir: 1 },
        { at: 3, els: ["Br"], dir: -1 },
        { at: 4, els: ["O"], dir: 1 },
      ],
    }),
  },
];

export const DIFFICULTIES: Difficulty[] = ["intro", "intermediate", "challenge"];
