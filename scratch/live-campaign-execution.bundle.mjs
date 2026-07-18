var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// ../../node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "../../node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/main.js"(exports, module) {
    var fs = __require("fs");
    var path = __require("path");
    var os = __require("os");
    var crypto = __require("crypto");
    var TIPS = [
      "\u25C8 encrypted .env [www.dotenvx.com]",
      "\u25C8 secrets for agents [www.dotenvx.com]",
      "\u2301 auth for agents [www.vestauth.com]",
      "\u2318 custom filepath { path: '/custom/path/.env' }",
      "\u2318 enable debugging { debug: true }",
      "\u2318 override existing { override: true }",
      "\u2318 suppress logs { quiet: true }",
      "\u2318 multiple files { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text) {
      return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`\u26A0 ${message}`);
    }
    function _debug(message) {
      console.log(`\u2506 ${message}`);
    }
    function _log(message) {
      console.log(`\u25C7 ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("no encoding is specified (UTF-8 is used by default)");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// ../../node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "../../node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/env-options.js"(exports, module) {
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module.exports = options;
  }
});

// ../../node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "../../node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/cli-options.js"(exports, module) {
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// ../../node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// ../../lib/video-renderer/src/tts-service.ts
import { randomUUID } from "node:crypto";
var TTSService = class {
  apiKey = process.env["ELEVENLABS_API_KEY"];
  defaultVoiceId = process.env["ELEVENLABS_DEFAULT_VOICE_ID"] || "21m00Tcm4TlvDq8ikWAM";
  // Rachel
  async generateVoiceover(input) {
    const voiceId = input.voiceId || this.defaultVoiceId;
    const modelId = input.modelId || "eleven_multilingual_v2";
    if (!this.apiKey) {
      return {
        audioId: randomUUID(),
        status: "failed",
        error: "ELEVENLABS_API_KEY is not configured in environment variables (.env). Please provide it to generate real voiceovers."
      };
    }
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey
        },
        body: JSON.stringify({
          text: input.script,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        return {
          audioId: randomUUID(),
          status: "failed",
          error: `ElevenLabs API error (${response.status}): ${errText}`
        };
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return {
        audioId: randomUUID(),
        audioBufferBase64: base64,
        status: "completed"
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        audioId: randomUUID(),
        status: "failed",
        error: `TTS Request failed: ${message}`
      };
    }
  }
};

// ../../lib/video-renderer/src/video-service.ts
import { randomUUID as randomUUID2 } from "node:crypto";
var VideoService = class {
  heygenApiKey = process.env["HEYGEN_API_KEY"];
  didApiKey = process.env["DID_API_KEY"];
  async renderVideo(input) {
    const aspectRatio = input.aspectRatio || "9:16";
    const avatarId = input.avatarId || "Daisy-DRY_20230704";
    const voiceId = input.voiceId || "1bd001e7e50f421d891986aad5158bc8";
    if (this.heygenApiKey) {
      try {
        const response = await fetch("https://api.heygen.com/v2/video/generate", {
          method: "POST",
          headers: {
            "X-Api-Key": this.heygenApiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            video_inputs: [
              {
                character: {
                  type: "avatar",
                  avatar_id: avatarId,
                  avatar_style: "normal"
                },
                voice: {
                  type: "text",
                  input_text: input.script,
                  voice_id: voiceId
                },
                background: input.backgroundUrl ? { type: "image", url: input.backgroundUrl } : { type: "color", value: "#0a0614" }
              }
            ],
            dimension: aspectRatio === "9:16" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
            title: input.title || `OCTOPUS Video - ${(/* @__PURE__ */ new Date()).toISOString()}`
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          return {
            videoId: randomUUID2(),
            status: "failed",
            error: `HeyGen API error (${response.status}): ${errText}`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        const data = await response.json();
        const videoId = data.data?.video_id || randomUUID2();
        return {
          videoId,
          status: "processing",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          videoId: randomUUID2(),
          status: "failed",
          error: `HeyGen Request failed: ${message}`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    }
    if (this.didApiKey) {
      try {
        const response = await fetch("https://api.d-id.com/talks", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${this.didApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            script: {
              type: "text",
              input: input.script
            },
            source_url: input.avatarUrl || "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg"
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          return {
            videoId: randomUUID2(),
            status: "failed",
            error: `D-ID API error (${response.status}): ${errText}`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        const data = await response.json();
        return {
          videoId: data.id || randomUUID2(),
          status: "processing",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          videoId: randomUUID2(),
          status: "failed",
          error: `D-ID Request failed: ${message}`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    }
    return {
      videoId: randomUUID2(),
      status: "failed",
      error: "No video rendering API keys configured. Please add HEYGEN_API_KEY or DID_API_KEY to your Railway/.env file to generate real MP4 videos.",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async getVideoStatus(videoId) {
    if (this.heygenApiKey) {
      try {
        const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
          headers: { "X-Api-Key": this.heygenApiKey }
        });
        if (response.ok) {
          const data = await response.json();
          const statusStr = data.data?.status?.toLowerCase();
          const status = statusStr === "completed" ? "completed" : statusStr === "failed" ? "failed" : "processing";
          return {
            videoId,
            videoUrl: data.data?.video_url,
            status,
            error: data.data?.error,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      } catch {
      }
    }
    return {
      videoId,
      status: "processing",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};

// ../../lib/social-publisher/src/youtube-publisher.ts
import { randomUUID as randomUUID3 } from "node:crypto";
var YouTubePublisher = class {
  clientId = process.env["YOUTUBE_CLIENT_ID"];
  clientSecret = process.env["YOUTUBE_CLIENT_SECRET"];
  refreshToken = process.env["YOUTUBE_REFRESH_TOKEN"];
  accessToken = process.env["YOUTUBE_ACCESS_TOKEN"];
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;
    if (!this.clientId || !this.clientSecret || !this.refreshToken) return null;
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: "refresh_token"
        })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.access_token || null;
    } catch {
      return null;
    }
  }
  async publish(input) {
    const token = await this.getAccessToken();
    if (!token) {
      return {
        platformVideoId: randomUUID3(),
        status: "failed",
        error: "YouTube credentials not found in environment. Please configure YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN (or YOUTUBE_ACCESS_TOKEN) in Railway/.env to enable real YouTube uploads."
      };
    }
    if (!input.videoUrl && !input.videoPath) {
      return {
        platformVideoId: randomUUID3(),
        status: "failed",
        error: "Either videoUrl or videoPath is required to publish to YouTube."
      };
    }
    try {
      let videoBuffer;
      if (input.videoUrl) {
        const vidResp = await fetch(input.videoUrl);
        if (!vidResp.ok) {
          return {
            platformVideoId: randomUUID3(),
            status: "failed",
            error: `Failed to fetch video file from URL: ${vidResp.statusText}`
          };
        }
        videoBuffer = await vidResp.arrayBuffer();
      } else {
        return {
          platformVideoId: randomUUID3(),
          status: "failed",
          error: "Local videoPath upload requires filesystem streaming support. Please pass videoUrl from renderer."
        };
      }
      const metadata = {
        snippet: {
          title: input.title,
          description: input.description,
          tags: input.tags || [],
          categoryId: "22"
          // People & Blogs
        },
        status: {
          privacyStatus: input.privacyStatus || "public",
          selfDeclaredMadeForKids: false
        }
      };
      const initResponse = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(videoBuffer.byteLength),
          "X-Upload-Content-Type": "video/mp4"
        },
        body: JSON.stringify(metadata)
      });
      if (!initResponse.ok) {
        const errText = await initResponse.text();
        return {
          platformVideoId: randomUUID3(),
          status: "failed",
          error: `YouTube Resumable Init failed (${initResponse.status}): ${errText}`
        };
      }
      const uploadUrl = initResponse.headers.get("Location");
      if (!uploadUrl) {
        return {
          platformVideoId: randomUUID3(),
          status: "failed",
          error: "YouTube did not return upload URL Location header."
        };
      }
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4"
        },
        body: videoBuffer
      });
      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        return {
          platformVideoId: randomUUID3(),
          status: "failed",
          error: `YouTube Video Bytes Upload failed (${uploadResponse.status}): ${errText}`
        };
      }
      const uploadData = await uploadResponse.json();
      const videoId = uploadData.id || randomUUID3();
      return {
        platformVideoId: videoId,
        platformVideoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        status: "completed",
        publishedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platformVideoId: randomUUID3(),
        status: "failed",
        error: `YouTube Publisher Error: ${message}`
      };
    }
  }
};

// ../../lib/social-publisher/src/tiktok-publisher.ts
import { randomUUID as randomUUID4 } from "node:crypto";
var TikTokPublisher = class {
  clientKey = process.env["TIKTOK_CLIENT_KEY"];
  clientSecret = process.env["TIKTOK_CLIENT_SECRET"];
  accessToken = process.env["TIKTOK_ACCESS_TOKEN"];
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;
    if (!this.clientKey || !this.clientSecret) return null;
    try {
      const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: "client_credentials"
        })
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  }
  async publish(input) {
    const token = await this.getAccessToken();
    if (!token) {
      return {
        platformVideoId: randomUUID4(),
        status: "failed",
        error: "TikTok API credentials not found in environment. Please configure TIKTOK_ACCESS_TOKEN or (TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET) in Railway/.env to enable real TikTok uploads."
      };
    }
    if (!input.videoUrl && !input.videoPath) {
      return {
        platformVideoId: randomUUID4(),
        status: "failed",
        error: "Either videoUrl or videoPath is required to publish to TikTok."
      };
    }
    try {
      const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          post_info: {
            title: input.title,
            privacy_level: input.privacyStatus === "private" ? "SELF_ONLY" : "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1e3
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: input.videoUrl
          }
        })
      });
      if (!initResponse.ok) {
        const errText = await initResponse.text();
        return {
          platformVideoId: randomUUID4(),
          status: "failed",
          error: `TikTok Post Init failed (${initResponse.status}): ${errText}`
        };
      }
      const data = await initResponse.json();
      if (data.error?.message) {
        return {
          platformVideoId: randomUUID4(),
          status: "failed",
          error: `TikTok API Error: ${data.error.message}`
        };
      }
      const publishId = data.data?.publish_id || randomUUID4();
      return {
        platformVideoId: publishId,
        platformVideoUrl: `https://www.tiktok.com/@user/video/${publishId}`,
        status: "completed",
        publishedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platformVideoId: randomUUID4(),
        status: "failed",
        error: `TikTok Publisher Error: ${message}`
      };
    }
  }
};

