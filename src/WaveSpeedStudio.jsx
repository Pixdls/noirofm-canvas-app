import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Upload, X, Play, Pause, Settings, Image as ImageIcon, 
  Clock, CheckCircle, AlertCircle, Loader2, Download, 
  Trash2, Maximize2, Terminal, RefreshCw, Layers, Zap,
  Search, Filter, ChevronRight, ChevronDown, Activity,
  Grid, Plus, Layout, Edit2, MoreVertical, FilePlus,
  Video, Film, Clapperboard, Camera, Wand2, MonitorPlay,
  DollarSign, Timer, BarChart3, Sparkles, RotateCcw, History, ArrowRight,
  Lightbulb, Copy, Save, Shuffle, Sliders, PlayCircle, Users, UserPlus, Check, AlertTriangle, ArrowRightCircle,
  HelpCircle, Eye, EyeOff, MoreHorizontal, FileDigit, Music, CornerUpLeft
} from 'lucide-react';

/**
 * =================================================================================
 * CONFIGURATION & CONSTANTS
 * =================================================================================
 */

const WAVESPEED_API_KEY = "2a6954f77db827fde9528de132f82e909995f778885738d75a59657dad5906ef";
const GEMINI_API_KEY = "AIzaSyBSTOMMVfJL4uYZUfOgwdWBbEwK3igooyw"; 

// 1) MODEL REGISTRY
const MODEL_REGISTRY = {
  "google/nano-banana-pro/edit": {
    key: "google/nano-banana-pro/edit",
    displayName: "Nano Banana Pro (Edit)",
    endpoint: "https://api.wavespeed.ai/api/v3/google/nano-banana-pro/edit",
    type: "image_to_image",
    supports: {
      imagesRequired: true,
      maxImages: 10,
      outputsMax: 4,
      resolutions: ["1k", "2k", "4k"],
      aspectRatios: ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      syncMode: true,
      outputType: "image"
    },
    uiDefaults: { resolution: "1k", outputCount: 1, aspectRatio: "1:1", enableSync: true, enhancePrompt: false }
  },
  
  "seedream-v4.5-edit": {
    key: "seedream-v4.5-edit",
    displayName: "Seedream 4.5 Edit",
    endpoint: "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4.5/edit",
    type: "image_to_image",
    supports: {
      imagesRequired: true,
      maxImages: 10,
      outputsMax: 4,
      resolutions: ["1k", "2k", "4k"],
      aspectRatios: ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      syncMode: true,
      base64Output: true,
      outputType: "image"
    },
    uiDefaults: { resolution: "1k", outputCount: 1, aspectRatio: "1:1", enableSync: true, enhancePrompt: false }
  },

  "kling-2.5-turbo": {
    key: "kling-2.5-turbo",
    displayName: "Kling 2.5 Turbo Pro",
    endpoint: "https://api.wavespeed.ai/api/v3/kwaivgi/kling-v2.5-turbo-pro/image-to-video",
    type: "image_to_video",
    supports: {
      imagesRequired: true, 
      maxImages: 1, 
      outputsMax: 1, 
      resolutions: [], 
      aspectRatios: [],
      durations: [5, 10],
      syncMode: false,
      outputType: "video"
    },
    uiDefaults: { duration: 5, guidanceScale: 0.5, outputCount: 1, enableSync: false, enhancePrompt: true }
  },

  "kling-2.6-motion": {
    key: "kling-2.6-motion",
    displayName: "Kling 2.6 Pro Motion",
    endpoint: "https://api.wavespeed.ai/api/v3/kwaivgi/kling-v2.6-pro/motion-control",
    type: "motion_control",
    supports: {
      imagesRequired: true,
      videosRequired: true,
      maxImages: 1,
      maxVideos: 1,
      outputsMax: 1,
      resolutions: [],
      aspectRatios: [], // Controlled by characterOrientation
      durations: [5, 10, 15, 30],
      syncMode: false,
      outputType: "video"
    },
    uiDefaults: { characterOrientation: "image", keepOriginalSound: true, negativePrompt: "" }
  },

  "seedance-v1.5-pro": {
    key: "seedance-v1.5-pro",
    displayName: "Seedance 1.5 Pro Fast",
    endpoint: "https://api.wavespeed.ai/api/v3/bytedance/seedance-v1.5-pro/image-to-video-fast",
    type: "image_to_video",
    supports: {
      imagesRequired: true,
      maxImages: 1,
      outputsMax: 1,
      resolutions: ["720p", "1080p"],
      aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], 
      durations: [5, 10],
      syncMode: false,
      outputType: "video"
    },
    uiDefaults: { resolution: "720p", aspectRatio: "16:9", duration: 5, outputCount: 1, enableSync: false, enhancePrompt: true }
  }
};

// 2) COST ESTIMATION REGISTRY (USD)
const ESTIMATED_COSTS = {
  "google/nano-banana-pro/edit": { unit: "image", cost: 0.002 },
  "seedream-v4.5-edit": { unit: "image", cost: 0.04 },
  "kling-2.5-turbo": { unit: "video", cost: 0.50 },
  "seedance-v1.5-pro": { unit: "video", cost: 0.20 },
  "kling-2.6-motion": { unit: "video", cost: 1.12 } // Avg for 10s
};

const ANGLE_PROMPTS = [
  "Slightly change the camera angle as if the phone is held a bit higher. Keep the same person, same scene, same outfit. Natural lighting and photorealistic detail.",
  "Rotate the viewpoint subtly to the left (about 10–15 degrees). Keep identity, outfit, and background consistent. Realistic photo.",
  "Make the angle slightly lower like a candid photo from chest height. Preserve the scene and realism.",
  "Add a gentle head tilt and a tiny change in perspective. Keep everything else the same.",
  "Slightly adjust the pose: one hand lightly touches hair near the temple. Keep the same scene and outfit, photorealistic.",
  "Shift the camera angle slightly as if stepping half a step to the right. Preserve identity and background.",
  "Subtle change: turn the face a little toward the camera and soften the expression into a natural smile.",
  "Change the angle slightly and adjust hair behind one ear. Preserve lighting and scene.",
  "Slightly widen the framing and shift perspective like a different shot taken one second later.",
  "Minor perspective change: tilt the camera a bit and keep the same composition and realism."
];

// 3) LOCAL INSPIRE GENERATOR DATA
const LOCAL_PROMPT_DATA = {
  cameras: [
    "handheld iPhone 14", "rear camera flash", "low quality android camera", "slightly shaky handheld phone", 
    "candid friend's phone", "mirror selfie", "0.5x wide lens", "front camera selfie", "iPhone burst mode shot", "smudged lens phone photo"
  ],
  settings: [
    "messy bedroom with unmade bed", "grocery store aisle near snacks", "empty parking lot at night", 
    "laundromat with flickering neon", "car interior at a stop light", "suburban street at dusk", 
    "thrift store changing room", "peaceful graveyard at golden hour", "bus stop in light rain", 
    "fast food booth with trays", "elevator with smudged mirrors", "gas station under harsh lights",
    "7-Eleven aisle", "cluttered desk"
  ],
  actions: [
    "holding a half-eaten pizza slice", "fixing hair behind ear mid-laugh", "covering face with hand shyly", 
    "holding a stray cat", "looking away distracted", "checking phone notifications", "adjusting a hoodie strap", 
    "sipping an iced coffee", "yawning slightly", "fixing jacket zipper", "walking quickly", "sitting casually on the curb",
    "laughing with eyes closed", "holding keys in hand"
  ],
  styling: [
    "oversized vintage hoodie", "thrifted band tee and jeans", "gym outfit with tangled headphones", 
    "cozy gray pajamas", "casual streetwear", "beanie and denim jacket", "baggy cargo pants", "simple black tank top",
    "worn-out denim jacket", "messy bun and sweatshirt"
  ],
  lighting: [
    "harsh direct flash", "soft golden hour sun", "overcast flat daylight", "dim streetlights", 
    "fluorescent store lights", "car dashboard glow", "sunset backlight", "phone screen glow on face", "uneven indoor lighting"
  ],
  viralHooks: [
    "holding a huge bouquet of flowers", "petting a lion in a supervised setting", "sitting on a police car hood", 
    "holding a pile of cash casually", "wearing a space helmet in public", "walking a duck on a leash", 
    "surrounded by 100 lit candles", "holding a giant teddy bear"
  ],
  realismCues: [
    "imperfect framing", "slight motion blur", "uneven lighting", "natural skin texture", 
    "no heavy retouch", "subtle noise/grain like a real phone", "flash on", "harsh iPhone flash", 
    "messy hair", "candid moment", "slightly out of focus background", "red-eye reduction flash look",
    "handheld iPhone", "natural imperfections"
  ]
};

// 4) INITIAL PRESET CHARACTERS
const PRESET_CHARACTERS = [
  {
    id: "preset-lexi",
    displayName: "Lexi (Preset)",
    referenceImages: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1521119989659-a83eee488058?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80"
    ],
    tags: ["casual", "blonde", "portrait", "candid", "natural light"],
    notes: "Consistent identity preset. Works well for casual, everyday shots.",
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    isPreset: true
  }
];

const DEFAULT_MODEL = "google/nano-banana-pro/edit";
const MAX_IMAGE_DIMENSION = 2048; 
const DEFAULT_CONCURRENCY = 2;

/**
 * =================================================================================
 * UTILITIES
 * =================================================================================
 */

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (ms) => {
  if (!ms) return '0s';
  return (ms / 1000).toFixed(1) + 's';
};

const calculateCost = (modelKey, count) => {
  const pricing = ESTIMATED_COSTS[modelKey];
  if (!pricing) return null;
  return (pricing.cost * count).toFixed(3);
};

const enhancePromptLogic = (userPrompt, modelKey, intensity = 'medium') => {
  if (!userPrompt) return "";
  const modelConfig = MODEL_REGISTRY[modelKey];
  let enhanced = userPrompt.trim();
  const lower = enhanced.toLowerCase();

  const wordCount = enhanced.split(/\s+/).length;
  // Basic padding for short prompts
  if (wordCount < 12) {
    if (!lower.includes("quality")) enhanced += ", high quality";
    if (intensity === 'strong' && !lower.includes("detailed")) enhanced += ", highly detailed, 8k resolution";
  }

  // Model-specific rules
  if (modelConfig.type === 'image_to_video' || modelConfig.type === 'motion_control') {
    if (intensity !== 'light') {
        if (!lower.includes("motion")) enhanced += ", natural fluid motion";
        if (!lower.includes("stable")) enhanced += ", stable identity and consistency";
    }
    if (intensity === 'strong' && !lower.includes("camera")) enhanced += ", subtle cinematic camera movement";
  } else {
    // Image to Image
    if (!lower.includes("preserve")) enhanced += ". Preserve identity, realism, and scene details.";
     
    if (intensity === 'medium' || intensity === 'strong') {
        if (!lower.includes("lighting")) enhanced += " Consistent lighting.";
        if (!lower.includes("photorealistic") && !lower.includes("cartoon") && !lower.includes("anime")) {
          enhanced += " Photorealistic, realistic texture, no artifacts.";
        }
    }
    if (intensity === 'strong') {
        enhanced += " Masterpiece, sharp focus.";
    }
  }
  return enhanced;
};

