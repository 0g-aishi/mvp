/**
 * Physics Settings Mapping
 * Maps 50 Live2D physics settings to AI-controllable parameters
 */

export const PHYSICS_SETTINGS_MAP = {
  // Settings 1-3: Basic head movement (Xx, Yy, Zz)
  "PhysicsSetting1": {
    name: "Xx",
    aiParam: "headMovement.x",
    description: "Head X-axis rotation"
  },
  "PhysicsSetting2": {
    name: "Yy", 
    aiParam: "headMovement.y",
    description: "Head Y-axis rotation"
  },
  "PhysicsSetting3": {
    name: "Zz",
    aiParam: "headMovement.z",
    description: "Head Z-axis tilt"
  },

  // Settings 4-7: Eye tracking (eyex, eyey)
  "PhysicsSetting4": {
    name: "eyex",
    aiParam: "eyeTracking.x",
    description: "Left eye X tracking"
  },
  "PhysicsSetting5": {
    name: "eyex(2)",
    aiParam: "eyeTracking.x",
    description: "Right eye X tracking"
  },
  "PhysicsSetting6": {
    name: "eyey",
    aiParam: "eyeTracking.y",
    description: "Left eye Y tracking"
  },
  "PhysicsSetting7": {
    name: "eyey(2)",
    aiParam: "eyeTracking.y",
    description: "Right eye Y tracking"
  },

  // Settings 8-17: Eye opening control
  "PhysicsSetting8": {
    name: "eye1",
    aiParam: "eyeOpening.left",
    description: "Left eye opening level 1"
  },
  "PhysicsSetting9": {
    name: "eye1(2)",
    aiParam: "eyeOpening.right",
    description: "Right eye opening level 1"
  },
  "PhysicsSetting10": {
    name: "eye2",
    aiParam: "eyeOpening.left",
    description: "Left eye opening level 2"
  },
  "PhysicsSetting11": {
    name: "eye2(2)",
    aiParam: "eyeOpening.right",
    description: "Right eye opening level 2"
  },
  "PhysicsSetting12": {
    name: "eye3",
    aiParam: "eyeOpening.left",
    description: "Left eye opening level 3"
  },
  "PhysicsSetting13": {
    name: "eye3(2)",
    aiParam: "eyeOpening.right",
    description: "Right eye opening level 3"
  },
  "PhysicsSetting14": {
    name: "eye4",
    aiParam: "eyeOpening.left",
    description: "Left eye opening level 4"
  },
  "PhysicsSetting15": {
    name: "eye4(2)",
    aiParam: "eyeOpening.right",
    description: "Right eye opening level 4"
  },
  "PhysicsSetting16": {
    name: "eye5",
    aiParam: "eyeOpening.left",
    description: "Left eye opening level 5"
  },
  "PhysicsSetting17": {
    name: "eye5(2)",
    aiParam: "eyeOpening.right",
    description: "Right eye opening level 5"
  },

  // Settings 18-21: Mouth control
  "PhysicsSetting18": {
    name: "mouth open",
    aiParam: "mouth.openness",
    description: "Mouth opening"
  },
  "PhysicsSetting19": {
    name: "mouth form",
    aiParam: "mouth.form",
    description: "Mouth shape"
  },
  "PhysicsSetting20": {
    name: "nose",
    aiParam: "specialFeatures.nose",
    description: "Nose movement"
  },
  "PhysicsSetting21": {
    name: "jaw",
    aiParam: "mouth.jawPosition",
    description: "Jaw position"
  },

  // Settings 22-29: Eyebrow control
  "PhysicsSetting22": {
    name: "眉毛yL",
    aiParam: "eyebrowMovement.leftY",
    description: "Left eyebrow Y position"
  },
  "PhysicsSetting23": {
    name: "眉毛yR",
    aiParam: "eyebrowMovement.rightY",
    description: "Right eyebrow Y position"
  },
  "PhysicsSetting24": {
    name: "眉毛yL angle",
    aiParam: "eyebrowMovement.leftForm",
    description: "Left eyebrow angle"
  },
  "PhysicsSetting25": {
    name: "眉毛yR angle",
    aiParam: "eyebrowMovement.rightForm",
    description: "Right eyebrow angle"
  },
  "PhysicsSetting26": {
    name: "眉毛L x",
    aiParam: "eyebrowMovement.leftX",
    description: "Left eyebrow X position"
  },
  "PhysicsSetting27": {
    name: "眉毛R x",
    aiParam: "eyebrowMovement.rightX",
    description: "Right eyebrow X position"
  },
  "PhysicsSetting28": {
    name: "眉毛L 变形",
    aiParam: "eyebrowMovement.leftForm",
    description: "Left eyebrow deformation"
  },
  "PhysicsSetting29": {
    name: "眉毛R 变形",
    aiParam: "eyebrowMovement.rightForm",
    description: "Right eyebrow deformation"
  },

  // Settings 30-33: Hair physics
  "PhysicsSetting30": {
    name: "頭髮1",
    aiParam: "hairDynamics.front",
    description: "Front hair physics 1"
  },
  "PhysicsSetting31": {
    name: "頭髮2",
    aiParam: "hairDynamics.side",
    description: "Side hair physics 2"
  },
  "PhysicsSetting32": {
    name: "頭髮11",
    aiParam: "hairDynamics.back",
    description: "Back hair physics (complex)"
  },
  "PhysicsSetting33": {
    name: "頭髮22",
    aiParam: "hairDynamics.back",
    description: "Back hair physics 2 (complex)"
  },

  // Settings 34-35: Hair accessories
  "PhysicsSetting34": {
    name: "蝴蝶结L",
    aiParam: "hairDynamics.accessories",
    description: "Left bow/ribbon"
  },
  "PhysicsSetting35": {
    name: "蝴蝶结R",
    aiParam: "hairDynamics.accessories",
    description: "Right bow/ribbon"
  },

  // Settings 36-40: Clothing and legs
  "PhysicsSetting36": {
    name: "衣服",
    aiParam: "bodyDynamics.clothing",
    description: "Clothing physics"
  },
  "PhysicsSetting37": {
    name: "写字",
    aiParam: "specialFeatures.writing",
    description: "Writing motion"
  },
  "PhysicsSetting38": {
    name: "腿",
    aiParam: "bodyDynamics.legs",
    description: "Leg movement 1"
  },
  "PhysicsSetting39": {
    name: "腿(2)",
    aiParam: "bodyDynamics.legs",
    description: "Leg movement 2"
  },
  "PhysicsSetting40": {
    name: "腿(3)",
    aiParam: "bodyDynamics.legs",
    description: "Leg movement 3"
  },

  // Settings 41-42: Animal ears
  "PhysicsSetting41": {
    name: "獸耳",
    aiParam: "specialFeatures.animalEars",
    description: "Left animal ear"
  },
  "PhysicsSetting42": {
    name: "獸耳R",
    aiParam: "specialFeatures.animalEars",
    description: "Right animal ear"
  },

  // Settings 43-44: Chest movement
  "PhysicsSetting43": {
    name: "胸x",
    aiParam: "bodyDynamics.chest",
    description: "Chest X movement"
  },
  "PhysicsSetting44": {
    name: "胸y",
    aiParam: "bodyDynamics.chest",
    description: "Chest Y movement"
  },

  // Settings 45-48: Skirt physics
  "PhysicsSetting45": {
    name: "裙子xz",
    aiParam: "bodyDynamics.skirt",
    description: "Skirt XZ movement"
  },
  "PhysicsSetting46": {
    name: "裙子",
    aiParam: "bodyDynamics.skirt",
    description: "Skirt general"
  },
  "PhysicsSetting47": {
    name: "裙子xz（繁）",
    aiParam: "bodyDynamics.skirt",
    description: "Skirt XZ complex"
  },
  "PhysicsSetting48": {
    name: "裙子y（繁）",
    aiParam: "bodyDynamics.skirt",
    description: "Skirt Y complex"
  },

  // Settings 49-50: Wings
  "PhysicsSetting49": {
    name: "翅膀左",
    aiParam: "specialFeatures.wings",
    description: "Left wing"
  },
  "PhysicsSetting50": {
    name: "翅膀右",
    aiParam: "specialFeatures.wings",
    description: "Right wing"
  }
};

