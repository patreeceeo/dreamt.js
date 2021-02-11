import { Logger } from "sitka";

const nullLogger = {
  debug(){},
  error(){},
  info(){},
  fatal(){},
  setContext(){},
  trace(){},
  warn(){},
}

/** TODO remove log calls from production build */
export default process.env.NODE_ENV === "production" ? nullLogger : Logger.getLogger({name: "Dreamt", format: '[${LEVEL}] [${NAME}] ${MESSAGE}'});