// ../../scratch/live-campaign-execution.ts
async function runLiveCampaign() {
  console.log("====================================================================");
  console.log("\u{1F419} OCTOPUS OS - LIVE REAL CAMPAIGN EXECUTION TEST (\u0628\u062F\u0648\u0646 \u0645\u062D\u0627\u0643\u0627\u0629)");
  console.log("====================================================================");
  console.log("\n[\u{1F50D} 0] Checking Loaded Environment Credentials:");
  console.log(" - ELEVENLABS_API_KEY: ", process.env.ELEVENLABS_API_KEY ? `\u2705 Armed (${process.env.ELEVENLABS_API_KEY.slice(0, 10)}...)` : "\u274C Missing");
  console.log(" - HEYGEN_API_KEY:     ", process.env.HEYGEN_API_KEY ? `\u2705 Armed (${process.env.HEYGEN_API_KEY.slice(0, 10)}...)` : "\u274C Missing");
  console.log(" - YOUTUBE_CLIENT_ID:  ", process.env.YOUTUBE_CLIENT_ID ? `\u2705 Armed (${process.env.YOUTUBE_CLIENT_ID.slice(0, 15)}...)` : "\u274C Missing");
  console.log(" - TIKTOK_CLIENT_KEY:  ", process.env.TIKTOK_CLIENT_KEY ? `\u2705 Armed (${process.env.TIKTOK_CLIENT_KEY.slice(0, 8)}...)` : "\u274C Missing");
  const ttsService = new TTSService();
  const videoService = new VideoService();
  const tiktokPublisher = new TikTokPublisher();
  const youtubePublisher = new YouTubePublisher();
  const script = "\u0627\u0643\u062A\u0634\u0641 \u0623\u062D\u062F\u062B \u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0645\u0639 \u0646\u0638\u0627\u0645 OCTOPUS OS \u0627\u0644\u062D\u0635\u0631\u064A \u0644\u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u062A\u0633\u0648\u064A\u0642 \u0648\u0627\u0644\u0631\u0628\u062D \u0645\u0646 \u0627\u0644\u0623\u0641\u0644\u064A\u064A\u062A \u062F\u0648\u0646 \u062A\u062F\u062E\u0644 \u0628\u0634\u0631\u064A! \u0627\u0646\u0636\u0645 \u0627\u0644\u0622\u0646.";
  console.log("\n--------------------------------------------------------------------");
  console.log("\u{1F4DD} [Step 1] Campaign Script Ready:");
  console.log(` "${script}"`);
  console.log("--------------------------------------------------------------------");
  console.log("\n\u{1F399}\uFE0F [Step 2] Executing Real ElevenLabs TTS API Call...");
  const ttsResult = await ttsService.generateVoiceover({
    script,
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    // Rachel / Multilingual
    modelId: "eleven_multilingual_v2"
  });
  if (ttsResult.status === "completed") {
    console.log(` \u2705 ElevenLabs Audio Generated Successfully! Audio ID: ${ttsResult.audioId}`);
    console.log(` \u{1F4BE} Base64 Audio Length: ${ttsResult.audioBufferBase64?.length ?? 0} bytes`);
  } else {
    console.log(` \u26A0\uFE0F ElevenLabs Response: Status=${ttsResult.status}, Error: ${ttsResult.error}`);
  }
  console.log("\n\u{1F3AC} [Step 3] Executing Real HeyGen Video Generation API Call...");
  const videoResult = await videoService.renderVideo({
    script,
    aspectRatio: "9:16",
    title: "OCTOPUS AI Live Campaign Test"
  });
  if (videoResult.status === "processing" || videoResult.status === "completed") {
    console.log(` \u2705 HeyGen Video Generation Initiated Successfully! Video ID: ${videoResult.videoId}`);
    console.log(` \u23F3 Status: ${videoResult.status} (Video generation is processing asynchronously on HeyGen servers)`);
  } else {
    console.log(` \u26A0\uFE0F HeyGen Response: Status=${videoResult.status}, Error: ${videoResult.error}`);
  }
  console.log("\n\u{1F3B5} [Step 4] Executing Real TikTok Publishing Init API Call...");
  const tiktokResult = await tiktokPublisher.publish({
    title: "OCTOPUS AI Live Campaign Test #AI #Affiliate",
    videoUrl: "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.mp4"
    // sample mp4 URL for init test
  });
  console.log(` \u{1F4E1} TikTok Publisher Response: Status=${tiktokResult.status}, Error/ID=${tiktokResult.error || tiktokResult.platformPostId || "N/A"}`);
  console.log("\n\u{1F4FA} [Step 5] Executing Real YouTube Shorts Publishing API Call...");
  const youtubeResult = await youtubePublisher.publish({
    title: "OCTOPUS AI Live Campaign Test #Shorts",
    description: "Automated affiliate marketing campaign powered by OCTOPUS OS.",
    videoUrl: "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.mp4"
  });
  console.log(` \u{1F4E1} YouTube Publisher Response: Status=${youtubeResult.status}, Error/ID=${youtubeResult.error || youtubeResult.platformPostId || "N/A"}`);
  console.log("\n====================================================================");
  console.log("\u{1F3C1} Live Campaign Execution Check Complete!");
  console.log("====================================================================");
}
runLiveCampaign().catch(console.error);
