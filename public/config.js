/* Plazma Proxy Configuration */
let _CONFIG = {
  prefix: "/scram/",
  codec: scramjet.codecs.base64, // Enables Base64 gibberish URLs
  config: "/config.js",
  bundle: "/scramjet.bundle.js",
  worker: "/scramjet.worker.js",
  handler: "/scramjet.handler.js",
};