// Parameter scaling and normalization
export const PHYSICS_PARAM_SCALING = {
  // Head movement uses full range
  "headMovement": {
    x: { min: -30, max: 30, scale: 1 },
    y: { min: -30, max: 30, scale: 1 },
    z: { min: -10, max: 10, scale: 1 }
  },
  
  // Body movement is more subtle
  "bodyMovement": {
    x: { min: -10, max: 10, scale: 1 },
    y: { min: -10, max: 10, scale: 1 },
    z: { min: -10, max: 10, scale: 1 }
  },
  
  // Eye tracking normalized to -1 to 1
  "eyeTracking": {
    x: { min: -1, max: 1, scale: 1 },
    y: { min: -1, max: 1, scale: 1 }
  },
  
  // Binary values 0 to 1
  "eyeOpening": {
    left: { min: 0, max: 1, scale: 1 },
    right: { min: 0, max: 1, scale: 1 }
  },
  
  // Eyebrow movement -1 to 1
  "eyebrowMovement": {
    leftY: { min: -1, max: 1, scale: 2 },
    rightY: { min: -1, max: 1, scale: 2 },
    leftForm: { min: -1, max: 1, scale: 1.5 },
    rightForm: { min: -1, max: 1, scale: 1.5 }
  },
  
  // Dynamic intensities 0 to 1
  "hairDynamics": {
    front: { min: 0, max: 1, scale: 35 },
    side: { min: 0, max: 1, scale: 35 },
    back: { min: 0, max: 1, scale: 17 },
    accessories: { min: 0, max: 1, scale: 25 }
  },
  
  "bodyDynamics": {
    chest: { min: 0, max: 1, scale: 35 },
    skirt: { min: 0, max: 1, scale: 30 },
    legs: { min: 0, max: 1, scale: 35 }
  },
  
  "specialFeatures": {
    animalEars: { min: 0, max: 1, scale: 30 },
    wings: { min: 0, max: 1, scale: 35 }
  }
};

