import {World} from 'ecsy';
// import * as MobX from 'mobx';

interface NetworkSocketConfig {
  path: string;
  params: {
    [key: string]: any;
  };
}

interface DataSelectorsConfig {
  [key: string]: () => any;
}

interface ExecuteConfig {
  webSockets?: NetworkSocketConfig;
  observables?: DataSelectorsConfig;
}

 /**
 * @example
 *
 * Dreamt.execute(Minigolf, {
 *   webSocket: {
 *     path: "/socket",
 *     params: {
 *       playerId: () => localStorage.getItem("playerId")
 *     },
 *     topic: "sportballs"
 *   },
 *   observables: {
 *     yourTurn: selectYourTurn,
 *     error: selectError
 *   }
 * });
 */
export default function execute(world: World, options: ExecuteConfig = {}) {
  void options;
  let startTime = performance.now();
  let lastNow = startTime;
  requestAnimationFrame(run)
  function run(now: number) {
    world.execute(now - lastNow, now - startTime);
    lastNow = now;
    requestAnimationFrame(run)
  }
}
