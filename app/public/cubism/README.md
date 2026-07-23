# Cubism Core Runtime

This folder should contain the Cubism Core runtime file required for Live2D models.

## Required File:
- `live2dcubismcore.min.js`

## How to obtain:
1. Download from the official Live2D Cubism SDK: https://www.live2d.com/en/sdk/download/web/
2. Extract the SDK and find `Core/live2dcubismcore.min.js`
3. Place it in this folder

## Alternative (for testing only):
For development/testing, you can use the CDN version by updating the Script tag in layout.tsx:
```jsx
<Script 
  src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js" 
  strategy="beforeInteractive"
/>
```

Note: The CDN version is not recommended for production use.