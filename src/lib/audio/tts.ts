/**
 * TTS Engine — client-side speech synthesis for Chinese poem recitation.
 *
 * Primary: Transformers.js with a Chinese TTS model (WebGPU/WebNN accelerated).
 * Fallback: Web Speech API (speechSynthesis).
 *
 * The engine auto-detects WebGPU support at init time and picks the best path.
 * Models are cached in IndexedDB via Transformers.js's built-in caching.
 */

export type TTSBackend = "transformers" | "webspeech" | "none";

export interface TTSEngine {
  backend: TTSBackend;
  ready: boolean;
  speak(text: string): Promise<void>;
  stop(): void;
  isPlaying(): boolean;
}

let _engine: TTSEngine | null = null;
let _hfDomain: string | null = null;

/**
 * Detect whether huggingface.co is reachable (blocked in China).
 * Falls back to hf-mirror.com if the main domain is unreachable.
 */
async function getHuggingFaceDomain(): Promise<string> {
  if (_hfDomain) return _hfDomain;

  const mainDomain = "huggingface.co";
  const mirrorDomain = "hf-mirror.com";

  async function checkDomain(domain: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`https://${domain}/Xenova/mms-tts-zho/resolve/main/config.json`, {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  if (await checkDomain(mainDomain)) {
    _hfDomain = mainDomain;
  } else if (await checkDomain(mirrorDomain)) {
    _hfDomain = mirrorDomain;
  } else {
    _hfDomain = mainDomain;
  }

  return _hfDomain;
}

/**
 * Check if WebGPU is available in this browser.
 */
async function hasWebGPU(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  if (!("gpu" in navigator)) return false;
  try {
    const gpu = (navigator as any).gpu;
    const adapter = await gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Transformers.js-backed TTS engine.
 * Lazy-loads the model on first speak() call.
 */
function createTransformersEngine(): TTSEngine {
  let pipeline: any = null;
  let loading = false;
  let currentAudio: HTMLAudioElement | null = null;
  let sharedAudioCtx: AudioContext | null = null;
  let resolveRef: (() => void) | null = null;

  const engine: TTSEngine = {
    backend: "transformers",
    ready: false,

    async speak(text: string) {
      if (!pipeline && !loading) {
        loading = true;
        try {
          const [{ pipeline: createPipeline, env }, domain] = await Promise.all([
            // @ts-ignore — @xenova/transformers is loaded at runtime from CDN, not bundled
            import(/* webpackIgnore: true */ "@xenova/transformers"),
            getHuggingFaceDomain(),
          ]);

          // Rewrite model host if huggingface.co is blocked
          if (domain !== "huggingface.co") {
            env.remoteHost = `https://${domain}`;
            env.remotePathTemplate = "{model}/resolve/{revision}/";
          }

          pipeline = await createPipeline("text-to-speech", "Xenova/mms-tts-zho", {
            device: "webgpu",
          });
          engine.ready = true;
        } catch (err) {
          console.warn("Transformers.js TTS init failed, will fallback:", err);
          loading = false;
          const fallback = createWebSpeechEngine();
          return fallback.speak(text);
        }
        loading = false;
      }

      if (!pipeline) return;

      try {
        const result = await pipeline(text);
        const audioData = result.audio;
        const sampleRate = result.sampling_rate;

        // Convert raw audio to WAV blob (reuse AudioContext to avoid browser limit)
        if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
          sharedAudioCtx = new AudioContext({ sampleRate });
        }
        const buffer = sharedAudioCtx.createBuffer(1, audioData.length, sampleRate);
        buffer.copyToChannel(new Float32Array(audioData), 0);

        const offlineCtx = new OfflineAudioContext(1, audioData.length, sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineCtx.destination);
        source.start();
        const rendered = await offlineCtx.startRendering();

        // Encode to WAV
        const wav = encodeWAV(rendered);
        const blob = new Blob([wav.buffer as ArrayBuffer], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);

        return new Promise<void>((resolve) => {
          resolveRef = resolve;
          currentAudio = new Audio(url);
          currentAudio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            resolveRef = null;
            resolve();
          };
          currentAudio.onerror = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            resolveRef = null;
            resolve();
          };
          currentAudio.play();
        });
      } catch (err) {
        console.warn("TTS generation failed:", err);
      }
    },

    stop() {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
        currentAudio = null;
      }
      if (resolveRef) {
        resolveRef();
        resolveRef = null;
      }
    },

    isPlaying() {
      return currentAudio !== null && !currentAudio.paused;
    },
  };

  return engine;
}

/**
 * Web Speech API fallback engine.
 */
function createWebSpeechEngine(): TTSEngine {
  let speaking = false;
  let resolveRef: (() => void) | null = null;

  const engine: TTSEngine = {
    backend: "webspeech",
    ready: typeof window !== "undefined" && "speechSynthesis" in window,

    async speak(text: string) {
      if (!("speechSynthesis" in window)) return;

      return new Promise<void>((resolve) => {
        resolveRef = resolve;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = 0.85;
        utterance.pitch = 1.0;

        const voices = speechSynthesis.getVoices();
        const zhVoice = voices.find(
          (v) => v.lang.startsWith("zh") && v.localService
        ) ?? voices.find((v) => v.lang.startsWith("zh"));
        if (zhVoice) utterance.voice = zhVoice;

        utterance.onstart = () => { speaking = true; };
        utterance.onend = () => { speaking = false; resolveRef = null; resolve(); };
        utterance.onerror = () => { speaking = false; resolveRef = null; resolve(); };

        speechSynthesis.speak(utterance);
      });
    },

    stop() {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        speaking = false;
        if (resolveRef) {
          resolveRef();
          resolveRef = null;
        }
      }
    },

    isPlaying() {
      return speaking;
    },
  };

  return engine;
}

/**
 * Encode AudioBuffer channel data to a WAV Uint8Array.
 */
function encodeWAV(audioBuffer: AudioBuffer): Uint8Array {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

/**
 * Get or initialize the TTS engine singleton.
 * Auto-selects best available backend.
 */
export async function getTTSEngine(): Promise<TTSEngine> {
  if (_engine) return _engine;

  if (await hasWebGPU()) {
    _engine = createTransformersEngine();
  } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
    _engine = createWebSpeechEngine();
  } else {
    _engine = {
      backend: "none",
      ready: false,
      async speak() {},
      stop() {},
      isPlaying() { return false; },
    };
  }

  return _engine;
}

/**
 * Convert poem content_lines to a recitation string.
 * Format: "Title, Author. Line1, Line2, ..."
 */
export function poemToRecitationText(
  title: string,
  author: string,
  lines: { chars: { char: string }[]; punctuation?: string }[]
): string {
  const lineTexts = lines.map(
    (line) => line.chars.map((c) => c.char).join("") + (line.punctuation ?? "")
  );
  return `${title}，${author}。${lineTexts.join("")}`;
}