// Physics combination presets
export const PHYSICS_EMOTION_PRESETS = {
  "shy": {
    headMovement: { x: 5, y: -10, z: 0 },
    eyeTracking: { x: 0.3, y: -0.3 },
    eyeOpening: { left: 0.7, right: 0.7 },
    eyebrowMovement: { leftY: -0.2, rightY: -0.2, leftForm: 0.3, rightForm: 0.3 },
    hairDynamics: { front: 0.2, side: 0.3, back: 0.2, accessories: 0.1 },
    bodyDynamics: { chest: 0.4, skirt: 0.1, legs: 0 },
    specialFeatures: { animalEars: 0.3, wings: 0 },
    breathing: 0.4
  },
  
  "excited": {
    headMovement: { x: 0, y: 5, z: 0 },
    eyeTracking: { x: 0, y: 0 },
    eyeOpening: { left: 1, right: 1 },
    eyebrowMovement: { leftY: 0.5, rightY: 0.5, leftForm: 0.7, rightForm: 0.7 },
    hairDynamics: { front: 0.6, side: 0.7, back: 0.8, accessories: 0.9 },
    bodyDynamics: { chest: 0.7, skirt: 0.5, legs: 0.3 },
    specialFeatures: { animalEars: 1, wings: 0.8 },
    breathing: 0.8
  },
  
  "thinking": {
    headMovement: { x: -5, y: 5, z: 3 },
    eyeTracking: { x: 0.5, y: 0.3 },
    eyeOpening: { left: 0.8, right: 0.8 },
    eyebrowMovement: { leftY: 0.1, rightY: -0.1, leftForm: 0, rightForm: -0.2 },
    hairDynamics: { front: 0.1, side: 0.1, back: 0.1, accessories: 0.1 },
    bodyDynamics: { chest: 0.3, skirt: 0, legs: 0 },
    specialFeatures: { animalEars: 0.6, wings: 0.1 },
    breathing: 0.3
  },
  
  "sad": {
    headMovement: { x: 0, y: -15, z: 0 },
    eyeTracking: { x: 0, y: -0.5 },
    eyeOpening: { left: 0.6, right: 0.6 },
    eyebrowMovement: { leftY: -0.5, rightY: -0.5, leftForm: -0.7, rightForm: -0.7 },
    hairDynamics: { front: 0.1, side: 0.1, back: 0.1, accessories: 0 },
    bodyDynamics: { chest: 0.3, skirt: 0, legs: 0 },
    specialFeatures: { animalEars: 0.1, wings: 0 },
    breathing: 0.25
  },
  
  "angry": {
    headMovement: { x: 0, y: 0, z: 0 },
    eyeTracking: { x: 0, y: 0.1 },
    eyeOpening: { left: 0.9, right: 0.9 },
    eyebrowMovement: { leftY: -0.7, rightY: -0.7, leftForm: -0.9, rightForm: -0.9 },
    hairDynamics: { front: 0.4, side: 0.5, back: 0.3, accessories: 0.6 },
    bodyDynamics: { chest: 0.6, skirt: 0.2, legs: 0.1 },
    specialFeatures: { animalEars: 0.2, wings: 0.3 },
    breathing: 0.7
  }
};