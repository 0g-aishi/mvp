/**
 * Enhanced Master Prompt System for Shizuku AI Avatar
 * Full Physics Implementation with 50 Settings
 * 
 * Based on Live2D industry best practices, VTuber control systems, and Character.AI design patterns
 */

// Enhanced JSON Schema with ALL 50 physics settings
export const SHIZUKU_ENHANCED_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    text: {
      type: "string",
      description: "What Shizuku says to the user"
    },
    mouth_open_timeline: {
      type: "array",
      items: {
        type: "number",
        minimum: 0,
        maximum: 40
      },
      description: "Array of mouth open values (0-40) for each character in text, simulating natural speech visemes"
    },
    emotions: {
      type: "object",
      properties: {
        base: {
          type: "string",
          enum: ["love", "starry", "angry", "crying", "dark", "blush", "blank", "dizzy", "none"],
          description: "Primary emotion (exclusive)"
        },
        intensity: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Emotion intensity (0.0=subtle, 1.0=maximum expression)"
        },
        eyeEffect: {
          type: "string", 
          enum: ["love", "starry", "none"],
          description: "Eye effect overlay (exclusive)"
        }
      },
      required: ["base", "intensity", "eyeEffect"]
    },
    mouth: {
      type: "object",
      properties: {
        openness: {
          type: "number",
          minimum: 0,
          maximum: 50,
          description: "Mouth opening (0=closed, 50=max natural for conversation)"
        },
        form: {
          type: "number", 
          minimum: -100,
          maximum: 100,
          description: "Mouth shape (-100=very sad/narrow, 0=neutral, 100=very happy/wide)"
        },
        lipSync: {
          type: "boolean",
          description: "Sync mouth with speech (always true when speaking)"
        }
      },
      required: ["openness", "form", "lipSync"]
    },
    handItem: {
      type: "string",
      enum: ["gaming", "microphone", "tea", "heart", "board", "none"],
      description: "Item held in hands (mutually exclusive, AI-controlled)"
    },
    decorations: {
      type: "object",
      properties: {
        blush: { 
          type: "string",
          enum: ["none", "light", "medium", "heavy"],
          description: "Blushed cheeks intensity"
        },
        tears: { 
          type: "string",
          enum: ["none", "light", "flowing", "streaming"],
          description: "Crying tears intensity"
        },
        anger_mark: { 
          type: "boolean", 
          description: "Anime anger mark above head" 
        },
        sweat: { 
          type: "string",
          enum: ["none", "light", "nervous", "heavy"],
          description: "Sweat drops intensity"
        }
      },
      required: ["blush", "tears", "anger_mark", "sweat"]
    },
    physics: {
      type: "object",
      properties: {
        // Foundation parameters (existing 6)
        headMovement: {
          type: "object",
          properties: {
            x: { type: "number", minimum: -30, maximum: 30, description: "ParamAngleX" },
            y: { type: "number", minimum: -30, maximum: 30, description: "ParamAngleY" },
            z: { type: "number", minimum: -10, maximum: 10, description: "ParamAngleZ" }
          },
          required: ["x", "y", "z"]
        },
        bodyMovement: {
          type: "object",
          properties: {
            x: { type: "number", minimum: -10, maximum: 10, description: "ParamBodyX" },
            y: { type: "number", minimum: -10, maximum: 10, description: "ParamBodyY" },
            z: { type: "number", minimum: -10, maximum: 10, description: "ParamBodyZ" }
          },
          required: ["x", "y", "z"]
        },
        breathing: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "ParamBreath - Breathing intensity (0.3=calm, 0.8=excited)"
        },
        eyeTracking: {
          type: "object",
          properties: {
            x: { type: "number", minimum: -1, maximum: 1, description: "ParamEyeBallX" },
            y: { type: "number", minimum: -1, maximum: 1, description: "ParamEyeBallY" }
          },
          required: ["x", "y"]
        },
        
        // Advanced facial physics (Settings 8-17)
        eyeOpening: {
          type: "object",
          properties: {
            left: { type: "number", minimum: 0, maximum: 1, description: "ParamEyeLOpen" },
            right: { type: "number", minimum: 0, maximum: 1, description: "ParamEyeROpen" }
          },
          required: ["left", "right"]
        },
        
        // Eyebrow control (Settings 22-29)
        eyebrowMovement: {
          type: "object",
          properties: {
            leftY: { type: "number", minimum: -1, maximum: 1, description: "ParamBrowLY" },
            rightY: { type: "number", minimum: -1, maximum: 1, description: "ParamBrowRY" },
            leftForm: { type: "number", minimum: -1, maximum: 1, description: "ParamBrowLForm" },
            rightForm: { type: "number", minimum: -1, maximum: 1, description: "ParamBrowRForm" }
          },
          required: ["leftY", "rightY", "leftForm", "rightForm"]
        },
        
        // Hair physics groups (Settings 30-33)
        hairDynamics: {
          type: "object",
          properties: {
            front: { type: "number", minimum: 0, maximum: 1, description: "Front hair movement intensity" },
            side: { type: "number", minimum: 0, maximum: 1, description: "Side hair movement intensity" },
            back: { type: "number", minimum: 0, maximum: 1, description: "Back hair movement intensity" },
            accessories: { type: "number", minimum: 0, maximum: 1, description: "Hair accessories movement" }
          },
          required: ["front", "side", "back", "accessories"]
        },
        
        // Body dynamics (Settings 43-48)
        bodyDynamics: {
          type: "object",
          properties: {
            chest: { type: "number", minimum: 0, maximum: 1, description: "Chest movement intensity" },
            skirt: { type: "number", minimum: 0, maximum: 1, description: "Skirt movement intensity" },
            legs: { type: "number", minimum: 0, maximum: 1, description: "Leg movement intensity" }
          },
          required: ["chest", "skirt", "legs"]
        },
        
        // Special features (Settings 41-42, 49-50)
        specialFeatures: {
          type: "object", 
          properties: {
            animalEars: { type: "number", minimum: 0, maximum: 1, description: "Animal ear movement" },
            wings: { type: "number", minimum: 0, maximum: 1, description: "Wing movement intensity" }
          },
          required: ["animalEars", "wings"]
        }
      },
      required: ["headMovement", "bodyMovement", "breathing", "eyeTracking", "eyeOpening", "eyebrowMovement", "hairDynamics", "bodyDynamics", "specialFeatures"]
    },
    physics_timeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          headMovement: { type: "object" },
          bodyMovement: { type: "object" },
          eyeOpening: { type: "object" },
          eyebrowMovement: { type: "object" },
          hairDynamics: { type: "object" },
          bodyDynamics: { type: "object" },
          specialFeatures: { type: "object" },
          duration: { type: "number", minimum: 50, maximum: 2000 }
        }
      },
      description: "Optional timeline array for complex movements (each step with duration in ms)"
    },
    advanced_physics_timeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          headMovement: { 
            type: "object",
            properties: {
              x: { type: "number", minimum: -30, maximum: 30 },
              y: { type: "number", minimum: -30, maximum: 30 },
              z: { type: "number", minimum: -10, maximum: 10 }
            }
          },
          bodyMovement: { 
            type: "object",
            properties: {
              x: { type: "number", minimum: -10, maximum: 10 },
              y: { type: "number", minimum: -10, maximum: 10 },
              z: { type: "number", minimum: -10, maximum: 10 }
            }
          },
          eyeOpening: {
            type: "object",
            properties: {
              left: { type: "number", minimum: 0, maximum: 1 },
              right: { type: "number", minimum: 0, maximum: 1 }
            }
          },
          eyebrowMovement: {
            type: "object", 
            properties: {
              leftY: { type: "number", minimum: -1, maximum: 1 },
              rightY: { type: "number", minimum: -1, maximum: 1 },
              leftForm: { type: "number", minimum: -1, maximum: 1 },
              rightForm: { type: "number", minimum: -1, maximum: 1 }
            }
          },
          hairDynamics: {
            type: "object",
            properties: {
              front: { type: "number", minimum: 0, maximum: 1 },
              side: { type: "number", minimum: 0, maximum: 1 },
              back: { type: "number", minimum: 0, maximum: 1 },
              accessories: { type: "number", minimum: 0, maximum: 1 }
            }
          },
          bodyDynamics: {
            type: "object",
            properties: {
              chest: { type: "number", minimum: 0, maximum: 1 },
              skirt: { type: "number", minimum: 0, maximum: 1 },
              legs: { type: "number", minimum: 0, maximum: 1 }
            }
          },
          specialFeatures: {
            type: "object",
            properties: {
              animalEars: { type: "number", minimum: 0, maximum: 1 },
              wings: { type: "number", minimum: 0, maximum: 1 }
            }
          },
          breathing: { type: "number", minimum: 0, maximum: 1 },
          eyeTracking: {
            type: "object",
            properties: {
              x: { type: "number", minimum: -1, maximum: 1 },
              y: { type: "number", minimum: -1, maximum: 1 }
            }
          },
          duration: { type: "number", minimum: 100, maximum: 1500, description: "Duration of this keyframe in milliseconds" }
        },
        required: ["duration"]
      },
      description: "Advanced keyframe-based animation timeline for smooth animations like blinking, shaking, dancing"
    }
  },
  required: ["text", "mouth_open_timeline", "emotions", "mouth", "handItem", "decorations", "physics"]
};

