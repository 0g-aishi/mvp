/**
 * Complete Parameter Definitions for 水母 Live2D Model
 *
 * Extracted from physics3.json normalization ranges and cdi3.json parameter mappings
 * Total: 127+ parameters with accurate min/max ranges
 */

export type ParameterCategory =
  | 'Head Movement'
  | 'Body Movement'
  | 'Eye Control'
  | 'Eyebrows'
  | 'Mouth'
  | 'Breathing'
  | 'Hair Physics'
  | 'Body Dynamics'
  | 'Special Features'
  | 'Facial Details'
  | 'Other';

export interface ParameterDefinition {
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  category: ParameterCategory;
  description?: string;
  unit?: string;
}

/**
 * Complete Parameter Database
 * Ranges extracted from 水母.physics3.json Normalization sections
 */
export const PARAMETER_DEFINITIONS: Record<string, ParameterDefinition> = {
  // ============================================================
  // HEAD MOVEMENT (Foundation - Settings 1-3)
  // ============================================================
  'ParamAngleX': {
    label: 'Head X (Left/Right Turn)',
    min: -30,
    max: 30,
    step: 0.5,
    default: 0,
    category: 'Head Movement',
    description: 'Head rotation on X-axis',
    unit: '°'
  },
  'ParamAngleY': {
    label: 'Head Y (Up/Down Tilt)',
    min: -30,
    max: 30,
    step: 0.5,
    default: 0,
    category: 'Head Movement',
    description: 'Head rotation on Y-axis',
    unit: '°'
  },
  'ParamAngleZ': {
    label: 'Head Z (Side Lean)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Head Movement',
    description: 'Head tilt on Z-axis',
    unit: '°'
  },

  // ============================================================
  // BODY MOVEMENT (Settings implied in physics)
  // ============================================================
  'ParamBodyAngleX': {
    label: 'Body X (Lean Left/Right)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Body Movement',
    description: 'Body lean on X-axis',
    unit: '°'
  },
  'ParamBodyAngleY': {
    label: 'Body Y (Lean Forward/Back)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Body Movement',
    description: 'Body lean on Y-axis',
    unit: '°'
  },
  'ParamBodyAngleZ': {
    label: 'Body Z (Twist)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Body Movement',
    description: 'Body twist on Z-axis',
    unit: '°'
  },

  // ============================================================
  // EYE CONTROL (Settings 4-17 + VTS mappings)
  // ============================================================
  'ParamEyeBallX': {
    label: 'Eye Gaze X',
    min: -1,
    max: 1,
    step: 0.01,
    default: 0,
    category: 'Eye Control',
    description: 'Horizontal eye gaze direction'
  },
  'ParamEyeBallY': {
    label: 'Eye Gaze Y',
    min: -1,
    max: 1,
    step: 0.01,
    default: 0,
    category: 'Eye Control',
    description: 'Vertical eye gaze direction'
  },
  'ParamEyeLOpen': {
    label: 'Left Eye Open',
    min: 0,
    max: 1.9,
    step: 0.05,
    default: 1,
    category: 'Eye Control',
    description: 'Left eye opening level (VTS amplified)'
  },
  'ParamEyeROpen': {
    label: 'Right Eye Open',
    min: 0,
    max: 1.9,
    step: 0.05,
    default: 1,
    category: 'Eye Control',
    description: 'Right eye opening level (VTS amplified)'
  },
  'ParamEyeLSmile': {
    label: 'Left Eye Smile',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eye Control',
    description: 'Left eye squinting when smiling'
  },
  'ParamEyeRSmile': {
    label: 'Right Eye Smile',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eye Control',
    description: 'Right eye squinting when smiling'
  },

  // ============================================================
  // EYEBROWS (Settings 22-29, Normalization: ±60-65)
  // ============================================================
  'ParamBrowLY': {
    label: 'Left Eyebrow Y',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Left eyebrow vertical position'
  },
  'ParamBrowRY': {
    label: 'Right Eyebrow Y',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Right eyebrow vertical position'
  },
  'ParamBrowLForm': {
    label: 'Left Eyebrow Form',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Left eyebrow shape deformation'
  },
  'ParamBrowRForm': {
    label: 'Right Eyebrow Form',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Right eyebrow shape deformation'
  },
  'ParamBrowLAngle': {
    label: 'Left Eyebrow Angle',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Left eyebrow rotation angle'
  },
  'ParamBrowRAngle': {
    label: 'Right Eyebrow Angle',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Right eyebrow rotation angle'
  },

  // ============================================================
  // MOUTH CONTROL (Settings 18-21, VTS amplified)
  // ============================================================
  'ParamMouthOpenY': {
    label: 'Mouth Open',
    min: 0,
    max: 2.1,
    step: 0.05,
    default: 0,
    category: 'Mouth',
    description: 'Mouth opening amount (VTS amplified to 2.1)'
  },
  'ParamMouthForm': {
    label: 'Mouth Form (Smile)',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Mouth',
    description: 'Mouth shape: -1=frown, 0=neutral, 1=smile'
  },

  // ============================================================
  // BREATHING & CHEEK (Settings 8, cdi3.json)
  // ============================================================
  'ParamBreath': {
    label: 'Breathing Intensity',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.5,
    category: 'Breathing',
    description: 'Automatic breathing effect (affects chest, body)'
  },
  'ParamCheek': {
    label: 'Cheek Puff',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Mouth',
    description: 'Cheek inflation (blush effect from smiling)'
  },

  // ============================================================
  // HAIR PHYSICS - MAIN GROUPS (Settings 30-33, Scale: 35, 17)
  // ============================================================
  'Param21': {
    label: 'Front Hair 1 (刘海1)',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Hair Physics',
    description: 'Front hair strand 1 movement'
  },
  'Param22': {
    label: 'Front Hair 2 (刘海2)',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Hair Physics',
    description: 'Front hair strand 2 movement'
  },
  'Param23': {
    label: 'Front Hair 3 (刘海3)',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Hair Physics',
    description: 'Front hair strand 3 movement'
  },
  'Param24': {
    label: 'Side Hair 1',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Hair Physics',
    description: 'Side hair strand 1 movement'
  },
  'Param25': {
    label: 'Side Hair 2',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Hair Physics',
    description: 'Side hair strand 2 movement'
  },
  'Param26': {
    label: 'Side Hair 3',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Hair Physics',
    description: 'Side hair strand 3 movement'
  },

  // ============================================================
  // BODY DYNAMICS (Settings 36, 43-48)
  // ============================================================
  'Param27': {
    label: 'Skirt XZ Movement',
    min: -45,
    max: 45,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt horizontal/depth movement'
  },
  'Param28': {
    label: 'Skirt XZ 2',
    min: -45,
    max: 45,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt alternate XZ movement'
  },
  'Param29': {
    label: 'Skirt Y Movement',
    min: -45,
    max: 45,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt vertical movement'
  },
  'Param45': {
    label: 'Chest X Movement',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Chest horizontal movement (胸x)'
  },
  'Param46': {
    label: 'Chest Y Movement',
    min: -40,
    max: 40,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Chest vertical movement (胸y)'
  },
  'Param47': {
    label: 'Chest Y 2',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Chest secondary Y movement'
  },
  'Param48': {
    label: 'Clothing Physics',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Upper clothing movement (衣服)'
  },
  'Param49': {
    label: 'Clothing Physics 2',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Secondary clothing movement'
  },
  'Param108': {
    label: 'Leg Movement 1',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Primary leg physics (腿)'
  },
  'Param109': {
    label: 'Leg Movement 2',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Secondary leg physics (腿2)'
  },
  'Param110': {
    label: 'Leg Movement 3',
    min: -35,
    max: 35,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Tertiary leg physics (腿3)'
  },

  // ============================================================
  // SPECIAL FEATURES - EARS (Settings 41-42, Normalization: ±57.3)
  // ============================================================
  'Param33': {
    label: 'Left Ear 1 (獸耳L)',
    min: -57,
    max: 57,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Left beast ear primary movement'
  },
  'Param34': {
    label: 'Left Ear 2',
    min: -20,
    max: 20,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Left beast ear secondary movement'
  },
  'Param35': {
    label: 'Right Ear 1 (獸耳R)',
    min: -57,
    max: 57,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Right beast ear primary movement'
  },
  'Param36': {
    label: 'Right Ear 2',
    min: -20,
    max: 20,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Right beast ear secondary movement'
  },

  // ============================================================
  // SPECIAL FEATURES - WINGS (Settings 49-50, Scale: 35, Normalization: ±50)
  // ============================================================
  'Param117': {
    label: 'Wings Physics 1 (写字物理1)',
    min: 0,
    max: 35,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Wing movement physics primary'
  },
  'Param118': {
    label: 'Wings Physics 2 (写字物理2)',
    min: 0,
    max: 35,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Wing movement physics secondary'
  },

  // ============================================================
  // FACIAL DETAILS - LEFT EYE (Settings 8-17, cdi3.json Param5-17)
  // ============================================================
  'Param5': {
    label: 'Left Iris Membrane X (瞳膜X)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eye iris membrane horizontal position'
  },
  'Param6': {
    label: 'Left Iris Membrane Y (瞳膜Y)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eye iris membrane vertical position'
  },
  'Param7': {
    label: 'Left Iris Shape 1 (虹膜形状1)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eye iris shape deformation 1'
  },
  'Param8': {
    label: 'Left Eye Socket Shape 1 (眼眶形状1)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eye socket shape 1'
  },
  'Param9': {
    label: 'Left Pupil Size (瞳孔大小)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left pupil dilation'
  },
  'Param10': {
    label: 'Left Iris Shape 2 (虹膜形状2)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eye iris shape deformation 2'
  },
  'Param11': {
    label: 'Left Pupil Size 2 (小幅度)',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left pupil size fine adjustment'
  },
  'Param12': {
    label: 'Left Eye Socket Shape 2',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eye socket shape 2'
  },
  'Param13': {
    label: 'Left Eye Corner Movement',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Front/back eye corner up/down (前后眼角上下)'
  },
  'Param14': {
    label: 'Left Eyelash Movement 1',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eyelash amplitude motion 1 (睫毛幅动1)'
  },
  'Param15': {
    label: 'Left Eyelash Movement 2',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eyelash amplitude motion 2 (睫毛幅动2)'
  },
  'Param16': {
    label: 'Left Eye Highlight Scale',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eye highlight scaling (高光缩放)'
  },
  'Param17': {
    label: 'Left Eye Highlight Rotation',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Left eye highlight rotation (高光旋转)'
  },

  // ============================================================
  // FACIAL DETAILS - RIGHT EYE (Param39-72, symmetric to left)
  // ============================================================
  'Param39': {
    label: 'Right Iris Membrane X',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eye iris membrane horizontal position'
  },
  'Param40': {
    label: 'Right Iris Membrane Y',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eye iris membrane vertical position'
  },
  'Param50': {
    label: 'Right Iris Shape 1',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eye iris shape deformation 1'
  },
  'Param53': {
    label: 'Right Iris Shape 2',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eye iris shape deformation 2'
  },
  'Param55': {
    label: 'Right Pupil Size',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right pupil dilation'
  },
  'Param56': {
    label: 'Right Pupil Size 2',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right pupil size fine adjustment'
  },
  'Param57': {
    label: 'Right Eye Socket Shape 1',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eye socket shape 1'
  },
  'Param65': {
    label: 'Right Eye Socket Shape 2',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eye socket shape 2'
  },
  'Param66': {
    label: 'Right Eye Corner Movement',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right front/back eye corner up/down'
  },
  'Param67': {
    label: 'Right Eyelash Movement 1',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eyelash amplitude motion 1'
  },
  'Param68': {
    label: 'Right Eyelash Movement 2',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eyelash amplitude motion 2'
  },
  'Param71': {
    label: 'Right Eye Highlight Rotation',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eye highlight rotation'
  },
  'Param72': {
    label: 'Right Eye Highlight Scale',
    min: -10,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Facial Details',
    description: 'Right eye highlight scaling'
  },

  // ============================================================
  // ADDITIONAL FACIAL PARAMS (from cdi3.json)
  // ============================================================
  'Param59': {
    label: 'Mouth X Position (歪嘴)',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Mouth',
    description: 'Mouth horizontal asymmetry'
  },
  'Param58': {
    label: 'Cheek Puff (鼓嘴)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Mouth',
    description: 'Cheek inflation amount'
  },
  'Param31': {
    label: 'Mouth Pucker (努嘴)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Mouth',
    description: 'Lip pucker/pout amount'
  },
  'Param76': {
    label: 'Chin Position (下巴)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Mouth',
    description: 'Jaw/chin vertical position'
  },
  'Param70': {
    label: 'Mouth Height Physics',
    min: -50,
    max: 50,
    step: 1,
    default: 0,
    category: 'Mouth',
    description: 'Mouth vertical position physics (嘴巴高低物理)'
  },
  'Param74': {
    label: 'Mouth Width Physics',
    min: -50,
    max: 50,
    step: 1,
    default: 0,
    category: 'Mouth',
    description: 'Mouth horizontal expansion physics (嘴巴收放物理)'
  },
  'Param75': {
    label: 'Nose Physics',
    min: -50,
    max: 50,
    step: 1,
    default: 0,
    category: 'Facial Details',
    description: 'Nose movement physics (鼻子p)'
  },
  'Param93': {
    label: 'Jaw Physics',
    min: -50,
    max: 50,
    step: 1,
    default: 0,
    category: 'Mouth',
    description: 'Jaw movement physics'
  },

  // ============================================================
  // SPECIAL ACCESSORY PARAMS (from cdi3.json - button animations)
  // ============================================================
  'Param114': {
    label: 'Writing X (书写x)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Writing board horizontal position (mouse controlled in VTS)'
  },
  'Param115': {
    label: 'Writing Y (书写y)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Writing board vertical position (mouse controlled in VTS)'
  },
  'Param116': {
    label: 'Writing Press (摁动)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Special Features',
    description: 'Writing board press intensity'
  },

  // ============================================================
  // TEAR ANIMATION (Settings 9, cdi3.json Param30, 32, 37, 38)
  // ============================================================
  'Param30': {
    label: 'Tear Flow 1 (1流下)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Facial Details',
    description: 'First tear drop flow animation'
  },
  'Param32': {
    label: 'Tear Flow 2 (2流下)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Facial Details',
    description: 'Second tear drop flow animation'
  },
  'Param37': {
    label: 'Tear Switch 1 (1开关)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Facial Details',
    description: 'Tear visibility toggle 1'
  },
  'Param38': {
    label: 'Tear Switch 2 (1开关)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Facial Details',
    description: 'Tear visibility toggle 2'
  },

  // ============================================================
  // ADDITIONAL EYEBROW PHYSICS (cdi3.json secondary params)
  // ============================================================
  'ParamBrowLY2': {
    label: 'Left Eyebrow Y Physics',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Left eyebrow Y position (physics-driven)'
  },
  'ParamBrowRY2': {
    label: 'Right Eyebrow Y Physics',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Right eyebrow Y position (physics-driven)'
  },
  'ParamBrowLAngle2': {
    label: 'Left Eyebrow Sadness Angle',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Left eyebrow sad expression angle (委屈)'
  },
  'ParamBrowRAngle2': {
    label: 'Right Eyebrow Sadness Angle',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Right eyebrow sad expression angle (委屈)'
  },
  'ParamBrowLForm2': {
    label: 'Left Eyebrow X Position',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Left eyebrow horizontal position (左眉左右)'
  },
  'ParamBrowRForm2': {
    label: 'Right Eyebrow X Position',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Right eyebrow horizontal position'
  },
  'ParamBrowLAngle3': {
    label: 'Left Eyebrow Frown',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Left eyebrow furrowing (皱眉)'
  },
  'ParamBrowRForm3': {
    label: 'Right Eyebrow Frown',
    min: -1,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Eyebrows',
    description: 'Right eyebrow furrowing (皱眉)'
  },

  // ============================================================
  // SPECIAL ANIMATION PARAMS (from cdi3.json and motion3.json)
  // ============================================================
  'Param77': {
    label: 'Anger Animation (生气)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Anger mark animation trigger'
  },
  'Param78': {
    label: 'Spiral Eye Rotation (圈圈眼旋转)',
    min: 0,
    max: 10,
    step: 0.5,
    default: 0,
    category: 'Other',
    description: 'Dizzy eyes spiral rotation speed'
  },
  'Param82': {
    label: 'Special Effect 1',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Special visual effect parameter 1'
  },
  'Param87': {
    label: 'Special Effect 2',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Special visual effect parameter 2'
  },
  'Param91': {
    label: 'Special Effect 3',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Special visual effect parameter 3'
  },
  'Param92': {
    label: 'Special Effect 4',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Special visual effect parameter 4'
  },

  // ============================================================
  // ADDITIONAL BODY DYNAMICS (from cdi3.json)
  // ============================================================
  'Param79': {
    label: 'Skirt XZ 1 (裙xz1)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt XZ complex movement 1'
  },
  'Param80': {
    label: 'Skirt XZ 2 (裙xz2)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt XZ complex movement 2'
  },
  'Param81': {
    label: 'Skirt XZ 3 (裙xz3)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt XZ complex movement 3'
  },
  'Param83': {
    label: 'Skirt Y 1 (裙y1)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt Y complex movement 1'
  },
  'Param84': {
    label: 'Skirt X 4 (裙x4)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt X complex movement 4'
  },
  'Param85': {
    label: 'Skirt X 5 (裙x5)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt X complex movement 5'
  },
  'Param86': {
    label: 'Skirt X 6 (裙x6)',
    min: -20,
    max: 20,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt X complex movement 6'
  },
  'Param88': {
    label: 'Skirt Y 3 (裙y3)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt Y complex movement 3'
  },
  'Param89': {
    label: 'Skirt Y 2 (裙y2)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt Y complex movement 2'
  },
  'Param90': {
    label: 'Skirt Y 4 (裙y4)',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Body Dynamics',
    description: 'Skirt Y complex movement 4'
  },

  // ============================================================
  // EXPRESSION TRIGGER PARAMS (from cdi3.json - button animations)
  // These are typically controlled by .exp3.json files but can be manual
  // ============================================================
  'Param': {
    label: 'Love Eyes Effect (爱心眼)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Heart eyes expression intensity'
  },
  'Param2': {
    label: 'Tears Effect (眼泪)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Crying tears effect'
  },
  'Param4': {
    label: 'Starry Eyes Effect (星星眼)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Star eyes expression intensity'
  },
  'Param20': {
    label: 'Wings Visible (翅膀)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Wings visibility'
  },
  'Param41': {
    label: 'Swirl Eyes Effect (蚊香眼)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Dizzy/spiral eyes effect'
  },
  'Param42': {
    label: 'Microphone Visible (麦克风)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Microphone item visibility'
  },
  'Param43': {
    label: 'Dark Face Effect (黑脸)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Dark/gloomy face effect'
  },
  'Param44': {
    label: 'Halo Visible (光环)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Halo accessory visibility'
  },
  'Param51': {
    label: 'Wings Toggle (翅膀切换)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Wings type toggle (white/black)'
  },
  'Param52': {
    label: 'Angry Effect (生气)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Angry expression effect'
  },
  'Param54': {
    label: 'Blank Eyes Effect (空白眼)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Blank/empty eyes effect'
  },
  'Param60': {
    label: 'Gaming Console Visible (游戏机)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Game controller item visibility'
  },
  'Param61': {
    label: 'Left Ear Sub-Param 3',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Left beast ear sub-parameter 3'
  },
  'Param62': {
    label: 'Left Ear Sub-Param 4',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Left beast ear sub-parameter 4'
  },
  'Param63': {
    label: 'Right Ear Sub-Param 3',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Right beast ear sub-parameter 3'
  },
  'Param64': {
    label: 'Right Ear Sub-Param 4',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Special Features',
    description: 'Right beast ear sub-parameter 4'
  },
  'Param69': {
    label: 'Head Z Physics (Z)',
    min: -42,
    max: 42,
    step: 1,
    default: 0,
    category: 'Head Movement',
    description: 'Head Z-axis physics (from Setting3)'
  },
  'Param73': {
    label: 'Jacket Toggle (换衣服)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 1,
    category: 'Other',
    description: 'Jacket/coat clothing visibility'
  },
  'Param96': {
    label: 'Eyepatch Visible (眼罩)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Eye patch accessory visibility'
  },
  'Param111': {
    label: 'Tea Cup Visible (茶杯)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Tea cup item visibility'
  },
  'Param112': {
    label: 'Writing Board Visible (记事板)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Writing board item visibility'
  },
  'Param113': {
    label: 'Heart Gesture Visible (比心)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Heart gesture hand pose visibility'
  },
  'Param119': {
    label: 'Flowers Visible (花花)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Flower hair decoration visibility'
  },
  'Param120': {
    label: 'Cross Pin Visible (十字架发夹)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Cross-shaped hair pin visibility'
  },
  'Param121': {
    label: 'Line Pin Visible (一字发夹)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Line-shaped hair pin visibility'
  },
  'Param122': {
    label: 'Bow Visible (蝴蝶结)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Butterfly bow visibility'
  },
  'Param123': {
    label: 'Cat Ears Visible (猫耳)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Cat ears accessory visibility'
  },
  'Param124': {
    label: 'Devil Horns Visible (恶魔角)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Devil horns accessory visibility'
  },
  'Param125': {
    label: 'Halo Color Change (光环换色)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Halo color transformation'
  },
  'Param126': {
    label: 'Blush Effect (脸红)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Face blush effect intensity'
  },
  'Param127': {
    label: 'Watermark Visible (水印)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Watermark overlay visibility'
  },

  // ============================================================
  // COLOR CHANGE SYSTEM (换色 - 8 parameters from cdi3.json)
  // ============================================================
  'Param94': {
    label: 'Left Eye Color (左眼颜色)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Left eye color transformation'
  },
  'Param95': {
    label: 'Right Eye Color (右眼颜色)',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Right eye color transformation'
  },
  'Param97': {
    label: 'Left Eye Socket Color',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Left eye socket color (左眼眼眶颜色)'
  },
  'Param98': {
    label: 'Right Eye Socket Color',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Right eye socket color (右眼眼眶颜色)'
  },
  'Param99': {
    label: 'Left Tear Mole',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Left tear mole visibility (左眼泪痣)'
  },
  'Param100': {
    label: 'Right Tear Mole',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Right tear mole visibility (右眼泪痣)'
  },
  'Param101': {
    label: 'Left Fang',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Left fang visibility (左虎牙)'
  },
  'Param102': {
    label: 'Right Fang',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Right fang visibility (右虎牙)'
  },
  'Param103': {
    label: 'Cat Mouth Toggle',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Cat-style mouth switch (猫猫嘴切换)'
  },
  'Param104': {
    label: 'Erase Block Cancel',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Cancel erase block (取消擦除块)'
  },
  'Param105': {
    label: 'Front Hair Color',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Front hair color transformation (前发颜色)'
  },
  'Param106': {
    label: 'Ahoge Hair Color',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Ahoge (antenna hair) color (呆毛颜色)'
  },
  'Param107': {
    label: 'Back Hair Color',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0,
    category: 'Other',
    description: 'Back hair color transformation (后发颜色)'
  },

  // NOTE: Param18, Param19 from physics analysis (outputs from Setting1-2)
  'Param18': {
    label: 'Physics Output X',
    min: -30,
    max: 30,
    step: 1,
    default: 0,
    category: 'Hair Physics',
    description: 'Head X physics output (PhysicsSetting1 Scale:30)'
  },
  'Param19': {
    label: 'Physics Output Y',
    min: -32,
    max: 32,
    step: 1,
    default: 0,
    category: 'Hair Physics',
    description: 'Head Y physics output (PhysicsSetting2 Scale:32)'
  }
};