const upscaleVideoPrompt = (prompt, intensity) => {
  let upscaled = prompt.trim();
  const lower = upscaled.toLowerCase();

  const PHOTO_PREFIX = "Make a realistic phone photo of the girl in the reference image";
  const VIDEO_PREFIX = "Make a short realistic phone-style video clip of the girl in the reference image";
  
  if (upscaled.startsWith(PHOTO_PREFIX)) {
     upscaled = upscaled.replace(PHOTO_PREFIX, VIDEO_PREFIX);
  } else if (lower.startsWith("make a photo")) {
     upscaled = upscaled.replace(/make a photo/i, "Make a video clip");
  }

  const stability = "Keep identity, outfit, and scene consistent across frames. Natural motion, no warping, no flicker.";
  
  let details = "";
  if (intensity === 'light') {
      details = "Subtle camera movement, natural micro-movements.";
  } else if (intensity === 'medium') {
      details = "Subtle handheld camera movement, natural blinking and breathing. Consistent lighting stability. Fluid motion.";
  } else if (intensity === 'strong') {
      details = "Cinematic temporal consistency. Fluid realistic motion. Detailed texture preservation. Subtle parallax camera movement. Dynamic but stable lighting. High temporal coherence.";
  }

  if (lower.includes('phone') || lower.includes('flash') || lower.includes('candid') || lower.includes('amateur')) {
      details += " Authentic smartphone video vibe, slight noise/grain, realistic texture.";
  } else if (lower.includes('cinematic')) {
      details += " Professional stabilization, smooth motion blur.";
  } else {
      details += " Photorealistic.";
  }

  return `${upscaled} ${stability} ${details}`;
};

const generateLocalInspirePrompt = (lastPrompt, casualness = 0.8) => { 
  const data = LOCAL_PROMPT_DATA;
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const getCues = (count) => {
    const shuffled = [...data.realismCues].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).join(", ");
  };
  
  let pCasual = 0.3 + (casualness * 0.5); 
  let pAesthetic = 0.8 - pCasual; 
  
  const roll = Math.random();
  let category = "casual";
  let content = "";

  const PREFIX = "Make a realistic phone photo of the girl in the reference image ";

  if (roll < pCasual) {
    category = "casual";
    content = `taking a ${rand(data.cameras)} in a ${rand(data.settings)}. She is ${rand(data.actions)}. Wearing ${rand(data.styling)}. Lighting is ${rand(data.lighting)}.`;
  } else if (roll < pCasual + pAesthetic) {
    category = "aesthetic";
    content = `in a ${rand(data.settings)}, aesthetic but real vibe. She is ${rand(data.actions)}, looking candid. Wearing ${rand(data.styling)}. Dreamy ${rand(data.lighting)}.`;
  } else if (roll < 0.98) {
    category = "viral";
    content = `in a viral instagram moment: ${rand(data.cameras)}. She is ${rand(data.viralHooks)} in a ${rand(data.settings)}. Wearing ${rand(data.styling)}. Harsh flash lighting.`;
  } else {
    category = "wildcard";
    content = `candid snapshot, ${rand(data.settings)}, ${rand(data.actions)}, ${rand(data.lighting)}. Raw, unfiltered vibe.`;
  }

  const promptText = `${PREFIX}${content} Realism cues: ${getCues(3)}. Instagram style, no text, no watermarks.`;

  if (promptText === lastPrompt) return generateLocalInspirePrompt(lastPrompt, casualness);
  
  return { text: promptText, category };
};

const processFileForApi = (file) => {
  return new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      reject("Invalid file type");
      return;
    }

    // Video processing: simple Base64 conversion
    if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
    }

    // Image processing: Resize and Convert
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * =================================================================================
 * PROXY SIMULATION
 * =================================================================================
 */

const apiProxy = {
  infer: async (payload, endpoint, diagnosticsLogger) => {
    const requestId = generateId();
    const startTime = Date.now();
    
    const summary = {
      prompt: payload.prompt?.substring(0, 40) + '...',
      modelType: payload._modelType 
    };
    if (payload.images) summary.imagesCount = payload.images.length;
    if (payload.image) summary.hasSingleImage = true;
    if (payload.video) summary.hasVideo = true;
    if (payload.duration) summary.duration = payload.duration;

    diagnosticsLogger({
      type: 'request',
      id: requestId,
      url: endpoint,
      sizeBytes: JSON.stringify(payload).length,
      payloadSummary: summary
    });

    const cleanPayload = { ...payload };
    delete cleanPayload._modelType;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanPayload)
      });

      const rawJson = await response.json();
      const endTime = Date.now();

      if (!response.ok) {
        throw new Error(rawJson.error?.message || rawJson.message || `HTTP ${response.status}`);
      }

      const data = rawJson.data ? rawJson.data : rawJson;

      diagnosticsLogger({
        type: 'response',
        id: requestId,
        status: response.status,
        duration: endTime - startTime,
        data: data
      });

      return { ...data, _raw: rawJson };

    } catch (error) {
      diagnosticsLogger({ type: 'error', id: requestId, error: error.message });
      throw error;
    }
  },

  poll: async (statusUrl, diagnosticsLogger) => {
    try {
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WAVESPEED_API_KEY}`
        }
      });
      const rawJson = await response.json();
      const data = rawJson.data ? rawJson.data : rawJson;
      diagnosticsLogger({ type: 'poll', url: statusUrl, status: data.status || 'unknown' });
      return data;
    } catch (e) {
      console.error("Poll failed", e);
      throw e;
    }
  },

  inspire: async (lastPrompt, casualness, diagnosticsLogger) => {
    if (!GEMINI_API_KEY) throw new Error("Gemini key not configured");
    
    const requestId = generateId();
    diagnosticsLogger({ type: 'request-inspire', id: requestId, mode: 'gemini', casualness });

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
      
      const vibe = casualness > 0.5 ? "extremely casual, handheld iPhone photo, imperfect, everyday" : "aesthetic but real, cinematic lighting, intentional composition";

      const systemPrompt = `You are a creative engine generating prompts for an AI image editor.
      YOUR GOAL: Create a single prompt for a realistic, AMATEUR-STYLE Instagram photo.
      MANDATORY PREFIX: "Make a realistic phone photo of the girl in the reference image "
      
      VIBE: ${vibe}
      
      RULES:
      1. Start with the mandatory prefix exactly.
      2. Include specific realism cues: "handheld iPhone", "flash on", "motion blur", "natural skin texture", "imperfect framing".
      3. Setting should be mundane (grocery store, car, bedroom, street) or aesthetic-real (graveyard, rooftop).
      4. BANNED WORDS: "professional", "studio lighting", "editorial", "high-end", "DSLR", "perfect", "retouched", "4k", "8k".
      5. Action must be natural (laughing, fixing hair, eating, looking away).
      6. Do NOT repeat the concept: "${lastPrompt || ''}"
      
      OUTPUT JSON ONLY: { "prompt": "...", "tags": ["tag1", "tag2"], "category": "casual|aesthetic" }`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gemini API failed");

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanText = text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanText);

      diagnosticsLogger({ type: 'response-inspire', id: requestId, data: result });
      return result;

    } catch (e) {
      diagnosticsLogger({ type: 'error-inspire', id: requestId, error: e.message });
      throw e;
    }
  },

  analyzeCharacter: async (images, diagnosticsLogger) => {
    if (!GEMINI_API_KEY) throw new Error("Gemini key not configured");
    if (!images || images.length === 0) throw new Error("No images provided");

    const requestId = generateId();
    diagnosticsLogger({ type: 'request-analyze', id: requestId, imageCount: images.length });

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
      
      const parts = [
        { text: `Analyze these images of a person for a consistency library.
        OUTPUT JSON ONLY: {
          "suggestedName": "string (creative name)",
          "tags": ["tag1", "tag2"],
          "notes": "string (consistency analysis)",
          "confidence": number (0.0-1.0)
        }
        Focus on: hair color, style, vibe (casual/formal), lighting preference (flash/natural).
        If faces look different, set confidence low.` }
      ];

      images.forEach(imgData => {
        const base64Data = imgData.split(',')[1];
        parts.push({
          inlineData: { mimeType: "image/jpeg", data: base64Data }
        });
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gemini Analysis failed");

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanText = text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanText);

      diagnosticsLogger({ type: 'response-analyze', id: requestId, data: result });
      return result;

    } catch (e) {
      diagnosticsLogger({ type: 'error-analyze', id: requestId, error: e.message });
      throw e;
    }
  }
};

/**
 * =================================================================================
 * COMPONENTS
 * =================================================================================
 */

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon }) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all text-sm select-none shadow-sm active:scale-95";
  const variants = {
    primary: "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-900/20 border border-blue-600/50 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:border-gray-800",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 disabled:opacity-50",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'cursor-not-allowed opacity-70 shadow-none' : ''}`}>
      {Icon && <Icon size={16} className="mr-2" />}
      {children}
    </button>
  );
};