// Enhanced physics description for AI guidance
export const SHIZUKU_PHYSICS_GUIDE = `
# ---------------- PHYSICS CONTROL SYSTEM (50 PARAMETERS) ----------------
## Enhanced Physics System - Full 50 Settings Control

### Foundation Parameters (Settings 1-3)
- **headMovement**: Primary head rotation control
  - x: Left/right turn (-30 to +30)
  - y: Up/down tilt (-30 to +30)
  - z: Side tilt (-10 to +10)
- **bodyMovement**: Torso positioning
  - x/y/z: Body shifts (-10 to +10)
- **breathing**: 0.3 (calm) to 0.8 (excited)

### Advanced Eye Control (Settings 4-17)
- **eyeTracking**: Precise gaze direction
  - x: -1 (far left) to +1 (far right)
  - y: -1 (down) to +1 (up)
- **eyeOpening**: Individual eye control
  - left/right: 0 (closed) to 1 (fully open)
  - For winking: set one to 0.2 while other stays at 1

### Eyebrow Expressions (Settings 22-29)
- **eyebrowMovement**: Detailed emotional expression
  - leftY/rightY: -1 (lowered/angry) to +1 (raised/surprised)
  - leftForm/rightForm: -1 (curved down) to +1 (curved up)
  - Asymmetric values create unique expressions

### Hair Physics System (Settings 30-35) - ENHANCED
- **hairDynamics**: Advanced hair movement with head synchronization
  - front: 0 (still) to 1 (bouncy) - Most responsive, follows head X movement
  - side: 0 (still) to 1 (swaying) - Responsive to head Z tilt
  - back: 0 (still) to 1 (flowing) - Delayed response, follows head Y movement
  - accessories: 0 (still) to 1 (active) - Subtle bow/ribbon movement
  
**Hair Movement Guidelines:**
- **Excited/Happy**: front: 0.6-0.8, side: 0.7, back: 0.5, accessories: 0.9
- **Calm/Neutral**: front: 0.2-0.3, side: 0.2, back: 0.3, accessories: 0.1
- **Shy/Embarrassed**: front: 0.1, side: 0.1, back: 0.1, accessories: 0.2
- **Dancing/Moving**: All values 0.8-1.0 with physics_timeline
- **Wind Effect**: Gradually increase all values over timeline

### Body Dynamics (Settings 36-48) - ENHANCED
- **bodyDynamics**: Advanced clothing and body physics with synchronization
  - chest: 0 (still) to 1 (active) - Syncs with breathing and body movement
  - skirt: 0 (still) to 1 (flowing) - Responds to horizontal body sway
  - legs: 0 (still) to 1 (moving) - Coordinated leg movement simulation
  
**Body Movement Guidelines:**
- **Calm/Sitting**: chest: 0.3-0.4, skirt: 0.1, legs: 0
- **Talking/Engaged**: chest: 0.4-0.6, skirt: 0.2-0.3, legs: 0.1
- **Excited/Bouncy**: chest: 0.6-0.8, skirt: 0.5-0.7, legs: 0.3-0.5
- **Dancing/Active**: chest: 0.8-1.0, skirt: 0.8-1.0, legs: 0.6-1.0
- **Breathing Intensity**: Chest movement should match breathing parameter

### Special Features (Settings 41-42, 49-50)
- **specialFeatures**: Unique character elements
  - animalEars: 0 (drooped) to 1 (perked up)
  - wings: 0 (folded) to 1 (spread)

# ---------------- ANIMATION TIMELINE SYSTEM ----------------
## ADVANCED ANIMATION SYSTEM

**KIEDY UZYWAC KEYFRAME ANIMATIONS:**
Gdy uzytkownik prosi o konkretne animacje/ruchy, uzyj advanced_physics_timeline zamiast statycznych parametrow:
- "Mrugaj", "pusc oczko" -> eye animation timeline
- "Potrzasnij glowa", "pokrec glowa" -> head shake timeline  
- "Podskoknij", "zatancz" -> body movement timeline
- "Pomacha wlosami" -> hair dynamics timeline

**PRZYKLADY KEYFRAME ANIMATIONS:**

### Mrugniecie lewym okiem:
Example advanced_physics_timeline for eye blink:
[
  {"eyeOpening": {"left": 1.0, "right": 1.0}, "duration": 200},
  {"eyeOpening": {"left": 0.7, "right": 1.0}, "duration": 150},
  {"eyeOpening": {"left": 0.2, "right": 1.0}, "duration": 120},
  {"eyeOpening": {"left": 0.0, "right": 1.0}, "duration": 100},
  {"eyeOpening": {"left": 0.3, "right": 1.0}, "duration": 130},
  {"eyeOpening": {"left": 0.8, "right": 1.0}, "duration": 170},
  {"eyeOpening": {"left": 1.0, "right": 1.0}, "duration": 250}
]

### Potrzasniecie glowa:
Example advanced_physics_timeline for head shake:
[
  {"headMovement": {"x": 0, "y": 0, "z": 0}, "hairDynamics": {"front": 0.3, "side": 0.3, "back": 0.3}, "duration": 200},
  {"headMovement": {"x": -8, "y": 1, "z": -2}, "hairDynamics": {"front": 0.6, "side": 0.7, "back": 0.5}, "duration": 250},
  {"headMovement": {"x": 10, "y": -1, "z": 3}, "hairDynamics": {"front": 0.8, "side": 0.9, "back": 0.7}, "duration": 220},
  {"headMovement": {"x": -7, "y": 1, "z": -1}, "hairDynamics": {"front": 0.7, "side": 0.8, "back": 0.6}, "duration": 280},
  {"headMovement": {"x": 4, "y": 0, "z": 1}, "hairDynamics": {"front": 0.5, "side": 0.6, "back": 0.4}, "duration": 300},
  {"headMovement": {"x": -2, "y": 0, "z": 0}, "hairDynamics": {"front": 0.4, "side": 0.4, "back": 0.3}, "duration": 320},
  {"headMovement": {"x": 0, "y": 0, "z": 0}, "hairDynamics": {"front": 0.3, "side": 0.3, "back": 0.3}, "duration": 400}
]

### Podskakiwanie z radosci:
Example advanced_physics_timeline for jumping:
[
  {"headMovement": {"x": 0, "y": 0, "z": 0}, "bodyMovement": {"x": 0, "y": 0}, "bodyDynamics": {"chest": 0.4, "skirt": 0.2, "legs": 0}, "hairDynamics": {"front": 0.3, "side": 0.3, "back": 0.3}, "eyebrowMovement": {"leftY": 0, "rightY": 0, "leftForm": 0, "rightForm": 0}, "duration": 300},
  {"headMovement": {"x": 0, "y": 6, "z": 0}, "bodyMovement": {"x": 0, "y": 4}, "bodyDynamics": {"chest": 0.7, "skirt": 0.5, "legs": 0.3}, "hairDynamics": {"front": 0.6, "side": 0.7, "back": 0.5}, "eyebrowMovement": {"leftY": 0.3, "rightY": 0.3, "leftForm": 0.5, "rightForm": 0.5}, "duration": 350},
  {"headMovement": {"x": 0, "y": 10, "z": 0}, "bodyMovement": {"x": 0, "y": 7}, "bodyDynamics": {"chest": 0.9, "skirt": 0.8, "legs": 0.5}, "hairDynamics": {"front": 0.8, "side": 0.9, "back": 0.7}, "eyebrowMovement": {"leftY": 0.5, "rightY": 0.5, "leftForm": 0.7, "rightForm": 0.7}, "duration": 400},
  {"headMovement": {"x": 0, "y": 6, "z": 0}, "bodyMovement": {"x": 0, "y": 4}, "bodyDynamics": {"chest": 0.7, "skirt": 0.5, "legs": 0.3}, "hairDynamics": {"front": 0.6, "side": 0.7, "back": 0.5}, "eyebrowMovement": {"leftY": 0.3, "rightY": 0.3, "leftForm": 0.5, "rightForm": 0.5}, "duration": 350},
  {"headMovement": {"x": 0, "y": 0, "z": 0}, "bodyMovement": {"x": 0, "y": 0}, "bodyDynamics": {"chest": 0.4, "skirt": 0.2, "legs": 0}, "hairDynamics": {"front": 0.3, "side": 0.3, "back": 0.3}, "eyebrowMovement": {"leftY": 0, "rightY": 0, "leftForm": 0, "rightForm": 0}, "duration": 500}
]

**KLUCZOWE ZASADY KEYFRAME ANIMATIONS:**
1. Zawsze zaczynaj i konczij w pozycji neutralnej
2. Plynne przejscia - kazda klatka subtelnie rozna od poprzedniej
3. Realistic timing - szybkie ruchy 100-200ms, spokojne 250-500ms, bardzo spokojne 300-800ms
4. Physics sync - ruch glowy wplywa na wlosy, skok na ubrania
5. Nie przekraczaj limitow - sprawdz zakresy wszystkich parametrow

# ---------------- PHYSICS COMBINATION EXAMPLES ----------------
## Physics Combination Examples

### Shy/Embarrassed Response:
\`\`\`json
{
  "headMovement": {"x": 5, "y": -10, "z": 0},
  "eyeTracking": {"x": 0.3, "y": -0.3},
  "eyeOpening": {"left": 0.7, "right": 0.7},
  "eyebrowMovement": {"leftY": -0.2, "rightY": -0.2, "leftForm": 0.3, "rightForm": 0.3},
  "hairDynamics": {"front": 0.2, "side": 0.3, "back": 0.2, "accessories": 0.1},
  "bodyDynamics": {"chest": 0.4, "skirt": 0.1, "legs": 0},
  "specialFeatures": {"animalEars": 0.3, "wings": 0}
}
\`\`\`

### Excited/Happy Response:
\`\`\`json
{
  "headMovement": {"x": 0, "y": 5, "z": 0},
  "eyeTracking": {"x": 0, "y": 0},
  "eyeOpening": {"left": 1, "right": 1},
  "eyebrowMovement": {"leftY": 0.5, "rightY": 0.5, "leftForm": 0.7, "rightForm": 0.7},
  "hairDynamics": {"front": 0.6, "side": 0.7, "back": 0.8, "accessories": 0.9},
  "bodyDynamics": {"chest": 0.7, "skirt": 0.5, "legs": 0.3},
  "specialFeatures": {"animalEars": 1, "wings": 0.8}
}
\`\`\`

### Thinking/Pondering:
\`\`\`json
{
  "headMovement": {"x": -5, "y": 5, "z": 3},
  "eyeTracking": {"x": 0.5, "y": 0.3},
  "eyeOpening": {"left": 0.8, "right": 0.8},
  "eyebrowMovement": {"leftY": 0.1, "rightY": -0.1, "leftForm": 0, "rightForm": -0.2},
  "hairDynamics": {"front": 0.1, "side": 0.1, "back": 0.1, "accessories": 0.1},
  "bodyDynamics": {"chest": 0.3, "skirt": 0, "legs": 0},
  "specialFeatures": {"animalEars": 0.6, "wings": 0.1}
}
\`\`\`

### Dynamic Movement Timeline Example:
\`\`\`json
"physics_timeline": [
  {
    "headMovement": {"x": -10, "y": 0, "z": -5},
    "hairDynamics": {"front": 0.8, "side": 0.9, "back": 1, "accessories": 0.7},
    "duration": 300
  },
  {
    "headMovement": {"x": 10, "y": 0, "z": 5},
    "hairDynamics": {"front": 0.8, "side": 0.9, "back": 1, "accessories": 0.7},
    "duration": 300
  },
  {
    "headMovement": {"x": 0, "y": 0, "z": 0},
    "hairDynamics": {"front": 0.2, "side": 0.3, "back": 0.4, "accessories": 0.2},
    "duration": 200
  }
]
\`\`\`

# ---------------- ANIMATION GUIDELINES ----------------
## Important Guidelines:
1. **Natural Movement**: Combine multiple parameters for realistic motion
2. **Emotion Sync**: Match physics to emotional state
3. **Smooth Transitions**: Avoid extreme jumps in values
4. **Context Awareness**: Adjust intensity based on conversation tone
5. **Hair Physics**: Always flows opposite to head movement with delay
6. **Eye-Emotion Link**: Eye opening correlates with emotional intensity
7. **Breathing Sync**: Higher breathing with excitement/nervousness
`;