/**
 * Get all parameters in a specific category
 */
export function getParametersByCategory(category: ParameterCategory): Record<string, ParameterDefinition> {
  return Object.fromEntries(
    Object.entries(PARAMETER_DEFINITIONS).filter(
      ([_, def]) => def.category === category
    )
  );
}

/**
 * Get list of all categories
 */
export function getAllCategories(): ParameterCategory[] {
  const categories = new Set<ParameterCategory>();
  Object.values(PARAMETER_DEFINITIONS).forEach(def => {
    categories.add(def.category);
  });
  return Array.from(categories);
}

/**
 * Count total parameters
 */
export function getTotalParameterCount(): number {
  return Object.keys(PARAMETER_DEFINITIONS).length;
}

/**
 * Get parameter count by category
 */
export function getParameterCountByCategory(): Record<ParameterCategory, number> {
  const counts: Record<string, number> = {};

  Object.values(PARAMETER_DEFINITIONS).forEach(def => {
    counts[def.category] = (counts[def.category] || 0) + 1;
  });

  return counts as Record<ParameterCategory, number>;
}

/**
 * Check if parameter is at default value
 */
export function isParameterAtDefault(paramId: string, currentValue: number): boolean {
  const def = PARAMETER_DEFINITIONS[paramId];
  if (!def) return true;

  return Math.abs(currentValue - def.default) < 0.001;
}

/**
 * Get count of modified parameters
 */
export function getModifiedParameterCount(parameterValues: Map<string, number>): number {
  let count = 0;

  parameterValues.forEach((value, paramId) => {
    if (!isParameterAtDefault(paramId, value)) {
      count++;
    }
  });

  return count;
}