/* --- Enhance Prompt Modal --- */
const EnhancePromptModal = ({ isOpen, onClose, originalPrompt, modelKey, onApply }) => {
  const [intensity, setIntensity] = useState('medium');
  const [preview, setPreview] = useState("");
  const modelConfig = MODEL_REGISTRY[modelKey];
  const isVideo = modelConfig?.type === 'image_to_video' || modelConfig?.type === 'motion_control';

  useEffect(() => {
    if (!isOpen) return;
    // Generate preview
    let enhanced = originalPrompt;
    if (isVideo) {
      // For video, apply upscale logic
      enhanced = upscaleVideoPrompt(originalPrompt, intensity);
    } else {
      // For image, apply standard enhancement logic
      enhanced = enhancePromptLogic(originalPrompt, modelKey, intensity);
    }
    setPreview(enhanced);
  }, [isOpen, originalPrompt, intensity, modelKey, isVideo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950 rounded-t-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isVideo ? <PlayCircle size={20} className="text-cyan-400"/> : <Sparkles size={20} className="text-purple-400"/>} 
            {isVideo ? "Upscale Video Prompt" : "Enhance Prompt"}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white"/></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* LEFT: ORIGINAL */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Original</span>
              <div className="bg-black/50 p-3 rounded-lg border border-gray-800 text-gray-400 text-sm h-full whitespace-pre-wrap">
                {originalPrompt || <span className="italic opacity-50">Empty prompt</span>}
              </div>
            </div>

            {/* RIGHT: PREVIEW */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
                Preview
                <select 
                  value={intensity} 
                  onChange={e => setIntensity(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-[10px] rounded px-2 py-0.5 text-white"
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="strong">Strong</option>
                </select>
              </span>
              <div className="bg-gray-800/50 p-3 rounded-lg border border-blue-500/30 text-blue-100 text-sm h-full whitespace-pre-wrap shadow-inner relative">
                {preview}
                <div className="absolute top-2 right-2 text-[10px] text-blue-400 font-mono bg-blue-900/40 px-1.5 py-0.5 rounded">
                  +{preview.length - (originalPrompt?.length || 0)} chars
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-950 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
          <button 
            onClick={() => onApply(preview)} 
            disabled={!originalPrompt}
            className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Check size={16} /> Change Prompt
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Confirmation Modal --- */
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, showDontAsk }) => {
  const [dontAsk, setDontAsk] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <AlertTriangle size={20} className="text-yellow-500" />
          {title}
        </h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
        
        {showDontAsk && (
            <label className="flex items-center gap-2 mb-6 cursor-pointer text-xs text-gray-500 hover:text-gray-300 select-none">
                <input type="checkbox" checked={dontAsk} onChange={e => setDontAsk(e.target.checked)} className="rounded bg-gray-800 border-gray-700 focus:ring-blue-500 text-blue-500"/>
                Don't ask me again for this session
            </label>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={() => onConfirm(dontAsk)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-colors">Close Tab</button>
        </div>
      </div>
    </div>
  );
};

/* --- Duplicate Tab Modal --- */
const DuplicateTabModal = ({ isOpen, onClose, onDuplicate }) => {
    const [copyHistory, setCopyHistory] = useState(false);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
                <h3 className="text-lg font-bold text-white mb-4">Duplicate Tab</h3>
                <label className="flex items-center gap-3 mb-6 cursor-pointer text-sm text-gray-300 hover:text-white select-none">
                    <input 
                        type="checkbox" 
                        checked={copyHistory} 
                        onChange={e => setCopyHistory(e.target.checked)} 
                        className="rounded bg-gray-800 border-gray-700 focus:ring-blue-500 text-blue-500 w-4 h-4"
                    />
                    Copy outputs and history?
                </label>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
                    <button onClick={() => onDuplicate(copyHistory)} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-colors">Duplicate</button>
                </div>
            </div>
        </div>
    );
};

/* --- History Tile Component --- */
const HistoryTile = React.memo(({ item, isActive, onClick, OutputActions, onDownload }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative rounded-lg overflow-hidden cursor-pointer border transition-all group duration-200 ${isActive ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-900/20' : 'border-gray-800 hover:border-gray-600 bg-gray-900'}`}
    >
      <div className="aspect-square w-full relative bg-black/50">
        {item.type === 'job' ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center">
             {item.img ? <img src={item.img} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"/> : <div className="absolute inset-0 bg-gray-800 opacity-50"/>}
             <div className="relative z-10 flex flex-col items-center">
                <Loader2 className="animate-spin text-blue-400 mb-2" size={24} />
                <span className="text-[9px] text-blue-200 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur font-mono">Processing</span>
             </div>
           </div>
        ) : item.type === 'failed' ? (
           <div className="w-full h-full flex items-center justify-center bg-red-900/10 text-red-500"><AlertCircle size={24} /></div>
        ) : (
           <>
             {(item.data.outputType === 'video' || (item.img && item.img.match(/\.(mp4|webm)/i))) ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500"><Clapperboard size={32} /></div>
             ) : (
                <img src={item.img} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
             )}
             {item.data.outputType === 'video' && <div className="absolute bottom-1 right-1 bg-black/70 rounded p-0.5"><Video size={10} className="text-white"/></div>}
             
             {/* Indicators */}
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 px-2 flex justify-between items-end text-[9px] font-mono text-gray-300 pointer-events-none">
               <span>{item.data.stats?.runDuration ? formatDuration(item.data.stats.runDuration) : ''}</span>
               {item.data.stats?.cost && <span className="text-green-400">${item.data.stats.cost}</span>}
             </div>

             {/* Badges */}
             <div className="absolute top-1 left-1 flex flex-col gap-1 items-start">
                {item.data.promptEnhanced && <div className="bg-purple-500/80 text-white text-[8px] px-1 rounded font-bold backdrop-blur-sm shadow-sm"><Sparkles size={8} className="inline mr-0.5"/>ENHANCED</div>}
                {item.data.promptUpscaled && <div className="bg-cyan-600/80 text-white text-[8px] px-1 rounded font-bold backdrop-blur-sm shadow-sm"><PlayCircle size={8} className="inline mr-0.5"/>UPSCALED</div>}
                {item.data.inspiredBy && <div className="bg-yellow-500/80 text-black text-[8px] px-1 rounded font-bold backdrop-blur-sm shadow-sm"><Lightbulb size={8} className="inline mr-0.5"/>INSPIRED</div>}
                {item.data.referenceGroupName && <div className="bg-blue-600/80 text-white text-[8px] px-1 rounded font-bold backdrop-blur-sm shadow-sm max-w-[80px] truncate">{item.data.referenceGroupName}</div>}
             </div>

             {/* Download Button (Overlay) */}
             <button 
               onClick={(e) => onDownload(e, item.img, `wavespeed-${item.id}.${item.data.outputType === 'video' ? 'mp4' : 'png'}`)}
               className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-blue-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-20"
               title="Download"
             >
                <Download size={12} />
             </button>

             {/* Mini Actions */}
             {(!item.data.outputType || item.data.outputType === 'image') && (
               <div className="absolute top-6 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                  <OutputActions url={item.img} className="flex-col items-end" />
               </div>
             )}
           </>
        )}
      </div>
    </div>
  );
});

/* --- Lightbox Component --- */
const Lightbox = ({ item, onClose, actions }) => {
  if (!item) return null;
  const timing = item.job.stats || {};

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-full max-h-full flex flex-col items-center" 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute -top-12 right-0 text-white/50 hover:text-white p-2 transition-colors"
        >
          <X size={32} />
        </button>

        <div className="relative shadow-2xl rounded-sm overflow-hidden bg-black border border-gray-800">
           {(item.job.outputType === 'video' || item.url.match(/\.(mp4|webm|mov)/i)) ? (
             <video src={item.url} controls autoPlay loop className="max-w-[90vw] max-h-[80vh] object-contain" />
           ) : (
             <img src={item.url} className="max-w-[90vw] max-h-[80vh] object-contain" />
           )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
           <div className="flex gap-4">
             <a 
               href={item.url} 
               download={`wavespeed-${item.job.id}.${item.job.outputType === 'video' ? 'mp4' : 'png'}`} 
               target="_blank" 
               rel="noreferrer" 
               className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full flex items-center gap-2 text-sm transition-colors"
             >
               <Download size={16} /> Download
             </a>
             {actions}
           </div>
           
           <div className="flex gap-4 text-[10px] text-gray-500 font-mono mt-1">
              {item.job.referenceGroupName && <span className="text-blue-400">Ref: {item.job.referenceGroupName}</span>}
              {timing.runDuration !== undefined && <span>Gen: {(timing.runDuration / 1000).toFixed(2)}s</span>}
              {timing.cost !== null && <span className="text-green-500">Est: ${timing.cost}</span>}
           </div>
        </div>
      </div>
    </div>
  );
};

/* --- Character Library Modal --- */
const CharacterLibraryModal = ({ isOpen, onClose, library, onAddCharacter, onDeleteCharacter }) => {
  const [newCharImages, setNewCharImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleUpload = async (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const base64Promises = fileList.map(file => processFileForApi(file));
    const objectUrls = fileList.map(file => URL.createObjectURL(file));
    
    setNewCharImages(prev => [...prev, ...objectUrls]);

    try {
      setAnalyzing(true);
      const base64Images = await Promise.all(base64Promises);
      
      const analysis = await apiProxy.analyzeCharacter(base64Images, (log) => console.log(log));
      
      const newChar = {
        id: generateId(),
        displayName: analysis.suggestedName || `Character ${library.length + 1}`,
        referenceImages: objectUrls, 
        tags: analysis.tags || [],
        notes: analysis.notes || "No notes",
        confidence: analysis.confidence || 1.0,
        createdAt: new Date()
      };

      onAddCharacter(newChar);
      setNewCharImages([]);
      setAnalyzing(false);
      onClose();

    } catch (e) {
      console.error(e);
      setAnalyzing(false);
      alert("Analysis failed. Character not created.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950 rounded-t-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={20} className="text-blue-400"/> Character Library</h2>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          <div 
            className={`border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center mb-8 transition-colors ${analyzing ? 'bg-blue-900/10 border-blue-500/30' : 'hover:bg-gray-800 hover:border-gray-600 cursor-pointer'}`}
            onClick={() => !analyzing && fileInputRef.current?.click()}
          >
            {analyzing ? (
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-blue-400 mb-2 mx-auto"/>
                <p className="text-blue-200 font-medium">Analyzing Identity...</p>
                <p className="text-xs text-blue-400/70 mt-1">Checking consistency & generating tags</p>
              </div>
            ) : (
              <>
                <UserPlus size={32} className="text-gray-500 mb-2" />
                <p className="text-gray-300 font-medium">Create New Character</p>
                <p className="text-xs text-gray-500 mt-1">Upload 3-10 images to analyze identity</p>
              </>
            )}
            <input type="file" multiple className="hidden" ref={fileInputRef} accept="image/*" onChange={e => handleUpload(e.target.files)} disabled={analyzing}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {library.map(char => (
              <div key={char.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden group relative">
                {char.isPreset && <div className="absolute top-2 left-2 z-10 bg-blue-600 text-[9px] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider shadow">Preset</div>}
                <div className="h-32 bg-black relative">
                   <div className="flex h-full w-full">
                      {char.referenceImages.slice(0,3).map((img, i) => (
                        <div key={i} className="flex-1 border-r border-gray-800 last:border-0 relative">
                          <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                        </div>
                      ))}
                   </div>
                   {char.confidence < 0.7 && (
                     <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                       <AlertCircle size={10} /> Low Confidence
                     </div>
                   )}
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-white text-sm">{char.displayName}</h3>
                    {!char.isPreset && <button onClick={() => onDeleteCharacter(char.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {char.tags.slice(0,3).map((tag, i) => (
                      <span key={i} className="text-[9px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 italic line-clamp-2">{char.notes}</p>
                </div>
              </div>
            ))}
          </div>
          
          {library.length === 0 && !analyzing && (
            <div className="text-center text-gray-600 mt-12">
              <Users size={48} className="mx-auto mb-4 opacity-20"/>
              <p>No characters yet. Upload images to create one.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

/* --- Session Stats --- */
const SessionStats = ({ workspaces }) => {
  const stats = useMemo(() => {
    let totalCost = 0;
    let totalTime = 0;
    let jobCount = 0;

    workspaces.forEach(ws => {
      ws.history.forEach(job => {
        if (job.status === 'completed') {
          jobCount++;
          if (job.stats?.cost) totalCost += parseFloat(job.stats.cost);
          if (job.stats?.runDuration) totalTime += job.stats.runDuration;
        }
      });
    });

    return { totalCost: totalCost.toFixed(3), totalTime: (totalTime/1000).toFixed(1), jobCount };
  }, [workspaces]);

  return (
    <div className="flex items-center gap-4 bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-700/50 mr-4">
      <div className="flex items-center gap-1.5" title="Total Session Cost">
        <DollarSign size={14} className="text-green-400" />
        <span className="text-xs font-mono font-medium text-green-100">${stats.totalCost}</span>
      </div>
      <div className="w-px h-3 bg-gray-700"></div>
      <div className="flex items-center gap-1.5" title="Total Generation Time">
        <Timer size={14} className="text-blue-400" />
        <span className="text-xs font-mono font-medium text-blue-100">{stats.totalTime}s</span>
      </div>
      <div className="w-px h-3 bg-gray-700"></div>
      <div className="flex items-center gap-1.5" title="Completed Jobs">
        <BarChart3 size={14} className="text-purple-400" />
        <span className="text-xs font-mono font-medium text-purple-100">{stats.jobCount}</span>
      </div>
    </div>
  );
};

/* --- Diagnostics Panel --- */
const DiagnosticsPanel = ({ logs, isOpen, onClose }) => {
  if (!isOpen) return null;
  const logsEndRef = useRef(null);
  useEffect(() => {
    if (isOpen && logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isOpen]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-950 border-l border-gray-800 shadow-2xl z-50 flex flex-col font-mono text-xs">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
        <h2 className="text-blue-400 font-bold flex items-center gap-2"><Terminal size={16} /> Diagnostics</h2>
        <button onClick={onClose}><X size={18} className="text-gray-500 hover:text-white"/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black">
        {logs.map((log, i) => (
          <div key={i} className="border-l-2 pl-3 py-1 border-gray-800 hover:bg-gray-900/30">
            <div className="flex justify-between text-gray-500 mb-1">
              <span className={`uppercase font-bold ${log.type === 'error' ? 'text-red-500' : log.type === 'response' ? 'text-green-500' : 'text-blue-500'}`}>{log.type}</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <pre className="text-gray-300 whitespace-pre-wrap break-all">{JSON.stringify(log.error || log.payloadSummary || log.data || log.status, null, 2)}</pre>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

/* --- Reference Group Component --- */
const ReferenceGroup = ({ group, onDelete, onToggleActive, onFilesAdded, onFileRemove, disabled, acceptTypes = "image/*" }) => {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !disabled && group.active) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  return (
    <div className={`bg-gray-900/50 border border-gray-700 rounded-lg p-3 mb-3 relative group/card transition-opacity ${!group.active ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
           <button 
             onClick={onToggleActive} 
             className={`w-6 h-3 rounded-full relative transition-colors ${group.active ? 'bg-green-600' : 'bg-gray-600'}`}
             title={group.active ? "Deactivate Group" : "Activate Group"}
           >
              <div className={`w-2 h-2 bg-white rounded-full absolute top-0.5 transition-transform ${group.active ? 'left-3.5' : 'left-0.5'}`} />
           </button>
           <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{group.name}</h3>
           {!group.active && <span className="text-[9px] bg-gray-700 px-1 rounded text-gray-400">INACTIVE</span>}
        </div>
        <button 
          onClick={onDelete} 
          disabled={disabled}
          className="text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <X size={12} />
        </button>
      </div>

      <div 
        className="grid grid-cols-4 gap-2 mb-2"
        onDragOver={e => { e.preventDefault(); if(!disabled && group.active) e.currentTarget.classList.add('bg-blue-900/20'); }}
        onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-blue-900/20'); }}
        onDrop={e => { e.currentTarget.classList.remove('bg-blue-900/20'); handleDrop(e); }}
      >
        {group.inputs.map(input => (
          <div key={input.id} className="relative aspect-square bg-gray-800 rounded overflow-hidden border border-gray-700 group/item">
            {input.file?.type.startsWith('video/') || input.previewUrl.match(/\.(mp4|mov|webm)$/i) ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Film size={20} className="text-gray-500" />
                </div>
            ) : (
                <img src={input.previewUrl} className="w-full h-full object-cover" />
            )}
            
            {input.isCharacterRef && <div className="absolute top-0 left-0 bg-blue-600 text-white text-[6px] px-1 rounded-br">CHAR</div>}
            <button 
              onClick={() => onFileRemove(input.id)} 
              disabled={disabled}
              className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded opacity-0 group-hover/item:opacity-100 hover:bg-red-600 cursor-pointer z-10 disabled:hidden"
            >
              <X size={8} />
            </button>
          </div>
        ))}
        
        {/* Add Button */}
        <div 
          onClick={() => !disabled && group.active && fileInputRef.current?.click()}
          className={`aspect-square border-2 border-dashed border-gray-700 rounded flex flex-col items-center justify-center text-gray-500 transition-all ${disabled || !group.active ? 'opacity-50 cursor-not-allowed' : 'hover:text-white hover:border-blue-500 hover:bg-gray-800/50 cursor-pointer active:scale-95'}`}
        >
          <Plus size={16} />
        </div>
      </div>
      
      <input type="file" multiple className="hidden" ref={fileInputRef} accept={acceptTypes} onChange={e => { onFilesAdded(e.target.files); e.target.value = ''; }} />
      
      <div className="text-[9px] text-gray-500 flex items-center gap-1">
        <ArrowRightCircle size={10} /> Generates 1 independent result
      </div>
    </div>
  );
};

/* --- Special Input Component for Motion Control --- */
const MotionControlInputs = ({ inputs, onAdd, onRemove }) => {
    const imgInput = inputs.find(i => !i.file?.type.startsWith('video/') && !i.previewUrl.match(/\.(mp4|mov|webm)$/i));
    const vidInput = inputs.find(i => i.file?.type.startsWith('video/') || i.previewUrl.match(/\.(mp4|mov|webm)$/i));
    const imgRef = useRef(null);
    const vidRef = useRef(null);

    return (
        <div className="space-y-4 mb-4">
            {/* Image Input */}
            <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">1. Reference Image</span>
                <div 
                    onClick={() => !imgInput && imgRef.current?.click()}
                    className={`relative w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${imgInput ? 'border-blue-500 bg-gray-900' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 cursor-pointer'}`}
                >
                    {imgInput ? (
                        <>
                            <img src={imgInput.previewUrl} className="w-full h-full object-contain p-1" />
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemove(imgInput.id); }}
                                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                <X size={12}/>
                            </button>
                        </>
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center">
                            <ImageIcon size={24} className="mb-2 opacity-50"/>
                            <span className="text-xs">Upload Character Image</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" ref={imgRef} className="hidden" onChange={(e) => onAdd(e.target.files)} />
                </div>
            </div>

            {/* Video Input */}
            <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">2. Motion Reference Video</span>
                <div 
                    onClick={() => !vidInput && vidRef.current?.click()}
                    className={`relative w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${vidInput ? 'border-purple-500 bg-gray-900' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 cursor-pointer'}`}
                >
                    {vidInput ? (
                        <>
                            <div className="flex flex-col items-center text-purple-400">
                                <Film size={32} className="mb-2"/>
                                <span className="text-xs truncate max-w-[200px] px-2">{vidInput.file?.name || "Reference Video"}</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemove(vidInput.id); }}
                                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                <X size={12}/>
                            </button>
                        </>
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center">
                            <Video size={24} className="mb-2 opacity-50"/>
                            <span className="text-xs">Upload Motion Video</span>
                        </div>
                    )}
                    <input type="file" accept="video/*" ref={vidRef} className="hidden" onChange={(e) => onAdd(e.target.files)} />
                </div>
            </div>
        </div>
    );
};

/* --- Main Application --- */

export default function WaveSpeedStudio() {
  // --- GLOBAL STATE ---
  const [workspaces, setWorkspaces] = useState([{ 
    id: 'tab-1', 
    name: 'Workspace 1', 
    modelId: DEFAULT_MODEL,
    // Reference Groups Array with active state
    referenceGroups: [{ id: generateId(), name: 'Reference 1', inputs: [], active: true }],
    prompt: "", 
    queue: [], 
    history: [],
    settings: MODEL_REGISTRY[DEFAULT_MODEL].uiDefaults,
    activeItem: null,
    lastAnglePromptIndex: -1,
    inspireMode: 'local', 
    lastInspirePrompt: "",
    inspireCasualness: 0.8 
  }]);
  
  const [characterLibrary, setCharacterLibrary] = useState(PRESET_CHARACTERS); 
  const [showCharLibrary, setShowCharLibrary] = useState(false);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  
  const [closedTabs, setClosedTabs] = useState([]); 
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [diagnosticsLogs, setDiagnosticsLogs] = useState([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [toasts, setToasts] = useState([]); 
  const [lightboxItem, setLightboxItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [tabMenuOpenId, setTabMenuOpenId] = useState(null);
  
  // Tab Close Confirmation State
  const [dontAskCloseTab, setDontAskCloseTab] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  // Helpers
  const activeWorkspace = workspaces.find(w => w.id === activeTabId) || workspaces[0];
  const activeModel = MODEL_REGISTRY[activeWorkspace.modelId] || MODEL_REGISTRY[DEFAULT_MODEL];
  const fileInputRef = useRef(null);

  const addLog = useCallback((log) => {
    setDiagnosticsLogs(prev => [...prev.slice(-49), log]);
  }, []);

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleDownload = async (e, url, filename) => {
    e.stopPropagation();
    try {
      showToast("Downloading...");
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed, opening tab", err);
      window.open(url, '_blank');
    }
  };

  // --- ACTIONS: REF GROUPS ---
  const addReferenceGroup = () => {
    // Disable multi-group for video/motion models
    if (activeModel.type === 'image_to_video' || activeModel.type === 'motion_control') return; 
    const newGroup = { 
      id: generateId(), 
      name: `Reference ${activeWorkspace.referenceGroups.length + 1}`, 
      inputs: [],
      active: true
    };
    updateWorkspace(activeTabId, w => ({ referenceGroups: [...w.referenceGroups, newGroup] }));
  };

  const removeReferenceGroup = (groupId) => {
    updateWorkspace(activeTabId, w => {
      const newGroups = w.referenceGroups.filter(g => g.id !== groupId);
      if (newGroups.length === 0) return { referenceGroups: [{ id: generateId(), name: 'Reference 1', inputs: [], active: true }] };
      return { referenceGroups: newGroups };
    });
  };

  const toggleReferenceGroup = (groupId) => {
    updateWorkspace(activeTabId, w => ({
      referenceGroups: w.referenceGroups.map(g => {
        if (g.id === groupId) return { ...g, active: !g.active };
        return g;
      })
    }));
  };

  const addFilesToGroup = (files, groupId) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    
    const newInputs = fileList.map(file => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    updateWorkspace(activeTabId, w => ({
      referenceGroups: w.referenceGroups.map(g => {
        if (g.id === groupId) {
          return { ...g, inputs: [...g.inputs, ...newInputs] };
        }
        return g;
      })
    }));
  };

  const removeFileFromGroup = (groupId, fileId) => {
    updateWorkspace(activeTabId, w => ({
      referenceGroups: w.referenceGroups.map(g => {
        if (g.id === groupId) {
          return { ...g, inputs: g.inputs.filter(i => i.id !== fileId) };
        }
        return g;
      })
    }));
  };

  // --- ACTIONS: PROMPT UPDATE ---
  const handleEnhanceApply = (newPrompt) => {
    updateWorkspace(activeTabId, w => ({ prompt: newPrompt }));
    setShowEnhanceModal(false);
    showToast("Prompt updated");
  };

  // --- ACTIONS: INSPIRE ---
  const handleInspire = async () => {
    const casualness = activeWorkspace.inspireCasualness;
    
    if (activeWorkspace.inspireMode === 'gemini') {
      showToast("Asking Gemini...");
      try {
        const result = await apiProxy.inspire(activeWorkspace.lastInspirePrompt, casualness, addLog);
        if (result && result.prompt) {
          updateWorkspace(activeTabId, w => ({ 
            prompt: result.prompt, 
            lastInspirePrompt: result.prompt 
          }));
          showToast(`Gemini: ${result.category || 'Idea'}`);
        }
      } catch (e) {
        console.error(e);
        showToast("Gemini failed, falling back to Local");
        const result = generateLocalInspirePrompt(activeWorkspace.lastInspirePrompt, casualness);
        updateWorkspace(activeTabId, w => ({ 
          prompt: result.text, 
          lastInspirePrompt: result.text 
        }));
      }
    } else {
      const result = generateLocalInspirePrompt(activeWorkspace.lastInspirePrompt, casualness);
      updateWorkspace(activeTabId, w => ({ 
        prompt: result.text, 
        lastInspirePrompt: result.text 
      }));
      showToast(`Inspire: ${result.category}`);
    }
  };

  // --- ACTIONS: CHARACTERS ---
  const addCharacter = (char) => {
    setCharacterLibrary(prev => [...prev, char]);
    showToast(`Character "${char.displayName}" created`);
  };

  const deleteCharacter = (id) => {
    const char = characterLibrary.find(c => c.id === id);
    if (char?.isPreset) {
      showToast("Cannot delete preset characters");
      return;
    }
    
    if(confirm("Delete this character?")) {
      setCharacterLibrary(prev => prev.filter(c => c.id !== id));
    }
  };

  const useCharacter = (char) => {
    const newInputs = char.referenceImages.map(url => ({
      id: generateId(),
      file: null, 
      previewUrl: url,
      remoteUrl: url,
      isCharacterRef: true,
      charName: char.displayName
    }));
    
    updateWorkspace(activeTabId, w => ({
      referenceGroups: w.referenceGroups.map((g, i) => {
        if (i === 0) return { ...g, inputs: [...g.inputs, ...newInputs] };
        return g;
      })
    }));
    showToast(`Loaded ${char.displayName} into Group 1`);
  };

  // --- ACTIONS: TABS ---

  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    setWorkspaces(prev => [...prev, {
      id: newId,
      name: `Workspace ${prev.length + 1}`,
      modelId: DEFAULT_MODEL,
      referenceGroups: [{ id: generateId(), name: 'Reference 1', inputs: [], active: true }],
      prompt: "", 
      queue: [], 
      history: [],
      settings: MODEL_REGISTRY[DEFAULT_MODEL].uiDefaults,
      activeItem: null,
      lastAnglePromptIndex: -1,
      inspireMode: 'local',
      inspireCasualness: 0.8
    }]);
    setActiveTabId(newId);
    showToast("New tab created");
  };

  const handleDuplicateTab = (copyHistory) => {
    const tabToClone = workspaces.find(w => w.id === tabMenuOpenId);
    if (!tabToClone) return;

    const newId = `tab-${Date.now()}`;
    const newTab = {
       ...JSON.parse(JSON.stringify(tabToClone)), // Deep Clone
       id: newId,
       name: `${tabToClone.name} (Copy)`,
       queue: [], // Don't copy running jobs
       history: copyHistory ? JSON.parse(JSON.stringify(tabToClone.history)) : [],
       // Regenerate Group IDs to avoid collision
       referenceGroups: tabToClone.referenceGroups.map(g => ({
         ...g,
         id: generateId(),
         inputs: g.inputs.map(i => ({...i, id: generateId()})) // Regen input IDs too
       }))
    };

    setWorkspaces(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setShowDuplicateModal(false);
    setTabMenuOpenId(null);
    showToast("Tab duplicated");
  };

  const restoreTab = () => {
    if (closedTabs.length === 0) return;
    
    setClosedTabs(prev => {
      const newStack = [...prev];
      const tabToRestore = newStack.pop();
      setWorkspaces(ws => [...ws, tabToRestore]);
      setActiveTabId(tabToRestore.id);
      showToast(`Restored "${tabToRestore.name}"`);
      return newStack;
    });
  };

  const createNewTabWithContext = (modelKey, remoteImageUrl, prompt) => {
    const newId = `tab-${Date.now()}`;
    const modelDefaults = MODEL_REGISTRY[modelKey].uiDefaults;
    
    const newWorkspace = {
      id: newId,
      name: `New: ${MODEL_REGISTRY[modelKey].displayName}`,
      modelId: modelKey,
      referenceGroups: [{ 
        id: generateId(), 
        name: 'Reference 1', 
        active: true,
        inputs: [{ id: generateId(), file: null, previewUrl: remoteImageUrl, remoteUrl: remoteImageUrl }]
      }],
      prompt: prompt,
      queue: [],
      history: [],
      settings: modelDefaults,
      activeItem: null,
      lastAnglePromptIndex: -1,
      inspireMode: 'local',
      inspireCasualness: 0.8
    };
    
    setWorkspaces(prev => [...prev, newWorkspace]);
    setActiveTabId(newId);
    setLightboxItem(null); 
    showToast(`Started new task with ${MODEL_REGISTRY[modelKey].displayName}`);
  };

  const performCloseTab = (id) => {
    const tabToClose = workspaces.find(w => w.id === id);
    if (!tabToClose) return;

    setClosedTabs(prev => [...prev.slice(-9), tabToClose]);

    setWorkspaces(prev => {
      const remaining = prev.filter(w => w.id !== id);
      if (remaining.length === 0) {
        const newDefaultId = `tab-${Date.now()}`;
        setActiveTabId(newDefaultId);
        showToast("Closed tab & reset default");
        return [{
          id: newDefaultId,
          name: 'Workspace 1',
          modelId: DEFAULT_MODEL,
          referenceGroups: [{ id: generateId(), name: 'Reference 1', inputs: [], active: true }],
          prompt: "",
          queue: [],
          history: [],
          settings: MODEL_REGISTRY[DEFAULT_MODEL].uiDefaults,
          activeItem: null,
          lastAnglePromptIndex: -1,
          inspireMode: 'local',
          inspireCasualness: 0.8
        }];
      } else {
        if (activeTabId === id) {
          const closedIndex = prev.findIndex(w => w.id === id);
          const newActive = remaining[closedIndex - 1] || remaining[0];
          setActiveTabId(newActive.id);
        }
        showToast("Tab closed");
        return remaining;
      }
    });
  };

  const closeTab = (id) => {
    const tabToClose = workspaces.find(w => w.id === id);
    if (!tabToClose) return;

    const hasInputs = tabToClose.referenceGroups.some(g => g.inputs.length > 0);
    const hasData = tabToClose.queue.length > 0 || tabToClose.history.length > 0 || hasInputs;
    
    if (hasData && !dontAskCloseTab) {
      setConfirmModal({
        title: "Close tab?",
        message: `Closing "${tabToClose.name}" will remove its workspace state (inputs, history, queue).`,
        onConfirm: (shouldDontAsk) => {
          if (shouldDontAsk) setDontAskCloseTab(true);
          performCloseTab(id);
          setConfirmModal(null);
        },
        onCancel: () => setConfirmModal(null),
        showDontAsk: true
      });
      return;
    }
    performCloseTab(id);
  };

  const updateWorkspace = (id, updater) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updater(w) } : w));
  };

  const handleModelChange = (e) => {
    const newModelId = e.target.value;
    const newDefaults = MODEL_REGISTRY[newModelId].uiDefaults;
    updateWorkspace(activeTabId, w => ({ 
      modelId: newModelId,
      settings: newDefaults
    }));
  };

  const getRandomAnglePrompt = (currentWs) => {
    let idx = -1;
    for(let i=0; i<5; i++) {
       idx = Math.floor(Math.random() * ANGLE_PROMPTS.length);
       if(idx !== currentWs.lastAnglePromptIndex) break;
    }
    updateWorkspace(activeTabId, w => ({ lastAnglePromptIndex: idx }));
    return ANGLE_PROMPTS[idx];
  };

  // --- JOB RUNNER ---
  
  useEffect(() => {
    if (isPaused) return;
    workspaces.forEach(ws => {
      const activeJobs = ws.queue.filter(j => j.status === 'processing');
      const pendingJobs = ws.queue.filter(j => j.status === 'queued');
      if (activeJobs.length < DEFAULT_CONCURRENCY && pendingJobs.length > 0) {
        runJob(ws.id, pendingJobs[0]);
      }
    });
  }, [workspaces, isPaused]);

  const runJob = async (workspaceId, job) => {
    const processingStart = Date.now();
    updateWorkspace(workspaceId, w => ({
      queue: w.queue.map(j => j.id === job.id ? { ...j, status: 'processing', startedAt: new Date(processingStart) } : j)
    }));

    try {
      const ws = workspaces.find(w => w.id === workspaceId);
      const modelConfig = MODEL_REGISTRY[ws.modelId];
      
      let finalPrompt = job.prompt;
      
      if (job.settings.enhancePrompt) {
        finalPrompt = enhancePromptLogic(finalPrompt, ws.modelId);
      }

      if (modelConfig.type === 'image_to_video' && job.settings.upscaleVideo) {
         finalPrompt = upscaleVideoPrompt(finalPrompt, job.settings.upscaleIntensity);
      }

      const payload = { 
        prompt: finalPrompt,
        _modelType: modelConfig.type 
      };

      const allInputs = ws.referenceGroups.flatMap(g => g.inputs);
      let processedFiles = [];
      
      if (job.inputIds.length > 0) {
        processedFiles = await Promise.all(
          job.inputIds.map(id => {
            const input = allInputs.find(i => i.id === id);
            if (!input) throw new Error("Source input lost");
            if (input.remoteUrl) return Promise.resolve(input.remoteUrl);
            return processFileForApi(input.file);
          })
        );
      }

      if (modelConfig.type === 'motion_control') {
         // Special handling for Motion Control: identify image vs video input
         const imgInput = processedFiles.find(f => f.startsWith('data:image') || f.match(/\.(jpeg|jpg|png|webp)$/i) || !f.startsWith('data:video'));
         const vidInput = processedFiles.find(f => f.startsWith('data:video') || f.match(/\.(mp4|mov|webm)$/i));

         if (!imgInput) throw new Error("Motion Control requires a reference image.");
         if (!vidInput) throw new Error("Motion Control requires a reference video.");

         payload.image = imgInput;
         payload.video = vidInput;
         payload.character_orientation = job.settings.characterOrientation;
         payload.keep_original_sound = job.settings.keepOriginalSound;
         if (job.settings.negativePrompt) payload.negative_prompt = job.settings.negativePrompt;
      }
      else if (modelConfig.type === 'image_to_video') {
        if (modelConfig.key.includes("kling")) {
           payload.image = processedFiles[0]; 
           payload.duration = job.settings.duration || 5;
           payload.guidance_scale = job.settings.guidanceScale || 0.5;
        } 
        else if (modelConfig.key.includes("seedance")) {
           payload.image = processedFiles[0];
           payload.aspect_ratio = job.settings.aspectRatio;
           payload.duration = job.settings.duration || 5;
           payload.resolution = job.settings.resolution;
           payload.generate_audio = true;
        }
      } 
      else {
        payload.images = processedFiles;
        if (modelConfig.supports.resolutions.length > 0) payload.resolution = job.settings.resolution;
        if (modelConfig.supports.aspectRatios.length > 0) payload.aspect_ratio = job.settings.aspectRatio;
        if (modelConfig.supports.syncMode) payload.enable_sync_mode = job.settings.enableSync;
        payload.output_format = "png";
      }

      const result = await apiProxy.infer(payload, modelConfig.endpoint, addLog);
      
      let finalOutputs = [];
      let pollUrl = result.urls?.get;

      if (result.status === 'completed' && result.outputs?.length > 0) {
        finalOutputs = result.outputs;
      } else if (pollUrl) {
        let polling = true;
        let attempts = 0;
        const MAX = 1200; // Increased to 40 mins to prevent timeout
        while (polling && attempts < MAX) {
          await new Promise(r => setTimeout(r, 2000));
          const pollResult = await apiProxy.poll(pollUrl, addLog);
          if (pollResult.status === 'completed') {
             finalOutputs = pollResult.outputs || [];
             if (finalOutputs.length > 0 || attempts > 5) polling = false;
          } else if (pollResult.status === 'failed') {
            throw new Error(pollResult.error || "Async task failed");
          }
          attempts++;
        }
        if (polling) throw new Error("Timeout waiting for results");
      } else if (result.data?.outputs) {
         finalOutputs = result.data.outputs;
      }

      if (finalOutputs.length === 0) throw new Error("No output generated");

      const completionTime = Date.now();
      const runDuration = completionTime - processingStart;
      const queueDuration = processingStart - new Date(job.createdAt).getTime();
      const estCost = calculateCost(modelConfig.key, finalOutputs.length);

      const completedJob = {
        ...job,
        status: 'completed',
        completedAt: new Date(completionTime),
        outputs: finalOutputs,
        outputType: modelConfig.supports.outputType,
        promptEnhanced: job.settings.enhancePrompt,
        promptUpscaled: job.settings.upscaleVideo,
        inspiredBy: ws.lastInspirePrompt === finalPrompt, 
        finalPrompt: finalPrompt,
        stats: { runDuration, queueDuration, cost: estCost }
      };

      updateWorkspace(workspaceId, w => ({
        queue: w.queue.filter(j => j.id !== job.id),
        history: [completedJob, ...w.history],
        activeItem: workspaceId === activeTabId 
          ? { type: 'output', url: finalOutputs[0], job: completedJob }
          : w.activeItem
      }));

      if (workspaceId !== activeTabId) {
        showToast(`Job completed in ${workspaces.find(w => w.id === workspaceId)?.name}`);
      }

    } catch (err) {
      const failedJob = { ...job, status: 'failed', error: err.message, completedAt: new Date() };
      updateWorkspace(workspaceId, w => ({
        queue: w.queue.filter(j => j.id !== job.id),
        history: [failedJob, ...w.history]
      }));
      addLog({ type: 'error', id: job.id, error: err.message });
      showToast("Job failed");
    }
  };

  const enqueueJobs = () => {
    // FILTER OUT INACTIVE GROUPS
    const activeGroups = activeWorkspace.referenceGroups.filter(g => g.active);
    const hasAnyInputs = activeGroups.some(g => g.inputs.length > 0);
    
    // Check basic requirements
    if ((activeModel.supports.imagesRequired || activeModel.supports.videosRequired) && !hasAnyInputs) {
      alert("This model requires active reference inputs.");
      return;
    }

    const newJobs = [];
    
    activeGroups.forEach(group => {
      if ((activeModel.supports.imagesRequired || activeModel.supports.videosRequired) && group.inputs.length === 0) return;
      
      const groupPreview = group.inputs.length > 0 ? group.inputs[0].previewUrl : null;
      const count = 1; 

      for (let i = 0; i < count; i++) {
        newJobs.push({
           id: generateId(),
           inputIds: group.inputs.map(inp => inp.id), 
           inputPreview: groupPreview,
           prompt: activeWorkspace.prompt,
           settings: { ...activeWorkspace.settings, outputCount: 1 }, 
           status: 'queued',
           createdAt: new Date(),
           modelKey: activeModel.key,
           referenceGroupId: group.id,
           referenceGroupName: group.name
        });
      }
    });

    if (newJobs.length === 0 && !activeModel.supports.imagesRequired && !activeModel.supports.videosRequired) {
       newJobs.push({
           id: generateId(),
           inputIds: [],
           inputPreview: null,
           prompt: activeWorkspace.prompt,
           settings: { ...activeWorkspace.settings },
           status: 'queued',
           createdAt: new Date(),
           modelKey: activeModel.key,
           referenceGroupName: "Text Generation"
       });
    }

    // Immediately show loading screen for the first job
    const firstJob = newJobs[0];
    updateWorkspace(activeTabId, w => ({ 
      queue: [...w.queue, ...newJobs],
      activeItem: firstJob ? { type: 'job', data: firstJob, img: firstJob.inputPreview } : w.activeItem 
    }));
    
    showToast(`Queued ${newJobs.length} job(s)`);
  };

  // --- RENDER HELPERS ---
  const stripItems = useMemo(() => {
    const activeItems = activeWorkspace.queue.map(j => ({
      id: j.id, type: 'job', status: j.status, img: j.inputPreview, data: j
    }));
    const historyItems = activeWorkspace.history.flatMap(j => {
      if (j.status === 'failed') return [{ id: j.id, type: 'failed', status: 'failed', error: j.error, data: j }];
      return (j.outputs || []).map((url, idx) => ({ id: `${j.id}-${idx}`, type: 'output', status: 'completed', img: url, data: j }));
    });
    return [...activeItems, ...historyItems];
  }, [activeWorkspace.queue, activeWorkspace.history]);

  // --- UI COMPONENTS FOR OUTPUT ACTIONS ---
  const OutputActions = ({ url, className }) => (
    <div className={`flex items-center gap-1 ${className}`}>
      <button 
        onClick={(e) => { e.stopPropagation(); createNewTabWithContext('kling-2.5-turbo', url, "Create a short cinematic motion clip from the image with natural movement, subtle camera motion, and realistic lighting."); }}
        className="px-2 py-1 bg-black/60 hover:bg-blue-600 backdrop-blur rounded text-[9px] text-white font-medium transition-colors flex items-center gap-1 border border-white/10 shadow-sm"
        title="Animate with Kling"
      >
        <Film size={10} /> Kling
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); createNewTabWithContext('seedance-v1.5-pro', url, "Animate the image with natural human motion and subtle camera movement. Keep identity and scene consistent."); }}
        className="px-2 py-1 bg-black/60 hover:bg-purple-600 backdrop-blur rounded text-[9px] text-white font-medium transition-colors flex items-center gap-1 border border-white/10 shadow-sm"
        title="Animate with Seedance"
      >
        <MonitorPlay size={10} /> Dance
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); createNewTabWithContext('google/nano-banana-pro/edit', url, getRandomAnglePrompt(activeWorkspace)); }}
        className="px-2 py-1 bg-black/60 hover:bg-green-600 backdrop-blur rounded text-[9px] text-white font-medium transition-colors flex items-center gap-1 border border-white/10 shadow-sm"
        title="Change Angle"
      >
        <Camera size={10} /> Angle
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-gray-100 font-sans overflow-hidden relative" onClick={() => setTabMenuOpenId(null)}>
      
      {/* HEADER */}
      <div className="h-24 bg-gray-900 border-b border-gray-800 flex flex-col shrink-0 z-20">
        <div className="flex-1 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="text-blue-400" /> Noir OFM
            </h1>
            <div className="h-6 w-px bg-gray-700 mx-2"></div>
            <select 
              value={activeWorkspace.modelId}
              onChange={handleModelChange}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-blue-500 block w-64 p-1.5 pl-3 transition-colors"
            >
              {Object.values(MODEL_REGISTRY).map(m => (
                <option key={m.key} value={m.key}>{m.displayName}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
             <SessionStats workspaces={workspaces} />
             <button onClick={() => setShowCharLibrary(true)} className="text-gray-500 hover:text-white p-2 rounded hover:bg-gray-800" title="Character Library"><Users size={18} /></button>
             <button onClick={() => setShowDiagnostics(true)} className="text-gray-500 hover:text-white p-2 rounded hover:bg-gray-800"><Activity size={18} /></button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-end px-4 gap-1 overflow-x-auto scrollbar-none">
          {workspaces.map(ws => {
             const completed = ws.history.filter(j => j.status === 'completed');
             const count = completed.length;
             const cost = completed.reduce((acc, curr) => acc + (parseFloat(curr.stats?.cost) || 0), 0);
             const avgTime = count > 0 ? (completed.reduce((acc, curr) => acc + (curr.stats?.runDuration || 0), 0) / count / 1000).toFixed(1) : 0;
             const tooltip = `${count} jobs · $${cost.toFixed(2)} · avg ${avgTime}s`;

             return (
              <div 
                key={ws.id}
                onClick={() => setActiveTabId(ws.id)}
                title={tooltip}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-t-lg border-t border-l border-r border-gray-800 cursor-pointer select-none min-w-[140px] transition-all duration-200 ${activeTabId === ws.id ? 'bg-gray-950 text-white border-b-gray-950 mb-[-1px] z-10' : 'bg-gray-900 text-gray-500 hover:bg-gray-800'}`}
              >
                <span className="text-xs font-medium truncate max-w-[100px]">{ws.name}</span>
                {ws.queue.some(j => j.status === 'processing') && <Loader2 size={10} className="animate-spin text-blue-500 ml-auto" />}
                
                {/* MENU TRIGGER */}
                <button
                   onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTabMenuOpenId(tabMenuOpenId === ws.id ? null : ws.id); }}
                   className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-white ml-auto"
                >
                   <MoreHorizontal size={12} />
                </button>

                {/* CLOSE */}
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeTab(ws.id); }} 
                  className={`p-0.5 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all z-20 relative opacity-0 group-hover:opacity-100`}
                  title="Close Tab"
                >
                  <X size={12} />
                </button>
                
                {/* CONTEXT MENU */}
                {tabMenuOpenId === ws.id && (
                  <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-xl py-1 z-50 w-32 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={(e) => { e.stopPropagation(); setShowDuplicateModal(true); }} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                        <Copy size={12}/> Duplicate
                      </button>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={addTab} className="p-2 mb-1 text-gray-500 hover:text-white rounded hover:bg-gray-800 transition-colors" title="New Tab"><Plus size={16}/></button>
          
          {closedTabs.length > 0 && (
            <div className="relative group ml-1">
              <button 
                onClick={restoreTab} 
                className="p-2 mb-1 text-gray-500 hover:text-blue-400 rounded hover:bg-gray-800 transition-colors" 
                title={`Restore: ${closedTabs[closedTabs.length-1].name}`}
              >
                <RotateCcw size={16} />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 hidden group-hover:block w-48 z-50">
                 <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 px-2">Recently Closed</div>
                 {closedTabs.slice().reverse().map(t => (
                   <div key={t.id} className="px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 rounded truncate cursor-default">
                     {t.name}
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex min-h-0">
        
        {/* LEFT PANEL */}
        <div className="w-80 flex flex-col border-r border-gray-800 bg-gray-900/50 shrink-0">
          <div 
            className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-thin"
          >
            {/* Input Grid / Reference Groups */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                {activeModel.type === 'motion_control' ? "Inputs" : `Reference Groups (${activeWorkspace.referenceGroups.length})`}
                {(activeModel.type === 'image_to_video' || activeModel.type === 'motion_control') && <HelpCircle size={10} title="Multi-reference variants disabled for video models"/>}
              </span>
              <div className="flex gap-2">
                 {characterLibrary.length > 0 && activeModel.type !== 'motion_control' && (
                   <div className="relative group">
                     <button className="text-[10px] text-blue-400 hover:text-blue-300 font-medium">Use Character</button>
                     <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-xl p-1 hidden group-hover:block w-32 z-50">
                        {characterLibrary.map(char => (
                          <div key={char.id} onClick={() => useCharacter(char)} className="px-2 py-1 text-xs hover:bg-gray-800 cursor-pointer text-gray-300 rounded">
                            {char.displayName}
                          </div>
                        ))}
                     </div>
                   </div>
                 )}
              </div>
            </div>

            {activeModel.type === 'motion_control' ? (
                <MotionControlInputs 
                    inputs={activeWorkspace.referenceGroups[0].inputs}
                    onAdd={(files) => addFilesToGroup(files, activeWorkspace.referenceGroups[0].id)}
                    onRemove={(fileId) => removeFileFromGroup(activeWorkspace.referenceGroups[0].id, fileId)}
                />
            ) : (
                <div className="space-y-2 mb-4">
                  {activeWorkspace.referenceGroups.map(group => (
                    <ReferenceGroup 
                      key={group.id} 
                      group={group}
                      disabled={false}
                      onToggleActive={() => toggleReferenceGroup(group.id)}
                      onDelete={() => removeReferenceGroup(group.id)}
                      onFilesAdded={(files) => addFilesToGroup(files, group.id)}
                      onFileRemove={(fileId) => removeFileFromGroup(group.id, fileId)}
                      acceptTypes={activeModel.type === 'motion_control' ? "image/*,video/*" : "image/*"}
                    />
                  ))}
                  
                  <button 
                    onClick={addReferenceGroup}
                    disabled={activeModel.type === 'image_to_video' || activeModel.type === 'motion_control'}
                    className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-white hover:border-blue-500 hover:bg-gray-800/50 text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Video models do not support multi-reference variant generation yet."
                  >
                    <Plus size={14} /> Add Reference Group
                  </button>
                </div>
            )}

            <div className="mb-2 flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Prompt</label>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setShowEnhanceModal(true)}
                   className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors bg-purple-900/50 text-purple-300 border border-purple-500/50 hover:bg-purple-900/80`}
                 >
                   {activeModel.type === 'image_to_video' || activeModel.type === 'motion_control' ? <PlayCircle size={10} /> : <Sparkles size={10} />}
                   {activeModel.type === 'image_to_video' || activeModel.type === 'motion_control' ? "Upscale Video..." : "Enhance..."}
                 </button>
              </div>
            </div>
            <textarea value={activeWorkspace.prompt} onChange={e => updateWorkspace(activeTabId, w => ({ prompt: e.target.value }))} className="w-full h-48 bg-black/40 border border-gray-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-y placeholder-gray-600 mb-2 min-h-[100px]" placeholder="Describe your request..." />
            
            {/* LIVE PREVIEW OF TRANSFORMATION */}
            {showPreview && (
               <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded text-xs space-y-2 animate-in fade-in slide-in-from-top-2">
                 <div>
                   <span className="text-gray-500 font-bold block mb-1">ORIGINAL</span>
                   <p className="text-gray-300">{activeWorkspace.prompt || "(Empty)"}</p>
                 </div>
                 {activeWorkspace.settings.enhancePrompt && (
                   <div>
                     <div className="flex items-center gap-1 text-purple-400 font-bold mb-1"><Sparkles size={10}/> ENHANCED</div>
                     <p className="text-purple-200/80 italic">{enhancePromptLogic(activeWorkspace.prompt, activeWorkspace.modelId)}</p>
                   </div>
                 )}
                 {activeWorkspace.settings.upscaleVideo && (activeModel.type === 'image_to_video' || activeModel.type === 'motion_control') && (
                   <div>
                     <div className="flex items-center gap-1 text-cyan-400 font-bold mb-1"><PlayCircle size={10}/> VIDEO UPSCALED</div>
                     <p className="text-cyan-200/80 italic">
                       {upscaleVideoPrompt(
                         activeWorkspace.settings.enhancePrompt ? enhancePromptLogic(activeWorkspace.prompt, activeWorkspace.modelId) : activeWorkspace.prompt, 
                         activeWorkspace.settings.upscaleIntensity
                       )}
                     </p>
                   </div>
                 )}
               </div>
            )}

            {/* VIDEO UPSCALE CONTROLS (Only for Video Models) */}
            {(activeModel.type === 'image_to_video' || activeModel.type === 'motion_control') && (
              <div className="mb-3 flex items-center justify-between bg-cyan-900/10 p-2 rounded border border-cyan-900/30">
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, upscaleVideo: !w.settings.upscaleVideo } }))}
                      className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-colors ${activeWorkspace.settings.upscaleVideo ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      <PlayCircle size={12} /> Video Upscale
                    </button>
                    {activeWorkspace.settings.upscaleVideo && (
                      <select 
                        value={activeWorkspace.settings.upscaleIntensity}
                        onChange={e => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, upscaleIntensity: e.target.value } }))}
                        className="bg-black border border-gray-700 text-[10px] text-cyan-200 rounded px-1 py-1 h-6"
                      >
                        <option value="light">Light</option>
                        <option value="medium">Medium</option>
                        <option value="strong">Strong</option>
                      </select>
                    )}
                 </div>
              </div>
            )}

            {/* INSPIRE BUTTONS */}
            {activeWorkspace.modelId === "google/nano-banana-pro/edit" && (
              <div className="mb-3 flex flex-col gap-2 bg-gray-900 p-2 rounded border border-gray-800">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button 
                          onClick={handleInspire}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded transition-colors border border-yellow-500/20"
                        >
                          <Lightbulb size={12} /> Inspire Me
                        </button>
                        <select 
                          value={activeWorkspace.inspireMode} 
                          onChange={e => updateWorkspace(activeTabId, w => ({ inspireMode: e.target.value }))}
                          className="bg-black border border-gray-700 text-[10px] text-gray-300 rounded px-1 py-1 h-7"
                        >
                          <option value="local">Local Ideas</option>
                          <option value="gemini">Gemini AI</option>
                        </select>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => { navigator.clipboard.writeText(activeWorkspace.prompt); showToast("Prompt copied"); }} className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-gray-800" title="Copy Prompt"><Copy size={12} /></button>
                        <button className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-gray-800" title="Save Preset (Stub)"><Save size={12} /></button>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider w-16">Aesthetic</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={activeWorkspace.inspireCasualness} 
                      onChange={(e) => updateWorkspace(activeTabId, w => ({ inspireCasualness: parseFloat(e.target.value) }))}
                      className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider w-16 text-right">Very Casual</span>
                 </div>
              </div>
            )}

            {/* CONDITIONAL SETTINGS */}
            <div className="space-y-4">
              
              {/* Aspect / Resolution */}
              {(activeModel.supports.aspectRatios.length > 0 || activeModel.supports.resolutions.length > 0) && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Config</label>
                  <div className="grid grid-cols-2 gap-2">
                    {activeModel.supports.aspectRatios.length > 0 && (
                      <select value={activeWorkspace.settings.aspectRatio} onChange={e => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, aspectRatio: e.target.value } }))} className="bg-gray-800 border-none rounded text-xs py-2 px-2 text-gray-200">
                        {activeModel.supports.aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                    {activeModel.supports.resolutions.length > 0 && (
                      <select value={activeWorkspace.settings.resolution} onChange={e => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, resolution: e.target.value } }))} className="bg-gray-800 border-none rounded text-xs py-2 px-2 text-gray-200">
                        {activeModel.supports.resolutions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Video Specific: Duration */}
              {activeModel.supports.durations && (
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Duration (Sec)</label>
                    <div className="flex gap-2">
                      {activeModel.supports.durations.map(d => (
                          <button 
                            key={d}
                            onClick={() => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, duration: d } }))}
                            className={`flex-1 py-1.5 rounded text-xs border ${activeWorkspace.settings.duration === d ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                          >
                            {d}s
                          </button>
                      ))}
                    </div>
                 </div>
              )}

              {/* Motion Control Specifics */}
              {activeModel.type === 'motion_control' && (
                 <>
                   <div className="pt-2 border-t border-gray-800">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Orientation Control</label>
                      <div className="flex gap-2">
                         <button onClick={() => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, characterOrientation: 'image' } }))} className={`flex-1 py-1.5 rounded text-xs border ${activeWorkspace.settings.characterOrientation === 'image' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Match Image</button>
                         <button onClick={() => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, characterOrientation: 'video' } }))} className={`flex-1 py-1.5 rounded text-xs border ${activeWorkspace.settings.characterOrientation === 'video' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Match Video</button>
                      </div>
                   </div>
                   
                   <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Music size={12}/> Keep Original Sound</span>
                      <button onClick={() => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, keepOriginalSound: !w.settings.keepOriginalSound } }))} className={`w-8 h-4 rounded-full relative transition-colors ${activeWorkspace.settings.keepOriginalSound ? 'bg-green-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${activeWorkspace.settings.keepOriginalSound ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                      </button>
                   </div>
                 </>
              )}

              {/* Output Count */}
              {activeModel.supports.outputsMax > 1 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Outputs Count</label>
                  <div className="flex items-center gap-1 bg-gray-800 rounded p-1">
                    {[1, 2, 3, 4].slice(0, activeModel.supports.outputsMax).map(n => (
                      <button key={n} onClick={() => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, outputCount: n } }))} className={`flex-1 h-6 flex items-center justify-center text-xs rounded transition-colors ${activeWorkspace.settings.outputCount === n ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync Mode */}
              {activeModel.supports.syncMode && (
                <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                   <span>Sync Mode</span>
                   <button onClick={() => updateWorkspace(activeTabId, w => ({ settings: { ...w.settings, enableSync: !w.settings.enableSync } }))} className={`w-8 h-4 rounded-full relative transition-colors ${activeWorkspace.settings.enableSync ? 'bg-blue-600' : 'bg-gray-700'}`}>
                     <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${activeWorkspace.settings.enableSync ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                   </button>
                </div>
              )}
              
              {/* Angle Strength (Pseudo-setting for prompt logic) */}
              {activeModel.key.includes('edit') && (
                 <div className="pt-2 border-t border-gray-800">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Angle Change Strength</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-blue-400 font-mono bg-blue-900/30 px-2 py-0.5 rounded">Subtle</span>
                    </div>
                 </div>
              )}

            </div>
          </div>
          
          <div className="p-4 border-t border-gray-800 bg-gray-900">
             <Button variant="primary" icon={Play} onClick={enqueueJobs} disabled={(activeModel.supports.imagesRequired || activeModel.supports.videosRequired) && !activeWorkspace.referenceGroups.some(g => g.inputs.length > 0)} className="w-full py-3 text-base shadow-blue-500/20">Generate</Button>
          </div>
        </div>

        {/* CENTER: PRIMARY VIEWER */}
        <div className="flex-1 flex flex-col min-w-0 bg-black relative">
          <div className="h-12 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6">
             <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="font-bold text-gray-200">Result Viewer</span>
                {activeWorkspace.activeItem && <span className="opacity-50 font-mono text-xs">ID: {activeWorkspace.activeItem.job?.id.substring(0,8)}</span>}
             </div>
             {activeWorkspace.queue.length > 0 && <div className="flex items-center gap-2 text-xs text-blue-400"><Loader2 size={14} className="animate-spin"/> {activeWorkspace.queue.length} In Queue</div>}
          </div>

          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative group/viewer">
            {!activeWorkspace.activeItem ? (
               <div className="text-center text-gray-700 select-none"><ImageIcon size={64} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-medium">No result selected</p></div>
            ) : activeWorkspace.activeItem.type === 'output' ? (
               <div 
                  className="relative w-full h-full flex items-center justify-center animate-in fade-in duration-300 cursor-zoom-in"
                  onClick={() => setLightboxItem(activeWorkspace.activeItem)}
               >
                  {/* Prompt Overlay */}
                  <div className="absolute top-4 left-4 right-4 z-20 opacity-0 group-hover/viewer:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <div className="bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg p-3 shadow-xl max-w-2xl mx-auto">
                          <div className="flex justify-between items-start gap-4">
                              <div>
                                  <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Prompt Used</span>
                                  <p className="text-xs text-gray-300 line-clamp-3">{activeWorkspace.activeItem.job.prompt}</p>
                              </div>
                              <button 
                                  onClick={(e) => { 
                                      e.stopPropagation(); 
                                      updateWorkspace(activeTabId, w => ({ prompt: activeWorkspace.activeItem.job.prompt }));
                                      showToast("Prompt restored to input");
                                  }}
                                  className="p-1.5 bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white rounded transition-colors shrink-0 flex items-center gap-1"
                                  title="Use this prompt"
                              >
                                  <CornerUpLeft size={14} /> <span className="text-[10px] font-bold">USE</span>
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Smart Render: Video vs Image */}
                  {activeWorkspace.activeItem.job.outputType === 'video' || activeWorkspace.activeItem.url.match(/\.(mp4|webm|mov)/i) ? (
                    <div className="relative max-w-full max-h-full aspect-video shadow-2xl rounded-sm overflow-hidden bg-black pointer-events-none">
                       <video src={activeWorkspace.activeItem.url} className="w-full h-full object-contain" autoPlay loop muted />
                    </div>
                  ) : (
                    <img src={activeWorkspace.activeItem.url} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />
                  )}
                  
                  {/* Overlay Controls */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover/viewer:opacity-100 transition-opacity pointer-events-auto" onClick={e => e.stopPropagation()}>
                      <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full px-4 py-2 flex gap-4 shadow-xl items-center">
                         <button onClick={(e) => handleDownload(e, activeWorkspace.activeItem.url, `wavespeed-${activeWorkspace.activeItem.job.id}.${activeWorkspace.activeItem.job.outputType === 'video' ? 'mp4' : 'png'}`)} className="text-gray-300 hover:text-white" title="Download"><Download size={18} /></button>
                         <button onClick={() => setLightboxItem(activeWorkspace.activeItem)} className="text-gray-300 hover:text-white" title="Maximize"><Maximize2 size={18}/></button>
                         <div className="w-px h-4 bg-gray-700"></div>
                         {(!activeWorkspace.activeItem.job.outputType || activeWorkspace.activeItem.job.outputType === 'image') && (
                           <div className="flex gap-2">
                              <OutputActions url={activeWorkspace.activeItem.url} className="" />
                           </div>
                         )}
                      </div>
                  </div>
               </div>
            ) : activeWorkspace.activeItem.type === 'job' ? (
               <div className="flex flex-col items-center justify-center text-blue-400">
                  <Loader2 size={48} className="animate-spin mb-4" />
                  <p className="font-mono text-sm">Processing...</p>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm text-center truncate">{activeWorkspace.activeItem.data.prompt}</p>
               </div>
            ) : (
              <div className="text-red-500 flex flex-col items-center"><AlertCircle size={48} className="mb-2"/><p>Generation Failed</p><p className="text-xs max-w-md text-center mt-2 opacity-70">{activeWorkspace.activeItem.error}</p></div>
            )}
          </div>
        </div>

        {/* RIGHT: STRIP */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-800 bg-gray-900 sticky top-0 z-10 font-bold text-xs text-gray-500 uppercase tracking-wider">History</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
             {stripItems.map((item) => (
               <HistoryTile 
                 key={item.id}
                 item={item}
                 isActive={activeWorkspace.activeItem?.url === item.img}
                 onClick={() => {
                    const itemData = item.type === 'output' ? { type: 'output', url: item.img, job: item.data } : item.type === 'failed' ? { type: 'failed', error: item.error, data: item.data } : { type: 'job', data: item.data };
                    updateWorkspace(activeTabId, w => ({ 
                      activeItem: itemData,
                      prompt: item.data.prompt // Auto-restore prompt
                    }));
                 }}
                 OutputActions={OutputActions}
                 onDownload={handleDownload}
               />
             ))}
          </div>
        </div>

      </div>

      {/* OVERLAYS */}
      <Lightbox 
        item={lightboxItem} 
        onClose={() => setLightboxItem(null)} 
        actions={lightboxItem ? <OutputActions url={lightboxItem.url} /> : null}
      />
      <CharacterLibraryModal 
        isOpen={showCharLibrary} 
        onClose={() => setShowCharLibrary(false)} 
        library={characterLibrary}
        onAddCharacter={addCharacter}
        onDeleteCharacter={deleteCharacter}
      />
      <EnhancePromptModal 
        isOpen={showEnhanceModal}
        onClose={() => setShowEnhanceModal(false)}
        originalPrompt={activeWorkspace.prompt}
        modelKey={activeWorkspace.modelId}
        onApply={handleEnhanceApply}
      />
      <DuplicateTabModal 
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onDuplicate={handleDuplicateTab}
      />
      
      {/* CONFIRMATION MODAL */}
      <ConfirmationModal 
        isOpen={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={confirmModal?.onConfirm}
        onCancel={confirmModal?.onCancel}
        showDontAsk={confirmModal?.showDontAsk}
      />

      <DiagnosticsPanel logs={diagnosticsLogs} isOpen={showDiagnostics} onClose={() => setShowDiagnostics(false)} />
      
      {/* TOASTS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[200]">
        {toasts.map(t => (
          <div key={t.id} className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg border border-gray-700 animate-in slide-in-from-bottom-2 fade-in text-sm font-medium">
             {t.message}
          </div>
        ))}
      </div>

    </div>
  );
}
